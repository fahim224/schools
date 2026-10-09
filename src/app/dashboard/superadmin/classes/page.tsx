"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    School,
    Plus,
    Trash2,
    Edit,
    Users,
    BookOpen,
    UserCircle2,
    Save,
    X,
    ArrowLeft,
    Layers,
    LayoutGrid,
    VenetianMask,
    Search
} from "lucide-react";
import Link from "next/link";

export default function ManageClassesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // New Class Form State
    const [newLevel, setNewLevel] = useState("");
    const [newSection, setNewSection] = useState("");
    const [newGender, setNewGender] = useState("MIXED");
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    // Edit Class Form State
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [editLevel, setEditLevel] = useState("");
    const [editSection, setEditSection] = useState("");
    const [editGender, setEditGender] = useState("");
    const [editTeacherId, setEditTeacherId] = useState("");
    const [editSubjectIds, setEditSubjectIds] = useState<string[]>([]);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGender, setFilterGender] = useState("");
    const [filterTeacher, setFilterTeacher] = useState("");

    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [classRes, teacherRes, subRes] = await Promise.all([
                fetch("/api/classes"),
                fetch("/api/users"),
                fetch("/api/subjects")
            ]);
            if (classRes.ok) setClasses(await classRes.json());
            if (teacherRes.ok) {
                const allUsers = await teacherRes.json();
                setTeachers(allUsers.filter((u: any) => u.role === 'TEACHER' || u.role === 'ADMIN'));
            }
            if (subRes.ok) setSubjects(await subRes.json());
        } catch (err) {
            console.error("Fetch error");
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
            fetchData();
        }
    }, [status, session, router, fetchData]);

    const addClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLevel || !newSection) {
            alert("لطفا سویه و نام صنف را وارد کنید");
            return;
        }

        try {
            // Construct display name e.g. "Grade 1 - A - Girls"
            const displayName = `${newLevel} - ${newSection} (${newGender === 'BOYS' ? t.dashboards.gender_boys : newGender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed})`;

            const res = await fetch("/api/classes", {
                method: "POST",
                body: JSON.stringify({
                    name: displayName,
                    level: newLevel,
                    section: newSection,
                    gender: newGender,
                    teacherId: selectedTeacherId || null,
                    subjectIds: selectedSubjectIds || []
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                setNewLevel("");
                setNewSection("");
                setNewGender("MIXED");
                setSelectedTeacherId("");
                setSelectedSubjectIds([]);
                fetchData();
            } else {
                const data = await res.json();
                alert("خطا در ثبت صنف: " + (data.message || res.statusText));
            }
        } catch (err) {
            console.error("Add Class Error:", err);
            alert("مشکل در برقراری ارتباط با سرور");
        }
    };

    const deleteClass = async (id: string) => {
        if (!confirm(t.dashboards.delete + "?")) return;
        const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    };

    const updateClass = async (id: string) => {
        const displayName = `${editLevel} - ${editSection} (${editGender === 'BOYS' ? t.dashboards.gender_boys : editGender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed})`;

        const res = await fetch(`/api/classes/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: displayName,
                level: editLevel,
                section: editSection,
                gender: editGender,
                teacherId: editTeacherId,
                subjectIds: editSubjectIds
            }),
            headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
            setEditingClassId(null);
            fetchData();
        }
    };

    const toggleSubject = (id: string, isEdit = false) => {
        if (isEdit) {
            setEditSubjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setSelectedSubjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        }
    };

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.section.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = filterGender === "" || cls.gender === filterGender;
        const matchesTeacher = filterTeacher === "" || cls.teacherId === filterTeacher;

        return matchesSearch && matchesGender && matchesTeacher;
    });

    if (status !== "authenticated" || !session || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-3 md:p-5 font-sans transition-colors duration-300">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
                    <School className="text-purple-500" size={30} />
                    {t.dashboards.manage_classes}
                </h1>
                <Link
                    href="/dashboard/superadmin"
                    className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/80 transition-all font-sans"
                >
                    <ArrowLeft size={16} />
                    {t.home}
                </Link>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Create Class Form */}
                <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Plus className="text-purple-500" size={20} />
                        {t.dashboards.add_class}
                    </h3>

                    <form onSubmit={addClass} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                    <Layers size={12} className="text-purple-500" />
                                    {t.dashboards.class_level}
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grade 1"
                                    value={newLevel}
                                    onChange={(e) => setNewLevel(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                    <LayoutGrid size={12} className="text-purple-500" />
                                    {t.dashboards.class_name}
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alef"
                                    value={newSection}
                                    onChange={(e) => setNewSection(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <VenetianMask size={12} className="text-purple-500" />
                                {t.dashboards.gender}
                            </label>
                            <div className="flex gap-1.5">
                                {['BOYS', 'GIRLS', 'MIXED'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setNewGender(g)}
                                        className={`flex-1 rounded-lg py-2 text-[10px] font-black transition-all ${newGender === g ? 'bg-purple-600 text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {g === 'BOYS' ? t.dashboards.gender_boys : g === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed}
                                    </button>
                                ))}
                            </div>
                        </div>



                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <BookOpen size={12} className="text-purple-500" />
                                {t.dashboards.subjects}
                            </label>
                            <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                {subjects.map((sub) => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => toggleSubject(sub.id)}
                                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-bold transition-all ${selectedSubjectIds.includes(sub.id)
                                            ? 'bg-purple-600 border-purple-700 text-white shadow-sm'
                                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <span>{sub.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full rounded-xl bg-purple-600 py-3 text-white font-black text-base shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all mt-2">
                            {t.dashboards.add_class}
                        </button>
                    </form>
                </div>

                {/* Classes List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <School className="text-purple-500" size={20} />
                            {t.dashboards.classes}
                        </h3>

                        {/* Search & Filters */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    placeholder="جستجو در صنف‌ها..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-muted/30 border border-border rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                            </div>
                            <select
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value)}
                                className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            >
                                <option value="">همه جنسیت‌ها</option>
                                <option value="BOYS">{t.dashboards.gender_boys}</option>
                                <option value="GIRLS">{t.dashboards.gender_girls}</option>
                                <option value="MIXED">{t.dashboards.gender_mixed}</option>
                            </select>
                            <select
                                value={filterTeacher}
                                onChange={(e) => setFilterTeacher(e.target.value)}
                                className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            >
                                <option value="">همه معلم‌ها</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                                <div key={cls.id} className="group relative rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-xl">

                                    {editingClassId === cls.id ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className="bg-background border border-purple-500 rounded-lg px-2 py-1.5 text-xs font-bold outline-none" placeholder="Level" />
                                                <input value={editSection} onChange={(e) => setEditSection(e.target.value)} className="bg-background border border-purple-500 rounded-lg px-2 py-1.5 text-xs font-bold outline-none" placeholder="Section" />
                                            </div>
                                            <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full bg-background border border-purple-500 rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
                                                <option value="BOYS">Boys Only</option>
                                                <option value="GIRLS">Girls Only</option>
                                                <option value="MIXED">Mixed</option>
                                            </select>
                                            <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} className="w-full bg-background border border-purple-500 rounded-lg px-2 py-1.5 text-xs outline-none">
                                                <option value="">No Teacher</option>
                                                {teachers.map(tchr => <option key={tchr.id} value={tchr.id}>{tchr.name}</option>)}
                                            </select>
                                            <div className="grid grid-cols-2 gap-1.5 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                                                {subjects.map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => toggleSubject(sub.id, true)}
                                                        className={`p-1.5 rounded-md border text-[9px] font-bold ${editSubjectIds.includes(sub.id) ? 'bg-purple-600 text-white' : 'bg-background'}`}
                                                    >
                                                        {sub.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => updateClass(cls.id)} className="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg font-black text-xs shadow-md"><Save size={14} className="mx-auto" /></button>
                                                <button onClick={() => setEditingClassId(null)} className="flex-1 bg-red-500 text-white py-1.5 rounded-lg font-black text-xs shadow-md"><X size={14} className="mx-auto" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="space-y-0.5">
                                                    <h4 className="text-base font-black text-foreground truncate max-w-[150px]">{cls.name}</h4>
                                                    <div className="flex gap-1.5">
                                                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded-md text-[9px] font-black uppercase">{cls.level}</span>
                                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-md text-[9px] font-black uppercase">{cls.gender === 'BOYS' ? t.dashboards.gender_boys : cls.gender === 'GIRLS' ? t.dashboards.gender_girls : t.dashboards.gender_mixed}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                    <button
                                                        onClick={() => { setEditingClassId(cls.id); setEditLevel(cls.level); setEditSection(cls.section); setEditGender(cls.gender); setEditTeacherId(cls.teacherId || ""); setEditSubjectIds(cls.subjects.map((s: any) => s.id)); }}
                                                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteClass(cls.id)}
                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                                    <UserCircle2 size={18} className="text-purple-500" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase leading-none">{t.dashboards.homeroom_teacher}</p>
                                                        <p className="text-[11px] font-bold text-foreground mt-0.5">{cls.teacher?.name || "---"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                                    <Users size={18} className="text-blue-500" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase leading-none">{t.dashboards.student_count}</p>
                                                        <p className="text-[11px] font-black text-foreground mt-0.5">{cls.students?.length || 0}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-1 max-h-12 overflow-y-auto custom-scrollbar">
                                                {cls.subjects.map((s: any) => (
                                                    <span key={s.id} className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[8px] font-black text-indigo-500 uppercase border border-indigo-500/5">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-2 py-12 text-center">
                                    <VenetianMask className="mx-auto text-muted-foreground/20 mb-3" size={48} />
                                    <p className="text-sm font-bold text-muted-foreground italic">هیچ صنفی با این فیلترها یافت نشد</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
        </div>
    );
}
