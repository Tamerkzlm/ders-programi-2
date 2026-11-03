// frontend/src/services/cloudSyncService.ts
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useAppStore, calculateLiveMetrics, calculateLiveViolations, calculateLiveRelaxedRules } from '../store/appStore';
import { store as kelebekStore } from '../utils/kelebek/store';
import type { CloudSyncState, PublishedMobilePayload, SupabaseUser } from '../types';

const ACTIVE_TENANT_KEY = 'okul_planlama_active_tenant_v1';
const PENDING_DIRTY_KEY = 'okul_planlama_pending_sync_v1';
const DEBOUNCE_MS = 2000;

// Kalıcı olarak buluta yedeklenecek Zustand alanları
const PERSISTED_APP_KEYS = [
  'demoDataChoice',
  'settings',
  'teachers',
  'classrooms',
  'timetable',
  'softPrefs',
  'hardPrefs',
  'pinnedSlots',
  'dykSettings',
  'dykGroups',
  'dykAssignments',
  'dykTeacherAvailabilities',
  'dykSchedule',
  'examSettings',
  'examSubjectsByGrade',
  'examSchedule',
  'examPlacements',
  'examSupervisors',
];

// Hızlı deterministik özet (Dirty-check için)
const computeQuickHash = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16) + '_' + str.length;
};

export const extractPersistedAppState = (state: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  for (const key of PERSISTED_APP_KEYS) {
    if (state[key] !== undefined) {
      clean[key] = state[key];
    }
  }
  return clean;
};

// 🛡️ Hassas verilerden arındırılmış mobil yayın paketi (İstemci tarafı ek savunma)
export const buildSanitizedMobilePayload = (appState: Record<string, any>): PublishedMobilePayload => {
  const settings = appState?.settings || {};
  const teachers = Array.isArray(appState?.teachers)
    ? appState.teachers.map((t) => ({
        id: t.id,
        name: t.name,
        branch: t.branch || '',
      }))
    : [];

  const classrooms = Array.isArray(appState?.classrooms)
    ? appState.classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        courses: Array.isArray(c.courses)
          ? c.courses.map((co) => ({
              subject: co.subject,
              teacherId: co.teacherId,
              hoursPerWeek: co.hoursPerWeek,
            }))
          : [],
      }))
    : [];

  return {
    schoolName: settings.schoolName || 'Okul Ders Programı',
    settings: {
      schoolName: settings.schoolName || 'Okul Ders Programı',
      days: settings.days || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'],
      periodsPerDay: Number(settings.periodsPerDay) || 8,
      lunchAfter: Number(settings.lunchAfter) || 4,
    },
    teachers,
    classrooms,
    timetable: appState?.timetable || {},
    dykSettings: appState?.dykSettings || {},
    dykGroups: appState?.dykGroups || [],
    dykSchedule: appState?.dykSchedule || null,
    examSettings: appState?.examSettings || {},
    examSchedule: appState?.examSchedule || null,
    examSupervisors: appState?.examSupervisors || null,
    updatedAt: new Date().toISOString(),
  };
};

// 🏪 Bulut Durumu Zustand Store'u (UI Bileşenleri İçin)
export const useCloudSyncStore = create<CloudSyncState>((set) => ({
  user: null,
  schoolRecord: null, // { id, school_name, share_code, version, updated_at }
  syncStatus: isSupabaseConfigured ? 'idle' : 'unconfigured', // 'unconfigured' | 'idle' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error'
  lastSyncedAt: null,
  errorMessage: null,
  isGuestMode: false,

  setCloudState: (patch) => set((prev) => ({ ...prev, ...patch })),
}));

// 🔒 Modül İçi Senkronizasyon Kilitleri (Mutex & Timers)
let isHydratingFromCloud = false;
let isSyncInFlight = false;
let queuedSyncAfterFlight = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedHash = '';
let listenersInitialized = false;

/**
 * 🛡️ Başka bir okul hesabından çıkış yapılıp yeni hesaba girildiğinde
 * eski okulun localStorage verilerini temizler (Cross-Tenant Isolation)
 */
