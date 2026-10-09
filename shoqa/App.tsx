
import React, { useState, useEffect } from 'react';
import { SheetType, StudentRecord, HeaderData, TableLabels } from './types';
import { INITIAL_HEADER_DATA, INITIAL_TABLE_LABELS, MOCK_STUDENTS } from './constants';
import MazmoonTable from './components/MazmoonTable';
import ZawabitTable from './components/ZawabitTable';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentSheet, setCurrentSheet] = useState<SheetType>(SheetType.MAZMOON);
  const [rowCount, setRowCount] = useState(40);
  const [showBasisNumber, setShowBasisNumber] = useState(true);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [headerData, setHeaderData] = useState<HeaderData>(INITIAL_HEADER_DATA);
  const [tableLabels, setTableLabels] = useState<TableLabels>(INITIAL_TABLE_LABELS);
  
  const [mazmoonTitle, setMazmoonTitle] = useState("شقه نمرات مضمون (سالانه)");
  const [zawabitTitle, setZawabitTitle] = useState("شقه ضوابط حاضری و اخلاق");

  const [logoRight, setLogoRight] = useState("");
  const [logoLeft, setLogoLeft] = useState("");
  const [logoSize, setLogoSize] = useState(45);

  useEffect(() => {
    const initialStudents = MOCK_STUDENTS.slice(0, rowCount);
    const filledStudents: StudentRecord[] = Array.from({ length: rowCount }, (_, i) => {
      if (initialStudents[i]) return initialStudents[i];
      return {
        id: i + 1,
        basisNumber: "",
        name: "",
        fatherName: "",
        grandfatherName: "",
        scores: { written: "", oral: "", activity: "", homework: "", total: "", remarks: "" },
        attendance: { absent: "", sick: "", leave: "", present: "" }
      };
    });
    setStudents(filledStudents);
  }, [rowCount]);

  const handlePrint = () => {
    window.print();
  };

  const updateHeader = (field: keyof HeaderData, val: string) => {
    setHeaderData(prev => ({ ...prev, [field]: val }));
  };

  const updateStudent = (id: number | string, field: string, val: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const updateScore = (id: number | string, field: string, val: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { 
      ...s, 
      scores: { ...s.scores ? s.scores : {written: "", oral: "", activity: "", homework: "", total: "", remarks: ""}, [field]: val } 
    } : s));
  };

  const updateAttendance = (id: number | string, field: string, val: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { 
      ...s, 
      attendance: { ...s.attendance ? s.attendance : {absent: "", sick: "", leave: "", present: ""}, [field]: val } 
    } : s));
  };

  const SingleSheet = () => (
    <div className="a4-container">
      <div className="header-area">
        <Header 
          data={headerData} 
          title={currentSheet === SheetType.MAZMOON ? mazmoonTitle : zawabitTitle}
          logoRight={logoRight}
          logoLeft={logoLeft}
          logoSize={logoSize}
          onUpdateHeader={updateHeader}
          onUpdateTitle={(val) => {
            if (currentSheet === SheetType.MAZMOON) setMazmoonTitle(val);
            else setZawabitTitle(val);
          }} 
          onUploadLogo={(side, file) => {
            const reader = new FileReader();
            reader.onload = (e) => side === 'left' ? setLogoLeft(e.target?.result as string) : setLogoRight(e.target?.result as string);
            reader.readAsDataURL(file);
          }}
        />
      </div>
      <div className="flex-grow overflow-hidden">
        {currentSheet === SheetType.MAZMOON ? (
          <MazmoonTable 
            students={students} 
            labels={tableLabels}
            showBasisNumber={showBasisNumber}
            onUpdateStudent={updateStudent} 
            onUpdateScore={updateScore}
            onUpdateLabel={(f, v) => setTableLabels(p => ({ ...p, [f]: v }))}
          />
        ) : (
          <ZawabitTable 
            students={students} 
            labels={tableLabels}
            showBasisNumber={showBasisNumber}
            onUpdateStudent={updateStudent} 
            onUpdateAttendance={updateAttendance}
            onUpdateLabel={(f, v) => setTableLabels(p => ({ ...p, [f]: v }))}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-200">
      <div className="no-print control-panel sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-lg p-4 border-b border-indigo-100">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-indigo-600 mb-1">تعداد سطرهای جدول</span>
              <div className="row-input-wrapper">
                <input 
                  type="number" 
                  min="1"
                  max="40"
                  value={rowCount} 
                  onChange={(e) => setRowCount(Math.min(40, Math.max(1, parseInt(e.target.value) || 0)))}
                  className="bg-transparent border-none outline-none w-14 text-center font-black text-indigo-900"
                />
              </div>
            </div>

            <div className="h-10 w-px bg-gray-200"></div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-indigo-600 mb-1">ستون نمبر اساس</span>
              <button 
                onClick={() => setShowBasisNumber(!showBasisNumber)}
                className={`px-5 py-2 rounded-xl border-2 transition-all font-bold text-sm shadow-sm ${showBasisNumber ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
              >
                {showBasisNumber ? "نمایش" : "مخفی"}
              </button>
            </div>

            <div className="h-10 w-px bg-gray-200"></div>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setCurrentSheet(SheetType.MAZMOON)}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${currentSheet === SheetType.MAZMOON ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
              >
                شقه مضمون
              </button>
              <button 
                onClick={() => setCurrentSheet(SheetType.ZAWABIT)}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${currentSheet === SheetType.ZAWABIT ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
              >
                شقه ضوابط
              </button>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-green-200 transition-all hover:-translate-y-1 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            چاپ نهایی (A4)
          </button>
        </div>
      </div>

      <div className="page-wrapper py-8 print:p-0 print:py-0">
        <SingleSheet />
        <SingleSheet />
      </div>
    </div>
  );
};

export default App;
