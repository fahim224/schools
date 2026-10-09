"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Bell,
    BookOpen,
    Calendar,
    Clock,
    GraduationCap,
    LayoutDashboard,
    TrendingUp,
    User,
    Award,
    ChevronRight,
    Loader2,
    CalendarCheck,
    AlertCircle,
    CheckCircle2,
    BookMarked,
    ArrowRight,
    Search,
    Fingerprint,
    ShieldCheck,
    Lock,
    Key,
    UserCircle,
    Info,
    MapPin,
    Home,
    Smartphone,
    XCircle,
    ArrowLeftRight
} from "lucide-react";
import DashboardClock from "@/components/DashboardClock";

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir, language } = useLanguage();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, grades, attendance, logs, profile
    const [selectedYear, setSelectedYear] = useState("1404");

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [passMsg, setPassMsg] = useState({ type: "", text: "" });
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "STUDENT") {
            router.push("/");
        } else if (session) {
            fetchDashboardData(selectedYear);
        }
    }, [status, session, router, selectedYear]);

    const fetchDashboardData = async (year: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/student/dashboard?year=${year}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
                // If no data for initial year but other years exist, switch to latest
                if (year === "1404" && result.allYears?.length > 0 && !result.allYears.includes("1404")) {
                    setSelectedYear(result.allYears[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassMsg({ type: "error", text: "New passwords do not match" });
            return;
        }

        setPassLoading(true);
        setPassMsg({ type: "", text: "" });

        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });
            const result = await res.json();
            if (res.ok) {
                setPassMsg({ type: "success", text: t.dashboards.password_change_success });
                setPasswords({ current: "", new: "", confirm: "" });
                setTimeout(() => setShowPasswordChange(false), 2000);
            } else {
                setPassMsg({ type: "error", text: result.message });
            }
        } catch (err) {
            setPassMsg({ type: "error", text: "Failed to change password" });
        } finally {
            setPassLoading(false);
        }
    };

    const toPersianNum = (n: any) => {
        if (!n && n !== 0) return "";
        if (language === 'en') return n;
        const p = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return n.toString().replace(/\d/g, (x: any) => p[parseInt(x)]);
    };

    if (status === "loading" || loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm font-black text-muted-foreground animate-pulse tracking-widest">{t.dashboards.loading_students}</p>
                </div>
            </div>
        );
    }

    if (!session || (session.user as any).role !== "STUDENT" || !data) return null;

    const { student, currentYearClass, allYears, messages } = data;
    const grades = student.grades || [];
    const attendance = student.attendance || [];
    const gateLogs = student.gateLogs || [];

    // Calculate overall statistics
    const midtermGrades = grades.filter((g: any) => g.type === 'MIDTERM');
    const finalGrades = grades.filter((g: any) => g.type === 'FINAL');

    const calculateAverage = (gradeList: any[]) => {
        if (gradeList.length === 0) return 0;
        const total = gradeList.reduce((acc, curr: any) => acc + curr.score, 0);
        return (total / gradeList.length).toFixed(1);
    };

    const midtermAvg = calculateAverage(midtermGrades);
    const finalAvg = calculateAverage(finalGrades);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden selection:bg-primary/20" dir={dir}>
            {/* Background Animations */}
            <style jsx global>{`
                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(10px, -20px) rotate(5deg); }
                    66% { transform: translate(-15px, 15px) rotate(-5deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                .bg-blob {
                    position: fixed;
                    filter: blur(80px);
                    z-index: 0;
                    opacity: 0.15;
                    border-radius: 50%;
                    pointer-events: none;
                }
            `}</style>

            <div className={`bg-blob w-[500px] h-[500px] bg-primary -top-40 ${dir === 'rtl' ? '-right-20' : '-left-20'} animate-[float_15s_infinite_ease-in-out]`}></div>
            <div className={`bg-blob w-[400px] h-[400px] bg-blue-600 -bottom-20 ${dir === 'rtl' ? '-left-20' : '-right-20'} animate-[float_20s_infinite_linear]`}></div>
            <div className={`bg-blob w-[300px] h-[300px] bg-cyan-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 animate-[float_25s_infinite_ease-in-out_reverse]`}></div>

            <div className="container mx-auto px-4 pt-8 md:px-8 max-w-7xl relative z-10">
                {/* Header */}
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="space-y-4 text-start">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            {(t.dashboards as any).student}
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tighter mt-2 leading-[1.1]">
                            {t.welcome}، <br className="md:hidden" />
                            <span className="bg-gradient-to-r from-primary via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                {student.name}
                            </span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground">
                            <span className="flex items-center gap-2 bg-card/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-sm">
                                <Calendar size={18} className="text-primary" />
                                {toPersianNum(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-AF'))}
                            </span>
                            <span className="flex items-center gap-2 bg-card/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-sm">
                                <Clock size={18} className="text-primary" />
                                <DashboardClock />
                            </span>

                            {/* Academic Year Selector */}
                            <div className="relative group">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="appearance-none bg-primary text-white font-black px-8 py-2 rounded-2xl border border-primary outline-none focus:ring-4 focus:ring-primary/20 transition-all cursor-pointer shadow-lg shadow-primary/20"
                                >
                                    {allYears?.length > 0 ? (
                                        allYears.map((y: string) => (
                                            <option key={y} value={y} className="text-foreground bg-background">سال تعلیمی {toPersianNum(y)}</option>
                                        ))
                                    ) : (
                                        <option value="1404">سال تعلیمی {toPersianNum(1404)}</option>
                                    )}
                                </select>
                                <div className={`absolute top-1/2 ${dir === 'rtl' ? 'left-3' : 'right-3'} -translate-y-1/2 pointer-events-none text-white`}>
                                    <ChevronRight size={16} className={`${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center gap-6 p-5 bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] shadow-2xl transition-all hover:translate-y-[-4px]">
                            <div className="h-20 w-20 rounded-[1.8rem] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-primary/20 overflow-hidden relative group/img">
                                {student.image ? (
                                    <img src={student.image} alt={student.name} className="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-125" />
                                ) : (
                                    <User size={40} className="text-white" />
                                )}
                            </div>
                            <div className="text-start pr-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{(t.dashboards as any).class_identity || "Identity Card"}</p>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-foreground">{currentYearClass ? currentYearClass.name : (t.dashboards as any).no_data_for_year}</span>
                                    <span className="text-sm font-bold text-muted-foreground">{currentYearClass ? t.levels[currentYearClass.level] || currentYearClass.level : "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Tabs */}
                <nav className="flex flex-wrap gap-2 mb-10 p-2 bg-card/40 backdrop-blur-xl rounded-[2rem] w-fit border border-border shadow-inner">
                    {[
                        { id: 'overview', label: t.dashboard, icon: LayoutDashboard },
                        { id: 'grades', label: (t.dashboards as any).grades, icon: Award },
                        { id: 'attendance', label: (t.dashboards as any).attendance, icon: CalendarCheck },
                        { id: 'logs', label: (t.dashboards as any).gate_logs, icon: ArrowLeftRight },
                        { id: 'profile', label: (t.dashboards as any).profile, icon: UserCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content Areas */}
                <div className="relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-[3rem]">
                            <Loader2 size={64} className="animate-spin text-primary" />
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-700">
                            {/* Empty State Check */}
                            {!currentYearClass && !grades.length ? (
                                <div className="lg:col-span-3 flex flex-col items-center justify-center p-20 bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl border-dashed">
                                    <div className="relative mb-8">
                                        <div className="h-32 w-32 bg-primary/10 rounded-full animate-ping absolute"></div>
                                        <div className="h-32 w-32 bg-primary/5 rounded-full flex items-center justify-center relative z-10">
                                            <Search size={64} className="text-primary/40" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black mb-2">{(t.dashboards as any).no_data_for_year}</h2>
                                    <p className="text-muted-foreground font-bold tracking-wide italic">لطفا سال تعلیمی دیگری را انتخاب نمایید</p>
                                </div>
                            ) : (
                                <>
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="group p-8 rounded-[3rem] bg-card/40 backdrop-blur-md border border-border hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden">
                                                <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} p-4 opacity-[0.03] group-hover:opacity-10 transition-all rotate-12`}>
                                                    <Award size={200} />
                                                </div>
                                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
                                                    <TrendingUp size={32} />
                                                </div>
                                                <h3 className="text-xl font-black mb-2 text-start">{"اوسط نمرات کل"}</h3>
                                                <div className="flex items-baseline gap-3 text-start">
                                                    <p className="text-6xl font-black tracking-tighter">{toPersianNum(finalAvg || midtermAvg || 0)}</p>
                                                    <span className="text-sm font-bold text-muted-foreground uppercase opacity-60">نمره</span>
                                                </div>
                                                <div className="mt-6 flex items-center gap-2 text-xs font-black text-emerald-500 bg-emerald-500/10 w-fit px-4 py-1.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle2 size={16} />
                                                    {"پیشرفت بسیار عالی"}
                                                </div>
                                            </div>

                                            <div className="group p-8 rounded-[3rem] bg-card/40 backdrop-blur-md border border-border hover:border-blue-500/50 transition-all shadow-2xl relative overflow-hidden">
                                                <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} p-4 opacity-[0.03] group-hover:opacity-10 transition-all -rotate-12`}>
                                                    <Fingerprint size={200} />
                                                </div>
                                                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 shadow-inner">
                                                    <ShieldCheck size={32} />
                                                </div>
                                                <h3 className="text-xl font-black mb-2 text-start">{"فیصدی حاضری"}</h3>
                                                {attendance.length > 0 ? (
                                                    <div className="text-start">
                                                        <p className="text-6xl font-black tracking-tighter">
                                                            {toPersianNum(Math.round((attendance[0].present / attendance[0].days) * 100))}%
                                                        </p>
                                                        <div className="mt-4 flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                                                    style={{ width: `${(attendance[0].present / attendance[0].days) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-muted-foreground">{toPersianNum(attendance[0].present)} / {toPersianNum(attendance[0].days)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="py-2 text-start">
                                                        <p className="text-lg font-bold text-muted-foreground italic">دیتایی یافت نشد</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[3rem] bg-card/30 backdrop-blur-xl border border-border shadow-2xl">
                                            <h4 className="text-2xl font-black flex items-center gap-3 mb-8 text-start">
                                                <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <BookOpen size={20} />
                                                </div>
                                                {(t.dashboards as any).subjects}
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                                {currentYearClass?.subjects?.map((sub: any, idx: number) => {
                                                    const grade = grades.find((g: any) => g.subjectId === sub.id);
                                                    return (
                                                        <div key={idx} className="group p-5 rounded-[2rem] bg-background/50 border border-border hover:border-primary/50 transition-all text-center space-y-4 hover:translate-y-[-4px] shadow-sm">
                                                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
                                                                <BookMarked size={24} />
                                                            </div>
                                                            <p className="text-sm font-black truncate px-2">{sub.name}</p>
                                                            <div className="pt-2">
                                                                {grade ? (
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        <span className="text-xs font-black text-primary uppercase">{toPersianNum(grade.score)} نمره</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-muted-foreground opacity-40 italic">بدون نمره</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Announcements */}
                                        <div className="p-8 rounded-[3.5rem] bg-gradient-to-br from-primary via-blue-700 to-indigo-900 shadow-2xl shadow-primary/40 relative overflow-hidden text-white min-h-[400px] flex flex-col">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse">
                                                <Bell size={180} />
                                            </div>
                                            <div className="relative z-10 flex-1 flex flex-col items-start text-start">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                                        <Bell size={24} className="animate-bounce" />
                                                    </div>
                                                    <h3 className="text-2xl font-black uppercase tracking-tighter">{(t.dashboards as any).announcements}</h3>
                                                </div>
                                                <div className="space-y-4 w-full flex-1">
                                                    {messages?.length > 0 ? (
                                                        messages.map((m: any, i: number) => (
                                                            <div key={i} className="p-5 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/10 hover:bg-white/15 transition-all text-start group">
                                                                <p className="text-sm font-bold leading-relaxed">{m.content}</p>
                                                                <div className="mt-4 flex items-center justify-between opacity-60">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-white/20"></div>
                                                                        <span className="text-[10px] uppercase font-black">{m.sender?.name}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold">{toPersianNum(new Date(m.createdAt).toLocaleDateString())}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center opacity-40 italic space-y-4">
                                                            <Info size={48} />
                                                            <p>هیچ اعلانی یافت نشد</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Student Information Card (Replaced Hours) */}
                                        <div className="p-8 rounded-[3rem] bg-card/60 backdrop-blur-xl border border-border shadow-2xl text-start space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xl font-black flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                                        <UserCircle size={18} />
                                                    </div>
                                                    {(t.dashboards as any).profile}
                                                </h4>
                                                <button onClick={() => setActiveTab('profile')} className="p-2 hover:bg-muted rounded-full transition-all">
                                                    <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                                                        <Lock size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">شماره شناسایی (اساس)</p>
                                                        <p className="text-sm font-black tracking-widest">{student.studentId || "---"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                                                        <Home size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">آدرس فعلی</p>
                                                        <p className="text-sm font-bold line-clamp-1">{student.currentAddress || "کابل، افغانستان"}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 mt-2">
                                                    <button
                                                        onClick={() => { setActiveTab('profile'); setShowPasswordChange(true); }}
                                                        className="w-full flex items-center justify-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary py-4 rounded-2xl font-black text-xs transition-all border border-primary/20 group"
                                                    >
                                                        <Key size={16} className="group-hover:rotate-12 transition-transform" />
                                                        {(t.dashboards as any).change_password}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'grades' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {!grades.length ? (
                                <div className="flex flex-col items-center justify-center p-32 bg-card/60 backdrop-blur-xl rounded-[4rem] border border-border border-dashed shadow-2xl">
                                    <div className="relative mb-12">
                                        <div className="absolute inset-0 bg-amber-500/20 blur-[40px] rounded-full animate-pulse"></div>
                                        <div className="h-32 w-32 bg-amber-500/10 rounded-full flex items-center justify-center relative z-10 border border-amber-500/20">
                                            <Award size={64} className="text-amber-500/40" />
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black mb-4">{(t.dashboards as any).no_history}</h2>
                                    <p className="text-muted-foreground font-medium text-lg max-w-md text-center">هنوز نمرات شما برای این سال تعلیمی در سیستم وارد نشده است.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-start">
                                    {/* Midterm */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 bg-amber-500/10 text-amber-600 px-6 py-4 rounded-[2rem] border border-amber-500/20 w-fit">
                                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                                                <TrendingUp size={20} />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tight">{dir === 'rtl' ? 'نتایج چهارونیم ماهه' : 'Midterm Results'}</h3>
                                        </div>

                                        <div className="bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl overflow-hidden">
                                            <div className="grid grid-cols-1 divide-y divide-border">
                                                {midtermGrades.length > 0 ? (
                                                    midtermGrades.map((g: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black text-muted-foreground/40 w-6">{(i + 1).toString().padStart(2, '0')}</span>
                                                                <p className="font-black text-lg group-hover:text-primary transition-colors">{g.subject?.name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`text-2xl font-black ${g.score >= 40 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {toPersianNum(g.score)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-20 text-center opacity-30 italic font-black">اطلاعاتی موجود نیست</div>
                                                )}
                                            </div>
                                            <div className="p-8 bg-amber-500/5 flex items-center justify-between border-t border-amber-500/10">
                                                <span className="text-lg font-black text-muted-foreground">اوسط دوره:</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-amber-600">{toPersianNum(midtermAvg)}</span>
                                                    <span className="text-sm font-bold opacity-60">/ ۱۰۰</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 bg-emerald-500/10 text-emerald-600 px-6 py-4 rounded-[2rem] border border-emerald-500/20 w-fit">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tight">{dir === 'rtl' ? 'نتایج نهایی سالانه' : 'Final Results'}</h3>
                                        </div>

                                        <div className="bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl overflow-hidden">
                                            <div className="grid grid-cols-1 divide-y divide-border">
                                                {finalGrades.length > 0 ? (
                                                    finalGrades.map((g: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black text-muted-foreground/40 w-6">{(i + 1).toString().padStart(2, '0')}</span>
                                                                <p className="font-black text-lg group-hover:text-primary transition-colors">{g.subject?.name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`text-2xl font-black ${g.score >= 40 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {toPersianNum(g.score)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-20 text-center opacity-30 italic font-black">امتحانات نهایی هنوز برگزار نشده یا ثبت نشده است</div>
                                                )}
                                            </div>
                                            <div className="p-8 bg-emerald-500/5 flex items-center justify-between border-t border-emerald-500/10">
                                                <span className="text-lg font-black text-muted-foreground">اوسط نهایی:</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-emerald-600">{toPersianNum(finalAvg)}</span>
                                                    <span className="text-sm font-bold opacity-60">/ ۱۰۰</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                            {attendance.length === 0 ? (
                                <div className="p-32 bg-card/60 backdrop-blur-xl rounded-[4rem] border border-border border-dashed shadow-2xl flex flex-col items-center">
                                    <div className="h-40 w-40 bg-blue-500/5 rounded-[3rem] flex items-center justify-center mb-8 rotate-12">
                                        <CalendarCheck size={80} className="text-blue-500/30" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-4">اطلاعات حاضری یافت نشد</h2>
                                    <p className="text-muted-foreground font-bold italic opacity-60">برای این سال تعلیمی هنوز گزارشی ثبت نشده است</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {attendance.map((att: any, i: number) => (
                                        <div key={i} className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-cyan-500 rounded-[3rem] blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                                            <div className="relative p-10 bg-card/80 backdrop-blur-2xl border border-border rounded-[3rem] shadow-2xl space-y-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1 text-start">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{att.type === 'MIDTERM' ? 'ترم اول' : 'ترم دوم'}</p>
                                                        <h4 className="text-2xl font-black">{att.type === 'MIDTERM' ? 'چهارونیم ماهه' : 'نهایی و سالانه'}</h4>
                                                    </div>
                                                    <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
                                                        <Calendar size={32} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    {[
                                                        { label: 'حاضر', val: att.present, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                                                        { label: 'غیرحاضر', val: att.absent, color: 'text-red-500', bg: 'bg-red-500/5' },
                                                        { label: 'رخصت', val: att.leave, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                                                        { label: 'مریض', val: att.sick, color: 'text-amber-500', bg: 'bg-amber-500/5' }
                                                    ].map((stat, idx) => (
                                                        <div key={idx} className={`${stat.bg} p-6 rounded-3xl border border-white/5 space-y-2 text-center shadow-lg`}>
                                                            <p className="text-xs font-black opacity-60 uppercase tracking-widest">{stat.label}</p>
                                                            <p className={`text-4xl font-black ${stat.color}`}>{toPersianNum(stat.val)}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-8 border-t border-border flex items-center justify-between">
                                                    <span className="text-lg font-black text-muted-foreground">مجموع کل روزها:</span>
                                                    <div className="px-6 py-2 bg-muted rounded-full font-black text-xl">{toPersianNum(att.days)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-left-8 duration-700">
                            {!gateLogs.length ? (
                                <div className="p-32 bg-card/60 backdrop-blur-xl rounded-[4rem] border border-border border-dashed shadow-2xl flex flex-col items-center">
                                    <div className="h-40 w-40 bg-purple-500/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                        <ArrowLeftRight size={80} className="text-purple-500/30" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-4">هیچ گزارش ترددی ثبت نشده است</h2>
                                    <p className="text-muted-foreground font-bold italic opacity-60 text-lg">تمام ورود و خروج های شما با QR کد در اینجا لیست خواهد شد</p>
                                </div>
                            ) : (
                                <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[3.5rem] shadow-2xl overflow-hidden p-6 md:p-10">
                                    <div className="flex items-center justify-between mb-8 px-4">
                                        <h3 className="text-2xl font-black flex items-center gap-4">
                                            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                                                <ArrowLeftRight size={24} />
                                            </div>
                                            گزارش دقیق تردد (Gate Logs)
                                        </h3>
                                        <div className="text-xs font-black text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl">
                                            تعداد کل: {toPersianNum(gateLogs.length)} مورد
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 divide-y divide-border/50">
                                        <div className="grid grid-cols-4 px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                            <div>نوع حرکت</div>
                                            <div>تاریخ و زمان</div>
                                            <div>ثبت شده توسط</div>
                                            <div className="text-center">وضعیت</div>
                                        </div>
                                        {gateLogs.map((log: any, idx: number) => (
                                            <div key={idx} className="grid grid-cols-4 px-6 py-8 items-center hover:bg-white/5 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${log.type === 'ENTRY' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' : 'bg-red-500/10 text-red-500 shadow-red-500/10'}`}>
                                                        {log.type === 'ENTRY' ? <ArrowRight size={24} className={dir === 'rtl' ? 'rotate-180' : ''} /> : <ArrowRight size={24} className={dir === 'rtl' ? '' : 'rotate-180'} />}
                                                    </div>
                                                    <span className="font-black text-lg">
                                                        {log.type === 'ENTRY' ? 'ورود به مکتب' : 'خروج از مکتب'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col text-start">
                                                    <span className="text-sm font-black">{toPersianNum(new Date(log.timestamp).toLocaleDateString())}</span>
                                                    <span className="text-xs font-bold text-muted-foreground">{toPersianNum(new Date(log.timestamp).toLocaleTimeString())}</span>
                                                </div>
                                                <div className="text-sm font-bold text-start text-muted-foreground">
                                                    {log.recordedBy?.name || "سیستم"}
                                                </div>
                                                <div className="flex justify-center">
                                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${log.type === 'ENTRY' ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20 text-white' : 'bg-slate-500 border-slate-500 shadow-md shadow-slate-500/20 text-white'}`}>
                                                        {log.type === 'ENTRY' ? 'داخل مکتب' : 'خارج شد'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Side Card: Basic Info & QR */}
                                <div className="space-y-8">
                                    <div className="p-10 bg-card/60 backdrop-blur-2xl border border-border rounded-[3.5rem] shadow-2xl flex flex-col items-center text-center group">
                                        <div className="relative mb-8">
                                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary via-blue-500 to-cyan-400 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition duration-700"></div>
                                            <div className="h-44 w-44 rounded-[3rem] bg-gradient-to-br from-primary to-blue-700 border-8 border-background p-1 shadow-2xl overflow-hidden relative z-10">
                                                {student.image ? (
                                                    <img src={student.image} alt={student.name} className="h-full w-full object-cover rounded-[2.5rem]" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-white text-6xl font-black">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black mb-2">{student.name} {student.surname}</h3>
                                        <p className="text-primary font-black tracking-widest text-sm uppercase opacity-80 mb-6">شماره اساس: {toPersianNum(student.studentId)}</p>

                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8"></div>

                                        <div className="w-full space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/30 border border-border">
                                                <span className="text-xs font-black text-muted-foreground uppercase opacity-60">وضعیت اکانت</span>
                                                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    فعال
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                                        className="w-full group p-6 bg-primary text-white rounded-[2.5rem] shadow-xl shadow-primary/20 flex items-center justify-between font-black transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                                <Key size={24} className="group-hover:rotate-45 transition-transform duration-500" />
                                            </div>
                                            <span className="text-lg">تغییر رمز عبور</span>
                                        </div>
                                        <ChevronRight size={24} className={`${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* Main Card: Detailed Profile & Forms */}
                                <div className="lg:col-span-2 space-y-8">
                                    {showPasswordChange ? (
                                        <div className="p-10 bg-card/60 backdrop-blur-2xl border border-primary/30 rounded-[3.5rem] shadow-2xl text-start animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center justify-between mb-10">
                                                <h4 className="text-3xl font-black flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                                                        <ShieldCheck size={28} />
                                                    </div>
                                                    تغییر رمز عبور امنیتی
                                                </h4>
                                                <button onClick={() => setShowPasswordChange(false)} className="p-4 hover:bg-muted rounded-full text-muted-foreground">
                                                    <XCircle size={24} />
                                                </button>
                                            </div>

                                            <form onSubmit={handlePasswordChange} className="space-y-8">
                                                {passMsg.text && (
                                                    <div className={`p-6 rounded-3xl font-black text-sm flex items-center gap-4 border shadow-sm animate-in fade-in slide-in-from-top-4 ${passMsg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                                        {passMsg.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                                        {passMsg.text}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 block">رمز عبور فعلی</label>
                                                        <div className="relative group/input">
                                                            <div className="absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground opacity-40 group-focus-within/input:text-primary transition-colors">
                                                                <Lock size={20} />
                                                            </div>
                                                            <input
                                                                type="password"
                                                                value={passwords.current}
                                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                                required
                                                                className="w-full bg-muted/30 border border-border rounded-[1.8rem] pl-14 pr-7 py-5 font-black text-lg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                                                placeholder="••••••••"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 block">رمز عبور جدید</label>
                                                            <div className="relative group/input">
                                                                <div className="absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground opacity-40 group-focus-within/input:text-primary transition-colors">
                                                                    <Key size={20} />
                                                                </div>
                                                                <input
                                                                    type="password"
                                                                    value={passwords.new}
                                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                                    required
                                                                    className="w-full bg-muted/30 border border-border rounded-[1.8rem] pl-14 pr-7 py-5 font-black text-lg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                                                    placeholder="••••••••"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 block">تکرار رمز عبور جدید</label>
                                                            <div className="relative group/input">
                                                                <div className="absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground opacity-40 group-focus-within/input:text-primary transition-colors">
                                                                    <Key size={20} />
                                                                </div>
                                                                <input
                                                                    type="password"
                                                                    value={passwords.confirm}
                                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                                    required
                                                                    className="w-full bg-muted/30 border border-border rounded-[1.8rem] pl-14 pr-7 py-5 font-black text-lg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                                                    placeholder="••••••••"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={passLoading}
                                                    className="w-full md:w-auto px-16 py-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-[1.8rem] font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                                                >
                                                    {passLoading ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={28} />}
                                                    بروزرسانی رمز عبور
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-card/60 backdrop-blur-2xl border border-border rounded-[3.5rem] shadow-2xl text-start space-y-12 animate-in fade-in duration-700">
                                            <div className="space-y-8">
                                                <h4 className="text-2xl font-black flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                                        <Info size={18} />
                                                    </div>
                                                    مشخصات سجلی و شخصی
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    {[
                                                        { label: 'نام کامل (دری)', val: student.name },
                                                        { label: 'نام پدر', val: student.fatherName },
                                                        { label: 'نام پدر کلان (ولدیت)', val: student.grandfatherName },
                                                        { label: 'تخلص', val: student.surname },
                                                        { label: 'نمبر تذکره', val: student.tazkiraNo },
                                                        { label: 'نام انگلیسی', val: student.nameEn, ltr: true },
                                                        { label: 'نام پدر (انگلیسی)', val: student.fatherNameEn, ltr: true },
                                                        { label: 'پدر کلان (انگلیسی)', val: student.grandfatherNameEn, ltr: true },
                                                        { label: 'تخلص انگلیسی', val: student.surnameEn, ltr: true },
                                                        { label: 'ایمیل آدرس', val: student.email, ltr: true },
                                                        { label: 'شماره تماس', val: student.phone, ltr: true }
                                                    ].map((item, id) => (
                                                        <div key={id} className="space-y-2 group">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">{item.label}</p>
                                                            <div className="p-5 border border-border bg-muted/30 rounded-2xl group-hover:border-primary/30 group-hover:bg-muted/50 transition-all">
                                                                <p className={`font-black text-lg ${item.ltr ? 'tracking-wider' : ''}`}>{item.val || "---"}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h4 className="text-2xl font-black flex items-center gap-4 border-t border-border pt-12">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                                                        <MapPin size={18} />
                                                    </div>
                                                    آدرس‌ها و سکونت
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-2 group">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">سکونت اصلی</p>
                                                        <div className="p-6 border border-border bg-muted/30 rounded-3xl min-h-[100px] font-bold group-hover:border-blue-500/30 transition-all">
                                                            {student.permanentAddress || "معلومات ثبت نشده است"}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 group">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">سکونت فعلی</p>
                                                        <div className="p-6 border border-border bg-muted/30 rounded-3xl min-h-[100px] font-bold group-hover:border-blue-500/30 transition-all">
                                                            {student.currentAddress || "معلومات ثبت نشده است"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