const enforceTenantIsolation = (incomingUserId) => {
  try {
    const previousTenant = localStorage.getItem(ACTIVE_TENANT_KEY);
    if (previousTenant && previousTenant !== 'guest' && previousTenant !== incomingUserId) {
      isHydratingFromCloud = true;
      useAppStore.getState().clearDataForManualEntry();
      kelebekStore.clearAll();
      localStorage.removeItem('school_snapshot_hz_ayse');
      localStorage.removeItem('school_snapshot_abdi_ipekci');
      localStorage.removeItem('school_snapshot_diger');
      localStorage.removeItem(PENDING_DIRTY_KEY);
      lastSyncedHash = '';
      isHydratingFromCloud = false;
    }
    localStorage.setItem(ACTIVE_TENANT_KEY, incomingUserId);
  } catch (e) {
    console.warn('[CloudSync] Tenant izolasyon kontrolü uyarısı:', e);
    isHydratingFromCloud = false;
  }
};

/**
 * Buluttan gelen veriyi Zustand ve Kelebek store'larına güvenli şekilde yükler
 */
const hydrateLocalStoresFromCloud = (cloudRow) => {
  if (!cloudRow) return;
  isHydratingFromCloud = true;
  try {
    const remoteApp = cloudRow.app_state;
    if (remoteApp && typeof remoteApp === 'object' && Object.keys(remoteApp).length > 0) {
      const teachers = Array.isArray(remoteApp.teachers) ? remoteApp.teachers : [];
      const classrooms = Array.isArray(remoteApp.classrooms) ? remoteApp.classrooms : [];
      const timetable = remoteApp.timetable && typeof remoteApp.timetable === 'object' ? remoteApp.timetable : {};
      const settings = remoteApp.settings || useAppStore.getState().settings;
      const hardPrefs = remoteApp.hardPrefs || useAppStore.getState().hardPrefs;

      const liveMetrics = calculateLiveMetrics(timetable, teachers, classrooms, settings);
      const liveViolations = calculateLiveViolations(timetable, teachers, classrooms, settings, hardPrefs);
      const liveRelaxed = calculateLiveRelaxedRules(timetable, teachers, classrooms, settings, hardPrefs);

      useAppStore.setState({
        ...remoteApp,
        generateResult: Object.keys(timetable).length > 0
          ? {
              success: true,
              unassignedCount: liveMetrics.unassigned,
              warnings: liveViolations,
              metrics: {
                ...liveMetrics,
                relaxedRules: liveRelaxed,
                relaxedRulesCount: liveRelaxed.length,
                violations: liveViolations,
              },
            }
          : null,
      });
    }

    if (cloudRow.kelebek_state && typeof cloudRow.kelebek_state === 'object') {
      kelebekStore.importSnapshot(cloudRow.kelebek_state);
    }

    const currentApp = extractPersistedAppState(useAppStore.getState());
    const currentKelebek = kelebekStore.exportSnapshot();
    lastSyncedHash = computeQuickHash(JSON.stringify({ a: currentApp, k: currentKelebek }));
    localStorage.removeItem(PENDING_DIRTY_KEY);
  } catch (err) {
    console.error('[CloudSync] Yerel store hydration hatası:', err);
  } finally {
    isHydratingFromCloud = false;
  }
};

/**
 * ☁️ Şimdi Buluta Kaydet (Atomik & Kuyruk Korumalı)
 */
