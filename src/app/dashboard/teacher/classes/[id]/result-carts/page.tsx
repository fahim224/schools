"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Loader2,
    Printer,
    Users
} from "lucide-react";
import Link from "next/link";

// Helper for Persian numbers
const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const GRADING_SYSTEM = {
    MIDTERM: [
        { grade: 'الف', range: '36 - 40' },
        { grade: 'ب', range: '30 - 35.9' },
        { grade: 'ج', range: '24 - 29.9' },
        { grade: 'د', range: '20 - 23.9' },
        { grade: 'هـ', range: 'کمتر از 16' },
    ],
    ANNUAL: [
        { grade: 'الف', range: '90 - 100' },
        { grade: 'ب', range: '75 - 89.9' },
        { grade: 'ج', range: '60 - 74.9' },
        { grade: 'د', range: '50 - 59.9' },
        { grade: 'هـ', range: 'کمتر از 50' },
    ]
};

export default function BulkResultCartsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<any>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [allGrades, setAllGrades] = useState<any[]>([]);
    const [allAttendance, setAllAttendance] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [tableFontSize] = useState(10);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        const user = session?.user as any;
        if (user) {
            const isManaged = !!user.createdById;
            const perms = user.permissions || "";

            if (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
                router.push("/");
                return;
            }

            // Check if teacher has permission to print report cards
            if (user.role === "TEACHER" && isManaged && !perms.includes("CAN_PRINT_CARTS")) {
                router.push("/dashboard/teacher/classes");
                return;
            }
        }

        if (session && params.id) {
            fetchBulkData();
        }
    }, [status, session, router, params.id]);

    const fetchBulkData = async () => {
        try {
            setLoading(true);
            const [classRes, gradesRes, settingsRes, attRes] = await Promise.all([
                fetch(`/api/admin/classes/${params.id}`),
                fetch(`/api/grades?classId=${params.id}`),
                fetch("/api/settings"),
                fetch(`/api/attendance?classId=${params.id}`)
            ]);

            if (classRes.ok && gradesRes.ok && settingsRes.ok && attRes.ok) {
                setClassData(await classRes.json());
                setAllGrades(await gradesRes.json());
                setSchoolSettings(await settingsRes.json());
                setAllAttendance(await attRes.json());
            } else {
                setError("Failed to load historical data for printing.");
            }
        } catch (err) {
            setError("Error fetching data.");
        } finally {
            setLoading(false);
        }
    };

    const processStudentData = (student: any) => {
        const studentGrades = allGrades.filter(g => g.studentId === student.id);
        const studentAtt = allAttendance.filter(a => a.studentId === student.id);

        const sortedSubjects = (classData.subjects || []).map((sub: any) => {
            const midterm = studentGrades.find(g => g.subjectId === sub.id && g.type === 'MIDTERM')?.score;
            const final = studentGrades.find(g => g.subjectId === sub.id && g.type === 'FINAL')?.score;
            return {
                id: sub.id,
                name: sub.name,
                order: sub.order,
                midterm: midterm !== undefined ? Number(midterm) : '',
                annual: final !== undefined ? Number(final) : ''
            };
        });

        // Totals
        const midtermTotal = sortedSubjects.reduce((acc: number, curr: any) => acc + (Number(curr.midterm) || 0), 0);
        const annualTotal = sortedSubjects.reduce((acc: number, curr: any) => acc + (Number(curr.annual) || 0), 0);
        const grandTotal = midtermTotal + annualTotal;

        const validMidterms = sortedSubjects.filter((s: any) => s.midterm !== '').length;
        const validAnnuals = sortedSubjects.filter((s: any) => s.annual !== '').length;
        const validFinals = sortedSubjects.filter((s: any) => s.midterm !== '' || s.annual !== '').length;

        const midtermAvg = validMidterms ? (midtermTotal / validMidterms).toFixed(2) : "0.00";
        const annualAvg = validAnnuals ? (annualTotal / validAnnuals).toFixed(2) : "0.00";
        const grandAvg = validFinals ? (grandTotal / validFinals).toFixed(2) : "0.00";

        const attendanceSummary = {
            present: studentAtt.reduce((acc, curr) => acc + (Number(curr.present) || 0), 0),
            absent: studentAtt.reduce((acc, curr) => acc + (Number(curr.absent) || 0), 0),
            sick: studentAtt.reduce((acc, curr) => acc + (Number(curr.sick) || 0), 0),
            leave: studentAtt.reduce((acc, curr) => acc + (Number(curr.leave) || 0), 0),
        };

        return { subjects: sortedSubjects, midtermTotal, annualTotal, grandTotal, midtermAvg, annualAvg, grandAvg, attendanceSummary };
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;
    if (!classData || !classData.students) return <div className="p-20 text-center font-bold">No students found in this class.</div>;

    const exportToPdf = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-12 px-4 flex flex-col items-center overflow-x-hidden main-print-wrapper" dir="rtl">
            {/* Control Panel */}
            <div className="max-w-[1000px] w-full mb-12 bg-card border border-border p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 no-print border-b-4 border-emerald-600">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/teacher/classes/${params.id}`} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-primary transition-all group">
                        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div className="text-start">
                        <h1 className="text-xl font-black">مدیریت چاپ دسته‌جمعی اطلاع‌نامه‌ها</h1>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users size={12} className="text-primary" />
                            {classData.name} - {toPersianNum(classData.students.length)} شاگرد
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={exportToPdf}
                        className="px-6 py-2.5 bg-blue-700 text-white rounded-full font-bold shadow-md hover:bg-blue-800 transition-all flex items-center gap-2"
                    >
                        <Printer size={18} />
                        دانلود PDF / چاپ
                    </button>
                </div>
            </div>

            {/* Print Container */}
            <div className="print-area space-y-0 w-full flex flex-col items-center">
                {classData.students.map((student: any) => {
                    const data = processStudentData(student);
                    return (
                        <div key={student.id} className="print-container bg-white shadow-2xl report-border relative text-black mb-10 w-[210mm] min-h-[297mm] p-[10mm] flex flex-col" style={{ direction: 'rtl', pageBreakAfter: 'always' }}>
                            {/* Header Section */}
                            <div className="flex justify-between items-center mb-4 bg-white">
                                <div className="w-20 h-20 flex items-center justify-center bg-white border border-gray-100 rounded">
                                    {schoolSettings?.logoRight ? <img src={schoolSettings.logoRight} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="text-[10px] text-gray-300">لوگو</div>}
                                </div>

                                <div className="text-center flex flex-col flex-grow mx-4 bg-white">
                                    <h2 className="text-sm font-bold bg-white">{schoolSettings?.headerTitle1 || "وزارت معارف"}</h2>
                                    <h3 className="text-[12px] font-bold bg-white">{schoolSettings?.headerTitle2 || "ریاست معارف (شهر کابل)"}</h3>
                                    <h4 className="text-[12px] font-bold bg-white">{schoolSettings?.headerTitle3 || "آمریت معارف (هفدهم)"}</h4>
                                    <h5 className="text-base font-black mt-1 bg-white">{schoolSettings?.schoolName || "لیسه عالی خصوصی نیکان"}</h5>
                                </div>

                                <div className="w-20 h-20 flex items-center justify-center bg-white border border-gray-100 rounded">
                                    {schoolSettings?.logoLeft ? <img src={schoolSettings.logoLeft} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="text-[10px] text-gray-300">لوگو</div>}
                                </div>
                            </div>

                            {/* Banner with info */}
                            <div className="grid grid-cols-4 gap-0 mb-3 text-[10px] font-bold text-center border-collapse">
                                <div className="bg-emerald-700 text-white p-1.5 border border-black">صنف: {classData.level} {classData.section}</div>
                                <div className="bg-red-700 text-white p-1.5 border border-black border-r-0">نگران: {classData.teacher?.name || "---"}</div>
                                <div className="bg-sky-700 text-white p-1.5 border border-black border-r-0">سال: {toPersianNum(classData.academicYear || "1403")}</div>
                                <div className="bg-black text-white p-1.5 border border-black border-r-0">نمبر اساس: {toPersianNum(student.studentId)}</div>
                            </div>

                            <div className="flex gap-3 bg-white flex-grow overflow-hidden">
                                {/* Right Column: Personal Info & Scores */}
                                <div className="w-[61%] flex flex-col gap-2 bg-white">
                                    <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: `${tableFontSize}px` }}>
                                        <tbody>
                                            <tr>
                                                <td rowSpan={6} className="cell-border p-0 w-[35px] bg-white text-center">
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <span className="font-black" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: `${tableFontSize + 1}px` }}>شـهـرت</span>
                                                    </div>
                                                </td>
                                                <td className="cell-border bg-white p-1 font-black w-[50px]">نام</td>
                                                <td className="cell-border p-1 font-bold bg-white">{student.name}</td>
                                                <td className="cell-border bg-white p-1 font-black w-[50px]">Name</td>
                                                <td className="cell-border p-1 font-bold bg-white font-sans">{student.englishName || '---'}</td>
                                            </tr>
                                            <tr>
                                                <td className="cell-border bg-white p-1 font-black">تخلص</td>
                                                <td className="cell-border p-1 font-bold bg-white">{student.lastName || '---'}</td>
                                                <td className="cell-border bg-white p-1 font-black">L/Name</td>
                                                <td className="cell-border p-1 font-bold bg-white font-sans">{student.englishLastName || '---'}</td>
                                            </tr>
                                            <tr>
                                                <td className="cell-border bg-white p-1 font-black">نام پدر</td>
                                                <td className="cell-border p-1 font-bold bg-white">{student.fatherName}</td>
                                                <td className="cell-border bg-white p-1 font-black">F/Name</td>
                                                <td className="cell-border p-1 font-bold bg-white font-sans">{student.englishFatherName || '---'}</td>
                                            </tr>
                                            <tr>
                                                <td className="cell-border bg-white p-1 font-black">نام پ/ک</td>
                                                <td className="cell-border p-1 font-bold bg-white" colSpan={3}>{student.grandfatherName}</td>
                                            </tr>
                                            <tr>
                                                <td className="cell-border bg-white p-1 font-black">تذکره</td>
                                                <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(student.tazkiraNo)}</td>
                                            </tr>
                                            <tr>
                                                <td className="cell-border bg-white p-1 font-black">اساس</td>
                                                <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(student.studentId)}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="relative bg-white mt-1">
                                        <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: `${tableFontSize}px` }}>
                                            <thead className="bg-white font-black text-center">
                                                <tr className="bg-white">
                                                    <th className="cell-border p-1 text-right pr-2 bg-gray-50">مضامین</th>
                                                    <th className="cell-border p-1 w-[55px] bg-gray-50 text-center">۴.۵ ماهه</th>
                                                    <th className="cell-border p-1 w-[55px] bg-gray-50 text-center">سالانه</th>
                                                    <th className="cell-border p-1 w-[55px] bg-gray-50 text-center">مجموع</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white text-center">
                                                {data.subjects.map((subject: any) => (
                                                    <tr key={subject.id} className="bg-white">
                                                        <td className="cell-border p-1 pr-2 font-black bg-white text-start">{subject.name}</td>
                                                        <td className="cell-border p-1 font-bold font-sans">{toPersianNum(subject.midterm)}</td>
                                                        <td className="cell-border p-1 font-bold font-sans">{toPersianNum(subject.annual)}</td>
                                                        <td className="cell-border p-1 font-black font-sans bg-gray-50">{toPersianNum((Number(subject.midterm) || 0) + (Number(subject.annual) || 0))}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-white font-black overflow-hidden border-t-2 border-black">
                                                    <td className="cell-border p-1 pr-2 bg-gray-100 text-start">مجموعه نمرات</td>
                                                    <td className="cell-border p-1 font-sans bg-gray-100">{toPersianNum(data.midtermTotal)}</td>
                                                    <td className="cell-border p-1 font-sans bg-gray-100">{toPersianNum(data.annualTotal)}</td>
                                                    <td className="cell-border p-1 font-sans bg-gray-200">{toPersianNum(data.grandTotal)}</td>
                                                </tr>
                                                <tr className="bg-white font-black">
                                                    <td className="cell-border p-1 pr-2 text-start">اوسط نمرات</td>
                                                    <td className="cell-border p-1 font-sans">{toPersianNum(data.midtermAvg)}</td>
                                                    <td className="cell-border p-1 font-sans">{toPersianNum(data.annualAvg)}</td>
                                                    <td className="cell-border p-1 font-sans bg-gray-50">{toPersianNum(data.grandAvg)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex gap-2 bg-white mt-1">
                                        <table className="w-[70%] cell-border border-collapse text-black bg-white" style={{ fontSize: `${tableFontSize - 1}px` }}>
                                            <thead className="bg-white">
                                                <tr className="bg-black text-white h-6">
                                                    <th className="cell-border border-black text-center text-[8px]">ایام تعلیمی</th>
                                                    <th className="cell-border border-black text-center">حاضر</th>
                                                    <th className="cell-border border-black text-center">غیر حاضر</th>
                                                    <th className="cell-border border-black text-center">مریض</th>
                                                    <th className="cell-border border-black text-center">رخصت</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                <tr className="text-center font-black bg-white">
                                                    <td className="cell-border border-black bg-gray-50 font-bold px-1 whitespace-nowrap">ضوابط حاضری</td>
                                                    <td className="cell-border border-black bg-white font-sans">{toPersianNum(data.attendanceSummary.present)}</td>
                                                    <td className="cell-border border-black bg-white font-sans">{toPersianNum(data.attendanceSummary.absent)}</td>
                                                    <td className="cell-border border-black bg-white font-sans">{toPersianNum(data.attendanceSummary.sick)}</td>
                                                    <td className="cell-border border-black bg-white font-sans">{toPersianNum(data.attendanceSummary.leave)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="w-[30%] cell-border border-black flex items-center justify-center font-black text-[9px] bg-white">تاریخ: {new Date().toLocaleDateString('fa-AF')}</div>
                                    </div>
                                </div>

                                {/* Left Column: Grade Info & Signatures */}
                                <div className="w-[39%] flex flex-col gap-2 bg-white">
                                    <div className="relative h-16 flex items-center justify-center cell-border border-black bg-white">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-red-500">
                                            <svg viewBox="0 0 200 100" className="w-full h-full fill-current"><path d="M10 20 L190 20 L170 50 L190 80 L10 80 L30 50 Z" /></svg>
                                        </div>
                                        <span className="relative text-xl font-black text-red-700">اطلاع نامه</span>
                                    </div>

                                    <table className="w-full cell-border border-black border-collapse text-black bg-white text-center" style={{ fontSize: `${Math.max(7, tableFontSize - 2)}px` }}>
                                        <thead><tr className="bg-gray-100"><th className="cell-border border-black p-0.5 font-black" colSpan={3}>درجه بندی امتحان ۴.۵ ماهه</th></tr></thead>
                                        <tbody className="bg-white">
                                            {GRADING_SYSTEM.MIDTERM.map((row, idx) => (
                                                <tr key={idx} className="font-bold bg-white">
                                                    <td className="cell-border border-black p-0.5 w-[30%]">{row.grade}</td>
                                                    {idx === 0 && <td rowSpan={4} className="cell-border border-black font-black w-[35%] align-middle text-emerald-700">مؤفق</td>}
                                                    {idx === 4 && <td className="cell-border border-black font-black w-[35%] align-middle text-red-600 font-black">تلاش بیشتر</td>}
                                                    <td className="cell-border border-black p-0.5 font-sans w-[35%]">{toPersianNum(row.range)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <table className="w-full cell-border border-black border-collapse text-black bg-white text-center" style={{ fontSize: `${Math.max(7, tableFontSize - 2)}px` }}>
                                        <thead><tr className="bg-gray-100"><th className="cell-border border-black p-0.5 font-black" colSpan={3}>درجه بندی امتحان سالانه</th></tr></thead>
                                        <tbody className="bg-white">
                                            {GRADING_SYSTEM.ANNUAL.map((row, idx) => (
                                                <tr key={idx} className="font-bold bg-white">
                                                    <td className="cell-border border-black p-0.5 w-[30%]">{row.grade}</td>
                                                    {idx === 0 && <td rowSpan={4} className="cell-border border-black font-black w-[35%] align-middle text-emerald-700">ارتقا صنف</td>}
                                                    {idx === 4 && <td className="cell-border border-black font-black w-[35%] align-middle text-red-600 font-black">تکرار صنف</td>}
                                                    <td className="cell-border border-black p-0.5 font-sans w-[35%]">{toPersianNum(row.range)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex-grow cell-border border-black grid grid-cols-2 p-1 gap-1 bg-white min-h-[100px]">
                                        <div className="flex flex-col justify-end items-center border border-dashed border-gray-400 bg-white">
                                            <span className="border-t border-black w-full text-center py-0.5 font-black bg-white" style={{ fontSize: `10px` }}>{schoolSettings?.signatureLabel2 || "امضاء نگران"}</span>
                                        </div>
                                        <div className="flex flex-col justify-end items-center border border-dashed border-gray-400 bg-white">
                                            <span className="border-t border-black w-full text-center py-0.5 font-black bg-white" style={{ fontSize: `10px` }}>{schoolSettings?.signatureLabel3 || "امضاء سر معلم"}</span>
                                        </div>
                                        <div className="flex flex-col justify-end items-center border border-dashed border-gray-400 bg-white">
                                            <span className="border-t border-black w-full text-center py-0.5 font-black bg-white" style={{ fontSize: `10px` }}>{schoolSettings?.signatureLabel1 || "امضاء مدیر"}</span>
                                        </div>
                                        <div className="flex flex-col justify-end items-center border border-dashed border-gray-400 bg-white">
                                            <span className="border-t border-black w-full text-center py-0.5 font-black bg-white" style={{ fontSize: `10px` }}>امضاء ولی شاگرد</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="p-2 bg-white cell-border border-black leading-tight min-h-[80px] mt-1 w-full" style={{ fontSize: `${Math.max(7, tableFontSize - 2)}px` }}>
                                <span className="font-black underline bg-white block mb-0.5">یادداشت اداره:</span>
                                <p className="block bg-white text-justify leading-relaxed">
                                    {schoolSettings?.footerNote || "در صورتیکه شهرت، نمبر تذکره، سال تولد، سکونت اصلی و یا سایر مشخصات مربوط به شاگرد مغایرت داشته باشد، الی مدت سه روز بعد از ابلاغ نتایج جهت اصلاح آن به اداره لیسه مراجعه نمایند."}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                .cell-border {
                    border: 1px solid black;
                }
                .report-border {
                    border: 2px solid black;
                }
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        font-family: var(--font-vazirmatn), Vazirmatn, sans-serif !important;
                    }
                    .main-print-wrapper {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                        font-family: var(--font-vazirmatn), Vazirmatn, sans-serif !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-area {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        display: block !important;
                    }
                    .print-container {
                        margin: 0 auto !important;
                        padding: 10mm !important;
                        box-shadow: none !important;
                        border: 2px solid black !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        font-family: var(--font-vazirmatn), Vazirmatn, sans-serif !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: var(--font-vazirmatn), Vazirmatn, sans-serif !important;
                    }
                }
            `}</style>
        </div>
    );
}
