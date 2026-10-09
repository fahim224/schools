"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Users,
    GraduationCap,
    Search,
    Filter,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    User,
    ArrowUpRight,
    School,
    Users2,
    Loader2,
    X,
    Grid,
    List
} from "lucide-react";
import Link from "next/link";

export default function StudentsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [mounted, setMounted] = useState(false);

    // Data State
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [limit] = useState(12);

    useEffect(() => {
        setMounted(true);
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER") {
            router.push("/");
        }

        if (session) {
            fetchClasses();
            fetchGroups();
        }
    }, [status, session, router]);

    useEffect(() => {
        if (session) {
            fetchStudents();
        }
    }, [currentPage, searchTerm, selectedClass, selectedGroup, session]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/students?page=${currentPage}&limit=${limit}&search=${searchTerm}`;
            if (selectedClass) url += `&classId=${selectedClass}`;
            if (selectedGroup) url += `&groupId=${selectedGroup}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students);
                setTotalPages(data.totalPages);
                setTotalStudents(data.total);
            }
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/admin/classes");
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            }
        } catch (err) {
            console.error("Failed to fetch classes", err);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/superadmin/groups");
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error("Failed to fetch groups", err);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedClass("");
        setSelectedGroup("");
        setCurrentPage(1);
    };

    if (!mounted || status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12 transition-colors duration-500">
            {/* Ambient background effects */}
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px] animate-pulse pointer-events-none`}></div>
            <div className={`fixed bottom-0 ${dir === 'rtl' ? '-left-24' : '-right-24'} h-96 w-96 rounded-full bg-purple-400/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                {/* Header Section */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin" className="p-3 bg-card/60 backdrop-blur-xl border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} />
                        </Link>
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-500">{t.dashboards.admin}</h2>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                {t.dashboards.students_list || "لیست شاگردان"}
                                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-card/60 backdrop-blur-xl border border-border p-1 rounded-2xl shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                <List size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                <Grid size={20} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all font-bold ${showFilters ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-card/60 backdrop-blur-xl border-border hover:border-cyan-500/50'}`}
                        >
                            <Filter size={18} />
                            {showFilters ? 'بستن فیلترها' : 'فیلترها'}
                        </button>
                    </div>
                </header>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-8 p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">جستجو بر اساس نام یا آیدی</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="نام، آیدی یا نام پدر..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">فیلتر صنف</label>
                                <div className="relative">
                                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">همه صنوف</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.level} - {c.section}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">فیلتر گروه‌بندی</label>
                                <div className="relative">
                                    <Users2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">همه گروه‌ها</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {(searchTerm || selectedClass || selectedGroup) && (
                            <div className="mt-6 pt-6 border-t border-border flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <X size={14} />
                                    پاکسازی همه فیلترها
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                            <div className="absolute inset-4 animate-pulse rounded-full bg-primary"></div>
                        </div>
                        <p className="text-slate-500 font-bold animate-pulse">{t.dashboards.loading_students}</p>
                    </div>
                ) : students.length > 0 ? (
                    <>
                        {viewMode === 'list' ? (
                            <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-collapse`}>
                                        <thead>
                                            <tr className="bg-slate-500/5 border-b border-border">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">ID / نمبر اساس</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">شاگرد</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">نام پدر / ولد</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">صنف</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">گروه</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">عملیات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {students.map((student) => (
                                                <tr key={student.id} className="group hover:bg-primary/5 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-border rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                                                            {student.studentId}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform overflow-hidden shadow-sm">
                                                                {student.image ? <img src={student.image} alt={student.name} className="h-full w-full object-cover" /> : <User size={20} className="text-primary" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-foreground">{student.name} {student.surname}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.email || 'بدون ایمیل'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-bold text-slate-500">{student.fatherName}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {student.currentClass ? (
                                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black">
                                                                <School size={12} />
                                                                {student.currentClass.level} - {student.currentClass.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400 italic">تعیین نشده</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {student.group ? (
                                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 text-[10px] font-black">
                                                                {student.group.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400">---</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <Link
                                                            href={`/dashboard/admin/students/${student.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-border rounded-xl text-xs font-black hover:bg-primary hover:text-white hover:border-primary transition-all group/btn"
                                                        >
                                                            مشاهده پروفایل
                                                            <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {students.map((student) => (
                                    <Link
                                        key={student.id}
                                        href={`/dashboard/admin/students/${student.id}`}
                                        className="group p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border hover:border-primary transition-all shadow-lg hover:-translate-y-2 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <GraduationCap size={80} />
                                        </div>
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative">
                                                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-4 border-card p-0.5 shadow-xl transition-all group-hover:scale-105 group-hover:border-primary overflow-hidden">
                                                    {student.image ? <img src={student.image} alt={student.name} className="h-full w-full object-cover rounded-[1.8rem]" /> : <User size={40} className="text-primary m-auto h-full" />}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg">
                                                    {student.studentId}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-foreground">{student.name} {student.surname}</h3>
                                                <p className="text-xs font-bold text-slate-500">فرزند {student.fatherName}</p>
                                            </div>
                                            <div className="w-full pt-4 border-t border-border flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صنف:</span>
                                                    <span className="text-[10px] font-bold text-emerald-500">{student.currentClass ? `${student.currentClass.level} - ${student.currentClass.name}` : '---'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">گروه:</span>
                                                    <span className="text-[10px] font-bold text-blue-500">{student.group?.name || '---'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination Section */}
                        <div className="mt-12 flex items-center justify-between">
                            <div className="text-sm font-bold text-slate-500">
                                نمایش {students.length} از {totalStudents} شاگرد
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-card border border-border rounded-2xl hover:bg-primary hover:text-white disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronRight size={20} className={dir === 'rtl' ? '' : 'rotate-180'} />
                                </button>

                                <div className="flex items-center gap-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        // Show first, last, and pages around current
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-sm transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg' : 'bg-card border border-border hover:border-primary'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-slate-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 bg-card border border-border rounded-2xl hover:bg-primary hover:text-white disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronLeft size={20} className={dir === 'rtl' ? '' : 'rotate-180'} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center space-y-6 bg-card/40 backdrop-blur-xl border border-border rounded-[3rem] text-center">
                        <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300">
                            <Users size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-foreground">هیچ شاگردی یافت نشد</h3>
                            <p className="text-slate-500 font-bold">برای جستجوی خود فیلتر دیگری را انتخاب کنید یا عبارت دیگری بنویسید.</p>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                        >
                            پاکسازی فیلترها
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
