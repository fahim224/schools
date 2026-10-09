
import React, { useRef } from 'react';
import { HeaderData } from '../types';
import { toPersianDigits } from '../utils';

interface Props {
  data: HeaderData;
  title: string;
  logoRight: string;
  logoLeft: string;
  logoSize: number;
  onUpdateHeader: (field: keyof HeaderData, val: string) => void;
  onUpdateTitle: (val: string) => void;
  onUploadLogo: (side: 'left' | 'right', file: File) => void;
}

const Header: React.FC<Props> = ({ 
  data, 
  title, 
  logoRight, 
  logoLeft, 
  logoSize, 
  onUpdateHeader, 
  onUpdateTitle,
  onUploadLogo
}) => {
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadLogo(side, file);
  };

  return (
    <header className="w-full text-center relative border-b border-black pb-0.5 text-black">
      <input type="file" ref={leftInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange('left', e)} />
      <input type="file" ref={rightInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange('right', e)} />

      <div className="absolute right-1 top-0 w-[45px] h-[45px] flex items-center justify-center cursor-pointer no-print border border-dashed border-gray-300 rounded" onClick={() => rightInputRef.current?.click()}>
        {logoRight ? <img src={logoRight} style={{ width: `${logoSize}px` }} /> : <span className="text-[5pt]">لوگو</span>}
      </div>
      <div className="absolute left-1 top-0 w-[45px] h-[45px] flex items-center justify-center cursor-pointer no-print border border-dashed border-gray-300 rounded" onClick={() => leftInputRef.current?.click()}>
        {logoLeft ? <img src={logoLeft} style={{ width: `${logoSize}px` }} /> : <span className="text-[5pt]">لوگو</span>}
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-[8.5pt] font-bold m-0 leading-tight outline-none" contentEditable onBlur={(e) => onUpdateHeader('line1', e.currentTarget.innerText)} suppressContentEditableWarning>{data.line1}</h1>
        <h2 className="text-[8.5pt] font-bold m-0 leading-tight outline-none" contentEditable onBlur={(e) => onUpdateHeader('line2', e.currentTarget.innerText)} suppressContentEditableWarning>{data.line2}</h2>
        <h3 className="text-[8pt] font-bold m-0 leading-tight outline-none flex gap-1">
            <span contentEditable onBlur={(e) => onUpdateHeader('line3Prefix', e.currentTarget.innerText)} suppressContentEditableWarning>{data.line3Prefix}</span>
            <span contentEditable onBlur={(e) => onUpdateHeader('province', e.currentTarget.innerText)} suppressContentEditableWarning>{data.province}</span>
        </h3>
        <h4 className="text-[8pt] font-bold m-0 leading-tight outline-none" contentEditable onBlur={(e) => onUpdateHeader('schoolName', e.currentTarget.innerText)} suppressContentEditableWarning>{data.schoolName}</h4>
      </div>
      
      <div className="text-[9.5pt] font-black my-0.5 underline outline-none" contentEditable onBlur={(e) => onUpdateTitle(e.currentTarget.innerText)} suppressContentEditableWarning>{title}</div>

      <div className="grid grid-cols-4 gap-0.5 text-[7.5pt] font-bold border-t border-black pt-0.5">
        <div className="text-right"><span>{data.classNameLabel}</span><span className="outline-none" contentEditable onBlur={(e) => onUpdateHeader('className', e.currentTarget.innerText)} suppressContentEditableWarning>{data.className}</span></div>
        <div className="text-right"><span>{data.yearLabel}</span><span className="outline-none" contentEditable onBlur={(e) => onUpdateHeader('year', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(data.year)}</span></div>
        <div className="text-right"><span>{data.subjectLabel}</span><span className="outline-none" contentEditable onBlur={(e) => onUpdateHeader('subject', e.currentTarget.innerText)} suppressContentEditableWarning>{data.subject}</span></div>
        <div className="text-right"><span>{data.examinerLabel}</span><span className="outline-none" contentEditable onBlur={(e) => onUpdateHeader('examiner', e.currentTarget.innerText)} suppressContentEditableWarning>{data.examiner}</span></div>
      </div>
    </header>
  );
};

export default Header;
