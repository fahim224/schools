"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes"; // Added useTheme import
import {
    Users,
    GraduationCap,
    Clock,
    User,
    Calendar,
    ArrowRightLeft,
    ChevronLeft,
    Loader2,
    CheckCircle,
    XCircle,
    MapPin,
    Phone,
    BookOpen,
    Layers
} from "lucide-react";

export default function ParentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, language, dir } = useLanguage(); // Destructure dir from useLanguage
    const pt = t.parent_dashboard; // Access parent_dashboard translations
    const { theme, setTheme } = useTheme(); // Use useTheme hook

    const toPersianNum = (n: string | number | undefined | null) => {
        if (n === undefined || n === null || n === "") return "";
        if (language === 'en') return String(n);
        return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
    };

    const [children, setChildren] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"children" | "grades" | "logs" | "messages">("children");
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "PARENT") {
            router.push("/");
        }

        if (session && (session.user as any).role === "PARENT") {
            fetchData();
        }
    }, [status, session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [childRes, msgRes] = await Promise.all([
                fetch("/api/parent/children"),
                fetch("/api/messages")
            ]);

            if (childRes.ok) {
                const data = await childRes.json();
                setChildren(data);
                if (data.length > 0) setSelectedChildId(data[0].id);
            }

            if (msgRes.ok) {
                setMessages(await msgRes.json());
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className={`flex h-screen items-center justify-center bg-background`}>
                <div className="relative h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <div className="absolute inset-4 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin animate-reverse-spin"></div>
                </div>
            </div>
        );
    }

    if (!session || (session.user as any).role !== "PARENT") return null;

    const selectedChild = children.find(c => c.id === selectedChildId);

    return (
        <div className="min-h-screen bg-background pb-20 transition-colors duration-500" dir={dir}>
            <style jsx global>{`
                @keyframes reverse-spin {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-reverse-spin {
                    animation: reverse-spin 1.5s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.4);
                }
            `}</style>

            {/* Ambient Background - Subtle on Light, Deep on Dark */}
            <div className="fixed -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="fixed bottom-0 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[120px] animate-pulse pointer-events-none"></div>

            <div className="container mx-auto px-4 pt-8 md:px-8 max-w-7xl">
                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 p-2">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 animate-pulse px-1">
                            <Layers size={14} />
                            {pt.panel_title}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mt-2">
                            {t.welcome}، <span className="text-indigo-600 dark:text-indigo-400">{(session.user as any).name}</span>
                        </h1>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mt-2">
                            <span className="flex items-center gap-1.5"><Phone size={14} className="text-indigo-500" /> {toPersianNum((session.user as any).phone || "---")}</span>
                            <span className="h-1 w-1 rounded-full bg-border"></span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500" /> {toPersianNum(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-AF'))}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Children Selector chips */}
                        <div className="flex items-center gap-2 p-1.5 bg-secondary/50 border border-border rounded-[2rem] backdrop-blur-xl">
                            {children.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChildId(child.id)}
                                    className={`relative group h-14 w-14 rounded-full border-2 transition-all duration-300 overflow-hidden ${selectedChildId === child.id ? 'border-indigo-500 scale-110 shadow-2xl z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                >
                                    {child.image ? (
                                        <img src={child.image} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl italic uppercase">
                                            {child.name[0]}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            ))}
                        </div>

                        <div className="px-6 py-3 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{pt.children_count} </span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-2xl leading-none">{toPersianNum(children.length)}</span>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-3 p-2 bg-secondary/30 border border-border rounded-[2.5rem] backdrop-blur-xl relative z-10 w-full max-w-5xl mx-auto shadow-2xl shadow-indigo-500/5">
                    {[
                        { id: "children", icon: User, label: pt.student_info },
                        { id: "grades", icon: GraduationCap, label: pt.grades_results },
                        { id: "logs", icon: Clock, label: pt.gate_logs },
                        { id: "messages", icon: ArrowRightLeft, label: pt.school_announcements }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center justify-center gap-3 py-4 rounded-[2.2rem] font-bold text-sm md:text-base transition-all duration-500 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? "animate-bounce" : ""} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Dashboard Content */}
                <main className="relative z-10">
                    {activeTab === "children" && selectedChild && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {/* Profile Card */}
                            <div className="lg:col-span-4">
                                <section className="p-10 rounded-[3.5rem] bg-card border border-border shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-transparent"></div>
                                    <div className="flex flex-col items-center">
                                        <div className="h-48 w-48 rounded-[3.5rem] bg-indigo-500/5 dark:bg-indigo-500/10 border-4 border-indigo-500/10 dark:border-indigo-500/20 p-2 flex items-center justify-center overflow-hidden mb-8 group-hover:rotate-1 transition-transform duration-700">
                                            {selectedChild.image ? (
                                                <img src={selectedChild.image} className="h-full w-full object-cover rounded-[3rem]" />
                                            ) : (
                                                <User size={100} className="text-indigo-500/30" />
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black text-foreground">{selectedChild.name}</h2>
                                        <div className="mt-4 px-8 py-2.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-500/10 shadow-sm leading-none flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_indigo]"></div>
                                            {selectedChild.currentClass?.level} - {selectedChild.currentClass?.section}
                                        </div>

                                        <div className="mt-12 grid grid-cols-1 gap-4 w-full">
                                            <div className="p-6 rounded-3xl bg-secondary/30 border border-border flex items-center justify-between group/item">
                                                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{pt.student_id}</div>
                                                <div className="text-foreground font-black text-xl tracking-[0.2em] group-hover/item:text-indigo-500 transition-colors">{toPersianNum(selectedChild.studentId)}</div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-secondary/30 border border-border flex items-center justify-between group/item">
                                                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{pt.academic_status}</div>
                                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black text-lg">
                                                    <div className="relative h-2.5 w-2.5">
                                                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40"></div>
                                                        <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                                                    </div>
                                                    {pt.studying}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Info Section */}
                            <div className="lg:col-span-8">
                                <section className="p-12 rounded-[3.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-2xl h-full relative overflow-hidden">
                                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl"></div>
                                    <h3 className="text-2xl font-black text-foreground mb-12 flex items-center gap-5">
                                        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-xl shadow-indigo-500/5">
                                            <BookOpen size={28} />
                                        </div>
                                        {pt.system_records}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                        {[
                                            { label: pt.father_name, value: selectedChild.fatherName },
                                            { label: pt.grandfather_name, value: selectedChild.grandfatherName },
                                            { label: pt.tazkira_id, value: toPersianNum(selectedChild.tazkiraNo) },
                                            { label: pt.english_name, value: selectedChild.nameEn },
                                            { label: pt.permanent_address, value: selectedChild.permanentAddress },
                                            { label: pt.current_address, value: selectedChild.currentAddress },
                                        ].map((info, i) => (
                                            <div key={i} className="space-y-3 group/info">
                                                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 group-hover/info:text-indigo-500 transition-colors flex items-center gap-2">
                                                    <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
                                                    {info.label}
                                                </div>
                                                <div className="bg-secondary/40 border border-border rounded-2xl px-6 py-5 text-foreground font-bold group-hover/info:bg-indigo-500/5 group-hover/info:border-indigo-500/20 transition-all text-lg shadow-sm">
                                                    {info.value || "---"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === "grades" && selectedChild && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 max-w-6xl mx-auto">
                            <section className="p-12 rounded-[4rem] bg-card/60 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px]"></div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4">
                                    <h3 className="text-3xl font-black text-foreground flex items-center gap-6">
                                        <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 shadow-2xl shadow-emerald-500/10">
                                            <GraduationCap size={32} />
                                        </div>
                                        {pt.grades_results}
                                    </h3>
                                    <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-black border border-emerald-500/10 flex items-center gap-3">
                                        <Clock size={16} />
                                        {pt.last_update} {toPersianNum(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fa-AF'))}
                                    </div>
                                </div>

                                {selectedChild.grades?.length > 0 ? (
                                    <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
                                        <table className="w-full text-right md:text-center border-separate border-spacing-y-6">
                                            <thead>
                                                <tr className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] px-4">
                                                    <th className="pb-4 pr-10 text-right">{pt.subject}</th>
                                                    <th className="pb-4">{pt.exam_type}</th>
                                                    <th className="pb-4">{pt.score}</th>
                                                    <th className="pb-4">{pt.status}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedChild.grades.map((grade: any, i: number) => (
                                                    <tr key={i} className="group/grade transition-all hover:translate-y-[-2px]">
                                                        <td className="bg-secondary/40 border-r-8 border-emerald-500 rounded-r-[2.5rem] py-8 pr-10">
                                                            <div className="font-black text-foreground text-2xl">{grade.subject?.name}</div>
                                                            <div className="text-xs text-muted-foreground font-black mt-3 flex items-center gap-2 group-hover/grade:text-emerald-500 transition-colors">
                                                                <Calendar size={14} className="opacity-50" />
                                                                {pt.year_academic} {toPersianNum(grade.academicYear)}
                                                            </div>
                                                        </td>
                                                        <td className="bg-secondary/40 text-center">
                                                            <span className="px-6 py-2.5 rounded-2xl bg-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground border border-border">
                                                                {grade.type === "MIDTERM" ? pt.midterm_exam : pt.final_exam}
                                                            </span>
                                                        </td>
                                                        <td className="bg-secondary/40 text-center">
                                                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-3xl border border-emerald-500/20 group-hover/grade:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                                                                {toPersianNum(grade.score)}
                                                            </div>
                                                        </td>
                                                        <td className="bg-secondary/40 rounded-l-[2.5rem] text-center">
                                                            {grade.score >= 20 ? (
                                                                <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm border border-emerald-500/20 shadow-md">
                                                                    <CheckCircle size={18} />
                                                                    {pt.pass}
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-red-500/20 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black text-sm border border-red-500/20 shadow-md">
                                                                    <XCircle size={18} />
                                                                    {pt.fail}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-40 text-center space-y-8 animate-pulse text-muted-foreground/30">
                                        <GraduationCap size={100} className="mx-auto" />
                                        <div className="text-2xl font-black">{pt.no_results}</div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === "logs" && selectedChild && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 max-w-5xl mx-auto">
                            <section className="p-12 rounded-[4rem] bg-card/60 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[120px]"></div>
                                <h3 className="text-3xl font-black text-foreground mb-16 flex items-center gap-6 px-4">
                                    <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-2xl shadow-amber-500/10">
                                        <Clock size={32} />
                                    </div>
                                    {pt.live_monitoring}
                                </h3>

                                {selectedChild.gateLogs?.length > 0 ? (
                                    <div className={`relative space-y-8 before:absolute ${dir === 'rtl' ? 'before:right-[39px]' : 'before:left-[39px]'} before:top-4 before:bottom-4 before:w-1 before:bg-secondary rounded-[3rem] px-4`}>
                                        {selectedChild.gateLogs.map((log: any, i: number) => (
                                            <div key={i} className={`relative ${dir === 'rtl' ? 'pr-24' : 'pl-24'} group/log`}>
                                                <div className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-6 h-12 w-12 rounded-[1.2rem] flex items-center justify-center z-10 border-4 border-card transition-all duration-500 group-hover/log:scale-125 shadow-2xl ${log.type === "ENTRY" ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-amber-500 text-white shadow-amber-500/30"}`}>
                                                    {log.type === "ENTRY" ? <ArrowRightLeft size={20} className="rotate-180" /> : <ArrowRightLeft size={20} />}
                                                </div>
                                                <div className="p-10 rounded-[3rem] bg-secondary/30 border border-border hover:bg-secondary/50 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className={`text-2xl font-black ${log.type === "ENTRY" ? "text-emerald-500" : "text-amber-500"}`}>
                                                                {log.type === "ENTRY" ? pt.entry_school : pt.exit_school}
                                                            </span>
                                                            <span className="px-4 py-1 rounded-xl bg-indigo-500/20 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border border-indigo-500/20">
                                                                {pt.confirmed}
                                                            </span>
                                                        </div>
                                                        <div className="text-muted-foreground font-bold flex flex-wrap items-center gap-6 text-sm">
                                                            <span className="flex items-center gap-2.5 bg-background/50 px-4 py-1.5 rounded-full border border-border/40 text-indigo-500"><Calendar size={16} /> {toPersianNum(new Date(log.timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-AF', { weekday: 'long', day: 'numeric', month: 'long' }))}</span>
                                                            <span className="flex items-center gap-2.5 bg-background/50 px-4 py-1.5 rounded-full border border-border/40 text-emerald-500"><Clock size={16} /> {toPersianNum(new Date(log.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-AF', { hour: '2-digit', minute: '2-digit' }))}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 px-8 py-5 rounded-[2rem] bg-background/40 border border-border shadow-inner group-hover/log:border-indigo-500/20 transition-all">
                                                        <MapPin size={24} className="text-indigo-500 animate-bounce" />
                                                        <div>
                                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">GATE LOCATION</div>
                                                            <div className="text-foreground font-black text-base">{pt.gate_location}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-40 text-center space-y-8 text-muted-foreground/30">
                                        <div className="h-28 w-28 rounded-full bg-secondary flex items-center justify-center mx-auto opacity-40">
                                            <Clock size={60} />
                                        </div>
                                        <div className="text-2xl font-black">{pt.no_logs}</div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === "messages" && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto">
                            <section className="p-12 rounded-[4rem] bg-card/60 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                <h3 className="text-3xl font-black text-foreground mb-16 flex items-center gap-6 px-4">
                                    <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500 shadow-2xl shadow-blue-500/10">
                                        <ArrowRightLeft size={32} className="rotate-90" />
                                    </div>
                                    {pt.official_notifications}
                                </h3>

                                {messages.length > 0 ? (
                                    <div className="space-y-8">
                                        {messages.map((msg: any, i: number) => (
                                            <article key={i} className="p-10 rounded-[3.5rem] bg-secondary/30 border border-border hover:border-indigo-500/40 transition-all duration-500 group/msg shadow-sm">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 rounded-2xl bg-background overflow-hidden border border-border shadow-md group-hover/msg:scale-105 transition-transform duration-500">
                                                            {msg.sender?.image ? (
                                                                <img src={msg.sender.image} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center font-black text-muted-foreground uppercase text-xl italic">{msg.sender?.name?.[0]}</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-xl font-black text-foreground group-hover/msg:text-indigo-500 transition-colors">{msg.sender?.name}</div>
                                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-pashto">{msg.sender?.role}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-black text-muted-foreground flex items-center gap-2.5 bg-background/50 px-5 py-2 rounded-full border border-border">
                                                        <Clock size={16} className="text-blue-500" />
                                                        {toPersianNum(new Date(msg.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-AF'))}
                                                    </div>
                                                </div>
                                                <div className={`text-foreground/90 text-lg md:text-xl leading-[2.2] font-medium pr-6 ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-indigo-500/30 group-hover/msg:border-indigo-500 transition-all`}>
                                                    {msg.content}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-40 text-center space-y-8 text-muted-foreground/30">
                                        <div className="h-28 w-28 rounded-[2.5rem] bg-secondary flex items-center justify-center mx-auto opacity-40">
                                            <ArrowRightLeft size={60} className="rotate-90" />
                                        </div>
                                        <div className="text-2xl font-black">{pt.no_messages}</div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </main>

                {/* Dashboard Footer Note */}
                <footer className="mt-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-secondary/50 border border-border/60 backdrop-blur-xl text-muted-foreground font-bold text-sm md:text-base shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <span>در صورت اشتباه اسامی و یا هر گونه مشکلی به مکتب مراجعه نمائید.</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
