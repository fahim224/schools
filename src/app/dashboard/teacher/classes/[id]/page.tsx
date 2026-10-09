"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
    BarChart3,
    FileText,
    TrendingUp,
    AlertCircle,
    Printer,
    GraduationCap,
    Clock,
    Settings2,
    AlertTriangle,
    FileSpreadsheet,
    Download
} from "lucide-react";
import Link from "next/link";
import * as XLSX from 'xlsx';

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export default function TeacherClassDetailsPage() {
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

    // Class Data
    const [classData, setClassData] = useState<any>(null);
    const [formData, setFormData] = useState({
        templateId: "",
        level: "",
        section: "",
        gender: "",
        name: "",
        academicYear: "1403",
        teacherId: "",
        subjectIds: [] as string[],
        studentIds: [] as string[],
        isActive: true
    });

    const [grades, setGrades] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"details" | "results">("details");

    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [hasCreator, setHasCreator] = useState(false);
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchInitialData = async () => {
        try {
            const [classRes, teacherRes, subjectRes, availableStudentRes, templatesRes] = await Promise.all([
                fetch(`/api/admin/classes/${params.id}`),
                fetch("/api/admin/teachers"),
                fetch("/api/subjects"),
                fetch("/api/admin/available-students"),
                fetch("/api/classes"),
            ]);

            if (session?.user) {
                const u = session.user as any;
                setHasCreator(!!u.createdById);
            }

            let currentClassData = null;

            if (classRes.ok) {
                const data = await classRes.json();
                currentClassData = data;
                setClassData(data);
                setFormData({
                    templateId: "",
                    level: data.level,
                    section: data.section,
                    gender: data.gender,
                    name: data.name,
                    academicYear: data.academicYear || "1403",
                    teacherId: data.teacherId || "",
                    subjectIds: data.subjects.map((s: any) => s.id),
                    studentIds: data.students.map((s: any) => s.id),
                    isActive: data.isActive
                });
            } else {
                setError("Class not found");
                setLoading(false);
                return;
            }

            if (teacherRes.ok) setTeachers(await teacherRes.json());
            if (subjectRes.ok) setAllSubjects(await subjectRes.json());
            if (templatesRes.ok) setTemplates(await templatesRes.json());

            if (availableStudentRes.ok) {
                const avail = await availableStudentRes.json();
                if (currentClassData) {
                    const combined = [...(currentClassData as any).students, ...avail];
                    const uniqueStudents = Array.from(new Map(combined.map(s => [s.id, s])).values());
                    setAvailableStudents(uniqueStudents);
                } else {
                    setAvailableStudents(avail);
                }
            }

            // Fetch Grades, Attendance and Settings for Results calculation
            const [gradesRes, attRes, settingsRes] = await Promise.all([
                fetch(`/api/grades?classId=${params.id}`),
                fetch(`/api/attendance?classId=${params.id}`),
                fetch("/api/settings")
            ]);

            if (gradesRes.ok) setGrades(await gradesRes.json());
            if (attRes.ok) setAttendance(await attRes.json());
            if (settingsRes.ok) setSchoolSettings(await settingsRes.json());

        } catch (err: any) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };


    const canManageClasses = !hasCreator || ((session?.user as any)?.permissions || "").includes("CAN_MANAGE_CLASSES");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "TEACHER") {
            router.push("/");
        }

        if (session && params.id) {
            fetchInitialData();
        }
    }, [status, session, router, params.id]);

    const handleTemplateChange = (templateId: string) => {
        if (hasCreator) return;
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
        }
    };

    const toggleStudent = (id: string) => {
        if (hasCreator) return;
        setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(id)
                ? prev.studentIds.filter(sId => sId !== id)
                : [...prev.studentIds, id]
        }));
    };

    const toggleSubject = (id: string) => {
        if (hasCreator) return;
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(id)
                ? prev.subjectIds.filter(sId => sId !== id)
                : [...prev.subjectIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasCreator) return;
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
        if (hasCreator) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/classes/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !formData.isActive })
            });

            if (res.ok) {
                setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError("Failed to update status");
            }
        } catch (err) {
            setError("Error updating status");
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
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!classData) return <div className="p-20 text-center font-black">Class Not Found</div>;

    // --- CALCULATION LOGIC ---
    const calculationResults = (() => {
        if (!classData || !grades) return null;

        const results: Record<string, any> = {};
        const subjects = classData.subjects || [];
        const students = classData.students || [];

        const gradesMatrix: Record<string, Record<string, Record<string, number>>> = {};
        grades.forEach(g => {
            if (!gradesMatrix[g.studentId]) gradesMatrix[g.studentId] = {};
            if (!gradesMatrix[g.studentId][g.subjectId]) gradesMatrix[g.studentId][g.subjectId] = {};
            gradesMatrix[g.studentId][g.subjectId][g.type] = g.score;
        });

        const attMatrix: Record<string, Record<string, any>> = {};
        attendance.forEach(a => {
            if (!attMatrix[a.studentId]) attMatrix[a.studentId] = {};
            attMatrix[a.studentId][a.type] = a;
        });

        const midMahroomiDays = classData.midMahroomiDays || 25;
        const annualMahroomiDays = classData.annualMahroomiDays || 50;

        students.forEach((s: any) => {
            let totalVal = 0;
            let midTotalCount = 0;
            let finalTotalCount = 0;
            let fails = 0;
            let hasAnyData = false;
            let midSubjectCount = 0;
            let totalSubjectCount = 0;
            let hasLowMidScore = false;

            const attMid = attMatrix[s.id]?.MIDTERM || {};
            const attFin = attMatrix[s.id]?.FINAL || {};

            const midAbsent = attMid.absent || 0;
            const finAbsent = attFin.absent || 0;

            const totalAbsentsMid = midAbsent;
            const totalAbsentsAnnual = midAbsent + finAbsent;

            const isMahroomMid = totalAbsentsMid >= midMahroomiDays;
            const isMahroomAnnual = totalAbsentsAnnual >= annualMahroomiDays;

            subjects.forEach((sub: any) => {
                const mid = gradesMatrix[s.id]?.[sub.id]?.MIDTERM ?? -1;
                const fin = gradesMatrix[s.id]?.[sub.id]?.FINAL ?? -1;

                if (mid !== -1 || fin !== -1) hasAnyData = true;

                if (mid !== -1) {
                    midTotalCount += mid;
                    midSubjectCount++;
                    if (mid < 15) hasLowMidScore = true;
                }

                if (fin !== -1) {
                    finalTotalCount += fin;
                }

                if (mid !== -1 || fin !== -1) {
                    const mVal = mid === -1 ? 0 : mid;
                    const fVal = fin === -1 ? 0 : fin;
                    totalVal += (mVal + fVal);
                    totalSubjectCount++;
                    if ((mVal + fVal) < 40) fails++;
                }
            });

            const midAvg = midSubjectCount > 0 ? midTotalCount / midSubjectCount : 0;
            const avg = totalSubjectCount > 0 ? totalVal / totalSubjectCount : 0;

            let midStatus = "نامعلوم";
            if (isMahroomMid) {
                midStatus = "غایب (محروم)";
            } else if (midSubjectCount > 0) {
                if (hasLowMidScore) midStatus = "تلاش بیشتر";
                else midStatus = "موفق";
            }

            let resStatus = "نامعلوم";
            if (isMahroomAnnual) {
                resStatus = "محروم";
            } else if (hasAnyData) {
                if (fails === 0 && avg >= 40) {
                    resStatus = "ارتقاء صنف";
                } else if (fails >= 3) {
                    resStatus = "تکرار صنف";
                } else if (fails > 0 && fails < 3) {
                    resStatus = "مشروط";
                } else if (avg < 40) {
                    resStatus = "تکرار صنف";
                } else {
                    resStatus = "در جریان";
                }
            }

            results[s.id] = {
                total: totalVal, avg, midAvg, midStatus, fails,
                result: resStatus, midTotal: midTotalCount, finalTotal: finalTotalCount,
                isMahroomMid, isMahroomAnnual
            };
        });

        const validStudents = students;
        const passedMid = validStudents.filter(s => results[s.id]?.midStatus === "موفق").length;
        const failedMid = validStudents.filter(s => results[s.id]?.midStatus === "تلاش بیشتر").length;
        const mahroomMid = validStudents.filter(s => results[s.id]?.isMahroomMid).length;
        const testedMid = validStudents.filter(s => subjects.some((sub: any) => gradesMatrix[s.id]?.[sub.id]?.MIDTERM !== undefined)).length;

        const passedAnn = validStudents.filter(s => results[s.id]?.result === "ارتقاء صنف").length;
        const mashrutAnn = validStudents.filter(s => results[s.id]?.result === "مشروط").length;
        const failedAnn = validStudents.filter(s => results[s.id]?.result === "تکرار صنف").length;
        const mahroomAnn = validStudents.filter(s => results[s.id]?.result === "محروم").length;
        const testedAnn = validStudents.filter(s => subjects.some((sub: any) => gradesMatrix[s.id]?.[sub.id]?.FINAL !== undefined)).length;

        return {
            individual: results,
            midterm: { total: validStudents.length, tested: testedMid, passed: passedMid, failed: failedMid, mahroom: mahroomMid },
            annual: { total: validStudents.length, tested: testedAnn, passed: passedAnn, mashrut: mashrutAnn, failed: failedAnn, mahroom: mahroomAnn }
        };
    })();

    const handleExportExcel = (type: 'midterm' | 'annual' | 'all') => {
        if (!calculationResults || !classData) return;

        const students = classData.students || [];
        const results = calculationResults.individual;

        let data: any[] = [];
        let fileName = "";

        if (type === 'midterm') {
            fileName = `Midterm_Summary_${classData.name}`;
            data = students.map((s: any) => ({
                [dir === 'rtl' ? 'نام و تخلص' : 'Name']: s.name,
                [dir === 'rtl' ? 'نام پدر' : 'Father Name']: s.fatherName,
                [dir === 'rtl' ? 'مجموع نمرات' : 'Total Score']: results[s.id]?.midTotal || 0,
                [dir === 'rtl' ? 'اوسط' : 'Average']: results[s.id]?.midAvg?.toFixed(2) || 0,
                [dir === 'rtl' ? 'حالت' : 'Status']: results[s.id]?.midStatus
            }));
        } else if (type === 'annual') {
            fileName = `Annual_Summary_${classData.name}`;
            data = students.map((s: any) => ({
                [dir === 'rtl' ? 'نام و تخلص' : 'Name']: s.name,
                [dir === 'rtl' ? 'نام پدر' : 'Father Name']: s.fatherName,
                [dir === 'rtl' ? 'اوسط عمومی' : 'General Average']: results[s.id]?.avg?.toFixed(2) || 0,
                [dir === 'rtl' ? 'ناکام' : 'Fails']: results[s.id]?.fails || 0,
                [dir === 'rtl' ? 'نتیجه نهایی' : 'Final Result']: results[s.id]?.result
            }));
        } else {
            fileName = `Complete_Class_Results_${classData.name}`;
            data = students.map((s: any) => ({
                [dir === 'rtl' ? 'ID شاگرد' : 'Student ID']: s.studentId,
                [dir === 'rtl' ? 'نام و تخلص' : 'Name']: s.name,
                [dir === 'rtl' ? 'نام پدر' : 'Father Name']: s.fatherName,
                [dir === 'rtl' ? 'اوسط ۴.۵ ماهه' : 'Midterm Avg']: results[s.id]?.midAvg?.toFixed(2) || 0,
                [dir === 'rtl' ? 'اوسط سالانه' : 'Annual Avg']: results[s.id]?.avg?.toFixed(2) || 0,
                [dir === 'rtl' ? 'تعداد ناکامی' : 'Fail Count']: results[s.id]?.fails || 0,
                [dir === 'rtl' ? 'نتیجه کلی' : 'Final Result']: results[s.id]?.result
            }));
        }

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Class Data");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        showToast(dir === 'rtl' ? "فایل اکسل با موفقیت دانلود شد" : "Excel file downloaded successfully");
    };

    return (
        <div className="font-sans pb-12" dir={dir}>
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/teacher/classes" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                        </Link>
                        <div className="text-start">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                                {dir === 'rtl' ? 'پروفایل و تنظیمات صنف' : 'Class Profile & Settings'}
                            </h2>
                            <h1 className="text-3xl font-black tracking-tight">
                                {dir === 'rtl' ? 'صنف' : 'Class'} {t?.levels?.[formData.level] || formData.level} {formData.section} {formData.gender === 'BOYS' ? t?.dashboards?.gender_boys : formData.gender === 'GIRLS' ? t?.dashboards?.gender_girls : t?.dashboards?.gender_mixed} ({toPersianNum(formData.academicYear || "1403")})
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button
                            onClick={handleToggleActive}
                            disabled={submitting || !canManageClasses}
                            className={`px-6 py-3 border rounded-2xl transition-all shadow-lg flex items-center gap-2 ${formData.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'} ${(submitting || !canManageClasses) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                {dir === 'rtl' ? 'تنظیمات صنف' : 'Class Settings'}
                            </button>
                            <button
                                onClick={() => setActiveTab("results")}
                                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'results' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <BarChart3 size={18} />
                                {dir === 'rtl' ? 'خلص نتایج و احصائیه' : 'Results & Statistics'}
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === 'details' ? (

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            {/* Class Template & Basic Info (Locked mostly) */}
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                    <Shield className="text-primary" />
                                    {t?.dashboards?.class_identity || (dir === 'rtl' ? 'هویت صنف' : 'Class Identity')}
                                </h3>

                                <div className="space-y-6 text-start">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{dir === 'rtl' ? 'تغییر قالب (اختیاری)' : 'Switch Template (Optional)'}</label>
                                        <select
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer ${!canManageClasses ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.templateId}
                                            onChange={(e) => handleTemplateChange(e.target.value)}
                                            disabled={!canManageClasses}
                                        >
                                            <option value="">{dir === 'rtl' ? 'اطلاعات فعلی را حفظ کنید' : 'Keep current info'}</option>
                                            {templates.map((tpl) => (
                                                <option key={tpl.id} value={tpl.id}>
                                                    {tpl.level} - {tpl.name} ({tpl.section})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-500/5 border border-border">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{dir === 'rtl' ? 'سطح' : 'Level'}</p>
                                            <p className="text-sm font-black text-foreground">{t?.levels?.[formData.level] || formData.level}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-500/5 border border-border">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{dir === 'rtl' ? 'بخش' : 'Section'}</p>
                                            <p className="text-sm font-black text-foreground">{formData.section}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{dir === 'rtl' ? 'سال تحصیلی *' : 'Academic Year *'}</label>
                                        <select
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer ${!canManageClasses ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            required
                                            disabled={!canManageClasses}
                                        >
                                            {Array.from({ length: 1414 - 1390 + 1 }, (_, i) => 1414 - i).map(year => (
                                                <option key={year} value={year.toString()}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.dashboards.homeroom_teacher}</label>
                                        <select
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary ${!canManageClasses ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.teacherId}
                                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                            disabled={!canManageClasses}
                                        >
                                            <option value="">{t.dashboards.class_details.select_teacher}</option>
                                            {teachers.map((teach: any) => (
                                                <option key={teach.id} value={teach.id}>{teach.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Management */}
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6">
                                <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                    <BookOpen className="text-purple-500" />
                                    {t.dashboards.subjects}
                                </h3>
                                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {allSubjects.map((sub: any) => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => toggleSubject(sub.id)}
                                            disabled={!canManageClasses}
                                            className={`px-3 py-2 rounded-lg text-xs font-black transition-all border ${formData.subjectIds.includes(sub.id)
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-slate-50 dark:bg-white/5 border-border hover:border-primary'
                                                } ${!canManageClasses ? 'opacity-80 cursor-not-allowed' : ''}`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6 text-start">
                            {/* Student Management Card */}
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6 flex flex-col min-h-[500px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <Users className="text-cyan-500" />
                                        {t.dashboards.class_details.managed_roster} ({formData.studentIds.length})
                                    </h3>
                                    <div className="relative group w-full md:max-w-xs">
                                        <Search size={16} className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-slate-400 my-auto`} />
                                        <input
                                            type="text"
                                            placeholder={t.dashboards.class_details.search_students}
                                            className={`w-full bg-slate-500/5 border border-border rounded-xl py-2 ${dir === 'rtl' ? 'pr-10' : 'pl-10'} pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20`}
                                            value={studentSearchTerm}
                                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student: any) => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudent(student.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${formData.studentIds.includes(student.id) ? 'bg-primary/10 border-primary shadow-sm' : 'bg-slate-500/5 border-transparent hover:border-slate-300 dark:hover:border-white/20'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-white/10 flex items-center justify-center border border-border">
                                                    {student.image ? (
                                                        <img src={student.image} alt={student.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UserCheck size={20} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="text-start">
                                                    <p className="text-sm font-black text-foreground">{student.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">ID: {student.studentId} • F: {student.fatherName}</p>
                                                </div>
                                            </div>
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${formData.studentIds.includes(student.id) ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-transparent border-slate-300 dark:border-white/10'}`}>
                                                {formData.studentIds.includes(student.id) && <Check size={14} />}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center text-slate-500 italic font-bold">{t.dashboards.no_results}</div>
                                    )}
                                </div>
                            </div>

                            {/* Save Changes Footer */}
                            {canManageClasses ? (
                                <div className="flex flex-col md:flex-row items-center justify-end gap-6">
                                    {error && <div className="text-red-500 font-bold flex items-center gap-2 animate-pulse"><XCircle size={20} />{error}</div>}
                                    {success && <div className="text-emerald-500 font-bold flex items-center gap-2"><CheckCircle size={20} />{t.dashboards.save_changes} !</div>}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-primary px-12 py-5 text-lg font-black text-white shadow-2xl shadow-primary/40 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                                    >
                                        {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                        {t.dashboards.save_changes}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] text-amber-600 gap-3">
                                    <Shield size={24} />
                                    <p className="font-black text-sm">{dir === 'rtl' ? 'این بخش برای شما فقط خواندنی است. تنظیمات صنف توسط مدیر مکتب مدیریت می شود.' : 'This section is read-only for you. Class settings are managed by your school principal.'}</p>
                                </div>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Midterm Summary */}
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                        <TrendingUp className="text-amber-500" />
                                        {dir === 'rtl' ? 'خلص نتایج امتحانات ۴.۵ ماهه' : 'Midterm Exam Summary'}
                                    </h3>
                                    <button
                                        onClick={() => handleExportExcel('midterm')}
                                        className="p-2 hover:bg-amber-500/10 text-amber-500 rounded-xl transition-all"
                                        title={dir === 'rtl' ? 'خروجی اکسل ۴.۵ ماهه' : 'Export Midterm to Excel'}
                                    >
                                        <FileSpreadsheet size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-3xl bg-slate-500/5 border border-border text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{dir === 'rtl' ? 'شامل صنف' : 'Total Students'}</p>
                                        <p className="text-xl font-black">{toPersianNum(calculationResults?.midterm?.total || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 text-center">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">{dir === 'rtl' ? 'شامل امتحان' : 'Participated'}</p>
                                        <p className="text-xl font-black text-indigo-600">{toPersianNum(calculationResults?.midterm?.tested || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">{dir === 'rtl' ? 'موفق' : 'Successful'}</p>
                                        <p className="text-xl font-black text-emerald-600">{toPersianNum(calculationResults?.midterm?.passed || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center">
                                        <p className="text-[10px] font-black text-rose-500 uppercase mb-1">{dir === 'rtl' ? 'تلاش بیشتر' : 'Need Effort'}</p>
                                        <p className="text-xl font-black text-rose-600">{toPersianNum(calculationResults?.midterm?.failed || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-slate-500/5 rounded-2xl border border-border">
                                    <AlertCircle size={16} className="text-amber-500" />
                                    <p className="text-xs font-bold text-slate-600">{dir === 'rtl' ? `محرومین امتحان ۴.۵ ماهه: ${toPersianNum(calculationResults?.midterm?.mahroom || 0)} نفر` : `Deprived: ${calculationResults?.midterm?.mahroom || 0} students`}</p>
                                </div>
                            </div>

                            {/* Annual Summary */}
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-3 text-xl font-black text-start">
                                        <GraduationCap className="text-emerald-500" />
                                        {dir === 'rtl' ? 'خلص نتایج امتحانات سالانه' : 'Annual Exam Summary'}
                                    </h3>
                                    <button
                                        onClick={() => handleExportExcel('annual')}
                                        className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"
                                        title={dir === 'rtl' ? 'خروجی اکسل سالانه' : 'Export Annual to Excel'}
                                    >
                                        <FileSpreadsheet size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <div className="p-4 rounded-3xl bg-slate-500/5 border border-border text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{dir === 'rtl' ? 'شامل صنف' : 'Total'}</p>
                                        <p className="text-lg font-black">{toPersianNum(calculationResults?.annual?.total || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">{dir === 'rtl' ? 'ارتقاء صنف' : 'Promoted'}</p>
                                        <p className="text-lg font-black text-emerald-600">{toPersianNum(calculationResults?.annual?.passed || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-center">
                                        <p className="text-[10px] font-black text-amber-500 uppercase mb-1">{dir === 'rtl' ? 'مشروط' : 'Conditional'}</p>
                                        <p className="text-lg font-black text-amber-600">{toPersianNum(calculationResults?.annual?.mashrut || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center">
                                        <p className="text-[10px] font-black text-rose-500 uppercase mb-1">{dir === 'rtl' ? 'تکرار صنف' : 'Repeat Class'}</p>
                                        <p className="text-lg font-black text-rose-600">{toPersianNum(calculationResults?.annual?.failed || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-slate-500/10 border border-slate-300 text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{dir === 'rtl' ? 'محروم' : 'Deprived'}</p>
                                        <p className="text-lg font-black text-slate-700">{toPersianNum(calculationResults?.annual?.mahroom || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                    <Users size={16} className="text-indigo-500" />
                                    <p className="text-xs font-bold text-slate-600">{dir === 'rtl' ? `تعداد شاگردان امتحان داده (سالانه): ${toPersianNum(calculationResults?.annual?.tested || 0)} نفر` : `Participated: ${calculationResults?.annual?.tested || 0} students`}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Lists */}
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-6 text-start">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <h3 className="flex items-center gap-3 text-2xl font-black">
                                    <FileText className="text-primary" />
                                    {dir === 'rtl' ? 'جدول شهرت و وضعیت شاگردان' : 'Student Status Table'}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleExportExcel('all')}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl font-black text-sm hover:bg-emerald-500 hover:text-white transition-all no-print flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        {dir === 'rtl' ? 'خروجی اکسل' : 'Excel'}
                                    </button>
                                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all no-print">
                                        <Printer size={16} />
                                        {dir === 'rtl' ? 'چاپ لیست' : 'Print List'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Success/Promotion Group */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-emerald-600">
                                        <CheckCircle size={20} />
                                        {dir === 'rtl' ? 'شاگردان کامیاب (ارتقاء صنف)' : 'Successful (Promoted)'}
                                    </h4>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {classData.students.filter((s: any) => calculationResults?.individual?.[s.id]?.result === "ارتقاء صنف").length > 0 ? (
                                            classData.students.filter((s: any) => calculationResults?.individual?.[s.id]?.result === "ارتقاء صنف").map((s: any) => (
                                                <div key={s.id} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black">{s.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500">{dir === 'rtl' ? `ولد: ${s.fatherName} • معدل: ${toPersianNum(calculationResults?.individual?.[s.id]?.avg.toFixed(2))}` : `Father: ${s.fatherName} • Avg: ${calculationResults?.individual?.[s.id]?.avg.toFixed(2)}`}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg">{dir === 'rtl' ? 'کامیاب' : 'Passed'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400 italic">{dir === 'rtl' ? 'موردی یافت نشد.' : 'No students'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Conditional Group */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-amber-600">
                                        <AlertCircle size={20} />
                                        {dir === 'rtl' ? 'شاگردان مشروط' : 'Conditional (Mashrut)'}
                                    </h4>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {classData.students.filter((s: any) => calculationResults?.individual?.[s.id]?.result === "مشروط").length > 0 ? (
                                            classData.students.filter((s: any) => calculationResults?.individual?.[s.id]?.result === "مشروط").map((s: any) => (
                                                <div key={s.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black">{s.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500">{dir === 'rtl' ? `ولد: ${s.fatherName} • مضامین ناکام: ${toPersianNum(calculationResults?.individual?.[s.id]?.fails)}` : `Father: ${s.fatherName} • Failed: ${calculationResults?.individual?.[s.id]?.fails}`}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg">{dir === 'rtl' ? 'مشروط' : 'Conditional'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400 italic">{dir === 'rtl' ? 'موردی یافت نشد.' : 'No students'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Failed Group */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-rose-600">
                                        <XCircle size={20} />
                                        {dir === 'rtl' ? 'شاگردان ناکام (تکرار صنف)' : 'Failed (Repeat Class)'}
                                    </h4>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {classData.students.filter((s: any) => calculationResults?.individual[s.id]?.result === "تکرار صنف").length > 0 ? (
                                            classData.students.filter((s: any) => calculationResults?.individual[s.id]?.result === "تکرار صنف").map((s: any) => (
                                                <div key={s.id} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black">{s.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500">{dir === 'rtl' ? `ولد: ${s.fatherName} • معدل: ${toPersianNum(calculationResults?.individual[s.id]?.avg.toFixed(2))}` : `Father: ${s.fatherName} • Avg: ${calculationResults?.individual[s.id]?.avg.toFixed(2)}`}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg">{dir === 'rtl' ? 'تکرار صنف' : 'Failed'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400 italic">{dir === 'rtl' ? 'موردی یافت نشد.' : 'No students'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Deprived Group */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-slate-600">
                                        <AlertTriangle size={20} />
                                        {dir === 'rtl' ? 'شاگردان محروم' : 'Deprived (Mahroom)'}
                                    </h4>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {classData.students.filter((s: any) => calculationResults?.individual[s.id]?.result === "محروم").length > 0 ? (
                                            classData.students.filter((s: any) => calculationResults?.individual[s.id]?.result === "محروم").map((s: any) => (
                                                <div key={s.id} className="p-3 bg-slate-500/5 border border-slate-500/10 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black">{s.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500">{dir === 'rtl' ? `ولد: ${s.fatherName} • وضعیت: محروم` : `Father: ${s.fatherName} • Status: Deprived`}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-slate-700 text-white text-[10px] font-black rounded-lg">{dir === 'rtl' ? 'محروم' : 'Deprived'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400 italic">{dir === 'rtl' ? 'موردی یافت نشد.' : 'No students'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-10 ${dir === 'rtl' ? 'right-10' : 'left-10'} z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                    <div className={`px-8 py-5 rounded-[2rem] shadow-2xl backdrop-blur-2xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
                        {toast.type === 'success' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        <p className="font-black text-lg">{toast.message}</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
            `}</style>
        </div>
    );
}
