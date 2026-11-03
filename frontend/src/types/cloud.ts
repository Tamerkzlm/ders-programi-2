// frontend/src/types/cloud.ts
// ☁️ BULUT SENKRONİZASYONU VE SUPABASE VERİ TİPLERİ

import type { Settings, Teacher, Classroom, Timetable } from './models';
import type { DykSettings, DykGroup, DykSchedule } from './dyk';
import type { ExamSettings, ExamSchedule, ExamSupervisorsMap } from './exam';

export type SyncStatus =
  | 'unconfigured'
  | 'idle'
  | 'loading'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error';

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    school_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user: SupabaseUser;
  [key: string]: any;
}

export interface SchoolRecord {
  id?: string;
  school_name?: string;
  share_code?: string;
  version?: number;
  updated_at?: string;
  [key: string]: any;
}

export interface PublishedMobilePayload {
  schoolName: string;
  settings: Partial<Settings>;
  teachers: Array<Pick<Teacher, 'id' | 'name' | 'branch'>>;
  classrooms: Array<{
    id: string;
    name: string;
    courses: Array<{
      subject: string;
      teacherId: string;
      hoursPerWeek: number;
    }>;
  }>;
  timetable: Timetable;
  dykSettings: Partial<DykSettings>;
  dykGroups: DykGroup[];
  dykSchedule: DykSchedule | null;
  examSettings: Partial<ExamSettings>;
  examSchedule: ExamSchedule | null;
  examSupervisors: ExamSupervisorsMap | null;
  updatedAt: string;
}

export interface CloudSyncState {
  user: SupabaseUser | null;
  schoolRecord: SchoolRecord | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  isGuestMode: boolean;
  setCloudState: (patch: Partial<Omit<CloudSyncState, 'setCloudState'>>) => void;
}
