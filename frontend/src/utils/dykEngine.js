// frontend/src/utils/dykEngine.js
/**
 * 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) AKILLI DAĞITIM VE PLANLAMA MOTORU
 * 
 * Özellikler:
 * 1. Kurumsal Ayarlar & Zaman Çizelgesi (Blok Saatleri, Başlangıç-Bitiş, Aktif Günler)
 * 2. 8 Temel Sınıf Grubu (11A Say, 11B Say, 11C EA, 11D EA, 12A Say, 12B Say, 12C EA, 12D EA)
 * 3. Okul Programı Entegrasyonu: Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Coğrafya, Tarih branşları
 *    - Okul ders programında (timetable) öğretmenin son derse girdiği günler tespit edilir ve
 *      DYK dersleri öncelikle bu günlere yerleştirilir.
 * 4. Çakışmasız Akıllı Dağıtım & Raporlama
 */

// 📋 8 Varsayılan Kayıtlı Sınıf Grubu
export const DEFAULT_DYK_CLASSES = [
  { id: "dg_11a_say", name: "11A Say", grade: "11", branch: "SAY" },
  { id: "dg_11b_say", name: "11B Say", grade: "11", branch: "SAY" },
  { id: "dg_11c_ea", name: "11C EA", grade: "11", branch: "EA" },
  { id: "dg_11d_ea", name: "11D EA", grade: "11", branch: "EA" },
  { id: "dg_12a_say", name: "12A Say", grade: "12", branch: "SAY" },
  { id: "dg_12b_say", name: "12B Say", grade: "12", branch: "SAY" },
  { id: "dg_12c_ea", name: "12C EA", grade: "12", branch: "EA" },
  { id: "dg_12d_ea", name: "12D EA", grade: "12", branch: "EA" }
];

// 🎯 DYK Hedef Branşları
export const DYK_TARGET_BRANCHES = [
  "Matematik",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Türk Dili ve Edebiyatı",
  "Coğrafya",
  "Tarih"
];

/**
 * Bir öğretmenin branş veya derslerinin DYK kapsamına girip girmediğini kontrol eder
 */
export const isDykEligibleBranch = (branch = '', subjects = []) => {
  const b = (branch || '').toUpperCase();
  const subs = (subjects || []).map(s => (s || '').toUpperCase()).join(' ');
  const all = `${b} ${subs}`;
  return (
    all.includes('MAT') ||
    all.includes('FİZ') || all.includes('FIZ') ||
    all.includes('KİM') || all.includes('KIM') ||
    all.includes('BİO') || all.includes('BIO') || all.includes('BİY') || all.includes('BIY') ||
    all.includes('FEN') ||
    all.includes('COG') || all.includes('COĞ') ||
    all.includes('TAR') ||
    all.includes('TDEB') || all.includes('EDEB')
  );
};

/**
 * 🔍 ÖĞRETMENLERİN OKUL DERS PROGRAMINI ANALİZ ET
 * Öğretmenin okul programında dersi olduğu günleri ve özellikle SON DERSE girdiği günleri tespit eder.
 */
export const analyzeTeacherSchoolSchedule = (timetable = {}, teachers = [], settings = {}) => {
  const periodsPerDay = Number(settings?.periodsPerDay) || 8;
  const analysis = {}; // teacherId -> { [day]: { periods: [], maxPeriod: 0, hasLatePeriod: boolean, totalHours: number } }

  teachers.forEach(t => {
    analysis[t.id] = {};
  });

  // Timetable içindeki tüm sınıfları ve günleri tara
  Object.keys(timetable || {}).forEach(classId => {
    const classDays = timetable[classId] || {};
    Object.keys(classDays).forEach(day => {
      const slots = classDays[day] || [];
      slots.forEach(slot => {
        const teacherId = slot.teacherId;
        if (!teacherId || !analysis[teacherId]) return;

        if (!analysis[teacherId][day]) {
          analysis[teacherId][day] = {
            periods: [],
            maxPeriod: 0,
            hasLatePeriod: false,
            totalHours: 0
          };
        }

        const p = Number(slot.period);
        if (!analysis[teacherId][day].periods.includes(p)) {
          analysis[teacherId][day].periods.push(p);
          analysis[teacherId][day].totalHours++;
          if (p > analysis[teacherId][day].maxPeriod) {
            analysis[teacherId][day].maxPeriod = p;
          }
        }
      });
    });
  });

  // Son ders (7. veya 8. saat ya da okul gününün son saati) denetimi
  Object.keys(analysis).forEach(teacherId => {
    const teacherDays = analysis[teacherId];
    Object.keys(teacherDays).forEach(day => {
      const info = teacherDays[day];
      // Eğer öğretmenin o günkü son dersi okulun son saatine (örn. 7 veya 8) denk geliyorsa
      if (info.maxPeriod >= Math.max(6, periodsPerDay - 1)) {
        info.hasLatePeriod = true;
      }
    });
  });

  return analysis;
};

