
import React, { useMemo, useState } from 'react';

interface GradeSheetHighSchoolProps {
    margins: {
        top: number;
        bottom: number;
        right: number;
        left: number;
    };
    fontSize: number;
    tableFontSize?: number;
    rowHeightScale: number;
    headerHeightScale: number;
    signaturesAtBottom?: boolean;
    hidePageNumber?: boolean;
    schoolSettings: any;
    classData: any;
    students: any[];
    subjects: any[];
    studentResults: Record<string, any>;
    attendanceMatrix: Record<string, any>;
    observationMatrix: Record<string, string>;
    pageIndex: number;
    totalPages: number;
    isEditable?: boolean;
    onGradeChange?: (studentId: string, subjectId: string, type: string, value: string) => void;
    onAttendanceChange?: (studentId: string, type: string, field: string, value: string) => void;
    onObservationChange?: (studentId: string, value: string) => void;
}

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "" || isNaN(Number(n))) return "۰";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const PersianInput = ({ value, onChange, className }: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const displayValue = isFocused ? (value || "") : (value === "" || value === undefined || value === null ? "" : toPersianNum(value));

    return (
        <input
            type="text"
            inputMode="decimal"
            className={`${className} w-full h-full text-center p-0 m-0 border-none outline-none bg-transparent`}
            value={displayValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
                const raw = e.target.value.replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
                const clean = raw.replace(/[^0-9.]/g, '');
                onChange({ target: { value: clean } });
            }}
            placeholder={!isFocused ? "۰" : ""}
            style={{ fontSize: 'inherit', fontWeight: 'bold', fontFamily: 'inherit' }}
        />
    );
};

