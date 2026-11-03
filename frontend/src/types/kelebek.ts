// frontend/src/types/kelebek.ts
// 🦋 KELEBEK SİSTEMİ (KARMA SALON SINAV DAĞITIMI) VERİ TİPLERİ

export interface KelebekExamInfo {
  okulAdi?: string;
  mudurAdi?: string;
  egitimYili?: string;
  donem?: string;
  sinavNo?: string;
  sinavDersi?: string;
  sinavTarihi?: string;
  sinavSaati?: string;
  dersSaati?: string;
  [key: string]: any;
}

export interface KelebekStudent {
  id: string;
  no: string;
  adSoyad: string;
  sinif: string;
  grade: string;
  isExempt?: boolean;
  koltuk?: string;
  [key: string]: any;
}

export interface KelebekRoom {
  id: string;
  name: string;
  rows: number;
  cols: number;
  [key: string]: any;
}

export interface SeparatePair {
  id?: string;
  student1Id: string;
  student2Id: string;
  student1Name?: string;
  student2Name?: string;
  reason?: string;
  [key: string]: any;
}

export interface KelebekViolation {
  row: number;
  col: number;
  type: 'same-branch' | 'same-grade' | 'separate-partner' | string;
  reason: string;
}

export interface KelebekRoomAssignment {
  room: KelebekRoom;
  grid: (KelebekStudent | null)[][];
  violations: KelebekViolation[];
}

export interface StudentSeatPosition {
  student: KelebekStudent;
  roomId: string;
  roomName: string;
  roomIndex: number;
  row: number;
  col: number;
  koltuk: string;
}

export interface SeparationResult extends SeparatePair {
  status: 'not_both_active' | 'different_rooms' | 'same_bench' | 'same_room_apart' | string;
  isDifferentRooms?: boolean;
  isAdjacent?: boolean;
  distance?: number;
  pos1?: StudentSeatPosition;
  pos2?: StudentSeatPosition;
  message: string;
}

export interface KelebekPlan {
  assignments: KelebekRoomAssignment[];
  violations: number;
  timestamp: string;
  activeGrades: string[];
  separationResults?: SeparationResult[];
  rooms?: any[];
  placements?: any[];
}

export interface KelebekSnapshot {
  examInfo: KelebekExamInfo;
  students: KelebekStudent[];
  rooms: KelebekRoom[];
  plan: KelebekPlan | null;
  activeGrades: string[];
  separatePairs: SeparatePair[];
}
