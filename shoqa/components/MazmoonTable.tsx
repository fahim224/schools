
import React from 'react';
import { StudentRecord, TableLabels } from '../types';
import { toPersianDigits } from '../utils';

interface Props {
  students: StudentRecord[];
  labels: TableLabels;
  showBasisNumber: boolean;
  onUpdateStudent: (id: number | string, field: string, value: string) => void;
  onUpdateScore: (id: number | string, field: string, value: string) => void;
  onUpdateLabel: (field: keyof TableLabels, value: string) => void;
}

const MazmoonTable: React.FC<Props> = ({ students, labels, showBasisNumber, onUpdateStudent, onUpdateScore, onUpdateLabel }) => {
  const identityColSpan = showBasisNumber ? 4 : 3;

  return (
    <table className="flex-grow">
      <thead>
        <tr className="bg-gray-50">
          <th rowSpan={2} className="w-[20px] rotated-text">#</th>
          <th colSpan={identityColSpan} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('identityGroup', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.identityGroup}</th>
          <th colSpan={5} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('scoresGroup', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.scoresGroup}</th>
          <th rowSpan={2} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('remarks', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.remarks}</th>
        </tr>
        <tr className="bg-gray-50">
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('name', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.name}</th>
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('father', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.father}</th>
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('grandfather', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.grandfather}</th>
          {showBasisNumber && <th className="identity-cell basis-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('basis', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.basis}</th>}
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('written', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.written}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('oral', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.oral}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('activity', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.activity}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('homework', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.homework}</th>
          <th className="rotated-text font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('total', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.total}</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, idx) => {
          const totalNum = student.scores?.written !== "" ? 
            (Number(student.scores?.written || 0) + 
             Number(student.scores?.oral || 0) + 
             Number(student.scores?.activity || 0) + 
             Number(student.scores?.homework || 0)) : "";
          
          return (
            <tr key={student.id}>
              <td className="font-bold">{toPersianDigits(idx + 1)}</td>
              <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'name', e.currentTarget.innerText)} suppressContentEditableWarning>{student.name}</td>
              <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'fatherName', e.currentTarget.innerText)} suppressContentEditableWarning>{student.fatherName}</td>
              <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'grandfatherName', e.currentTarget.innerText)} suppressContentEditableWarning>{student.grandfatherName}</td>
              {showBasisNumber && <td className="identity-cell basis-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'basisNumber', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.basisNumber)}</td>}
              <td className="outline-none" contentEditable onBlur={(e) => onUpdateScore(student.id, 'written', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.scores?.written)}</td>
              <td className="outline-none" contentEditable onBlur={(e) => onUpdateScore(student.id, 'oral', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.scores?.oral)}</td>
              <td className="outline-none" contentEditable onBlur={(e) => onUpdateScore(student.id, 'activity', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.scores?.activity)}</td>
              <td className="outline-none" contentEditable onBlur={(e) => onUpdateScore(student.id, 'homework', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.scores?.homework)}</td>
              <td className="font-bold">{toPersianDigits(totalNum)}</td>
              <td className="outline-none" contentEditable suppressContentEditableWarning>{student.scores?.remarks}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default MazmoonTable;
