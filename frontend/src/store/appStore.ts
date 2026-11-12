// frontend/src/store/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { solveDykSchedule } from '../utils/dykEngine';
import { solveExamSchedule, solveSupervisors, DEFAULT_EXAM_SUBJECTS, buildScheduleFromPlacements } from '../utils/examEngine';
import { generateCourseCode } from '../utils/courseCodeHelper';
import { APP_VERSION } from '../config/version';
import {
  getTeacherClassIds,
  buildNeighborhoodPins,
  calculateTimetableDiff,
  type LocalRepairDiffResult
} from '../utils/localRepairEngine';
import type {
  DemoDataChoice,
  Settings,
  Teacher,
  Classroom,
  Timetable,
  TimetableSlot,
  SoftConstraints,
  HardConstraints,
  PinnedSlot,
  LiveMetrics,
  RelaxedRule,
  GenerateResult,
  DykSettings,
  DykGroup,
  DykAssignment,
  DykTeacherAvailabilities,
  DykSchedule,
  DykResult,
  ExamSettings,
  ExamSubject,
  ExamSubjectsByGrade,
  ExamPlacement,
  ExamSchedule,
  ExamResult,
  ExamSupervisorsMap,
  ExamSupervisorResult,
} from '../types';

// Backend adresi: Yerel 127.0.0.1:8000 motoru açıksa (Netlify üzerinden girilse bile) otomatik yerel tam güç CPU kullanılır,
// kapalıysa (telefon/tablet vb.) Render bulut API'sine düşer.
const LOCAL_SOLVER_URL = 'http://127.0.0.1:8000';
const CLOUD_SOLVER_URL = 'https://ders-programi-api.onrender.com';
const isLocalHost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);
const DEFAULT_API_URL = isLocalHost
  ? LOCAL_SOLVER_URL
  : (import.meta.env.PROD ? CLOUD_SOLVER_URL : LOCAL_SOLVER_URL);
let activeApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export const getActiveApiUrl = (): string => activeApiUrl;

export const resolveSolverApiUrl = async (): Promise<string> => {
  if (isLocalHost) {
    activeApiUrl = LOCAL_SOLVER_URL;
    return activeApiUrl;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${LOCAL_SOLVER_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      activeApiUrl = LOCAL_SOLVER_URL;
      return activeApiUrl;
    }
  } catch {
    // Yerel çözücü kapalı, bulut adresini kullan
  }
  activeApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
  return activeApiUrl;
};

// Silme sonrası bile çakışmayan benzersiz kimlik
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 🎯 SEED VE STATİK OKUL VERİLERİ (seedData.js üzerinden modüler içe aktarma)
import {
  DEFAULT_DYK_GROUPS,
  DEFAULT_DYK_ASSIGNMENTS,
  DEFAULT_DYK_AVAILABILITIES,
  REAL_TEACHERS,
  REAL_CLASSROOMS,
  enrichCoursesWithCodes
} from './seedData';

import {
  ABDI_SETTINGS,
  ABDI_TEACHERS,
  ABDI_CLASSROOMS,
  ABDI_TIMETABLE
} from './seedDataAbdi';


