import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import type { AuthError } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);
    const [show, setShow] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        if (!email || !password) {
            setError({ message: "Email and password are required" } as AuthError);
            setLoading(false);
            return;
        }

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            console.log(data)
            if (signInError) throw signInError;

            const user = data.user;
            if (!user) throw new Error("User not returned from Supabase");
            navigate("/home", { replace: true });

        } catch (err) {
            console.error(err);
            setError(err as AuthError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-wrapper">
                <span className="logo">Joy Chat</span>
                <span className="title">Login</span>

                <form onSubmit={handleSubmit}>
                    <input type="email" name="email" placeholder="Email" />
                    <div className="input-control">
                        <input type={show ? "text" : "password"} name="password" placeholder="Password" />
                        <span className="eye" onClick={() => setShow(prev => !prev)}>
                            {!show ? <Eye size={20} color="#2f2d52" /> :
                                <EyeOff size={20} color="#2f2d52" />}
                        </span>
                    </div>
                    <button disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                    {error && <span className="error">{error.message}</span>}
                </form>

                <p>
                    You don't have an account?{" "}
                    <Link className="link" to="/register">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
