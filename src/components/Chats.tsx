import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useChat } from "../context/ChatProvider";
import { useSession } from "../context/SessionProvider";


type Message = {
    id: string;
    content: string | null;
    created_at: string;
    sender_id: string;
    attachment_type?: string | null;
    read_at?: string | null;
    deleted_at?: string | null;
    conversation_id: string;
};

type ChatItem = {
    conversation_id: string;
    last_message: Message | null;
    unreadCount: number;
    user: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
};



const Chats = () => {
    const { profile } = useSession();
    const { setSelectedUser } = useChat();

    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);


    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const isUnread = (msg: Message | null) =>
        msg && msg.sender_id !== profile?.id && !msg.read_at;

    const getLastMessagePreview = (msg: Message | null) => {
        if (!msg) return "No messages yet";
        const prefix = msg.sender_id === profile?.id ? "You: " : "";
        if (msg.content) return prefix + msg.content;
        if (msg.attachment_type === "image") return prefix + "📷 Photo";
        if (msg.attachment_type === "file") return prefix + "📎 File";
        return prefix + "New message";
    };
    const fetchLastMessage = async (conversationId: string): Promise<Message | null> => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        return data ?? null;
    };


    const getChats = async () => {
        if (!profile?.id) return;

        setLoading(true);

        const { data, error } = await supabase
            .from("conversation_members")
            .select(`
        conversation:conversations (
          id,
          last_message:messages!conversations_last_message_id_fkey (
            id,
            content,
            created_at,
            sender_id,
            attachment_type,
            read_at,
            deleted_at,
            conversation_id
          ),
          participants:conversation_members (
            user_id,
            profile:profiles (
              id,
              username,
              avatar_url
            )
          )
        )
      `)
            .eq("user_id", profile.id);

        if (error) {
            console.error(error.message);
            setLoading(false);
            return;
        }

        const result: ChatItem[] = await Promise.all(
            data.map(async (row: any) => {
                const conv = row.conversation;
                const otherUser = conv.participants.find(
                    (p: any) => p.user_id !== profile.id
                )?.profile;

                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("conversation_id", conv.id)
                    .neq("sender_id", profile.id)
                    .is("read_at", null)
                    .is("deleted_at", null);

                return {
                    conversation_id: conv.id,
                    last_message: conv.last_message?.deleted_at
                        ? null
                        : conv.last_message,
                    unreadCount: count || 0,
                    user: otherUser,
                };
            })
        );

        setChats(
            result
                .filter(c => c.user)
                .sort((a, b) => {
                    const aTime = a.last_message?.created_at || "";
                    const bTime = b.last_message?.created_at || "";
                    return new Date(bTime).getTime() - new Date(aTime).getTime();
                })
        );

        setLoading(false);
    };



    const markConversationAsRead = async (conversationId: string) => {
        if (!profile?.id) return;

        await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", profile.id)
            .is("read_at", null)
            .is("deleted_at", null);

        setChats(prev =>
            prev.map(chat =>
                chat.conversation_id === conversationId
                    ? { ...chat, unreadCount: 0 }
                    : chat
            )
        );
    };

    useEffect(() => {
        if (!profile?.id) return;

        const channel = supabase
            .channel("realtime-chats")

            /* INSERT */
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                payload => {
                    const msg = payload.new as Message;
                    if (msg.deleted_at) return;

                    setChats(prev =>
                        prev.map(chat =>
                            chat.conversation_id === msg.conversation_id
                                ? {
                                    ...chat,
                                    last_message: msg,
                                    unreadCount:
                                        msg.sender_id !== profile.id
                                            ? chat.unreadCount + 1
                                            : chat.unreadCount,
                                }
                                : chat
                        )
                    );
                }
            )

            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                async payload => {
                    const msg = payload.new as Message;

                    /* READ */
                    if (msg.read_at) {
                        setChats(prev =>
                            prev.map(chat =>
                                chat.conversation_id === msg.conversation_id
                                    ? { ...chat, unreadCount: 0 }
                                    : chat
                            )
                        );
                        return;
                    }

                    /* DELETE (soft) */
                    if (msg.deleted_at) {
                        const lastMsg = await fetchLastMessage(msg.conversation_id);

                        setChats(prev =>
                            prev.map(chat =>
                                chat.conversation_id === msg.conversation_id
                                    ? { ...chat, last_message: lastMsg }
                                    : chat
                            )
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);


    useEffect(() => {
        getChats();
    }, [profile?.id]);

 

    if (loading)
        return (
            <div className="chats" style={{ padding: 12, color: "#fff" }}>
                Loading chats...
            </div>
        );
    return (
        <div className="chats">
            {chats.map(chat => {
                const unread = isUnread(chat.last_message);

                return (
                    <div
                        key={chat.conversation_id}
                        className="user-chat"
                        onClick={() => {
                            setSelectedUser(chat.user);
                            markConversationAsRead(chat.conversation_id);
                        }}
                    >
                        <div className="user-content">
                            <img
                                src={
                                    chat.user.avatar_url ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${chat.user.username}`
                                }
                                alt="user"
                            />
                            <div className="user-chat-info">
                                <div className="top">
                                    <span>{chat.user.username}</span>
                                    {chat.last_message && (
                                        <small>{formatTime(chat.last_message.created_at)}</small>
                                    )}
                                </div>
                                <p className={unread ? "unread" : ""}>
                                    {getLastMessagePreview(chat.last_message)}
                                </p>
                            </div>
                        </div>

                        {chat.unreadCount > 0 && (
                            <span className="unreadCount">{chat.unreadCount}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Chats;
