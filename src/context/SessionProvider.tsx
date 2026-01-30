import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";

type TProfile = {
    id: string;
    email: string | null;
    bio: string,
    username: string;
    avatar_url: string | null;
};

type AuthContextType = {
    user: User | null;
    profile: TProfile | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<TProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const authUser = session?.user ?? null;
            setUser(authUser);


            if (!authUser) {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const syncProfile = async () => {
          
            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (existingProfile) {
                setProfile(existingProfile as TProfile);
                return;
            }

            const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    email: user.email,
                    username:
                        user.user_metadata.username ??
                        user.email?.split("@")[0],
                    avatar_url: null,
                    bio: "",
                })
                .select()
                .single();

            if (insertError) {
                console.error(insertError);
                return;
            }

            setProfile(newProfile as TProfile);
        };

        syncProfile();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useSession = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within SessionProvider");
    }
    return ctx;
};
