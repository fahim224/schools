"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    School,
    Users,
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    Check,
    UserCheck,
    BookOpen,
    Shield,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function TeacherCreateClassPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    // Options
    const [templates, setTemplates] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [classLimit, setClassLimit] = useState(1);
    const [currentCount, setCurrentCount] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        templateId: "",
        name: "",
        level: "",
        section: "",
        gender: "",
        academicYear: "1403", // Default year
        teacherId: "",
        subjectIds: [] as string[],
        studentIds: [] as string[]
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [studentSearchTerm, setStudentSearchTerm] = useState("");

    const fetchInitialData = async () => {
        try {
            const [studentRes, classRes, profileRes] = await Promise.all([
                fetch("/api/admin/available-students"),
                fetch("/api/classes"),
                fetch("/api/user/profile")
            ]);

            if (studentRes.ok) setAvailableStudents(await studentRes.json());

            if (profileRes.ok) {
                const profile = await profileRes.json();
                setClassLimit(profile.classLimit || 1);
            }

            if (classRes.ok) {
                const allClasses = await classRes.json();
                // Filter templates: only show classes created by SuperAdmin
                const superAdminTemplates = allClasses.filter((c: any) => c.teacherId === null || c.createdById === null); // Simplistic check
                setTemplates(superAdminTemplates);

                // Count own classes
                const ownClasses = allClasses.filter((c: any) => c.createdById === (session?.user as any)?.id);
                setCurrentCount(ownClasses.length);
            }

        } catch (err) {
            console.error("Failed to load options");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session) {
            const user = session.user as any;
            if (user.role !== "TEACHER" || !!user.createdById) {
                router.push("/dashboard/teacher/classes");
                return;
            }
            fetchInitialData();
            setFormData(prev => ({ ...prev, teacherId: user.id }));
        }
    }, [status, session, router]);

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                templateId,
                name: template.name,
                level: template.level,
                section: template.section,
                gender: template.gender,
                subjectIds: template.subjects.map((s: any) => s.id)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                templateId: "",
                name: "",
                level: "",
                section: "",
                gender: "",
                subjectIds: []
            }));
        }
    };

    const toggleStudent = (id: string) => {
        setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(id)
                ? prev.studentIds.filter(sId => sId !== id)
                : [...prev.studentIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentCount >= classLimit) {
            setError(t.dashboards.limit_reached);
            return;
        }

        if (!formData.templateId) {
            setError("Please select a class template");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/admin/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/dashboard/teacher/classes"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to create class");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = availableStudents.filter((s: any) =>
        s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    const limitReached = currentCount >= classLimit;

    return (
        <div className="font-sans pb-12" dir={dir}>
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-10 flex items-center gap-4">
                    <Link href="/dashboard/teacher/classes" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                        <ArrowLeft size={20} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                    </Link>
                    <div className="text-start">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">{t.dashboards.teacher}</h2>
                        <h1 className="text-3xl font-black tracking-tight">{t.dashboards.add_class}</h1>
                    </div>
                </header>

                {limitReached && (
                    <div className="mb-8 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <AlertTriangle size={32} />
                        <div className="text-start">
                            <p className="font-black text-lg">
                                {t.dashboards.limit_reached} ({currentCount}/{classLimit})
                            </p>
                            <p className="text-sm font-bold opacity-80">
                                {t.dashboards.contact_superadmin_limit}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Template Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                <Shield className="text-emerald-500" />
                                Class Template
                            </h3>

                            <div className="space-y-6 text-start">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Select SuperAdmin Class *</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                                        value={formData.templateId}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        required
                                        disabled={limitReached}
                                    >
                                        <option value="">Choose a class...</option>
                                        {templates.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                                {tpl.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.templateId && (
                                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-500">Level:</span>
                                            <span className="text-xs font-black text-emerald-500">{t.levels[formData.level] || formData.level}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-500">Section:</span>
                                            <span className="text-xs font-black text-emerald-500">{formData.section}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-500">Gender:</span>
                                            <span className="text-xs font-black text-emerald-500">{formData.gender}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Academic Year *</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        required
                                        disabled={limitReached}
                                    >
                                        {Array.from({ length: 1414 - 1390 + 1 }, (_, i) => 1414 - i).map(year => (
                                            <option key={year} value={year.toString()}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Subjects Display (Auto-filled) */}
                        <div className="p-8 rounded-[2rem] bg-card/60 border border-border flex flex-col gap-4 text-start">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <BookOpen size={20} />
                                <h4 className="font-black text-sm uppercase tracking-wide">{t.dashboards.subjects}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.subjectIds.length > 0 ? (
                                    formData.subjectIds.map((subId: string) => {
                                        const template = templates.find(t => t.id === formData.templateId);
                                        const subject = template?.subjects?.find((s: any) => s.id === subId);
                                        return (
                                            <span key={subId} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                {subject?.name || subId}
                                            </span>
                                        );
                                    })
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-400 italic">Subjects will be imported from template</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Student Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6 flex flex-col h-[600px]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                    <Users className="text-cyan-500" />
                                    {t.dashboards.select_available_students} ({formData.studentIds.length})
                                </h3>
                                <div className="relative group w-full md:max-w-xs">
                                    <Search size={16} className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-slate-400 my-auto`} />
                                    <input
                                        type="text"
                                        placeholder={t.dashboards.search_placeholder}
                                        className={`w-full bg-slate-500/5 border border-border rounded-xl py-2 ${dir === 'rtl' ? 'pr-10' : 'pl-10'} pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
                                        value={studentSearchTerm}
                                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                                        disabled={limitReached}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {filteredStudents.length > 0 ? filteredStudents.map((student: any) => (
                                    <div
                                        key={student.id}
                                        onClick={() => !limitReached && toggleStudent(student.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${formData.studentIds.includes(student.id) ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' : 'bg-slate-500/5 border-transparent hover:border-slate-300 dark:hover:border-white/20'} ${limitReached ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${formData.studentIds.includes(student.id) ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                                {formData.studentIds.includes(student.id) ? <Check size={20} /> : <UserCheck size={20} />}
                                            </div>
                                            <div className="text-start">
                                                <p className="text-sm font-black text-foreground">{student.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500 tracking-wider">ID: {student.studentId} • F: {student.fatherName}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic font-bold">
                                        {t.dashboards.no_results}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-6 text-start">
                            {error && <div className="text-red-500 font-bold flex items-center gap-2 animate-pulse"><XCircle size={20} />{error}</div>}
                            {success && <div className="text-emerald-500 font-bold flex items-center gap-2"><CheckCircle size={20} />{t.dashboards.new_class.success_msg}</div>}

                            <button
                                type="submit"
                                disabled={submitting || limitReached}
                                className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-emerald-500 px-12 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-500/40 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                {t.dashboards.add_class}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.5); }
            `}</style>
        </div>
    );
}
