// frontend/src/utils/examEngine.js
/**
 * 🎓 OKUL ORTAK SINAV TAKVİMİ DAĞITIM MOTORU
 * 
 * MEB Kuralları & Kullanıcı Talepleri:
 * 1. Sınav tarih aralığı (Başlangıç ve Bitiş tarihleri arasındaki iş günleri).
 * 2. Sınav seansları (örn. 3. saat, 5. saat veya 2., 4. saat).
 * 3. 🚨 KRİTİK KURAL 1: Ana dersler aynı güne ASLA konmayacak! (Aynı sınıf için günde en fazla 1 ana ders).
 * 4. 🚨 KRİTİK KURAL 2: Ana ders varsa MUTLAKA günün ilk sınav seansına yerleştirilecek!
 * 5. Günde sınıf başına en fazla belirlenen seans sayısı kadar sınav yapılabilir.
 * 6. Dağıtım tüm sınıflar için dengeli ve çakışmasız planlanır.
 */

// İki tarih arasındaki hafta içi (Pazartesi-Cuma) günleri hesaplar
export const getWorkingDaysBetween = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const days = [];

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0: Pazar, 6: Cumartesi
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      days.push({
        date: dateStr,
        dayName: dayNames[dayOfWeek],
        formatted: `${day}.${month}.${year} ${dayNames[dayOfWeek]}`
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

/**
 * Tek bir tarih dizesini (YYYY-MM-DD) takvim gün objesine dönüştürür
 */
export const formatExamDay = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'object' && dateStr.date) return dateStr;
  
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const dayOfWeek = d.getDay();
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return {
    date: dateStr,
    dayName: dayNames[dayOfWeek],
    formatted: `${day}.${month}.${year} ${dayNames[dayOfWeek]}`
  };
};

/**
 * 🛡️ Türkçe karakter, kesme işareti ve boşluk duyarsız kanonik metin normalizasyonu
 */
export const normalizeTr = (str = '') => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/['’`´]/g, '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .replace(/i̇/g, 'i')
    .replace(/\s+/g, ' ');
};

/**
 * 🛡️ MEB Ders Adı / Kodu -> Öğretmen Branş Kodu (teacher.branch) Eşleştirme Haritası
 */
export const SUBJECT_BRANCH_MAP = {
  'türk dili ve edebiyatı': ['TDEB', 'EDEB', 'EDEBİYAT', 'TÜRKÇE'],
  'seçmeli edebiyat': ['TDEB', 'EDEB'],
  'seçmeli türk dili ve edebiyatı': ['TDEB', 'EDEB'],
  'edebiy': ['TDEB', 'EDEB'],
  'tdeb': ['TDEB', 'EDEB'],
  'stedb': ['TDEB', 'EDEB'],
  'osmanlı türkçesi': ['TDEB', 'IHL', 'TAR'],
  'o.tür2': ['TDEB', 'IHL'],
  'o.tur2': ['TDEB', 'IHL'],
  'o.tür1': ['TDEB', 'IHL'],

  'matematik': ['MAT', 'MATEMATİK', 'GEOM'],
  'temel matematik': ['MAT', 'MATEMATİK'],
  'mat': ['MAT'],
  'mat10': ['MAT'],
  'mat4': ['MAT'],
  't.mat2': ['MAT'],

  'fizik': ['FİZ', 'FIZ', 'FİZİK'],
  'fizk': ['FİZ', 'FIZ'],

  'kimya': ['KIM', 'KİM', 'KİMYA', 'KMYA'],
  'kim9': ['KIM', 'KİM'],
  'kmya': ['KIM', 'KİM'],

  'biyoloji': ['BIO', 'BİY', 'BİYO', 'BİYOLOJİ'],
  'biy': ['BIO', 'BİY'],
  'biyo': ['BIO', 'BİY'],
  'sağlık bilgisi': ['BIO', 'BİY', 'SAĞLIK'],
  'sağlık bilgisi ve trafik kültürü': ['BIO', 'BİY', 'SAĞLIK'],
  '9sag': ['BIO', 'BİY'],

  'tarih': ['TAR', 'TARİH'],
  't.c. inkılap tarihi ve atatürkçülük': ['TAR', 'TARİH'],
  'inkıla': ['TAR', 'TARİH'],
  'inkila': ['TAR', 'TARİH'],
  'çağdaş türk ve dünya tarihi': ['TAR', 'TARİH'],
  'ctdt2': ['TAR', 'TARİH'],

  'coğrafya': ['COG', 'COĞ', 'COĞRAFYA'],
  'cogh2': ['COG', 'COĞ'],
  'coğrfy': ['COG', 'COĞ'],
  'cogrfy': ['COG', 'COĞ'],

  'felsefe': ['FEL', 'FELSEFE', 'PSK'],
  'felh1': ['FEL', 'FELSEFE'],
  '11fel': ['FEL', 'FELSEFE'],
  'psikoloji': ['FEL', 'PSK', 'PSİKOLOJİ'],
  'psko': ['FEL', 'PSK'],

  'ingilizce': ['ING', 'İNG', 'İNGİLİZCE'],
  '9ing': ['ING', 'İNG'],
  'ing1': ['ING', 'İNG'],

  'arapça': ['ARP', 'ARAPÇA', 'IHL'],
  'mesleki arapça': ['IHL', 'ARP', 'ARAPÇA'],
  'arp9': ['ARP', 'IHL'],
  'arp10': ['ARP', 'IHL'],
  'marp11': ['IHL', 'ARP'],
  'arapç3': ['ARP', 'IHL'],

  'kuran-ı kerim': ['IHL', 'DİKAB', 'KURAN'],
  'kuranı kerim': ['IHL', 'DİKAB', 'KURAN'],
  'kuran': ['IHL', 'DİKAB'],
  'kkrim': ['IHL', 'DİKAB'],
  'kker': ['IHL', 'DİKAB'],
  'kker11': ['IHL', 'DİKAB'],
  'temel dini bilgiler': ['IHL', 'DİKAB'],
  'tdb': ['IHL', 'DİKAB'],
  'siyer': ['IHL', 'DİKAB'],
  'hadis': ['IHL', 'DİKAB'],
  'fıkıh': ['IHL', 'DİKAB'],
  'fikih': ['IHL', 'DİKAB'],
  'tefsir': ['IHL', 'DİKAB'],
  'akaid': ['IHL', 'DİKAB'],
  'hitabet': ['IHL', 'DİKAB'],
  'hitabet ve mesleki uygulama': ['IHL', 'DİKAB'],
  'hitab': ['IHL', 'DİKAB'],
  'kelam': ['IHL', 'DİKAB'],
  'islam kültür ve medeniyeti': ['IHL', 'DİKAB', 'TAR'],
  'ikmed': ['IHL', 'DİKAB'],
  'dinler tarihi': ['IHL', 'DİKAB'],
  'dint': ['IHL', 'DİKAB'],

  'görsel sanatlar': ['GSBD', 'GÖRSEL', 'MÜZİK', 'BEDEN'],
  'beden eğitimi': ['GSBD', 'BEDEN'],
  'müzik': ['GSBD', 'MÜZİK'],
  'gs1': ['GSBD'],
  'gsbd': ['GSBD']
};

/**
 * 🛡️ Bir öğretmenin belirli bir günde (Pazartesi..Cuma) okulda olup olmadığını denetler.
 * - Öğretmen kısıt tablosunda o günün tamamını (veya >=6 saati) kapattıysa okulda yoktur.
 * - Aktif ders programı (timetable) doluysa ve öğretmene okul genelinde ders atanmışsa:
 *   o gün en az 1 dersi varsa okulda kabul edilir.
 */