/**
 * 🚀 AKILLI DYK DAĞITIM MOTORU
 */
export const solveDykSchedule = ({
  dykGroups = [],
  dykAssignments = [],
  dykTeacherAvailabilities = {},
  dykSettings = {},
  teachers = [],
  timetable = {},
  settings = {}
}) => {
  const blocks = dykSettings?.blocks || [
    { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
    { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
  ];

  const activeDays = dykSettings?.activeDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  // 1. Öğretmenlerin okul programı son ders analizi
  const teacherSchoolAnalysis = analyzeTeacherSchoolSchedule(timetable, teachers, settings);

  // 2. Çizelge yapısı: groupId -> day -> blockId -> { subject, teacherId, assignmentId }
  const schedule = {};
  dykGroups.forEach(g => {
    schedule[g.id] = {};
    activeDays.forEach(d => {
      schedule[g.id][d] = {};
    });
  });

  // 3. Dağıtılacak blok aktiviteleri
  const excludedTeacherIds = dykSettings?.excludedTeacherIds || [];
  const activities = [];
  dykAssignments.forEach(asg => {
    if (excludedTeacherIds.includes(asg.teacherId)) return;
    const blocksCount = Number(asg.blocksPerWeek) || 1;
    for (let i = 0; i < blocksCount; i++) {
      activities.push({
        id: `${asg.id}_${i}`,
        assignmentId: asg.id,
        groupId: asg.groupId,
        teacherId: asg.teacherId,
        subject: asg.subject
      });
    }
  });

  // 4. Öğretmen meşguliyet matrisi: teacherId -> day -> blockId -> boolean
  const teacherBusy = {};
  teachers.forEach(t => {
    teacherBusy[t.id] = {};
    activeDays.forEach(d => {
      teacherBusy[t.id][d] = {};
    });
  });

  // 5. Aktiviteleri önceliklendir (Daha az uygun günü olan öğretmenler önce)
  activities.sort((a, b) => {
    const aAvail = dykTeacherAvailabilities[a.teacherId]?.length || activeDays.length;
    const bAvail = dykTeacherAvailabilities[b.teacherId]?.length || activeDays.length;
    return aAvail - bAvail;
  });

  const unassigned = [];

  // 6. Akıllı Yerleştirme Heuristiği (Scoring Engine)
  activities.forEach(act => {
    // Öğretmenin DYK için kabul ettiği günler
    const rawAllowed = dykTeacherAvailabilities[act.teacherId];
    const allowedDays = rawAllowed && rawAllowed.length > 0
      ? rawAllowed.filter(d => activeDays.includes(d))
      : activeDays;

    let bestCandidate = null;
    let highestScore = -Infinity;

    // Tüm olası (gün, blok) kombinasyonlarını değerlendir
    allowedDays.forEach(day => {
      blocks.forEach((block, blockIdx) => {
        // Sınıf meşgul mü?
        if (schedule[act.groupId]?.[day]?.[block.id]) return;

        // Öğretmen meşgul mü?
        if (teacherBusy[act.teacherId]?.[day]?.[block.id]) return;

        // Skorlama Faktörleri
        let score = 100;

        // 🌟 KRİTİK KURAL: Okul ders programında o gün son dersi var mı?
        const teacherDayInfo = teacherSchoolAnalysis[act.teacherId]?.[day];
        if (teacherDayInfo?.hasLatePeriod) {
          score += 150; // Çok yüksek öncelik: Okulda son dersten hemen sonra DYK
        } else if (teacherDayInfo?.totalHours > 0) {
          score += 50; // Orta öncelik: O gün zaten okulda dersi var
        } else if (day === "Cumartesi") {
          score += 40; // Cumartesi kurs günü için doğal uygunluk
        }

        // 🎯 KURAL: Bir sınıfın aynı dersten aynı gün birden fazla bloğu olmasın
        const sameSubjectOnDay = Object.values(schedule[act.groupId][day] || {}).some(
          s => s?.subject === act.subject
        );
        if (sameSubjectOnDay) {
          score -= 80;
        }

        // 🎯 KURAL: Sınıfın günlük yükünü dengeli dağıt (günde 1-2 blok)
        const currentGroupBlocksOnDay = Object.keys(schedule[act.groupId][day] || {}).length;
        score -= currentGroupBlocksOnDay * 20;

        // 🎯 KURAL: Blok önceliği (1. bloklar gün sonunda ilk önce dolsun)
        if (blockIdx === 0) {
          score += 25;
        }

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = { day, block };
        }
      });
    });

    if (bestCandidate) {
      const { day, block } = bestCandidate;
      schedule[act.groupId][day][block.id] = {
        subject: act.subject,
        teacherId: act.teacherId,
        assignmentId: act.assignmentId
      };
      if (!teacherBusy[act.teacherId]) {
        teacherBusy[act.teacherId] = {};
      }
      if (!teacherBusy[act.teacherId][day]) {
        teacherBusy[act.teacherId][day] = {};
      }
      teacherBusy[act.teacherId][day][block.id] = true;
    } else {
      unassigned.push(act);
    }
  });

  return {
    success: unassigned.length === 0,
    schedule,
    unassigned,
    totalActivities: activities.length,
    assignedCount: activities.length - unassigned.length,
    teacherSchoolAnalysis
  };
};

/**
 * ⚡ SMART SWAP (AKILLI TAKAS) DYK KONTROLÜ
 * Bir öğretmenin belirli bir gün ve blokta müsait olup olmadığını denetler.
 */
export const isTeacherFreeInDyk = ({
  dykSchedule = {},
  teacherId,
  day,
  blockId,
  ignoreGroupId = null,
  dykTeacherAvailabilities = {},
  activeDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
}) => {
  if (!teacherId || !day || !blockId) return false;

  // 1. Gün uygunluğu
  const allowed = dykTeacherAvailabilities[teacherId];
  if (allowed && allowed.length > 0 && !allowed.includes(day)) {
    return { free: false, reason: "Öğretmenin bu gün için DYK onayı bulunmuyor." };
  }

  // 2. Başka bir grupta o saatte dersi var mı?
  for (const gId of Object.keys(dykSchedule)) {
    if (ignoreGroupId && gId === ignoreGroupId) continue;
    const cell = dykSchedule[gId]?.[day]?.[blockId];
    if (cell && cell.teacherId === teacherId) {
      return { free: false, reason: `Öğretmen bu saatte başka bir grupta (${gId}) derste.` };
    }
  }

  return { free: true };
};

/**
 * ⚡ İKİ DYK DERSİNİ GÜVENLİ TAKAS ET VEYA BOŞ YERE TAŞI
 */
export const executeDykSwap = ({
  dykSchedule = {},
  groupId,
  sourceDay,
  sourceBlockId,
  targetDay,
  targetBlockId,
  dykTeacherAvailabilities = {},
  activeDays = []
}) => {
  if (!dykSchedule[groupId]) {
    return { success: false, reason: "Grup bulunamadı." };
  }

  const newSchedule = JSON.parse(JSON.stringify(dykSchedule));
  const sourceCell = newSchedule[groupId]?.[sourceDay]?.[sourceBlockId];
  const targetCell = newSchedule[groupId]?.[targetDay]?.[targetBlockId];

  if (!sourceCell) {
    return { success: false, reason: "Kaynak ders hücresi boş." };
  }

  // Kaynak öğretmenin hedef slotta müsaitliği
  const sourceTeacherCheck = isTeacherFreeInDyk({
    dykSchedule: newSchedule,
    teacherId: sourceCell.teacherId,
    day: targetDay,
    blockId: targetBlockId,
    ignoreGroupId: groupId,
    dykTeacherAvailabilities,
    activeDays
  });

  if (!sourceTeacherCheck.free) {
    return { success: false, reason: `${sourceCell.subject} öğretmeni için: ${sourceTeacherCheck.reason}` };
  }

  // Eğer hedef hücre doluysa, hedef öğretmenin kaynak slotta müsaitliği
  if (targetCell) {
    const targetTeacherCheck = isTeacherFreeInDyk({
      dykSchedule: newSchedule,
      teacherId: targetCell.teacherId,
      day: sourceDay,
      blockId: sourceBlockId,
      ignoreGroupId: groupId,
      dykTeacherAvailabilities,
      activeDays
    });

    if (!targetTeacherCheck.free) {
      return { success: false, reason: `${targetCell.subject} öğretmeni için: ${targetTeacherCheck.reason}` };
    }
  }

  // Takas veya Taşıma
  if (!newSchedule[groupId][targetDay]) newSchedule[groupId][targetDay] = {};
  if (!newSchedule[groupId][sourceDay]) newSchedule[groupId][sourceDay] = {};

  if (targetCell) {
    newSchedule[groupId][targetDay][targetBlockId] = sourceCell;
    newSchedule[groupId][sourceDay][sourceBlockId] = targetCell;
  } else {
    newSchedule[groupId][targetDay][targetBlockId] = sourceCell;
    delete newSchedule[groupId][sourceDay][sourceBlockId];
  }

  return { success: true, newSchedule };
};

/**
 * 🔍 HAVUZ DERSİ İÇİN BELİRLİ BİR HÜCRENİN MÜSAİTLİK DURUMUNU KAPSAMLI DENETLER
 * Manuel düzenlemede müsait yerlerin anında görselleştirilmesini sağlar.
 */
export const checkDykSlotAvailability = ({
  activity,
  targetGroupId,
  targetDay,
  targetBlockId,
  dykSchedule = {},
  dykTeacherAvailabilities = {},
  dykGroups = []
}) => {
  if (!activity) return { canPlace: false, status: 'none', reason: '' };

  // 1. Sınıf eşleşmesi (Havuzdaki ders yalnızca kendi sınıfına yerleştirilebilir)
  if (targetGroupId && activity.groupId !== targetGroupId) {
    const groupName = dykGroups.find(g => g.id === activity.groupId)?.name || 'kendi sınıfına';
    return {
      canPlace: false,
      status: 'wrong_group',
      reason: `Bu ders ${groupName} sınıfına aittir.`
    };
  }

  // 2. Hedef hücre dolu mu?
  const cell = dykSchedule?.[activity.groupId]?.[targetDay]?.[targetBlockId];
  if (cell) {
    return {
      canPlace: false,
      status: 'occupied',
      reason: `Hücre dolu: ${cell.subject}`
    };
  }

  // 3. Öğretmen bu saatte başka bir grupta meşgul mü? (Fiziksel Çakışma)
  for (const gId of Object.keys(dykSchedule || {})) {
    if (gId === activity.groupId) continue;
    const otherCell = dykSchedule[gId]?.[targetDay]?.[targetBlockId];
    if (otherCell && otherCell.teacherId === activity.teacherId) {
      const otherGroupName = dykGroups.find(g => g.id === gId)?.name || gId;
      return {
        canPlace: false,
        status: 'teacher_conflict',
        reason: `Öğretmen bu saatte ${otherGroupName} sınıfında derste.`
      };
    }
  }

  // 4. Öğretmenin gün tercihi/onayı
  const allowed = dykTeacherAvailabilities[activity.teacherId];
  const isDayPreferred = !allowed || allowed.length === 0 || allowed.includes(targetDay);

  return {
    canPlace: true,
    status: 'available',
    isDayPreferred,
    reason: isDayPreferred ? 'Müsait boş saat' : `Müsait (Öğretmenin DYK günlerine ${targetDay} eklenecektir)`
  };
};

/**
 * ⚡ AÇIKTA KALAN HAVUZ DERSİNİ MANUEL OLARAK ÇİZELGEYE YERLEŞTİR
 */
export const placeUnassignedDykActivity = ({
  dykSchedule = {},
  activity,
  targetDay,
  targetBlockId,
  dykTeacherAvailabilities = {},
  activeDays = [],
  allowDayOverride = true
}) => {
  if (!activity || !activity.groupId || !targetDay || !targetBlockId) {
    return { success: false, reason: "Eksik parametre." };
  }

  const newSchedule = JSON.parse(JSON.stringify(dykSchedule));
  if (!newSchedule[activity.groupId]) newSchedule[activity.groupId] = {};
  if (!newSchedule[activity.groupId][targetDay]) newSchedule[activity.groupId][targetDay] = {};

  // Hücre dolu mu?
  if (newSchedule[activity.groupId][targetDay][targetBlockId]) {
    return { success: false, reason: "Seçilen hücre zaten dolu. Önce takas yapınız veya boş bir hücre seçiniz." };
  }

  // Öğretmen başka bir grupta o saatte derste mi?
  for (const gId of Object.keys(newSchedule)) {
    if (gId === activity.groupId) continue;
    const cell = newSchedule[gId]?.[targetDay]?.[targetBlockId];
    if (cell && cell.teacherId === activity.teacherId) {
      return { success: false, reason: "Öğretmen bu saatte başka bir grupta derste." };
    }
  }

  // Öğretmenin gün onayı kontrolü (Manuel yerleştirmede esnek yönetim)
  const allowed = dykTeacherAvailabilities[activity.teacherId];
  let updatedAvailabilities = null;
  if (allowed && allowed.length > 0 && !allowed.includes(targetDay)) {
    if (allowDayOverride) {
      updatedAvailabilities = {
        ...dykTeacherAvailabilities,
        [activity.teacherId]: [...allowed, targetDay]
      };
    } else {
      return { success: false, reason: "Öğretmenin bu gün için DYK onayı bulunmuyor." };
    }
  }

  newSchedule[activity.groupId][targetDay][targetBlockId] = {
    subject: activity.subject,
    teacherId: activity.teacherId,
    assignmentId: activity.assignmentId
  };

  return { 
    success: true, 
    newSchedule,
    updatedAvailabilities,
    addedDay: updatedAvailabilities ? targetDay : null
  };
};

/**
 * 🕒 GÜNE ÖZEL VEYA VARSAYILAN BLOK SAATLERİNİ DÖNER
 * Örneğin Çarşamba günü 18:00 başlangıcı, diğer günler 15:50 başlangıcı
 */
export const getDykBlockTimes = (dykSettings, day, blockId) => {
  const custom = dykSettings?.dayCustomTimes?.[day]?.[blockId];
  if (custom && custom.startTime && custom.endTime) {
    return {
      startTime: custom.startTime,
      endTime: custom.endTime,
      isCustom: true
    };
  }
  const defaultBlock = (dykSettings?.blocks || []).find(b => b.id === blockId);
  return {
    startTime: defaultBlock?.startTime || "15:50",
    endTime: defaultBlock?.endTime || "17:00",
    isCustom: false
  };
};

/**
 * 🖨️ RESMİ ÇIKTI VE BAŞLIK İÇİN ZAMAN ÇİZELGESİ ÖZETİ ÜRETİR
 */
export const formatDykScheduleHeaderTimes = (dykSettings) => {
  const blocks = dykSettings?.blocks || [];
  const activeDays = dykSettings?.activeDays || [];
  const dayCustomTimes = dykSettings?.dayCustomTimes || {};

  // Varsayılan saat metni
  const defaultSummary = blocks
    .map((b, i) => `${i + 1}. Blok (${b.startTime} - ${b.endTime})`)
    .join(', ');

  // Güne özel saatler var mı kontrol et
  const customParts = [];
  activeDays.forEach(day => {
    if (dayCustomTimes[day] && Object.keys(dayCustomTimes[day]).length > 0) {
      const timesStr = blocks.map((b, i) => {
        const t = dayCustomTimes[day][b.id] || { startTime: b.startTime, endTime: b.endTime };
        return `${i + 1}. Blok (${t.startTime} - ${t.endTime})`;
      }).join(', ');
      customParts.push(`${day}: ${timesStr}`);
    }
  });

  if (customParts.length > 0) {
    return `Genel: ${defaultSummary}  |  Özel Saatler: ${customParts.join('  ·  ')}`;
  }
  return defaultSummary;
};

