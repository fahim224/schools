"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, Send, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import DashboardClock from "@/components/DashboardClock";

export default function SuperAdminMessagesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [content, setContent] = useState("");
    const [targetRole, setTargetRole] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN") {
            router.push("/");
        } else if (session) {
            fetchMessages();
        }
    }, [status, session, router]);

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (data && data.length > 0) {
                    setContent(data[0].content || "");
                    setTargetRole(data[0].targetRoles || "ALL");
                }
            }
        } catch (err) { console.error("Failed to fetch messages"); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, targetRoles: targetRole }),
            });

            if (res.ok) {
                setSuccess(true);
                setContent(""); // Clear after send
                fetchMessages(); // Refresh list
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError("ارسال پیام با مشکل مواجه شد");
            }
        } catch (err) {
            setError("خطایی رخ داده است");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return null;

    return (
        <div className={`p-4 md:p-8 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="mb-4 flex justify-end">
                <DashboardClock />
            </div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/superadmin" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                    <ArrowLeft size={20} className={`${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">ارسال اطلاعیه</h1>
                    <p className="text-slate-500 font-bold text-sm">ارسال پیام به اساتید، شاگردان و والدین.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
                    <div className="flex items-center justify-center mb-8">
                        <div className="h-16 w-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                            <MessageSquare size={32} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">مخاطبین</label>
                            <select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                            >
                                <option value="ALL">همه کاربران (عمومی)</option>
                                <option value="TEACHER">فقط اساتید</option>
                                <option value="STUDENT">فقط شاگردان</option>
                                <option value="PARENT">فقط والدین</option>
                                <option value="ADMIN">فقط مدیران</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">متن پیام</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={6}
                                placeholder="متن اطلاعیه مهم خود را اینجا بنویسید..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-4 text-base font-medium outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none"
                            ></textarea>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl">
                                <CheckCircle size={20} />
                                پیام با موفقیت ارسال شد!
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 rounded-[1.5rem] bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 text-lg font-black shadow-xl shadow-pink-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {loading ? "در حال ارسال..." : "انتشار اطلاعیه"}
                            {!loading && <Send size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tight px-2">تاریخچه پیام‌های ارسال شده</h2>
                    <div className="space-y-4">
                        {messages.length > 0 ? (
                            messages.map((msg) => (
                                <div key={msg.id} className="p-6 rounded-[2rem] bg-card border border-border hover:shadow-lg transition-all">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${msg.targetRoles === 'ALL' ? 'bg-blue-100 text-blue-600' :
                                                msg.targetRoles === 'TEACHER' ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {msg.targetRoles === 'ALL' ? 'عمومی' :
                                                msg.targetRoles === 'TEACHER' ? 'اساتید' :
                                                    msg.targetRoles === 'STUDENT' ? 'شاگردان' : msg.targetRoles}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400" dir="ltr">
                                            {new Date(msg.createdAt).toLocaleString(dir === 'rtl' ? 'fa-AF' : 'en-US')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-200">
                                        {msg.content}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400 font-bold bg-card/50 rounded-[2rem] border border-dashed border-border">
                                هنوز پیامی ارسال نشده است.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
