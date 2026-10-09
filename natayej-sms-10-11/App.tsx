
import React, { useState } from 'react';
import GradeSheet from './components/GradeSheet';

const App: React.FC = () => {
  const [margins, setMargins] = useState({ top: 5, bottom: 5, right: 5, left: 5 });
  const [fontSize, setFontSize] = useState(10);
  const [rowHeightScale, setRowHeightScale] = useState(1);
  const [headerHeightScale, setHeaderHeightScale] = useState(1);
  const [signaturesAtBottom, setSignaturesAtBottom] = useState(false);
  const [hidePageNumber, setHidePageNumber] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Vazirmatn']">
      {/* Top Navigation Bar */}
      <header className="no-print sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-6">
          
          {/* Logo/Title Section */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none">پنل مدیریت نمرات</h1>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Academic Report System</p>
            </div>
          </div>

          {/* Controls Groups */}
          <div className="flex flex-wrap items-center gap-8 flex-1 justify-center">
            
            {/* Scale Controls */}
            <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-[11px] font-bold text-slate-500">اندازه متن ({fontSize}pt)</label>
                <input 
                  type="range" min="6" max="14" step="0.5" value={fontSize} 
                  onChange={(e) => setFontSize(parseFloat(e.target.value))} 
                  className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-[11px] font-bold text-slate-500">ارتفاع ردیف ({rowHeightScale})</label>
                <input 
                  type="range" min="0.5" max="1.5" step="0.05" value={rowHeightScale} 
                  onChange={(e) => setRowHeightScale(parseFloat(e.target.value))} 
                  className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
              </div>
            </div>

            {/* Toggle Controls */}
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer group">
                <input type="checkbox" checked={signaturesAtBottom} onChange={(e) => setSignaturesAtBottom(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-xs font-bold text-slate-600 group-hover:text-blue-600">امضاء در پایین</span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer group">
                <input type="checkbox" checked={hidePageNumber} onChange={(e) => setHidePageNumber(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-xs font-bold text-slate-600 group-hover:text-blue-600">مخفی سازی صفحه</span>
              </label>
            </div>

            {/* Margin Inputs */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
               <span className="text-[10px] font-black text-slate-400 px-2 border-l border-slate-200">حاشیه‌ها</span>
               <div className="flex gap-1">
                 {['top', 'bottom', 'right', 'left'].map((side) => (
                   <div key={side} className="flex flex-col items-center">
                     <input 
                        type="number" 
                        value={margins[side as keyof typeof margins]} 
                        onChange={(e) => setMargins({...margins, [side]: parseInt(e.target.value) || 0})} 
                        className="w-10 h-8 text-[11px] font-bold text-center border-none bg-white rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                        title={side}
                     />
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-6 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            <span className="hidden sm:inline">چاپ نهایی (A4)</span>
          </button>

        </div>
      </header>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-auto p-8 flex justify-center items-start bg-[#f0f2f5]">
        <div className="transform origin-top transition-transform duration-300">
          <GradeSheet 
            margins={margins}
            fontSize={fontSize}
            rowHeightScale={rowHeightScale}
            headerHeightScale={headerHeightScale}
            signaturesAtBottom={signaturesAtBottom}
            hidePageNumber={hidePageNumber}
          />
        </div>
      </main>

      {/* Footer Info (Screen only) */}
      <footer className="no-print p-4 text-center text-[10px] text-slate-400 font-bold border-t border-slate-200 bg-white">
        طراحی شده برای وزارت معارف ج.ا.ا - ویرایش نهم 1404
      </footer>
    </div>
  );
};

export default App;