// 📊 CANLI METRİK VE PENCERE (BOŞLUK) HESAPLAMA MOTORU
// Manuel sürükle-bırak, silme veya taşıma işlemlerinde anında çalışarak dağıtım raporunu günceller.
export const calculateLiveMetrics = (
  timetable: Timetable,
  teachers: Teacher[] = [],
  classrooms: Classroom[] = [],
  settings: Partial<Settings> = {}
): LiveMetrics => {
  if (!timetable || Object.keys(timetable).length === 0) {
    return {
      totalRequired: 0,
      totalAssigned: 0,
      unassigned: 0,
      totalSchoolGaps: 0,
      averageSchoolGaps: 0,
      medianSchoolGaps: 0,
      teachersAboveMedian: [],
      teachersAboveAverage: [],
      gapReport: {},
      countWithoutFreeDay: 0,
      teachersWithoutFreeDay: [],
      requestedFreeDayCount: 0,
      countWithoutHalfDay: 0,
      teachersWithoutHalfDay: [],
      requestedHalfDayCount: 0,
      floatingDayRequested: 0,
      floatingDayFailed: 0,
      floatingDayFailedTeachers: [],
      floatingHalfRequested: 0,
      floatingHalfFailed: 0,
      floatingHalfFailedTeachers: [],
      violations: []
    };
  }

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

  // 1. Toplam gereken ve atanan ders saati
  let totalRequired = 0;
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      totalRequired += Number(co.hoursPerWeek) || 0;
    });
  });

  let totalAssigned = 0;
  const busy = {};
  (teachers || []).forEach(t => {
    busy[t.id] = {};
    days.forEach(d => {
      busy[t.id][d] = [];
    });
  });

  Object.keys(timetable).forEach(cId => {
    const classDays = timetable[cId] || {};
    days.forEach(d => {
      const slots = classDays[d] || [];
      slots.forEach(slot => {
        totalAssigned++;
        if (slot.teacherId && busy[slot.teacherId] && busy[slot.teacherId][d]) {
          const p = Number(slot.period);
          if (!busy[slot.teacherId][d].includes(p)) {
            busy[slot.teacherId][d].push(p);
          }
        }
      });
    });
  });

  const unassigned = Math.max(0, totalRequired - totalAssigned);

  // 2. Öğretmen haftalık ders yükleri
  const teacherLoads = {};
  (teachers || []).forEach(t => { teacherLoads[t.id] = 0; });
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      if (co.teacherId && teacherLoads[co.teacherId] !== undefined) {
        teacherLoads[co.teacherId] += Number(co.hoursPerWeek) || 0;
      }
    });
  });

  // 3. Boşluk (pencere) hesaplama
  const gapReport = {};
  let totalSchoolGaps = 0;

  (teachers || []).forEach(t => {
    let tGaps = 0;
    days.forEach(d => {
      const b = (busy[t.id]?.[d] || []).slice().sort((a, b) => a - b);
      if (b.length > 1) {
        const minP = b[0];
        const maxP = b[b.length - 1];
        const span = maxP - minP + 1;
        const g = span - b.length;
        if (g > 0) tGaps += g;
      }
    });
    gapReport[t.name] = tGaps;
    totalSchoolGaps += tGaps;
  });

  // 3.1 Boş Gün ve Yarım Gün Boşluk Analizi
  const numPeriods = Number(settings?.periodsPerDay) || 8;
  const lunchAfter = Number(settings?.lunchAfter) || Math.ceil(numPeriods / 2);

  const teachersWithoutFreeDay = [];
  const teachersWithoutHalfDay = [];
  const floatingDayFailedTeachers = [];
  const floatingHalfFailedTeachers = [];
  let floatingDayRequestedCount = 0;
  let floatingHalfRequestedCount = 0;
  let requestedFreeDayCount = 0;
  let requestedHalfDayCount = 0;

  (teachers || []).forEach(t => {
    const load = teacherLoads[t.id] || 0;
    if (load <= 0) return;

    const tBusy = busy[t.id] || {};
    const activeDays = days.filter(d => (tBusy[d] || []).length > 0);
    const freeDays = days.filter(d => (tBusy[d] || []).length === 0);

    // 1. BOŞ GÜN İSTEĞİ KONTROLÜ
    // Yalnızca:
    // - Kayan boş gün seçenler (floating_1_day veya floating_2_days)
    // - VEYA bir günün tüm saatlerini kapatarak sabit boş gün isteyenler
    // boş gün talep etmiş sayılır. İlk iki saatini vb. kapatanlar kendi tercihiyle 5 gün geliyorsa boş gün istemiş sayılmaz.
    const fDay = t.floatingConstraints?.freeDayPreference || 'none';
    const fixedFullClosedDays = days.filter(d => (t.unavailable?.[d] || []).length >= numPeriods);
    const requestedFreeDay = (fDay === 'floating_1_day' || fDay === 'floating_2_days') || fixedFullClosedDays.length > 0;

    if (requestedFreeDay) {
      requestedFreeDayCount++;
      let freeDayViolated = false;
      const reasonParts = [];
      const requestedLabels = [];

      if (fDay === 'floating_1_day') {
        floatingDayRequestedCount++;
        requestedLabels.push('1 Gün Boş (Esnek)');
        if (freeDays.length < 1) {
          freeDayViolated = true;
          const rMsg = `1 gün boş talep etti ancak haftanın ${activeDays.length} gününe ders yerleşti`;
          reasonParts.push(rMsg);
          floatingDayFailedTeachers.push({
            id: t.id,
            name: t.name,
            load,
            activeDaysCount: activeDays.length,
            reason: rMsg
          });
        }
      } else if (fDay === 'floating_2_days') {
        floatingDayRequestedCount++;
        requestedLabels.push('2 Gün Boş (Esnek)');
        if (freeDays.length < 2) {
          freeDayViolated = true;
          const rMsg = `2 gün boş talep etti ancak ${freeDays.length} gün boş kalabildi`;
          reasonParts.push(rMsg);
          floatingDayFailedTeachers.push({
            id: t.id,
            name: t.name,
            load,
            activeDaysCount: activeDays.length,
            reason: rMsg
          });
        }
      }

      fixedFullClosedDays.forEach(cd => {
        requestedLabels.push(`${cd} Kapalı`);
        if ((tBusy[cd] || []).length > 0) {
          freeDayViolated = true;
          reasonParts.push(`${cd} gününü tamamen kapattı ancak o güne ders yerleşti`);
        }
      });

      if (freeDayViolated) {
        teachersWithoutFreeDay.push({
          id: t.id,
          name: t.name,
          load,
          activeDaysCount: activeDays.length,
          requested: requestedLabels.join(', '),
          reason: reasonParts.join('; ')
        });
      }
    }

    // 2. YARIM GÜN BOŞLUK İSTEĞİ KONTROLÜ
    // Yalnızca:
    // - Kayan yarım gün seçenler (any_afternoon veya any_morning)
    // - VEYA bir günün sabahını (1..lunchAfter) ya da öğleden sonrasını (lunchAfter+1..numPeriods) tamamen kapatanlar
    // yarım gün talep etmiş sayılır.
    const fHalf = t.floatingConstraints?.freeHalfDayPreference || 'none';
    const fixedMornClosed = days.filter(d => {
      const un = t.unavailable?.[d] || [];
      return un.length < numPeriods && Array.from({ length: lunchAfter }, (_, i) => i + 1).every(p => un.includes(p));
    });
    const fixedAftClosed = days.filter(d => {
      const un = t.unavailable?.[d] || [];
      return un.length < numPeriods && Array.from({ length: numPeriods - lunchAfter }, (_, i) => i + 1 + lunchAfter).every(p => un.includes(p));
    });
    const requestedHalfDay = (fHalf === 'any_afternoon' || fHalf === 'any_morning') || fixedMornClosed.length > 0 || fixedAftClosed.length > 0;

    let hasFreeAfternoon = false;
    let hasFreeMorning = false;

    if (freeDays.length > 0) {
      hasFreeAfternoon = true;
      hasFreeMorning = true;
    } else {
      activeDays.forEach(d => {
        const slots = tBusy[d] || [];
        const hasMorn = slots.some(p => p <= lunchAfter);
        const hasAft = slots.some(p => p > lunchAfter);
        if (!hasAft && hasMorn) {
          hasFreeAfternoon = true;
        }
        if (!hasMorn && hasAft) {
          hasFreeMorning = true;
        }
      });
    }

    if (requestedHalfDay) {
      requestedHalfDayCount++;
      let halfDayViolated = false;
      const halfReasons = [];
      const halfLabels = [];

      if (fHalf === 'any_afternoon') {
        floatingHalfRequestedCount++;
        halfLabels.push('Öğleden Sonra Boş (Esnek)');
        if (!hasFreeAfternoon && freeDays.length === 0) {
          halfDayViolated = true;
          const hMsg = 'Öğleden sonra boşluk talep etti, her gün öğleden sonra dersi var';
          halfReasons.push(hMsg);
          floatingHalfFailedTeachers.push({
            id: t.id,
            name: t.name,
            load,
            reason: hMsg
          });
        }
      } else if (fHalf === 'any_morning') {
        floatingHalfRequestedCount++;
        halfLabels.push('Sabah Boş (Esnek)');
        if (!hasFreeMorning && freeDays.length === 0) {
          halfDayViolated = true;
          const hMsg = 'Sabah boşluk talep etti, her gün ilk saatlerde dersi var';
          halfReasons.push(hMsg);
          floatingHalfFailedTeachers.push({
            id: t.id,
            name: t.name,
            load,
            reason: hMsg
          });
        }
      }

      fixedMornClosed.forEach(md => {
        halfLabels.push(`${md} Sabah Kapalı`);
        if ((tBusy[md] || []).some(p => p <= lunchAfter)) {
          halfDayViolated = true;
          halfReasons.push(`${md} sabahını kapattı ancak sabah ders yerleşti`);
        }
      });

      fixedAftClosed.forEach(ad => {
        halfLabels.push(`${ad} Öğleden Sonra Kapalı`);
        if ((tBusy[ad] || []).some(p => p > lunchAfter)) {
          halfDayViolated = true;
          halfReasons.push(`${ad} öğleden sonrasını kapattı ancak öğleden sonra ders yerleşti`);
        }
      });

      if (halfDayViolated) {
        teachersWithoutHalfDay.push({
          id: t.id,
          name: t.name,
          load,
          requested: halfLabels.join(', '),
          reason: halfReasons.join('; ')
        });
      }
    }
  });

  // 4. Adalet Skalası: İdareciler, muaf/istisna olanlar ve ders yükü olmayanlar hariç tutulur
  const standardActiveTeachers = (teachers || []).filter(t => {
    const load = teacherLoads[t.id] || 0;
    const isExempt = t.isExempt === true || (load <= 8 && load > 0);
    const isPartTime = t.isPartTime || load <= 12;
    const isAdmin = t.isAdministrator === true;
    return !isExempt && !isPartTime && !isAdmin && load > 0;
  });

  const allGaps = standardActiveTeachers.map(t => gapReport[t.name] || 0).sort((a, b) => a - b);
  const standardCount = standardActiveTeachers.length;

  // Medyan Hesabı (İdareciler hariç veri grubu)
  let medianGaps = 0;
  if (standardCount > 0) {
    const mid = Math.floor(standardCount / 2);
    medianGaps = standardCount % 2 !== 0 
      ? allGaps[mid] 
      : Math.round(((allGaps[mid - 1] + allGaps[mid]) / 2) * 10) / 10;
  }

  const standardGaps = allGaps.reduce((acc, g) => acc + g, 0);
  const avg = standardCount > 0 ? Math.round((standardGaps / standardCount) * 100) / 100 : 0;

  // Okul medyanının üzerinde boşluğu olan öğretmenler (tıklanabilir yönlendirme için id ile birlikte)
  const teachersAboveMedian = standardActiveTeachers
    .filter(t => (gapReport[t.name] || 0) > medianGaps)
    .map(t => ({ id: t.id, name: t.name, gaps: gapReport[t.name] || 0 }))
    .sort((a, b) => b.gaps - a.gaps);

  // Geriye dönük uyumluluk için teachersAboveAverage
  const teachersAboveAverage = standardActiveTeachers
    .filter(t => (gapReport[t.name] || 0) >= 3 || (gapReport[t.name] || 0) > avg)
    .map(t => ({ id: t.id, name: t.name, gaps: gapReport[t.name] || 0 }))
    .sort((a, b) => b.gaps - a.gaps);

  // 5. Gelişmiş Öğretmenler Odası Adalet Skoru (Medyan, sağa çarpıklık ve uç değer cezaları)
  let fairnessScore = 100;
  let fairnessLabel = "Mükemmel Adalet";
  let fairnessColor = "emerald";

  if (standardCount > 0) {
    const variance = allGaps.reduce((acc, g) => acc + Math.pow(g - avg, 2), 0) / standardCount;
    const stdDev = Math.sqrt(variance);
    const maxGap = allGaps.length > 0 ? allGaps[allGaps.length - 1] : 0;

    let penalty = 0;
    allGaps.forEach(g => {
      if (g === 3) penalty += 3.5;
      else if (g === 4) penalty += 7;
      else if (g >= 5) penalty += 12 + (g - 5) * 5;
    });

    if (maxGap > 2) {
      penalty += (maxGap - 2) * 5;
    }

    penalty += stdDev * 8;

    // Medyan ve sağa çarpıklık etkisi (Tabanın %50+'sinin boşluksuz olması adalet lehinedir)
    if (medianGaps === 0) {
      penalty -= 6; // Çoğunluğun 0 boşluğu var
    } else if (medianGaps <= 1 && medianGaps <= avg) {
      penalty -= 3; // Taban rahat, sağa çarpık dengeli dağılım
    } else if (medianGaps >= 2) {
      penalty += (medianGaps - 1) * 8; // Tabanın yarısından fazlasında yüksek boşluk var
    }

    fairnessScore = Math.max(15, Math.min(100, Math.round(100 - penalty)));

    if (fairnessScore >= 90) {
      fairnessLabel = "Mükemmel Adalet (Taban Boşluksuz)";
      fairnessColor = "emerald";
    } else if (fairnessScore >= 78) {
      fairnessLabel = "Yüksek Adalet (Dengeli Dağılım)";
      fairnessColor = "blue";
    } else if (fairnessScore >= 60) {
      fairnessLabel = "Orta Adalet (Yüksek Boşluklu Öğretmenler Var)";
      fairnessColor = "amber";
    } else {
      fairnessLabel = "Düşük Adalet (Pencere Dağılımı Dengesiz)";
      fairnessColor = "red";
    }
  }

  return {
    totalRequired,
    totalAssigned,
    unassigned,
    totalSchoolGaps,
    averageSchoolGaps: avg,
    medianSchoolGaps: medianGaps,
    teachersAboveMedian,
    teachersAboveAverage,
    gapReport,
    fairnessScore,
    fairnessLabel,
    fairnessColor,
    countWithoutFreeDay: teachersWithoutFreeDay.length,
    teachersWithoutFreeDay,
    requestedFreeDayCount,
    countWithoutHalfDay: teachersWithoutHalfDay.length,
    teachersWithoutHalfDay,
    requestedHalfDayCount,
    floatingDayRequested: floatingDayRequestedCount,
    floatingDayFailed: floatingDayFailedTeachers.length,
    floatingDayFailedTeachers,
    floatingHalfRequested: floatingHalfRequestedCount,
    floatingHalfFailed: floatingHalfFailedTeachers.length,
    floatingHalfFailedTeachers
  };
};

