// frontend/src/types/exam.ts
// 🎓 OKUL ORTAK SINAV TAKVİMİ VE GÖZETMENLİK VERİ TİPLERİ

export interface ExamDayInfo {
  date: string;
  dayName: string;
  formatted: string;
}

export interface ExamSettings {
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  examSlots: number[];
  grades: string[];
  schoolYear?: string;
  semester?: string;
  examNo?: string;
  [key: string]: any;
}

export interface ExamSubject {
  id: string;
  name: string;
  code?: string;
  isMajor?: boolean;
  isMebExam?: boolean;
  mebDate?: string | null;
  mebSlot?: number | null;
  slot?: number;
  placementId?: string;
  [key: string]: any;
}

export type ExamSubjectsByGrade = Record<string, ExamSubject[]>;

export interface ExamPlacement {
  id: string;
  courseId?: string;
  name: string;
  code?: string;
  isMajor: boolean;
  isMebExam?: boolean;
  mebDate?: string | null;
  mebSlot?: number | null;
  levels: string[];
  levelIds?: string[];
  date: string;
  slot: number;
}

// grade -> date -> slot -> ExamSubject
export type ExamSchedule = Record<string, Record<string, Record<number, ExamSubject>>>;

export interface UnassignedExamItem {
  grade: string;
  subject: {
    id: string;
    name: string;
    isMajor?: boolean;
  };
  reason: string;
}

export interface ExamResult {
  success: boolean;
  unassigned: UnassignedExamItem[];
  workingDays: ExamDayInfo[];
  examSlots: number[];
  firstSlot: number;
  totalSubjects: number;
  message?: string;
}

// date -> slot -> classroomId -> teacherId
export type ExamSupervisorsMap = Record<string, Record<number, Record<string, string>>>;

export interface TeacherDutyItem {
  date: string;
  dayName: string;
  slot: number;
  classroomId: string;
  classroomName: string;
  subjectName: string;
}

export interface ExamSupervisorStats {
  totalDuties: number;
  teacherCounts: Record<string, number>;
  minDuties?: number;
  maxDuties?: number;
  isFair?: boolean;
}

export interface ExamSupervisorResult {
  success: boolean;
  teacherDuties: Record<string, TeacherDutyItem[]>;
  stats: ExamSupervisorStats;
}
