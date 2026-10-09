"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, School, Loader2, Info, CheckCircle2, AlertTriangle, Search, ChevronDown, X, Check } from "lucide-react";
import Link from "next/link";

export default function CreateClassPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");

    // Searchable select state
    const [classSearch, setClassSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pageText = (t.dashboards as any).select_class_page;
    const nc = (t.dashboards as any).new_class;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        const user = session?.user as any;
        if (user) {
            const isManaged = !!user.createdById;
            if (isManaged) {
                router.push("/dashboard/teacher/classes");
                return;
            }
            fetchClasses();
        }
    }, [status, session]);

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/admin/classes");
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            }
        } catch (err) {
            console.error("Failed to fetch classes");
        } finally {
            setFetching(false);
        }
    };

    const handleClassSelect = (cls: any) => {
        const isDisabled = cls.teacher?.id && cls.teacher.id !== (session?.user as any).id;
        if (isDisabled) return;
        setSelectedClassId(cls.id);
        setClassSearch(cls.name + (cls.academicYear ? ` (${cls.academicYear})` : ""));
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSelectedClassId("");
        setClassSearch("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess("");
        setError("");

        if (!selectedClassId) {
            setError(pageText.error_select);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/admin/classes/${selectedClassId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId: (session?.user as any).id
                }),
            });

            if (res.ok) {
                setSuccess(pageText.success);
                setTimeout(() => {
                    router.push("/dashboard/teacher/classes");
                    router.refresh();
                }, 1500);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to assign class");
            }
        } catch (err) {
            setError(t.dashboards.something_went_wrong);
        } finally {
            setLoading(false);
        }
    };

    const filteredClasses = classes.filter((cls: any) =>
        (cls.name || "").toLowerCase().includes(classSearch.toLowerCase()) ||
        (cls.level || "").toLowerCase().includes(classSearch.toLowerCase()) ||
        (cls.academicYear || "").toString().includes(classSearch)
    );

    if (status === "loading") return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <div className={`p-4 md:p-8 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Link href="/dashboard/teacher/classes" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm">
                        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                            {pageText.title}
                        </h1>
                        <p className="text-slate-500 font-bold text-sm">
                            {pageText.subtitle}
                        </p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl space-y-8 relative overflow-hidden">
                    {/* Decorator */}
                    <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <School className="text-emerald-500" size={24} />
                            <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                {pageText.label}
                            </label>
                        </div>

                        {fetching ? (
                            <div className="flex items-center gap-2 text-slate-400 font-bold animate-pulse">
                                <Loader2 size={16} className="animate-spin" />
                                <span>{pageText.loading}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {classes.length > 0 ? (
                                    <div className="relative" ref={dropdownRef}>
                                        {/* Searchable trigger */}
                                        <div
                                            className={`w-full bg-slate-50 dark:bg-white/5 border rounded-[1.5rem] px-5 py-4 flex items-center gap-3 cursor-pointer transition-all ${showDropdown ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-border hover:border-emerald-500/50'}`}
                                            onClick={() => setShowDropdown(!showDropdown)}
                                        >
                                            <Search size={18} className="text-slate-400 flex-shrink-0" />
                                            <input
                                                type="text"
                                                className="flex-1 bg-transparent text-base font-bold outline-none placeholder:text-slate-400 placeholder:font-normal"
                                                placeholder={nc?.class_search_placeholder || "جستجوی صنف..."}
                                                value={classSearch}
                                                onChange={(e) => {
                                                    setClassSearch(e.target.value);
                                                    setShowDropdown(true);
                                                    if (!e.target.value) handleClear();
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowDropdown(true);
                                                }}
                                            />
                                            {selectedClassId ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <X size={16} className="text-slate-400" />
                                                </button>
                                            ) : (
                                                <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>

                                        {/* Dropdown */}
                                        {showDropdown && (
                                            <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredClasses.length > 0 ? (
                                                        filteredClasses.map((cls: any) => {
                                                            const isDisabled = cls.teacher?.id && cls.teacher.id !== (session?.user as any).id;
                                                            const isSelected = selectedClassId === cls.id;
                                                            const isCurrentTeacher = cls.teacher?.id === (session?.user as any).id;
                                                            return (
                                                                <button
                                                                    key={cls.id}
                                                                    type="button"
                                                                    disabled={isDisabled}
                                                                    onClick={() => handleClassSelect(cls)}
                                                                    className={`w-full text-start px-5 py-3.5 text-sm font-bold transition-colors flex items-center justify-between gap-3
                                                                        ${isSelected ? 'bg-emerald-500/10 text-emerald-600' : ''}
                                                                        ${isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-white/5' : 'hover:bg-emerald-500/5 text-foreground'}
                                                                    `}
                                                                >
                                                                    <span>{cls.name}</span>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        {cls.academicYear && (
                                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                                                {cls.academicYear}
                                                                            </span>
                                                                        )}
                                                                        {isCurrentTeacher && (
                                                                            <span className="text-[10px] font-black text-emerald-500">{pageText.current_class}</span>
                                                                        )}
                                                                        {isDisabled && !isCurrentTeacher && (
                                                                            <span className="text-[10px] font-black text-slate-400">{pageText.has_teacher}</span>
                                                                        )}
                                                                        {isSelected && <Check size={14} className="text-emerald-500" />}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="px-5 py-6 text-center text-sm font-bold text-slate-400">
                                                            {t.dashboards.no_results}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center gap-3">
                                        <Info />
                                        <span className="font-bold">{pageText.no_classes}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || classes.length === 0 || !!success}
                        className="w-full flex items-center justify-center gap-3 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 text-lg font-black shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        {pageText.submit_btn}
                    </button>

                    <p className="text-center text-xs font-bold text-slate-400 leading-relaxed">
                        {pageText.note}
                    </p>
                </form>
            </div>
        </div>
    );
}