// 🔧 CANLI KURAL ESNETME DENETİM MOTORU (Öğretmen & Sınıf Bazlı)
export const calculateLiveRelaxedRules = (
  timetable: Timetable,
  teachers: Teacher[] = [],
  classrooms: Classroom[] = [],
  settings: Partial<Settings> = {},
  hardPrefs: Partial<HardConstraints> = {}
): RelaxedRule[] => {
  const relaxedRules: RelaxedRule[] = [];
  if (!timetable || Object.keys(timetable).length === 0) return relaxedRules;

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const maxTotalGaps = hardPrefs?.maxTotalGaps ?? 4;
  const maxTotalLevel = hardPrefs?.maxTotalGapsLevel ?? (hardPrefs?.enforceMaxTotalGaps !== false ? 'medium' : 'off');
  const minTotalGaps = hardPrefs?.minTotalGaps ?? 0;
  const minTotalLevel = hardPrefs?.minTotalGapsLevel ?? 'off';
  const enforceMaxTotal = maxTotalLevel !== 'off' && hardPrefs?.enforceMaxTotalGaps !== false;
  const enforceMinTotal = minTotalLevel !== 'off' && minTotalGaps > 0;
  const minDaily = hardPrefs?.minDailyHours ?? 3;
  const enforceBalance = hardPrefs?.enforceDailyBalance !== false;
  const enforceConsecutive = hardPrefs?.enforceConsecutiveClassRules !== false;
  const enforceIntensive = hardPrefs?.enforceIntensiveRules !== false;
  const maxIntensive = hardPrefs?.maxHoursPerIntensiveCourse ?? 4;

  const teacherMap = {};
  const teacherLoads = {};
  const teacherOpenDays = {};
  const numPeriods = Number(settings?.periodsPerDay) || 8;

  (teachers || []).forEach(t => {
    teacherMap[t.id] = t;
    teacherLoads[t.id] = 0;
    const openDays = days.filter(d => (t.unavailable?.[d] || []).length < numPeriods).length;
    teacherOpenDays[t.id] = openDays;
  });

  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      if (co.teacherId && teacherLoads[co.teacherId] !== undefined) {
        teacherLoads[co.teacherId] += Number(co.hoursPerWeek) || 0;
      }
    });
  });

  const isTeacherExemptOrPartTime = (tId) => {
    const t = teacherMap[tId];
    if (!t) return true;
    const load = teacherLoads[tId] || 0;
    const openD = teacherOpenDays[tId] ?? days.length;
    const isPartTime = (openD <= 2 && load < 17 && load > 0) || (t.isExempt && load < 17);
    const isExempt = Boolean(t.isExempt) || load <= 8 || isPartTime || Boolean(t.isAdministrator);
    return isExempt || isPartTime;
  };

  // 1. Öğretmen-Sınıf Bitişiklik ve Günlük Ders Yükü Esnetmeleri
  if (enforceConsecutive) {
    (classrooms || []).forEach(c => {
      const cDays = timetable[c.id] || {};
      const pairWeekly = {};
      days.forEach(d => {
        (cDays[d] || []).forEach(slot => {
          if (slot.teacherId) {
            pairWeekly[slot.teacherId] = (pairWeekly[slot.teacherId] || 0) + 1;
          }
        });
      });

      days.forEach(d => {
        const slots = cDays[d] || [];
        const byT: Record<string, TimetableSlot[]> = {};
        slots.forEach(slot => {
          if (slot.teacherId) {
            if (!byT[slot.teacherId]) byT[slot.teacherId] = [];
            byT[slot.teacherId].push(slot);
          }
        });

        Object.entries(byT).forEach(([tId, tSlots]) => {
          if (isTeacherExemptOrPartTime(tId)) return;
          const tObj = teacherMap[tId];
          const tName = tObj?.name || 'Öğretmen';
          const weeklyInClass = pairWeekly[tId] || 0;
          const maxAllowed = weeklyInClass <= 10 ? 2 : 4;
          const periods = tSlots.map(s => Number(s.period)).sort((a, b) => a - b);
          const subjects = Array.from(new Set(tSlots.map(s => s.subject || 'Ders')));
          const subjStr = subjects.join(', ');

          if (periods.length > maxAllowed) {
            const desc = `${tName} (${c.name} – ${subjStr}): ${d} günü aynı sınıfa ${periods.length} saat ders yerleşti (normal sınır: en fazla ${maxAllowed} saat).`;
            relaxedRules.push({
              teacherId: tId,
              teacherName: tName,
              classId: c.id,
              className: c.name,
              subject: subjStr,
              day: d,
              ruleType: 'Aynı Sınıfa Günlük Ders Yükü Esnetmesi',
              description: desc
            });
          }

          if (periods.length >= 2 && weeklyInClass <= 10) {
            let blocks = 1;
            for (let i = 1; i < periods.length; i++) {
              if (periods[i] !== periods[i - 1] + 1) blocks++;
            }
            if (blocks > 1) {
              const pStr = periods.map(p => `${p}.`).join(', ');
              const desc = `${tName} (${c.name} – ${subjStr}): ${d} günü dersler bitişik blok yerine ayrık saatlere (${pStr} saatler) yerleşti.`;
              relaxedRules.push({
                teacherId: tId,
                teacherName: tName,
                classId: c.id,
                className: c.name,
                subject: subjStr,
                day: d,
                ruleType: 'Blok Bitişikliği Esnetmesi',
                description: desc
              });
            }
          }
        });
      });
    });
  }

  // 1b. Yoğun Ders Günlük Tavan Sınırı Esnetmeleri (Haftalık > 6 saat olan dersler için)
  if (enforceIntensive) {
    (classrooms || []).forEach(c => {
      const intensiveCourses = (c.courses || []).filter(co => Number(co.hoursPerWeek) > 6);
      if (intensiveCourses.length === 0) return;
      const cDays = timetable[c.id] || {};

      intensiveCourses.forEach(co => {
        days.forEach(d => {
          const slots = (cDays[d] || []).filter(s => s.subject === co.subject && (!co.teacherId || s.teacherId === co.teacherId));
          if (slots.length > maxIntensive) {
            const tObj = teacherMap[co.teacherId];
            const tName = tObj?.name || 'Öğretmen';
            const desc = `${c.name} – ${co.subject} (${tName}): ${d} günü ${slots.length} saat ders yerleşti (azami sınır: ${maxIntensive} saat).`;
            relaxedRules.push({
              teacherId: co.teacherId,
              teacherName: tName,
              classId: c.id,
              className: c.name,
              subject: co.subject,
              day: d,
              ruleType: 'Yoğun Ders Günlük Tavan Esnetmesi',
              description: desc
            });
          }
        });
      });
    });
  }

  // 2. Öğretmen Bazlı Pencere, Asgari Saat ve Esnek Boş Gün Esnetmeleri
  const teacherBusy: Record<string, Record<string, number[]>> = {};
  (teachers || []).forEach(t => {
    teacherBusy[t.id] = {};
    days.forEach(d => { teacherBusy[t.id][d] = []; });
  });

  Object.keys(timetable).forEach(cId => {
    const cDays = timetable[cId] || {};
    days.forEach(d => {
      (cDays[d] || []).forEach(slot => {
        if (slot.teacherId && teacherBusy[slot.teacherId]?.[d]) {
          teacherBusy[slot.teacherId][d].push(Number(slot.period));
        }
      });
    });
  });

  (teachers || []).forEach(t => {
    const load = teacherLoads[t.id] || 0;
    if (load <= 0) return;
    const exempt = isTeacherExemptOrPartTime(t.id);
    const hours = {};

    let teacherTotalGaps = 0;
    days.forEach(d => {
      const uniquePeriods = Array.from(new Set(teacherBusy[t.id]?.[d] || [])).sort((a, b) => a - b);
      hours[d] = uniquePeriods.length;
      if (uniquePeriods.length > 1) {
        const span = uniquePeriods[uniquePeriods.length - 1] - uniquePeriods[0] + 1;
        const g = span - uniquePeriods.length;
        teacherTotalGaps += g;
      }
    });

    const closedSlots = Object.values(t.unavailable || {}).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const teacherOpenSlots = (days.length * numPeriods) - closedSlots;
    const tFreeCapacity = Math.max(0, teacherOpenSlots - load);
    const isUserGapExempt = (hardPrefs?.gapExemptTeacherIds || []).includes(t.id);

    if (!exempt && !isUserGapExempt && enforceMaxTotal && teacherTotalGaps > maxTotalGaps) {
      const desc = `${t.name}: Haftalık toplam ${teacherTotalGaps} saat pencere oluştu (azami sınır: en fazla ${maxTotalGaps} saat).`;
      relaxedRules.push({
        teacherId: t.id,
        teacherName: t.name,
        classId: null,
        className: null,
        subject: t.branch,
        day: 'Haftalık',
        ruleType: 'Haftalık Toplam Azami Pencere Esnetmesi',
        description: desc
      });
    }

    if (!exempt && !isUserGapExempt && enforceMinTotal && load >= 10) {
      if (tFreeCapacity >= minTotalGaps && teacherTotalGaps < minTotalGaps) {
        const desc = `${t.name}: Haftalık toplam ${teacherTotalGaps} saat pencere oluştu (asgari şart: en az ${minTotalGaps} saat boşluk).`;
        relaxedRules.push({
          teacherId: t.id,
          teacherName: t.name,
          classId: null,
          className: null,
          subject: t.branch,
          day: 'Haftalık',
          ruleType: 'Haftalık Toplam Asgari Pencere Esnetmesi',
          description: desc
        });
      }
    }

    const activeDays = days.filter(d => (hours[d] || 0) > 0);
    if (!exempt && enforceBalance && load > 0) {
      const adaptiveMin = Math.min(minDaily, load);
      const rem = load % adaptiveMin;
      const daysBelowMin = activeDays.filter(d => (hours[d] || 0) < adaptiveMin);
      const hasSingleRemDay = rem > 0 && daysBelowMin.length === 1;

      activeDays.forEach(d => {
        const h = hours[d] || 0;
        if (h < adaptiveMin) {
          if (hasSingleRemDay && h === rem) {
            // Matematiksel artık ders (ör. 14 saatin 4 güne 4+4+4+2 dağılması): kural esnetmesi değil
            return;
          }
          const desc = `${t.name} – ${d}: Günde ${h} saat ders yerleşti (asgari ${adaptiveMin} saat kuralı esnetildi).`;
          relaxedRules.push({
            teacherId: t.id,
            teacherName: t.name,
            classId: null,
            className: null,
            subject: t.branch,
            day: d,
            ruleType: 'Günlük Asgari Ders Saati Esnetmesi',
            description: desc
          });
        }
      });
    }

    const fDay = t.floatingConstraints?.freeDayPreference || 'none';
    const enforceMinActiveDays = hardPrefs?.enforceMinActiveDays !== false && (hardPrefs?.minActiveDaysLevel ?? 'high') !== 'off' && Number(hardPrefs?.minActiveDays ?? 4) > 0;
    const minActiveDaysTarget = Number(hardPrefs?.minActiveDays ?? 4);
    const isUserMinDaysExempt = (hardPrefs?.minDaysExemptTeacherIds || []).includes(t.id);
    if (!exempt && !isUserMinDaysExempt && fDay !== 'floating_2_days' && enforceMinActiveDays && load > 0) {
      const openD = teacherOpenDays[t.id] ?? days.length;
      const maxPossibleDays = Math.min(openD, Math.max(1, Math.floor(load / 2)));
      const effMinActiveDays = Math.min(minActiveDaysTarget, maxPossibleDays);
      if (activeDays.length < effMinActiveDays) {
        const desc = `${t.name}: Haftada ${activeDays.length} güne ders yerleşti (asgari ${effMinActiveDays} aktif gün kuralı esnetildi).`;
        relaxedRules.push({
          teacherId: t.id,
          teacherName: t.name,
          classId: null,
          className: null,
          subject: t.branch,
          day: 'Haftalık',
          ruleType: 'Haftalık Asgari Ders Günü Esnetmesi',
          description: desc
        });
      }
    }
    if (fDay === 'floating_1_day' && activeDays.length > days.length - 1) {
      const desc = `${t.name}: 1 gün esnek boş gün tercihi esnetildi (${activeDays.length} güne ders yerleşti).`;
      relaxedRules.push({
        teacherId: t.id,
        teacherName: t.name,
        classId: null,
        className: null,
        subject: t.branch,
        day: 'Haftalık',
        ruleType: 'Esnek Boş Gün Esnetmesi',
        description: desc
      });
    } else if (fDay === 'floating_2_days' && activeDays.length > days.length - 2) {
      const desc = `${t.name}: 2 gün esnek boş gün tercihi esnetildi (${activeDays.length} güne ders yerleşti).`;
      relaxedRules.push({
        teacherId: t.id,
        teacherName: t.name,
        classId: null,
        className: null,
        subject: t.branch,
        day: 'Haftalık',
        ruleType: 'Esnek Boş Gün Esnetmesi',
        description: desc
      });
    }
  });

  // 3. Saatlik Yedek / Nöbetçi Öğretmen Güvencesi Denetimi (İlk ve son saat hariç tüm ara saatler: 2 .. P-1)
  const hourlyReserveLevel = hardPrefs?.hourlyReserveLevel ?? 'off';
  const minHourlyReserve = Number(hardPrefs?.minHourlyReserveTeachers ?? 1);
  const enforceHourlyReserve = Boolean(hardPrefs?.enforceHourlyReserve) && hourlyReserveLevel !== 'off' && minHourlyReserve > 0;
  if (enforceHourlyReserve && numPeriods >= 3) {
    const gapExemptIds = new Set(hardPrefs?.gapExemptTeacherIds || []);
    const eligTeachers = (teachers || []).filter(t => {
      const load = teacherLoads[t.id] || 0;
      return load > 0 && !t.isAdministrator && !isTeacherExemptOrPartTime(t.id) && !gapExemptIds.has(t.id);
    });
    days.forEach(d => {
      for (let p = 2; p < numPeriods; p++) {
        let inGapCount = 0;
        let freePresentCount = 0;
        eligTeachers.forEach(t => {
          const ps = Array.from(new Set(teacherBusy[t.id]?.[d] || [])).sort((a, b) => a - b);
          const closed = t.unavailable?.[d] || [];
          const isClosedAtP = closed.includes(p);
          const hasLessonAtP = ps.includes(p);

          if (ps.length >= 2 && ps[0] < p && p < ps[ps.length - 1] && !hasLessonAtP) {
            inGapCount++;
          }
          if (ps.length > 0 && !isClosedAtP && !hasLessonAtP) {
            freePresentCount++;
          }
        });
        if (inGapCount < minHourlyReserve && freePresentCount < minHourlyReserve) {
          const desc = `${d} günü ${p}. ders saatinde okulda boşta (pencerede) ${inGapCount} öğretmen bulundu (hedef: en az ${minHourlyReserve} öğretmen).`;
          relaxedRules.push({
            teacherId: null,
            teacherName: 'Okul Geneli',
            classId: null,
            className: null,
            subject: `${p}. Ders Saati`,
            day: d,
            ruleType: 'Saatlik Yedek Öğretmen Esnetmesi',
            description: desc
          });
        }
      }
    });
  }

  return relaxedRules;
};

