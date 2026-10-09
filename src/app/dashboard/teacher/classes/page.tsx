"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Users,
    GraduationCap,
    ArrowRight,
    Loader2,
    BookOpen,
    Search,
    Plus,
    Printer
} from "lucide-react";
import Link from "next/link";

export default function TeacherClassesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasCreator, setHasCreator] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "TEACHER") {
            router.push("/");
        }

        if (session) {
            fetchClasses();
        }
    }, [status, session, router]);

    const userPermissions = (session?.user as any)?.permissions || "";
    const createdById = (session?.user as any)?.createdById;
    const isManaged = !!createdById;

    const canGrade = !isManaged || userPermissions.includes("CAN_GRADE");
    const canPrint = !isManaged || userPermissions.includes("CAN_PRINT_CARTS");
    const canViewResults = !isManaged || userPermissions.includes("CAN_VIEW_RESULTS");
    const canManageClasses = !isManaged || userPermissions.includes("CAN_MANAGE_CLASSES");
    const canAddClass = !isManaged; // Managed teachers cannot create new classes as per user request

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/admin/classes");
            if (res.ok) {
                const data = await res.json();
                const userId = (session?.user as any)?.id;
                // Since the API now filters correctly, we just need to ensure we only show classes assigned to this teacher
                const assignedClasses = data.filter((c: any) => c.teacherId === userId || c.createdById === userId);
                setClasses(assignedClasses);
            }
        } catch (err) {
            console.error("Error fetching classes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.dashboards.delete + "?")) return;
        try {
            const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
            if (res.ok) {
                setClasses(classes.filter(c => c.id !== id));
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete class");
            }
        } catch (err) {
            alert("Error deleting class");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.level.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toPersianNum = (n: string | number | undefined | null) => {
        if (n === undefined || n === null || n === "") return "";
        return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
    };

    return (
        <div className="p-4 md:p-8 space-y-8" dir={dir}>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-start">
                    <h1 className="text-3xl font-black tracking-tight">{t.dashboards.classes}</h1>
                    <p className="text-slate-500 font-bold">
                        {dir === 'rtl' ? 'مدیریت صنوف و درج نمرات شاگردان' : 'Manage your assigned levels and input student grades.'}
                    </p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
                    <input
                        type="text"
                        placeholder={t.dashboards.search_placeholder}
                        className={`w-full ${dir === 'rtl' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-3 bg-card border border-border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="flex justify-end gap-3">
                {canAddClass && (
                    <Link href={isManaged ? "/dashboard/teacher/classes/new" : "/dashboard/teacher/classes/create"} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-all">
                        <Plus size={20} />
                        {t.dashboards.add_class}
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((schoolClass) => (
                    <div
                        key={schoolClass.id}
                        className="group p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border hover:border-emerald-500 transition-all relative overflow-hidden shadow-xl text-start"
                    >
                        <div className={`absolute ${dir === 'rtl' ? '-left-8' : '-right-8'} -top-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all`}></div>

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <BookOpen size={28} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${schoolClass.gender === 'BOYS' ? 'bg-blue-500/10 text-blue-500' : schoolClass.gender === 'GIRLS' ? 'bg-pink-500/10 text-pink-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {schoolClass.gender === 'BOYS' ? t.dashboards.gender_boys : schoolClass.gender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed}
                            </span>
                        </div>

                        <div className="space-y-1 mb-6 relative z-10">
                            <h3 className="text-xl font-black text-foreground group-hover:text-emerald-500 transition-colors">
                                {t.levels[schoolClass.level] || schoolClass.level} • {schoolClass.section} ({toPersianNum(schoolClass.academicYear || "1403")})
                            </h3>
                            <p className="text-sm font-bold text-slate-500">{schoolClass.name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-border/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.dashboards.student_count}</p>
                                <p className="text-xs font-black text-foreground">{schoolClass._count?.students || 0}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-border/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.dashboards.subjects}</p>
                                <p className="text-xs font-black text-foreground">{schoolClass._count?.subjects || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            {canGrade && (
                                <Link
                                    href={`/dashboard/teacher/classes/${schoolClass.id}/grading`}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all group-hover:scale-[1.02] active:scale-95"
                                >
                                    <GraduationCap size={18} />
                                    {dir === 'rtl' ? 'ثبت نمرات' : 'Grading'}
                                </Link>
                            )}
                            {canPrint && (
                                <Link
                                    href={`/dashboard/teacher/classes/${schoolClass.id}/result-carts`}
                                    className="px-4 py-4 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-2xl transition-all flex items-center justify-center"
                                    title={dir === 'rtl' ? 'چاپ پارچ نمرات' : 'Print Result Carts'}
                                >
                                    <Printer size={20} />
                                </Link>
                            )}
                            {canManageClasses && (
                                <Link
                                    href={`/dashboard/teacher/classes/${schoolClass.id}`}
                                    className="px-4 py-4 bg-slate-500/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/20 border border-border rounded-2xl transition-all flex items-center justify-center"
                                    title={dir === 'rtl' ? 'مدیریت صنف' : 'Manage Class'}
                                >
                                    <Users size={20} />
                                </Link>
                            )}
                            {!isManaged && schoolClass.createdById === (session?.user as any).id && (
                                <button
                                    onClick={() => handleDelete(schoolClass.id)}
                                    className="px-4 py-4 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all flex items-center justify-center"
                                    title={t.dashboards.delete}
                                >
                                    <Plus className="rotate-45" size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredClasses.length === 0 && !loading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-border">
                        <Users size={48} className="opacity-20" />
                        <p className="font-bold">{t.dashboards.no_results}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
