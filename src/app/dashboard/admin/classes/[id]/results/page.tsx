"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Printer,
    Loader2,
    FileSpreadsheet
} from "lucide-react";
import Link from "next/link";

export default function ClassResultsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [classData, setClassData] = useState<any>(null);
    const [gradesData, setGradesData] = useState<any[]>([]);
    const [processedData, setProcessedData] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER") {
            router.push("/");
        }

        if (session && params.id) {
            fetchData();
        }
    }, [status, session, router, params.id]);

    const fetchData = async () => {
        try {
            const [classRes, gradesRes] = await Promise.all([
                fetch(`/api/admin/classes/${params.id}`),
                fetch(`/api/grades?classId=${params.id}`)
            ]);

            if (classRes.ok && gradesRes.ok) {
                const cData = await classRes.json();
                const gData = await gradesRes.json();
                setClassData(cData);
                setGradesData(gData);
                processResults(cData, gData);
            } else {
                setError("Failed to load data");
            }
        } catch (err) {
            console.error(err);
            setError("Error loading results");
        } finally {
            setLoading(false);
        }
    };

    const processResults = (cData: any, gData: any[]) => {
        if (!cData || !cData.students) return;

        const subjects = cData.subjects || [];
        const students = cData.students;

        // Process each student
        const results = students.map((student: any) => {
            const studentGrades = gData.filter((g: any) => g.studentId === student.id);
            const subjectResults: any = {};
            let grandTotal = 0;
            let totalMaxScore = 0;

            subjects.forEach((subj: any) => {
                const midGrade = studentGrades.find((g: any) => g.subjectId === subj.id && g.type === 'MIDTERM');
                const finalGrade = studentGrades.find((g: any) => g.subjectId === subj.id && g.type === 'FINAL');

                const midScore = midGrade ? midGrade.score : 0;
                const finalScore = finalGrade ? finalGrade.score : 0;
                const totalScore = midScore + finalScore;

                subjectResults[subj.id] = {
                    mid: midScore,
                    final: finalScore,
                    total: totalScore
                };

                grandTotal += totalScore;
                totalMaxScore += 100; // Assuming each subject is out of 100
            });

            const average = totalMaxScore > 0 ? (grandTotal / subjects.length) : 0;

            return {
                ...student,
                subjectResults,
                grandTotal,
                average: parseFloat(average.toFixed(2))
            };
        });

        // Calculate Rank
        results.sort((a: any, b: any) => b.average - a.average);

        const rankedResults = results.map((r: any, index: number) => ({
            ...r,
            rank: index + 1
        }));

        setProcessedData(rankedResults);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (error) return <div className="p-20 text-center font-black text-red-500">{error}</div>;
    if (!classData) return <div className="p-20 text-center font-black">Class Not Found</div>;

    const subjects = (classData?.subjects || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, 'fa'));

    const toPersianNum = (n: string | number | undefined | null) => {
        if (n === undefined || n === null || n === "") return "";
        return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
    };

    return (
        <div className="font-sans min-h-screen bg-slate-50 dark:bg-black p-8 print:p-0 print:bg-white">
            {/* Header (Non-printable) */}
            <div className="mb-8 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/admin/classes/${params.id}`} className="p-3 bg-white dark:bg-white/10 border border-border rounded-2xl hover:scale-105 transition-all shadow-sm">
                        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    </Link>
                    <div className="text-start">
                        <h1 className="text-2xl font-black">{t.grading?.results_sheet || "جدول نتایج صنف"}</h1>
                        <p className="text-sm font-bold text-slate-500">{classData.name}</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary/90 transition-all"
                >
                    <Printer size={20} />
                    {t.grading?.print || "چاپ"}
                </button>
            </div>

            {/* Printable Report */}
            <div className="bg-white text-black p-8 mx-auto max-w-[297mm] h-auto shadow-2xl print:shadow-none print:w-full print:max-w-none rounded-none" dir="rtl">

                {/* Print Header */}
                <div className="text-center border-b-2 border-black pb-6 mb-6">
                    <h1 className="text-3xl font-black uppercase tracking-widest mb-2">{t.app_name || "سامانه تعلیمی رستیار"}</h1>
                    <h2 className="text-xl font-bold">{(t.grading?.results_sheet || "جدول نتایج صنف")} - {t.dashboards.academic_year || "سال تعلیمی"} {toPersianNum(classData.academicYear || "1403")}</h2>
                    <div className="mt-4 flex justify-center gap-8 text-sm font-bold">
                        <span>{t.dashboards.new_class.level_label || "سطح"}: {t.levels[classData.level] || classData.level}</span>
                        <span>{t.dashboards.class_name || "صنف"}: {classData.name}</span>
                        <span>{t.dashboards.student_count || "تعداد شاگردان"}: {toPersianNum(classData.students.length)}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-slate-200 text-black">
                                <th rowSpan={2} className="border border-black p-2 w-10">#</th>
                                <th rowSpan={2} className="border border-black p-2 min-w-[150px] text-start">{t.grading?.student_name}</th>
                                <th rowSpan={2} className="border border-black p-2 min-w-[120px] text-start">{t.student_registration?.father_name_dr}</th>
                                <th rowSpan={2} className="border border-black p-2 w-16">{t.grading?.student_id}</th>

                                {subjects.map((sub: any) => (
                                    <th key={sub.id} colSpan={3} className="border border-black p-1 text-center font-bold">
                                        {sub.name}
                                    </th>
                                ))}

                                <th rowSpan={2} className="border border-black p-2 w-16 bg-slate-300">{t.grading?.total}</th>
                                <th rowSpan={2} className="border border-black p-2 w-16 bg-slate-300">{t.grading?.average}</th>
                                <th rowSpan={2} className="border border-black p-2 w-16 bg-slate-300">{t.grading?.rank}</th>
                            </tr>
                            <tr className="bg-slate-100 text-black text-[10px]">
                                {subjects.map((sub: any) => (
                                    <>
                                        <th key={`${sub.id}-mid`} className="border border-black p-1 text-center w-8 text-slate-600">{t.grading?.midterm}</th>
                                        <th key={`${sub.id}-final`} className="border border-black p-1 text-center w-8 text-slate-600">{t.grading?.final}</th>
                                        <th key={`${sub.id}-tot`} className="border border-black p-1 text-center w-8 font-black bg-slate-50">{t.grading?.total}</th>
                                    </>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((student: any, index: number) => (
                                <tr key={student.id} className="text-center group hover:bg-slate-50 print:hover:bg-transparent">
                                    <td className="border border-black p-2 font-bold">{toPersianNum(index + 1)}</td>
                                    <td className="border border-black p-2 text-start font-bold whitespace-nowrap">{student.name}</td>
                                    <td className="border border-black p-2 text-start">{student.fatherName}</td>
                                    <td className="border border-black p-2">{toPersianNum(student.studentId)}</td>

                                    {subjects.map((sub: any) => {
                                        const res = student.subjectResults[sub.id];
                                        return (
                                            <React.Fragment key={`${student.id}-${sub.id}`}>
                                                <td className="border border-black p-1 text-slate-600 font-sans">{res?.mid !== undefined ? toPersianNum(res.mid) : '-'}</td>
                                                <td className="border border-black p-1 text-slate-600 font-sans">{res?.final !== undefined ? toPersianNum(res.final) : '-'}</td>
                                                <td className={`border border-black p-1 font-bold font-sans bg-slate-50 ${res?.total < 40 ? 'text-red-600' : 'text-black'}`}>{res?.total !== undefined ? toPersianNum(res.total) : '-'}</td>
                                            </React.Fragment>
                                        );
                                    })}

                                    <td className="border border-black p-2 font-black bg-slate-100 font-sans">{toPersianNum(student.grandTotal)}</td>
                                    <td className="border border-black p-2 font-black bg-slate-100 font-sans">{toPersianNum(student.average)}</td>
                                    <td className="border border-black p-2 font-black bg-slate-100 font-sans">{toPersianNum(student.rank)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signature */}
                <div className="mt-16 grid grid-cols-3 gap-8 text-center print:flex print:justify-between">
                    <div className="border-t border-black pt-2 w-48 mx-auto font-bold">{t.dashboards.homeroom_teacher}</div>
                    <div className="border-t border-black pt-2 w-48 mx-auto font-bold">{t.dashboards.admin}</div>
                    <div className="border-t border-black pt-2 w-48 mx-auto font-bold">{t.dashboards.superadmin}</div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-400">
                    Generated by {t.app_name} System • {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
