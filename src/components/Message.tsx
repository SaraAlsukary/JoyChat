import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useSession } from "../context/SessionProvider";
import { useChat } from "../context/ChatProvider";

interface MessageProps {
    message: any;
    prevMessage?: any;
}

const Message = ({ message, prevMessage }: MessageProps) => {
    const { profile } = useSession();
    const { selectedUser } = useChat();

    const isOwner = message.sender_id === profile?.id;

    const showAvatar =
        !prevMessage || prevMessage.sender_id !== message.sender_id;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);


    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });


    const handleDelete = async () => {
        setLoading(true);

        const { data: conv } = await supabase
            .from("conversations")
            .select("id, last_message_id")
            .eq("last_message_id", message.id)
            .maybeSingle();

        if (conv) {
            const { data: prev } = await supabase
                .from("messages")
                .select("id")
                .eq("conversation_id", message.conversation_id)
                .lt("created_at", message.created_at)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            await supabase
                .from("conversations")
                .update({
                    last_message_id: prev ? prev.id : null,
                })
                .eq("id", conv.id);
        }
        await supabase
            .from("messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", message.id);

        setLoading(false);
        setOpen(false);
    };


    return (
        <div className={`message ${isOwner ? "owner" : ""}`}>
            <div className="message-info">
                {showAvatar && (
                    <img
                        src={
                            isOwner
                                ? profile?.avatar_url ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username}`
                                : selectedUser?.avatar_url ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser?.username}`
                        }
                        alt="user"
                    />
                )}
            </div>

            <div
                className="message-content"
                style={
                    !showAvatar
                        ? isOwner
                            ? { marginRight: "40px" }
                            : { marginLeft: "40px" }
                        : {}
                }
            >
                {message.content && <p>{message.content}</p>}

                {message.attachment_url &&
                    message.attachment_type === "image" && (
                        <img
                            src={message.attachment_url}
                            alt={message.attachment_name}
                        />
                    )}

                {message.attachment_url &&
                    message.attachment_type === "file" && (
                        <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {message.attachment_name}
                        </a>
                    )}

                <span className="time">
                    {formatTime(message.created_at)}
                </span>
            </div>

            {isOwner && (
                <button
                    className="delete-btn"
                    onClick={() => setOpen(true)}
                >
                    <Trash2 size={16} />
                </button>
            )}

            {open && (
                <div className="dialog-backdrop">
                    <div className="dialog">
                        <h4>Delete message?</h4>
                        <p>This action cannot be undone.</p>

                        <div className="dialog-actions">
                            <button
                                className="cancel"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Message;
