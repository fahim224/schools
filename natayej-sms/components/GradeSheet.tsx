
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
  
  const rightLogoRef = useRef<HTMLInputElement>(null);
  const centerLogoRef = useRef<HTMLInputElement>(null);

  const subjects = [
    "قرآنکریم", "دینیات", "دری", "پشتو", "تجوید", "عربی", "انگلیسی", "ریاضی",
    "فزیک", "کیمیا", "بیولوژی", "ساینس", "اجتماعیات", "جغرافیه", "مدنی", 
    "رسم", "حرفه", "مهارت", "ورزش", "تهذیب"
  ];

  const students = [1, 2, 3, 4]; 

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const LogoPlaceholder = ({ onClick, label }: { onClick: () => void, label: string }) => (
    <div onClick={onClick} className="w-14 h-14 border-2 border-dashed border-gray-400 rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors text-[8px] text-gray-500 font-bold text-center px-1">
      {label}
    </div>
  );

  const getRowHeight = (baseMm: number) => `${baseMm * rowHeightScale * 2}mm`;
  const getHeaderHeight = (baseMm: number) => `${baseMm * headerHeightScale * 2}mm`;

  const remarksColSpan = 3 + 2 + 1 + subjects.length + 2 + 2 + 5;

  return (
    <div 
      className="a4-page relative font-['Vazirmatn'] select-none overflow-hidden" 
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
        <input type="file" ref={rightLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setRightLogo)} />
        <input type="file" ref={centerLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setCenterLogo)} />

        {/* TOP HEADER */}
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
                        {rightLogo ? <img src={rightLogo} className="w-14 h-14 object-contain" alt="Logo" /> : <LogoPlaceholder label="نشان ملی" onClick={() => rightLogoRef.current?.click()} />}
                     </div>
                     {!hidePageNumber && (
                        <div className="flex flex-col font-bold" style={{ fontSize: `${fontSize * 0.8}pt` }}>
                           <div className="flex items-center gap-1"><span>صفحه:</span><span className="w-8 border-b border-black text-center">1</span></div>
                        </div>
                     )}
                  </div>
                  <div className="text-center flex-1">
                     <h1 className="font-black leading-none mb-1" style={{ fontSize: `${fontSize * 1.4}pt` }}>وزارت معارف</h1>
                     <h2 className="font-bold leading-none mb-1" style={{ fontSize: `${fontSize * 1.0}pt` }}>ریاست معارف (شهر کابل)</h2>
                     <p className="leading-none mb-1" style={{ fontSize: `${fontSize * 0.8}pt` }}>آمریت معارف (حوزه دوازدهم تعلیمی)</p>
                     <p className="font-bold leading-none" style={{ fontSize: `${fontSize * 0.85}pt` }}>لیسه عالی (گل پاچا الفت)</p>
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
                 <table key={idx} className="border-collapse border border-black w-[33mm]" style={{ fontSize: `${fontSize * 0.68}pt` }}>
                    <thead><tr className="bg-gray-100"><th colSpan={2} className="border border-black py-0.5 font-black">{title}</th></tr></thead>
                    <tbody>
                      {(idx === 0 ? ["تعداد کل", "امتحان", "موفق", "غایب", "معذرت"] : ["تعداد کل", "ارتقا", "تکرار", "مشروط", "محروم"]).map((l, i) => (
                        <tr key={i} style={{ height: getRowHeight(5) }}><td className="border border-black px-1 text-right">{l}</td><td className="border border-black w-7"></td></tr>
                      ))}
                    </tbody>
                 </table>
               ))}
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="border-t-2 border-black mt-1 flex justify-center">
          <table className="w-full border-collapse border-black text-center table-fixed " style={{ fontSize: `${fontSize * 0.68}pt`, width: 'max-content' }}>
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="border border-black w-[7mm] font-black"><div className="vertical-text">شماره</div></th>
                <th colSpan={3} className="border border-black font-black py-0.5" style={{ height: getHeaderHeight(5) }}>شهرت شاگرد</th>
                <th rowSpan={2} className="border border-black w-[9mm] font-black"><div className="vertical-text">نمبر اساس</div></th>
                <th rowSpan={2} className="border border-black w-[9mm] font-black"><div className="vertical-text">نمبر تذکره</div></th>
                <th rowSpan={2} className="border border-black w-[13mm] font-black">امتحانات</th>
                <th colSpan={subjects.length} className="border border-black font-black py-0.5">مضامین تعلیمی</th>
                <th rowSpan={2} className="border border-black w-[8mm] font-black"><div className="vertical-text">مجموع</div></th>
                <th rowSpan={2} className="border border-black w-[8mm] font-black"><div className="vertical-text">اوسط</div></th>
                <th rowSpan={2} className="border border-black w-[13mm] font-black">نتیجه</th>
                <th rowSpan={2} className="border border-black w-[8mm] font-black"><div className="vertical-text">درجه</div></th>
                <th colSpan={5} className="border border-black font-black py-0.5">ضوابط حاضری</th>
              </tr>
              <tr>
                {/* Headers for names: Adjusted width for vertical text */}
                <th className="border border-black px-1 w-[16mm]" style={{ height: getHeaderHeight(7) }}>اسم</th>
                <th className="border border-black px-1 w-[16mm]">نام پدر</th>
                <th className="border border-black px-1 w-[16mm]">نام پدرکلان</th>
                {subjects.map((sub, i) => (
                  <th key={i} className="border border-black font-black p-0 w-[6.5mm]" style={{ height: getHeaderHeight(20) }}>
                    <div className="flex items-center justify-center h-full w-full"><div className="vertical-text whitespace-nowrap text-[9px] leading-none">{sub}</div></div>
                  </th>
                ))}
                {["ایام تعلیمی", "حاضر", "غیر حاضر", "مریض", "رخصت"].map(h => (
                  <th key={h} className="border border-black w-[6mm] p-0"><div className="vertical-text text-[9px] leading-none">{h}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((studentIdx) => (
                <React.Fragment key={studentIdx}>
                  {[ "چهارونیم ماهه", "سالانه", "مجموع" ].map((type, rowIdx) => (
                    <tr key={rowIdx} style={{ height: getRowHeight(7.5) }}>
                      {rowIdx === 0 && (
                        <>
                          <td rowSpan={4} className="border border-black font-bold text-[8.5pt]"><div className="vertical-text">{studentIdx}</div></td>
                          {/* Name Cells: Applied vertical-text for 180-degree rotation */}
                          <td rowSpan={3} className="border border-black px-0.5 font-bold text-[8pt]">
                            <div className="vertical-text py-1">محمد همایون</div>
                          </td>
                          <td rowSpan={3} className="border border-black px-0.5 font-bold text-[8pt]">
                            <div className="vertical-text py-1">عبدالقدوس</div>
                          </td>
                          <td rowSpan={3} className="border border-black px-0.5 font-bold text-[8pt]">
                            <div className="vertical-text py-1">حاجی محمد</div>
                          </td>
                          <td rowSpan={3} className="border border-black font-bold text-[7pt]"><div className="vertical-text">9875483</div></td>
                          <td rowSpan={3} className="border border-black font-bold text-[7pt]"><div className="vertical-text">87438</div></td>
                        </>
                      )}
                      <td className={`border border-black font-bold text-[6.5px] ${rowIdx === 2 ? 'bg-gray-200' : 'bg-gray-50'}`} style={{ height: getRowHeight(6) }}>{type}</td>
                      {subjects.map((_, i) => <td key={i} className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>)}
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      
                      {rowIdx === 0 ? (
                        <>
                          <td className="border border-black font-bold text-[8pt]">&nbsp;</td>
                          <td className="border border-black font-bold text-[8pt]">&nbsp;</td>
                        </>
                      ) : rowIdx === 1 ? (
                        <>
                          <td rowSpan={2} className="border border-black font-bold text-[8pt]"></td>
                          <td rowSpan={2} className="border border-black font-bold text-[8pt]"></td>
                        </>
                      ) : null}

                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                      <td className={`border border-black ${rowIdx === 2 ? 'bg-gray-100' : ''}`}></td>
                    </tr>
                  ))}
                  <tr style={{ height: getRowHeight(7.5) }}>
                    <td className="border border-black font-bold bg-gray-50 italic text-right px-2 overflow-hidden whitespace-nowrap" colSpan={remarksColSpan} style={{ fontSize: `${fontSize * 0.68}pt` }}>
                       ملاحظه: ....................................................................................................................................................................................................................................................................................................................
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mb-auto border-t border-black pt-2 pb-1 flex-shrink-0">
           <div className={`flex ${signaturesAtBottom ? 'justify-between' : 'justify-around'} items-center font-bold px-4`} style={{ fontSize: `${fontSize * 0.85}pt` }}>
              {signaturesAtBottom && (
                <>
                  <div className="flex flex-col items-center"><span>امضاء سرمعلم</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
                  <div className="flex flex-col items-center"><span>امضاء نگران</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
                </>
              )}
              <div className="flex flex-col items-center"><span>امضاء هیئت ممتحن</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
              <div className="flex flex-col items-center"><span>امضاء سرمعلم</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
              <div className="flex flex-col items-center"><span>امضاء مدیر مکتب</span><div className="w-24 border-b border-dotted border-black mt-3"></div></div>
           </div>
        </div>
      </div>
      {centerLogo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]"><img src={centerLogo} className="w-[80mm]" /></div>}
    </div>
  );
};

export default GradeSheet;
