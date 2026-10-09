
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    Search,
    Users,
    ArrowLeft,
    Eye,
    ArrowUpRight,
    School,
    User
} from "lucide-react";
import Link from "next/link";

export default function StudentsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session) {
            const role = (session.user as any).role;
            if (role !== "TEACHER" && role !== "ADMIN" && role !== "SUPERADMIN") {
                router.push("/");
            } else {
                fetchStudents();
            }
        }
    }, [status, session, currentPage, searchTerm]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Reusing admin API since it likely allows teachers to see students they "own" or are in their classes.
            // If API has restrictions, it should be handled in route.ts
            const res = await fetch(`/api/admin/students?page=${currentPage}&limit=10&search=${searchTerm}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

    const role = (session?.user as any)?.role;
    const basePath = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/admin";

    return (
        <div className={`p-4 md:p-8 space-y-8 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={basePath} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
                        <ArrowLeft size={20} className={`text-slate-600 dark:text-slate-300 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">لیست شاگردان</h1>
                        <p className="text-slate-500 font-bold text-sm">مدیریت و مشاهده تمامی شاگردان</p>
                    </div>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors`} size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.dashboards.search_placeholder}
                        className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-shadow shadow-sm`}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest font-black border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-start">ID</th>
                                <th className="px-8 py-6 text-start">{t.student_registration.name_dr}</th>
                                <th className="px-8 py-6 text-start">{t.student_registration.father_name_dr}</th>
                                <th className="px-8 py-6 text-start">{t.dashboards.classes}</th>
                                <th className="px-8 py-6 text-end">عملکرد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-border rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                                                {student.studentId}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform overflow-hidden shadow-sm">
                                                    {student.image ? <img src={student.image} alt={student.name} className="h-full w-full object-cover" /> : <User size={18} className="text-primary" />}
                                                </div>
                                                <div className="text-sm font-black text-foreground">{student.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{student.fatherName || "---"}</td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                <School size={12} />
                                                {student.currentClass?.name || t.dashboards.inactive}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-end">
                                            <Link href={`${basePath}/students/${student.id}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all">
                                                <Eye size={16} />
                                                مشاهده
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                                        {loading ? "در حال بارگذاری..." : "هیچ شاگردی یافت نشد."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
