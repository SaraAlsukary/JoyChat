import { useState, type ChangeEvent } from "react";
import image from "../assets/imgs/addAvatar.png";
import { supabase } from "../supabaseClient";
import type { AuthError } from "@supabase/supabase-js";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [err, setError] = useState(false);
    const [errmsg, setErrorMessage] = useState<AuthError | null>(null);
    // const [imageFile, setFileImage] = useState<string | null>(null);
    const navigate = useNavigate();

    // const uploadFileHandler = (e: ChangeEvent<HTMLInputElement>) => {
    //     if (!e.target.files) return;
    //     setFileImage(URL.createObjectURL(e.target.files[0]));
    // };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        setErrorMessage(null);

        const formElement = e.target as HTMLFormElement;
        const name = (formElement.elements.namedItem("name") as HTMLInputElement).value;
        const email = (formElement.elements.namedItem("email") as HTMLInputElement).value;
        const password = (formElement.elements.namedItem("password") as HTMLInputElement).value;
        // const fileInput = formElement.elements.namedItem("file") as HTMLInputElement;
        // const file = fileInput.files?.[0];
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        username: name,
                    },
                },
            });
            if (error) throw error;

            const user = data.user;
            if (!user) throw new Error("User not returned from Supabase");

            // let avatarUrl: string | null = null;

            // if (file) {
            //     const safeFileName = `${user.id}_${file.name.replace(/\s/g, "_")}`;
            //     const { data: storageData, error: storageError } = await supabase.storage
            //         .from("avatars")
            //         .upload(safeFileName, file);

            //     if (storageError) throw storageError;

            //     avatarUrl = supabase.storage.from("avatars").getPublicUrl(safeFileName).data.publicUrl;
            // }

            formElement.reset();
            // setFileImage(null);
            console.log("User registered successfully!");

            navigate("/home", { replace: true });

        } catch (error) {
            console.error(error);
            setError(true);
            setErrorMessage(error as AuthError);
        } finally {
            setLoading(false);
        }

    };
    return (
        <div className="form-container">
            <div className="form-wrapper">
                <span className="logo">Joy Chat</span>
                <span className="title">Register</span>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="name" placeholder="Name" />
                    <input type="email" name="email" placeholder="Email" />
                    <div className="input-control">
                        <input type={show ? "text" : "password"} name="password" placeholder="Password" />
                        <span className="eye" onClick={() => setShow(prev => !prev)}>
                            {!show ? <Eye size={20} color="#2f2d52" /> :
                                <EyeOff size={20} color="#2f2d52" />}
                        </span>
                    </div>
                    {/* <input
                        style={{ display: "none" }}
                        type="file"
                        name="file"
                        id="file"
                        onChange={uploadFileHandler}
                    />
                    <label htmlFor="file">
                        <img src={imageFile ? imageFile : image} alt="" />
                        <span>Add an Avatar</span>
                    </label> */}

                    <button disabled={loading}>{loading ? "Loading..." : "Sign Up"}</button>
                    {err && <span>{errmsg ? errmsg.message : "Something went wrong"}</span>}
                </form>

                <p>
                    You do have an account? <Link className="link" to={"/"}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
