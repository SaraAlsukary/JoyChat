import { createContext, useContext, useState, } from "react";

interface User {
    id: string;
    username: string;
    last_message?: string;
    bio?: string;
    last_seen?: string;
    is_online?: boolean;
    avatar_url?: string | null;
}

interface ChatContextType {
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    return (
        <ChatContext.Provider value={{ selectedUser, setSelectedUser }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};