export const isTeacherPresentOnDay = (teacher, dayName, timetable = {}, periodsPerDay = 8) => {
  if (!teacher || !dayName) return false;

  const maxPeriods = Number(periodsPerDay) || 8;
  const closedHours = Array.isArray(teacher.unavailable?.[dayName]) ? teacher.unavailable[dayName] : [];

  // 1. Öğretmen kısıt tablosunda o günün tamamını (veya >=6 saati) kapattıysa okulda yoktur
  if (closedHours.length >= maxPeriods || closedHours.length >= 6) {
    return false;
  }

  // 2. Aktif timetable (ders programı) kontrolü
  const hasTimetableData = timetable && typeof timetable === 'object' && Object.keys(timetable).length > 0;
  if (hasTimetableData) {
    let teacherTotalAssignedInSchool = 0;
    let teacherAssignedOnTargetDay = 0;

    for (const classId of Object.keys(timetable)) {
      const classDays = timetable[classId];
      if (!classDays || typeof classDays !== 'object') continue;

      for (const [dName, slots] of Object.entries(classDays)) {
        if (!Array.isArray(slots)) continue;
        for (const s of slots) {
          if (s && s.teacherId === teacher.id) {
            teacherTotalAssignedInSchool++;
            if (dName === dayName) {
              teacherAssignedOnTargetDay++;
            }
          }
        }
      }
    }

    if (teacherTotalAssignedInSchool > 0) {
      return teacherAssignedOnTargetDay > 0;
    }
  }

  return true;
};

/**
 * 🛡️ Bir sınav dersi için ilgili zümre öğretmenlerini bulur (SUBJECT_BRANCH_MAP + classrooms hibrit tespiti).
 */
export const getSubjectBranchTeachers = (
  subjectName,
  subjectCode = '',
  teachers = [],
  classrooms = []
) => {
  if (!Array.isArray(teachers) || teachers.length === 0) return [];

  const normName = normalizeTr(subjectName);
  const normCode = normalizeTr(subjectCode);

  const targetBranches = new Set();
  if (normName && SUBJECT_BRANCH_MAP[normName]) {
    SUBJECT_BRANCH_MAP[normName].forEach(b => targetBranches.add(normalizeTr(b)));
  }
  if (normCode && SUBJECT_BRANCH_MAP[normCode]) {
    SUBJECT_BRANCH_MAP[normCode].forEach(b => targetBranches.add(normalizeTr(b)));
  }

  if (targetBranches.size === 0 && normName) {
    Object.entries(SUBJECT_BRANCH_MAP).forEach(([key, branches]) => {
      if (key.length >= 4 && (normName.includes(key) || key.includes(normName))) {
        branches.forEach(b => targetBranches.add(normalizeTr(b)));
      }
    });
  }

  const assignedTeacherIds = new Set();
  if (Array.isArray(classrooms)) {
    classrooms.forEach(cls => {
      (cls?.courses || []).forEach(co => {
        if (!co?.teacherId) return;
        const coSubNorm = normalizeTr(co.subject);
        const coCodeNorm = normalizeTr(co.code);
        if (
          (normName && (coSubNorm === normName || coCodeNorm === normName)) ||
          (normCode && (coSubNorm === normCode || coCodeNorm === normCode)) ||
          (normName && coSubNorm && SUBJECT_BRANCH_MAP[coSubNorm] && SUBJECT_BRANCH_MAP[normName] &&
            SUBJECT_BRANCH_MAP[coSubNorm][0] === SUBJECT_BRANCH_MAP[normName][0])
        ) {
          assignedTeacherIds.add(co.teacherId);
        }
      });
    });
  }

  return teachers.filter(t => {
    if (!t) return false;
    if (assignedTeacherIds.has(t.id)) return true;
    const tBranchNorm = normalizeTr(t.branch);
    if (!tBranchNorm) return false;
    if (targetBranches.has(tBranchNorm)) return true;
    if (normName && (normName.includes(tBranchNorm) || tBranchNorm.includes(normName))) return true;
    return false;
  });
};

/**
 * 🛡️ Belirli bir günde ilgili dersin zümresinden EN AZ BİR öğretmenin okulda olup olmadığını kontrol eder.
 */
export const checkBranchAvailabilityOnDay = ({
  subjectName,
  subjectCode = '',
  dateOrDayName,
  teachers = [],
  classrooms = [],
  timetable = {},
  periodsPerDay = 8
}) => {
  let dayName = dateOrDayName;
  if (typeof dateOrDayName === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrDayName)) {
    const formatted = formatExamDay(dateOrDayName);
    dayName = formatted?.dayName || '';
  }

  const branchTeachers = getSubjectBranchTeachers(subjectName, subjectCode, teachers, classrooms);

  if (branchTeachers.length === 0) {
    return {
      isAvailable: true,
      hasTeachers: false,
      totalBranchTeachers: 0,
      availableTeachers: [],
      unavailableTeachers: [],
      dayName
    };
  }

  const availableTeachers = [];
  const unavailableTeachers = [];

  branchTeachers.forEach(t => {
    if (isTeacherPresentOnDay(t, dayName, timetable, periodsPerDay)) {
      availableTeachers.push(t);
    } else {
      unavailableTeachers.push(t);
    }
  });

  return {
    isAvailable: availableTeachers.length > 0,
    hasTeachers: true,
    totalBranchTeachers: branchTeachers.length,
    availableTeachers,
    unavailableTeachers,
    dayName
  };
};

/**
 * 🚀 Performans için Gün x Ders Bazında Zümre Uygunluk Önbelleklemesi (Precomputed Availability Cache)
 */
export const buildBranchAvailabilityCache = ({
  courses = [],
  workingDays = [],
  teachers = [],
  classrooms = [],
  timetable = {},
  periodsPerDay = 8
}) => {
  const cache = new Map();

  courses.forEach(course => {
    const normName = normalizeTr(course.name);
    if (!normName) return;
    workingDays.forEach(dayObj => {
      const dateStr = typeof dayObj === 'string' ? dayObj : dayObj.date;
      const dayName = typeof dayObj === 'string' ? (formatExamDay(dayObj)?.dayName || '') : dayObj.dayName;
      const key = `${normName}__${dateStr}`;
      if (!cache.has(key)) {
        cache.set(
          key,
          checkBranchAvailabilityOnDay({
            subjectName: course.name,
            subjectCode: course.code || '',
            dateOrDayName: dayName || dateStr,
            teachers,
            classrooms,
            timetable,
            periodsPerDay
          })
        );
      }
    });
  });

  return cache;
};

/**
 * Yerleşim (placements) listesinden grade -> date -> slot -> subjectObj yapısını üretir
 */
export const buildScheduleFromPlacements = (placements = [], grades = [], workingDays = [], subjectsByGrade = {}) => {
  const schedule = {};
  grades.forEach(grade => {
    schedule[grade] = {};
    workingDays.forEach(day => {
      const dateStr = typeof day === 'string' ? day : day.date;
      schedule[grade][dateStr] = {};
    });
  });

  placements.forEach(p => {
    if (!p || !p.date || p.slot === undefined || p.slot === null) return;
    const levels = p.levels || p.levelIds || [];
    levels.forEach(grade => {
      if (!schedule[grade]) schedule[grade] = {};
      if (!schedule[grade][p.date]) schedule[grade][p.date] = {};
      const gradeSub = (subjectsByGrade[grade] || []).find(
        s => normalizeTr(s.name) === normalizeTr(p.name)
      );
      schedule[grade][p.date][p.slot] = {
        id: gradeSub?.id || p.courseId || p.id,
        name: p.name,
        code: gradeSub?.code || p.code || '',
        isMajor: !!(p.isMajor ?? gradeSub?.isMajor),
        isMebExam: !!(p.isMebExam ?? gradeSub?.isMebExam),
        mebDate: p.mebDate || gradeSub?.mebDate || null,
        mebSlot: p.mebSlot || gradeSub?.mebSlot || null,
        slot: Number(p.slot),
        placementId: p.id
      };
    });
  });

  return schedule;
};

/**
 * Mevcut grade -> date -> slot -> subjectObj yapısından birleştirilmiş placements listesini üretir
 */