export const flushCloudSyncNow = async (force = false) => {
  if (!isSupabaseConfigured || !supabase) return { ok: false, reason: 'unconfigured' };
  if (isHydratingFromCloud) return { ok: false, reason: 'hydrating' };

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  const { user, schoolRecord } = useCloudSyncStore.getState();
  if (!user?.id) return { ok: false, reason: 'unauthenticated' };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    try { localStorage.setItem(PENDING_DIRTY_KEY, '1'); } catch { /* ignore */ }
    useCloudSyncStore.getState().setCloudState({
      syncStatus: 'offline',
      errorMessage: 'İnternet bağlantısı yok. Değişiklikler yerel olarak korundu, bağlantı gelince eşitlenecek.',
    });
    return { ok: false, reason: 'offline' };
  }

  // Halihazırda bir ağ isteği sürüyorsa kuyruğa al (Race Condition Önleme)
  if (isSyncInFlight) {
    queuedSyncAfterFlight = true;
    return { ok: true, reason: 'queued' };
  }

  const appState = extractPersistedAppState(useAppStore.getState());
  const kelebekState = kelebekStore.exportSnapshot();
  const combinedSerialized = JSON.stringify({ a: appState, k: kelebekState });
  const currentHash = computeQuickHash(combinedSerialized);

  if (!force && currentHash === lastSyncedHash && !localStorage.getItem(PENDING_DIRTY_KEY)) {
    useCloudSyncStore.getState().setCloudState({ syncStatus: 'synced', errorMessage: null });
    return { ok: true, reason: 'unchanged' };
  }

  isSyncInFlight = true;
  useCloudSyncStore.getState().setCloudState({ syncStatus: 'syncing', errorMessage: null });

  try {
    const schoolName = (appState.settings?.schoolName || schoolRecord?.school_name || 'Okul Ders Programı').trim();
    const publishedMobile = buildSanitizedMobilePayload(appState);

    const payload = {
      owner_id: user.id,
      school_name: schoolName,
      app_state: appState,
      kelebek_state: kelebekState,
      published_mobile: publishedMobile,
    };

    const { data, error } = await supabase
      .from('schools')
      .upsert(payload, { onConflict: 'owner_id' })
      .select('id, school_name, share_code, version, updated_at')
      .single();

    if (error) throw error;

    lastSyncedHash = currentHash;
    try { localStorage.removeItem(PENDING_DIRTY_KEY); } catch { /* ignore */ }

    useCloudSyncStore.getState().setCloudState({
      schoolRecord: data,
      syncStatus: 'synced',
      lastSyncedAt: data?.updated_at || new Date().toISOString(),
      errorMessage: null,
    });

    return { ok: true, data };
  } catch (err) {
    console.error('[CloudSync] Buluta yazma hatası:', err);
    try { localStorage.setItem(PENDING_DIRTY_KEY, '1'); } catch { /* ignore */ }
    useCloudSyncStore.getState().setCloudState({
      syncStatus: 'error',
      errorMessage: err?.message || 'Bulut senkronizasyonu sırasında hata oluştu.',
    });
    return { ok: false, error: err };
  } finally {
    isSyncInFlight = false;
    if (queuedSyncAfterFlight) {
      queuedSyncAfterFlight = false;
      scheduleDebouncedSync();
    }
  }
};

/**
 * ⏱️ 2 Saniye Gecikmeli (Debounced) Otomatik Kayıt Planlayıcı
 */
export const scheduleDebouncedSync = () => {
  if (!isSupabaseConfigured || isHydratingFromCloud) return;
  const { user } = useCloudSyncStore.getState();
  if (!user?.id) return;

  try { localStorage.setItem(PENDING_DIRTY_KEY, '1'); } catch { /* ignore */ }

  if (debounceTimer) clearTimeout(debounceTimer);
  useCloudSyncStore.getState().setCloudState({ syncStatus: 'syncing' });

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushCloudSyncNow(false);
  }, DEBOUNCE_MS);
};

/**
 * 🚀 Kullanıcı Giriş Yaptığında Okul Verisini Çek veya İlk Kaydı Oluştur
 */
