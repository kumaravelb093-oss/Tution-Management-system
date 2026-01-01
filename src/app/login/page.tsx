"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#4285F4] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <GraduationCap size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-[#202124]">Welcome Back</h1>
                    <p className="text-[#5F6368] mt-1">Sign in to your account</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg border border-[#DADCE0] p-8 shadow-sm">
                    {error && (
                        <div className="mb-6 p-4 bg-[#FCE8E6] text-[#D93025] border border-[#F5C6CB] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-[14px] font-medium text-[#202124] mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 text-[#202124] bg-white border border-[#DADCE0] rounded-lg focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#E8F0FE] placeholder-[#9AA0A6]"
                                    placeholder="admin@diamond.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[14px] font-medium text-[#202124] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-[#DADCE0] rounded-lg focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#E8F0FE] transition-all text-[#202124]"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-[#A8C7FA] disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-[12px] text-[#5F6368]">
                    Diamond Tuitions © 2024 • Secure Access
                </p>
            </div>
        </div>
    );
}
