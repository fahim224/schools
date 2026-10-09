
import React, { useState, useRef } from 'react';

interface GradeSheetProps {
  margins: {
    top: number;
    bottom: number;
    right: number;
    left: number;
  };
  fontSize: number;
  rowHeightScale: number;
  headerHeightScale: number;
  signaturesAtBottom?: boolean;
  hidePageNumber?: boolean;
}

const GradeSheet: React.FC<GradeSheetProps> = ({ 
  margins, 
  fontSize, 
  rowHeightScale, 
  headerHeightScale,
  signaturesAtBottom = false,
  hidePageNumber = false
}) => {
  const [rightLogo, setRightLogo] = useState<string | null>(null);
  const [centerLogo, setCenterLogo] = useState<string | null>(null);
  const [studentPhotos, setStudentPhotos] = useState<{ [key: number]: string }>({});
  const [activeStudentIdx, setActiveStudentIdx] = useState<number | null>(null);
  
  const rightLogoRef = useRef<HTMLInputElement>(null);
  const centerLogoRef = useRef<HTMLInputElement>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    "قرآنکریم", "دینیات", "دری", "پشتو", "تجوید", "عربی", "انگلیسی", "ریاضی",
    "فزیک", "کیمیا", "بیولوژی", "ساینس", "اجتماعیات", "جغرافیه", "مدنی", 
    "رسم", "حرفه", "مهارت", "ورزش", "تهذیب"
  ];

  const students = [1, 2, 3]; 

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeStudentIdx !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentPhotos(prev => ({ ...prev, [activeStudentIdx]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerStudentPhotoUpload = (idx: number) => {
    setActiveStudentIdx(idx);
    studentPhotoInputRef.current?.click();
  };

  const LogoPlaceholder = ({ onClick, label }: { onClick: () => void, label: string }) => (
    <div 
      onClick={onClick} 
      className="w-14 h-14 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-[8px] text-slate-400 font-bold text-center px-1 no-print"
    >
      {label}
    </div>
  );

  // Dimensions
  const COMMON_COL_WIDTH = '7.2mm'; 
  const PHOTO_COL_WIDTH = '26mm';
  const ROW_HEIGHT = `${7 * rowHeightScale}mm`;
  const HEADER_HEIGHT_LONG = `${22 * headerHeightScale}mm`;

  const remarksColSpan = 6 + 5 + 1 + subjects.length + 4 + 5 + 1;

  return (
    <div 
      className="a4-page relative font-['Vazirmatn'] select-none overflow-hidden print:shadow-none transition-shadow" 
      style={{ 
        paddingTop: `${margins.top}mm`,
        paddingBottom: `${margins.bottom}mm`,
        paddingRight: `${margins.right}mm`,
        paddingLeft: `${margins.left}mm`,
        direction: 'rtl',
        fontSize: `${fontSize}pt`
      }}
    >
      <div className="flex flex-col p-1 bg-white relative z-10 text-black h-full">
        {/* Hidden Inputs */}
        <input type="file" ref={rightLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoChange(e, setRightLogo)} />
        <input type="file" ref={centerLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoChange(e, setCenterLogo)} />
        <input type="file" ref={studentPhotoInputRef} className="hidden" accept="image/*" onChange={handleStudentPhotoChange} />

        {/* TOP HEADER */}
        <div className="relative w-full flex-shrink-0">
          {!signaturesAtBottom && (
            <div className="flex justify-between font-bold mb-1 px-4" style={{ fontSize: `${fontSize * 0.8}pt` }}>
               <div className="flex gap-2 items-center"><span>امضاء سرمعلم :</span><span className="w-16 border-b border-dotted border-black"></span></div>
               <div className="flex gap-2 items-center"><span>امضاء نگران :</span><span className="w-16 border-b border-dotted border-black"></span></div>
            </div>
          )}

          <div className="flex justify-between items-stretch w-full px-1 gap-2">
            <div className="flex-1 flex flex-col justify-between">
               <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                     <div className="flex flex-col items-center">
                        {rightLogo ? <img src={rightLogo} className="w-14 h-14 object-contain" alt="Logo" /> : <LogoPlaceholder label="نشان ملی" onClick={() => rightLogoRef.current?.click()} />}
                     </div>
                     {!hidePageNumber && (
                        <div className="flex flex-col font-bold" style={{ fontSize: `${fontSize * 0.8}pt` }}>
                           <div className="flex items-center gap-1"><span>صفحه:</span><span className="w-8 border-b border-black text-center">1</span></div>
                        </div>
                     )}
                  </div>
                  <div className="text-center flex-1">
                     <h1 className="font-black leading-none mb-1 text-black" style={{ fontSize: `${fontSize * 1.4}pt` }}>وزارت معارف</h1>
                     <h2 className="font-bold leading-none mb-1 text-black" style={{ fontSize: `${fontSize * 1.0}pt` }}>ریاست معارف شهر کابل</h2>
                     <p className="leading-none mb-1 text-black" style={{ fontSize: `${fontSize * 0.8}pt` }}>آمریت معارف حوزه دوازدهم تعلیمی</p>
                     <p className="font-bold leading-none text-black" style={{ fontSize: `${fontSize * 0.85}pt` }}>لیسه عالی گل پاچا الفت</p>
                  </div>
                  <div className="flex flex-col items-center">
                     {centerLogo ? <img src={centerLogo} className="w-14 h-14 object-contain" alt="Logo" /> : <LogoPlaceholder label="لوگوی وزارت" onClick={() => centerLogoRef.current?.click()} />}
                  </div>
               </div>
               <div className="flex justify-between items-center py-1 font-bold border-t border-black mt-1" style={{ fontSize: `${fontSize * 0.9}pt` }}>
                  <div className="flex gap-1 items-center"><span>صنف:</span><span className="min-w-[20mm] border-b border-black text-center">نهم 1</span></div>
                  <div className="flex gap-1 items-center"><span>سال تعلیمی:</span><span className="min-w-[25mm] border-b border-black text-center">1404 هـ ش</span></div>
                  <div className="flex gap-2 items-center"><span>نگران:</span><span className="min-w-[45mm] border-b border-black text-center">عزت الله عابد</span></div>
               </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
               {[ "خلص احصائیه چهارنیم ماهه", "خلص احصائیه سالانه" ].map((title, idx) => (
                 <table key={idx} className="border-collapse border border-black w-[35mm]" style={{ fontSize: `${fontSize * 0.65}pt` }}>
                    <thead><tr className="bg-slate-50"><th colSpan={2} className="border border-black py-0.5 font-black text-center">{title}</th></tr></thead>
                    <tbody>
                      {(idx === 0 ? ["تعداد کل", "شامل امتحان", "موفق", "تلاش بیشتر", "غایب", "معذرتی"] : ["تعداد کل", "شامل امتحان", "ارتقا", "تکرار", "مشروط", "محروم"]).map((l, i) => (
                        <tr key={i} style={{ height: '5.2mm' }}><td className="border border-black px-1 text-right leading-none">{l}</td><td className="border border-black w-7"></td></tr>
                      ))}
                    </tbody>
                 </table>
               ))}
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="border-t-2 border-black mt-1 flex justify-center w-full overflow-hidden">
          <table className="border-collapse border-black text-center table-fixed" style={{ fontSize: `${fontSize * 0.6}pt`, width: '100%', tableLayout: 'fixed' }}>
            <thead className="bg-slate-50">
              <tr>
                <th rowSpan={2} className="border border-black w-[7.5mm] font-black"><div className="vertical-text">شماره</div></th>
                <th colSpan={6} className="border border-black font-black py-0.5 h-[5.5mm]">شهرت شاگرد</th>
                <th rowSpan={2} className="border border-black w-[9.2mm] font-black"><div className="vertical-text">نمبر اساس</div></th>
                <th rowSpan={2} className="border border-black w-[9.2mm] font-black"><div className="vertical-text">نمبر تذکره</div></th>
                <th rowSpan={2} className="border border-black w-[9mm] font-black"><div className="vertical-text">تولد (ش)</div></th>
                <th rowSpan={2} className="border border-black w-[9mm] font-black"><div className="vertical-text">تولد (م)</div></th>
                <th rowSpan={2} className="border border-black w-[18mm] font-black"><div className="vertical-text">سکونت اصلی</div></th>
                <th rowSpan={2} className="border border-black w-[18mm] font-black">امتحانات</th>
                <th colSpan={subjects.length} className="border border-black font-black py-0.5">مضامین تعلیمی</th>
                <th rowSpan={2} className="border border-black w-[9.2mm] font-black"><div className="vertical-text">مجموع</div></th>
                <th rowSpan={2} className="border border-black w-[9.2mm] font-black"><div className="vertical-text">اوسط</div></th>
                <th rowSpan={2} className="border border-black w-[18mm] font-black">نتیجه</th>
                <th rowSpan={2} className="border border-black w-[9mm] font-black"><div className="vertical-text">درجه</div></th>
                <th colSpan={5} className="border border-black font-black py-0.5">ضوابط حاضری</th>
                <th rowSpan={2} className="border border-black font-black" style={{ width: PHOTO_COL_WIDTH }}>تصویر شاگرد</th>
              </tr>
              <tr>
                {[
                  { label: "اسم", w: COMMON_COL_WIDTH }, { label: "Name", w: COMMON_COL_WIDTH },
                  { label: "نام پدر", w: COMMON_COL_WIDTH }, { label: "Father Name", w: COMMON_COL_WIDTH },
                  { label: "نام پدرکلان", w: COMMON_COL_WIDTH }, { label: "Grand Father", w: COMMON_COL_WIDTH }
                ].map((h, i) => (
                  <th key={i} className="border border-black p-0 font-black" style={{ width: h.w, height: HEADER_HEIGHT_LONG }}>
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="vertical-text whitespace-nowrap text-[8px] leading-none">{h.label}</div>
                    </div>
                  </th>
                ))}
                
                {subjects.map((sub, i) => (
                  <th key={i} className="border border-black font-black p-0" style={{ width: COMMON_COL_WIDTH, height: HEADER_HEIGHT_LONG }}>
                    <div className="flex items-center justify-center h-full w-full"><div className="vertical-text whitespace-nowrap text-[8px] leading-none">{sub}</div></div>
                  </th>
                ))}
                {["ایام تعلیمی", "حاضر", "غیر حاضر", "مریض", "رخصت"].map(h => (
                  <th key={h} className="border border-black p-0" style={{ width: COMMON_COL_WIDTH }}><div className="vertical-text text-[8px] leading-none">{h}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((studentIdx) => (
                <React.Fragment key={studentIdx}>
                  {[ "چهارونیم ماهه", "سالانه", "مجموع" ].map((type, rowIdx) => (
                    <tr key={rowIdx} style={{ height: ROW_HEIGHT }} className="p-0 m-0 leading-none overflow-hidden border-collapse">
                      {rowIdx === 0 && (
                        <>
                          <td rowSpan={4} className="border border-black font-bold text-[8pt] p-0 m-0"><div className="vertical-text">{studentIdx}</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[7.5pt]"><div className="vertical-text py-1">محمد همایون</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[6.5pt]"><div className="vertical-text py-1">Homayoon</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[7.5pt]"><div className="vertical-text py-1">عبدالقدوس</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[6.5pt]"><div className="vertical-text py-1">Abdul Qudoos</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[7.5pt]"><div className="vertical-text py-1">حاجی محمد</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[6.5pt]"><div className="vertical-text py-1">Haji Mohammad</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[6.5pt]"><div className="vertical-text">9875483</div></td>
                          <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[6.5pt]"><div className="vertical-text">87438</div></td>
                        </>
                      )}
                      
                      <td className="border border-black font-bold text-[6.5pt] p-0"><div className="vertical-text">1385</div></td>
                      <td className="border border-black font-bold text-[6.5pt] p-0"><div className="vertical-text">2006</div></td>

                      {rowIdx === 0 && (
                        <td rowSpan={3} className="border border-black p-0 m-0 font-bold text-[7.5pt]">
                          <div className="vertical-text py-1">کابل دوازدهم الفت</div>
                        </td>
                      )}

                      <td className={`border border-black font-bold text-[7.5pt] p-0 leading-none h-full m-0 ${rowIdx === 2 ? 'bg-slate-100' : 'bg-white'}`}>
                        <div className="w-full h-full flex items-center justify-center p-0 m-0">{type}</div>
                      </td>
                      
                      {subjects.map((_, i) => <td key={i} className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>)}
                      
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      
                      <td className={`border border-black font-bold text-[7pt] p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black font-bold text-[7pt] p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>
                      <td className={`border border-black p-0 m-0 ${rowIdx === 2 ? 'bg-slate-50' : ''}`}></td>

                      {rowIdx === 0 && (
                        <td 
                          rowSpan={3} 
                          className="border border-black p-0.5 bg-white m-0 cursor-pointer hover:bg-blue-50/30 transition-colors overflow-hidden relative group" 
                          style={{ width: PHOTO_COL_WIDTH }}
                          onClick={() => triggerStudentPhotoUpload(studentIdx)}
                        >
                          {studentPhotos[studentIdx] ? (
                            <img src={studentPhotos[studentIdx]} className="w-full h-full object-cover" alt="Student" />
                          ) : (
                            <div className="w-full h-full border border-black border-dashed rounded flex flex-col items-center justify-center bg-slate-50/50 text-[7px] text-slate-300">
                               <svg className="w-8 h-8 mb-1 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                               <span className="font-bold opacity-0 group-hover:opacity-100 transition-opacity no-print">انتخاب عکس</span>
                               <span className="font-bold print:hidden">۳×۴</span>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr style={{ height: ROW_HEIGHT }} className="p-0 m-0 leading-none">
                    <td className="border border-black font-bold bg-white italic text-right px-2 overflow-hidden whitespace-nowrap" colSpan={remarksColSpan} style={{ fontSize: `${fontSize * 0.6}pt` }}>
                       ملاحظه: .................................................................................................................................................................................................................................................................................................................................................................
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mt-auto border-t border-black pt-4 pb-2 flex-shrink-0">
           <div className={`flex ${signaturesAtBottom ? 'justify-between' : 'justify-around'} items-center font-bold px-4`} style={{ fontSize: `${fontSize * 0.8}pt` }}>
              {signaturesAtBottom && (
                <>
                  <div className="flex flex-col items-center"><span>امضاء سرمعلم</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
                  <div className="flex flex-col items-center"><span>امضاء نگران</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
                </>
              )}
              {!signaturesAtBottom && (
                <>
                  <div className="flex flex-col items-center"><span>امضاء هیئت ممتحن</span><div className="w-28 border-b border-dotted border-black mt-4"></div></div>
                  <div className="flex flex-col items-center"><span>امضاء سرمعلم</span><div className="w-28 border-b border-dotted border-black mt-4"></div></div>
                  <div className="flex flex-col items-center"><span>امضاء مدیر مکتب</span><div className="w-28 border-b border-dotted border-black mt-4"></div></div>
                </>
              )}
              {signaturesAtBottom && (
                 <>
                  <div className="flex flex-col items-center"><span>امضاء هیئت ممتحن</span><div className="w-28 border-b border-dotted border-black mt-4"></div></div>
                  <div className="flex flex-col items-center"><span>امضاء مدیر مکتب</span><div className="w-28 border-b border-dotted border-black mt-4"></div></div>
                 </>
              )}
           </div>
        </div>
      </div>
      {centerLogo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]"><img src={centerLogo} className="w-[80mm]" /></div>}
    </div>
  );
};

export default GradeSheet;