export const buildPlacementsFromSchedule = (schedule = {}, grades = [], examSlots = []) => {
  if (!schedule || typeof schedule !== 'object') return [];
  const grouped = new Map(); // key: `${date}__${slot}__${normName}__${isMebFlag}`

  const activeGrades = grades.length > 0 ? grades : Object.keys(schedule);
  activeGrades.forEach(grade => {
    const gradeDates = schedule[grade] || {};
    Object.entries(gradeDates).forEach(([dateStr, slotsMap]) => {
      Object.entries(slotsMap || {}).forEach(([slotKey, sub]) => {
        if (!sub || !sub.name) return;
        const slotNum = Number(slotKey);
        if (examSlots.length > 0 && !examSlots.includes(slotNum) && !sub.isMebExam) return;
        const normName = sub.name.trim().toLocaleUpperCase('tr-TR');
        const isMebFlag = sub.isMebExam ? 'MEB' : 'SCH';
        const mapKey = `${dateStr}__${slotNum}__${normName}__${isMebFlag}`;
        if (!grouped.has(mapKey)) {
          grouped.set(mapKey, {
            id: sub.placementId || `pl_${dateStr}_${slotNum}_${normName.replace(/[^A-Z0-9]/g, '')}_${isMebFlag}`,
            courseId: sub.id,
            name: normName,
            code: sub.code || '',
            isMajor: !!sub.isMajor,
            isMebExam: !!sub.isMebExam,
            mebDate: sub.mebDate || (sub.isMebExam ? dateStr : null),
            mebSlot: sub.mebSlot || (sub.isMebExam ? slotNum : null),
            levels: [grade],
            date: dateStr,
            slot: slotNum
          });
        } else {
          const item = grouped.get(mapKey);
          if (!item.levels.includes(grade)) {
            item.levels.push(grade);
          }
          if (sub.isMajor) item.isMajor = true;
          if (sub.isMebExam) item.isMebExam = true;
        }
      });
    });
  });

  return Array.from(grouped.values());
};

/**
 * Bir dersin kaç farklı ana sınıf kademesinde (9, 10, 11, 12) okutulduğunu hesaplar.
 * Örn: ["11-SAY", "11-EA"] -> sadece "11" kademesi (1 ana kademe).
 * Örn: ["9", "10", "11-SAY", "12"] -> 4 farklı ana kademe (Okul geneli ortak ders).
 */
const getDistinctBaseGradesCount = (course) => {
  if (!Array.isArray(course?.levels) || course.levels.length === 0) return 0;
  const baseGrades = new Set(course.levels.map(l => String(l).split('-')[0].trim()));
  return baseGrades.size;
};

/**
 * Dersin öncelik katmanını belirler:
 * 1: Ana Dersler (Matematik, Edebiyat, Fizik, Kimya, Biyoloji)
 * 2: Kademeler Arası (Okul Geneli) Ortak Dersler (!isMajor && distinctBaseGrades >= 2)
 * 3: Tek Kademe / Alan Lokal Dersleri (!isMajor && distinctBaseGrades === 1; örn: Hadis, Siyer, Fıkıh, Psikoloji, Seçmeli Edebiyat, Kelam vb.)
 */
const getCourseTier = (course) => {
  if (course.isMajor) return 1;
  if (getDistinctBaseGradesCount(course) >= 2) return 2;
  return 3;
};

/**
 * Bir dersin zümre öğretmenlerinin kaç sınav gününde okulda (açık) olduğunu sayar.
 * Daha az açık günü olan (daha kısıtlı) dersler kendi katmanı içinde öncelik alır.
 */
const countOpenDaysForCourse = (course, validDates, availabilityCache) => {
  if (!availabilityCache || course.isMebExam) return validDates.length;
  const normName = normalizeTr(course.name);
  let openCount = 0;
  for (const date of validDates) {
    const info = availabilityCache.get(`${normName}__${date}`);
    if (!info || !info.hasTeachers || info.isAvailable) {
      openCount++;
    }
  }
  return openCount;
};

/**
 * Katman hiyerarşisini (Tier 1 -> Tier 2 -> Tier 3) ASLA bozmadan çoklu geçiş (multi-pass)
 * aday ders dizilimleri üretir. Böylece lokal dersler hiçbir zaman ortak derslerin önüne geçemez.
 */
