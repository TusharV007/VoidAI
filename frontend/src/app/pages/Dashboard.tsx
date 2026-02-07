import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, User, Sparkles, BarChart3, Settings, HelpCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../components/auth/AuthProvider";
import { logoutUser } from "../../lib/auth";

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logoutUser();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-black">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl">Void AI</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-neutral-600">Welcome back,</p>
                            <p className="font-medium">{user?.displayName || user?.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            disabled={loading}
                            className="border-black hover:bg-black hover:text-white"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {loading ? "Logging out..." : "Logout"}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-8 h-8" />
                        <h2 className="text-4xl">Dashboard</h2>
                    </div>
                    <p className="text-xl text-neutral-600">
                        Your AI-powered machine learning workspace
                    </p>
                </motion.div>

                {/* Coming Soon Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="border-4 border-black p-12 mb-12 text-center"
                >
                    <h3 className="text-3xl mb-4">Platform Coming Soon</h3>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                        We're building an amazing no-code ML platform. You'll be among the first
                        to access it when we launch!
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="border border-black p-8 hover:bg-black hover:text-white transition-colors group"
                    >
                        <BarChart3 className="w-12 h-12 mb-4" />
                        <h3 className="text-xl mb-2">Analytics</h3>
                        <p className="text-neutral-600 group-hover:text-neutral-300">
                            Track your model performance and insights
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="border border-black p-8 hover:bg-black hover:text-white transition-colors group"
                    >
                        <Settings className="w-12 h-12 mb-4" />
                        <h3 className="text-xl mb-2">Settings</h3>
                        <p className="text-neutral-600 group-hover:text-neutral-300">
                            Customize your workspace and preferences
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="border border-black p-8 hover:bg-black hover:text-white transition-colors group"
                    >
                        <HelpCircle className="w-12 h-12 mb-4" />
                        <h3 className="text-xl mb-2">Support</h3>
                        <p className="text-neutral-600 group-hover:text-neutral-300">
                            Get help and access documentation
                        </p>
                    </motion.div>
                </div>

                {/* User Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-12 border border-neutral-300 p-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl mb-1">Profile Information</h3>
                            <p className="text-neutral-600">Manage your account details</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-neutral-600">Name</p>
                            <p className="text-lg">{user?.displayName || "Not set"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Email</p>
                            <p className="text-lg">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Status</p>
                            <p className="text-lg">
                                {user?.emailVerified ? (
                                    <span className="text-green-600">✓ Verified</span>
                                ) : (
                                    <span className="text-yellow-600">⚠ Not verified</span>
                                )}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
