"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Users,
    UserCheck,
    Briefcase,
    Calendar,
    ArrowLeft,
    TrendingUp,
    Search,
    User as UserIcon,
    ArrowUpRight,
    Loader2,
    ShieldCheck,
    GraduationCap,
    Pencil,
    QrCode
} from "lucide-react";
import Link from "next/link";

export default function EmployeesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session) {
            fetchEmployees();
        }
    }, [status, session, router]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/employees");
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (err) {
            console.error("Failed to fetch employees");
        } finally {
            setLoading(false);
        }
    };

    const getYearsOfService = (createdAt: string) => {
        const joinedDate = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears.toFixed(1);
    };

    const filteredEmployees = employees.filter((e: any) =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        teachers: employees.filter(e => e.role === "TEACHER").length,
        admins: employees.filter(e => e.role === "ADMIN" || e.role === "SUPERADMIN").length,
        others: employees.filter(e => e.role === "STAFF").length,
        total: employees.length
    };

    if (!mounted || status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="font-sans selection:bg-cyan-500/30 overflow-x-hidden min-h-screen transition-colors duration-700 p-4 md:p-8 relative">
            {/* Background Decorations */}
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-emerald-400/10 dark:bg-emerald-600/5 blur-[120px] animate-pulse`}></div>
            <div className={`fixed top-1/2 ${dir === 'rtl' ? '-left-24' : '-right-24'} h-[500px] w-[500px] rounded-full bg-cyan-400/10 dark:bg-cyan-600/5 blur-[150px] animate-pulse delay-700`}></div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 text-start">
                        <Link
                            href="/dashboard/admin"
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-2"
                        >
                            <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
                            {t.dashboard}
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                                {t.dashboards.manage_employees}
                                <span className="text-emerald-500 animate-pulse">.</span>
                            </h1>
                            <Link
                                href="/dashboard/admin/employees/new"
                                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
                            >
                                <Users size={16} />
                                {t.dashboards.add_employee}
                            </Link>
                        </div>
                        <p className="text-slate-500 font-bold">{t.dashboards.staff_list}</p>
                    </div>

                    <div className="flex items-center gap-4 bg-card/60 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-2">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.roles.TEACHER}</p>
                                <p className="text-xl font-black text-foreground">{stats.teachers}</p>
                            </div>
                            <div className="text-center border-x border-border px-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.dashboards.admin}</p>
                                <p className="text-xl font-black text-foreground">{stats.admins}</p>
                            </div>
                            <div className="text-center border-r border-border pr-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.roles.STAFF}</p>
                                <p className="text-xl font-black text-foreground">{stats.others}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t.grading.total}</p>
                                <p className="text-xl font-black text-foreground">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="relative group max-w-2xl">
                    <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-6' : 'left-6'} flex items-center pointer-events-none`}>
                        <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <input
                        type="text"
                        dir={dir}
                        placeholder={t.dashboards.search_employee_placeholder}
                        className={`w-full bg-card/40 backdrop-blur-xl border border-border rounded-2xl py-3.5 ${dir === 'rtl' ? 'pr-12' : 'pl-12'} pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-lg group-hover:bg-card/60`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Employees List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-48 rounded-[2rem] bg-card/40 border border-border animate-pulse"></div>
                        ))
                    ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee: any) => (
                            <div key={employee.id} className="group p-6 rounded-[2rem] bg-card/60 backdrop-blur-xl border border-border hover:border-emerald-500/50 transition-all hover:-translate-y-1 relative overflow-hidden shadow-sm text-start">
                                <div className={`absolute ${dir === 'rtl' ? '-left-4' : '-right-4'} -bottom-4 h-24 w-24 rounded-full bg-emerald-500 opacity-5 blur-2xl group-hover:opacity-10 transition-all`}></div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform overflow-hidden">
                                        {employee.image ? (
                                            <img src={employee.image} alt={employee.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <UserIcon size={24} className="text-emerald-500" />
                                        )}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${employee.role === 'ADMIN' || employee.role === 'SUPERADMIN'
                                        ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                                        : employee.role === 'TEACHER'
                                            ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                        }`}>
                                        {t.roles[employee.role]}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-lg font-black text-foreground truncate">{employee.name || "---"}</h4>
                                        <Link
                                            href={`/dashboard/admin/employees/${employee.id}/edit`}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition-all border border-border"
                                            title={t.dashboards.edit_employee}
                                        >
                                            <Pencil size={14} />
                                        </Link>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Briefcase size={12} />
                                        {employee.jobTitle || t.roles[employee.role]}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.dashboards.years_of_experience}</p>
                                        <p className="text-sm font-black text-foreground flex items-center gap-1">
                                            <TrendingUp size={14} className="text-emerald-500" />
                                            {getYearsOfService(employee.createdAt)} {t.dashboards.years_suffix}
                                        </p>
                                    </div>
                                    <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.dashboards.joined_date}</p>
                                        <p className="text-sm font-black text-foreground">
                                            {new Date(employee.createdAt).toLocaleDateString(dir === 'rtl' ? 'fa-AF' : 'en-US')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    {employee.role === 'TEACHER' && (
                                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/5 text-[9px] font-bold text-cyan-600 border border-cyan-500/10 flex items-center gap-1">
                                            <GraduationCap size={10} />
                                            {employee._count.subjects} {t.dashboards.subjects}
                                        </span>
                                    )}
                                    {(employee.role === 'ADMIN' || employee.role === 'TEACHER') && employee._count.managedClasses > 0 && (
                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/5 text-[9px] font-bold text-purple-600 border border-purple-500/10 flex items-center gap-1">
                                            <ShieldCheck size={10} />
                                            {employee._count.managedClasses} {t.dashboards.classes}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto border border-border">
                                <Users size={40} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold italic">{t.dashboards.no_employees_found}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
