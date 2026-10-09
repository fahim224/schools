
import React, { useState } from 'react';
import GradeSheet from './components/GradeSheet';

const App: React.FC = () => {
  const [margins, setMargins] = useState({
    top: 5,
    bottom: 5,
    right: 5,
    left: 5
  });

  const [fontSize, setFontSize] = useState(10);
  const [rowHeightScale, setRowHeightScale] = useState(0.5);
  const [headerHeightScale, setHeaderHeightScale] = useState(0.5);
  const [signaturesAtBottom, setSignaturesAtBottom] = useState(false);
  const [hidePageNumber, setHidePageNumber] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const updateMargin = (side: keyof typeof margins, value: string) => {
    const num = parseInt(value) || 0;
    setMargins(prev => ({ ...prev, [side]: num }));
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-slate-100">
      {/* Controls Section - Improved Visibility */}
      <div className="no-print bg-white p-6 rounded-2xl shadow-xl mb-8 w-full max-w-6xl border-b-4 border-black text-right">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 mb-1">پنل مدیریت چاپ نتایج</h1>
            <p className="text-sm text-slate-600 font-bold">وزارت معارف - لیسه عالی گل پاچا الفت</p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-black hover:bg-slate-800 text-white font-black py-4 px-10 rounded-xl shadow-lg transition-all flex items-center gap-3 transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            چاپ و تولید PDF
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-black text-slate-800 mb-2">حاشیه بالا (mm)</label>
            <input type="number" value={margins.top} onChange={(e) => updateMargin('top', e.target.value)} className="w-full bg-white border-2 border-slate-300 p-3 rounded-lg text-center font-bold text-black focus:border-black outline-none shadow-inner" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-800 mb-2">حاشیه پایین (mm)</label>
            <input type="number" value={margins.bottom} onChange={(e) => updateMargin('bottom', e.target.value)} className="w-full bg-white border-2 border-slate-300 p-3 rounded-lg text-center font-bold text-black focus:border-black outline-none shadow-inner" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-800 mb-2">حاشیه راست (mm)</label>
            <input type="number" value={margins.right} onChange={(e) => updateMargin('right', e.target.value)} className="w-full bg-white border-2 border-slate-300 p-3 rounded-lg text-center font-bold text-black focus:border-black outline-none shadow-inner" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-800 mb-2">حاشیه چپ (mm)</label>
            <input type="number" value={margins.left} onChange={(e) => updateMargin('left', e.target.value)} className="w-full bg-white border-2 border-slate-300 p-3 rounded-lg text-center font-bold text-black focus:border-black outline-none shadow-inner" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-black text-red-700 mb-2">قلم (pt)</label>
            <input type="number" step="0.5" value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value) || 10)} className="w-full bg-white border-2 border-red-200 p-3 rounded-lg text-center font-bold text-red-900 focus:border-red-500 outline-none shadow-inner" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-black text-blue-700 mb-2">ارتفاع سطر</label>
            <input type="number" step="0.1" value={rowHeightScale} onChange={(e) => setRowHeightScale(parseFloat(e.target.value) || 0.5)} className="w-full bg-white border-2 border-blue-200 p-3 rounded-lg text-center font-bold text-blue-900 focus:border-blue-500 outline-none shadow-inner" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-black text-green-700 mb-2">ارتفاع هدر</label>
            <input type="number" step="0.1" value={headerHeightScale} onChange={(e) => setHeaderHeightScale(parseFloat(e.target.value) || 0.5)} className="w-full bg-white border-2 border-green-200 p-3 rounded-lg text-center font-bold text-green-900 focus:border-green-500 outline-none shadow-inner" />
          </div>
          <div className="col-span-1 flex items-end">
            <button 
              onClick={() => setSignaturesAtBottom(!signaturesAtBottom)}
              className={`w-full ${signaturesAtBottom ? 'bg-indigo-600' : 'bg-slate-500'} text-white text-[10px] font-black p-3 rounded-lg shadow transition-colors h-[48px]`}
            >
              {signaturesAtBottom ? 'امضاها در پایین' : 'انتقال امضا به پایین'}
            </button>
          </div>
          <div className="col-span-1 flex items-end">
            <button 
              onClick={() => setHidePageNumber(!hidePageNumber)}
              className={`w-full ${hidePageNumber ? 'bg-orange-600' : 'bg-slate-500'} text-white text-[10px] font-black p-3 rounded-lg shadow transition-colors h-[48px]`}
            >
              {hidePageNumber ? 'نمایش شماره صفحه' : 'پنهان کردن صفحه'}
            </button>
          </div>
        </div>
      </div>

      <div className="print-area shadow-2xl">
        <GradeSheet 
          margins={margins} 
          fontSize={fontSize} 
          rowHeightScale={rowHeightScale} 
          headerHeightScale={headerHeightScale}
          signaturesAtBottom={signaturesAtBottom}
          hidePageNumber={hidePageNumber}
        />
      </div>
    </div>
  );
};

export default App;