const buildTieredCourseOrders = (unifiedCourses, validDates, availabilityCache, passCount = 8) => {
  const openDayMap = new Map();
  unifiedCourses.forEach(c => {
    openDayMap.set(c.name, countOpenDaysForCourse(c, validDates, availabilityCache));
  });

  const tier1 = unifiedCourses.filter(c => getCourseTier(c) === 1);
  const tier2 = unifiedCourses.filter(c => getCourseTier(c) === 2);
  const tier3 = unifiedCourses.filter(c => getCourseTier(c) === 3);

  const baseSort = (a, b) => {
    // 1. Önce kapsadığı farklı ana kademe sayısı (9, 10, 11, 12) yüksek olanlar
    const baseDiff = getDistinctBaseGradesCount(b) - getDistinctBaseGradesCount(a);
    if (baseDiff !== 0) return baseDiff;
    // 2. Sonra toplam grup/alan sayısı (levels.length) yüksek olanlar
    if (b.levels.length !== a.levels.length) {
      return b.levels.length - a.levels.length;
    }
    // 3. Zümre açık gün sayısı daha az (daha kısıtlı) olanlar
    const openA = openDayMap.get(a.name) ?? validDates.length;
    const openB = openDayMap.get(b.name) ?? validDates.length;
    if (openA !== openB) {
      return openA - openB;
    }
    return a.name.localeCompare(b.name, 'tr-TR');
  };

  const t1Sorted = [...tier1].sort(baseSort);
  const t2Sorted = [...tier2].sort(baseSort);
  const t3Sorted = [...tier3].sort(baseSort);

  const orders = [
    // Geçiş 1: Tam deterministik ideal sıra (Kademe sayısı azalan + Zümre kısıtı artan)
    [...t1Sorted, ...t2Sorted, ...t3Sorted],
    // Geçiş 2: Zümre kısıtı en dar olanlar önce (kendi katmanı içinde)
    [
      ...[...tier1].sort((a, b) => (openDayMap.get(a.name) - openDayMap.get(b.name)) || (b.levels.length - a.levels.length)),
      ...[...tier2].sort((a, b) => (openDayMap.get(a.name) - openDayMap.get(b.name)) || (b.levels.length - a.levels.length)),
      ...[...tier3].sort((a, b) => (openDayMap.get(a.name) - openDayMap.get(b.name)) || (b.levels.length - a.levels.length))
    ]
  ];

  // Deterministik pseudo-random karıştırıcı (Her katmanı SADECE kendi içinde karıştırır, seviye alt-gruplarını korur)
  let seed = 42;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const shuffleWithinLevelCount = (arr) => {
    const byLen = new Map();
    arr.forEach(item => {
      const len = item.levels.length;
      if (!byLen.has(len)) byLen.set(len, []);
      byLen.get(len).push(item);
    });
    const sortedLens = Array.from(byLen.keys()).sort((a, b) => b - a);
    const result = [];
    sortedLens.forEach(len => {
      const group = [...byLen.get(len)];
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(nextRand() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
      result.push(...group);
    });
    return result;
  };

  for (let p = 2; p < passCount; p++) {
    orders.push([
      ...shuffleWithinLevelCount(t1Sorted),
      ...shuffleWithinLevelCount(t2Sorted),
      ...shuffleWithinLevelCount(t3Sorted)
    ]);
  }

  return orders;
};

/**
 * Bir dersin aday (date, slot) hücresine yerleştirilmesinin denge maliyetini (cost) hesaplar.
 * En düşük maliyetli hücre seçilir (Best-Fit Balanced Daily Cap):
 * - Önce tüm günlere 1'er sınav yayılır (0 sınav olan günler en ucuzdur),
 * - Sonra günlere 2. sınavlar dengeli dağıtılır (ilk 2 seans tercih edilir),
 * - Mecbur kalınırsa 3. sınav (veya 3. seans) yalnızca en sona kalan lokal dersler için kullanılır.
 */
const evaluatePlacementCost = ({
  course,
  date,
  dateIndex,
  totalDays,
  slot,
  slotIndex,
  placements
}) => {
  const dayPlacements = placements.filter(p => p.date === date);

  // İlgili dersin kademelerinin (levels) bu gündeki mevcut sınav sayıları
  let maxDailyForCourseLevels = 0;
  let sumDailyForCourseLevels = 0;
  let hasMajorOnDayForLevels = false;

  for (const level of course.levels) {
    let levelCount = 0;
    for (const p of dayPlacements) {
      if (p.levels.includes(level)) {
        levelCount++;
        if (p.isMajor) hasMajorOnDayForLevels = true;
      }
    }
    if (levelCount > maxDailyForCourseLevels) {
      maxDailyForCourseLevels = levelCount;
    }
    sumDailyForCourseLevels += levelCount;
  }

  // Okul genelinde o günkü toplam sınav yükü (kart sayısı ve kademe-sınav toplamı)
  const schoolDailyCardsCount = dayPlacements.length;
  const schoolDailyLevelLoad = dayPlacements.reduce((acc, p) => acc + (p.levels?.length || 1), 0);

  let cost = 0;

  // 1. KADEMELİ GÜNLÜK LİMİT (PROGRESSIVE DAILY CAP) MALİYETİ:
  // Kademe 1: O gün ilgili sınıfların hiç sınavı yoksa (0 -> 1. sınav) -> Maliyet 0
  // Kademe 2: O gün ilgili sınıfların 1 sınavı varsa (1 -> 2. sınav) -> Orta maliyet (+450)
  // Kademe 3: O gün ilgili sınıfların zaten 2 (veya daha fazla) sınavı varsa (2 -> 3. sınav) -> Çok ağır ceza (+12.000)
  if (maxDailyForCourseLevels === 0) {
    cost += 0;
  } else if (maxDailyForCourseLevels === 1) {
    cost += 450 + (sumDailyForCourseLevels * 95);
  } else {
    // 3. sınav (veya üstü): 2 sınavlık yer varken asla tercih edilmez!
    cost += 12000 + (maxDailyForCourseLevels * 4000) + (sumDailyForCourseLevels * 300);
  }

  // 2. SEANS (SLOT INDEX) TERCİHİ VE 3. SEANS KORUMASI:
  const distinctBaseGrades = getDistinctBaseGradesCount(course);
  const isMultiGradeShared = distinctBaseGrades >= 2;
  const isSingleGradeMultiTrack = distinctBaseGrades === 1 && (course.levels?.length || 0) >= 2;

  if (slotIndex === 0) {
    // 1. seans: Ana dersler için ideal, diğer dersler için doğal tercih
    cost += course.isMajor ? -60 : 0;
  } else if (slotIndex === 1) {
    // 2. seans: Ana dersler 1. seansı tercih etsin (+140), diğer dersler için çok küçük fark (+18)
    cost += course.isMajor ? 140 : 18;
  } else {
    // 3. seans (slotIndex >= 2): İlk 2 seansta yer varken 3. seans kullanılmasın!
    cost += 4500 + (slotIndex * 500);
    // Okul geneli kademeler arası ortak derslerin (distinctBaseGrades >= 2) veya Ana derslerin 3. seansa konmasına ekstra ağır ceza!
    if (isMultiGradeShared) {
      cost += 25000 + (distinctBaseGrades * 3000);
    } else if (isSingleGradeMultiTrack) {
      cost += 6000;
    }
    if (course.isMajor) {
      cost += 35000;
    }
  }

  // 3. OKUL GENELİ GÜNLÜK DENGE (TÜM GÜNLERE HOMOJEN YAYILIM):
  // Hiç sınav olmayan günlere öncelik vererek hiçbir günün boş kalmamasını sağlar
  if (schoolDailyCardsCount === 0) {
    cost -= 500;
  }
  cost += (schoolDailyLevelLoad * 28) + (schoolDailyCardsCount * 45);

  // 4. ANA DERS / ZORLUK DENGESİ VE ALAN (11-SAY / 11-EA & 12-SAY / 12-EA) ÇAPRAZ BLOKAJ ÖNLEME:
  // Bir sınıfta o gün zaten bir Ana Ders (isMajor) varsa, yanına 2. sınav olarak
  // okul geneli ağır ortak ders yerine mümkünse daha hafif derslerin gelmesini teşvik et
  if (hasMajorOnDayForLevels && isMultiGradeShared) {
    cost += 65;
  }

  // Alan Çapraz Blokaj Önleme (Sibling Track Alignment):
  // Örn: Bir günde 1. seansta Fizik (9,10,11-SAY,12-SAY) varken 2. seansa Coğrafya (9,10,11-EA,12-EA) konursa,
  // o günün hem 1. seansı hem 2. seansı ortak derslere kapanır!
  // Bunu önlemek için, aynı seansta (slot) paralel yerleşimi ödüllendir, farklı seansta çapraz blokajı cezalandır.
  const checkSiblingTrack = (trackSay, trackEa) => {
    const hasSay = course.levels.includes(trackSay);
    const hasEa = course.levels.includes(trackEa);
    if (hasSay !== hasEa) {
      const oppositeTrack = hasSay ? trackEa : trackSay;
      const sameSlotOpposite = dayPlacements.some(
        p => Number(p.slot) === Number(slot) && p.levels.includes(oppositeTrack) && !p.levels.includes(hasSay ? trackSay : trackEa)
      );
      const diffSlotOppositeOnly = dayPlacements.some(
        p => Number(p.slot) !== Number(slot) && p.levels.includes(oppositeTrack) && !p.levels.includes(hasSay ? trackSay : trackEa)
      );
      if (sameSlotOpposite) {
        cost -= 180; // Aynı seansta SAY ve EA paralel sınav oluyor -> Harika!
      } else if (diffSlotOppositeOnly) {
        cost += 900; // Farklı seansta SAY ve EA çaprazlanıp iki seansı birden kapatıyor -> Kaçın!
      }
    }
  };
  checkSiblingTrack('11-SAY', '11-EA');
  checkSiblingTrack('12-SAY', '12-EA');

  // 5. GÜNLER ARASI EŞİTLİK BOZUCU (TIE-BREAKER):
  // Maliyetler eşit olduğunda ilk günlere yığılmak yerine takvime homojen dağılım
  cost += (dateIndex / Math.max(1, totalDays)) * 5;

  return cost;
};

/**
 * Üretilen bir sınav takviminin genel kalite ve denge puanını hesaplar (Düşük puan = Daha iyi takvim).
 * Çoklu geçiş (multi-pass) sonucunda en dengeli takvimi seçmek için kullanılır.
 */
const evaluateScheduleQuality = ({ placements, unplacedCourses, validDates, sortedSlots, grades }) => {
  // 1. Yerleşemeyen ders/kademe sayısı (En kritik kriter)
  const unplacedLevelCount = unplacedCourses.reduce((acc, c) => acc + (c.levels?.length || 1), 0);

  // 2. Boş kalan gün sayısı
  let emptyDaysCount = 0;
  const dailyLoads = [];

  for (const date of validDates) {
    const dayCards = placements.filter(p => p.date === date);
    if (dayCards.length === 0) emptyDaysCount++;
    const load = dayCards.reduce((acc, p) => acc + (p.levels?.length || 1), 0);
    dailyLoads.push(load);
  }

  // 3. 3. sınava kalan sınıf-gün sayısı ve 3. seanstaki okul geneli ortak ders sayısı
  let thirdExamGradeDayInstances = 0;
  let sharedInThirdSlotCount = 0;
  const thirdSlotValues = new Set(sortedSlots.slice(2).map(Number));

  for (const p of placements) {
    if (!p.isMebExam && thirdSlotValues.has(Number(p.slot)) && getDistinctBaseGradesCount(p) >= 2) {
      sharedInThirdSlotCount++;
    }
  }

  for (const date of validDates) {
    const dayCards = placements.filter(p => p.date === date);
    for (const grade of grades) {
      const cnt = dayCards.filter(p => p.levels.includes(grade)).length;
      if (cnt >= 3) {
        thirdExamGradeDayInstances += (cnt - 2);
      }
    }
  }

  // 4. Günlük sınav yükü standart sapması / varyansı (Denge ölçütü)
  const avgLoad = dailyLoads.reduce((a, b) => a + b, 0) / Math.max(1, dailyLoads.length);
  const variance = dailyLoads.reduce((acc, val) => acc + Math.pow(val - avgLoad, 2), 0) / Math.max(1, dailyLoads.length);

  return (
    unplacedLevelCount * 10000000 +
    sharedInThirdSlotCount * 500000 +
    thirdExamGradeDayInstances * 50000 +
    emptyDaysCount * 25000 +
    variance * 100
  );
};

/**
 * Tek bir ders sıralaması için ortak sınav yerleştirme denemesi (Best-Fit Balanced Daily Cap algoritması)
 */
const runSinglePassSchedule = ({
  courses,
  fixedPlacements = [],
  validDates,
  sortedSlots,
  maxExamsPerDay,
  availabilityCache = null,
  enforceGroupRule = true,
  enforceBranchAvailability = true
}) => {
  // MEB ortak sınavları başlangıçta sabitlenmiş olarak başlar
  const placements = fixedPlacements.map(fp => ({
    ...fp,
    levels: [...(fp.levels || [])]
  }));
  const unplacedCourses = [];
  const totalDays = validDates.length;

  for (const course of courses) {
    const normCourseName = normalizeTr(course.name);
    let bestCandidate = null;
    let bestCost = Infinity;

    for (let dateIndex = 0; dateIndex < totalDays; dateIndex++) {
      const date = validDates[dateIndex];

      // KURAL 4: Zümre Öğretmeni Okulda Bulunma Zorunluluğu (MEB sınavı olmayan dersler için)
      if (enforceBranchAvailability && !course.isMebExam && availabilityCache) {
        const cacheKey = `${normCourseName}__${date}`;
        const branchInfo = availabilityCache.get(cacheKey);
        if (branchInfo && branchInfo.hasTeachers && !branchInfo.isAvailable) {
          continue; // O gün bu zümreden hiçbir öğretmen okulda değil, bu günü atla!
        }
      }

      for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex++) {
        const slot = sortedSlots[slotIndex];
        let hasConflict = false;

        for (const level of course.levels) {
          // KURAL 1: Günde Maksimum Sınav Kuralı (Hard Limit)
          const dailyExamsCount = placements.filter(
            p => p.date === date && p.levels.includes(level)
          ).length;
          if (dailyExamsCount >= maxExamsPerDay) {
            hasConflict = true;
            break;
          }

          // KURAL 2: Aynı saatte (aynı slot) bu sınıfın başka sınavı var mı?
          const slotOccupied = placements.some(
            p => p.date === date && Number(p.slot) === Number(slot) && p.levels.includes(level)
          );
          if (slotOccupied) {
            hasConflict = true;
            break;
          }

          // KURAL 3: Ana Dersler Aynı Güne Çakışamaz Kuralı
          if (enforceGroupRule && course.isMajor) {
            const hasAnotherMajor = placements.some(
              p => p.date === date && p.isMajor && p.levels.includes(level)
            );
            if (hasAnotherMajor) {
              hasConflict = true;
              break;
            }
          }
        }

        if (!hasConflict) {
          const candidateCost = evaluatePlacementCost({
            course,
            date,
            dateIndex,
            totalDays,
            slot,
            slotIndex,
            placements
          });

          if (candidateCost < bestCost) {
            bestCost = candidateCost;
            bestCandidate = { date, slot: Number(slot) };
          }
        }
      }
    }

    if (bestCandidate) {
      placements.push({
        id: `pl_${course.id}_${Math.random().toString(36).substring(2, 7)}`,
        courseId: course.id,
        name: course.name,
        code: course.code || '',
        isMajor: !!course.isMajor,
        isMebExam: false,
        levels: [...course.levels],
        date: bestCandidate.date,
        slot: bestCandidate.slot
      });
    } else {
      unplacedCourses.push(course);
    }
  }

  return { placements, unplacedCourses };
};

