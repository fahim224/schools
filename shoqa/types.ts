
export enum SheetType {
  MAZMOON = 'MAZMOON',
  ZAWABIT = 'ZAWABIT'
}

export interface StudentRecord {
  id: number | string;
  basisNumber: string | number;
  name: string;
  fatherName: string;
  grandfatherName: string;
  scores?: {
    written: number | string;
    oral: number | string;
    activity: number | string;
    homework: number | string;
    total: number | string;
    remarks: string;
  };
  attendance?: {
    absent: number | string;
    sick: number | string;
    leave: number | string;
    present: number | string;
  };
}

export interface HeaderData {
  line1: string;
  line2: string;
  line3Prefix: string;
  province: string;
  schoolName: string;
  classNameLabel: string;
  className: string;
  yearLabel: string;
  year: string;
  subjectLabel: string;
  subject: string;
  examinerLabel: string;
  examiner: string;
}

export interface TableLabels {
  no: string;
  identityGroup: string;
  name: string;
  father: string;
  grandfather: string;
  basis: string;
  scoresGroup: string;
  written: string;
  oral: string;
  activity: string;
  homework: string;
  total: string;
  attendanceGroup: string;
  present: string;
  absent: string;
  leave: string;
  sick: string;
  remarks: string;
}