// 🚨 CANLI İHLAL VE ÇAKIŞMA DENETİM MOTORU
// Manuel sürükle-bırak, ders taşıma veya silme yapıldığında anında çalışarak
// dağıtım motorunun "İhlaller ve Raporlar" panelini dinamik olarak günceller.
export const calculateLiveViolations = (
  timetable: Timetable,
  teachers: Teacher[] = [],
  classrooms: Classroom[] = [],
  settings: Partial<Settings> = {},
  hardPrefs: Partial<HardConstraints> = {}
): string[] => {
  const violations: string[] = [];
  if (!timetable || Object.keys(timetable).length === 0) return violations;

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

  // 1. Tablodaki yerleşimleri tara (Öğretmen ve Sınıf çakışmaları, kapalı saatler)
  const teacherBusy = {}; // tId -> { [day]: [ { period, classId, className, subject } ] }
  (teachers || []).forEach(t => {
    teacherBusy[t.id] = {};
    days.forEach(d => { teacherBusy[t.id][d] = []; });
  });

  Object.keys(timetable).forEach(cId => {
    const cName = classrooms.find(c => c.id === cId)?.name || 'Sınıf';
    const cDays = timetable[cId] || {};
    days.forEach(d => {
      const slots = cDays[d] || [];
      const periodSeen = {};
      slots.forEach(slot => {
        const p = Number(slot.period);
        if (periodSeen[p]) {
          violations.push(`🚨 Sınıf Çakışması: ${cName} sınıfında ${d} ${p}. saatte birden fazla ders var (${slot.subject} ve ${periodSeen[p]}).`);
        } else {
          periodSeen[p] = slot.subject;
        }

        if (slot.teacherId && teacherBusy[slot.teacherId] && teacherBusy[slot.teacherId][d]) {
          teacherBusy[slot.teacherId][d].push({ period: p, classId: cId, className: cName, subject: slot.subject });
        }
      });
    });
  });

  // 2. Öğretmen bazlı çakışma ve kapalı saat ihlalleri
  (teachers || []).forEach(t => {
    days.forEach(d => {
      const assigned = teacherBusy[t.id]?.[d] || [];

      const periodMap: Record<string, string[]> = {};
      assigned.forEach(item => {
        if (!periodMap[item.period]) periodMap[item.period] = [];
        periodMap[item.period].push(item.className);
      });
      Object.entries(periodMap).forEach(([p, classList]) => {
        if (classList.length > 1) {
          violations.push(`🚨 Öğretmen Çakışması: ${t.name} – ${d} ${p}. saatte ${classList.length} farklı sınıfta (${classList.join(', ')}) derse giriyor!`);
        }
      });

      const closed = t.unavailable?.[d] || [];
      assigned.forEach(item => {
        if (closed.includes(item.period)) {
          violations.push(`⛔ Kapalı Saat İhlali: ${t.name} – ${d} ${item.period}. saatte kapalı olmasına rağmen ${item.className} sınıfında dersi var.`);
        }
      });
    });
  });

  // 3. Esnetilen kuralları da uyarı listesine ekle
  const relaxed = calculateLiveRelaxedRules(timetable, teachers, classrooms, settings, hardPrefs);
  relaxed.forEach(r => {
    violations.push(`🔧 ${r.ruleType}: ${r.description}`);
  });

  return violations;
};

