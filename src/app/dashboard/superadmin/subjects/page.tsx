"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    BookOpen,
    FolderPlus,
    Plus,
    Trash2,
    Tag,
    Book,
    Edit,
    Save,
    X,
    ArrowLeft
} from "lucide-react";

export default function ManageSubjectsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const [subjects, setSubjects] = useState<any[]>([]);

    const [newSubName, setNewSubName] = useState("");

    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [editSubName, setEditSubName] = useState("");

    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const subRes = await fetch("/api/subjects");
            if (subRes.ok) setSubjects(await subRes.json());
        } catch (err) {
            console.error("Fetch error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session) {
            fetchData();
        }
    }, [status, session, router, fetchData]);

    const addSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubName) return;
        setLoading(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                body: JSON.stringify({ name: newSubName }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                setNewSubName("");
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create subject");
                setLoading(false); // Only set loading false here if not refetching immediately (fetchData handles loading)
            }
        } catch (err) {
            alert("Something went wrong");
            setLoading(false);
        }
    };

    const deleteSubject = async (id: string) => {
        if (!confirm(t.dashboards.delete + "?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete");
                setLoading(false);
            }
        } catch (err) {
            alert("Error deleting");
            setLoading(false);
        }
    };

    const updateSubject = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/subjects/${id}`, {
                method: "PUT",
                body: JSON.stringify({ name: editSubName }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                setEditingSubId(null);
                fetchData();
            } else {
                alert("Failed to update");
                setLoading(false);
            }
        } catch (err) {
            alert("Error updating");
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("index", index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const dragIndex = parseInt(e.dataTransfer.getData("index"));
        if (dragIndex === dropIndex) return;

        const newSubjects = [...subjects];
        const [draggedItem] = newSubjects.splice(dragIndex, 1);
        newSubjects.splice(dropIndex, 0, draggedItem);

        setSubjects(newSubjects);
        setIsDirty(true);
    };

    const saveOrder = async () => {
        setLoading(true);
        const orders = subjects.map((sub, idx) => ({ id: sub.id, order: idx }));
        try {
            const res = await fetch("/api/subjects", {
                method: "PATCH",
                body: JSON.stringify({ orders }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                setIsDirty(false);
                fetchData();
            } else {
                alert("Failed to save order");
            }
        } catch (err) {
            alert("Error saving order");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-3 md:p-5 font-sans transition-colors duration-300">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
                        <BookOpen className="text-primary" size={28} />
                        {t.dashboards.manage_subjects}
                    </h1>
                    {isDirty && (
                        <button
                            onClick={saveOrder}
                            className="bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-primary/20 animate-bounce active:scale-95 transition-all"
                        >
                            <Save size={14} className="inline mr-1" />
                            ذخیره ترتیب جدید
                        </button>
                    )}
                </div>
                <button
                    onClick={() => router.push("/dashboard/superadmin")}
                    className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/80 transition-all"
                >
                    <ArrowLeft size={16} />
                    {t.home}
                </button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">

                {/* Categories Section - HIDDEN */}
                {/* <div className="hidden space-y-4"> ... </div> */}

                {/* Subjects Section */}
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <Book className="text-emerald-500" size={20} />
                            {t.dashboards.subjects}
                        </h3>

                        <form onSubmit={addSubject} className="flex flex-col gap-2 mb-6">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder={t.dashboards.subject_name}
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    className="flex-[2] rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
                                    required
                                />
                            </div>
                            <button type="submit" className="rounded-xl bg-emerald-500 py-3 text-white text-base font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                <Plus size={18} />
                                {t.dashboards.add_subject}
                            </button>
                        </form>

                        <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {subjects.map((sub, idx) => (
                                <div
                                    key={sub.id}
                                    draggable={!editingSubId}
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    className={`group flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border hover:bg-muted/40 transition-all gap-3 ${!editingSubId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                                        <BookOpen className="text-emerald-500 opacity-50 flex-shrink-0" size={16} />
                                        {editingSubId === sub.id ? (
                                            <div className="flex flex-col w-full gap-1.5">
                                                <input
                                                    value={editSubName}
                                                    onChange={(e) => setEditSubName(e.target.value)}
                                                    className="bg-background border border-emerald-500 rounded-lg px-2 py-1 text-sm outline-none font-bold"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-400">#{(subjects.indexOf(sub) + 1).toString().padStart(2, '0')}</span>
                                                    <span className="font-bold text-foreground text-sm leading-tight truncate">{sub.name}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        {editingSubId === sub.id ? (
                                            <>
                                                <button onClick={() => updateSubject(sub.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={() => setEditingSubId(null)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setEditingSubId(sub.id); setEditSubName(sub.name); }}
                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500/20"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteSubject(sub.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
        </div>
    );
}
