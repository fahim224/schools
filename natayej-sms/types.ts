
export interface SubjectResult {
  name: string;
  midTerm: number | string;
  annual: number | string;
  final: number | string;
}

export interface StudentData {
  id: number;
  name: string;
  fatherName: string;
  idNo: string;
  tazkira: string;
  subjects: { [key: string]: { mid: number; ann: number } };
  attendance: { present: number; absent: number; sick: number; leave: number };
}
