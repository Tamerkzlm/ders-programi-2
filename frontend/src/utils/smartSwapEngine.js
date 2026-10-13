// frontend/src/utils/smartSwapEngine.js
/**
 * ⚡ SMART SWAP (AKILLI TAKAS VE YER DEĞİŞTİRME) ANALİZ MOTORU
 * 
 * Bir ders hücresi seçildiğinde:
 * 1. O sınıftaki diğer tüm saatleri tarar.
 * 2. Karşılıklı müsaitlik ve çakışma durumlarını (kapalı saatler + diğer sınıflardaki meşguliyet) denetler.
 * 3. Her takasın her iki öğretmenin boşluklarına (pencerelerine) net etkisini simüle eder.
 * 4. Boşluğu azaltan fırsatları en başa alarak akıllı öneri listesi üretir.
 */

export const calculateTeacherDayGaps = (teacherId, day, customTimetable) => {
  const busyPeriods = [];
  Object.keys(customTimetable || {}).forEach(cId => {
    (customTimetable[cId]?.[day] || []).forEach(s => {
      if (s.teacherId === teacherId) {
        const p = Number(s.period);
        if (!busyPeriods.includes(p)) busyPeriods.push(p);
      }
    });
  });

  if (busyPeriods.length <= 1) return 0;
  busyPeriods.sort((a, b) => a - b);
  const span = busyPeriods[busyPeriods.length - 1] - busyPeriods[0] + 1;
  return Math.max(0, span - busyPeriods.length);
};

export const calculateTotalSchoolGaps = (timetable = {}, teachers = [], days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]) => {
  let total = 0;
  (teachers || []).forEach(t => {
    (days || []).forEach(d => {
      total += calculateTeacherDayGaps(t.id, d, timetable);
    });
  });
  return total;
};

