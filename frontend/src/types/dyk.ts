// frontend/src/types/dyk.ts
// 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) MODÜLÜ VERİ TİPLERİ

export interface DykBlock {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface DykBlockTimeRange {
  startTime: string;
  endTime: string;
  isCustom?: boolean;
}

export type DykDayCustomTimes = Record<string, Record<string, DykBlockTimeRange>>;

export interface DykSettings {
  activeDays: string[];
  blocks: DykBlock[];
  dayCustomTimes?: DykDayCustomTimes;
  excludedTeacherIds?: string[];
  [key: string]: any;
}

export interface DykGroup {
  id: string;
  name: string;
  grade?: string;
  branch?: string;
  [key: string]: any;
}

export interface DykAssignment {
  id: string;
  groupId: string;
  teacherId: string;
  teacherName?: string;
  subject: string;
  blocksPerWeek: number;
  [key: string]: any;
}

export interface DykCell {
  subject: string;
  teacherId: string;
  teacherName?: string;
  assignmentId?: string;
  [key: string]: any;
}

// groupId -> day -> blockId -> DykCell
export type DykSchedule = Record<string, Record<string, Record<string, DykCell>>>;

export type DykTeacherAvailabilities = Record<string, string[]>;

export interface DykUnassignedActivity {
  id: string;
  assignmentId: string;
  groupId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  duration?: number;
}

export interface TeacherSchoolDayInfo {
  periods: number[];
  maxPeriod: number;
  hasLatePeriod: boolean;
  totalHours: number;
}

export type TeacherSchoolAnalysis = Record<string, Record<string, TeacherSchoolDayInfo>>;

export interface DykResult {
  success: boolean;
  unassigned: DykUnassignedActivity[];
  totalActivities: number;
  assignedCount: number;
  teacherSchoolAnalysis?: TeacherSchoolAnalysis;
  [key: string]: any;
}
