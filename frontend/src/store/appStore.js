// frontend/src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { solveDykSchedule } from '../utils/dykEngine';
import { solveExamSchedule, solveSupervisors, DEFAULT_EXAM_SUBJECTS } from '../utils/examEngine';

// Backend adresi: .env dosyasındaki VITE_API_URL (boşsa yerel geliştirme sunucusu)
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

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


// 📊 CANLI METRİK VE PENCERE (BOŞLUK) HESAPLAMA MOTORU
// Manuel sürükle-bırak, silme veya taşıma işlemlerinde anında çalışarak dağıtım raporunu günceller.
export const calculateLiveMetrics = (timetable, teachers = [], classrooms = [], settings = {}) => {
  if (!timetable || Object.keys(timetable).length === 0) {
    return {
      totalRequired: 0,
      totalAssigned: 0,
      unassigned: 0,
      totalSchoolGaps: 0,
      averageSchoolGaps: 0,
      teachersAboveAverage: [],
      gapReport: {},
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
    fairnessColor
  };
};

// 🚨 CANLI İHLAL VE ÇAKIŞMA DENETİM MOTORU
// Manuel sürükle-bırak, ders taşıma veya silme yapıldığında anında çalışarak
// dağıtım motorunun "İhlaller ve Raporlar" panelini dinamik olarak günceller.
export const calculateLiveViolations = (timetable, teachers = [], classrooms = [], settings = {}, hardPrefs = {}) => {
  const violations = [];
  if (!timetable || Object.keys(timetable).length === 0) return violations;

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const maxGaps = hardPrefs?.maxGapsPerDay ?? 2;
  const minDaily = hardPrefs?.minDailyHours ?? 3;
  const enforceGaps = hardPrefs?.enforceMaxGaps !== false;
  const enforceBalance = hardPrefs?.enforceDailyBalance !== false;

  // 1. Öğretmenlerin haftalık toplam müfredat yükleri
  const teacherLoads = {};
  (teachers || []).forEach(t => { teacherLoads[t.id] = 0; });
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      if (co.teacherId && teacherLoads[co.teacherId] !== undefined) {
        teacherLoads[co.teacherId] += Number(co.hoursPerWeek) || 0;
      }
    });
  });

  // 2. Tablodaki yerleşimleri tara (Öğretmen ve Sınıf çakışmaları, kapalı saatler)
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

  // 3. Öğretmen bazlı ihlal denetimi (Boşluk sınırı, asgari ders saati, çakışma, kapalı saat)
  (teachers || []).forEach(t => {
    const load = teacherLoads[t.id] || 0;
    const isExempt = t.isExempt === true || (load <= 8 && load > 0);
    const isPartTime = t.isPartTime || load <= 12;

    const hours = {};
    days.forEach(d => {
      const assigned = teacherBusy[t.id]?.[d] || [];

      // Öğretmen çakışması (aynı saatte birden fazla sınıfta ders)
      const periodMap = {};
      assigned.forEach(item => {
        if (!periodMap[item.period]) periodMap[item.period] = [];
        periodMap[item.period].push(item.className);
      });
      Object.entries(periodMap).forEach(([p, classList]) => {
        if (classList.length > 1) {
          violations.push(`🚨 Öğretmen Çakışması: ${t.name} – ${d} ${p}. saatte ${classList.length} farklı sınıfta (${classList.join(', ')}) derse giriyor!`);
        }
      });

      // Kapalı saat ihlali
      const closed = t.unavailable?.[d] || [];
      assigned.forEach(item => {
        if (closed.includes(item.period)) {
          violations.push(`⛔ Kapalı Saat İhlali: ${t.name} – ${d} ${item.period}. saatte kapalı olmasına rağmen ${item.className} sınıfında dersi var.`);
        }
      });

      // Boşluk (pencere) kontrolü
      const pList = assigned.map(a => a.period).sort((a, b) => a - b);
      const uniquePeriods = Array.from(new Set(pList));
      hours[d] = uniquePeriods.length;

      if (uniquePeriods.length > 1) {
        const span = uniquePeriods[uniquePeriods.length - 1] - uniquePeriods[0] + 1;
        const g = span - uniquePeriods.length;
        if (!isExempt && !isPartTime && enforceGaps && g > maxGaps) {
          violations.push(`${t.name} – ${d}: ${g} boşluk (sınır ${maxGaps}).`);
        }
      }
    });

    // Günlük asgari ders saati kontrolü
    if (!isExempt && !isPartTime && enforceBalance && load > 0) {
      const activeDays = days.filter(d => (hours[d] || 0) > 0);
      const adaptiveMin = Math.min(minDaily, load);
      activeDays.forEach(d => {
        if (hours[d] < adaptiveMin) {
          violations.push(`${t.name} – ${d}: ${hours[d]} saat (asgari ${adaptiveMin}).`);
        }
      });
    }
  });

  return violations;
};

