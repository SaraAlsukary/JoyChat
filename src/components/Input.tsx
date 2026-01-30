import { useState } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useChat } from "../context/ChatProvider";
import { useSession } from "../context/SessionProvider";

const Input = () => {
    const { selectedUser } = useChat();
    const { profile } = useSession();
    const currentUserId = profile?.id;

    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!currentUserId || !selectedUser || (!text && !file)) return;
        setLoading(true);

        let conversationId: string | null = null;

        const { data: currentUserConvs } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", currentUserId);

        const { data: selectedUserConvs } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", selectedUser.id);

        const convIds = currentUserConvs
            ?.map(c => c.conversation_id)
            .filter(id => selectedUserConvs?.some(s => s.conversation_id === id));

        if (convIds && convIds.length > 0) conversationId = convIds[0];
        else {
            const { data: newConv } = await supabase
                .from("conversations")
                .insert({ type: "private" })
                .select()
                .maybeSingle();
            if (!newConv) return;
            conversationId = newConv.id;

            await supabase.from("conversation_members").insert([
                { conversation_id: conversationId, user_id: currentUserId },
                { conversation_id: conversationId, user_id: selectedUser.id }
            ]);
        }

        let attachment_url = null;
        let attachment_name = null;
        let attachment_type: "image" | "file" | null = null;

        if (file) {
            const fileName = `${currentUserId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("attachments")
                .upload(fileName, file, { upsert: true });

            if (!uploadError) {
                attachment_url = supabase.storage.from("attachments").getPublicUrl(fileName).data.publicUrl;
                attachment_name = file.name;
                attachment_type = file.type.startsWith("image") ? "image" : "file";
            }
        }

        await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: text || null,
            attachment_url,
            attachment_name,
            attachment_type
        });

        setText("");
        setFile(null);
        setLoading(false);
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    return (
        <div className="input">
            <div className="input-content">
                {file && (
                    <div className="file-preview">
                        {file.type.startsWith("image") ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} className="preview-img" />
                        ) : <span>{file.name}</span>}
                        <button type="button" className="remove-file" onClick={() => setFile(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input type="text" placeholder="Type something..." value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="send">
                <input type="file" name="file" id="file" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
                <label htmlFor="file">
                    <Paperclip />
                    <ImagePlus />
                </label>
                <button onClick={handleSend} disabled={loading}>{loading ? "Sending..." : "Send"}</button>
            </div>
        </div>
    );
};

export default Input;
