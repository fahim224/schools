
import { StudentRecord } from './types';

export const SUBJECTS = [
  { id: 'tafsir', name: 'تفسیر شریف' },
  { id: 'hadith', name: 'حدیث' },
  { id: 'fiqh', name: 'فقه' },
  { id: 'usool_fiqh', name: 'اصول فقه' },
  { id: 'aqayed', name: 'عقاید' },
  { id: 'serat', name: 'سیرت' },
  { id: 'nahw', name: 'نحو' },
  { id: 'sarf', name: 'صرف' },
  { id: 'balaghat', name: 'بلاغت' },
  { id: 'mantiq', name: 'منطق' },
  { id: 'tarikh', name: 'تاریخ' },
  { id: 'geography', name: 'جغرافیه' },
  { id: 'physics', name: 'فیزیک' },
  { id: 'chemistry', name: 'کیمیا' },
  { id: 'biology', name: 'بیولوژی' },
  { id: 'math', name: 'ریاضی' },
  { id: 'english', name: 'انگلیسی' },
  { id: 'computer', name: 'کمپیوتر' },
  { id: 'pashto', name: 'پشتو' },
  { id: 'dari', name: 'دری' },
  { id: 'social', name: 'اجتماعیات' },
  { id: 'skills', name: 'سایر مهارت ها' }
];

export const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: 1,
    name: 'احمد',
    lastName: 'عابد',
    fatherName: 'حامد',
    grandFatherName: 'حمید',
    tazkiraNo: '1404-1100-4455',
    birthYearSolar: '1382',
    birthYearGregorian: '2003',
    address: 'کابل / مرکز / خوشحال خان',
    attendance: { present: 170, absent: 11, sick: 2, leave: 1 },
    resultStatus: 'ارتقا به صنف بعدی',
    gradeAverage: 85.5,
    totalMarks: 2000,
    subjects: SUBJECTS.reduce((acc, sub) => ({
      ...acc,
      [sub.id]: { midTerm: 40, annual: 60, final: 100 }
    }), {})
  },
  {
      id: 2,
      name: '',
      lastName: '',
      fatherName: '',
      grandFatherName: '',
      tazkiraNo: '',
      birthYearSolar: '',
      birthYearGregorian: '',
      address: '',
      attendance: { present: 0, absent: 0, sick: 0, leave: 0 },
      resultStatus: '',
      gradeAverage: 0,
      totalMarks: 0,
      subjects: SUBJECTS.reduce((acc, sub) => ({
        ...acc,
        [sub.id]: { midTerm: 0, annual: 0, final: 0 }
      }), {})
    },
    {
      id: 3,
      name: '',
      lastName: '',
      fatherName: '',
      grandFatherName: '',
      tazkiraNo: '',
      birthYearSolar: '',
      birthYearGregorian: '',
      address: '',
      attendance: { present: 0, absent: 0, sick: 0, leave: 0 },
      resultStatus: '',
      gradeAverage: 0,
      totalMarks: 0,
      subjects: SUBJECTS.reduce((acc, sub) => ({
        ...acc,
        [sub.id]: { midTerm: 0, annual: 0, final: 0 }
      }), {})
    }
];
