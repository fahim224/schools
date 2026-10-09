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
    ChevronUp,
    Download
} from "lucide-react";
import GradeSheet from "@/components/GradeSheet";
import GradeSheetHighSchool from "@/components/GradeSheetHighSchool";

export default function GradingPage() {
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
    const [tableFontSize, setTableFontSize] = useState(8);
    const [rowHeightScale, setRowHeightScale] = useState(1.0);
    const [headerHeightScale, setHeaderHeightScale] = useState(1.0);
    const [signaturesAtBottom, setSignaturesAtBottom] = useState(true);
    const [hidePageNumber, setHidePageNumber] = useState(false);
    const [isHighSchool, setIsHighSchool] = useState(false);

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }
        if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
            return;
        }
        if (session && params.id) {
            fetchInitialData();
        }
    }, [status, session, router, params.id]);

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
        if (submitting) return;
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
            setError("Save failed");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isDirty) return;
        const timer = setTimeout(() => handleSave(), 2000);
        return () => clearTimeout(timer);
    }, [gradesMatrix, attendanceMatrix, observationMatrix, isDirty]);

    const handleGradeChange = (studentId: string, subjectId: string, type: string, value: string) => {
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
        setAttendanceMatrix(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [type]: { ...prev[studentId][type], [field]: value } }
        }));
        setIsDirty(true);
    };

    const handleObservationChange = (studentId: string, value: string) => {
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
        const SIZE = isHighSchool ? 3 : 4;
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
                        <h1 className="text-2xl font-black text-slate-800">جدول نمرات و نتایج</h1>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">صنف: {classData.level} {classData.section} | تعداد شاگردان: {classData.students?.length} <span className="text-primary pr-48">نکته: نمرات را مستقیماً داخل خانه های جدول وارد کنید. تغییرات بصورت خودکار ذخیره میشوند.</span></p>

                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isDirty && <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100"><div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div><span className="text-xs text-amber-600 font-black">در حال ثبت خودکار...</span></div>}
                    <button onClick={() => window.print()} className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all active:scale-95"><Printer size={20} /> چاپ جدول نتایج</button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Settings Panel */}
                <div className="no-print bg-white/70 backdrop-blur-md rounded-[2rem] p-4 shadow-xl border border-white mb-6 flex flex-wrap items-end gap-4">
                    <div className="space-y-1 w-28">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 px-1"><Type size={12} /> قلم عمومی</label>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100">
                            <button onClick={() => setFontSize(Math.max(6, fontSize - 0.5))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">-</button>
                            <span className="flex-1 text-center font-black text-xs">{fontSize}</span>
                            <button onClick={() => setFontSize(Math.min(14, fontSize + 0.5))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">+</button>
                        </div>
                    </div>
                    <div className="space-y-1 w-28">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 px-1"><Type size={12} /> قلم جدول</label>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100">
                            <button onClick={() => setTableFontSize(Math.max(4, tableFontSize - 0.5))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">-</button>
                            <span className="flex-1 text-center font-black text-xs">{tableFontSize}</span>
                            <button onClick={() => setTableFontSize(Math.min(14, tableFontSize + 0.5))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">+</button>
                        </div>
                    </div>
                    <div className="space-y-1 w-28">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 px-1"><Settings2 size={12} /> ارتفاع سطرها</label>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100">
                            <button onClick={() => setRowHeightScale(Math.max(0.5, rowHeightScale - 0.05))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">-</button>
                            <span className="flex-1 text-center font-black text-xs">{rowHeightScale.toFixed(2)}</span>
                            <button onClick={() => setRowHeightScale(Math.min(2, rowHeightScale + 0.05))} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm">+</button>
                        </div>
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 px-1"><ChevronUp size={12} /> حاشیه‌ها (بالا/پائین/راست/چپ)</label>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
                            {[
                                { key: 'top', label: 'بالا' }, { key: 'bottom', label: 'پائین' },
                                { key: 'right', label: 'راست' }, { key: 'left', label: 'چپ' }
                            ].map(dir => (
                                <div key={dir.key} className="flex items-center gap-1 justify-center">
                                    <span className="text-[8px] font-bold text-slate-400 w-4">{dir.label}</span>
                                    <button onClick={() => setMargins(m => ({ ...m, [dir.key]: Math.max(0, (m as any)[dir.key] - 1) }))} className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-[10px]">-</button>
                                    <span className="w-3 text-center font-black text-[10px]">{(margins as any)[dir.key]}</span>
                                    <button onClick={() => setMargins(m => ({ ...m, [dir.key]: (m as any)[dir.key] + 1 }))} className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-[10px]">+</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSignaturesAtBottom(!signaturesAtBottom)} className={`h-8 px-3 rounded-lg font-black text-[10px] border transition-all shadow-sm ${signaturesAtBottom ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-400"}`}>
                            محل امضا: {signaturesAtBottom ? "پائین" : "بالا + پائین"}
                        </button>
                        <button onClick={() => setHidePageNumber(!hidePageNumber)} className={`h-8 px-3 rounded-lg font-black text-[10px] border transition-all shadow-sm ${!hidePageNumber ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-400"}`}>
                            {!hidePageNumber ? "نمایش صفحه" : "عدم نمایش صفحه"}
                        </button>
                        <button onClick={() => setIsHighSchool(!isHighSchool)} className={`h-8 px-3 rounded-lg font-black text-[10px] border transition-all shadow-sm ${isHighSchool ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-100 text-slate-400"}`}>
                            {isHighSchool ? "نسخه لیسه (۱۰-۱۱)" : "نسخه ابتدائیه"}
                        </button>
                    </div>
                </div>

                {/* GradeSheet Display */}
                <div className="preview-container flex flex-col items-center gap-10 overflow-x-auto pb-40">

                    {studentChunks.map((chunk, idx) => (
                        isHighSchool ? (
                            <GradeSheetHighSchool
                                key={idx}
                                pageIndex={idx}
                                totalPages={studentChunks.length}
                                margins={margins}
                                fontSize={fontSize}
                                tableFontSize={tableFontSize}
                                rowHeightScale={rowHeightScale}
                                headerHeightScale={headerHeightScale}
                                signaturesAtBottom={signaturesAtBottom}
                                hidePageNumber={hidePageNumber}
                                schoolSettings={schoolSettings}
                                classData={classData}
                                students={chunk}
                                subjects={subjects}
                                studentResults={studentResults}
                                attendanceMatrix={attendanceMatrix}
                                observationMatrix={observationMatrix}
                                isEditable={true}
                                onGradeChange={handleGradeChange}
                                onAttendanceChange={handleAttendanceChange}
                                onObservationChange={handleObservationChange}
                            />
                        ) : (
                            <GradeSheet
                                key={idx}
                                pageIndex={idx}
                                totalPages={studentChunks.length}
                                margins={margins}
                                fontSize={fontSize}
                                tableFontSize={tableFontSize}
                                rowHeightScale={rowHeightScale}
                                headerHeightScale={headerHeightScale}
                                signaturesAtBottom={signaturesAtBottom}
                                hidePageNumber={hidePageNumber}
                                schoolSettings={schoolSettings}
                                classData={classData}
                                students={chunk}
                                subjects={subjects}
                                studentResults={studentResults}
                                attendanceMatrix={attendanceMatrix}
                                observationMatrix={observationMatrix}
                                isEditable={true}
                                onGradeChange={handleGradeChange}
                                onAttendanceChange={handleAttendanceChange}
                                onObservationChange={handleObservationChange}
                            />
                        )
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
