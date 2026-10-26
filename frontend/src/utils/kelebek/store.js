// frontend/src/utils/kelebek/store.js

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
  getExamInfo: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.EXAM_INFO)) || {}; } catch { return {}; }
  },
  setExamInfo: (data) => safeSetItem(KEYS.EXAM_INFO, data || {}),

  getStudents: () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.STUDENTS));
      return Array.isArray(saved) && saved.length > 0 ? saved : [];
    } catch { return []; }
  },
  setStudents: (data) => safeSetItem(KEYS.STUDENTS, Array.isArray(data) ? data : []),

  getRooms: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.ROOMS)) || []; } catch { return []; }
  },
  setRooms: (data) => safeSetItem(KEYS.ROOMS, Array.isArray(data) ? data : []),

  getPlan: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.PLAN)) || null; } catch { return null; }
  },
  setPlan: (data) => safeSetItem(KEYS.PLAN, data || null),

  getActiveGrades: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.ACTIVE_GRADES)) || ['9', '10', '11', '12']; } catch { return ['9', '10', '11', '12']; }
  },
  setActiveGrades: (data) => safeSetItem(KEYS.ACTIVE_GRADES, Array.isArray(data) ? data : ['9', '10', '11', '12']),

  getSeparatePairs: () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.SEPARATE_PAIRS));
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  },
  setSeparatePairs: (data) => safeSetItem(KEYS.SEPARATE_PAIRS, Array.isArray(data) ? data : []),

  clearPlan: () => {
    try {
      localStorage.removeItem(KEYS.PLAN);
      notifyKelebekChange(KEYS.PLAN);
    } catch {
      // ignore
    }
  },

  // 🛡️ BULUT SENKRONİZASYONU VE MULTI-TENANT İZOLASYON METOTLARI
  exportSnapshot: () => ({
    examInfo: store.getExamInfo(),
    students: store.getStudents(),
    rooms: store.getRooms(),
    plan: store.getPlan(),
    activeGrades: store.getActiveGrades(),
    separatePairs: store.getSeparatePairs(),
  }),

  importSnapshot: (snapshot = {}) => {
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
