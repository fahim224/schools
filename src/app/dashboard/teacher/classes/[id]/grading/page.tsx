"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Loader2,
    Printer,
    Settings2,
    Type,
    ChevronUp
} from "lucide-react";
import GradeSheet from "@/components/GradeSheet";

export default function TeacherGradingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [classData, setClassData] = useState<any>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [gradesMatrix, setGradesMatrix] = useState<Record<string, Record<string, Record<string, string>>>>({});
    const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, any>>>({});
    const [observationMatrix, setObservationMatrix] = useState<Record<string, string>>({});

    // UI Settings
    const [margins, setMargins] = useState({ top: 5, right: 10, bottom: 5, left: 5 });
    const [fontSize, setFontSize] = useState(9);
    const [rowHeightScale, setRowHeightScale] = useState(1.0);
    const [headerHeightScale, setHeaderHeightScale] = useState(1.0);
    const [signaturesAtBottom, setSignaturesAtBottom] = useState(true);

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        const user = session?.user as any;
        if (user) {
            const isManaged = !!user.createdById;
            const perms = user.permissions || "";
            if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "TEACHER") {
                router.push("/");
                return;
            }
            if (user.role === "TEACHER" && isManaged && !perms.includes("CAN_VIEW_RESULTS")) {
                router.push("/dashboard/teacher/classes");
                return;
            }
        }

        if (session && params.id) {
            fetchInitialData();
        }
    }, [status, session, router, params.id]);

    const canEdit = (session?.user as any)?.role === "ADMIN" ||
        (session?.user as any)?.role === "SUPERADMIN" ||
        !((session?.user as any)?.createdById) ||
        ((session?.user as any)?.permissions || "").includes("CAN_GRADE");

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [classRes, gradesRes, settingsRes, attendanceRes] = await Promise.all([
                fetch(`/api/admin/classes/${params.id}`),
                fetch(`/api/grades?classId=${params.id}`),
                fetch("/api/settings"),
                fetch(`/api/attendance?classId=${params.id}`)
            ]);

            if (classRes.ok) {
                const classData = await classRes.json();
                const gradesData = gradesRes.ok ? await gradesRes.json() : [];
                const settingsData = settingsRes.ok ? await settingsRes.json() : null;
                const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];

                setClassData(classData);
                setSchoolSettings(settingsData);

                const matrix: Record<string, Record<string, Record<string, string>>> = {};
                const attMatrix: Record<string, Record<string, any>> = {};
                const obsMatrix: Record<string, string> = {};

                classData.students?.forEach((student: any) => {
                    matrix[student.id] = {};
                    attMatrix[student.id] = {
                        MIDTERM: { days: "100", present: "100", absent: "0", sick: "0", leave: "0" },
                        FINAL: { days: "100", present: "100", absent: "0", sick: "0", leave: "0" }
                    };
                    obsMatrix[student.id] = "";
                    classData.subjects?.forEach((subject: any) => {
                        matrix[student.id][subject.id] = { MIDTERM: "", FINAL: "" };
                    });
                });

                gradesData.forEach((g: any) => {
                    if (matrix[g.studentId] && matrix[g.studentId][g.subjectId]) {
                        matrix[g.studentId][g.subjectId][g.type] = g.score.toString();
                    }
                });

                attendanceData.forEach((a: any) => {
                    if (attMatrix[a.studentId]) {
                        attMatrix[a.studentId][a.type] = {
                            days: a.days || "100",
                            present: a.present || "100",
                            absent: a.absent || "0",
                            sick: a.sick || "0",
                            leave: a.leave || "0"
                        };
                        if (a.type === "MIDTERM" && a.remarks) obsMatrix[a.studentId] = a.remarks;
                    }
                });

                setGradesMatrix(matrix);
                setAttendanceMatrix(attMatrix);
                setObservationMatrix(obsMatrix);
            }
        } catch (err) {
            setError("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (submitting || !canEdit) return;
        setSubmitting(true);
        try {
            const bulkGrades: any[] = [];
            Object.entries(gradesMatrix).forEach(([studentId, subjects]) => {
                Object.entries(subjects).forEach(([subjectId, types]) => {
                    if (types.MIDTERM !== "") bulkGrades.push({ studentId, subjectId, type: "MIDTERM", score: types.MIDTERM });
                    if (types.FINAL !== "") bulkGrades.push({ studentId, subjectId, type: "FINAL", score: types.FINAL });
                });
            });

            const bulkAttendance: any[] = [];
            Object.entries(attendanceMatrix).forEach(([studentId, types]) => {
                const mid = types.MIDTERM;
                const fin = types.FINAL;
                const obs = observationMatrix[studentId] || "";
                bulkAttendance.push({ studentId, type: "MIDTERM", ...mid, remarks: obs });
                bulkAttendance.push({ studentId, type: "FINAL", ...fin });
            });

            await Promise.all([
                fetch("/api/grades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId: params.id, bulkGrades }) }),
                fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId: params.id, bulkAttendance }) })
            ]);
            setIsDirty(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isDirty || !canEdit) return;
        const timer = setTimeout(() => handleSave(), 2000);
        return () => clearTimeout(timer);
    }, [gradesMatrix, attendanceMatrix, observationMatrix, isDirty]);

    const handleGradeChange = (studentId: string, subjectId: string, type: string, value: string) => {
        if (!canEdit) return;
        const val = parseFloat(value);
        if (type === "MIDTERM" && val > 40) return;
        if (type === "FINAL" && val > 60) return;
        setGradesMatrix(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [subjectId]: { ...prev[studentId][subjectId], [type]: value } }
        }));
        setIsDirty(true);
    };

    const handleAttendanceChange = (studentId: string, type: string, field: string, value: string) => {
        if (!canEdit) return;
        setAttendanceMatrix(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [type]: { ...prev[studentId][type], [field]: value } }
        }));
        setIsDirty(true);
    };

    const handleObservationChange = (studentId: string, value: string) => {
        if (!canEdit) return;
        setObservationMatrix(prev => ({ ...prev, [studentId]: value }));
        setIsDirty(true);
    };

    const subjects = useMemo(() => {
        return [...(classData?.subjects || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, 'fa'));
    }, [classData]);

    const getAfghanGrade = (score: number, maxScore: number) => {
        const p = (score / maxScore) * 100;
        if (p >= 90) return "الف";
        if (p >= 75) return "ب";
        if (p >= 60) return "ج";
        if (p >= 40) return "د";
        return "هـ";
    };

    const studentResults = useMemo(() => {
        const results: Record<string, any> = {};
        const students = classData?.students || [];

        students.forEach((s: any) => {
            let total = 0, midTotal = 0, finTotal = 0, midCount = 0, totalCount = 0, fails = 0, lowMid = false;
            subjects.forEach(sub => {
                const mid = gradesMatrix[s.id]?.[sub.id]?.MIDTERM;
                const fin = gradesMatrix[s.id]?.[sub.id]?.FINAL;
                const mV = mid !== "" ? parseFloat(mid) : -1;
                const fV = fin !== "" ? parseFloat(fin) : -1;

                if (mV !== -1) { midTotal += mV; midCount++; if (mV < 16) lowMid = true; }
                if (fV !== -1) finTotal += fV;
                if (mV !== -1 || fV !== -1) {
                    const sum = (mV === -1 ? 0 : mV) + (fV === -1 ? 0 : fV);
                    total += sum; totalCount++; if (sum < 40) fails++;
                }
            });

            const midAvg = midCount > 0 ? midTotal / midCount : 0;
            const avg = totalCount > 0 ? total / totalCount : 0;
            const isMahroomMid = (parseFloat(attendanceMatrix[s.id]?.MIDTERM?.absent) || 0) >= 25;
            const isMahroomAnnual = ((parseFloat(attendanceMatrix[s.id]?.MIDTERM?.absent) || 0) + (parseFloat(attendanceMatrix[s.id]?.FINAL?.absent) || 0)) >= 50;

            let midStatus = isMahroomMid ? "محروم" : (midCount > 0 ? (lowMid ? "تلاش بیشتر" : "موفق") : "");
            let resStatus = isMahroomAnnual ? "محروم" : (totalCount > 0 ? (avg >= 40 && fails === 0 ? "ارتقاء صنف" : (fails >= 3 || avg < 40 ? "تکرار صنف" : "مشروط")) : "");

            results[s.id] = {
                midTotal, finalTotal: finTotal, total, midAvg, avg,
                midGrade: midCount > 0 ? getAfghanGrade(midAvg, 40) : "",
                annualGrade: totalCount > 0 ? getAfghanGrade(avg, 100) : "",
                midStatus, result: resStatus
            };
        });
        return results;
    }, [classData, subjects, gradesMatrix, attendanceMatrix]);

    const sortedStudents = useMemo(() => {
        return [...(classData?.students || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "", 'fa'));
    }, [classData]);

    const studentChunks = useMemo(() => {
        const list = [...sortedStudents];
        const chunks = [];
        const SIZE = 4;
        for (let i = 0; i < list.length; i += SIZE) {
            const chunk = list.slice(i, i + SIZE);
            const enhanced = chunk.map(s => {
                const grades: Record<string, any> = {};
                subjects.forEach(sub => {
                    grades[sub.id] = {
                        MIDTERM: gradesMatrix[s.id]?.[sub.id]?.MIDTERM,
                        FINAL: gradesMatrix[s.id]?.[sub.id]?.FINAL
                    };
                });
                return { ...s, grades };
            });
            chunks.push(enhanced);
        }
        return chunks;
    }, [sortedStudents, subjects, gradesMatrix]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="min-h-screen bg-slate-100 text-black font-['Vazirmatn']" dir="rtl">
            <div className="no-print sticky top-0 z-50 bg-white shadow-xl p-4 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-2.5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-sm"><ArrowLeft size={22} /></button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">مدیریت نمرات (استاد)</h1>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">صنف: {classData.level} {classData.section}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isDirty && <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100"><div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div><span className="text-xs text-amber-600 font-black">در حال ثبت خودکار...</span></div>}
                    <button onClick={() => window.print()} className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black transition-all active:scale-95"><Printer size={20} /> چاپ جدول</button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* GradeSheet Display */}
                <div className="preview-container flex flex-col items-center gap-10 overflow-x-auto pb-40">
                    <p className="no-print text-center text-slate-400 font-bold mb-4 bg-white/50 px-6 py-2 rounded-full border border-white">نکته: نمرات را مستقیماً داخل خانه‌های جدول وارد کنید.</p>
                    {studentChunks.map((chunk, idx) => (
                        <GradeSheet
                            key={idx}
                            pageIndex={idx}
                            totalPages={studentChunks.length}
                            margins={margins}
                            fontSize={fontSize}
                            rowHeightScale={rowHeightScale}
                            headerHeightScale={headerHeightScale}
                            signaturesAtBottom={signaturesAtBottom}
                            schoolSettings={schoolSettings}
                            classData={classData}
                            students={chunk}
                            subjects={subjects}
                            studentResults={studentResults}
                            attendanceMatrix={attendanceMatrix}
                            observationMatrix={observationMatrix}
                            isEditable={canEdit}
                            onGradeChange={handleGradeChange}
                            onAttendanceChange={handleAttendanceChange}
                            onObservationChange={handleObservationChange}
                        />
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .preview-container { gap: 0 !important; padding: 0 !important; overflow: visible !important; }
                    .preview-container p { display: none !important; }
                    .container { max-width: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
