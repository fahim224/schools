
export interface StudentGrades {
  midTerm: number;
  annual: number;
  final: number;
}

export interface StudentRecord {
  id: number;
  name: string;
  lastName: string;
  fatherName: string;
  grandFatherName: string;
  tazkiraNo: string;
  birthYearSolar: string;
  birthYearGregorian: string;
  address: string;
  subjects: { [key: string]: StudentGrades };
  attendance: {
    present: number;
    absent: number;
    sick: number;
    leave: number;
  };
  resultStatus: string;
  gradeAverage: number;
  totalMarks: number;
}

export interface ReportConfig {
  province: string;
  district: string;
  schoolName: string;
  academicYear: string;
  className: string;
  supervisor: string;
  pageNo: string;
}