export interface AppState {
  demoDataChoice: DemoDataChoice;
  settings: Settings;
  teachers: Teacher[];
  classrooms: Classroom[];
  timetable: Timetable;
  softPrefs: SoftConstraints;
  updateSoftPrefs: (newPrefs: Partial<SoftConstraints>) => void;
  hardPrefs: HardConstraints;
  setHardPrefs: (newPrefs: Partial<HardConstraints>) => void;
  pinnedSlots: PinnedSlot[];
  togglePinSlot: (slot: PinnedSlot) => void;
  addPrePin: (slot: PinnedSlot) => void;
  removePinGroup: (groupId: string) => void;
  pruneStalePins: (validClassIds: string[]) => void;
  pinTeacherSchedule: (teacherId: string) => void;
  unpinTeacherSchedule: (teacherId: string) => void;
  toggleTeacherSchedulePin: (teacherId: string) => { action: 'pinned' | 'unpinned'; count: number };
  clearAllPins: () => void;
  setPinnedSlots: (slots: PinnedSlot[]) => void;
  isGenerating: boolean;
  isStopping: boolean;
  generateResult: GenerateResult | null;
  liveTelemetry?: any;
  setGenerateResult: (result: GenerateResult | null) => void;
  startGeneration: () => Promise<void>;
  stopGeneration: () => Promise<void>;
  isLocalRepairing: boolean;
  localRepairPreview: {
    targetTeacherId: string;
    newTimetable: Timetable;
    diff: LocalRepairDiffResult;
  } | null;
  localRepairError: string | null;
  startLocalRepair: (teacherId: string) => Promise<{ success: boolean; message?: string }>;
  applyLocalRepair: () => void;
  cancelLocalRepair: () => void;
  saveCurrentSchoolSnapshot: () => void;
  downloadSchoolBackup: () => void;
  loadHzAyseDemoData: () => void;
  loadAbdiIpekciDemoData: (includeSchedule?: boolean) => void;
  clearDataForManualEntry: () => void;
  setDemoDataChoice: (choice: DemoDataChoice) => void;
  resetDemoPrompt: () => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  addTeacher: (teacher: Partial<Teacher> & { name: string; branch: string }) => Teacher;
  updateTeacher: (id: string, updatedFields: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addClassroom: (classroom: Partial<Classroom> & { name: string }) => void;
  updateClassroom: (id: string, updatedFields: Partial<Classroom>) => void;
  deleteClassroom: (id: string) => void;
  setTimetable: (newTimetable: Timetable) => void;
  resetTimetable: (clearPins?: boolean) => void;
  clearAllTeacherConstraints: () => void;
  recalculateMetrics: () => void;
  dykSettings: DykSettings;
  dykGroups: DykGroup[];
  dykAssignments: DykAssignment[];
  dykTeacherAvailabilities: DykTeacherAvailabilities;
  dykSchedule: DykSchedule | null;
  dykResult: DykResult | null;
  updateDykSettings: (newSettings: Partial<DykSettings>) => void;
  setDykDayCustomTimes: (day: string, timesMap: Record<string, any>) => void;
  resetDykDayCustomTimes: (day: string) => void;
  excludeTeacherFromDyk: (teacherId: string) => void;
  includeTeacherInDyk: (teacherId: string) => void;
  addDykGroup: (group: Partial<DykGroup> & { name: string }) => void;
  updateDykGroup: (id: string, fields: Partial<DykGroup>) => void;
  deleteDykGroup: (id: string) => void;
  addDykAssignment: (assignment: Partial<DykAssignment>) => void;
  addMultipleDykAssignments: (newAssignments: Partial<DykAssignment>[]) => void;
  updateDykAssignment: (id: string, fields: Partial<DykAssignment>) => void;
  deleteDykAssignment: (id: string) => void;
  setDykTeacherAvailability: (teacherId: string, days: string[]) => void;
  setDykSchedule: (schedule: DykSchedule | null) => void;
  generateDykSchedule: () => any;
  clearDykSchedule: () => void;
  setDykResult: (newResult: Partial<DykResult> | null) => void;
  examSettings: ExamSettings;
  examSubjectsByGrade: ExamSubjectsByGrade;
  examSchedule: ExamSchedule | null;
  examPlacements: ExamPlacement[] | null;
  examResult: ExamResult | null;
  examSupervisors: ExamSupervisorsMap | null;
  examSupervisorResult: ExamSupervisorResult | null;
  updateExamSettings: (newSettings: Partial<ExamSettings>) => void;
  setExamSubjectsByGrade: (newSubjects: ExamSubjectsByGrade) => void;
  setExamPlacements: (newPlacements: ExamPlacement[]) => void;
  toggleExamSubjectMajor: (grade: string, subjectId: string) => void;
  updateExamSubjectMebConfig: (grade: string, subjectId: string, config?: Partial<ExamSubject>, applyToAllGrades?: boolean) => void;
  addExamSubject: (grade: string, subject: Partial<ExamSubject>) => void;
  deleteExamSubject: (grade: string, subjectId: string) => void;
  generateExamSchedule: () => any;
  generateExamSupervisors: (avoidSameBranch?: boolean) => any;
  updateExamSupervisorSlot: (date: string, slot: number, classroomId: string, teacherId: string) => void;
  clearExamSchedule: () => void;
  clearExamSupervisors: () => void;
  [key: string]: any;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      demoDataChoice: null, // null: Henüz sorulmadı, 'demo': Hz. Ayşe örnek verisi, 'manual': Manuel sıfırdan ekleme
      settings: {
        schoolName: "Hz. Ayşe Kız Anadolu İmam Hatip Lisesi",
        days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
        periodsPerDay: 8,
        lunchAfter: 4,
        lunchDuration: 1,
        principalName: "Okul Müdürü"
      },
      teachers: REAL_TEACHERS,
      classrooms: enrichCoursesWithCodes(REAL_CLASSROOMS),
      timetable: {},

      softPrefs: {
        minimizeGaps: true,
        gapPenalty: 40,
        earlyStart: true,
        earlyStartPenalty: 20,
        avoidStemLate: true,
        stemLatePenalty: 35,
        maxTotalGapsLevel: 'medium',
        maxTotalGapsPenalty: 60,
        minTotalGapsLevel: 'off',
        minTotalGapsPenalty: 0,
        gapExemptTeacherIds: [],
        hourlyReserveLevel: 'off',
        hourlyReservePenalty: 0,
        minActiveDaysLevel: 'high',
        minActiveDaysPenalty: 100,
        minDaysExemptTeacherIds: []
      },
      updateSoftPrefs: (newPrefs) => set((state) => ({ softPrefs: { ...state.softPrefs, ...newPrefs } })),

      hardPrefs: {
        enforceMaxTotalGaps: true,
        maxTotalGaps: 4,
        maxTotalGapsLevel: 'medium',
        maxTotalGapsPenalty: 60,
        enforceMinTotalGaps: false,
        minTotalGaps: 0,
        minTotalGapsLevel: 'off',
        minTotalGapsPenalty: 0,
        gapExemptTeacherIds: [],
        enforceHourlyReserve: false,
        minHourlyReserveTeachers: 1,
        hourlyReserveLevel: 'off',
        hourlyReservePenalty: 0,
        enforceCategoricalFairness: true,
        enforceMinActiveDays: true,
        minActiveDays: 4,
        minActiveDaysLevel: 'high',
        minActiveDaysPenalty: 100,
        minDaysExemptTeacherIds: [],
        enforceMaxGaps: true,
        maxGapsPerDay: 2,
        enforceDailyBalance: true,
        minDailyHours: 3,
        enforceConsecutiveClassRules: true,
        enforceIntensiveRules: true,
        maxHoursPerIntensiveCourse: 4,
        solverTimeout: 60,
        stopAtFirstSolution: false
      },
      setHardPrefs: (newPrefs) => set((state) => ({ hardPrefs: { ...state.hardPrefs, ...newPrefs } })),

      pinnedSlots: [], // 📌 KİLİTLİ (PINNED) DERS HÜCRELERİ
      togglePinSlot: (slot) => set((state) => {
        const pNum = Number(slot.period);
        const exists = state.pinnedSlots.some(
          (p) => p.classId === slot.classId && p.day === slot.day && Number(p.period) === pNum
        );
        if (exists) {
          return {
            pinnedSlots: state.pinnedSlots.filter(
              (p) => !(p.classId === slot.classId && p.day === slot.day && Number(p.period) === pNum)
            )
          };
        } else {
          return {
            pinnedSlots: [
              ...state.pinnedSlots,
              {
                classId: slot.classId,
                day: slot.day,
                period: pNum,
                subject: slot.subject,
                teacherId: slot.teacherId
              }
            ]
          };
        }
      }),

      // 🆕 Yeni Pin Ekleme (Grup ID destekli)
      addPrePin: (slot) => set((state) => ({
        pinnedSlots: [...state.pinnedSlots, { ...slot }]
      })),

      // 🆕 Grup ID'ye göre Pin Grubunu Kaldır
      removePinGroup: (groupId) => set((state) => ({
        pinnedSlots: state.pinnedSlots.filter((p) => p.groupId !== groupId)
      })),

      // 🆕 Kullanılmayan sınıflara ait pinleri temizle
      pruneStalePins: (validClassIds) => set((state) => ({
        pinnedSlots: state.pinnedSlots.filter((p) => validClassIds.includes(p.classId))
      })),

      

      // 🔒 BİR ÖĞRETMENİN TÜM PROGRAMINI TEK TIKLA KİLİTLE
      pinTeacherSchedule: (teacherId) => set((state) => {
        const { timetable } = state;
        const newPins = [...state.pinnedSlots];
        
        Object.keys(timetable || {}).forEach((cId) => {
          const daysMap = timetable[cId] || {};
          Object.keys(daysMap).forEach((day) => {
            const slots = daysMap[day] || [];
            slots.forEach((s) => {
              if (s.teacherId === teacherId) {
                const pNum = Number(s.period);
                const already = newPins.some(
                  (p) => p.classId === cId && p.day === day && Number(p.period) === pNum
                );
                if (!already) {
                  newPins.push({
                    classId: cId,
                    day,
                    period: pNum,
                    subject: s.subject,
                    teacherId
                  });
                }
              }
            });
          });
        });

        return { pinnedSlots: newPins };
      }),

      

      // 🔓 BİR ÖĞRETMENİN TÜM KİLİTLERİNİ TEK TIKLA KALDIR
      unpinTeacherSchedule: (teacherId) => set((state) => ({
        pinnedSlots: state.pinnedSlots.filter((p) => p.teacherId !== teacherId)
      })),

      // 🔄 ÖĞRETMENİN TÜM PROGRAMI KİLİTLİ Mİ / TOGGLE
      toggleTeacherSchedulePin: (teacherId) => {
        const { timetable, pinnedSlots } = get();
        let totalAssigned = 0;
        let pinnedCount = 0;

        Object.keys(timetable || {}).forEach((cId) => {
          const daysMap = timetable[cId] || {};
          Object.keys(daysMap).forEach((day) => {
            const slots = daysMap[day] || [];
            slots.forEach((s) => {
              if (s.teacherId === teacherId) {
                totalAssigned++;
                const pNum = Number(s.period);
                const isPinned = (pinnedSlots || []).some(
                  (p) => p.classId === cId && p.day === day && Number(p.period) === pNum
                );
                if (isPinned) pinnedCount++;
              }
            });
          });
        });

        if (totalAssigned > 0 && pinnedCount === totalAssigned) {
          get().unpinTeacherSchedule(teacherId);
          return { action: 'unpinned', count: totalAssigned };
        } else {
          get().pinTeacherSchedule(teacherId);
          return { action: 'pinned', count: totalAssigned };
        }
      },

      clearAllPins: () => set({ pinnedSlots: [] }),

      
      setPinnedSlots: (slots) => set({ pinnedSlots: Array.isArray(slots) ? slots : [] }),

      

      isGenerating: false,
      isStopping: false,
      isLocalRepairing: false,
      localRepairPreview: null,
      localRepairError: null,
      generateResult: null,
      setGenerateResult: (result) => set({ generateResult: result }),

      stopGeneration: async () => {
        const { isGenerating, isStopping } = get();
        if (!isGenerating || isStopping) return;

        set({ isStopping: true });
        try {
          const targetApiUrl = getActiveApiUrl() || await resolveSolverApiUrl();
          await fetch(`${targetApiUrl}/solve/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error('Stop request failed:', err);
        }
      },

      startGeneration: async () => {
        const { settings, teachers, classrooms, softPrefs, hardPrefs, pinnedSlots } = get();

        if (!settings?.days || settings.days.length === 0) {
          set({
            generateResult: {
              success: false,
              message: 'Dağıtım Yapılamaz: Okul Ayarları Eksik.',
              unassignedCount: 0,
              warnings: ['Lütfen "Ayarlar" sekmesinden günleri mühürleyin.']
            }
          });
          return;
        }

        set({ isGenerating: true, isStopping: false, generateResult: null });

        try {
          const targetApiUrl = await resolveSolverApiUrl();
          const response = await fetch(`${targetApiUrl}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings,
              teachers,
              classrooms,
              softConstraints: softPrefs,
              hardConstraints: hardPrefs,
              pinnedSlots: pinnedSlots || []
            })
          });