const GradeSheetHighSchool: React.FC<GradeSheetHighSchoolProps> = ({
    margins,
    fontSize,
    tableFontSize = 7,
    rowHeightScale,
    headerHeightScale,
    signaturesAtBottom = false,
    hidePageNumber = false,
    schoolSettings,
    classData,
    students,
    subjects,
    studentResults,
    attendanceMatrix,
    observationMatrix,
    pageIndex,
    totalPages,
    isEditable = false,
    onGradeChange,
    onAttendanceChange,
    onObservationChange
}) => {
    const getRowHeight = (basePt: number) => `${basePt * rowHeightScale}pt`;
    const getHeaderHeight = (basePt: number) => `${basePt * headerHeightScale}pt`;

    const subjectsCount = subjects.length;
    // Calculation of colSpan for remarks (High school has more columns)
    const remarksColSpan = 15 + subjectsCount + 7;

    const khalasMidterm = useMemo(() => {
        let tested = 0, passed = 0, failed = 0, absent = 0;
        const all = classData?.students || [];
        all.forEach((s: any) => {
            const res = studentResults[s.id];
            if (res) {
                if (res.midTotal > 0 || res.midStatus) tested++;
                if (res.midStatus === "موفق") passed++;
                else if (res.midStatus === "تلاش بیشتر") failed++;
                else if (res.midStatus?.includes("غایب")) absent++;
            }
        });
        return { total: all.length, tested, passed, failed, absent };
    }, [classData, studentResults]);

    const khalasAnnual = useMemo(() => {
        let tested = 0, passed = 0, nakam = 0, mashrut = 0, mahrum = 0, excused = 0;
        const all = classData?.students || [];
        all.forEach((s: any) => {
            const res = studentResults[s.id];
            if (res) {
                if (res.total > 0 || res.result) tested++;
                if (res.result === "ارتقاء صنف") passed++;
                else if (res.result === "تکرار صنف") nakam++;
                else if (res.result === "مشروط") mashrut++;
                else if (res.result === "محروم") mahrum++;
                else if (res.result === "معذرتی") excused++;
            }
        });
        return { total: all.length, tested, passed, nakam, mashrut, mahrum, excused };
    }, [classData, studentResults]);

    return (
        <div
            className="a4-page relative font-['Vazirmatn'] select-none overflow-hidden bg-white text-black mb-8 shadow-2xl mx-auto"
            style={{
                width: '297mm',
                height: '210mm',
                paddingTop: `${margins.top}mm`,
                paddingBottom: `${margins.bottom}mm`,
                paddingRight: `${margins.right}mm`,
                paddingLeft: `${margins.left}mm`,
                direction: 'rtl',
                fontSize: `${fontSize}pt`,
                pageBreakAfter: 'always',
                boxSizing: 'border-box'
            }}
        >
            <style jsx>{`
                @page { size: A4 landscape; margin: 0; }
                .a4-page { page-break-after: always; position: relative; box-sizing: border-box; background-color: white; }
                .vertical-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    text-align: center;
                    display: inline-block;
                }
                .rotated-cell {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    text-align: center;
                    display: inline-block;
                }
                table { border-collapse: collapse; width: 100%; border: 1pt solid black; }
                th, td { border: 0.5pt solid black; padding: 0; text-align: center; box-sizing: border-box; overflow: hidden; }
                .grade-input {
                    padding: 0; margin: 0; border: none; width: 100%; height: 100%;
                    text-align: center; background: transparent; font-size: inherit;
                    font-family: inherit; font-weight: bold; outline: none;
                }
                .grade-input::-webkit-inner-spin-button { display: none; }
                .signature-line { width: 176px; border-bottom: 1px dotted black; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .a4-page { 
                        margin: 0 !important; box-shadow: none !important;
                        width: 297mm !important; height: 210mm !important;
                        print-color-adjust: exact; -webkit-print-color-adjust: exact;
                    }
                    th, td { border: 0.5pt solid black !important; }
                }
            `}</style>

            <div className="flex flex-col h-full">
                {/* HEADER */}
                <div className="relative w-full flex-shrink-0">
                    {!signaturesAtBottom && (
                        <div className="flex justify-center gap-[100mm] font-bold mb-1" style={{ fontSize: `${fontSize * 0.9}pt` }}>
                            <div className="flex gap-2 items-center"><span>امضاء سرمعلم :</span><span className="w-16 border-b border-dotted border-black"></span></div>
                            <div className="flex gap-2 items-center ml-[250px]"><span>امضاء نگران :</span><span className="w-16 border-b border-dotted border-black"></span></div>
                        </div>
                    )}

                    <div className="flex justify-between items-stretch w-full px-1 gap-2">
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-center">
                                        <img src={schoolSettings?.logoRight || "/logo-placeholder.png"} className="w-14 h-14 object-contain grayscale" alt="Logo" />
                                    </div>
                                    {!hidePageNumber && (
                                        <div className="flex flex-col font-bold" style={{ fontSize: `${fontSize * 0.8}pt` }}>
                                            <div className="flex items-center gap-1"><span>صفحه:</span><span className="w-8 border-b border-black text-center">{toPersianNum(pageIndex + 1)}</span></div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center flex-1">
                                    <h1 className="font-black leading-none mb-1" style={{ fontSize: `${fontSize * 1.5}pt` }}>{schoolSettings?.headerTitle1 || "وزارت معارف"}</h1>
                                    <h2 className="font-bold leading-none mb-1" style={{ fontSize: `${fontSize * 1.1}pt` }}>{schoolSettings?.headerTitle2 || "ریاست معارف شهر کابل"}</h2>
                                    <p className="leading-none mb-1" style={{ fontSize: `${fontSize * 0.9}pt` }}>{schoolSettings?.headerTitle3 || "آمریت معارف حوزه دوازدهم تعلیمی"}</p>
                                    <p className="font-bold leading-none" style={{ fontSize: `${fontSize * 1.0}pt` }}>{schoolSettings?.schoolName || "لیسه عالی گل پاچا الفت"}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <img src={schoolSettings?.logoLeft || "/logo-placeholder.png"} className="w-14 h-14 object-contain grayscale" alt="Logo" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-black px-0 py-1 font-bold" style={{ fontSize: `${fontSize * 1.1}pt` }}>
                                <div className="flex gap-3 items-center">
                                    <div className="flex gap-1 items-center"><span>صنف:</span><span className="min-w-[25mm] border-b border-black text-center">{classData.level} {classData.section}</span></div>
                                </div>
                                <div className="flex gap-1 items-center"><span>سال تعلیمی:</span><span className="min-w-[25mm] border-b border-black text-center">{toPersianNum(classData.academicYear)} هـ ش</span></div>
                                <div className="flex gap-2 items-center"><span>نگران:</span><span className="min-w-[50mm] border-b border-black text-center">{classData.teacher?.name || "---"}</span></div>
                            </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                            {[{ title: "خلص احصائیه چهارنیم ماهه", data: [["تعداد داخله", khalasMidterm.total], ["شامل امتحان", khalasMidterm.tested], ["موفق", khalasMidterm.passed], ["تلاش بیشتر", khalasMidterm.failed], ["غایب", khalasMidterm.absent]] },
                            { title: "خلص احصائیه سالانه", data: [["تعداد داخله", khalasAnnual.total], ["شامل امتحان", khalasAnnual.tested], ["ارتقاء صنف", khalasAnnual.passed], ["تکرار صنف", khalasAnnual.nakam], ["مشروط", khalasAnnual.mashrut], ["معذرتی", khalasAnnual.excused], ["محروم", khalasAnnual.mahrum]] }].map((item, idx) => (
                                <table key={idx} className="border-collapse border border-black w-[35mm] h-fit" style={{ fontSize: `${fontSize * 0.7}pt`, tableLayout: 'auto' }}>
                                    <thead><tr className="bg-gray-100"><th colSpan={2} className="border border-black py-0.5 font-black">{item.title}</th></tr></thead>
                                    <tbody>
                                        {item.data.map((l, i) => (
                                            <tr key={i} style={{ height: '4.5mm' }}><td className="border border-black px-1 text-right whitespace-nowrap">{l[0]}</td><td className="border border-black w-8 font-black">{toPersianNum(l[1])}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="flex-grow overflow-hidden">
                    <table className="w-full table-fixed" style={{ fontSize: `${tableFontSize}pt`, tableLayout: 'fixed' }}>
                        <thead className="bg-gray-50 font-bold">
                            <tr>
                                <th rowSpan={2} className="w-[8mm]" style={{ height: getHeaderHeight(20) }}><div className="vertical-text">شماره</div></th>
                                <th colSpan={6} className="py-1">شهرت شاگرد</th>
                                <th rowSpan={2} className="w-[10mm]"><div className="vertical-text">نمبر اساس</div></th>
                                <th rowSpan={2} className="w-[10mm]"><div className="vertical-text">نمبر تذکره</div></th>
                                <th rowSpan={2} className="w-[9mm]"><div className="vertical-text">تولد (ش)</div></th>
                                <th rowSpan={2} className="w-[9mm]"><div className="vertical-text">تولد (م)</div></th>
                                <th rowSpan={2} className="w-[16mm]"><div className="vertical-text">سکونت اصلی</div></th>
                                <th rowSpan={2} className="w-[18mm]">امتحانات</th>
                                <th colSpan={subjectsCount} className="py-1">مضامین تعلیمی</th>
                                <th rowSpan={2} className="w-[10mm]"><div className="vertical-text">مجموع</div></th>
                                <th rowSpan={2} className="w-[10mm]"><div className="vertical-text">اوسط</div></th>
                                <th rowSpan={2} className="w-[18mm]">نتیجه</th>
                                <th rowSpan={2} className="w-[9mm]"><div className="vertical-text">درجه</div></th>
                                <th colSpan={5} className="py-1">ضوابط حاضری</th>
                                <th rowSpan={2} className="w-[26mm]">تصویر شاگرد</th>
                            </tr>
                            <tr>
                                <th className="w-[13mm]" style={{ height: getHeaderHeight(60) }}><div className="vertical-text">اسم</div></th>
                                <th className="w-[13mm]"><div className="vertical-text text-[6pt]">Name</div></th>
                                <th className="w-[13mm]"><div className="vertical-text">نام پدر</div></th>
                                <th className="w-[13mm]"><div className="vertical-text text-[6pt]">Father Name</div></th>
                                <th className="w-[13mm]"><div className="vertical-text">نام پدرکلان</div></th>
                                <th className="w-[13mm]"><div className="vertical-text text-[6pt]">Grand Father</div></th>

                                {subjects.map((sub, i) => (
                                    <th key={i} className="p-0 overflow-hidden" style={{ width: `${140 / subjectsCount}%` }}>
                                        <div className="vertical-text whitespace-nowrap">{sub.name}</div>
                                    </th>
                                ))}
                                {["ایام تعلیمی", "حاضر", "غیر حاضر", "مریض", "رخصت"].map(h => (
                                    <th key={h} className="w-[8mm] p-0"><div className="vertical-text">{h}</div></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.filter(s => s && !s.isEmpty).map((student, idx) => {
                                const res = studentResults[student.id] || {};
                                const attMid = attendanceMatrix[student.id]?.MIDTERM || {};
                                const attFin = attendanceMatrix[student.id]?.FINAL || {};
                                const obs = observationMatrix[student.id] || "";

                                return (
                                    <React.Fragment key={student.id}>
                                        {["MIDTERM", "FINAL", "TOTAL"].map((type, rowIdx) => {
                                            const typeLabel = type === "MIDTERM" ? "چهارنیم ماهه" : type === "FINAL" ? "سالانه" : "مجموع نمرات";
                                            const rowH = getRowHeight(19);
                                            return (
                                                <tr key={type} style={{ height: rowH, maxHeight: rowH }}>
                                                    {rowIdx === 0 && (
                                                        <>
                                                            <td rowSpan={4} className="font-bold">{toPersianNum(pageIndex * 3 + idx + 1)}</td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden"><div className="rotated-cell py-1">{student.name}</div></td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden text-[6pt] uppercase"><div className="rotated-cell py-1">{student.nameEn || "---"}</div></td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden"><div className="rotated-cell py-1">{student.fatherName}</div></td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden text-[6pt] uppercase"><div className="rotated-cell py-1">{student.fatherNameEn || "---"}</div></td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden"><div className="rotated-cell py-1">{student.grandfatherName || "---"}</div></td>
                                                            <td rowSpan={3} className="font-bold px-0.5 overflow-hidden text-[6pt] uppercase"><div className="rotated-cell py-1">{student.grandfatherNameEn || "---"}</div></td>
                                                            <td rowSpan={3} className="font-bold"><div className="vertical-text">{toPersianNum(student.studentId)}</div></td>
                                                            <td rowSpan={3} className="font-bold"><div className="vertical-text">{toPersianNum(student.tazkiraNo)}</div></td>
                                                        </>
                                                    )}

                                                    <td className="font-bold"><div className="vertical-text">{toPersianNum(student.birthYearSh || "----")}</div></td>
                                                    <td className="font-bold"><div className="vertical-text">{student.birthYearMa || "----"}</div></td>

                                                    {rowIdx === 0 && <td rowSpan={3} className="font-bold"><div className="rotated-cell py-1">{student.permanentResidence || "---"}</div></td>}

                                                    <td className={`font-bold ${type === "TOTAL" ? 'bg-gray-200 text-[6pt]' : 'bg-gray-50'}`}>{typeLabel}</td>

                                                    {subjects.map((sub, i) => {
                                                        const score = type === "TOTAL"
                                                            ? (parseFloat(student.grades?.[sub.id]?.MIDTERM) || 0) + (parseFloat(student.grades?.[sub.id]?.FINAL) || 0)
                                                            : student.grades?.[sub.id]?.[type];
                                                        return (
                                                            <td key={i} className={`${type === "TOTAL" ? 'bg-gray-200 font-bold' : ''}`}>
                                                                {isEditable && type !== "TOTAL" ? (
                                                                    <PersianInput value={score} onChange={(e: any) => onGradeChange?.(student.id, sub.id, type, e.target.value)} className="grade-input" />
                                                                ) : (toPersianNum(score))}
                                                            </td>
                                                        );
                                                    })}

                                                    <td className={`${type === "TOTAL" ? 'bg-gray-200 font-bold' : ''}`}>{toPersianNum(type === "MIDTERM" ? res.midTotal : type === "FINAL" ? res.finalTotal : res.total)}</td>
                                                    <td className={`${type === "TOTAL" ? 'bg-gray-200 font-bold' : ''}`}>{toPersianNum(type === "MIDTERM" ? res.midAvg?.toFixed(1) : type === "FINAL" ? "" : res.avg?.toFixed(1))}</td>

                                                    {rowIdx === 0 ? (
                                                        <><td className="font-bold">{res.midStatus}</td><td className="font-bold">{res.midGrade}</td></>
                                                    ) : rowIdx === 1 ? (
                                                        <><td rowSpan={2} className="font-bold">{res.result}</td><td rowSpan={2} className="font-bold">{res.annualGrade}</td></>
                                                    ) : null}

                                                    <td className={`${type === "TOTAL" ? 'bg-gray-200' : ''}`}>
                                                        {isEditable && type !== "TOTAL" ? (<PersianInput value={type === "MIDTERM" ? attMid.days : attFin.days} onChange={(e: any) => onAttendanceChange?.(student.id, type, "days", e.target.value)} className="grade-input" />) : (toPersianNum(type === "MIDTERM" ? attMid.days : type === "FINAL" ? attFin.days : ""))}
                                                    </td>
                                                    {["present", "absent", "sick", "leave"].map(field => (
                                                        <td key={field} className={`${type === "TOTAL" ? 'bg-gray-200' : ''}`}>
                                                            {isEditable && type !== "TOTAL" ? (<PersianInput value={type === "MIDTERM" ? attMid[field] : attFin[field]} onChange={(e: any) => onAttendanceChange?.(student.id, type, field, e.target.value)} className="grade-input" />) : (toPersianNum(type === "MIDTERM" ? attMid[field] : type === "FINAL" ? attFin[field] : (parseFloat(attMid[field]) || 0) + (parseFloat(attFin[field]) || 0)))}
                                                        </td>
                                                    ))}

                                                    {rowIdx === 0 && (
                                                        <td rowSpan={3} className="bg-white p-0.5 border border-black overflow-hidden relative">
                                                            {student.photo ? (
                                                                <img src={student.photo} className="w-full h-full object-cover" alt="Student" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-[6pt] text-gray-400">
                                                                    <span className="font-bold">۳×۴</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ height: getRowHeight(19), maxHeight: getRowHeight(19) }}>
                                            <td className="font-bold bg-gray-50 italic text-right px-4 overflow-hidden" colSpan={remarksColSpan}>
                                                <div className="flex items-center gap-2 h-full">
                                                    <span>ملاحظه:</span>
                                                    {isEditable ? (
                                                        <input className="bg-transparent border-none outline-none flex-1 font-bold h-full" value={obs} onChange={(e) => onObservationChange?.(student.id, e.target.value)} placeholder="..................................................................................................." />
                                                    ) : (<span className="flex-1 truncate">{obs || "..................................................................................................."}</span>)}
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}
                <div className="flex-shrink-0 mt-auto mb-0 pb-2">
                    <div className="flex justify-between items-center px-12 text-center font-black" style={{ fontSize: `${fontSize * 1.1}pt` }}>
                        {signaturesAtBottom ? (
                            <>
                                <div className="flex flex-col gap-2"><span>امضاء نگران صنف</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء هیئت ممتحن</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء هیئت ممتحن</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء سرمعلم</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء مدیر مکتب</span><div className="signature-line"></div></div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2"><span>امضاء هیئت ممتحن</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء هیئت ممتحن</span><div className="signature-line"></div></div>
                                <div className="flex flex-col gap-2"><span>امضاء مدیر مکتب</span><div className="signature-line"></div></div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {schoolSettings?.logoCenter && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]"><img src={schoolSettings.logoCenter} className="w-[110mm]" /></div>}
        </div>
    );
};

export default GradeSheetHighSchool;
