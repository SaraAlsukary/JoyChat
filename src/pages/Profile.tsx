import { useState, useEffect } from "react";
import { useSession } from "../context/SessionProvider";
import Loading from "../components/Loading";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type UserState = {
    id: string;
    username: string;
    email: string;
    bio: string;
};

const DEFAULT_BIO = "There is no bio";

const Profile = () => {
    const { profile, loading } = useSession();
    const navigate = useNavigate();

    const [load, setLoad] = useState(false);
    const [open, setOpen] = useState(false);

    const [user, setUser] = useState<UserState | null>(null);
    const [avatar, setAvatar] = useState<string>("");

    const [form, setForm] = useState({
        username: "",
        bio: "",
        email: "",
    });

    /* ===========================
       SYNC PROFILE → STATE
    ============================ */
    useEffect(() => {
        if (!profile) return;
        const avatarUrl =
            profile.avatar_url ??
            `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username!}`;

        setUser({
            id: profile.id,
            username: profile.username!,
            email: profile.email!,
            bio: profile.bio ?? DEFAULT_BIO,
        });

        setAvatar(avatarUrl);

        setForm({
            username: profile.username!,
            bio: profile.bio ?? "",
            email: profile.email!,
        });
    }, [profile]);

    /* ===========================
       UPDATE USERNAME / BIO / EMAIL
    ============================ */
    const handleSave = async () => {
        if (!user || !profile) return;

        const toastId = toast.loading("Updating profile...");
        setLoad(true);

        const previousUser = { ...user };

        // Optimistic UI
        setUser({
            ...user,
            username: form.username,
            bio: form.bio,
            email: form.email,
        });

        try {
            // 1️⃣ Update profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    username: form.username,
                    bio: form.bio,
                })
                .eq("id", profile.id);

            if (profileError) throw profileError;

            // 2️⃣ Update auth email (if changed)
            if (form.email !== previousUser.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: form.email,
                });

                if (emailError) throw emailError;
            }

            toast.update(toastId, {
                render: "Profile updated successfully ✅",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            setOpen(false);
        } catch (err) {
            setUser(previousUser);

            const message =
                err instanceof Error ? err.message : "Update failed ❌";

            toast.update(toastId, {
                render: message,
                type: "error",
                isLoading: false,
                autoClose: 4000,
            });
        } finally {
            setLoad(false);
        }
    };
    // useEffect(() => {
    //     refreshProfile();
    // }, [])
    /* ===========================
       UPLOAD AVATAR
    ============================ */
    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        const previousAvatar = avatar;
        const previewUrl = URL.createObjectURL(file);
        setAvatar(previewUrl);

        const toastId = toast.loading("Uploading image...");
        setLoad(true);

        try {
            const fileExt = file.name.split(".").pop();
            const filePath = `${profile.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: "3600",
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            const avatarUrl = data.publicUrl;

            const { error: dbError } = await supabase
                .from("profiles")
                .update({ avatar_url: avatarUrl })
                .eq("id", profile.id);

            if (dbError) throw dbError;

            setAvatar(avatarUrl);

            toast.update(toastId, {
                render: "Profile image updated ✅",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (err) {
            setAvatar(previousAvatar);

            const message =
                err instanceof Error ? err.message : "Image upload failed ❌";

            toast.update(toastId, {
                render: message,
                type: "error",
                isLoading: false,
                autoClose: 4000,
            });
        } finally {
            setLoad(false);
        }
    };

    /* ===========================
       LOGOUT
    ============================ */
    const logoutHandler = async () => {
        const toastId = toast.loading("Signing out...");
        setLoad(true);

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            toast.update(toastId, {
                render: "Signed out successfully ✅",
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });

            navigate("/");
        } catch (err) {
            toast.update(toastId, {
                render: "Logout failed ❌",
                type: "error",
                isLoading: false,
            });
        } finally {
            setLoad(false);
        }
    };

    if (loading || !user) return <Loading />;

    return (
        <div className="profile">
            <div className="profile-container">
                {/* LEFT */}
                <div className="profile-left">
                    <button className="back-arrow" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <img src={avatar} alt="avatar" />
                    <label htmlFor="avatarUpload" className="change-photo">
                        Change Photo
                    </label>
                    <input
                        type="file"
                        id="avatarUpload"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={load}
                    />
                </div>

                {/* RIGHT */}
                <div className="profile-right">
                    <h2>{user.username}</h2>
                    <span>@{user.username}</span>

                    <div className="info">
                        <label>Email</label>
                        <p>{user.email}</p>
                    </div>

                    <div className="info">
                        <label>Bio</label>
                        <p>{user.bio}</p>
                    </div>

                    <div className="actions">
                        <button onClick={() => setOpen(true)} disabled={load}>
                            Edit Profile
                        </button>
                        <button
                            className="logout"
                            onClick={logoutHandler}
                            disabled={load}
                        >
                            {load ? "Loading..." : "Logout"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== EDIT MODAL ===== */}
            {open && (
                <div className="profile-modal">
                    <div className="modal-content">
                        <h3>Edit Profile</h3>

                        <input
                            type="text"
                            placeholder="Username"
                            value={form.username}
                            onChange={(e) =>
                                setForm({ ...form, username: e.target.value })
                            }
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />

                        <textarea
                            placeholder="Bio"
                            rows={4}
                            value={form.bio}
                            onChange={(e) =>
                                setForm({ ...form, bio: e.target.value })
                            }
                        />

                        <div className="modal-actions">
                            <button onClick={handleSave} disabled={load}>
                                {load ? "Saving..." : "Save"}
                            </button>
                            <button
                                className="cancel"
                                disabled={load}
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
