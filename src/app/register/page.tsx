"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { UserPlus, User, Mail, Lock, Sparkles, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push("/auth/signin");
            } else {
                const data = await res.json();
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong");
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-orange-950 px-4 font-sans overflow-hidden">
            {/* Cartoon Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay scale-110"
                style={{ backgroundImage: "url('/bg-register.png')" }}
            ></div>

            {/* Vibrant "Happy" Abstract Elements */}
            <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-[800px] flex flex-col md:flex-row overflow-hidden rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">

                {/* Left Side: Info Section (Vibrant Orange/Amber) */}
                <div className="hidden md:flex flex-1 flex-col justify-between bg-gradient-to-br from-orange-600/40 to-amber-600/20 p-8 text-white">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-orange-200 font-bold hover:text-white transition-all transform hover:-translate-x-1 text-sm">
                            <ArrowLeft size={16} />
                            {t.home}
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                            <Sparkles size={28} className="text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-black leading-[1.1] tracking-tight">
                            {t.register_page.title}
                        </h2>
                        <p className="text-orange-100/70 text-base leading-relaxed font-medium max-w-[280px]">
                            {t.register_page.subtitle}
                        </p>
                    </div>
                    <div className="mt-8 flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-bounce"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            Start Your Educational Journey
                        </p>
                    </div>
                </div>

                {/* Right Side: Form Section */}
                <div className="flex-1 bg-white/5 p-6 md:p-10 backdrop-blur-3xl">
                    <div className="mb-6 text-center md:hidden">
                        <h2 className="text-2xl font-black text-white">{t.register_page.title}</h2>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-500/20 p-3 text-xs font-bold text-red-200 border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-orange-400 px-1">
                                {t.register_page.name}
                            </label>
                            <div className="group relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-orange-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pl-11 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-orange-500/30 outline-none"
                                    placeholder="Ahmad Ahmadi"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-orange-400 px-1">
                                {t.register_page.email}
                            </label>
                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-orange-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pl-11 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-orange-500/30 outline-none"
                                    placeholder="name@school.com"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-orange-400 px-1">
                                {t.register_page.password}
                            </label>
                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-orange-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pl-11 text-sm text-white transition-all focus:bg-black/40 focus:ring-4 focus:ring-orange-500/30 outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-base font-black text-white shadow-lg transition-all hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                            {t.register_page.submit}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-bold text-white/40">
                            {t.register_page.already_have_account}
                            <Link href="/auth/signin" className="ml-2 text-orange-400 hover:text-white hover:underline transition-colors">
                                {t.register_page.signin}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
