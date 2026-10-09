"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Mail,
    Phone,
    Briefcase,
    Shield,
    Calendar,
    User,
    School,
    Loader2,
    GraduationCap,
    ShieldCheck,
    Users,
} from "lucide-react";
import Link from "next/link";

export default function SuperAdminEmployeeProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t, dir } = useLanguage();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params?.id as string;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session && id) {
            fetchEmployee();
        }
    }, [status, session, id]);

    const fetchEmployee = async () => {
        try {
            const res = await fetch(`/api/admin/employees/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEmployee(data);
            }
        } catch (err) {
            console.error("Failed to fetch employee");
        } finally {
            setLoading(false);
        }
    };

    if (!session || status === "loading" || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <User size={40} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-black text-foreground">کاربر پیدا نشد</h2>
                <p className="text-slate-500">این کاربر وجود ندارد یا حذف شده است.</p>
                <Link href="/dashboard/superadmin/employees" className="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all">
                    بازگشت به لیست کارمندان
                </Link>
            </div>
        );
    }

    const roleColors: Record<string, string> = {
        ADMIN: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        TEACHER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        STAFF: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        SUPERADMIN: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };

    const roleIcons: Record<string, any> = {
        ADMIN: ShieldCheck,
        TEACHER: GraduationCap,
        STAFF: Briefcase,
        SUPERADMIN: Shield,
    };

    const RoleIcon = roleIcons[employee.role] || User;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            {/* Background decorations */}
            <div className="fixed -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-400/10 blur-[120px] animate-pulse pointer-events-none" />
            <div className="fixed bottom-0 -left-24 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px] animate-pulse delay-700 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                {/* Back button */}
                <Link
                    href="/dashboard/superadmin/employees"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
                >
                    <ArrowLeft size={16} className={dir === "rtl" ? "rotate-180" : ""} />
                    بازگشت به لیست کارمندان
                </Link>

                {/* Profile Card */}
                <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl">
                    {/* Header Banner */}
                    <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                    </div>

                    <div className="px-8 pb-8">
                        {/* Avatar */}
                        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
                            <div className="w-32 h-32 rounded-3xl border-4 border-background shadow-2xl overflow-hidden bg-slate-100 dark:bg-white/10 flex-shrink-0">
                                {employee.image ? (
                                    <img src={employee.image} alt={employee.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-black">
                                        {employee.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2 pb-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-black text-foreground">{employee.name || "---"}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${roleColors[employee.role] || roleColors.STAFF}`}>
                                        {t.roles?.[employee.role] || employee.role}
                                    </span>
                                </div>
                                <p className="text-slate-500 font-bold flex items-center gap-2">
                                    <Briefcase size={14} />
                                    {employee.jobTitle || t.roles?.[employee.role] || employee.role}
                                </p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ایمیل</p>
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-indigo-500" />
                                    <span className="font-bold text-sm text-foreground">{employee.email || "---"}</span>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">شماره تماس</p>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-green-500" />
                                    <span className="font-bold text-sm text-foreground">{employee.phone || "---"}</span>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">نقش</p>
                                <div className="flex items-center gap-2">
                                    <RoleIcon size={16} className="text-purple-500" />
                                    <span className="font-bold text-sm text-foreground">{t.roles?.[employee.role] || employee.role}</span>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">تاریخ عضویت</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-amber-500" />
                                    <span className="font-bold text-sm text-foreground">
                                        {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("fa-AF") : "---"}
                                    </span>
                                </div>
                            </div>

                            {employee._count?.managedClasses !== undefined && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">صنوف مدیریت شده</p>
                                    <div className="flex items-center gap-2">
                                        <School size={16} className="text-cyan-500" />
                                        <span className="font-bold text-sm text-foreground">{employee._count.managedClasses} صنف</span>
                                    </div>
                                </div>
                            )}

                            {employee._count?.subjects !== undefined && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">مضامین</p>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={16} className="text-blue-500" />
                                        <span className="font-bold text-sm text-foreground">{employee._count.subjects} مضمون</span>
                                    </div>
                                </div>
                            )}

                            {employee._count?.students !== undefined && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">شاگردان</p>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-pink-500" />
                                        <span className="font-bold text-sm text-foreground">{employee._count.students} شاگرد</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
