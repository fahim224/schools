"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Calendar,
    User as UserIcon,
    Shield,
    Users,
    GraduationCap,
    RefreshCcw,
    FileText
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function GateLogsPage() {
    const { t, dir, language } = useLanguage();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("ALL");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterDate, setFilterDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Helper for Persian/Jalali dates without external library
    const formatJalali = (dateStr: string, includeTime = false) => {
        try {
            const date = new Date(dateStr);
            const locale = language === 'en' ? 'en-US' : (language === 'ps' ? 'ps-AF' : 'fa-AF');
            if (includeTime) {
                return new Intl.DateTimeFormat(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(date);
            }
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(date);
        } catch {
            return "---";
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== "ALL") params.append("type", filterType);
            if (filterRole !== "ALL") params.append("role", filterRole);
            if (filterDate) params.append("startDate", filterDate);

            const res = await fetch(`/api/admin/gate-logs?${params.toString()}`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterType, filterRole, filterDate]);

    // Local search filter
    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: filteredLogs.length,
        entries: filteredLogs.filter(l => l.type === "ENTRY").length,
        exits: filteredLogs.filter(l => l.type === "EXIT").length,
    };

    const exportToCSV = () => {
        const labels = {
            en: ["Name", "Father Name", "Grandfather Name", "Role", "Phone", "Email", "Type", "Time", "Date", "ID"],
            fa: ["نام", "ولد", "ولدیت", "نقش", "شماره تماس", "ایمیل آدرس", "نوع تردد", "زمان", "تاریخ", "آی دی"],
            ps: ["نوم", "پلار نوم", "نیکه نوم", "نقش", "د تلیفون شمیره", "بریښنالیک", "د تګ ډول", "وخت", "نیټه", "آی دی"]
        };

        const currentLangHeaders = (labels as any)[language || 'fa'] || labels.en;

        const rows = filteredLogs.map(log => [
            log.user.name || "---",
            log.user.fatherName || "---",
            log.user.grandfatherName || "---",
            log.user.role === 'STUDENT' ? (log.user.currentClass?.name || t.roles.STUDENT) : (log.user.jobTitle || t.roles[log.user.role as keyof typeof t.roles] || log.user.role),
            log.user.phone || "---",
            log.user.email || "---",
            log.type === "ENTRY" ? (dir === 'rtl' ? 'ورود' : 'Entry') : (dir === 'rtl' ? 'خروج' : 'Exit'),
            formatJalali(log.timestamp, true),
            formatJalali(log.timestamp),
            log.id
        ]);

        const csvContent = currentLangHeaders.join(",") + "\n"
            + rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

        // Use UTF-8 BOM for Excel compatibility with Persian/Pashto
        const BOM = "\ufeff";
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gate_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Label translations
    const getLabel = (key: string) => {
        const labels: any = {
            search: { en: "Search name...", fa: "جستجوی نام...", ps: "د نوم پلټنه..." },
            all_types: { en: "All Types", fa: "همه انواع", ps: "ټول ډولونه" },
            entry: { en: "Entry Only", fa: "فقط ورود", ps: "یوازې ننوتل" },
            exit: { en: "Exit Only", fa: "فقط خروج", ps: "یوازې وتل" },
            all_roles: { en: "All Roles", fa: "همه نقش‌ها", ps: "ټول رولونه" },
            students: { en: "Students", fa: "شاگردان", ps: "زده کوونکي" },
            teachers: { en: "Teachers", fa: "معلمین", ps: "ښوونکي" },
            staff: { en: "Staff", fa: "کارمندان", ps: "کارکونکي" },
            export: { en: "Export CSV", fa: "خروجی CSV", ps: "CSV ته صادرول" },
            date: { en: "Filter by Date", fa: "فیلتر بر اساس تاریخ", ps: "د نیټې له مخې فیلټر" },
            person: { en: "Person", fa: "نام شخص", ps: "شخص" },
            role: { en: "Role", fa: "نقش", ps: "رول" },
            action: { en: "Action", fa: "نوع تردد", ps: "عمل" },
            time_date: { en: "Time & Date", fa: "زمان و تاریخ", ps: "وخت او نیټه" },
            recorded_by: { en: "Recorded By", fa: "ثبت شده توسط", ps: "ثبت کونکی" },
            not_found: { en: "No records found", fa: "هیچ موردی پیدا نشد", ps: "هیڅ ریکارډ ونه موندل شو" }
        };
        const lang: any = language || 'fa';
        return labels[key]?.[lang] || labels[key]?.['en'];
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <Clock className="text-primary h-8 w-8" />
                        {dir === 'rtl' ? (language === 'ps' ? 'د ننوتلو او وتلو راپور' : 'گزارش ورود و خروج') : 'Entry/Exit Logs'}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {dir === 'rtl'
                            ? (language === 'ps' ? 'د زده کونکو او کارمندانو د تګ راتګ نظارت' : 'مدیریت و نظارت بر تردد دانش‌آموزان و پرسنل')
                            : 'Monitor and manage attendance of students and staff'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchLogs}
                        className="p-4 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <FileText size={20} />
                        {getLabel('export')}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-blue-100 font-bold uppercase tracking-wider text-xs">{dir === 'rtl' ? (language === 'ps' ? 'ټول تګ راتګ' : 'کل ترددها') : 'Total Logs'}</p>
                        <h2 className="text-5xl font-black mt-2">{stats.total}</h2>
                    </div>
                    <Users className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-bold uppercase tracking-wider text-xs">{dir === 'rtl' ? (language === 'ps' ? 'د نن ننوتل' : 'ورودهای امروز') : 'Today Entries'}</p>
                        <h2 className="text-5xl font-black mt-2">{stats.entries}</h2>
                    </div>
                    <ArrowDownLeft className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-8 rounded-[2rem] text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-rose-100 font-bold uppercase tracking-wider text-xs">{dir === 'rtl' ? (language === 'ps' ? 'د نن وتل' : 'خروج‌های امروز') : 'Today Exits'}</p>
                        <h2 className="text-5xl font-black mt-2">{stats.exits}</h2>
                    </div>
                    <ArrowUpRight className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-lg">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl flex-1 min-w-[200px]">
                    <Search className="h-5 w-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={getLabel('search')}
                        className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-12 px-4 bg-slate-100 dark:bg-white/5 rounded-2xl border-none focus:ring-2 ring-primary/20 text-sm font-bold appearance-none cursor-pointer"
                    >
                        <option value="ALL">{getLabel('all_types')}</option>
                        <option value="ENTRY">{getLabel('entry')}</option>
                        <option value="EXIT">{getLabel('exit')}</option>
                    </select>

                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-12 px-4 bg-slate-100 dark:bg-white/5 rounded-2xl border-none focus:ring-2 ring-primary/20 text-sm font-bold appearance-none cursor-pointer"
                    >
                        <option value="ALL">{getLabel('all_roles')}</option>
                        <option value="STUDENT">{getLabel('students')}</option>
                        <option value="TEACHER">{getLabel('teachers')}</option>
                        <option value="STAFF">{getLabel('staff')}</option>
                    </select>

                    <div className="relative flex items-center gap-4 px-6 bg-slate-100 dark:bg-white/5 rounded-2xl h-14 border border-border/50 group hover:border-primary transition-all">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors text-start">
                                {getLabel('date')}
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none text-sm font-black cursor-pointer w-32"
                                />
                                {filterDate && (
                                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg animate-in slide-in-from-left-2 duration-300">
                                        {formatJalali(filterDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border shadow-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                        <Clock className="h-20 w-20 opacity-10 mb-4" />
                        <p className="text-xl font-bold">{getLabel('not_found')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead>
                                <tr className="border-b border-border bg-slate-50/50 dark:bg-white/5">
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-500 text-start">
                                        {getLabel('person')}
                                    </th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-500 text-start">
                                        {getLabel('role')}
                                    </th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-500 text-start">
                                        {getLabel('action')}
                                    </th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-500 text-start">
                                        {getLabel('time_date')}
                                    </th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-500 text-start">
                                        {getLabel('recorded_by')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center border border-border overflow-hidden group-hover:scale-110 transition-transform">
                                                    {log.user?.image ? (
                                                        <img src={log.user.image} className="h-full w-full object-cover" alt="" />
                                                    ) : (
                                                        <UserIcon size={20} className="text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground">{log.user?.name}</p>
                                                    <p className="text-xs text-slate-500 font-bold">{log.user?.studentId || '---'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${log.user?.role === 'STUDENT' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' :
                                                log.user?.role === 'TEACHER' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10' :
                                                    'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
                                                }`}>
                                                {log.user?.role === 'STUDENT' ? (dir === 'rtl' ? (language === 'ps' ? 'زده کوونکی' : 'شاگرد') : 'Student') :
                                                    log.user?.role === 'TEACHER' ? (dir === 'rtl' ? (language === 'ps' ? 'ښوونکی' : 'معلم') : 'Teacher') :
                                                        (dir === 'rtl' ? (language === 'ps' ? 'کارکونکی' : 'کارمند') : 'Staff')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                {log.type === "ENTRY" ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-500 font-black text-sm">
                                                        <ArrowDownLeft size={16} />
                                                        {dir === 'rtl' ? (language === 'ps' ? 'داخل شو' : 'وارد شد') : 'Entry'}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-rose-500 font-black text-sm">
                                                        <ArrowUpRight size={16} />
                                                        {dir === 'rtl' ? (language === 'ps' ? 'بهر شو' : 'خارج شد') : 'Exit'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground">
                                                    {formatJalali(log.timestamp, true)}
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold">
                                                    {formatJalali(log.timestamp)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col text-start">
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                    {log.recordedBy?.name}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
