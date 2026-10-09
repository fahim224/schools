"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Users,
    Tag,
    Info,
    CheckCircle,
    XCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";

export default function SuperAdminGroupsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [newGroup, setNewGroup] = useState({
        name: "",
        description: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session && (session.user as any).role === "SUPERADMIN") {
            fetchGroups();
        }
    }, [status, session, router]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/superadmin/groups");
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            } else {
                setError("Failed to fetch groups");
            }
        } catch (err) {
            setError("Error fetching groups");
        } finally {
            setLoading(false);
        }
    };

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/superadmin/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newGroup)
            });

            if (res.ok) {
                setSuccess("Group created successfully");
                setNewGroup({ name: "", description: "" });
                fetchGroups();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to create group");
            }
        } catch (err) {
            setError("Error submitting form");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm("Are you sure you want to delete this group? Students in this group will be unassigned.")) return;

        try {
            const res = await fetch(`/api/superadmin/groups/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setSuccess("Group deleted successfully");
                fetchGroups();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Failed to delete group");
            }
        } catch (err) {
            setError("Error deleting group");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/superadmin" className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 transition-all shadow-sm group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">مدیریت گروه‌ها</h2>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">گروه‌بندی شاگردان</h1>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right" dir="rtl">
                    {/* Create Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 sticky top-8">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Plus size={24} />
                                <h3 className="text-xl font-black">ایجاد گروه جدید</h3>
                            </div>

                            <form onSubmit={handleAddGroup} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">نام گروه *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="مثلاً: ممتاز، بورسیه، ویژه..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">توضیحات</label>
                                    <textarea
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                                        placeholder="توضیحات کوتاه در مورد این گروه..."
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm font-bold animate-pulse">
                                        <XCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                                        <CheckCircle size={16} />
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-white font-black shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                                >
                                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    ثبت گروه
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Groups List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.length === 0 ? (
                                <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                                    <Tag size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">هیچ گروهی تاکنون ایجاد نشده است.</p>
                                </div>
                            ) : (
                                groups.map((group) => (
                                    <div key={group.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                                <Users size={24} />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{group.name}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[40px]">
                                            {group.description || "بدون توضیحات اضافی"}
                                        </p>
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <Info size={12} />
                                            ایجاد شده در: {new Date(group.createdAt).toLocaleDateString('fa-AF')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
