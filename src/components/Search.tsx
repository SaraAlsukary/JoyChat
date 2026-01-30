import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useSession } from "../context/SessionProvider";
import { useChat } from "../context/ChatProvider";

type User = {
    id: string;
    username: string;
    bio: string;
    avatar_url: string | null;
};

const Search = () => {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useSession()
    const { setSelectedUser } = useChat();
    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
    };
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        if (!value) {
            setUsers([]);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", profile?.id)
            .ilike("username", `%${value}%`) // البحث غير حساس لحالة الحروف
            .limit(10);

        if (error) {
            console.error(error.message);
            setUsers([]);
        } else {
            setUsers((data as User[]) || []);
        }
        setLoading(false);
    };

    return (
        <div className="search">
            <div className="search-form">
                <input
                    type="text"
                    placeholder="Find A User"
                    value={query}
                    onChange={handleSearch}
                />
            </div>

            {loading && <div style={{ padding: " 2px 20px", color: '#fff' }}> loading...</div>}

            <div className="user-list">
                {users.map((user) => (
                    <div key={user.id} className="user-chat" onClick={() => handleSelectUser(user)}>
                        <img
                            src={
                                user.avatar_url ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&background=random`
                            }
                            alt={user.username}
                        />
                        <div className="user-chat-info">
                            <span>{user.username}</span>
                        </div>
                    </div>
                ))}
                {users.length === 0 && query && !loading && <p>No users found</p>}
            </div>
        </div>
    );
};

export default Search;