export const findSmartSwapOpportunities = ({
  classId,
  sourceDay,
  sourcePeriod,
  timetable = {},
  teachers = [],
  classrooms = [],
  settings = {}
}) => {
  if (!classId || !sourceDay || !sourcePeriod || !timetable[classId]) {
    return [];
  }

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const numPeriods = Number(settings?.periodsPerDay) || 8;
  const pNum = Number(sourcePeriod);

  // Kaynak dersi bul
  const classTimetable = timetable[classId] || {};
  const currentSlots = classTimetable[sourceDay] || [];
  const sourceSlot = currentSlots.find(s => Number(s.period) === pNum);

  if (!sourceSlot) {
    return [];
  }

  const teacher1 = teachers.find(t => t.id === sourceSlot.teacherId);
  if (!teacher1) return [];

  // Yardımcı: Bir öğretmenin belirli bir gün ve saatte müsaitliğini kontrol et
  const isTeacherAvailableAt = (teacherId, targetDay, targetPeriod, ignoreClassId = null, ignoreDay = null, ignorePeriod = null) => {
    const tObj = teachers.find(t => t.id === teacherId);
    if (!tObj) return false;

    // Kapalı / kısıtlı saat kontrolü
    const dayUnavailable = tObj.unavailable?.[targetDay] || [];
    if (dayUnavailable.some(p => Number(p) === Number(targetPeriod))) {
      return false;
    }

    // Başka bir sınıfta derste olma durumu
    for (const cId of Object.keys(timetable)) {
      const slots = timetable[cId]?.[targetDay] || [];
      const conflict = slots.find(s => {
        if (Number(s.period) !== Number(targetPeriod) || s.teacherId !== teacherId) return false;
        // Eğer bu slot kaynak slotumuz ise çakışma sayma
        if (cId === ignoreClassId && targetDay === ignoreDay && Number(s.period) === Number(ignorePeriod)) return false;
        return true;
      });
      if (conflict) return false;
    }

    return true;
  };

  // Yardımcı: Bir öğretmenin gün içi boşluk sayısını hesapla
  const calculateTeacherDayGapsLocal = (teacherId, day, customTimetable) => {
    const busyPeriods = [];
    Object.keys(customTimetable || {}).forEach(cId => {
      (customTimetable[cId]?.[day] || []).forEach(s => {
        if (s.teacherId === teacherId) {
          const p = Number(s.period);
          if (!busyPeriods.includes(p)) busyPeriods.push(p);
        }
      });
    });

    if (busyPeriods.length <= 1) return 0;
    busyPeriods.sort((a, b) => a - b);
    const span = busyPeriods[busyPeriods.length - 1] - busyPeriods[0] + 1;
    return Math.max(0, span - busyPeriods.length);
  };

  const currentTotalGaps = calculateTotalSchoolGaps(timetable, teachers, days);
  const opportunities = [];

  // Sınıfın tüm gün ve saatlerini tara
  days.forEach(candidateDay => {
    for (let candidatePeriod = 1; candidatePeriod <= numPeriods; candidatePeriod++) {
      // Kaynak saatin kendisini atla
      if (candidateDay === sourceDay && candidatePeriod === pNum) continue;

      const candidateSlots = classTimetable[candidateDay] || [];
      const targetSlot = candidateSlots.find(s => Number(s.period) === candidatePeriod);

      // DURUM A: HEDEF SAAT DOLU (İKİ ÖĞRETMEN ARASI TAKAS - SWAP)
      if (targetSlot) {
        // Aynı ders veya aynı öğretmen ise takas anlamlı değil
        if (targetSlot.teacherId === sourceSlot.teacherId) continue;

        const teacher2 = teachers.find(t => t.id === targetSlot.teacherId);
        if (!teacher2) continue;

        // 1. T1 hedef saatte müsait mi? (Kaynak saatteki dersi çıkacağı için ignore ediyoruz)
        const t1CanGo = isTeacherAvailableAt(
          teacher1.id, 
          candidateDay, 
          candidatePeriod, 
          classId, 
          sourceDay, 
          pNum
        );
        if (!t1CanGo) continue;

        // 2. T2 kaynak saatte müsait mi? (Hedef saatteki dersi çıkacağı için ignore ediyoruz)
        const t2CanGo = isTeacherAvailableAt(
          teacher2.id, 
          sourceDay, 
          pNum, 
          classId, 
          candidateDay, 
          candidatePeriod
        );
        if (!t2CanGo) continue;

        // 3. SİMÜLASYON: Takas yapılınca boşluklar nasıl değişir?
        // Önceki boşluklar
        const t1GapsBefore = calculateTeacherDayGaps(teacher1.id, sourceDay, timetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher1.id, candidateDay, timetable) : 0);
        const t2GapsBefore = calculateTeacherDayGaps(teacher2.id, sourceDay, timetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher2.id, candidateDay, timetable) : 0);

        // Geçici takas haritası
        const simTimetable = JSON.parse(JSON.stringify(timetable));
        // Kaynaktaki T1 dersini kaldır, T2 dersini koy
        simTimetable[classId][sourceDay] = simTimetable[classId][sourceDay].filter(s => Number(s.period) !== pNum);
        simTimetable[classId][sourceDay].push({ period: pNum, subject: targetSlot.subject, teacherId: teacher2.id });

        // Hedefteki T2 dersini kaldır, T1 dersini koy
        simTimetable[classId][candidateDay] = simTimetable[classId][candidateDay].filter(s => Number(s.period) !== candidatePeriod);
        simTimetable[classId][candidateDay].push({ period: candidatePeriod, subject: sourceSlot.subject, teacherId: teacher1.id });

        // Sonraki boşluklar
        const t1GapsAfter = calculateTeacherDayGaps(teacher1.id, sourceDay, simTimetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher1.id, candidateDay, simTimetable) : 0);
        const t2GapsAfter = calculateTeacherDayGaps(teacher2.id, sourceDay, simTimetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher2.id, candidateDay, simTimetable) : 0);

        const deltaT1 = t1GapsAfter - t1GapsBefore;
        const deltaT2 = t2GapsAfter - t2GapsBefore;
        const netGapChange = deltaT1 + deltaT2;
        const newTotalSchoolGaps = Math.max(0, currentTotalGaps + netGapChange);

        let benefitType = 'neutral';
        let benefitScore = 50;
        let badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (±0 Sa)`;

        if (netGapChange < 0) {
          benefitType = 'improved';
          benefitScore = 100 + Math.abs(netGapChange) * 20;
          badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (-${Math.abs(netGapChange)} Sa 🌟)`;
        } else if (netGapChange > 0) {
          benefitType = 'worse';
          benefitScore = 20 - netGapChange * 10;
          badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (+${netGapChange} Sa ⚠️)`;
        }

        opportunities.push({
          type: 'swap',
          targetDay: candidateDay,
          targetPeriod: candidatePeriod,
          targetSubject: targetSlot.subject,
          targetTeacher: teacher2,
          sourceTeacher: teacher1,
          currentTotalGaps,
          newTotalGaps: newTotalSchoolGaps,
          netGapChange,
          deltaT1,
          deltaT2,
          benefitType,
          benefitScore,
          badgeText,
          description: `${candidateDay} ${candidatePeriod}. dersteki ${targetSlot.subject} (${teacher2.name}) ile karşılıklı yer değiştirin.`
        });
      } 
      // DURUM B: HEDEF SAAT BOŞ (DERSİ BOŞ HÜCREYE TAŞIMA)
      else {
        const t1CanGo = isTeacherAvailableAt(
          teacher1.id, 
          candidateDay, 
          candidatePeriod, 
          classId, 
          sourceDay, 
          pNum
        );
        if (!t1CanGo) continue;

        // Simülasyon
        const t1GapsBefore = calculateTeacherDayGaps(teacher1.id, sourceDay, timetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher1.id, candidateDay, timetable) : 0);

        const simTimetable = JSON.parse(JSON.stringify(timetable));
        simTimetable[classId][sourceDay] = simTimetable[classId][sourceDay].filter(s => Number(s.period) !== pNum);
        if (!simTimetable[classId][candidateDay]) simTimetable[classId][candidateDay] = [];
        simTimetable[classId][candidateDay].push({ period: candidatePeriod, subject: sourceSlot.subject, teacherId: teacher1.id });

        const t1GapsAfter = calculateTeacherDayGaps(teacher1.id, sourceDay, simTimetable) + 
          (sourceDay !== candidateDay ? calculateTeacherDayGaps(teacher1.id, candidateDay, simTimetable) : 0);

        const netGapChange = t1GapsAfter - t1GapsBefore;
        const newTotalSchoolGaps = Math.max(0, currentTotalGaps + netGapChange);

        let benefitType = 'neutral';
        let benefitScore = 40;
        let badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (±0 Sa)`;

        if (netGapChange < 0) {
          benefitType = 'improved';
          benefitScore = 90 + Math.abs(netGapChange) * 20;
          badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (-${Math.abs(netGapChange)} Sa 🌟)`;
        } else if (netGapChange > 0) {
          benefitType = 'worse';
          benefitScore = 15;
          badgeText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (+${netGapChange} Sa ⚠️)`;
        }

        opportunities.push({
          type: 'move',
          targetDay: candidateDay,
          targetPeriod: candidatePeriod,
          targetSubject: null,
          targetTeacher: null,
          sourceTeacher: teacher1,
          currentTotalGaps,
          newTotalGaps: newTotalSchoolGaps,
          netGapChange,
          deltaT1: netGapChange,
          deltaT2: 0,
          benefitType,
          benefitScore,
          badgeText,
          description: `${candidateDay} ${candidatePeriod}. saat boş; dersi buraya kaydırabilirsiniz.`
        });
      }
    }
  });

  // Puana göre sırala (boşluğu azaltanlar en üstte)
  opportunities.sort((a, b) => b.benefitScore - a.benefitScore);

  return opportunities;
};