export const useAppStore = create(
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
        stemLatePenalty: 35
      },
      updateSoftPrefs: (newPrefs) => set((state) => ({ softPrefs: { ...state.softPrefs, ...newPrefs } })),

      hardPrefs: {
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
      generateResult: null,
      setGenerateResult: (result) => set({ generateResult: result }),

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

        set({ isGenerating: true, generateResult: null });

        try {
          const response = await fetch(`${API_URL}/solve`, {
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

          const data = await response.json();

          if (data.status === 'ok') {
            set({
              timetable: data.timetable,
              generateResult: {
                success: true,
                metrics: data.metrics,
                unassignedCount: data.metrics?.unassigned || 0,
                warnings: data.metrics?.violations || []
              },
              isGenerating: false
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
              isGenerating: false
            });
          }
        } catch (err) {
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
            isGenerating: false
          });
        }
      },

      // 🏫 HZ. AYŞE KIZ AİHL ÖRNEK VERİLERİ VS. MANUEL MOD EYLEMLERİ
      loadHzAyseDemoData: () => set({
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
      }),

      clearDataForManualEntry: () => set({
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
      }),

      setDemoDataChoice: (choice) => set({ demoDataChoice: choice }),
      resetDemoPrompt: () => set({ demoDataChoice: null }),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      addTeacher: (teacher) => set((state) => ({ teachers: [...state.teachers, { ...teacher, id: newId('t') }] })),
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
        set((state) => ({
          timetable: newTimetable,
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),
              ...liveMetrics,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
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
        set((state) => ({
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),
              ...liveMetrics,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
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
        startDate: "2025-11-03",
        endDate: "2025-11-14",
        selectedDates: ["2025-11-03", "2025-11-04", "2025-11-05", "2025-11-06", "2025-11-07", "2025-11-10", "2025-11-11", "2025-11-12", "2025-11-13", "2025-11-14"],
        examSlots: [3, 5],
        grades: ["9", "10", "11-SAY", "11-EA", "12"]
      },
      examSubjectsByGrade: DEFAULT_EXAM_SUBJECTS,
      examSchedule: null,
      examResult: null,
      examSupervisors: null,
      examSupervisorResult: null,

      updateExamSettings: (newSettings) => set((state) => ({ examSettings: { ...state.examSettings, ...newSettings } })),
      setExamSubjectsByGrade: (newSubjects) => set({ examSubjectsByGrade: newSubjects }),
      toggleExamSubjectMajor: (grade, subjectId) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: current.map(s => s.id === subjectId ? { ...s, isMajor: !s.isMajor } : s)
          }
        };
      }),
      addExamSubject: (grade, subject) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: [...current, { ...subject, id: newId('es') }]
          }
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
        const { examSettings, examSubjectsByGrade } = get();
        const res = solveExamSchedule({
          startDate: examSettings.startDate,
          endDate: examSettings.endDate,
          selectedDates: examSettings.selectedDates,
          examSlots: examSettings.examSlots,
          grades: examSettings.grades,
          subjectsByGrade: examSubjectsByGrade
        });
        set({
          examSchedule: res.schedule,
          examResult: {
            success: res.success,
            unassigned: res.unassigned,
            workingDays: res.workingDays,
            examSlots: res.examSlots,
            firstSlot: res.firstSlot,
            totalSubjects: res.totalSubjects
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
      clearExamSchedule: () => set({ examSchedule: null, examResult: null, examSupervisors: null, examSupervisorResult: null }),
      clearExamSupervisors: () => set({ examSupervisors: null, examSupervisorResult: null })

    }),
    {
      name: 'hz-ayse-timetable-v1',
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
        examSupervisors: state.examSupervisors
      })
    }
  )
);

