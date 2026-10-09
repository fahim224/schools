"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    UserPlus,
    Users,
    Settings,
    ArrowRight,
    UserCheck,
    GraduationCap,
    Clock,
    BookOpen,
    Info,
    Calendar,
    Bell,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import DashboardClock from "@/components/DashboardClock";

export default function TeacherDashboard() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [creatorInfo, setCreatorInfo] = useState<any>(null);
    const [superadminMsg, setSuperadminMsg] = useState<any>(null);
    const [adminMsg, setAdminMsg] = useState<any>(null);
    const [hasCreator, setHasCreator] = useState<boolean>(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/api/auth/signin");
        } else if (session && (session.user as any).role !== "TEACHER") {
            router.push("/");
        }

        if (session) {
            fetchCreatorInfo();
            fetchMessages();
        }
    }, [status, session, router]);

    const fetchCreatorInfo = async () => {
        try {
            const res = await fetch("/api/user/creator");
            if (res.ok) {
                const data = await res.json();
                setCreatorInfo(data.createdBy);
                setHasCreator(!!data.createdBy);

                // Re-sync permissions if they changed
                const currentPerms = (session?.user as any)?.permissions || "";
                if (data.permissions && data.permissions !== currentPerms) {
                    console.log("Syncing permissions...");
                    await update({ permissions: data.permissions });
                }
            }
        } catch (err) {
            console.error("Failed to fetch creator info");
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const msgs = await res.json();
                if (msgs && msgs.length > 0) {
                    const superMsg = msgs.find((m: any) => m.sender.role === 'SUPERADMIN');
                    // Find explicit ADMIN message (not SuperAdmin)
                    const admMsg = msgs.find((m: any) => m.sender.role === 'ADMIN');

                    setSuperadminMsg(superMsg);
                    setAdminMsg(admMsg);
                }
            }
        } catch (err) { console.error("Failed to fetch messages", err); }
    };

    if (status === "loading") return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!session || (session.user as any).role !== "TEACHER") return null;

    const allQuickActions = [
        {
            title: t.student_registration.title,
            desc: dir === 'rtl' ? 'ثبت نام جدید و ایجاد حساب والدین' : 'Register new students & parents',
            icon: UserPlus,
            href: "/dashboard/teacher/students/new",
            color: "bg-blue-500",
            gradient: "from-blue-500 to-blue-600",
            hideIfManaged: true
        },
        {
            title: "لیست شاگردان",
            desc: dir === 'rtl' ? 'مدیریت و جستجوی شاگردان' : 'Manage students',
            icon: Users,
            href: "/dashboard/teacher/students",
            color: "bg-violet-500",
            gradient: "from-violet-500 to-violet-600"
        },
        {
            title: "لیست والدین",
            desc: dir === 'rtl' ? 'لیست والدین و ارتباط با آنها' : 'Parents list',
            icon: Users,
            href: "/dashboard/teacher/parents",
            color: "bg-fuchsia-500",
            gradient: "from-fuchsia-500 to-fuchsia-600",
            hideIfManaged: true
        },
        {
            title: "صنف های من",
            desc: dir === 'rtl' ? 'مدیریت صنوف و تقسیم اوقات' : 'My Classes',
            icon: BookOpen,
            href: "/dashboard/teacher/classes",
            color: "bg-amber-500",
            gradient: "from-amber-500 to-amber-600"
        },
        {
            title: "پروفایل من",
            desc: dir === 'rtl' ? 'تنظیمات حساب کاربری' : 'My Profile',
            icon: Settings,
            href: "/dashboard/teacher/profile",
            color: "bg-emerald-500",
            gradient: "from-emerald-500 to-emerald-600"
        }
    ];

    const quickActions = allQuickActions.filter(action => !hasCreator || !action.hideIfManaged);

    return (
        <div className="p-6 md:p-10 space-y-10 min-h-screen bg-transparent" dir={dir}>

            {/* Top Bar with Clock */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white hidden md:block">
                        {t.dashboard || 'Dashboard'}
                    </h1>
                </div>
                <DashboardClock />
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-10 md:p-16 text-white shadow-2xl transition-all hover:shadow-purple-500/20 group">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="space-y-6 max-w-2xl">
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-sm font-bold tracking-wide uppercase text-emerald-100">{t.roles.TEACHER}</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                            {t.welcome}, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                {(session.user as any).name}
                            </span>
                        </h1>
                        <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-xl">
                            {dir === 'rtl'
                                ? 'به پنل مدیریت خوش آمدید. امروز چه کارهایی برای انجام دارید؟ وضعیت شاگردان و صنوف خود را بررسی کنید.'
                                : 'Welcome back. What is on your agenda today? Check your students and classes.'}
                        </p>
                    </div>
                </div>

                {/* Modern Abstract Animated Background */}
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-blob"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                    <div className="absolute top-[20%] left-[30%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
                </div>

                {/* Floating Icons for Aesthetic */}
                <div className="absolute right-20 top-20 opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
                    <BookOpen size={120} className="rotate-12" />
                </div>
                <div className="absolute left-40 bottom-10 opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
                    <GraduationCap size={150} className="-rotate-12" />
                </div>

                {/* Glass Cards in Hero */}
                <div className={`absolute bottom-10 ${dir === 'rtl' ? 'left-10' : 'right-10'} hidden md:flex gap-4`}>
                    <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center min-w-[140px] shadow-2xl">
                        <span className="text-4xl font-black text-white">
                            {new Date().toLocaleDateString(dir === 'rtl' ? 'fa-AF-u-ca-persian' : 'en-US', { day: 'numeric' })}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-slate-300 mt-1">
                            {new Date().toLocaleDateString(dir === 'rtl' ? 'fa-AF-u-ca-persian' : 'en-US', { month: 'long' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notification Banner (SuperAdmin Msg) */}
            {superadminMsg && (
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-rose-500 to-orange-500 p-1 shadow-xl transform transition-all hover:scale-[1.01]">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.3rem] p-6 flex items-start sm:items-center gap-6 relative overflow-hidden">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <Bell size={28} className="animate-bounce" />
                        </div>
                        <div className="flex-1 z-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">
                                {dir === 'rtl' ? 'پیام مهم از مرکز (سوپرادمین)' : 'Important Message (SuperAdmin)'}
                            </h3>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                {superadminMsg.content}
                            </p>
                        </div>
                        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-rose-50 to-transparent dark:from-rose-900/10 pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* Notification Banner (Admin Msg) - Only show if teacher was created by an admin */}
            {adminMsg && hasCreator && (
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-500 to-teal-500 p-1 shadow-xl transform transition-all hover:scale-[1.01]">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.3rem] p-6 flex items-start sm:items-center gap-6 relative overflow-hidden">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <Bell size={28} className="animate-bounce" />
                        </div>
                        <div className="flex-1 z-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-1">
                                {dir === 'rtl' ? 'پیام مدیر مکتب' : 'School Manager Message'}
                            </h3>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                {adminMsg.content}
                            </p>
                        </div>
                        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-50 to-transparent dark:from-emerald-900/10 pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {quickActions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between min-h-[220px]"
                    >
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <action.icon size={32} />
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{action.title}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{action.desc}</p>
                        </div>

                        <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <span className="group-hover:mr-2 transition-all">{dir === 'rtl' ? 'مشاهده' : 'Open'}</span>
                            <ArrowRight size={14} className={`ml-1 transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* School Policy Card */}
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Info size={24} />
                            <h3 className="text-lg font-black uppercase tracking-widest">{dir === 'rtl' ? 'یادداشت سیستم' : 'System Note'}</h3>
                        </div>
                        <p className="text-slate-300 font-medium leading-relaxed">
                            {dir === 'rtl'
                                ? 'لطفا نمرات امتحانات را به موقع وارد نمایید. تغییرات در نمرات پس از تایید نهایی مدیر امکان پذیر نخواهد بود.'
                                : 'Please enter exam grades on time. Changes to grades will not be possible after final approval by the principal.'}
                        </p>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* Creator Info */}
                {creatorInfo && (
                    <div className="p-8 rounded-[2.5rem] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-slate-200">{dir === 'rtl' ? 'ایجاد شده توسط' : 'Created By'}</h4>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{creatorInfo.name}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                            {dir === 'rtl'
                                ? `حساب شما تحت نظارت ${creatorInfo.role} (${creatorInfo.name}) می‌باشد.`
                                : `Your account is managed by ${creatorInfo.role} (${creatorInfo.name}).`}
                        </p>
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