/**
 * İki hücre arasındaki yer değiştirme (swap) veya boş hücreye taşıma (move)
 * işlemini tekil olarak analiz eder; geçerlilik durumunu ve net boşluk etkisini döner.
 */
export const evaluateSwapOrMove = ({
  source,
  target,
  timetable = {},
  teachers = [],
  classrooms = [],
  settings = {}
}) => {
  if (!source || !target || !source.teacherId) {
    return { isValid: false, reason: 'Eksik veri' };
  }

  const srcClassId = source.classId;
  const tgtClassId = target.classId || srcClassId;
  const srcDay = source.day;
  const srcPeriod = Number(source.period);
  const tgtDay = target.day;
  const tgtPeriod = Number(target.period);
  const srcTeacherId = source.teacherId;

  // Aynı hücre ise
  if (!source.fromPool && srcClassId === tgtClassId && srcDay === tgtDay && srcPeriod === tgtPeriod) {
    return { isValid: false, reason: 'Mevcut kendi hücresi' };
  }

  const srcTeacher = teachers.find(t => t.id === srcTeacherId);
  if (!srcTeacher) return { isValid: false, reason: 'Öğretmen bulunamadı' };

  // Hedef hücreyi bul
  const tgtSlot = (timetable[tgtClassId]?.[tgtDay] || []).find(s => Number(s.period) === tgtPeriod);
  const tgtTeacher = tgtSlot ? teachers.find(t => t.id === tgtSlot.teacherId) : null;

  // Yardımcı: meşguliyet kontrolü
  const isAvailable = (teacherId, day, period, ignoreCId, ignoreD, ignoreP) => {
    const tObj = teachers.find(t => t.id === teacherId);
    if (!tObj) return false;
    if ((tObj.unavailable?.[day] || []).some(p => Number(p) === Number(period))) {
      return false;
    }
    for (const cId of Object.keys(timetable)) {
      const slots = timetable[cId]?.[day] || [];
      const conflict = slots.find(s => {
        if (Number(s.period) !== Number(period) || s.teacherId !== teacherId) return false;
        if (cId === ignoreCId && day === ignoreD && Number(s.period) === Number(ignoreP)) return false;
        return true;
      });
      if (conflict) return false;
    }
    return true;
  };

  // 1. Kaynak öğretmen hedef saatte müsait mi?
  const srcCanGo = isAvailable(srcTeacherId, tgtDay, tgtPeriod, srcClassId, srcDay, srcPeriod);
  if (!srcCanGo) {
    return {
      isValid: false,
      reason: `${srcTeacher.name} öğretmeni ${tgtDay} ${tgtPeriod}. saatte kapalı veya başka sınıfta derste!`
    };
  }

  // Yardımcı: boşluk hesaplama
  const getTeacherGaps = (teacherId, day, customTimetable) => {
    const busy = [];
    Object.keys(customTimetable).forEach(cId => {
      (customTimetable[cId]?.[day] || []).forEach(s => {
        if (s.teacherId === teacherId) {
          const p = Number(s.period);
          if (!busy.includes(p)) busy.push(p);
        }
      });
    });
    if (busy.length <= 1) return 0;
    busy.sort((a, b) => a - b);
    const span = busy[busy.length - 1] - busy[0] + 1;
    return Math.max(0, span - busy.length);
  };

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const currentTotalGaps = calculateTotalSchoolGaps(timetable, teachers, days);

  // DURUM A: HEDEF DOLU -> KARŞILIKLI TAKAS (SWAP)
  if (tgtSlot) {
    if (!tgtTeacher) {
      return { isValid: false, reason: 'Hedef öğretmen verisi eksik' };
    }
    if (tgtTeacher.id === srcTeacherId) {
      return { isValid: false, reason: 'Aynı öğretmenin iki dersi takas edilemez' };
    }

    // Hedef öğretmen kaynak saate gidebilir mi?
    if (!source.fromPool) {
      const tgtCanGo = isAvailable(tgtTeacher.id, srcDay, srcPeriod, tgtClassId, tgtDay, tgtPeriod);
      if (!tgtCanGo) {
        return {
          isValid: false,
          reason: `${tgtTeacher.name} öğretmeni ${srcDay} ${srcPeriod}. saatte kapalı veya başka sınıfta derste!`
        };
      }
    }

    // Boşluk simülasyonu
    const t1Before = getTeacherGaps(srcTeacher.id, srcDay, timetable) +
      (srcDay !== tgtDay ? getTeacherGaps(srcTeacher.id, tgtDay, timetable) : 0);
    const t2Before = getTeacherGaps(tgtTeacher.id, srcDay, timetable) +
      (srcDay !== tgtDay ? getTeacherGaps(tgtTeacher.id, tgtDay, timetable) : 0);

    const sim = JSON.parse(JSON.stringify(timetable));
    if (!source.fromPool) {
      sim[srcClassId][srcDay] = (sim[srcClassId][srcDay] || []).filter(s => Number(s.period) !== srcPeriod);
      sim[srcClassId][srcDay].push({ period: srcPeriod, subject: tgtSlot.subject, teacherId: tgtTeacher.id });
    }
    sim[tgtClassId][tgtDay] = (sim[tgtClassId][tgtDay] || []).filter(s => Number(s.period) !== tgtPeriod);
    sim[tgtClassId][tgtDay].push({ period: tgtPeriod, subject: source.subject || 'Ders', teacherId: srcTeacher.id });

    const t1After = getTeacherGaps(srcTeacher.id, srcDay, sim) +
      (srcDay !== tgtDay ? getTeacherGaps(srcTeacher.id, tgtDay, sim) : 0);
    const t2After = getTeacherGaps(tgtTeacher.id, srcDay, sim) +
      (srcDay !== tgtDay ? getTeacherGaps(tgtTeacher.id, tgtDay, sim) : 0);

    const deltaT1 = t1After - t1Before;
    const deltaT2 = t2After - t2Before;
    const netGapChange = deltaT1 + deltaT2;
    const newTotalSchoolGaps = Math.max(0, currentTotalGaps + netGapChange);

    let gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (DEĞİŞMEZ ±0)`;
    let badge = 'neutral';
    if (netGapChange < 0) {
      gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${Math.abs(netGapChange)} saat AZALIR 🌟)`;
      badge = 'improved';
    } else if (netGapChange > 0) {
      gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${netGapChange} saat ARTAR ⚠️)`;
      badge = 'worse';
    }

    return {
      isValid: true,
      type: 'swap',
      targetTeacherName: tgtTeacher.name,
      targetSubject: tgtSlot.subject,
      sourceTeacherName: srcTeacher.name,
      sourceSubject: source.subject || 'Ders',
      currentTotalGaps,
      newTotalGaps: newTotalSchoolGaps,
      netGapChange,
      deltaT1,
      deltaT2,
      badge,
      gapText,
      message: `${tgtTeacher.name} (${tgtSlot.subject}) ile yer değiştirebilir. Toplam pencere sayısı: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${netGapChange < 0 ? `${Math.abs(netGapChange)} saat azalır 🌟` : netGapChange > 0 ? `${netGapChange} saat artar ⚠️` : 'değişmez'}).`
    };
  }

  // DURUM B: HEDEF BOŞ -> BOŞ HÜCREYE TAŞIMA (MOVE)
  const t1Before = getTeacherGaps(srcTeacher.id, srcDay, timetable) +
    (srcDay !== tgtDay ? getTeacherGaps(srcTeacher.id, tgtDay, timetable) : 0);

  const sim = JSON.parse(JSON.stringify(timetable));
  if (!source.fromPool) {
    sim[srcClassId][srcDay] = (sim[srcClassId][srcDay] || []).filter(s => Number(s.period) !== srcPeriod);
  }
  if (!sim[tgtClassId][tgtDay]) sim[tgtClassId][tgtDay] = [];
  sim[tgtClassId][tgtDay].push({ period: tgtPeriod, subject: source.subject || 'Ders', teacherId: srcTeacher.id });

  const t1After = getTeacherGaps(srcTeacher.id, srcDay, sim) +
    (srcDay !== tgtDay ? getTeacherGaps(srcTeacher.id, tgtDay, sim) : 0);

  const deltaT1 = t1After - t1Before;
  const netGapChange = deltaT1;
  const newTotalSchoolGaps = Math.max(0, currentTotalGaps + netGapChange);

  let gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (DEĞİŞMEZ ±0)`;
  let badge = 'neutral';
  if (netGapChange < 0) {
    gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${Math.abs(netGapChange)} saat AZALIR 🌟)`;
    badge = 'improved';
  } else if (netGapChange > 0) {
    gapText = `Toplam Pencere: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${netGapChange} saat ARTAR ⚠️)`;
    badge = 'worse';
  }

  return {
    isValid: true,
    type: 'move',
    targetTeacherName: null,
    targetSubject: null,
    sourceTeacherName: srcTeacher.name,
    sourceSubject: source.subject || 'Ders',
    currentTotalGaps,
    newTotalGaps: newTotalSchoolGaps,
    netGapChange,
    deltaT1,
    deltaT2: 0,
    badge,
    gapText,
    message: `Boş hücreye taşınabilir. Toplam pencere sayısı: ${currentTotalGaps} ➔ ${newTotalSchoolGaps} (${netGapChange < 0 ? `${Math.abs(netGapChange)} saat azalır 🌟` : netGapChange > 0 ? `${netGapChange} saat artar ⚠️` : 'değişmez'}).`
  };
};

/**
 * İki öğretmenin derslerini çakışma ve kapalı saat denetimleri yaparak takas eder.
 * JSON serialization yerine saf immutable structural sharing kullanır.
 *
 * @param {Object} params - { timetable, teachers, source, target }
 * @returns {{ success: boolean, reason?: string, newTimetable?: Object }}
 */
export const executeTeacherSwap = ({ timetable = {}, teachers = [], source, target }) => {
  if (!source || !target) {
    return { success: false, reason: 'Kaynak veya hedef hücre belirtilmedi.' };
  }

  const sClass = source.classId;
  const tClass = target.classId || sClass;
  const sDay = source.day;
  const tDay = target.day;
  const sPeriod = Number(source.period);
  const tPeriod = Number(target.period);

  // 1. Aynı hücre kontrolü
  if (sClass === tClass && sDay === tDay && sPeriod === tPeriod) {
    return { success: false, reason: 'Kaynak ve hedef aynı hücre olamaz.' };
  }

  const srcSlot = (timetable[sClass]?.[sDay] || []).find(s => Number(s.period) === sPeriod);
  const tgtSlot = (timetable[tClass]?.[tDay] || []).find(s => Number(s.period) === tPeriod);

  if (!srcSlot) {
    return { success: false, reason: 'Kaynak hücrede taşınacak ders bulunamadı.' };
  }

  const srcTeacherId = srcSlot.teacherId || source.teacherId;
  const tgtTeacherId = tgtSlot ? (tgtSlot.teacherId || target.teacherId) : null;

  if (tgtSlot && srcTeacherId === tgtTeacherId) {
    return { success: false, reason: 'Aynı öğretmenin iki dersi karşılıklı takas edilemez.' };
  }

  const srcTeacher = teachers.find(t => t.id === srcTeacherId);
  const tgtTeacher = tgtTeacherId ? teachers.find(t => t.id === tgtTeacherId) : null;

  // Takas esnasında boşalacak hücrelerin çakışma kontrolünden muaf tutulması
  const isVacated = (cId, d, p) =>
    (cId === sClass && d === sDay && Number(p) === sPeriod) ||
    (cId === tClass && d === tDay && Number(p) === tPeriod);

  // Müsaitlik ve çakışma denetleyici
  const checkConflict = (teacher, day, period) => {
    if (!teacher) return null;
    const p = Number(period);

    // Kural A: Kapalı / Kısıtlı saat kontrolü
    if (teacher.unavailable?.[day]?.some(up => Number(up) === p)) {
      return `${teacher.name} öğretmeni ${day} ${p}. saatte müsait değil (kapalı saat).`;
    }

    // Kural B: Başka sınıfta derste olma durumu
    for (const [cId, days] of Object.entries(timetable)) {
      const busy = (days?.[day] || []).find(s =>
        Number(s.period) === p &&
        s.teacherId === teacher.id &&
        !isVacated(cId, day, s.period)
      );
      if (busy) {
        return `${teacher.name} öğretmeni ${day} ${p}. saatte başka bir sınıfta derste.`;
      }
    }
    return null;
  };

  // Kaynak öğretmen hedef saate gidebilir mi?
  const srcConflict = checkConflict(srcTeacher, tDay, tPeriod);
  if (srcConflict) return { success: false, reason: srcConflict };

  // Hedef öğretmen (varsa) kaynak saate gidebilir mi?
  if (tgtTeacher) {
    const tgtConflict = checkConflict(tgtTeacher, sDay, sPeriod);
    if (tgtConflict) return { success: false, reason: tgtConflict };
  }

  // 2. Saf Immutable Güncelleme (Structural Sharing)
  const newSrcSlot = tgtSlot ? { ...tgtSlot, period: sPeriod } : null;
  const newTgtSlot = { ...srcSlot, period: tPeriod };

  const updateDay = (daySlots = [], period, slotToAdd) => {
    const filtered = daySlots.filter(s => Number(s.period) !== Number(period));
    return slotToAdd ? [...filtered, slotToAdd].sort((a, b) => Number(a.period) - Number(b.period)) : filtered;
  };

  let newTimetable = {
    ...timetable,
    [sClass]: {
      ...timetable[sClass],
      [sDay]: updateDay(timetable[sClass]?.[sDay], sPeriod, newSrcSlot)
    }
  };

  newTimetable = {
    ...newTimetable,
    [tClass]: {
      ...newTimetable[tClass],
      [tDay]: updateDay(newTimetable[tClass]?.[tDay], tPeriod, newTgtSlot)
    }
  };

  return { success: true, newTimetable };
};

// Takma ad (Alias)
export const swapTeacherLessons = executeTeacherSwap;