/**
 * Otomatik Ortak Sınav Dağıtım Fonksiyonu
 */
export const solveExamSchedule = ({
  startDate,
  endDate,
  selectedDates = null, // Kullanıcının takvimden bizzat seçtiği günler
  examSlots = [3, 5], // Sınavın yapılacağı ders saatleri (örn: 3. ve 5. ders)
  grades = ["9", "10", "11-SAY", "11-EA", "12-SAY", "12-EA"],
  subjectsByGrade = {}, // { "9": [ { id, name, isMajor, isMebExam, mebDate, mebSlot }, ... ] }
  teachers = [],
  classrooms = [],
  timetable = {},
  periodsPerDay = 8
}) => {
  let workingDays = [];
  if (selectedDates && Array.isArray(selectedDates) && selectedDates.length > 0) {
    workingDays = selectedDates
      .map(d => (typeof d === 'string' ? formatExamDay(d) : d))
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
  } else {
    workingDays = getWorkingDaysBetween(startDate, endDate);
  }

  // Seansları sırala (küçükten büyüğe, örn: [3, 5])
  const sortedSlots = [...(examSlots?.length ? examSlots : [3, 5])].map(Number).sort((a, b) => a - b);
  const firstSlot = sortedSlots[0] || 3;
  const maxExamsPerDay = sortedSlots.length || 2;

  // 🛡️ 1. ADIM: MEB Ortak Sınavlarını ve Okul İçi Ortak Sınavları Ayrıştır
  const mebGroupMap = new Map(); // key: `${displayName}__${mebDate}__${resolvedSlot}`
  const courseMap = new Map();   // key: `${displayName}` (Sadece MEB sınavı OLMAYAN kademeler)

  grades.forEach(grade => {
    const gradeSubjects = subjectsByGrade?.[grade] || [];
    gradeSubjects.forEach(sub => {
      if (!sub) return;
      const displayName = (sub.name || '').trim().toLocaleUpperCase('tr-TR');
      if (!displayName) return;

      const hasValidMebDate = Boolean(
        sub.isMebExam &&
        typeof sub.mebDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(sub.mebDate.trim())
      );

      if (hasValidMebDate) {
        const cleanDate = sub.mebDate.trim();
        if (!workingDays.some(wd => wd.date === cleanDate)) {
          const extraDay = formatExamDay(cleanDate);
          if (extraDay) {
            workingDays.push(extraDay);
            workingDays.sort((a, b) => a.date.localeCompare(b.date));
          }
        }

        const requestedSlot = Number(sub.mebSlot);
        const resolvedSlot = (!isNaN(requestedSlot) && requestedSlot > 0)
          ? requestedSlot
          : firstSlot;

        const mebKey = `${displayName}__${cleanDate}__${resolvedSlot}`;
        if (!mebGroupMap.has(mebKey)) {
          mebGroupMap.set(mebKey, {
            id: `pl_meb_${sub.id || displayName.replace(/[^A-Z0-9]/g, '')}_${cleanDate}_${resolvedSlot}`,
            courseId: sub.id || `meb_${displayName}`,
            name: displayName,
            code: sub.code || '',
            isMajor: !!sub.isMajor,
            isMebExam: true,
            mebDate: cleanDate,
            mebSlot: resolvedSlot,
            levels: [grade],
            date: cleanDate,
            slot: resolvedSlot
          });
        } else {
          const existingMeb = mebGroupMap.get(mebKey);
          if (!existingMeb.levels.includes(grade)) {
            existingMeb.levels.push(grade);
          }
          if (sub.isMajor) existingMeb.isMajor = true;
        }
      } else {
        if (!courseMap.has(displayName)) {
          courseMap.set(displayName, {
            id: sub.id || `c_${Math.random().toString(36).substring(2, 7)}`,
            name: displayName,
            code: sub.code || '',
            isMajor: !!sub.isMajor,
            isMebExam: false,
            levels: [grade]
          });
        } else {
          const existing = courseMap.get(displayName);
          if (!existing.levels.includes(grade)) {
            existing.levels.push(grade);
          }
          if (sub.isMajor) {
            existing.isMajor = true;
          }
        }
      }
    });
  });

  if (workingDays.length === 0) {
    return {
      success: false,
      message: "Seçilen sınav günleri listesi boş veya geçerli bir iş günü bulunamadı!",
      schedule: {},
      placements: [],
      unassigned: []
    };
  }

  const validDates = workingDays.map(d => d.date);

  // 🛡️ 2. ADIM: Aynı gün ve aynı seansa denk gelen farklı MEB sınavları aynı sınıfta çakışıyorsa seans kaydırması yap
  const fixedMebPlacements = [];
  Array.from(mebGroupMap.values()).forEach(mebPl => {
    let targetSlot = mebPl.slot;
    const hasSlotConflict = fixedMebPlacements.some(
      fp => fp.date === mebPl.date && Number(fp.slot) === Number(targetSlot) && fp.levels.some(l => mebPl.levels.includes(l))
    );
    if (hasSlotConflict) {
      const altSlot = sortedSlots.find(s => !fixedMebPlacements.some(
        fp => fp.date === mebPl.date && Number(fp.slot) === Number(s) && fp.levels.some(l => mebPl.levels.includes(l))
      ));
      if (altSlot !== undefined) targetSlot = altSlot;
    }
    fixedMebPlacements.push({ ...mebPl, slot: Number(targetSlot) });
  });

  const unifiedCourses = Array.from(courseMap.values());

  // 🛡️ 3. ADIM: Zümre Öğretmeni Uygunluk Önbelleğini (Cache) Hesapla
  const availabilityCache = buildBranchAvailabilityCache({
    courses: unifiedCourses,
    workingDays,
    teachers,
    classrooms,
    timetable,
    periodsPerDay
  });

  // 🛡️ 4. ADIM: 3 Katmanlı (Ana Dersler -> Okul Geneli Ortak -> Lokal Dersler) Çoklu Geçiş Optimizasyonu
  const candidateOrders = buildTieredCourseOrders(unifiedCourses, validDates, availabilityCache, 8);

  let bestResult = null;
  let bestQualityScore = Infinity;

  for (const orderCourses of candidateOrders) {
    const res = runSinglePassSchedule({
      courses: orderCourses,
      fixedPlacements: fixedMebPlacements,
      validDates,
      sortedSlots,
      maxExamsPerDay,
      availabilityCache,
      enforceGroupRule: true,
      enforceBranchAvailability: true
    });

    const qualityScore = evaluateScheduleQuality({
      placements: res.placements,
      unplacedCourses: res.unplacedCourses,
      validDates,
      sortedSlots,
      grades
    });

    if (qualityScore < bestQualityScore) {
      bestQualityScore = qualityScore;
      bestResult = res;
    }
  }

  const finalPlacements = [...bestResult.placements];
  const unassigned = [];

  // 🛡️ 5. ADIM: Ortak olarak aynı saate sığmayan ders varsa kademe bazlı en dengeli boş slotlara (Best-Fit + Zümre kuralı) yerleştirmeyi dene
  bestResult.unplacedCourses.forEach(course => {
    const remainingLevels = [];
    const normCourseName = normalizeTr(course.name);
    let blockedByBranchEveryDay = true;

    for (const date of validDates) {
      const bInfo = availabilityCache.get(`${normCourseName}__${date}`);
      if (!bInfo || !bInfo.hasTeachers || bInfo.isAvailable) {
        blockedByBranchEveryDay = false;
        break;
      }
    }

    course.levels.forEach(level => {
      let bestLevelCandidate = null;
      let bestLevelCost = Infinity;
      const singleLevelCourse = { ...course, levels: [level] };

      for (let dateIndex = 0; dateIndex < validDates.length; dateIndex++) {
        const date = validDates[dateIndex];
        const branchInfo = availabilityCache.get(`${normCourseName}__${date}`);
        if (branchInfo && branchInfo.hasTeachers && !branchInfo.isAvailable) {
          continue;
        }

        for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex++) {
          const slot = sortedSlots[slotIndex];
          const dailyCount = finalPlacements.filter(p => p.date === date && p.levels.includes(level)).length;
          if (dailyCount >= maxExamsPerDay) continue;
          const occupied = finalPlacements.some(p => p.date === date && Number(p.slot) === Number(slot) && p.levels.includes(level));
          if (occupied) continue;
          if (course.isMajor && finalPlacements.some(p => p.date === date && p.isMajor && p.levels.includes(level))) continue;

          let candidateCost = evaluatePlacementCost({
            course: singleLevelCourse,
            date,
            dateIndex,
            totalDays: validDates.length,
            slot,
            slotIndex,
            placements: finalPlacements
          });

          // Aynı dersin başka bir kademesi zaten bu gün ve seansta varsa birleştirme bonusu ver
          const sameCourseSlot = finalPlacements.find(
            p => p.date === date && Number(p.slot) === Number(slot) && p.name === course.name && !p.isMebExam
          );
          if (sameCourseSlot) {
            candidateCost -= 200;
          }

          if (candidateCost < bestLevelCost) {
            bestLevelCost = candidateCost;
            bestLevelCandidate = { date, slot: Number(slot), sameCourseSlot };
          }
        }
      }

      if (bestLevelCandidate) {
        if (bestLevelCandidate.sameCourseSlot) {
          bestLevelCandidate.sameCourseSlot.levels.push(level);
        } else {
          finalPlacements.push({
            id: `pl_${course.id}_${level}_${Math.random().toString(36).substring(2, 6)}`,
            courseId: course.id,
            name: course.name,
            code: course.code || '',
            isMajor: !!course.isMajor,
            isMebExam: false,
            levels: [level],
            date: bestLevelCandidate.date,
            slot: bestLevelCandidate.slot
          });
        }
      } else {
        remainingLevels.push(level);
      }
    });

    if (remainingLevels.length > 0) {
      remainingLevels.forEach(grade => {
        unassigned.push({
          grade,
          subject: { id: course.id, name: course.name, isMajor: course.isMajor },
          reason: blockedByBranchEveryDay
            ? `"${course.name}" zümre öğretmenlerinin tamamı seçili sınav günlerinde kapalı görünüyor.`
            : `"${course.name}" dersi için zümre öğretmenlerinin okulda olduğu günlerde uygun/boş sınav seansı kalmadı.`
        });
      });
    }
  });

  const schedule = buildScheduleFromPlacements(finalPlacements, grades, workingDays, subjectsByGrade);

  return {
    success: unassigned.length === 0,
    schedule,
    placements: finalPlacements,
    workingDays,
    examSlots: sortedSlots,
    firstSlot,
    unassigned,
    totalSubjects: Object.values(subjectsByGrade || {}).reduce((acc, list) => acc + (list?.length || 0), 0)
  };
};

