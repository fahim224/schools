"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import {
    Users,
    School,
    RefreshCw,
    BookOpen,
    CreditCard,
    Briefcase,
    UserPlus,
    Sparkles,
    MessageSquare,
    TrendingUp,
    ShieldCheck,
    Eye,
    ArrowUpRight,
    Search,
    GraduationCap,
    KeyRound,
    Settings
} from "lucide-react";
import DashboardClock from "@/components/DashboardClock";

export default function SuperAdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsData, setStatsData] = useState<any>(null);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok) {
                const data = await res.json();
                setStatsData(data);
            }
        } catch (err) {
            console.error("Failed to fetch stats");
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session) {
            fetchStats();
        }
    }, [status, session, router, fetchStats]);

    if (!mounted || status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
            </div>
        );
    }

    if (!session || (session.user as any).role !== "SUPERADMIN") return null;

    const mainStats = [
        { label: t.dashboards.total_students, value: statsData?.students || "0", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: t.dashboards.total_admins, value: statsData?.admins || "0", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: t.dashboards.total_teachers, value: statsData?.teachers || "0", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: t.dashboards.active_users, value: (Number(statsData?.students || 0) + Number(statsData?.teachers || 0) + Number(statsData?.admins || 0) + Number(statsData?.parents || 0) + Number(statsData?.staff || 0)) || "0", icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10" },
    ];

    const visitorStats = [
        { label: t.dashboards.daily_visitors, value: statsData?.visitors?.daily || "0", icon: Eye, color: "text-cyan-500" },
        { label: t.dashboards.weekly_visitors, value: statsData?.visitors?.weekly || "0", icon: Eye, color: "text-indigo-500" },
        { label: t.dashboards.monthly_visitors, value: statsData?.visitors?.monthly || "0", icon: Eye, color: "text-violet-500" },
    ];

    return (
        <div className={`p-4 md:p-8 transition-all duration-300 font-sans max-w-7xl mx-auto ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none`}></div>

            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2 opacity-80">{t.dashboards.control_center}</h2>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground drop-shadow-sm">
                        {t.dashboards.superadmin}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <DashboardClock />
                    <button
                        onClick={fetchStats}
                        className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/50 transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={`${loadingStats ? "animate-spin" : "group-hover:rotate-180"} transition-all duration-500 text-muted-foreground group-hover:text-primary`} />
                    </button>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mb-10 flex flex-wrap gap-4 relative z-10">
                <Link href="/dashboard/superadmin/users/new" className="flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95">
                    <UserPlus size={20} />
                    <span>{t.dashboards.add_admin}</span>
                </Link>
                <Link href="/dashboard/superadmin/messages" className="flex items-center gap-3 rounded-2xl bg-card border border-border px-8 py-4 text-sm font-black text-foreground shadow-sm transition hover:bg-muted hover:-translate-y-0.5 active:scale-95">
                    <MessageSquare size={20} className="text-pink-500" />
                    <span>{t.dashboards.send_message}</span>
                </Link>
            </div>

            {/* Main Stats Grid */}
            <h3 className="text-lg font-black mb-6 px-2 flex items-center gap-2 relative z-10">
                <TrendingUp size={20} className="text-primary" />
                {t.dashboards.system_statistics}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
                {mainStats.map((stat, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-sm p-8 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`rounded-2xl ${stat.bg} p-4 ${stat.color} transition-all group-hover:scale-110 group-hover:rotate-3`}>
                                <stat.icon size={28} />
                            </div>
                            <ArrowUpRight size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-foreground tabular-nums">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative z-10">
                {/* Visitor Insights */}
                <div className="lg:col-span-2 p-8 md:p-10 rounded-[3rem] border border-border bg-card shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-foreground">{t.dashboards.visitor_stats}</h3>
                            <p className="text-sm text-muted-foreground font-medium">Traffic analysis for non-logged users</p>
                        </div>
                        <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-2xl">
                            <Eye size={24} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {visitorStats.map((v, i) => (
                            <div key={i} className="p-6 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{v.label}</p>
                                <div className="flex items-end gap-2">
                                    <span className={`text-3xl font-black ${v.color}`}>{v.value}</span>
                                    <span className="text-xs text-muted-foreground mb-1">visits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="p-8 md:p-10 rounded-[3rem] border border-border bg-gradient-to-br from-emerald-500/5 to-teal-500/5 shadow-sm relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-foreground">{t.dashboards.financial_overview}</h3>
                        <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{t.dashboards.received_amount}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{statsData?.totalAmount || 0}</span>
                                <span className="text-sm font-black text-muted-foreground uppercase">{t.dashboards.currency}</span>
                            </div>
                        </div>
                        <div className="h-[2px] w-full bg-border/50"></div>
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-muted-foreground">Transaction count</span>
                            <span className="text-foreground">{(statsData?.students || 0) * 12} est.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Consoles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { title: t.dashboards.manage_subjects, category: t.dashboards.subjects, icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/10", href: "/dashboard/superadmin/subjects", action: t.dashboards.open_console },
                    { title: t.dashboards.manage_classes, category: t.dashboards.classes, icon: School, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/superadmin/classes", action: t.dashboards.open_console },
                    { title: t.dashboards.manage_student_groups, category: t.dashboards.student_groups, icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10", href: "/dashboard/superadmin/groups", action: t.dashboards.open_console },
                    { title: t.dashboards.manage_ads, category: t.dashboards.advertisements, icon: Sparkles, color: "text-pink-500", bg: "bg-pink-500/10", href: "/dashboard/superadmin/ads", action: t.dashboards.open_console },
                    { title: t.dashboards.manage_employees, category: t.dashboards.human_resources, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/superadmin/employees", action: t.dashboards.open_directory },
                    { title: t.dashboards.reset_requests.title, category: t.dashboards.security || "SECURITY", icon: KeyRound, color: "text-red-500", bg: "bg-red-500/10", href: "/dashboard/superadmin/reset-requests", action: t.dashboards.open_console },
                    { title: t.dashboards.settings, category: t.dashboards.system || "SYSTEM", icon: Settings, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/dashboard/superadmin/settings", action: t.dashboards.open_console },
                ].map((card, i) => (
                    <div key={i} className="group p-8 rounded-[2.5rem] border border-border bg-card hover:bg-card/80 transition-all hover:shadow-2xl hover:-translate-y-2">
                        <div className={`w-14 h-14 rounded-[1.25rem] ${card.bg} ${card.color} mb-6 flex items-center justify-center group-hover:scale-110 shadow-inner transition-transform`}>
                            <card.icon size={26} />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{card.category}</p>
                        <h3 className="text-xl font-black text-foreground mb-6 line-clamp-1">{card.title}</h3>
                        <Link href={card.href} className={`inline-flex items-center gap-2 text-sm font-black ${card.color} hover:gap-4 transition-all`}>
                            {card.action} →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
