
import React from 'react';
import { StudentRecord, TableLabels } from '../types';
import { toPersianDigits } from '../utils';

interface Props {
  students: StudentRecord[];
  labels: TableLabels;
  showBasisNumber: boolean;
  onUpdateStudent: (id: number | string, field: string, value: string) => void;
  onUpdateAttendance: (id: number | string, field: string, value: string) => void;
  onUpdateLabel: (field: keyof TableLabels, value: string) => void;
}

const ZawabitTable: React.FC<Props> = ({ students, labels, showBasisNumber, onUpdateStudent, onUpdateAttendance, onUpdateLabel }) => {
  const identityColSpan = showBasisNumber ? 4 : 3;

  return (
    <table className="flex-grow">
      <thead>
        <tr className="bg-gray-50">
          <th rowSpan={2} className="w-[20px] rotated-text">#</th>
          <th colSpan={identityColSpan} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('identityGroup', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.identityGroup}</th>
          <th colSpan={4} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('attendanceGroup', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.attendanceGroup}</th>
          <th rowSpan={2} className="font-bold outline-none" contentEditable onBlur={(e) => onUpdateLabel('remarks', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.remarks}</th>
        </tr>
        <tr className="bg-gray-50">
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('name', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.name}</th>
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('father', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.father}</th>
          <th className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('grandfather', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.grandfather}</th>
          {showBasisNumber && <th className="identity-cell basis-cell outline-none" contentEditable onBlur={(e) => onUpdateLabel('basis', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.basis}</th>}
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('present', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.present}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('absent', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.absent}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('leave', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.leave}</th>
          <th className="rotated-text outline-none" contentEditable onBlur={(e) => onUpdateLabel('sick', e.currentTarget.innerText)} suppressContentEditableWarning>{labels.sick}</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, idx) => (
          <tr key={student.id} className="zawabit-row">
            <td className="font-bold">{toPersianDigits(idx + 1)}</td>
            <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'name', e.currentTarget.innerText)} suppressContentEditableWarning>{student.name}</td>
            <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'fatherName', e.currentTarget.innerText)} suppressContentEditableWarning>{student.fatherName}</td>
            <td className="identity-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'grandfatherName', e.currentTarget.innerText)} suppressContentEditableWarning>{student.grandfatherName}</td>
            {showBasisNumber && <td className="identity-cell basis-cell outline-none" contentEditable onBlur={(e) => onUpdateStudent(student.id, 'basisNumber', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.basisNumber)}</td>}
            <td className="outline-none" contentEditable onBlur={(e) => onUpdateAttendance(student.id, 'present', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.attendance?.present)}</td>
            <td className="outline-none" contentEditable onBlur={(e) => onUpdateAttendance(student.id, 'absent', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.attendance?.absent)}</td>
            <td className="outline-none" contentEditable onBlur={(e) => onUpdateAttendance(student.id, 'leave', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.attendance?.leave)}</td>
            <td className="outline-none" contentEditable onBlur={(e) => onUpdateAttendance(student.id, 'sick', e.currentTarget.innerText)} suppressContentEditableWarning>{toPersianDigits(student.attendance?.sick)}</td>
            <td className="outline-none" contentEditable suppressContentEditableWarning></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ZawabitTable;
