// frontend/src/types/models.ts
// 🏫 BACKEND (backend/models.py) & FRONTEND ORTAK VERİ MODELLERİ SÖZLEŞMESİ

export type DemoDataChoice = 'demo' | 'abdi' | 'manual' | null;

export interface Settings {
  schoolId?: string;
  schoolName?: string;
  directorName?: string;
  directorTitle?: string;
  principalName?: string;
  city?: string;
  district?: string;
  days: string[];
  periodsPerDay: number;
  lunchBreakAfter?: number | null;
  lunchAfter?: number;
  lunchDuration?: number;
  [key: string]: any;
}

export interface Course {
  id?: string;
  subject: string;
  code?: string;
  hoursPerWeek: number;
  teacherId: string;
  [key: string]: any;
}

export interface Classroom {
  id: string;
  name: string;
  grade?: number | string;
  courses: Course[];
  [key: string]: any;
}

export type FreeDayPreference = 'none' | 'floating_1_day' | 'floating_2_days' | string;
export type FreeHalfDayPreference = 'none' | 'any_morning' | 'any_afternoon' | string;

export interface FloatingConstraints {
  freeDayPreference?: FreeDayPreference;
  freeHalfDayPreference?: FreeHalfDayPreference;
  [key: string]: any;
}

export interface Teacher {
  id: string;
  name: string;
  branch: string;
  subjects?: string[];
  maxPerDay?: number;
  unavailable?: Record<string, number[]>;
  isExempt?: boolean;
  isPartTime?: boolean;
  priorityFullDay?: string | null;
  fillLateHours?: boolean;
  isAdministrator?: boolean;
  hasCustomConstraints?: boolean;
  customMaxHours?: number;
  customMinHours?: number;
  floatingConstraints?: FloatingConstraints;
  [key: string]: any;
}

export interface SoftConstraints {
  minimizeGaps: boolean;
  gapPenalty: number;
  earlyStart: boolean;
  earlyStartPenalty: number;
  avoidStemLate: boolean;
  stemLatePenalty: number;
  [key: string]: any;
}

export interface HardConstraints {
  enforceMaxGaps: boolean;
  maxGapsPerDay: number;
  enforceDailyBalance: boolean;
  minDailyHours: number;
  enforceConsecutiveClassRules: boolean;
  enforceIntensiveRules: boolean;
  maxHoursPerIntensiveCourse: number;
  solverTimeout: number;
  stopAtFirstSolution?: boolean;
  [key: string]: any;
}

export interface PinnedSlot {
  classId: string;
  day: string;
  period: number;
  subject: string;
  teacherId?: string | null;
  groupId?: string | null;
  [key: string]: any;
}

export interface TimetableSlot {
  period: number;
  subject: string;
  code?: string;
  teacherId: string;
  teacherName?: string;
  [key: string]: any;
}

// classId -> day -> TimetableSlot[]
export type Timetable = Record<string, Record<string, TimetableSlot[]>>;

export interface TeacherGapSummary {
  id: string;
  name: string;
  gaps: number;
}

export interface TeacherFreeDayFailure {
  id: string;
  name: string;
  load: number;
  activeDaysCount?: number;
  requested?: string;
  reason: string;
}

export interface RelaxedRule {
  teacherId: string;
  teacherName: string;
  classId: string | null;
  className: string | null;
  subject: string;
  day: string;
  ruleType: string;
  description: string;
}

export interface LiveMetrics {
  totalRequired: number;
  totalAssigned: number;
  unassigned: number;
  totalSchoolGaps: number;
  averageSchoolGaps: number;
  medianSchoolGaps: number;
  teachersAboveMedian: TeacherGapSummary[];
  teachersAboveAverage: TeacherGapSummary[];
  gapReport: Record<string, number>;
  fairnessScore?: number;
  fairnessLabel?: string;
  fairnessColor?: 'emerald' | 'blue' | 'amber' | 'red' | string;
  countWithoutFreeDay: number;
  teachersWithoutFreeDay: TeacherFreeDayFailure[];
  requestedFreeDayCount: number;
  countWithoutHalfDay: number;
  teachersWithoutHalfDay: TeacherFreeDayFailure[];
  requestedHalfDayCount: number;
  floatingDayRequested: number;
  floatingDayFailed: number;
  floatingDayFailedTeachers: TeacherFreeDayFailure[];
  floatingHalfRequested: number;
  floatingHalfFailed: number;
  floatingHalfFailedTeachers: TeacherFreeDayFailure[];
  violations?: string[];
  relaxedRules?: RelaxedRule[];
  relaxedRulesCount?: number;
  warnings?: string[];
  [key: string]: any;
}

export interface GenerateResult {
  success: boolean;
  message?: string;
  unassignedCount: number;
  warnings: string[];
  metrics?: LiveMetrics;
  [key: string]: any;
}

export interface SolveRequest {
  settings: Settings;
  teachers: Teacher[];
  classrooms: Classroom[];
  softConstraints?: SoftConstraints | null;
  hardConstraints?: HardConstraints | null;
  pinnedSlots?: PinnedSlot[];
}

export interface SolveResponse {
  status: 'ok' | 'error' | string;
  timetable?: Timetable;
  metrics?: LiveMetrics;
  detail?: string;
  message?: string;
  [key: string]: any;
}
