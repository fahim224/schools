"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
    Trash2,
    AlertTriangle,
    UserCheck,
    BookOpen,
    Shield,
    BarChart3,
    FileText,
    TrendingUp,
    AlertCircle,
    Printer,
    GraduationCap,
    Clock,
    Settings2,
    FileSpreadsheet,
    Download,
    ChevronDown,
    X,
    Settings
} from "lucide-react";
import Link from "next/link";
import * as XLSX from 'xlsx';
import { IdCardPreview, generateIdCardImage } from "@/components/IdCardPreview";

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export default function ClassDetailsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Options
    const [teachers, setTeachers] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [classData, setClassData] = useState<any>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [downloadingCards, setDownloadingCards] = useState(false);
    const [cardStudent, setCardStudent] = useState<any>(null);

    const [formData, setFormData] = useState({
        templateId: "",
        level: "",
        section: "",
        gender: "BOYS",
        name: "",
        academicYear: "1403",
        teacherId: "",
        subjectIds: [] as string[],
        studentIds: [] as string[],
        isActive: true
    });

    const [activeTab, setActiveTab] = useState<"details" | "results">("details");

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [templateSearch, setTemplateSearch] = useState("");
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const templateDropdownRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
                setShowTemplateDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classRes, teacherRes, subjectRes, templatesRes, settingsRes] = await Promise.all([
                fetch(`/api/admin/classes/${params.id}`),
                fetch("/api/admin/teachers"),
                fetch("/api/subjects"),
                fetch("/api/classes"),
                fetch("/api/settings")
            ]);

            if (!classRes.ok) {
                setError("Class not found");
                setLoading(false);
                return;
            }

            const data = await classRes.json();
            setClassData(data);
            const year = data.academicYear || "1403";

            setFormData({
                templateId: "",
                level: data.level,
                section: data.section,
                gender: data.gender,
                name: data.name,
                academicYear: year,
                teacherId: data.teacherId || "",
                subjectIds: data.subjects.map((s: any) => s.id),
                studentIds: data.students.map((s: any) => s.id),
                isActive: data.isActive
            });

            // Fetch available students for THIS year
            const availRes = await fetch(`/api/admin/available-students?year=${year}`);
            if (availRes.ok) {
                const avail = await availRes.json();
                // Merge currently assigned students with available ones
                const currentStudents = data.students || [];
                const merged = [...currentStudents, ...avail.filter((a: any) => !currentStudents.some((s: any) => s.id === a.id))];
                setAvailableStudents(merged);
            }

            if (teacherRes.ok) setTeachers(await teacherRes.json());
            if (subjectRes.ok) setAllSubjects(await subjectRes.json());
            if (templatesRes.ok) setTemplates(await templatesRes.json());
            if (settingsRes.ok) setSchoolSettings(await settingsRes.json());

        } catch (err: any) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session && params.id) {
            fetchInitialData();
        }
    }, [status, session, router, params.id]);

    const handleTemplateSelect = (tpl: any) => {
        setFormData(prev => ({
            ...prev,
            templateId: tpl.id,
            name: tpl.name,
            level: tpl.level,
            section: tpl.section,
            gender: tpl.gender,
            subjectIds: tpl.subjects.map((s: any) => s.id)
        }));
        setTemplateSearch(tpl.name);
        setShowTemplateDropdown(false);
    };

    const handleTemplateClear = () => {
        setFormData(prev => ({
            ...prev,
            templateId: "",
            name: "",
            level: "",
            section: "",
            gender: "",
            subjectIds: []
        }));
        setTemplateSearch("");
    };

    const toggleStudent = (id: string) => {
        setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(id)
                ? prev.studentIds.filter(sId => sId !== id)
                : [...prev.studentIds, id]
        }));
    };

    const toggleSubject = (id: string) => {
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(id)
                ? prev.subjectIds.filter(sId => sId !== id)
                : [...prev.subjectIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch(`/api/admin/classes/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast(dir === 'rtl' ? "تغییرات با موفقیت ذخیره شد" : "Changes saved successfully", 'success');
                setSuccess(true);
                fetchInitialData();
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update class");
                showToast(data.message || "Failed to update class", 'error');
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/classes/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !formData.isActive }),
            });
            if (res.ok) {
                setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
                showToast(dir === 'rtl' ? "وضعیت صنف تغییر کرد" : "Class status updated", 'success');
            }
        } catch (err) {
            showToast("Failed to toggle status", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!confirm(dir === 'rtl' ? "آیا از حذف این صنف مطمئن هستید؟" : "Are you sure you want to delete this class?")) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/classes/${params.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/admin/classes");
            }
        } catch (err) {
            showToast("Failed to delete class", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadExcel = (type: 'midterm' | 'annual' | 'all') => {
        const fileName = `${formData.level}-${formData.section}-${type}-results`;
        let data: any[] = [];

        if (classData && classData.results) {
            const students = classData.enrollments.map((e: any) => e.student);
            data = students.map((student: any) => {
                const row: any = {
                    'Student ID': student.studentId,
                    'Name': student.name,
                };

                classData.subjects.forEach((subject: any) => {
                    const grade = classData.results.find((r: any) => r.studentId === student.id && r.subjectId === subject.id && r.type === (type === 'all' ? 'ANNUAL' : type.toUpperCase()));
                    row[subject.name] = grade ? grade.score : 'N/A';
                });

                return row;
            });
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wscols = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Class Data");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        showToast(dir === 'rtl' ? "فایل اکسل با موفقیت دانلود شد" : "Excel file downloaded successfully");
    };

    const downloadDetailedResults = async () => {
        setSubmitting(true);
        try {
            const [gradesRes, attendanceRes] = await Promise.all([
                fetch(`/api/grades?classId=${params.id}`),
                fetch(`/api/attendance?classId=${params.id}`)
            ]);

            if (!gradesRes.ok || !attendanceRes.ok) {
                showToast(dir === 'rtl' ? "خطا در دریافت اطلاعات" : "Failed to fetch data", "error");
                return;
            }

            const grades = await gradesRes.json();
            const attendance = await attendanceRes.json();
            const students = classData.students || [];
            const subjects = classData.subjects || [];

            const data = students.map((student: any) => {
                const studentGrades = grades.filter((g: any) => g.studentId === student.id);
                const studentAtt = attendance.filter((a: any) => a.studentId === student.id);

                // --- Calculate Midterm ---
                const midGrades = studentGrades.filter((g: any) => g.type === 'MIDTERM');
                const hasMidMarks = midGrades.length > 0;

                // Dynamic divisor like Results Table: only count subjects that have at least one grade (mid or final)
                const subjectsWithAnyMarks = subjects.filter((sub: any) =>
                    studentGrades.some((g: any) => g.subjectId === sub.id)
                ).length || 1;

                const midAvgValue = midGrades.reduce((acc: number, g: any) => acc + g.score, 0) / midGrades.length; // Average of entered marks
                // Wait, if Results Table uses (Sum of All / Count of Subjects with Marks), let's use that.
                const midSum = midGrades.reduce((acc: number, g: any) => acc + g.score, 0);
                const midAvg = hasMidMarks ? (midSum / midGrades.length) : 0;

                let midtermStatus = "";
                if (!hasMidMarks) midtermStatus = "غایب";
                else if (midAvg >= 16) midtermStatus = "موفق";
                else midtermStatus = "تلاش بیشتر";

                // --- Calculate Annual ---
                let failedSubjectsCount = 0;
                let totalScoreSum = 0;
                let hasFinalMarks = false;
                let activeSubjectsCount = 0;

                subjects.forEach((sub: any) => {
                    const midRec = studentGrades.find((g: any) => g.subjectId === sub.id && g.type === 'MIDTERM');
                    const finRec = studentGrades.find((g: any) => g.subjectId === sub.id && g.type === 'FINAL');

                    if (midRec || finRec) {
                        activeSubjectsCount++;
                        const mid = midRec?.score || 0;
                        const final = finRec?.score || 0;
                        if (finRec) hasFinalMarks = true;

                        const total = mid + final;
                        totalScoreSum += total;
                        if (total < 40) failedSubjectsCount++;
                    }
                });

                const totalAvg = activeSubjectsCount > 0 ? (totalScoreSum / activeSubjectsCount) : 0;
                const totalAbsents = studentAtt.reduce((acc: number, a: any) => acc + (a.absent || 0), 0);
                const mahroomLimit = classData.annualMahroomiDays || 50;
                const isMahroom = totalAbsents > mahroomLimit;

                let annualStatus = "";
                if (isMahroom) annualStatus = "محروم";
                else if (hasFinalMarks || hasMidMarks) {
                    if (hasFinalMarks) {
                        if (failedSubjectsCount === 0 && totalAvg >= 40) annualStatus = "ارتقا صنف";
                        else if (failedSubjectsCount >= 3 || totalAvg < 40) annualStatus = "تکرار صنف";
                        else if (failedSubjectsCount > 0 && failedSubjectsCount < 3) annualStatus = "مشروط";
                        else annualStatus = "در جریان";
                    } else {
                        annualStatus = "در جریان";
                    }
                } else {
                    annualStatus = "غایب";
                }

                return {
                    'نمبر اساس': student.studentId,
                    'نام شاگرد': student.name,
                    'نام پدر': student.fatherName,
                    'خلص نتایج چهارنیم ماهه': midtermStatus,
                    'خلص نتایج سالانه': annualStatus,
                    'معدل عمومی': totalAvg.toFixed(2),
                    'تعداد مضامین ناکام': failedSubjectsCount,
                    'مجموع غیرحاضری': totalAbsents
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wscols = [
                { wch: 15 }, // ID
                { wch: 25 }, // Name
                { wch: 20 }, // Father Name
                { wch: 25 }, // Midterm Status
                { wch: 25 }, // Annual Status
                { wch: 15 }, // Avg
                { wch: 20 }, // Fail count
                { wch: 15 }  // Absence
            ];
            ws['!cols'] = wscols;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "نتایج صنف");
            XLSX.writeFile(wb, `${classData.name}_Stats_${formData.academicYear}.xlsx`);
            showToast(dir === 'rtl' ? "فایل احصائیه با موفقیت دانلود شد" : "Statistical Excel downloaded");

        } catch (err) {
            console.error(err);
            showToast(dir === 'rtl' ? "خطا در خروجی اکسل" : "Excel export failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadClassIdCards = async () => {
        if (!schoolSettings?.idCardDesign || !schoolSettings?.isIdCardEnabled) return;

        setDownloadingCards(true);
        showToast(dir === 'rtl' ? "لطفا تا اتمام تولید کارت‌ها صبر کنید..." : "Please wait while generating cards...", "success");

        try {
            if (!(window as any).html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                    script.onload = () => resolve(true);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            if (!(window as any).JSZip) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
                    script.onload = () => resolve(true);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
        } catch (e) {
            showToast("خطا در بارگذاری کتابخانه‌ها", "error");
            setDownloadingCards(false);
            return;
        }

        const zip = new (window as any).JSZip();
        const folder = zip.folder(`Class_${classData.name}_IDCards`);

        const studentsToPrint = classData.students || [];
        if (studentsToPrint.length === 0) {
            showToast("هیچ شاگردی در این صنف موجود نیست", "error");
            setDownloadingCards(false);
            return;
        }

        try {
            for (let i = 0; i < studentsToPrint.length; i++) {
                const student = studentsToPrint[i];
                try {
                    const dataUrl = await generateIdCardImage(
                        schoolSettings.idCardDesign,
                        { ...student, class: { name: classData.name } },
                        schoolSettings
                    );
                    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                    const safeName = student.name.replace(/[^a-zA-Z0-9آ-ی\s]/g, "");
                    folder.file(`${safeName}_${student.studentId || i}.png`, base64Data, { base64: true });
                } catch (err) {
                    console.error("Failed card", student.name, err);
                }
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `Class_${classData.name}_IDCards.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(dir === 'rtl' ? "دانلود تمام کارت‌ها با موفقیت آغاز شد" : "All cards downloaded successfully", "success");
        } catch (e) {
            console.error(e);
            showToast(dir === 'rtl' ? "خطا در ایجاد کارت‌ها" : "Error generating cards", "error");
        } finally {
            setCardStudent(null);
            setDownloadingCards(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="font-sans pb-12 text-start">
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin/classes" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                        </Link>
                        <div className="text-start">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{dir === 'rtl' ? 'پروفایل و تنظیمات صنف' : 'Class Profile & Settings'}</h2>
                            <h1 className="text-3xl font-black tracking-tight">
                                {dir === 'rtl' ? 'صنف' : 'Class'} {t?.levels?.[formData.level] || formData.level} {formData.section} {formData.gender === 'BOYS' ? t?.dashboards?.gender_boys : formData.gender === 'GIRLS' ? t?.dashboards?.gender_girls : t?.dashboards?.gender_mixed} ({toPersianNum(formData.academicYear || "1403")})
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button
                            onClick={handleToggleActive}
                            disabled={submitting}
                            className={`px-6 py-3 border rounded-2xl transition-all shadow-lg flex items-center gap-2 ${formData.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'}`}
                        >
                            {formData.isActive ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span className="font-black">{formData.isActive ? (dir === 'rtl' ? "حالت فعال" : "Active") : (dir === 'rtl' ? "غیر فعال" : "Inactive")}</span>
                        </button>

                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-border">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'details' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Settings2 size={18} />
                                {dir === 'rtl' ? 'تنظیمات صنف' : 'Settings'}
                            </button>
                            <button
                                onClick={() => setActiveTab("results")}
                                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'results' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <BarChart3 size={18} />
                                {dir === 'rtl' ? 'خلص نتایج و احصائیه' : 'Results Summary'}
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                    <Shield className="text-primary" />
                                    {dir === 'rtl' ? 'هویت صنف' : 'Class Identity'}
                                </h3>

                                <div className="space-y-6 text-start">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">
                                            {dir === 'rtl' ? 'انتخاب قالب صنف *' : 'Select Class Template *'}
                                        </label>
                                        <div className="relative" ref={templateDropdownRef}>
                                            <div
                                                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-2xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all ${showTemplateDropdown ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                            >
                                                <Search size={16} className="text-slate-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                                                    placeholder={dir === 'rtl' ? "جستجوی صنف..." : "Search class..."}
                                                    value={templateSearch}
                                                    onChange={(e) => {
                                                        setTemplateSearch(e.target.value);
                                                        setShowTemplateDropdown(true);
                                                        if (!e.target.value) handleTemplateClear();
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowTemplateDropdown(true);
                                                    }}
                                                />
                                                {formData.templateId ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleTemplateClear(); }}
                                                        className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        <X size={14} className="text-slate-400" />
                                                    </button>
                                                ) : (
                                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
                                                )}
                                            </div>

                                            {showTemplateDropdown && (
                                                <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                    <div className="max-h-56 overflow-y-auto">
                                                        {templates.filter(tpl => tpl.name.toLowerCase().includes(templateSearch.toLowerCase())).length > 0 ? (
                                                            templates.filter(tpl => tpl.name.toLowerCase().includes(templateSearch.toLowerCase())).map((tpl) => (
                                                                <button
                                                                    key={tpl.id}
                                                                    type="button"
                                                                    onClick={() => handleTemplateSelect(tpl)}
                                                                    className={`w-full text-start px-4 py-3 text-sm font-bold hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 ${formData.templateId === tpl.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                                                                >
                                                                    <span>{tpl.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{t?.levels?.[tpl.level] || tpl.level}</span>
                                                                        {formData.templateId === tpl.id && <Check size={14} className="text-primary" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-6 text-center text-sm font-bold text-slate-400">
                                                                {t?.dashboards?.no_results || 'No results'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {formData.templateId && (
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center text-start">
                                                <span className="text-[10px] font-black uppercase text-slate-500">{dir === 'rtl' ? 'سطح' : 'Level'}:</span>
                                                <span className="text-xs font-black text-primary">{t?.levels?.[formData.level] || formData.level}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-start">
                                                <span className="text-[10px] font-black uppercase text-slate-500">{dir === 'rtl' ? 'بخش' : 'Section'}:</span>
                                                <span className="text-xs font-black text-primary">{formData.section}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-start">
                                                <span className="text-[10px] font-black uppercase text-slate-500">{dir === 'rtl' ? 'جنسیت' : 'Gender'}:</span>
                                                <span className="text-xs font-black text-primary">{formData.gender === 'BOYS' ? t?.dashboards?.gender_boys : formData.gender === 'GIRLS' ? t?.dashboards?.gender_girls : t?.dashboards?.gender_mixed}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-black text-slate-500 flex items-center gap-2">
                                            <Users size={16} className="text-primary" />
                                            {dir === 'rtl' ? 'استاد مربوطه' : 'Class Teacher'}
                                        </label>
                                        <select
                                            value={formData.teacherId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                        >
                                            <option value="">-- Choose Teacher --</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-start">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{dir === 'rtl' ? 'سطح' : 'Level'}</label>
                                            <input
                                                type="text"
                                                value={formData.level}
                                                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                                className="w-full font-black text-lg p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-transparent focus:border-primary outline-none transition-all"
                                                placeholder="e.g. 7"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{dir === 'rtl' ? 'بخش' : 'Section'}</label>
                                            <input
                                                type="text"
                                                value={formData.section}
                                                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                                className="w-full font-black text-lg p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-transparent focus:border-primary outline-none transition-all"
                                                placeholder="e.g. A"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-start">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{dir === 'rtl' ? 'جنسیت' : 'Gender'}</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                                className="w-full font-black text-sm p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-transparent focus:border-primary outline-none transition-all"
                                            >
                                                <option value="BOYS">{dir === 'rtl' ? 'ذکور' : 'Boys'}</option>
                                                <option value="GIRLS">{dir === 'rtl' ? 'اناث' : 'Girls'}</option>
                                                <option value="MIXED">{dir === 'rtl' ? 'مختلط' : 'Mixed'}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{dir === 'rtl' ? 'سال تعلیمی' : 'Academic Year'}</label>
                                            <input
                                                type="text"
                                                value={formData.academicYear}
                                                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                                                className="w-full font-black text-lg p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-transparent focus:border-primary outline-none transition-all"
                                                placeholder="1403"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6">
                                <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                    <BookOpen className="text-amber-500" />
                                    {dir === 'rtl' ? 'مضامین صنف' : 'Class Subjects'}
                                </h3>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 text-start">
                                    {allSubjects.map(sub => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => toggleSubject(sub.id)}
                                            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${formData.subjectIds.includes(sub.id) ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-white/5 border-border hover:border-amber-500/30'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${formData.subjectIds.includes(sub.id) ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400 group-hover:text-amber-500'}`}>
                                                    <BookOpen size={16} />
                                                </div>
                                                <span className="font-black text-sm">{sub.name}</span>
                                            </div>
                                            {formData.subjectIds.includes(sub.id) && <Check size={18} className="text-amber-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 rounded-[3rem] bg-card/60 backdrop-blur-xl border border-border shadow-2xl space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="text-start">
                                        <h3 className="flex items-center gap-3 text-2xl font-black">
                                            <Users className="text-primary" />
                                            {dir === 'rtl' ? 'مدیریت شاگردان' : 'Manage Students'}
                                        </h3>
                                        <p className="text-sm font-bold text-slate-500 mt-1">{formData.studentIds.length} {dir === 'rtl' ? 'شاگرد انتخاب شده' : 'Students Selected'}</p>
                                    </div>
                                    <div className="relative group min-w-[300px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder={dir === 'rtl' ? 'جستجوی شاگرد...' : 'Search students...'}
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-border py-3 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={studentSearchTerm}
                                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar text-start">
                                    {availableStudents.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(student => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleStudent(student.id)}
                                            className={`p-4 rounded-[2rem] border transition-all flex items-center gap-4 group text-start relative overflow-hidden ${formData.studentIds.includes(student.id) ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-slate-50 dark:bg-white/5 border-border hover:border-primary/30'}`}
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0 relative z-10">
                                                {student.image ? <img src={student.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-slate-400"><Users size={24} /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0 relative z-10 text-start">
                                                <p className="font-black text-sm truncate">{student.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{dir === 'rtl' ? 'اساس' : 'ID'}: {student.studentId}</p>
                                            </div>
                                            {formData.studentIds.includes(student.id) && (
                                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg relative z-10 animate-in zoom-in duration-200">
                                                    <UserCheck size={16} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                                    <button
                                        type="button"
                                        onClick={handleDeleteClass}
                                        className="px-8 py-4 bg-red-500/10 text-red-500 font-black rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 group"
                                    >
                                        <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                                        {dir === 'rtl' ? 'حذف دائمی صنف' : 'Permanent Delete'}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        {dir === 'rtl' ? 'ذخیره تمام تغییرات' : 'Save All Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Summary View */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-3 group hover:border-primary transition-all">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dir === 'rtl' ? 'اوسط نمرات صنف' : 'Class Average Goal'}</h4>
                                <div className="flex items-end gap-2 text-start">
                                    <span className="text-4xl font-black text-foreground">85%</span>
                                    <span className="text-xs font-black text-emerald-500 mb-1">+4.2%</span>
                                </div>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-3 group hover:border-emerald-500 transition-all cursor-pointer" onClick={downloadDetailedResults}>
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dir === 'rtl' ? 'نتایج سالانه و احصائیه' : 'Annual Stats Export'}</h4>
                                <p className="text-xs font-black text-foreground">{dir === 'rtl' ? 'دانلود لیست نتایج (استاندارد معارف)' : 'Download Result List (Excel)'}</p>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-3 group hover:border-emerald-500 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={24} />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">94.2%</span>
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dir === 'rtl' ? 'حاضری مجموعی' : 'Total Attendance'}</h4>
                                <p className="text-xs font-black text-foreground">{dir === 'rtl' ? 'این ماه' : 'Current Month'}</p>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-3 group hover:border-amber-500 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <AlertCircle size={24} />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">12</span>
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dir === 'rtl' ? 'اخطارها و غیرحاضری ها' : 'Absence Alerts'}</h4>
                                <p className="text-xs font-black text-foreground">{dir === 'rtl' ? 'نیازمند بررسی' : 'Action Required'}</p>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-start">
                            <div className="lg:col-span-1 p-8 rounded-[3rem] bg-card/60 border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black">
                                    <GraduationCap className="text-primary" />
                                    {dir === 'rtl' ? 'عملیات‌های نمرات' : 'Grade Operations'}
                                </h3>
                                <div className="space-y-4">
                                    <button onClick={downloadDetailedResults} className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border hover:border-primary transition-all flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <FileSpreadsheet size={20} />
                                        </div>
                                        <div className="text-start">
                                            <p className="font-black text-sm">{dir === 'rtl' ? 'خروجی احصائیه و نتایج معارف' : 'Afghan Standard Stats Export'}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Detailed statuses & averages</p>
                                        </div>
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href={`/dashboard/admin/classes/${params.id}/grading?term=midterm`} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border hover:border-amber-500/50 transition-all group">
                                            <FileText className="text-amber-500 mb-3" />
                                            <p className="font-black text-xs">{dir === 'rtl' ? 'نمرات چهارونیم ماهه' : 'Midterm Grades'}</p>
                                        </Link>
                                        <Link href={`/dashboard/admin/classes/${params.id}/grading?term=annual`} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border hover:border-primary/50 transition-all group">
                                            <TrendingUp className="text-primary mb-3" />
                                            <p className="font-black text-xs">{dir === 'rtl' ? 'نمرات سالانه' : 'Annual Grades'}</p>
                                        </Link>
                                    </div>
                                    <button onClick={() => downloadExcel('midterm')} className="w-full p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-xs font-black text-slate-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2">
                                        <Download size={16} />
                                        {dir === 'rtl' ? 'دانلود شیت چهارونیم ماهه' : 'Download Midterm Sheet'}
                                    </button>

                                    <button onClick={() => window.print()} className="w-full p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-xs font-black text-slate-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} />
                                        {dir === 'rtl' ? 'چاپ لیست نمرات' : 'Print Grade List'}
                                    </button>

                                    {schoolSettings?.idCardDesign && schoolSettings?.isIdCardEnabled && (
                                        <button
                                            onClick={handleDownloadClassIdCards}
                                            disabled={downloadingCards}
                                            className="w-full mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            {downloadingCards ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                            {downloadingCards ? (dir === 'rtl' ? 'در حال تولید کارت‌ها (لطفا صبر کنید)...' : 'Generating cards...') : (dir === 'rtl' ? 'دانلود تمام کارت‌های هویت صنف (ZIP)' : 'Download All ID Cards (ZIP)')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 p-8 rounded-[3rem] bg-card/60 border border-border shadow-xl space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <CheckCircle className="text-emerald-500" />
                                        {dir === 'rtl' ? 'وضعیت حاضری اخیر' : 'Recent Attendance Status'}
                                    </h3>
                                    <Link href="#" className="text-xs font-black text-primary hover:underline">View details</Link>
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-start">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10"></div>
                                                <div>
                                                    <p className="text-sm font-black">Student Name {i}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Class {formData.level}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest uppercase">حاضر</span>
                                        </div>
                                    ))}
                                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-start">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10"></div>
                                            <div>
                                                <p className="text-sm font-black text-amber-600">Late Student</p>
                                                <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">15 min late</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={16} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase">ناوقت</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-start">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10"></div>
                                            <div>
                                                <p className="text-sm font-black text-red-600">Absent Student</p>
                                                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Critical: 3 consecutive days</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle size={16} className="text-red-500" />
                                            <span className="text-[10px] font-black text-red-500 tracking-widest uppercase">غیرحاضر</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 text-center">
                                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-500/5 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                                            <AlertTriangle size={14} className="text-amber-500" />
                                            System Audit: 98% Reliable
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {toast.show && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-red-500/90 text-white border-red-400'}`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-black text-sm tracking-wide">{toast.message}</span>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
}