export const initializeUserCloudSession = async (sessionUser: SupabaseUser, customSchoolName: string | null = null) => {
  if (!isSupabaseConfigured || !supabase || !sessionUser?.id) return;

  const previousTenant = localStorage.getItem(ACTIVE_TENANT_KEY);
  const wasGuestBefore = !previousTenant || previousTenant === 'guest';

  // 1. Önce başka bir kullanıcının yerel verisi kalmışsa temizle
  enforceTenantIsolation(sessionUser.id);

  useCloudSyncStore.getState().setCloudState({
    user: sessionUser,
    isGuestMode: false,
    syncStatus: 'loading',
    errorMessage: null,
  });

  try {
    const { data: existingRow, error: fetchError } = await supabase
      .from('schools')
      .select('id, school_name, share_code, app_state, kelebek_state, version, updated_at')
      .eq('owner_id', sessionUser.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const hasRemoteData =
      existingRow &&
      existingRow.app_state &&
      typeof existingRow.app_state === 'object' &&
      Object.keys(existingRow.app_state).length > 0;

    if (hasRemoteData) {
      const hasPendingLocalDirty = previousTenant === sessionUser.id && localStorage.getItem(PENDING_DIRTY_KEY) === '1';

      if (hasPendingLocalDirty) {
        useCloudSyncStore.getState().setCloudState({
          schoolRecord: {
            id: existingRow.id,
            school_name: existingRow.school_name,
            share_code: existingRow.share_code,
            version: existingRow.version,
            updated_at: existingRow.updated_at,
          },
        });
        await flushCloudSyncNow(true);
      } else {
        hydrateLocalStoresFromCloud(existingRow);
        useCloudSyncStore.getState().setCloudState({
          schoolRecord: {
            id: existingRow.id,
            school_name: existingRow.school_name,
            share_code: existingRow.share_code,
            version: existingRow.version,
            updated_at: existingRow.updated_at,
          },
          syncStatus: 'synced',
          lastSyncedAt: existingRow.updated_at,
          errorMessage: null,
        });
      }
    } else {
      if (!wasGuestBefore) {
        isHydratingFromCloud = true;
        useAppStore.getState().clearDataForManualEntry();
        kelebekStore.clearAll();
        isHydratingFromCloud = false;
      }

      const targetSchoolName =
        customSchoolName ||
        sessionUser.user_metadata?.school_name ||
        useAppStore.getState().settings?.schoolName ||
        'Yeni Okul Ders Programı';

      isHydratingFromCloud = true;
      useAppStore.getState().updateSettings({ schoolName: targetSchoolName });
      isHydratingFromCloud = false;

      await flushCloudSyncNow(true);
    }
  } catch (err) {
    console.error('[CloudSync] Oturum başlatma hatası:', err);
    useCloudSyncStore.getState().setCloudState({
      syncStatus: 'error',
      errorMessage: err?.message || 'Bulut verisi yüklenemedi, yerel modda devam ediliyor.',
    });
  }
};

/**
 * 🚪 Güvenli Çıkış (Cross-Tenant Veri Sızıntısını Önlemek İçin Yerel Önbelleği Temizler)
 */
export const signOutAndPurgeLocal = async (purgeLocalData = true) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (localStorage.getItem(PENDING_DIRTY_KEY) === '1') {
    await flushCloudSyncNow(true).catch(() => {});
  }

  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }

  if (purgeLocalData) {
    isHydratingFromCloud = true;
    try {
      useAppStore.getState().clearDataForManualEntry();
      useAppStore.getState().resetDemoPrompt();
      kelebekStore.clearAll();
      localStorage.removeItem('school_snapshot_hz_ayse');
      localStorage.removeItem('school_snapshot_abdi_ipekci');
      localStorage.removeItem('school_snapshot_diger');
      localStorage.removeItem(PENDING_DIRTY_KEY);
    } finally {
      isHydratingFromCloud = false;
    }
  }

  try { localStorage.setItem(ACTIVE_TENANT_KEY, 'guest'); } catch { /* ignore */ }
  lastSyncedHash = '';

  useCloudSyncStore.getState().setCloudState({
    user: null,
    schoolRecord: null,
    syncStatus: isSupabaseConfigured ? 'idle' : 'unconfigured',
    lastSyncedAt: null,
    errorMessage: null,
    isGuestMode: true,
  });
};

/**
 * 🎧 Global Dinleyicileri Başlat (App.jsx içinde 1 kez çağrılır)
 */
export const initCloudSyncListeners = () => {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  if (!isSupabaseConfigured || !supabase) return;

  // 1. Mevcut oturumu kontrol et
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      initializeUserCloudSession(session.user);
    }
  });

  // 2. Auth durum değişimlerini dinle
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const currentUid = useCloudSyncStore.getState().user?.id;
      if (currentUid !== session.user.id) {
        initializeUserCloudSession(session.user);
      }
    } else if (event === 'SIGNED_OUT') {
      useCloudSyncStore.getState().setCloudState({
        user: null,
        schoolRecord: null,
        syncStatus: 'idle',
      });
    }
  });

  // 3. Zustand Store değişimlerini dinle (2 sn Debounced)
  useAppStore.subscribe(() => {
    if (isHydratingFromCloud) return;
    scheduleDebouncedSync();
  });

  // 4. Kelebek Store değişimlerini dinle
  window.addEventListener('kelebek-store-updated', () => {
    if (isHydratingFromCloud) return;
    scheduleDebouncedSync();
  });

  // 5. Çevrimdışı -> Çevrimiçi geçişinde bekleyen veriyi anında eşitle
  window.addEventListener('online', () => {
    const { user } = useCloudSyncStore.getState();
    if (user?.id) {
      flushCloudSyncNow(true);
    }
  });

  window.addEventListener('offline', () => {
    const { user } = useCloudSyncStore.getState();
    if (user?.id) {
      useCloudSyncStore.getState().setCloudState({
        syncStatus: 'offline',
        errorMessage: 'Çevrimdışı moddasınız. Değişiklikler tarayıcıya kaydediliyor.',
      });
    }
  });

  // 6. Sekme arka plana atıldığında bekleyen debounce varsa hemen kaydet
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && debounceTimer) {
      flushCloudSyncNow(false);
    }
  });
};
