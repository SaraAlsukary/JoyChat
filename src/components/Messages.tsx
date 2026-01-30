import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useChat } from "../context/ChatProvider";
import { useSession } from "../context/SessionProvider";
import Message from "./Message";

export type TMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string | null;
    attachment_url?: string | null;     
    attachment_type?: "image" | "file" | null;
    attachment_name?: string | null;
    created_at: string;
    deleted_at?: string | null;
    read_at?: string | null;
};

const Messages = () => {
    const { selectedUser } = useChat();
    const { profile } = useSession();

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<TMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getConversationId = async () => {
            if (!selectedUser || !profile) return;

            const { data: my } = await supabase
                .from("conversation_members")
                .select("conversation_id")
                .eq("user_id", profile.id);

            const { data: other } = await supabase
                .from("conversation_members")
                .select("conversation_id")
                .eq("user_id", selectedUser.id);

            const id = my?.map(m => m.conversation_id)
                .find(id => other?.some(o => o.conversation_id === id));

            setConversationId(id || null);
        };
        getConversationId();
    }, [selectedUser, profile]);

    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .is("deleted_at", null)
                .order("created_at", { ascending: true });

            setMessages(data || []);
            setLoading(false);
        };

        fetchMessages();
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase.channel(`messages-${conversationId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                payload => {
                    const msg = payload.new as TMessage;
                    if (!msg.deleted_at) setMessages(prev => [...prev, msg]);
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                payload => {
                    const msg = payload.new as TMessage;
                    if (msg.deleted_at) {
                        setMessages(prev => prev.filter(m => m.id !== msg.id));
                    } else {
                        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); 
        };
    }, [conversationId]);
    useEffect(() => {
        const scrollableDiv = document.querySelector(".messages");
        if (scrollableDiv) {
            scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="messages">
            {loading && <div>Loading...</div>}
            {messages.map(msg => (
                <div key={msg.id}>
                    <Message message={msg} />
                </div>
            ))}
        </div>
    );
};

export default Messages;
