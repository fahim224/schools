
import React, { useMemo, useState } from 'react';

export enum ShoqaType {
    MAZMOON = "MAZMOON",
    ZAWABIT = "ZAWABIT"
}

interface ShoqaSheetProps {
    type: ShoqaType;
    margins: {
        top: number;
        bottom: number;
        right: number;
        left: number;
    };
    fontSize: number;
    schoolSettings: any;
    classData: any;
    students: any[];
    subject?: any; // Only for MAZMOON type
    studentResults: Record<string, any>;
    attendanceMatrix: Record<string, any>;
    pageIndex: number;
    totalPages: number;
    hidePageNumber?: boolean;
    hideSubject?: boolean;
    studentsPerPage?: number;
    rowHeight?: number;
    examType?: string;
    hideTeacher?: boolean;
    hideStudents?: boolean;
    printOrientation?: "landscape" | "portrait";
    onUpdateScore?: (studentId: string, field: string, value: string) => void;
    onUpdateAttendance?: (studentId: string, field: string, value: string) => void;
}

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "" || isNaN(Number(n))) return "۰";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const ShoqaSheet: React.FC<ShoqaSheetProps> = ({
    type,
    margins,
    fontSize,
    schoolSettings,
    classData,
    students,
    subject,
    studentResults,
    attendanceMatrix,
    pageIndex,
    totalPages,
    hidePageNumber = false,
    hideSubject = false,
    studentsPerPage = 40,
    rowHeight = 5.5,
    examType = "سالانه",
    hideTeacher = false,
    hideStudents = false,
    printOrientation = "landscape",
    onUpdateScore,
    onUpdateAttendance
}) => {
    const labels = type === ShoqaType.MAZMOON ? {
        title: (
            <span>
                شقه نمرات مضمون (
                <span className="inline-block min-w-[100px] border-b-[1.5px] border-black px-2 mx-1 text-center align-bottom" style={{ lineHeight: '0.8' }}>
                    {hideSubject ? <span className="text-transparent select-none">........................</span> : (subject?.name || "      ")}
                </span>
                )
            </span>
        ),
        col1: "تحریری",
        col2: "تقریری",
        col3: "فعالیت صفی",
        col4: "کارخانگی",
        col5: "مجموع",
    } : {
        title: "شقه ضوابط حاضری",
        col1: "ایام تعلیمی",
        col2: "حاضر",
        col3: "غیر حاضر",
        col4: "مریض",
        col5: "رخصت",
    };



    return (
        <div
            className="shoqa-sheet relative font-['Vazirmatn'] select-none bg-white text-black flex flex-col mx-auto"
            style={{
                width: printOrientation === "landscape" ? '148.5mm' : '105mm',
                height: printOrientation === "landscape" ? '210mm' : '297mm',
                paddingTop: `${margins.top}mm`,
                paddingBottom: `${margins.bottom}mm`,
                paddingRight: `${margins.right}mm`,
                paddingLeft: `${margins.left}mm`,
                direction: 'rtl',
                fontSize: `${fontSize * (printOrientation === "landscape" ? 0.85 : 0.65)}pt`,
            }}
        >
            <style jsx>{`
                .shoqa-sheet { box-sizing: border-box; background-color: white; page-break-inside: avoid; }
                table { border-collapse: collapse; width: 100%; border: 1pt solid black; }
                th, td { border: 0.5pt solid black; padding: 0.1mm 0.5mm; text-align: center; box-sizing: border-box; overflow: hidden; height: ${rowHeight}mm; font-size: inherit; }
                .rotated-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    text-align: center;
                    display: inline-block;
                }
                @media print {
                    .shoqa-sheet { border: none !important; }
                }
            `}</style>

            <div className="flex flex-col h-full">
                {/* HEADER */}
                <header className="w-full text-center relative border-b border-black pb-2 mb-2">
                    <div className="absolute right-0 top-0 w-16 h-16">
                        <img src={schoolSettings?.logoRight || "/logo-placeholder.png"} className="w-full h-full object-contain grayscale" />
                    </div>
                    <div className="absolute left-0 top-0 w-16 h-16">
                        <img src={schoolSettings?.logoLeft || "/logo-placeholder.png"} className="w-full h-full object-contain grayscale" />
                    </div>

                    <div className="flex flex-col items-center">
                        <h1 className="text-[10pt] font-black">{schoolSettings?.headerTitle1 || "وزارت معارف"}</h1>
                        <h2 className="text-[10pt] font-bold">{schoolSettings?.headerTitle2 || "ریاست معارف شهر کابل"}</h2>
                        <h3 className="text-[9pt] font-bold">{schoolSettings?.headerTitle3 || "آمریت معارف حوزه دوازدهم تعلیمی"}</h3>
                        <h4 className="text-[10pt] font-black">{schoolSettings?.schoolName || "لیسه عالی گل پاچا الفت"}</h4>
                    </div>

                    <div className="text-[12pt] font-black my-2.5 underline uppercase tracking-tight">{labels.title}</div>

                    <div className="flex justify-between items-center text-[7.5pt] font-bold border-t border-black pt-1.5 mt-1 whitespace-nowrap">
                        <div><span>صنف:</span> <span className="border-b border-black inline-block min-w-[20px] text-center">{classData?.level} {classData?.section}</span></div>
                        <div><span>سال:</span> <span className="border-b border-black inline-block min-w-[25px] text-center">{toPersianNum(classData?.academicYear)}</span></div>
                        <div><span>امتحان:</span> <span className="border-b border-black inline-block min-w-[40px] text-center">{examType}</span></div>
                        <div className="max-w-[35%]"><span>استاد:</span> <span className="border-b border-black inline-block min-w-[50px] truncate align-bottom text-center">{hideTeacher ? "................" : (classData?.teacher?.name || "---")}</span></div>
                    </div>
                </header>

                {/* TABLE */}
                <div className="flex-grow flex flex-col">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 font-black" style={{ fontSize: '1.1em' }}>
                                <th rowSpan={2} className="w-[7mm]">شماره</th>
                                <th colSpan={3} className="py-0.5">شهرت شاگرد</th>
                                <th rowSpan={2} className="w-[12mm]"><div className="rotated-text">نمبر اساس</div></th>
                                <th colSpan={5} className="py-0.5">{type === ShoqaType.MAZMOON ? "نمرات" : "ضوابط حاضری"}</th>
                                <th rowSpan={2} className="w-[15mm]">ملاحظات</th>
                            </tr>
                            <tr className="bg-gray-50 font-bold" style={{ fontSize: '1em' }}>
                                <th className="w-[18mm]">اسم</th>
                                <th className="w-[18mm]">نام پدر</th>
                                <th className="w-[18mm]">نام پدرکلان</th>
                                <th className="w-[10mm]"><div className="rotated-text">{labels.col1}</div></th>
                                <th className="w-[10mm]"><div className="rotated-text">{labels.col2}</div></th>
                                <th className="w-[10mm]"><div className="rotated-text">{labels.col3}</div></th>
                                <th className="w-[10mm]"><div className="rotated-text">{labels.col4}</div></th>
                                <th className="w-[10mm] font-black"><div className="rotated-text">{labels.col5}</div></th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => {
                                // Simplified logic for demo; in real page we map from search params/state
                                const grade = student.grades?.[subject?.id] || {};
                                const att = (attendanceMatrix[student.id]?.MIDTERM) || {}; // Example

                                return (
                                    <tr key={student.id + '-' + idx} className="font-medium" style={{ height: `${rowHeight}mm` }}>
                                        <td className="font-bold">{toPersianNum(pageIndex * studentsPerPage + idx + 1)}</td>
                                        <td className="text-right px-1 font-black" style={{ fontSize: '1.05em' }}>{hideStudents ? "" : student.name}</td>
                                        <td className="text-right px-1">{hideStudents ? "" : student.fatherName}</td>
                                        <td className="text-right px-1">{hideStudents ? "" : student.grandfatherName}</td>
                                        <td><div className="text-right">{hideStudents ? "" : toPersianNum(student.studentId)}</div></td>

                                        {type === ShoqaType.MAZMOON ? (
                                            <>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td className="font-black bg-gray-50"></td>
                                            </>
                                        ) : (
                                            <>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                            </>
                                        )}
                                        <td className="italic" style={{ fontSize: '0.8em' }}></td>
                                    </tr>
                                );
                            })}
                            {/* Fill empty rows if needed */}
                            {Array.from({ length: Math.max(0, studentsPerPage - students.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} style={{ height: `${rowHeight}mm` }}>
                                    <td className="font-bold">{toPersianNum(pageIndex * studentsPerPage + students.length + i + 1)}</td>
                                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}



            </div>
        </div>
    );
};

export default ShoqaSheet;
