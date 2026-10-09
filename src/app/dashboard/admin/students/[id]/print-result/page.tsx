"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export default function PrintResultPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch student data
                const studentRes = await fetch(`/api/admin/students/${params.id}`);
                const student = await studentRes.json();

                // Fetch school settings
                const settingsRes = await fetch("/api/settings");
                const settings = await settingsRes.json();

                setStudentData(student);
                setSchoolSettings(settings);
                setLoading(false);

                // به محض لود شدن داده‌ها، پرنت را فعال کن
                setTimeout(() => {
                    window.print();
                }, 500);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    // بعد از پرنت، پنجره را ببند
    useEffect(() => {
        const handleAfterPrint = () => {
            window.close();
        };

        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    if (loading || !studentData) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="text-xl font-bold">در حال بارگذاری...</div>
                </div>
            </div>
        );
    }

    // Find the selected class history (latest enrollment)
    const selectedEnrol = studentData.enrollments?.[0];
    const fallbackClass = studentData.grades?.[0]?.class || studentData.attendance?.[0]?.class;

    const displayYear = selectedEnrol?.academicYear || fallbackClass?.academicYear || "---";
    const displayLevel = selectedEnrol?.class?.level || fallbackClass?.level || "---";
    const displaySection = selectedEnrol?.class?.section || fallbackClass?.section || "---";

    const classId = selectedEnrol?.classId || studentData.grades?.[0]?.classId || studentData.attendance?.[0]?.classId;

    const enrolGrades = studentData.grades?.filter((g: any) => g.classId === classId) || [];
    const enrolAtt = studentData.attendance?.filter((a: any) => a.classId === classId) || [];

    // Group grades by subject
    const subjectGrades: Record<string, { name: string, midterm?: number, final?: number, order?: number }> = {};
    enrolGrades.forEach((g: any) => {
        const subId = g.subjectId;
        if (!subjectGrades[subId]) {
            subjectGrades[subId] = { name: g.subject?.name, order: g.subject?.order || 0 };
        }
        if (g.type === 'MIDTERM') subjectGrades[subId].midterm = g.score;
        else if (g.type === 'FINAL') subjectGrades[subId].final = g.score;
    });

    const subjectsList = Object.values(subjectGrades).sort((a, b) => {
        if ((a.order || 0) !== (b.order || 0)) {
            return (a.order || 0) - (b.order || 0);
        }
        return (a.name || "").localeCompare(b.name || "", 'fa');
    });

    // Totals
    const midtermTotal = subjectsList.reduce((acc, curr) => acc + (curr.midterm || 0), 0);
    const finalTotal = subjectsList.reduce((acc, curr) => acc + (curr.final || 0), 0);
    const grandTotal = midtermTotal + finalTotal;

    const validsMid = subjectsList.filter(s => s.midterm !== undefined).length;
    const validsFinal = subjectsList.filter(s => s.final !== undefined).length;

    const midAvg = validsMid ? (midtermTotal / validsMid).toFixed(2) : "0.00";
    const finalAvg = validsFinal ? (finalTotal / validsFinal).toFixed(2) : "0.00";
    const grandAvg = validsFinal ? (grandTotal / validsFinal).toFixed(2) : "0.00";

    // Attendance sums
    const attendanceSummary = {
        days: enrolAtt.reduce((acc: number, curr: any) => acc + (curr.days || 0), 0),
        present: enrolAtt.reduce((acc: number, curr: any) => acc + (curr.present || 0), 0),
        absent: enrolAtt.reduce((acc: number, curr: any) => acc + (curr.absent || 0), 0),
        sick: enrolAtt.reduce((acc: number, curr: any) => acc + (curr.sick || 0), 0),
        leave: enrolAtt.reduce((acc: number, curr: any) => acc + (curr.leave || 0), 0),
    };

    const getAfghanGrade = (score: number, maxScore: number) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return "الف";
        if (percentage >= 75) return "ب";
        if (percentage >= 60) return "ج";
        if (percentage >= 40) return "د";
        return "هـ";
    };

    const midAttRec = enrolAtt.find((a: any) => a.type === 'MIDTERM');
    const midAbsent = midAttRec?.absent || 0;
    const finAbsent = enrolAtt.find((a: any) => a.type === 'FINAL')?.absent || 0;

    let mLimit = 25;
    let aLimit = 50;
    if (midAttRec?.remarks?.startsWith("__L:")) {
        const match = midAttRec.remarks.match(/__L:(\d+),(\d+)__/);
        if (match) {
            mLimit = parseInt(match[1]);
            aLimit = parseInt(match[2]);
        }
    }

    const isMahroomMid = midAbsent >= mLimit;
    const isMahroomAnnual = (midAbsent + finAbsent) >= aLimit;

    let midStatus = "";
    if (isMahroomMid) {
        midStatus = "غایب (محروم)";
    } else if (validsMid > 0) {
        const hasLowMid = subjectsList.some(s => (s.midterm || 0) < 16);
        midStatus = hasLowMid ? "تلاش بیشتر" : "موفق";
    }

    let annualStatus = "";
    if (isMahroomAnnual) {
        annualStatus = "محروم";
    } else if (validsFinal > 0) {
        const fails = subjectsList.filter(s => ((s.midterm || 0) + (s.final || 0)) < 40).length;
        const avg = parseFloat(grandAvg);
        if (fails === 0 && avg >= 40) annualStatus = "ارتقاء صنف";
        else if (fails >= 3 || avg < 40) annualStatus = "تکرار صنف";
        else if (fails > 0 && fails < 3) annualStatus = "مشروط";
        else annualStatus = "در جریان";
    }

    const midGrade = validsMid > 0 ? getAfghanGrade(parseFloat(midAvg), 40) : "";
    const annualGrade = validsFinal > 0 ? getAfghanGrade(parseFloat(grandAvg), 100) : "";

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

    return (
        <>
            <style jsx global>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                html, body {
                    font-family: 'Vazirmatn', sans-serif !important;
                    background-color: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                
                .cell-border {
                    border: 1px solid black !important;
                }
                
                .report-border {
                    border: 2px solid black !important;
                }
                
                .print-container {
                    background-color: white;
                    box-sizing: border-box;
                    margin: 0;
                    width: 210mm;
                    height: 297mm;
                    min-height: 297mm;
                    max-height: 297mm;
                    padding: 10mm 15mm;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0mm;
                    }
                    
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 10mm 15mm !important;
                        border: 2px solid black !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        position: relative !important;
                        overflow: hidden !important;
                    }
                    
                    .print-container * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Vazirmatn', sans-serif !important;
                    }
                    
                    .bg-emerald-700 { 
                        background-color: #047857 !important; 
                        color: white !important; 
                    }
                    .bg-red-700 { 
                        background-color: #b91c1c !important; 
                        color: white !important; 
                    }
                    .bg-sky-700 { 
                        background-color: #0369a1 !important; 
                        color: white !important; 
                    }
                    .bg-black { 
                        background-color: #000000 !important; 
                        color: white !important; 
                    }
                    .text-red-700 { 
                        color: #b91c1c !important; 
                    }
                }
            `}</style>

            <div className="print-container bg-white report-border relative text-black" dir="rtl">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-4 bg-white">
                    <div className="w-20 h-20 flex items-center justify-center bg-white">
                        {schoolSettings?.logoRight ? <img src={schoolSettings.logoRight} alt="Right Logo" className="max-w-full max-h-full object-contain" /> : <div className="w-20 h-20"></div>}
                    </div>

                    <div className="text-center flex flex-col flex-grow mx-4 bg-white">
                        <h2 className="text-base font-bold bg-white">{schoolSettings?.headerTitle1 || "وزارت معارف"}</h2>
                        <h3 className="text-sm font-bold bg-white">{schoolSettings?.headerTitle2 || "ریاست معارف (شهر کابل)"}</h3>
                        <h4 className="text-sm font-bold bg-white">{schoolSettings?.headerTitle3 || "آمریت معارف (هفدهم)"}</h4>
                        <h5 className="text-lg font-black mt-1 bg-white">{schoolSettings?.schoolName || "لیسه عالی خصوصی نیکان"}</h5>
                    </div>

                    <div className="w-20 h-20 flex items-center justify-center bg-white">
                        {schoolSettings?.logoLeft ? <img src={schoolSettings.logoLeft} alt="Left Logo" className="max-w-full max-h-full object-contain" /> : <div className="w-20 h-20"></div>}
                    </div>
                </div>

                {/* Banner with info */}
                <div className="grid grid-cols-4 gap-0 mb-3 text-xs font-bold text-center">
                    <div className="bg-emerald-700 text-white p-1.5 cell-border">صنف: {displayLevel} {displaySection}</div>
                    <div className="bg-red-700 text-white p-1.5 cell-border">نگران: ---</div>
                    <div className="bg-sky-700 text-white p-1.5 cell-border">سال: {toPersianNum(displayYear)}</div>
                    <div className="bg-black text-white p-1.5 cell-border">نمبر: {toPersianNum(studentData.studentId)}</div>
                </div>

                <div className="flex gap-3 bg-white flex-grow overflow-hidden">
                    {/* Right Column: Personal Info & Scores */}
                    <div className="w-[60%] flex flex-col gap-2 bg-white">
                        <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                            <tbody>
                                <tr>
                                    <td rowSpan={6} className="cell-border p-0 w-[40px] bg-white text-center">
                                        <div className="flex items-center justify-center w-full h-full">
                                            <span className="font-black" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '12px' }}>شـهـرت</span>
                                        </div>
                                    </td>
                                    <td className="cell-border bg-white p-1 font-black w-[55px]">نام</td>
                                    <td className="cell-border p-1 font-bold bg-white">{studentData.name}</td>
                                    <td className="cell-border bg-white p-1 font-black w-[55px]">Name</td>
                                    <td className="cell-border p-1 font-bold bg-white font-sans text-left">{studentData.nameEn || ''}</td>
                                </tr>
                                <tr>
                                    <td className="cell-border bg-white p-1 font-black">تخلص</td>
                                    <td className="cell-border p-1 font-bold bg-white">{studentData.surname || ''}</td>
                                    <td className="cell-border bg-white p-1 font-black">L/Name</td>
                                    <td className="cell-border p-1 font-bold bg-white font-sans text-left">{studentData.surnameEn || ''}</td>
                                </tr>
                                <tr>
                                    <td className="cell-border bg-white p-1 font-black">نام پدر</td>
                                    <td className="cell-border p-1 font-bold bg-white">{studentData.fatherName}</td>
                                    <td className="cell-border bg-white p-1 font-black">F/Name</td>
                                    <td className="cell-border p-1 font-bold bg-white font-sans text-left">{studentData.fatherNameEn || ''}</td>
                                </tr>
                                <tr>
                                    <td className="cell-border bg-white p-1 font-black">نام پ/ک</td>
                                    <td className="cell-border p-1 font-bold bg-white" colSpan={3}>{studentData.grandfatherName}</td>
                                </tr>
                                <tr>
                                    <td className="cell-border bg-white p-1 font-black">تذکره</td>
                                    <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(studentData.tazkiraNo)}</td>
                                </tr>
                                <tr>
                                    <td className="cell-border bg-white p-1 font-black">اساس</td>
                                    <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(studentData.studentId)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="relative bg-white mt-1 flex-grow">
                            <table className="w-full h-full cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                                <thead className="bg-white font-black text-center">
                                    <tr className="bg-white">
                                        <th className="cell-border p-1 text-right pr-2 bg-white">مضامین</th>
                                        <th className="cell-border p-1 w-[60px] bg-white text-center">۴.۵ ماهه</th>
                                        <th className="cell-border p-1 w-[60px] bg-white text-center">سالانه</th>
                                        <th className="cell-border p-1 w-[60px] bg-white text-center">مجموع</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {subjectsList.map((sub: any, sIdx: number) => (
                                        <tr key={sIdx} className="bg-white">
                                            <td className="cell-border p-1 pr-2 font-bold bg-white">
                                                {sub.name}
                                            </td>
                                            <td className="cell-border text-center font-black bg-white">
                                                <span className="font-sans">{toPersianNum(sub.midterm)}</span>
                                            </td>
                                            <td className="cell-border text-center font-black bg-white">
                                                <span className="font-sans">{toPersianNum(sub.final)}</span>
                                            </td>
                                            <td className="cell-border text-center font-black bg-white font-sans">{toPersianNum((Number(sub.midterm) || 0) + (Number(sub.final) || 0))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-white font-black">
                                        <td className="cell-border p-1 pr-2 bg-white">مجموعه نمرات</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(midtermTotal)}</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(finalTotal)}</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(grandTotal)}</td>
                                    </tr>
                                    <tr className="bg-white font-black">
                                        <td className="cell-border p-1 pr-2 bg-white">اوسط نمرات</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(midAvg)}</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(finalAvg)}</td>
                                        <td className="cell-border text-center font-sans bg-white">{toPersianNum(grandAvg)}</td>
                                    </tr>
                                    <tr className="bg-white font-black">
                                        <td className="cell-border p-1 pr-2 bg-white">نتیجه</td>
                                        <td className="cell-border text-center text-[10px] bg-white">{midStatus}</td>
                                        <td className="cell-border text-center text-[10px] bg-white" colSpan={2}>{annualStatus}</td>
                                    </tr>
                                    <tr className="bg-white font-black">
                                        <td className="cell-border p-1 pr-2 bg-white">درجه</td>
                                        <td className="cell-border text-center bg-white">{midGrade}</td>
                                        <td className="cell-border text-center bg-white" colSpan={2}>{annualGrade}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-2 bg-white mt-1">
                            <table className="w-[75%] cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                                <thead className="bg-white">
                                    <tr className="bg-white h-6">
                                        <th className="cell-border bg-white text-center">ضوابط حاضری</th>
                                        <th className="cell-border bg-white text-center">حاضر</th>
                                        <th className="cell-border bg-white text-center">غیر حاضر</th>
                                        <th className="cell-border bg-white text-center">مریض</th>
                                        <th className="cell-border bg-white text-center">رخصت</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    <tr className="text-center font-black bg-white">
                                        <td className="cell-border bg-white"><span className="font-bold">ایام:</span> <span className="font-sans">{toPersianNum(attendanceSummary.days)}</span></td>
                                        <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.present)}</span></td>
                                        <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.absent)}</span></td>
                                        <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.sick)}</span></td>
                                        <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.leave)}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="w-[25%] cell-border flex items-center justify-center font-black font-sans bg-white" style={{ fontSize: '10px' }}>تاریخ: {new Date().toLocaleDateString('fa-AF')}</div>
                        </div>
                    </div>

                    {/* Left Column: Grade Info & Signatures */}
                    <div className="w-[40%] flex flex-col gap-2 bg-white">
                        <div className="relative h-20 flex items-center justify-center cell-border bg-white">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <svg viewBox="0 0 200 100" className="w-full h-full"><path d="M10 20 L190 20 L170 50 L190 80 L10 80 L30 50 Z" fill="#000" stroke="#000" strokeWidth="2" /></svg>
                            </div>
                            <span className="relative text-2xl font-black text-red-700">اطلاع نامه</span>
                        </div>

                        <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '9px' }}>
                            <thead><tr className="bg-white"><th className="cell-border p-1 bg-white font-black" colSpan={3}>درجه بندی امتحان چهارونیم ماهه</th></tr></thead>
                            <tbody className="bg-white">
                                {GRADING_SYSTEM.MIDTERM.map((row, idx) => (
                                    <tr key={idx} className="text-center font-bold bg-white">
                                        <td className="cell-border p-0.5 bg-white w-[30%]">{row.grade}</td>
                                        {idx === 0 && <td rowSpan={4} className="cell-border font-black bg-white w-[35%]">مؤفق</td>}
                                        {idx === 4 && <td className="cell-border font-black bg-white w-[35%]">تلاش بیشتر</td>}
                                        <td className="cell-border p-0.5 font-sans bg-white w-[35%]">{toPersianNum(row.range)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '9px' }}>
                            <thead><tr className="bg-white"><th className="cell-border p-1 bg-white font-black" colSpan={3}>درجه بندی امتحان سالانه</th></tr></thead>
                            <tbody className="bg-white">
                                {GRADING_SYSTEM.ANNUAL.map((row, idx) => (
                                    <tr key={idx} className="text-center font-bold bg-white">
                                        <td className="cell-border p-0.5 bg-white w-[30%]">{row.grade}</td>
                                        {idx === 0 && <td rowSpan={4} className="cell-border font-black bg-white w-[35%]">ارتقا صنف</td>}
                                        {idx === 4 && <td className="cell-border font-black bg-white w-[35%]">تکرار صنف</td>}
                                        <td className="cell-border p-0.5 font-sans bg-white w-[35%]">{toPersianNum(row.range)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex-grow cell-border grid grid-cols-2 p-1 gap-1 bg-white">
                            <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel2 || "امضاء نگران"}</span></div>
                            <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel3 || "امضاء سر معلم"}</span></div>
                            <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel1 || "امضاء مدیر"}</span></div>
                            <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>امضاء ولی</span></div>
                        </div>

                        <div className="p-2 bg-white cell-border leading-relaxed min-h-[85px]" style={{ fontSize: '9px' }}>
                            <span className="font-black underline bg-white block mb-0.5">یادداشت اداره:</span>
                            <p className="block bg-white text-justify leading-tight">
                                {schoolSettings?.footerNote || "در صورتیکه شهرت، نمبر تذکره، سال تولد، سکونت اصلی و یا سایر مشخصات مربوط به شاگرد مغایرت داشته باشد، الی مدت سه روز بعد از ابلاغ نتایج جهت اصلاح آن به اداره لیسه مراجعه نمایند."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
