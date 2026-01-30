import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionProvider";

const Navbar = () => {
    const navigate = useNavigate()
    const { profile, loading: load } = useSession()
    const [userProfile, setUserProfile] = useState(profile)
    const [loading, setLoading] = useState(false)
    const logoutHnadler = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error signing out:", error.message);
            } else {
                console.log("User signed out successfully!");
                navigate('/')

            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    };
    useEffect(() => {
        if (profile)
            setUserProfile(profile)
    }, [profile])
    return (
        <div className="navbar">
            <span className="logo">Joy Chat</span>
            {!userProfile ? <div style={{ padding: " 2px 3px", color: '#fff' }}> loading...</div> : <div className="user">
                <img onClick={() => navigate('/profile')} src={userProfile?.avatar_url ? userProfile.avatar_url : `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.username}&background=random`} alt="userProfile" />
                <span>{userProfile?.username}</span>
                <button disabled={loading} onClick={logoutHnadler}>{loading ? "loading..." : "logout"}</button>
            </div>}
            
        </div>
    )
}

export default Navbar