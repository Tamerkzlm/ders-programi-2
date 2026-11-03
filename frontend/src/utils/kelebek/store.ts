// frontend/src/utils/kelebek/store.ts
import type {
  KelebekExamInfo,
  KelebekStudent,
  KelebekRoom,
  KelebekPlan,
  SeparatePair,
  KelebekSnapshot,
} from '../../types';

const KEYS = {
  EXAM_INFO: 'kelebek_exam_info',
  STUDENTS: 'kelebek_students',
  ROOMS: 'kelebek_rooms',
  PLAN: 'kelebek_plan',
  ACTIVE_GRADES: 'kelebek_active_grades',
  SEPARATE_PAIRS: 'kelebek_separate_pairs',
};

// 🛡️ Bulut senkronizasyonu sırasında sonsuz döngüyü önleyen kilit
let isInternalHydration = false;

const notifyKelebekChange = (key) => {
  if (isInternalHydration || typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('kelebek-store-updated', { detail: { key, timestamp: Date.now() } }));
  } catch {
    // Eski tarayıcı fallback
  }
};

const safeSetItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyKelebekChange(key);
    return true;
  } catch (err) {
    console.error(`[KelebekStore] localStorage yazma hatası (${key}):`, err);
    return false;
  }
};

export const store = {
  getExamInfo: (): KelebekExamInfo => {
    try { return JSON.parse(localStorage.getItem(KEYS.EXAM_INFO) || 'null') || {}; } catch { return {}; }
  },
  setExamInfo: (data: KelebekExamInfo) => safeSetItem(KEYS.EXAM_INFO, data || {}),

  getStudents: (): KelebekStudent[] => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || 'null');
      return Array.isArray(saved) && saved.length > 0 ? saved : [];
    } catch { return []; }
  },
  setStudents: (data: KelebekStudent[]) => safeSetItem(KEYS.STUDENTS, Array.isArray(data) ? data : []),

  getRooms: (): KelebekRoom[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.ROOMS) || 'null') || []; } catch { return []; }
  },
  setRooms: (data: KelebekRoom[]) => safeSetItem(KEYS.ROOMS, Array.isArray(data) ? data : []),

  getPlan: (): KelebekPlan | null => {
    try { return JSON.parse(localStorage.getItem(KEYS.PLAN) || 'null') || null; } catch { return null; }
  },
  setPlan: (data: KelebekPlan | null) => safeSetItem(KEYS.PLAN, data || null),

  getActiveGrades: (): string[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.ACTIVE_GRADES) || 'null') || ['9', '10', '11', '12']; } catch { return ['9', '10', '11', '12']; }
  },
  setActiveGrades: (data: string[]) => safeSetItem(KEYS.ACTIVE_GRADES, Array.isArray(data) ? data : ['9', '10', '11', '12']),

  getSeparatePairs: (): SeparatePair[] => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.SEPARATE_PAIRS) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  },
  setSeparatePairs: (data: SeparatePair[]) => safeSetItem(KEYS.SEPARATE_PAIRS, Array.isArray(data) ? data : []),

  clearPlan: () => {
    try {
      localStorage.removeItem(KEYS.PLAN);
      notifyKelebekChange(KEYS.PLAN);
    } catch {
      // ignore
    }
  },

  // 🛡️ BULUT SENKRONİZASYONU VE MULTI-TENANT İZOLASYON METOTLARI
  exportSnapshot: (): KelebekSnapshot => ({
    examInfo: store.getExamInfo(),
    students: store.getStudents(),
    rooms: store.getRooms(),
    plan: store.getPlan(),
    activeGrades: store.getActiveGrades(),
    separatePairs: store.getSeparatePairs(),
  }),

  importSnapshot: (snapshot: Partial<KelebekSnapshot> = {}) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    isInternalHydration = true;
    try {
      localStorage.setItem(KEYS.EXAM_INFO, JSON.stringify(snapshot.examInfo || {}));
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(Array.isArray(snapshot.students) ? snapshot.students : []));
      localStorage.setItem(KEYS.ROOMS, JSON.stringify(Array.isArray(snapshot.rooms) ? snapshot.rooms : []));
      if (snapshot.plan) {
        localStorage.setItem(KEYS.PLAN, JSON.stringify(snapshot.plan));
      } else {
        localStorage.removeItem(KEYS.PLAN);
      }
      localStorage.setItem(KEYS.ACTIVE_GRADES, JSON.stringify(Array.isArray(snapshot.activeGrades) ? snapshot.activeGrades : ['9', '10', '11', '12']));
      localStorage.setItem(KEYS.SEPARATE_PAIRS, JSON.stringify(Array.isArray(snapshot.separatePairs) ? snapshot.separatePairs : []));
    } catch (err) {
      console.error('[KelebekStore] Snapshot geri yükleme hatası:', err);
    } finally {
      isInternalHydration = false;
    }
  },

  clearAll: () => {
    isInternalHydration = true;
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    } finally {
      isInternalHydration = false;
    }
  },
};
