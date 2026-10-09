"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

function SignInContent() {
    const { data: session, status } = useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        }
        const errorParam = searchParams.get("error");
        if (errorParam === "CredentialsSignin") {
            setError(t.signin_page.login_failed);
        }
    }, [searchParams, t, status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError(t.signin_page.login_failed);
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-indigo-950 px-4 font-sans overflow-hidden">
            {/* Cartoon Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay scale-105"
                style={{ backgroundImage: "url('/bg-signin.png')" }}
            ></div>

            {/* Vibrant Abstract Elements */}
            <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-[800px] flex flex-col md:flex-row overflow-hidden rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">

                {/* Left Side: Dynamic Info Section */}
                <div className="hidden md:flex flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600/40 to-blue-600/20 p-8 text-white">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 font-bold hover:text-white transition-all transform hover:-translate-x-1 text-sm">
                            <ArrowLeft size={16} />
                            {t.home}
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                            <ShieldCheck size={28} className="text-blue-400" />
                        </div>
                        <h2 className="text-3xl font-black leading-[1.1] tracking-tight">
                            {t.signin_page.title}
                        </h2>
                        <p className="text-indigo-100/70 text-base leading-relaxed font-medium max-w-[280px]">
                            {t.signin_page.subtitle}
                        </p>
                    </div>
                    <div className="mt-8 flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            System Live & Encrypted
                        </p>
                    </div>
                </div>

                {/* Right Side: Form Section */}
                <div className="flex-1 bg-white/5 p-6 md:p-10 backdrop-blur-3xl">
                    <div className="mb-6 text-center md:hidden">
                        <h2 className="text-2xl font-black text-white">{t.signin_page.title}</h2>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/20 p-3 text-xs font-bold text-red-200 border border-red-500/30">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                {t.signin_page.email}
                            </label>
                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pl-11 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                                    placeholder="you@school.com"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    {t.signin_page.password}
                                </label>
                                <Link href="/auth/forgot-password" className="text-[9px] font-black uppercase tracking-tighter text-indigo-400 hover:text-white transition-colors">
                                    {t.signin_page.forgot_password}
                                </Link>
                            </div>
                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pl-11 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                                    placeholder="••••••••"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-black text-white shadow-lg transition-all hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    {t.signin_page.submit}
                                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between gap-3">
                        <div className="h-px w-full bg-white/10"></div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap">OR</span>
                        <div className="h-px w-full bg-white/10"></div>
                    </div>

                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-white/20 py-3 text-sm font-bold text-gray-900 shadow-md transition-all hover:bg-gray-100"
                    >
                        <svg viewBox="0 0 48 48" className="h-5 w-5">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083A19.694 19.694 0 0 1 44 24c0 1.341-.138 2.65-.389 3.917l-6.22-5.187c.224-.871.409-1.57.484-2.73H24v-8h18.111c.21.36.294.622.5.917l.5.917c.5.917.5.917.5.917z" />
                        </svg>
                        {t.signin_page.signin_google}
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-bold text-white/40">
                            {t.signin_page.no_account}
                            <Link href="/register" className="ml-2 text-indigo-400 hover:text-white hover:underline transition-colors">
                                {t.signin_page.register}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white">Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
