
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
    BookOpen,
    Users
} from "lucide-react";
import ShoqaSheet, { ShoqaType } from "@/components/ShoqaSheet";

export default function ShoqaPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<any>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [gradesMatrix, setGradesMatrix] = useState<Record<string, Record<string, Record<string, string>>>>({});
    const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, any>>>({});

    // Shoqa Specific Settings
    const [shoqaType, setShoqaType] = useState<ShoqaType>(ShoqaType.MAZMOON);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [hideSubjectName, setHideSubjectName] = useState(false);
    const [margins, setMargins] = useState({ top: 3, right: 3, bottom: 3, left: 3 });
    const [fontSize, setFontSize] = useState(8);
    const [studentsPerPage, setStudentsPerPage] = useState(40);
    const [rowHeight, setRowHeight] = useState(3.8);
    const [examType, setExamType] = useState("سالانه");
    const [hideTeacher, setHideTeacher] = useState(false);
    const [hideStudents, setHideStudents] = useState(false);
    const [printOrientation, setPrintOrientation] = useState<"landscape" | "portrait">("landscape");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }
        if (session && params.id) {
            fetchInitialData();
        }
    }, [status, session, params.id]);

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
                const cData = await classRes.json();
                setClassData(cData);
                if (cData.subjects?.length > 0) setSelectedSubjectId(cData.subjects[0].id);

                setSchoolSettings(settingsRes.ok ? await settingsRes.json() : null);

                // Build Matrix
                const matrix: any = {};
                const attMatrix: any = {};
                cData.students?.forEach((s: any) => {
                    matrix[s.id] = {};
                    attMatrix[s.id] = {
                        MIDTERM: { days: "100", present: "100", absent: "0", sick: "0", leave: "0" },
                        FINAL: { days: "100", present: "100", absent: "0", sick: "0", leave: "0" }
                    };
                    cData.subjects?.forEach((sub: any) => {
                        matrix[s.id][sub.id] = { MIDTERM: "", FINAL: "" };
                    });
                });

                const gradesData = gradesRes.ok ? await gradesRes.json() : [];
                gradesData.forEach((g: any) => {
                    if (matrix[g.studentId] && matrix[g.studentId][g.subjectId]) {
                        matrix[g.studentId][g.subjectId][g.type] = g.score.toString();
                    }
                });

                setGradesMatrix(matrix);
                setAttendanceMatrix(attMatrix);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sortedStudents = useMemo(() => {
        return [...(classData?.students || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "", 'fa'));
    }, [classData]);

    const studentChunks = useMemo(() => {
        const list = sortedStudents.map(s => ({
            ...s,
            grades: gradesMatrix[s.id] || {},
            attendance: attendanceMatrix[s.id] || {}
        }));
        const chunks = [];
        const SIZE = studentsPerPage > 0 ? studentsPerPage : 30; // Prevent divide by zero or negative
        for (let i = 0; i < list.length; i += SIZE) {
            chunks.push(list.slice(i, i + SIZE));
        }
        return chunks;
    }, [sortedStudents, gradesMatrix, attendanceMatrix, studentsPerPage]);

    const currentSubject = useMemo(() => {
        return classData?.subjects?.find((s: any) => s.id === selectedSubjectId);
    }, [classData, selectedSubjectId]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {/* Header / Controls */}
            <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b shadow-md pb-4 pt-3 px-4 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 font-sans rtl">

                    {/* Top Row: Title & Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2.5 bg-slate-100/80 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 tracking-tight">تنظیمات چاپ شقه</h1>
                                <p className="text-xs text-slate-500 font-bold mt-0.5">{classData?.level} {classData?.section} | {classData?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 flex-grow md:flex-grow-0">
                                <button
                                    onClick={() => setShoqaType(ShoqaType.MAZMOON)}
                                    className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all ${shoqaType === ShoqaType.MAZMOON ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    شقه نمرات
                                </button>
                                <button
                                    onClick={() => setShoqaType(ShoqaType.ZAWABIT)}
                                    className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all ${shoqaType === ShoqaType.ZAWABIT ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    شقه حاضری
                                </button>
                            </div>
                            <button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full md:w-auto">
                                <Printer size={18} />
                                چاپ نهایی
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Controls Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 pt-2 border-t border-slate-200/60">
                        {/* Column 1: Config */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-slate-500 mr-2">تنظیمات کاغذ</span>
                            <select
                                value={printOrientation}
                                onChange={(e) => setPrintOrientation(e.target.value as "landscape" | "portrait")}
                                className="w-full bg-white border-slate-200 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700 shadow-sm"
                            >
                                <option value="landscape">خوابیده (A4)</option>
                                <option value="portrait">ایستاده (A4)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-slate-500 mr-2">نوعیت امتحان</span>
                            <select
                                value={examType}
                                onChange={(e) => setExamType(e.target.value)}
                                className="w-full bg-white border-slate-200 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700 shadow-sm"
                            >
                                <option value="چهارنیم ماهه">چهارنیم ماهه</option>
                                <option value="سالانه">سالانه</option>
                            </select>
                        </div>

                        {/* Column 2: Dimensions */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-slate-500 mr-2">تعداد شاگرد</span>
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                                <Users size={14} className="text-slate-400 mx-1" />
                                <input
                                    type="number" min="1" max="100"
                                    className="bg-transparent w-full text-xs font-bold text-center outline-none text-slate-800"
                                    value={studentsPerPage}
                                    onChange={(e) => setStudentsPerPage(parseInt(e.target.value) || 40)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-slate-500 mr-2">ارتفاع سطر (mm)</span>
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                                <Settings2 size={14} className="text-slate-400 mx-1" />
                                <input
                                    type="number" step="0.1" min="3" max="15"
                                    className="bg-transparent w-full text-xs font-bold text-center outline-none text-slate-800"
                                    value={rowHeight}
                                    onChange={(e) => setRowHeight(parseFloat(e.target.value) || 3.8)}
                                />
                            </div>
                        </div>

                        {/* Column 3: Visibilities */}
                        {shoqaType === ShoqaType.MAZMOON && (
                            <div className="flex flex-col gap-1.5 min-w-0 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-3">
                                <span className="text-[10px] font-black text-slate-500 mr-2">نمایش محتوا در شقه</span>
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex-1 min-w-[120px] flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <select
                                            value={selectedSubjectId}
                                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                                            className="w-full bg-transparent px-3 py-2 text-xs font-bold outline-none text-slate-700"
                                        >
                                            {classData?.subjects?.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setHideSubjectName(!hideSubjectName)}
                                        className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-black transition-all border ${hideSubjectName ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        نام مضمون
                                    </button>
                                    <button
                                        onClick={() => setHideTeacher(!hideTeacher)}
                                        className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-black transition-all border ${hideTeacher ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        استاد
                                    </button>
                                    <button
                                        onClick={() => setHideStudents(!hideStudents)}
                                        className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-black transition-all border ${hideStudents ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        شاگردان
                                    </button>
                                </div>
                            </div>
                        )}
                        {shoqaType === ShoqaType.ZAWABIT && (
                            <div className="flex flex-col gap-1.5 min-w-0 col-span-2 sm:col-span-1 lg:col-span-1 xl:col-span-2">
                                <span className="text-[10px] font-black text-slate-500 mr-2">نمایش محتوا در شقه</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setHideTeacher(!hideTeacher)}
                                        className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-black transition-all border ${hideTeacher ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        امضاء استاد
                                    </button>
                                    <button
                                        onClick={() => setHideStudents(!hideStudents)}
                                        className={`flex-1 min-w-[90px] px-3 py-2 rounded-xl text-xs font-black transition-all border ${hideStudents ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        لست شاگردان
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Preview */}
            <div className="preview-container flex flex-col items-center gap-10 mt-10">
                {studentChunks.length === 0 ? (
                    <div className="text-slate-400 font-bold py-20 flex flex-col items-center gap-4">
                        <Users size={48} className="opacity-20" />
                        شاگردی در این صنف یافت نشد.
                    </div>
                ) : (
                    // Render dynamically based on printOrientation
                    studentChunks.map((chunk, pageIdx) => (
                        <div
                            key={pageIdx}
                            className="print-page flex bg-white justify-center items-start shadow-md border"
                            style={{
                                width: printOrientation === "landscape" ? '297mm' : '210mm',
                                height: printOrientation === "landscape" ? '210mm' : '297mm',
                                boxSizing: 'border-box',
                                flexDirection: "row"
                            }}
                        >
                            <ShoqaSheet
                                type={shoqaType}
                                margins={margins}
                                fontSize={fontSize}
                                schoolSettings={schoolSettings}
                                classData={classData}
                                students={chunk}
                                subject={currentSubject}
                                studentResults={gradesMatrix}
                                attendanceMatrix={attendanceMatrix}
                                pageIndex={pageIdx}
                                totalPages={studentChunks.length}
                                hideSubject={hideSubjectName}
                                studentsPerPage={studentsPerPage}
                                rowHeight={rowHeight}
                                examType={examType}
                                hideTeacher={hideTeacher}
                                hideStudents={hideStudents}
                                printOrientation={printOrientation}
                            />
                            {/* Duplicate the EXACT SAME copy (Always 2 copies, no matter landscape or portrait!) */}
                            <ShoqaSheet
                                type={shoqaType}
                                margins={margins}
                                fontSize={fontSize}
                                schoolSettings={schoolSettings}
                                classData={classData}
                                students={chunk}
                                subject={currentSubject}
                                studentResults={gradesMatrix}
                                attendanceMatrix={attendanceMatrix}
                                pageIndex={pageIdx}
                                totalPages={studentChunks.length}
                                hideSubject={hideSubjectName}
                                studentsPerPage={studentsPerPage}
                                rowHeight={rowHeight}
                                examType={examType}
                                hideTeacher={hideTeacher}
                                hideStudents={hideStudents}
                                printOrientation={printOrientation}
                            />
                        </div>
                    ))
                )}
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .preview-container { gap: 0 !important; margin-top: 0 !important; }
                    @page {
                        size: A4 ${printOrientation};
                        margin: 0 !important;
                    }
                    .print-page { 
                        page-break-after: always; 
                        outline: none !important; 
                        border: none !important; 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}
