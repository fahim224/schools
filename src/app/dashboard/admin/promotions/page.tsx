"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    TrendingUp,
    ChevronRight,
    Users,
    GraduationCap,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    AlertCircle,
    Check
} from "lucide-react";
import Link from "next/link";

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export default function PromotionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [classes, setClasses] = useState<any[]>([]);
    const [sourceClassId, setSourceClassId] = useState("");
    const [targetClassId, setTargetClassId] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("1404");

    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session) {
            fetchClasses();
        }
    }, [status, session, router]);

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/admin/classes");
            if (res.ok) {
                setClasses(await res.json());
            }
        } catch (err) {
            setError("Failed to fetch classes");
        } finally {
            setLoading(false);
        }
    };

    // When source class changes, fetch its students
    useEffect(() => {
        if (sourceClassId) {
            fetchClassStudents(sourceClassId);
        } else {
            setStudents([]);
            setSelectedStudentIds([]);
        }
    }, [sourceClassId]);

    const fetchClassStudents = async (classId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/classes/${classId}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
                // Select all by default
                setSelectedStudentIds((data.students || []).map((s: any) => s.id));
            }
        } catch (err) {
            setError("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!targetClassId || selectedStudentIds.length === 0) {
            setError("Please select a target class and at least one student.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/admin/promotions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: selectedStudentIds,
                    targetClassId,
                    academicYear: newAcademicYear
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setSourceClassId("");
                    setTargetClassId("");
                    setStudents([]);
                }, 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to promote students");
            }
        } catch (err) {
            setError("Something went wrong during promotion");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStudent = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    if (loading && classes.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 relative">
            <div className="fixed -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px] animate-pulse pointer-events-none"></div>

            <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                        <ArrowLeft size={20} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                    </Link>
                    <div className="text-start">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.dashboards.manage_promotions || "Student Promotions"}</h2>
                        <h1 className="text-3xl font-black tracking-tight">ارتقاء صنف شاگردان</h1>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8 text-start">
                        <h3 className="flex items-center gap-3 text-xl font-black">
                            <TrendingUp className="text-emerald-500" />
                            تنظیمات ارتقا
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">صنف فعلی (مبدأ)</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                                    value={sourceClassId}
                                    onChange={(e) => setSourceClassId(e.target.value)}
                                >
                                    <option value="">انتخاب صنف مبدأ...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            صنف {t.levels[cls.level] || cls.level} {cls.section} {cls.gender === 'BOYS' ? t.dashboards.gender_boys : cls.gender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed} ({toPersianNum(cls.academicYear || "1403")})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center">
                                <ChevronRight className={`text-slate-300 rotate-90`} size={32} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">صنف هدف (مقصد)</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                                    value={targetClassId}
                                    onChange={(e) => setTargetClassId(e.target.value)}
                                >
                                    <option value="">انتخاب صنف مقصد...</option>
                                    {classes.map((cls: any) => (
                                        <option key={cls.id} value={cls.id}>
                                            صنف {t.levels[cls.level] || cls.level} {cls.section} {cls.gender === 'BOYS' ? t.dashboards.gender_boys : cls.gender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed} ({toPersianNum(cls.academicYear || "1403")})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">سال تحصیلی جدید</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                                    value={newAcademicYear}
                                    onChange={(e) => setNewAcademicYear(e.target.value)}
                                >
                                    {Array.from({ length: 1414 - 1390 + 1 }, (_, i) => 1414 - i).map(year => (
                                        <option key={year} value={year.toString()}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handlePromote}
                                    disabled={submitting || !sourceClassId || !targetClassId || selectedStudentIds.length === 0}
                                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
                                    تأیید و اجرای ارتقاء صنف
                                </button>
                            </div>

                            {error && <div className="text-red-500 text-[10px] font-bold flex items-center gap-2 bg-red-500/10 p-3 rounded-xl"><AlertCircle size={14} /> {error}</div>}
                            {success && <div className="text-emerald-600 text-[10px] font-bold flex items-center gap-2 bg-emerald-500/10 p-3 rounded-xl"><CheckCircle size={14} /> ارتقاء موفقانه انجام شد!</div>}
                        </div>
                    </div>
                </div>

                {/* Student Selection Panel */}
                <div className="lg:col-span-8">
                    <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl min-h-[600px] flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                <Users className="text-cyan-500" />
                                لیست شاگردان ({selectedStudentIds.length} از {students.length})
                            </h3>
                            <div className="relative group w-full md:max-w-xs">
                                <Search size={16} className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-slate-400 my-auto`} />
                                <input
                                    type="text"
                                    placeholder="تجتجو با نام یا نمبر اساس..."
                                    className={`w-full bg-slate-500/5 border border-border rounded-xl py-2.5 ${dir === 'rtl' ? 'pr-10' : 'pl-10'} pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {!sourceClassId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <GraduationCap size={64} className="opacity-20" />
                                <p className="font-bold italic">لطفاً ابتدا صنف صنف مبدأ را انتخاب کنید</p>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 size={40} className="animate-spin text-primary/30" />
                            </div>
                        ) : filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedStudentIds.includes(student.id) ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' : 'bg-slate-500/5 border-transparent hover:border-slate-300 dark:hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-3 text-start">
                                            <div className="h-10 w-10 rounded-xl bg-white/50 dark:bg-white/5 border border-border flex items-center justify-center overflow-hidden">
                                                {student.image ? <img src={student.image} className="h-full w-full object-cover" /> : <span className="text-xs font-black text-slate-400">{student.name[0]}</span>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground">{student.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500">اساس: {student.studentId}</p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${selectedStudentIds.includes(student.id) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-transparent border-slate-300 dark:border-white/10'}`}>
                                            {selectedStudentIds.includes(student.id) && <Check size={14} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 italic font-bold">هیچ شاگردی یافت نشد.</div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.5); }
            `}</style>
        </div>
    );
}
