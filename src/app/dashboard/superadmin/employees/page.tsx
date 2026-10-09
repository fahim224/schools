"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Briefcase,
    Search,
    UserPlus,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Shield,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import DashboardClock from "@/components/DashboardClock";

type Employee = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    phone: string | null;
    image: string | null;
    jobTitle: string | null;
    createdAt: string;
};

export default function SuperAdminEmployeesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
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
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session) {
            fetchEmployees();
        }
    }, [status, session, router, fetchEmployees]);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (emp.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (emp.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading && employees.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8 flex justify-end">
                <DashboardClock />
            </div>

            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/superadmin" className="p-3 bg-card border border-border rounded-2xl hover:bg-muted transition-all">
                        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    </Link>
                    <div className="text-start">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">Human Resources</h2>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Employee Directory</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchEmployees} className="p-3 rounded-2xl border border-border bg-card hover:bg-muted transition-all">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Link href="/dashboard/superadmin/users/new" className="flex items-center gap-3 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
                        <UserPlus size={20} />
                        <span>Add Employee</span>
                    </Link>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="mb-8 p-4 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center gap-4 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or position..."
                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <select
                            className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl pl-10 pr-8 py-3 text-sm font-black outline-none appearance-none cursor-pointer"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins</option>
                            <option value="TEACHER">Teachers</option>
                            <option value="STAFF">Staff</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((emp) => (
                    <div key={emp.id} className="group relative bg-card border border-border rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform`}></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-4 relative">
                                <div className="h-24 w-24 rounded-3xl overflow-hidden border-4 border-background shadow-xl bg-slate-100 dark:bg-white/10">
                                    {emp.image ? (
                                        <img src={emp.image} alt={emp.name || ""} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-3xl font-black text-muted-foreground">
                                            {emp.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl border-4 border-background shadow-lg ${emp.role === 'ADMIN' ? 'bg-amber-500 text-white' :
                                        emp.role === 'TEACHER' ? 'bg-blue-500 text-white' :
                                            'bg-indigo-500 text-white'
                                    }`}>
                                    <Shield size={14} />
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-foreground mb-1">{emp.name}</h3>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{emp.jobTitle || emp.role}</p>

                            <div className="w-full space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border text-start">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-foreground truncate">{emp.email}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border text-start">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-foreground">{emp.phone || "No phone"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full">
                                <Link
                                    href={`/dashboard/superadmin/users/${emp.id}`}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                >
                                    View Profile
                                </Link>
                                <button className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredEmployees.length === 0 && !loading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 italic">
                        <Briefcase size={64} className="mb-4 opacity-20" />
                        <p className="text-xl font-bold">No employees found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
