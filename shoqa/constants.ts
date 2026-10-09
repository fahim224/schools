
import { StudentRecord, HeaderData, TableLabels } from './types';

export const MOCK_STUDENTS: StudentRecord[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  basisNumber: "", // پاکسازی نمبر اساس
  name: i === 0 ? "احمد بلال" : i === 1 ? "محمد سهراب" : i === 2 ? "فواد احمد" : "",
  fatherName: i === 0 ? "عبدالکریم" : i === 1 ? "گل محمد" : i === 2 ? "امان الله" : "",
  grandfatherName: i === 0 ? "غلام سخی" : i === 1 ? "نور محمد" : i === 2 ? "شیر علی" : "",
  scores: {
    written: "",
    oral: "",
    activity: "",
    homework: "",
    total: "",
    remarks: ""
  },
  attendance: {
    absent: "",
    sick: "",
    leave: "",
    present: ""
  }
}));

export const INITIAL_HEADER_DATA: HeaderData = {
  line1: "امارت اسلامی افغانستان",
  line2: "وزارت معارف",
  line3Prefix: "ریاست معارف ",
  province: "کابل",
  schoolName: "لیسه عالی استقلال",
  classNameLabel: "صنف: ",
  className: "دهم (الف)",
  yearLabel: "سال: ",
  year: "۱۴۰۳",
  subjectLabel: "مضمون: ",
  subject: "کیمیا",
  examinerLabel: "معلم: ",
  examiner: "استاد ذبیح الله"
};

export const INITIAL_TABLE_LABELS: TableLabels = {
  no: "شماره",
  identityGroup: "شهرت شاگرد",
  name: "اسم",
  father: "ولد",
  grandfather: "ولدیت",
  basis: "اساس",
  scoresGroup: "نمرات",
  written: "تحریری",
  oral: "تقریری",
  activity: "فعالیت",
  homework: "کارخانگی",
  total: "مجموع",
  attendanceGroup: "حاضری",
  present: "حاضر",
  absent: "غیرحاضر",
  leave: "رخصت",
  sick: "مریض",
  remarks: "ملاحظات"
};