/**
 * Okul Ders Programı Modülündeki Gerçek Derslerle Birebir Senkronize Sınav Dersleri
 */
export const DEFAULT_EXAM_SUBJECTS = {
  "9": [
    { id: "s9_1", name: "Türk Dili ve Edebiyatı", code: "EDEBİY", isMajor: true },
    { id: "s9_2", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s9_3", name: "Fizik", code: "FIZK", isMajor: true },
    { id: "s9_4", name: "Kimya", code: "KIM9", isMajor: true },
    { id: "s9_5", name: "Biyoloji", code: "BİY", isMajor: true },
    { id: "s9_6", name: "Tarih", code: "TARİH", isMajor: false },
    { id: "s9_7", name: "Coğrafya", code: "COGH2", isMajor: false },
    { id: "s9_8", name: "İngilizce", code: "9ING", isMajor: false },
    { id: "s9_9", name: "Arapça", code: "ARP9", isMajor: false },
    { id: "s9_10", name: "Kur'an-ı Kerim", code: "KKRİM", isMajor: false },
    { id: "s9_11", name: "Temel Dini Bilgiler", code: "TDB", isMajor: false },
    { id: "s9_12", name: "Sağlık Bilgisi", code: "9SAG", isMajor: false }
  ],
  "10": [
    { id: "s10_1", name: "Türk Dili ve Edebiyatı", code: "TDEB", isMajor: true },
    { id: "s10_2", name: "Matematik", code: "MAT10", isMajor: true },
    { id: "s10_3", name: "Fizik", code: "FIZK", isMajor: true },
    { id: "s10_4", name: "Kimya", code: "KİMYA", isMajor: true },
    { id: "s10_5", name: "Biyoloji", code: "BİY", isMajor: true },
    { id: "s10_6", name: "Tarih", code: "TARİH", isMajor: false },
    { id: "s10_7", name: "Coğrafya", code: "COG", isMajor: false },
    { id: "s10_8", name: "Felsefe", code: "FELH1", isMajor: false },
    { id: "s10_9", name: "İngilizce", code: "ING", isMajor: false },
    { id: "s10_10", name: "Arapça", code: "ARP10", isMajor: false },
    { id: "s10_11", name: "Kur'an-ı Kerim", code: "KKER", isMajor: false },
    { id: "s10_12", name: "Siyer", code: "SİYER", isMajor: false },
    { id: "s10_13", name: "Hadis", code: "HADİS", isMajor: false },
    { id: "s10_14", name: "Fıkıh", code: "FIKIH", isMajor: false }
  ],
  "11-SAY": [
    // 🔬 11. SINIF SAYISAL: Ana Dersler: Matematik, Fizik, Kimya, Biyoloji, Edebiyat
    { id: "s11s_1", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s11s_2", name: "Fizik", code: "FİZİK", isMajor: true },
    { id: "s11s_3", name: "Kimya", code: "KMYA", isMajor: true },
    { id: "s11s_4", name: "Biyoloji", code: "BİYO", isMajor: true },
    { id: "s11s_5", name: "Türk Dili ve Edebiyatı", code: "TDEB", isMajor: true },
    { id: "s11s_6", name: "Tarih", code: "TARİH", isMajor: false },
    { id: "s11s_7", name: "Felsefe", code: "11FEL", isMajor: false },
    { id: "s11s_8", name: "İngilizce", code: "ING1", isMajor: false },
    { id: "s11s_9", name: "Mesleki Arapça", code: "MARP11", isMajor: false },
    { id: "s11s_10", name: "Tefsir", code: "TEFSIR", isMajor: false },
    { id: "s11s_11", name: "Akaid", code: "AKAID", isMajor: false },
    { id: "s11s_12", name: "Hitabet", code: "HITAB", isMajor: false }
  ],
  "11-EA": [
    // ⚖️ 11. SINIF EŞİT AĞIRLIK
    { id: "s11e_1", name: "Matematik", code: "MAT4", isMajor: true },
    { id: "s11e_2", name: "Türk Dili ve Edebiyatı", code: "TDEB", isMajor: true },
    { id: "s11e_3", name: "Tarih", code: "TARİH", isMajor: false },
    { id: "s11e_4", name: "Coğrafya", code: "COGRFY", isMajor: false },
    { id: "s11e_5", name: "Seçmeli Edebiyat", code: "STEDB", isMajor: false },
    { id: "s11e_6", name: "Felsefe", code: "11FEL", isMajor: false },
    { id: "s11e_7", name: "Psikoloji", code: "PSKO", isMajor: false },
    { id: "s11e_8", name: "İngilizce", code: "ING1", isMajor: false },
    { id: "s11e_9", name: "Mesleki Arapça", code: "MARP11", isMajor: false },
    { id: "s11e_10", name: "Tefsir", code: "TEFSIR", isMajor: false },
    { id: "s11e_11", name: "Akaid", code: "AKAID", isMajor: false },
    { id: "s11e_12", name: "Hitabet", code: "HITAB", isMajor: false }
  ],
  "11": [
    // Geriye dönük uyumluluk
    { id: "s11_1", name: "Türk Dili ve Edebiyatı", code: "TDEB", isMajor: true },
    { id: "s11_2", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s11_3", name: "Fizik", code: "FİZİK", isMajor: true },
    { id: "s11_4", name: "Kimya", code: "KMYA", isMajor: true },
    { id: "s11_5", name: "Biyoloji", code: "BİYO", isMajor: true },
    { id: "s11_6", name: "Tarih", code: "TARİH", isMajor: false },
    { id: "s11_7", name: "Coğrafya", code: "COGRFY", isMajor: false },
    { id: "s11_8", name: "Felsefe", code: "11FEL", isMajor: false },
    { id: "s11_9", name: "İngilizce", code: "ING1", isMajor: false }
  ],
  "12-SAY": [
    // 🔬 12. SINIF SAYISAL: Ana Dersler: Matematik, Fizik, Kimya, Biyoloji, Edebiyat
    { id: "s12s_1", name: "Türk Dili ve Edebiyatı", code: "EDEBİY", isMajor: true },
    { id: "s12s_2", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s12s_3", name: "Fizik", code: "FİZİK", isMajor: true },
    { id: "s12s_4", name: "Kimya", code: "KMYA", isMajor: true },
    { id: "s12s_5", name: "Biyoloji", code: "BİYO", isMajor: true },
    { id: "s12s_6", name: "T.C. İnkılap Tarihi ve Atatürkçülük", code: "INKILA", isMajor: false },
    { id: "s12s_7", name: "İngilizce", code: "ING1", isMajor: false },
    { id: "s12s_8", name: "Dinler Tarihi", code: "DINT", isMajor: false },
    { id: "s12s_9", name: "Kur'an-ı Kerim", code: "KURAN", isMajor: false },
    { id: "s12s_10", name: "Kelam", code: "KELAM", isMajor: false },
    { id: "s12s_11", name: "Mesleki Arapça", code: "MARP11", isMajor: false },
    { id: "s12s_12", name: "İslam Kültür ve Medeniyeti", code: "IKMED", isMajor: false },
    { id: "s12s_13", name: "Fen Bilimleri Tarihi ve Uygulamaları", code: "FENT", isMajor: false },
    { id: "s12s_14", name: "Astronomi ve Uzay Bilimleri", code: "AUB1", isMajor: false }
  ],
  "12-EA": [
    // ⚖️ 12. SINIF EŞİT AĞIRLIK: Ana Dersler: Matematik, Edebiyat
    { id: "s12e_1", name: "Türk Dili ve Edebiyatı", code: "EDEBİY", isMajor: true },
    { id: "s12e_2", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s12e_3", name: "Coğrafya", code: "COĞRFY", isMajor: false },
    { id: "s12e_4", name: "Seçmeli Türk Dili ve Edebiyatı", code: "STEDB", isMajor: false },
    { id: "s12e_5", name: "T.C. İnkılap Tarihi ve Atatürkçülük", code: "INKILA", isMajor: false },
    { id: "s12e_6", name: "Çağdaş Türk ve Dünya Tarihi", code: "CTDT2", isMajor: false },
    { id: "s12e_7", name: "İngilizce", code: "ING1", isMajor: false },
    { id: "s12e_8", name: "Dinler Tarihi", code: "DINT", isMajor: false },
    { id: "s12e_9", name: "Kur'an-ı Kerim", code: "KURAN", isMajor: false },
    { id: "s12e_10", name: "Kelam", code: "KELAM", isMajor: false },
    { id: "s12e_11", name: "Mesleki Arapça", code: "MARP11", isMajor: false },
    { id: "s12e_12", name: "İslam Kültür ve Medeniyeti", code: "IKMED", isMajor: false },
    { id: "s12e_13", name: "Temel Matematik", code: "T.MAT2", isMajor: false },
    { id: "s12e_14", name: "Proje Tasarımı ve Uygulamaları", code: "PROJE", isMajor: false },
    { id: "s12e_15", name: "Adab-ı Muaşeret", code: "A.MUA2", isMajor: false },
    { id: "s12e_16", name: "Girişimcilik", code: "GIRIŞ1", isMajor: false }
  ],
  "12": [
    // Geriye dönük uyumluluk
    { id: "s12_1", name: "Türk Dili ve Edebiyatı", code: "EDEBİY", isMajor: true },
    { id: "s12_2", name: "Matematik", code: "MAT", isMajor: true },
    { id: "s12_3", name: "Fizik", code: "FİZİK", isMajor: true },
    { id: "s12_4", name: "Kimya", code: "KMYA", isMajor: true },
    { id: "s12_5", name: "Biyoloji", code: "BİYO", isMajor: true },
    { id: "s12_6", name: "T.C. İnkılap Tarihi ve Atatürkçülük", code: "INKILA", isMajor: false },
    { id: "s12_7", name: "Coğrafya", code: "COĞRFY", isMajor: false },
    { id: "s12_8", name: "Çağdaş Türk ve Dünya Tarihi", code: "CTDT2", isMajor: false },
    { id: "s12_9", name: "İngilizce", code: "ING1", isMajor: false },
    { id: "s12_10", name: "Kelam", code: "KELAM", isMajor: false },
    { id: "s12_11", name: "İslam Kültür ve Medeniyeti", code: "IKMED", isMajor: false },
    { id: "s12_12", name: "Dinler Tarihi", code: "DINT", isMajor: false }
  ]
};

/**
 * 👨‍🏫 ADİL VE DENGELİ SINAV GÖZETMENLİK DAĞITIM MOTORU
 * 
 * Kurallar:
 * 1. Her salona bir gözetmen öğretmen atanır.
 * 2. Bir öğretmen aynı gün ve aynı seansta yalnızca bir salonda görev alabilir.
 * 3. Adil Görev Paylaşımı: Toplam sınav görevleri tüm öğretmenlere eşit sayıda (min-max farkı en fazla 1) dağıtılır.
 * 4. Branş Koruması (Önerilen): Matematik sınavında mümkünse Matematik öğretmeni gözetmen olmaz (kendi dersi hariç görevlendirilir).
 */
export const solveSupervisors = ({
  examSchedule = {},
  workingDays = [],
  examSlots = [3, 5],
  classrooms = [],
  teachers = [],
  avoidSameBranch = true
}) => {
  if (!examSchedule || workingDays.length === 0 || teachers.length === 0 || classrooms.length === 0) {
    return {
      success: false,
      assignments: {},
      teacherDuties: {},
      stats: { totalDuties: 0, teacherCounts: {} }
    };
  }

  // Öğretmen görev sayacı
  const teacherCounts = {};
  const teacherDuties = {};
  teachers.forEach(t => {
    teacherCounts[t.id] = 0;
    teacherDuties[t.id] = [];
  });

  // assignments: date -> slot -> classroomId -> teacherId
  const assignments = {};

  // Aktif oturumları bul (en az 1 kademede sınav olan seanslar)
  workingDays.forEach(day => {
    assignments[day.date] = {};
    examSlots.forEach(slot => {
      // Bu seansta sınav var mı?
      const activeGradesWithExam = Object.keys(examSchedule).filter(grade => {
        return !!examSchedule[grade]?.[day.date]?.[slot];
      });

      if (activeGradesWithExam.length === 0) return; // Sınav yoksa gözetmen gerekmez

      assignments[day.date][slot] = {};
      const busyTeachersInSession = new Set();

      // Bu seansta sınava giren sınıfları dön
      classrooms.forEach(classroom => {
        // Sınıfın kademesi (örn: 9A -> "9", 10B -> "10", 11A -> "11-SAY", 11C -> "11-EA")
        let grade = null;
        const gradeMatch = (classroom.name || '').match(/^(\d+)/);
        if (gradeMatch) {
          const baseGrade = gradeMatch[1];
          if (baseGrade === '11' || baseGrade === '12') {
            const courseSubjects = (classroom.courses || []).map(co => (co.subject || '').toUpperCase());
            const isSay = courseSubjects.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('KMY') || s.includes('BİY')) || (classroom.name || '').toUpperCase().includes('SAY');
            const candidateGrade = isSay ? `${baseGrade}-SAY` : `${baseGrade}-EA`;
            grade = examSchedule[candidateGrade] ? candidateGrade : (examSchedule[baseGrade] ? baseGrade : candidateGrade);
          } else {
            grade = baseGrade;
          }
        }
        const examObj = grade ? examSchedule[grade]?.[day.date]?.[slot] : null;

        // Aday öğretmenleri seç (okulda olmayan ve muaf öğretmenler elenir, en az görev alanlar öne alınır)
        const isTeacherAvailableOnDay = (t) => {
          if (!t) return false;
          if (t.isExempt) return false; // Nöbet ve gözetmenlikten muaf
          const closed = t.unavailable?.[day.dayName] || [];
          if (closed.length >= 6) return false; // O gün boş günü (okulda değil)
          return true;
        };

        let candidates = [...teachers]
          .filter(t => !busyTeachersInSession.has(t.id) && isTeacherAvailableOnDay(t));

        // Yedek durum: Eğer aday kalmadıysa (çok az öğretmen varsa) kısıtı esnet
        if (candidates.length === 0) {
          candidates = [...teachers].filter(t => !busyTeachersInSession.has(t.id));
        }

        candidates.sort((a, b) => {
          // 1. Görev sayısı az olan öncelikli
          if (teacherCounts[a.id] !== teacherCounts[b.id]) {
            return teacherCounts[a.id] - teacherCounts[b.id];
          }
          // 2. Rastgelelik (rotasyon)
          return Math.random() - 0.5;
        });

        if (candidates.length === 0) return;

        let selectedTeacher = candidates[0];

        // Branş koruması: Sınav dersiyle öğretmenin branşı aynıysa alternatif ara
        if (avoidSameBranch && examObj) {
          const examSubjectLower = (examObj.name || '').toLowerCase();
          const nonBranchCandidate = candidates.find(t => {
            const branchLower = (t.branch || '').toLowerCase();
            return !examSubjectLower.includes(branchLower) && !branchLower.includes(examSubjectLower);
          });
          if (nonBranchCandidate) {
            selectedTeacher = nonBranchCandidate;
          }
        }

        // Atamayı yap
        assignments[day.date][slot][classroom.id] = selectedTeacher.id;
        busyTeachersInSession.add(selectedTeacher.id);
        teacherCounts[selectedTeacher.id] = (teacherCounts[selectedTeacher.id] || 0) + 1;
        teacherDuties[selectedTeacher.id].push({
          date: day.date,
          dayName: day.dayName,
          slot,
          classroomId: classroom.id,
          classroomName: classroom.name,
          subjectName: examObj?.name || 'Ortak Sınav'
        });
      });
    });
  });

  const totalDuties = Object.values(teacherCounts).reduce((a, b) => a + b, 0);
  const dutyValues = Object.values(teacherCounts);
  const minDuties = dutyValues.length > 0 ? Math.min(...dutyValues) : 0;
  const maxDuties = dutyValues.length > 0 ? Math.max(...dutyValues) : 0;

  return {
    success: true,
    assignments,
    teacherDuties,
    stats: {
      totalDuties,
      teacherCounts,
      minDuties,
      maxDuties,
      isFair: (maxDuties - minDuties) <= 1
    }
  };
};