          if (!response.ok) {
            let errorMsg = `Sunucu Hatası (${response.status})`;
            try {
              const errData = await response.json();
              errorMsg = errData.detail || errData.message || errorMsg;
            } catch {
              // Yanıt JSON değilse (örneğin bulut proxy 502/504 HTML zaman aşımı yanıtı)
            }
            set({
              generateResult: {
                success: false,
                message: errorMsg,
                unassignedCount: 0,
                warnings: [
                  response.status === 504
                    ? 'İşlem bulut sunucusu zaman aşımına (100s) uğradı. Lütfen "Hızlı Dağıtım" modunu seçin veya süreyi azaltın.'
                    : `Sunucu HTTP ${response.status} hatası döndürdü. Lütfen tekrar deneyin.`
                ]
              },
              isGenerating: false,
              isStopping: false
            });
            return;
          }

          const data = await response.json();

          if (data.status === 'ok') {
            const wasStopped = Boolean(data.metrics?.stoppedEarlyByUser);
            set({
              timetable: data.timetable,
              generateResult: {
                success: true,
                message: wasStopped
                  ? `Motor kullanıcı isteğiyle sonlandırıldı. Ulaşılan son geçerli çözüm (${data.metrics?.totalSchoolGaps ?? 0} Saat Boşluk) başarıyla korundu ve uygulandı.`
                  : undefined,
                metrics: data.metrics,
                unassignedCount: data.metrics?.unassigned || 0,
                warnings: data.metrics?.violations || []
              },
              isGenerating: false,
              isStopping: false
            });
          } else {
            const errorMsg = data.detail || data.message || 'Dağıtım Yapılamadı!';
            const errorWarnings = data.metrics?.warnings && data.metrics.warnings.length > 0
              ? data.metrics.warnings
              : (data.detail ? [data.detail] : ['Lütfen öğretmen kapalı saatlerini ve ders saatlerini kontrol edin.']);
            set({
              generateResult: {
                success: false,
                message: errorMsg,
                unassignedCount: 0,
                warnings: errorWarnings
              },
              isGenerating: false,
              isStopping: false
            });
          }
        } catch (err: any) {
          set({
            generateResult: {
              success: false,
              message: 'Bağlantı veya Sunucu Hatası!',
              unassignedCount: 0,
              warnings: [
                'Backend API sunucusuna ulaşılamadı.',
                err?.message || 'Terminalden Python sunucusunun (FastAPI) çalıştığından emin olun.'
              ]
            },
            isGenerating: false,
            isStopping: false
          });
        }
      },

      startLocalRepair: async (teacherId: string) => {
        const { settings, teachers, classrooms, softPrefs, hardPrefs, pinnedSlots, timetable, isGenerating, isLocalRepairing } = get();

        if (isGenerating || isLocalRepairing) {
          return { success: false, message: 'Şu anda başka bir dağıtım işlemi çalışıyor.' };
        }

        if (!settings?.days || settings.days.length === 0) {
          const msg = 'Okul Ayarları Eksik (Günler tanımlanmamış).';
          set({ localRepairError: msg });
          return { success: false, message: msg };
        }

        if (!timetable || Object.keys(timetable).length === 0) {
          const msg = 'Lokal onarım için önce okul genelinde dağıtılmış bir program bulunmalıdır.';
          set({ localRepairError: msg });
          return { success: false, message: msg };
        }

        const targetTeacher = teachers.find((t) => t.id === teacherId);
        if (!targetTeacher) {
          const msg = 'Seçilen öğretmen sistemde bulunamadı.';
          set({ localRepairError: msg });
          return { success: false, message: msg };
        }

        const targetClassIds = getTeacherClassIds(teacherId, timetable, classrooms);
        if (targetClassIds.length === 0) {
          const msg = `${targetTeacher.name} öğretmenine ait ders veya sınıf bulunamadı.`;
          set({ localRepairError: msg });
          return { success: false, message: msg };
        }

        set({ isLocalRepairing: true, localRepairError: null, localRepairPreview: null });

        try {
          // 1. Etki alanı kilit matrisini üret (Hedef sınıflar haricindeki tüm okul dondurulur)
          const neighborhoodPins = buildNeighborhoodPins(targetClassIds, timetable, pinnedSlots || []);

          // 2. CP-SAT motorunu çağır
          const targetApiUrl = await resolveSolverApiUrl();
          const response = await fetch(`${targetApiUrl}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings,
              teachers,
              classrooms,
              softConstraints: softPrefs,
              hardConstraints: {
                ...hardPrefs,
                solverTimeout: Math.min(hardPrefs?.solverTimeout || 60, 25)
              },
              pinnedSlots: neighborhoodPins
            })
          });

          if (!response.ok) {
            let errorMsg = `Sunucu Hatası (${response.status})`;
            try {
              const errData = await response.json();
              errorMsg = errData.detail || errData.message || errorMsg;
            } catch {
              // ignore
            }
            set({
              isLocalRepairing: false,
              localRepairError: errorMsg
            });
            return { success: false, message: errorMsg };
          }

          const data = await response.json();

          if (data.status === 'ok') {
            const diff = calculateTimetableDiff(
              teacherId,
              timetable,
              data.timetable,
              teachers,
              classrooms,
              settings.days
            );

            set({
              isLocalRepairing: false,
              localRepairPreview: {
                targetTeacherId: teacherId,
                newTimetable: data.timetable,
                diff
              },
              localRepairError: null
            });
            return { success: true };
          } else {
            const errorMsg = data.detail || data.message || 'Lokal Dağıtım Yapılamadı (Sınırlı alanda geçerli takas bulunamadı).';
            set({
              isLocalRepairing: false,
              localRepairError: errorMsg
            });
            return { success: false, message: errorMsg };
          }
        } catch (err: any) {
          const errorMsg = err?.message || 'Lokal onarım sırasında bağlantı veya sunucu hatası oluştu.';
          set({
            isLocalRepairing: false,
            localRepairError: errorMsg
          });
          return { success: false, message: errorMsg };
        }
      },

      applyLocalRepair: () => {
        const { localRepairPreview, saveCurrentSchoolSnapshot } = get();
        if (!localRepairPreview) return;

        // Değişikliği uygulamadan önce anlık otomatik snapshot yedekle
        saveCurrentSchoolSnapshot();

        set({
          timetable: localRepairPreview.newTimetable,
          localRepairPreview: null,
          localRepairError: null
        });
      },

      cancelLocalRepair: () => {
        set({
          localRepairPreview: null,
          localRepairError: null,
          isLocalRepairing: false
        });
      },

      // 💾 OKUL VERİLERİ ANLIK YEDEĞİ (Otomatik Snapshot)
      saveCurrentSchoolSnapshot: () => {
        const state = get();
        const currentName = state.settings?.schoolName || 'mevcut_okul';
        const key = currentName.toLowerCase().includes('ayşe') || currentName.toLowerCase().includes('ayse') 
          ? 'hz_ayse' 
          : (currentName.toLowerCase().includes('abdi') ? 'abdi_ipekci' : 'diger');
        const snapshot = {
          settings: state.settings,
          teachers: state.teachers,
          classrooms: state.classrooms,
          timetable: state.timetable,
          pinnedSlots: state.pinnedSlots || [],
          demoDataChoice: state.demoDataChoice
        };
        try {
          localStorage.setItem(`school_snapshot_${key}`, JSON.stringify(snapshot));
        } catch (e) {
          console.warn("Snapshot save failed", e);
        }
      },

      // 📥 TEK TIKLA MEVCUT OKUL VERİ TABANINI JSON OLARAK İNDİR
      downloadSchoolBackup: () => {
        const state = get();
        const cleanSchoolName = (state.settings?.schoolName || "okul").toLowerCase().replace(/[^a-z0-9]/g, "_");
        const today = new Date().toISOString().split('T')[0];
        const backupData = {
          settings: state.settings,
          teachers: state.teachers,
          classrooms: state.classrooms,
          timetable: state.timetable,
          pinnedSlots: state.pinnedSlots || [],
          softPrefs: state.softPrefs,
          hardPrefs: state.hardPrefs,
          exportDate: new Date().toISOString(),
          version: APP_VERSION
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${cleanSchoolName}_tam_yedek_${today}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      },

      // 🏫 HZ. AYŞE KIZ AİHL VERİLERİ (Güncel öğretmen kriterleri ve önceden çalışılmış tablo korunur)
      loadHzAyseDemoData: () => {
        get().saveCurrentSchoolSnapshot();
        let saved = null;
        try {
          const raw = localStorage.getItem('school_snapshot_hz_ayse');
          if (raw) saved = JSON.parse(raw);
        } catch (e) {}

        const seedById = new Map(REAL_TEACHERS.map((t) => [t.id, t]));
        const syncedTeachers = saved?.teachers?.length > 0
          ? saved.teachers.map((t: Teacher) => {
              const seed = seedById.get(t.id);
              if (!seed) return t;
              return {
                ...t,
                unavailable: seed.unavailable,
                isExempt: seed.isExempt,
                isAdministrator: seed.isAdministrator,
                priorityFullDay: seed.priorityFullDay,
                fillLateHours: seed.fillLateHours
              };
            })
          : REAL_TEACHERS;

        if (saved && saved.teachers?.length > 0) {
          set({
            settings: saved.settings,
            teachers: syncedTeachers,
            classrooms: saved.classrooms,
            timetable: saved.timetable || {},
            pinnedSlots: saved.pinnedSlots || [],
            generateResult: null,
            demoDataChoice: 'demo'
          });
        } else {
          set({
            settings: {
              schoolName: "Hz. Ayşe Kız Anadolu İmam Hatip Lisesi",
              days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
              periodsPerDay: 8,
              lunchAfter: 4,
              lunchDuration: 1,
              principalName: "Cemil Murat Kuru"
            },
            teachers: REAL_TEACHERS,
            classrooms: enrichCoursesWithCodes(REAL_CLASSROOMS),
            timetable: {},
            pinnedSlots: [],
            generateResult: null,
            demoDataChoice: 'demo'
          });
        }
      },

      // 🏫 ABDİ İPEKÇİ ORTAOKULU GERÇEK VERİ SETİ (PDF'ten 100% Doğrulanmış)
      loadAbdiIpekciDemoData: (includeSchedule = true) => {
        get().saveCurrentSchoolSnapshot();
        let saved = null;
        try {
          const raw = localStorage.getItem('school_snapshot_abdi_ipekci');
          if (raw) saved = JSON.parse(raw);
        } catch (e) {}

        if (saved && saved.teachers?.length > 0) {
          set({
            settings: saved.settings,
            teachers: saved.teachers,
            classrooms: saved.classrooms,
            timetable: includeSchedule ? (saved.timetable || ABDI_TIMETABLE) : {},
            pinnedSlots: saved.pinnedSlots || [],
            generateResult: null,
            demoDataChoice: 'abdi'
          });
        } else {
          set({
            settings: ABDI_SETTINGS,
            teachers: ABDI_TEACHERS,
            classrooms: enrichCoursesWithCodes(ABDI_CLASSROOMS),
            timetable: includeSchedule ? ABDI_TIMETABLE : {},
            pinnedSlots: [],
            generateResult: null,
            demoDataChoice: 'abdi'
          });
        }
      },

      clearDataForManualEntry: () => {
        get().saveCurrentSchoolSnapshot();
        set({
          settings: {
            schoolName: "Okul Ders Programı",
            days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
            periodsPerDay: 8,
            lunchAfter: 4,
            lunchDuration: 1,
            principalName: "Okul Müdürü"
          },
          teachers: [],
          classrooms: [],
          timetable: {},
          pinnedSlots: [],
          generateResult: null,
          demoDataChoice: 'manual'
        });
      },

      

      setDemoDataChoice: (choice) => set({ demoDataChoice: choice }),

      
      resetDemoPrompt: () => set({ demoDataChoice: null }),

      

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      addTeacher: (teacher) => {
        const id = teacher.id || newId('t');
        const newTeacherObj = { ...teacher, id };
        set((state) => ({ teachers: [...state.teachers, newTeacherObj] }));
        return newTeacherObj;
      },
      updateTeacher: (id, updatedFields) => set((state) => ({ teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)) })),
      deleteTeacher: (id) => set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),
      addClassroom: (classroom) => set((state) => {
        const enrichedCourses = (classroom.courses || []).map(co => ({
          ...co,
          code: co.code || generateCourseCode(co.subject, classroom.name)
        }));
        return {
          classrooms: [...state.classrooms, { ...classroom, id: newId('c'), courses: enrichedCourses }]
        };
      }),

      
      updateClassroom: (id, updatedFields) => set((state) => ({
        classrooms: state.classrooms.map((c) => {
          if (c.id !== id) return c;
          const updated = { ...c, ...updatedFields };
          if (updatedFields.courses) {
            updated.courses = updatedFields.courses.map(co => ({
              ...co,
              code: co.code || generateCourseCode(co.subject, updated.name)
            }));
          }
          return updated;
        })
      })),
      deleteClassroom: (id) => set((state) => ({ classrooms: state.classrooms.filter((c) => c.id !== id) })),
      setTimetable: (newTimetable) => {
        const { teachers, classrooms, settings, hardPrefs } = get();
        const liveMetrics = calculateLiveMetrics(newTimetable, teachers, classrooms, settings);
        const liveViolations = calculateLiveViolations(newTimetable, teachers, classrooms, settings, hardPrefs);
        const liveRelaxed = calculateLiveRelaxedRules(newTimetable, teachers, classrooms, settings, hardPrefs);
        set((state) => ({
          timetable: newTimetable,
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),

      
              ...liveMetrics,
              relaxedRules: liveRelaxed,
              relaxedRulesCount: liveRelaxed.length,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
              relaxedRules: liveRelaxed,
              relaxedRulesCount: liveRelaxed.length,
              violations: liveViolations
            }
          }
        }));
      },
      resetTimetable: (clearPins = false) => {
        set((state) => ({
          timetable: {},
          generateResult: null,
          liveTelemetry: null,
          pinnedSlots: clearPins ? [] : state.pinnedSlots
        }));
      },
      clearAllTeacherConstraints: () => {
        set((state) => ({
          teachers: state.teachers.map((t) => ({
            ...t,
            unavailable: {}
          }))
        }));
      },
      recalculateMetrics: () => {
        const { timetable, teachers, classrooms, settings, hardPrefs } = get();
        const liveMetrics = calculateLiveMetrics(timetable, teachers, classrooms, settings);
        const liveViolations = calculateLiveViolations(timetable, teachers, classrooms, settings, hardPrefs);
        const liveRelaxed = calculateLiveRelaxedRules(timetable, teachers, classrooms, settings, hardPrefs);
        set((state) => ({
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),

      
              ...liveMetrics,
              relaxedRules: liveRelaxed,
              relaxedRulesCount: liveRelaxed.length,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
              relaxedRules: liveRelaxed,
              relaxedRulesCount: liveRelaxed.length,
              violations: liveViolations
            }
          }
        }));
      },

      // ==========================================
      // 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) MODÜLÜ
      // ==========================================
      dykSettings: {
        activeDays: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
        blocks: [
          { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
          { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
        ],
        dayCustomTimes: {}, // { [day]: { [blockId]: { startTime, endTime } } }
        excludedTeacherIds: []
      },
      dykGroups: DEFAULT_DYK_GROUPS,
      dykAssignments: DEFAULT_DYK_ASSIGNMENTS,
      dykTeacherAvailabilities: DEFAULT_DYK_AVAILABILITIES,
      dykSchedule: null,
      dykResult: null,

      updateDykSettings: (newSettings) => set((state) => ({ dykSettings: { ...state.dykSettings, ...newSettings } })),
      setDykDayCustomTimes: (day, timesMap) => set((state) => {
        const prev = state.dykSettings?.dayCustomTimes || {};
        return {
          dykSettings: {
            ...state.dykSettings,
            dayCustomTimes: {
              ...prev,
              [day]: timesMap
            }
          }
        };
      }),

      
      resetDykDayCustomTimes: (day) => set((state) => {
        const prev = { ...(state.dykSettings?.dayCustomTimes || {}) };
        delete prev[day];
        return {
          dykSettings: {
            ...state.dykSettings,
            dayCustomTimes: prev
          }
        };
      }),

      
      excludeTeacherFromDyk: (teacherId) => set((state) => {
        const current = state.dykSettings?.excludedTeacherIds || [];
        const nextExcluded = current.includes(teacherId) ? current : [...current, teacherId];
        return {
          dykSettings: {
            ...state.dykSettings,
            excludedTeacherIds: nextExcluded
          },
          dykAssignments: state.dykAssignments.filter(a => a.teacherId !== teacherId)
        };
      }),

      
      includeTeacherInDyk: (teacherId) => set((state) => {
        const current = state.dykSettings?.excludedTeacherIds || [];
        return {
          dykSettings: {
            ...state.dykSettings,
            excludedTeacherIds: current.filter(id => id !== teacherId)
          }
        };
      }),

      
      addDykGroup: (group) => set((state) => ({ dykGroups: [...state.dykGroups, { ...group, id: newId('dg') }] })),
      updateDykGroup: (id, fields) => set((state) => ({ dykGroups: state.dykGroups.map(g => g.id === id ? { ...g, ...fields } : g) })),
      deleteDykGroup: (id) => set((state) => ({
        dykGroups: state.dykGroups.filter(g => g.id !== id),
        dykAssignments: state.dykAssignments.filter(a => a.groupId !== id)
      })),
      addDykAssignment: (assignment) => set((state) => ({ dykAssignments: [...state.dykAssignments, { ...assignment, id: newId('da') }] })),
      addMultipleDykAssignments: (newAssignments) => set((state) => ({
        dykAssignments: [
          ...state.dykAssignments,
          ...newAssignments.map(a => ({ ...a, id: newId('da') }))
        ]
      })),
      updateDykAssignment: (id, fields) => set((state) => ({ dykAssignments: state.dykAssignments.map(a => a.id === id ? { ...a, ...fields } : a) })),
      deleteDykAssignment: (id) => set((state) => ({ dykAssignments: state.dykAssignments.filter(a => a.id !== id) })),
      setDykTeacherAvailability: (teacherId, days) => set((state) => ({
        dykTeacherAvailabilities: {
          ...state.dykTeacherAvailabilities,
          [teacherId]: days
        }
      })),
      setDykSchedule: (schedule) => set({ dykSchedule: schedule }),

      
      generateDykSchedule: () => {
        const { dykGroups, dykAssignments, dykTeacherAvailabilities, dykSettings, teachers, timetable, settings } = get();
        const res = solveDykSchedule({
          dykGroups,
          dykAssignments,
          dykTeacherAvailabilities,
          dykSettings,
          teachers,
          timetable,
          settings
        });
        set({
          dykSchedule: res.schedule,
          dykResult: {
            success: res.success,
            unassigned: res.unassigned,
            totalActivities: res.totalActivities,
            assignedCount: res.assignedCount,
            teacherSchoolAnalysis: res.teacherSchoolAnalysis
          }
        });
        return res;
      },
      clearDykSchedule: () => set({ dykSchedule: null, dykResult: null }),

      
      setDykResult: (newResult) => set((state) => ({ dykResult: { ...state.dykResult, ...newResult } })),

      // ==========================================
      // 🎓 OKUL ORTAK SINAV TAKVİMİ MODÜLÜ
      // ==========================================
      examSettings: {
        startDate: "2026-11-02",
        endDate: "2026-11-13",
        selectedDates: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"],
        examSlots: [3, 5],
        grades: ["9", "10", "11-SAY", "11-EA", "12-SAY", "12-EA"],
        schoolYear: "2026-2027",
        semester: "1",
        examNo: "1"
      },
      examSubjectsByGrade: DEFAULT_EXAM_SUBJECTS,
      examSchedule: null,
      examPlacements: null,
      examResult: null,
      examSupervisors: null,
      examSupervisorResult: null,

      updateExamSettings: (newSettings) => set((state) => ({ examSettings: { ...state.examSettings, ...newSettings } })),
      setExamSubjectsByGrade: (newSubjects) => set({ examSubjectsByGrade: newSubjects }),

      
      setExamPlacements: (newPlacements) => set((state) => {
        const grades = state.examSettings?.grades || ["9", "10", "11-SAY", "11-EA", "12-SAY", "12-EA"];
        const dates = state.examSettings?.selectedDates || [];
        const updatedSchedule = buildScheduleFromPlacements(newPlacements, grades, dates, state.examSubjectsByGrade);
        return {
          examPlacements: newPlacements,
          examSchedule: updatedSchedule
        };
      }),

      
      toggleExamSubjectMajor: (grade, subjectId) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        const targetSub = current.find(s => s.id === subjectId);
        if (!targetSub) return state;

        const nextIsMajor = !targetSub.isMajor;
        const targetNorm = (targetSub.name || '').trim().toLocaleLowerCase('tr-TR');

        const updatedByGrade = {};
        Object.entries(state.examSubjectsByGrade || {}).forEach(([g, list]) => {
          updatedByGrade[g] = (list || []).map(s => {
            const sNorm = (s.name || '').trim().toLocaleLowerCase('tr-TR');
            if (s.id === subjectId || (targetNorm && sNorm === targetNorm)) {
              return { ...s, isMajor: nextIsMajor };
            }
            return s;
          });
        });

        return {
          examSubjectsByGrade: updatedByGrade
        };
      }),

      
      updateExamSubjectMebConfig: (grade, subjectId, config = {}, applyToAllGrades = false) => set((state) => {
        const currentList = state.examSubjectsByGrade?.[grade] || [];
        const targetSub = currentList.find(s => s.id === subjectId);
        if (!targetSub) return state;

        const targetNorm = (targetSub.name || '').trim().toLocaleLowerCase('tr-TR');
        const sanitizePatch = (sub) => {
          const nextIsMeb = config.isMebExam !== undefined ? Boolean(config.isMebExam) : Boolean(sub.isMebExam);
          const nextDate = config.mebDate !== undefined ? (config.mebDate || null) : (sub.mebDate || null);
          const nextSlot = config.mebSlot !== undefined
            ? (config.mebSlot ? Number(config.mebSlot) : null)
            : (sub.mebSlot ? Number(sub.mebSlot) : null);

          return {
            ...sub,
            isMebExam: nextIsMeb,
            mebDate: nextIsMeb ? nextDate : null,
            mebSlot: nextIsMeb ? nextSlot : null
          };
        };

        const updatedByGrade = {};
        Object.entries(state.examSubjectsByGrade || {}).forEach(([g, list]) => {
          updatedByGrade[g] = (list || []).map(s => {
            const sNorm = (s.name || '').trim().toLocaleLowerCase('tr-TR');
            if (g === grade && s.id === subjectId) {
              return sanitizePatch(s);
            }
            if (applyToAllGrades && targetNorm && sNorm === targetNorm) {
              return sanitizePatch(s);
            }
            return s;
          });
        });

        return {
          examSubjectsByGrade: updatedByGrade
        };
      }),

      
      addExamSubject: (grade, subject) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        const subNorm = (subject.name || '').trim().toLocaleLowerCase('tr-TR');

        // Aynı kademede zaten varsa tekrar ekleme
        if (current.some(s => (s.name || '').trim().toLocaleLowerCase('tr-TR') === subNorm)) {
          return state;
        }

        const updatedByGrade = {};
        Object.entries(state.examSubjectsByGrade || {}).forEach(([g, list]) => {
          updatedByGrade[g] = (list || []).map(s => {
            const sNorm = (s.name || '').trim().toLocaleLowerCase('tr-TR');
            if (subNorm && sNorm === subNorm) {
              return { ...s, isMajor: !!subject.isMajor };
            }
            return s;
          });
        });

        updatedByGrade[grade] = [
          ...(updatedByGrade[grade] || []),
          { ...subject, id: newId('es'), isMajor: !!subject.isMajor }
        ];

        return {
          examSubjectsByGrade: updatedByGrade
        };
      }),

      
      deleteExamSubject: (grade, subjectId) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: current.filter(s => s.id !== subjectId)
          }
        };
      }),

      
      generateExamSchedule: () => {
        const { examSettings, examSubjectsByGrade, teachers, classrooms, timetable, settings } = get();
        const res = solveExamSchedule({
          startDate: examSettings.startDate,
          endDate: examSettings.endDate,
          selectedDates: examSettings.selectedDates,
          examSlots: examSettings.examSlots,
          grades: examSettings.grades,
          subjectsByGrade: examSubjectsByGrade,
          teachers: teachers || [],
          classrooms: classrooms || [],
          timetable: timetable || {},
          periodsPerDay: settings?.periodsPerDay || 8
        });
        set({
          examSchedule: res.schedule,
          examPlacements: res.placements,
          examResult: {
            success: res.success,
            unassigned: res.unassigned,
            workingDays: res.workingDays,
            examSlots: res.examSlots,
            firstSlot: res.firstSlot,
            totalSubjects: Number(res.totalSubjects) || 0
          }
        });
        return res;
      },
      generateExamSupervisors: (avoidSameBranch = true) => {
        const { examSchedule, examResult, classrooms, teachers, examSettings } = get();
        if (!examSchedule || !examResult?.workingDays) return null;
        const res = solveSupervisors({
          examSchedule,
          workingDays: examResult.workingDays,
          examSlots: examSettings.examSlots,
          classrooms,
          teachers,
          avoidSameBranch
        });
        set({
          examSupervisors: res.assignments,
          examSupervisorResult: {
            success: res.success,
            teacherDuties: res.teacherDuties,
            stats: res.stats
          }
        });
        return res;
      },
      updateExamSupervisorSlot: (date, slot, classroomId, teacherId) => set((state) => {
        const current = { ...(state.examSupervisors || {}) };
        if (!current[date]) current[date] = {};
        if (!current[date][slot]) current[date][slot] = {};
        current[date][slot][classroomId] = teacherId;
        return { examSupervisors: current };
      }),

      
      clearExamSchedule: () => set({ examSchedule: null, examPlacements: null, examResult: null, examSupervisors: null, examSupervisorResult: null }),

      
      clearExamSupervisors: () => set({ examSupervisors: null, examSupervisorResult: null })

    }),

      
    {
      name: 'okul-planlama-v4',
      version: 4,
      migrate: (persistedState: any, fromVersion: number) => {
        // v1→v2: dykSettings alanı eklendi
        if (fromVersion < 2) {
          persistedState.dykSettings = persistedState.dykSettings || {};
          persistedState.dykGroups = persistedState.dykGroups || [];
        }
        // v2→v3: examSettings alanları eklendi
        if (fromVersion < 3) {
          persistedState.examSettings = persistedState.examSettings || {};
          persistedState.examSubjectsByGrade = persistedState.examSubjectsByGrade || {};
        }
        // v3→v4: pinnedSlots ve softPrefs/hardPrefs kesinleşti
        if (fromVersion < 4) {
          persistedState.pinnedSlots = persistedState.pinnedSlots || [];
          persistedState.softPrefs = persistedState.softPrefs || {};
          persistedState.hardPrefs = persistedState.hardPrefs || {};
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const schoolName = (state.settings?.schoolName || '').toLowerCase();
        const isHzAyse = state.demoDataChoice === 'demo' || schoolName.includes('ayşe') || schoolName.includes('ayse');
        if (isHzAyse && state.teachers?.length > 0) {
          const SyncFlagKey = 'hz_ayse_pdf_criteria_v2_synced';
          try {
            if (!localStorage.getItem(SyncFlagKey)) {
              const seedById = new Map(REAL_TEACHERS.map((t) => [t.id, t]));
              state.teachers = state.teachers.map((t) => {
                const seed = seedById.get(t.id);
                if (!seed) return t;
                return {
                  ...t,
                  unavailable: seed.unavailable,
                  isExempt: seed.isExempt,
                  isAdministrator: seed.isAdministrator,
                  priorityFullDay: seed.priorityFullDay,
                  fillLateHours: seed.fillLateHours
                };
              });
              localStorage.setItem(SyncFlagKey, '1');
            }
          } catch (e) {}
        }
      },
      // 🛡️ 5MB localStorage kota patlamasını (QuotaExceededError) önleyen filtre:
      // Sadece kalıcı veritabanı alanları saklanır; anlık ve geçici veriler filtrelenir.
      partialize: (state) => ({
        demoDataChoice: state.demoDataChoice,
        settings: state.settings,
        teachers: state.teachers,
        classrooms: state.classrooms,
        timetable: state.timetable,
        softPrefs: state.softPrefs,
        hardPrefs: state.hardPrefs,
        pinnedSlots: state.pinnedSlots,
        dykSettings: state.dykSettings,
        dykGroups: state.dykGroups,
        dykAssignments: state.dykAssignments,
        dykTeacherAvailabilities: state.dykTeacherAvailabilities,
        dykSchedule: state.dykSchedule,
        examSettings: state.examSettings,
        examSubjectsByGrade: state.examSubjectsByGrade,
        examSchedule: state.examSchedule,
        examPlacements: state.examPlacements,
        examSupervisors: state.examSupervisors
      })
    }
  )
);

