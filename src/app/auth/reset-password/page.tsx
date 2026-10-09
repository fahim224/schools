"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";

function ResetPasswordContent() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage(t.signin_page.reset_password_page.error_invalid_token);
        }
    }, [token, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage(t.signin_page.reset_password_page.password_mismatch);
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(t.signin_page.reset_password_page.success_msg);
                setTimeout(() => {
                    router.push("/auth/signin");
                }, 3000);
            } else {
                setStatus("error");
                setMessage(data.error || t.signin_page.reset_password_page.error_invalid_token);
            }
        } catch (error) {
            setStatus("error");
            setMessage(t.signin_page.reset_password_page.error_invalid_token);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-indigo-950 px-4 font-sans overflow-hidden">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay scale-105"
                style={{ backgroundImage: "url('/bg-signin.png')" }}
            ></div>
            <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-[450px] overflow-hidden rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-8 md:p-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
                        <KeyRound className="text-indigo-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight">
                        {t.signin_page.reset_password_page.title}
                    </h2>
                    <p className="mt-2 text-indigo-100/60 text-sm font-medium">
                        {t.signin_page.reset_password_page.subtitle}
                    </p>
                </div>

                {status === "success" ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/20 p-4 text-sm font-bold text-emerald-200 border border-emerald-500/30">
                            <CheckCircle2 size={24} className="flex-shrink-0" />
                            {message}
                        </div>
                        <p className="text-center text-indigo-200/50 text-xs">
                            Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                {t.signin_page.reset_password_page.new_password}
                            </label>
                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-4 pl-12 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                                    placeholder="••••••••"
                                    required
                                    min={8}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                {t.signin_page.reset_password_page.confirm_password}
                            </label>
                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-4 pl-12 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {status === "error" && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-500/20 p-3 text-xs font-bold text-red-200 border border-red-500/30">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading" || !token}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-base font-black text-white shadow-lg transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4"
                        >
                            {status === "loading" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {t.signin_page.reset_password_page.submit}
                                    <KeyRound size={18} className="group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={14} />
                                {t.signin_page.forgot_password_page.back_to_signin}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
