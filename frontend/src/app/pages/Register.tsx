import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { registerUser, signInWithGoogle } from "../../lib/auth";
import { z } from "zod";

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Validate inputs
            registerSchema.parse({ name, email, password, confirmPassword });

            // Register user
            await registerUser(email, password, name);

            // Navigate to dashboard
            navigate("/dashboard");
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak. Use at least 8 characters");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email address");
            } else {
                setError("An error occurred. Please try again");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);

        try {
            await signInWithGoogle();
            navigate("/dashboard");
        } catch (err: any) {
            if (err.code === "auth/popup-closed-by-user") {
                setError("Sign-in cancelled");
            } else if (err.code === "auth/cancelled-popup-request") {
                // User closed popup, ignore
            } else {
                setError("Google sign-in failed. Please try again");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Logo/Brand */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl mb-4">Void AI</h1>
                    <p className="text-neutral-600">Create your account</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex items-center gap-2 p-4 border border-red-500 text-red-700 bg-red-50"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </motion.div>
                    )}

                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                                required
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            At least 8 characters
                        </p>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white hover:bg-neutral-800 py-3 text-lg group"
                    >
                        {loading ? (
                            <span>Creating account...</span>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-neutral-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign-In Button */}
                    <Button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-black text-black hover:bg-neutral-100 py-3 text-lg"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {loading ? "Creating account..." : "Sign up with Google"}
                    </Button>

                    {/* Terms */}
                    <p className="text-xs text-neutral-500 text-center mt-4">
                        By creating an account, you agree to our Terms of Service and Privacy
                        Policy
                    </p>
                </form>

                {/* Login Link */}
                <p className="text-center mt-8 text-neutral-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-black hover:underline">
                        Sign in
                    </Link>
                </p>

                {/* Back to Home */}
                <p className="text-center mt-4">
                    <Link to="/" className="text-sm text-neutral-600 hover:text-black transition-colors">
                        ← Back to home
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
