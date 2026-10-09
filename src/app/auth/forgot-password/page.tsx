"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Send, KeyRound, MessageCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [step, setStep] = useState<"request" | "verify">("request");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const { t } = useLanguage();
    const router = useRouter();

    useEffect(() => {
        // Fetch public school settings for whatsapp number
        fetch("/api/settings/public")
            .then(res => res.json())
            .then(data => {
                if (data.whatsappNumber) setWhatsapp(data.whatsappNumber);
            })
            .catch(err => console.error("Error fetching settings:", err));
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setStep("verify");
            } else {
                setStatus("error");
                setMessage(data.error || t.signin_page.forgot_password_page.error_msg);
            }
        } catch (error) {
            setStatus("error");
            setMessage(t.signin_page.forgot_password_page.error_msg);
        }
    };

    const handleVerifyToken = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        // Redirect to actual reset page with token
        router.push(`/auth/reset-password?token=${token}`);
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
                <div className="mb-8 text-center text-white">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
                        {step === "request" ? <Mail size={32} /> : <KeyRound size={32} />}
                    </div>
                    <h2 className="text-3xl font-black leading-tight">
                        {t.signin_page.forgot_password_page.title}
                    </h2>
                    <p className="mt-2 text-indigo-100/60 text-sm font-medium">
                        {t.signin_page.forgot_password_page.subtitle}
                    </p>
                </div>

                {step === "request" ? (
                    <form onSubmit={handleRequestReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                {t.signin_page.email}
                            </label>
                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-4 pl-12 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                                    placeholder={t.signin_page.forgot_password_page.email_placeholder}
                                    required
                                    dir="ltr"
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
                            disabled={status === "loading"}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-base font-black text-white shadow-lg transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                        >
                            {status === "loading" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {t.signin_page.forgot_password_page.submit}
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-5 text-indigo-100">
                            <p className="text-sm font-bold mb-4 leading-relaxed tracking-tight">
                                {t.signin_page.forgot_password_page.success_msg}
                            </p>

                            {whatsapp && (
                                <a
                                    href={`https://wa.me/${whatsapp.replace(/\+/g, '')}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 mb-4"
                                >
                                    <MessageCircle size={24} />
                                    <span>{whatsapp}</span>
                                </a>
                            )}
                        </div>

                        <form onSubmit={handleVerifyToken} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                    {t.signin_page.forgot_password_page.token_placeholder}
                                </label>
                                <div className="group relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" size={18} />
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-black/20 p-4 pl-12 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/30 outline-none font-mono"
                                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                                        required
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-black text-white shadow-lg transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t.signin_page.forgot_password_page.submit_token}
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                )}

                <div className="mt-8 text-center pt-2">
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} />
                        {t.signin_page.forgot_password_page.back_to_signin}
                    </Link>
                </div>
            </div>
        </div>
    );
}
