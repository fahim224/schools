"use client";

import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import {
    QrCode,
    UserCircle,
    Calendar,
    Clock,
    ShieldCheck,
    Camera,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import DashboardClock from "@/components/DashboardClock";

export default function StaffDashboard() {
    const { data: session } = useSession();
    const { t, dir } = useLanguage();

    const userName = session?.user?.name || "Staff Member";

    return (
        <div className="font-sans">
            {/* Header Section */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-start">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">
                        {dir === 'rtl' ? 'داشبورد کارمند' : 'Staff Dashboard'}
                    </h2>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        {dir === 'rtl' ? `خوش آمدید، ${userName}` : `Welcome, ${userName}`}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <DashboardClock />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Scanning Action Card */}
                <div className="lg:col-span-2">
                    <div className="relative group h-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-2xl shadow-cyan-500/20 transition-all hover:scale-[1.01]">
                        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-white dark:bg-slate-900 p-8 md:p-12 text-start">
                            {/* Decorative Elements */}
                            <div className={`absolute ${dir === 'rtl' ? '-left-20' : '-right-20'} -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all`}></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 shadow-inner">
                                    <QrCode size={40} />
                                </div>

                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                                    {dir === 'rtl' ? 'اسکن بارکد شاگرد' : 'Scan Student Barcode'}
                                </h3>
                                <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-md">
                                    {dir === 'rtl'
                                        ? 'برای بررسی هویت و ثبت حضور شاگردان، از دوربین گوشی استفاده کنید.'
                                        : 'Use your device camera to verify student identity and register attendance.'}
                                </p>

                                <div className="mt-auto">
                                    <Link
                                        href="/scan-qr"
                                        className="group/btn relative inline-flex items-center gap-3 md:gap-4 px-6 md:px-10 py-4 md:py-5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-lg md:text-xl shadow-xl shadow-cyan-500/30 transition-all hover:translate-x-2 active:scale-95 w-full md:w-auto justify-center"
                                    >
                                        <Camera size={20} className="md:w-6 md:h-6" />
                                        {dir === 'rtl' ? 'شروع اسکن' : 'Start Scanning'}
                                        <ArrowRight size={24} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`} />
                                    </Link>
                                </div>
                            </div>

                            {/* Floating QR Visual */}
                            <div className={`absolute top-1/2 ${dir === 'rtl' ? 'left-12' : 'right-12'} -translate-y-1/2 hidden md:block opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <QrCode size={240} strokeWidth={0.5} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info Cards */}
                <div className="space-y-6">
                    {/* User Profile Summary */}
                    <div className="p-8 rounded-[2rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl">
                        <div className="flex items-center gap-4 mb-6 text-start">
                            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                <UserCircle size={40} />
                            </div>
                            <div className="text-start">
                                <p className="text-xs font-black text-primary uppercase tracking-widest">{dir === 'rtl' ? 'نقش شما' : 'Your Role'}</p>
                                <p className="text-xl font-black uppercase text-foreground">{dir === 'rtl' ? 'کارمند' : 'Staff'}</p>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-border/50 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <ShieldCheck size={16} /> {dir === 'rtl' ? 'وضعیت' : 'Status'}
                                </span>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full font-black text-[10px] uppercase tracking-wider">
                                    {dir === 'rtl' ? 'فعال' : 'Active'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Clock size={16} /> {dir === 'rtl' ? 'نوبت کاری' : 'Shift'}
                                </span>
                                <span className="font-bold text-foreground">
                                    {dir === 'rtl' ? 'تمام وقت' : 'Full Time'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats/Info */}
                    <div className="p-8 rounded-[2rem] bg-slate-900 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
                        <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-cyan-400" />
                            {dir === 'rtl' ? 'تاریخ امروز' : "Today's Date"}
                        </h4>
                        <p className="text-3xl font-black text-cyan-400 mb-2">
                            {new Date().toLocaleDateString(dir === 'rtl' ? 'fa-AF' : 'en-US', { weekday: 'long' })}
                        </p>
                        <p className="text-slate-400 font-bold">
                            {new Date().toLocaleDateString(dir === 'rtl' ? 'fa-AF' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Tips or Help */}
            <div className="mt-12 p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 text-start">
                <h4 className="text-xl font-black text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2">
                    <ShieldCheck size={24} />
                    {dir === 'rtl' ? 'راهنمای امنیتی' : 'Security Guide'}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {dir === 'rtl'
                        ? 'فقط شاگردانی را اسکن کنید که مربوط به همین مکتب باشند. در صورت مشاهده هرگونه مغایرت در اطلاعات شاگرد، موضوع را فوراً به مدیر مکتب گزارش دهید.'
                        : 'Only scan students who belong to this school. If you notice any discrepancies in the student information, report it immediately to the school principal.'}
                </p>
            </div>
        </div>
    );
}
