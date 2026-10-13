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
 * Otomatik Ortak Sınav Dağıtım Fonksiyonu
 */
export const solveExamSchedule = ({
  startDate,
  endDate,
  examSlots = [3, 5], // Sınavın yapılacağı ders saatleri (örn: 3. ve 5. ders)
  grades = ["9", "10", "11", "12"],
  subjectsByGrade = {}, // { "9": [ { id, name, isMajor }, ... ] }
}) => {
  const workingDays = getWorkingDaysBetween(startDate, endDate);
  
  if (workingDays.length === 0) {
    return {
      success: false,
      message: "Seçilen tarih aralığında hafta içi iş günü bulunamadı!",
      schedule: {},
      unassigned: []
    };
  }

  // Seansları sırala (küçükten büyüğe, örn: [3, 5])
  const sortedSlots = [...examSlots].sort((a, b) => Number(a) - Number(b));
  const firstSlot = sortedSlots[0]; // Günün ilk sınavı
  const otherSlots = sortedSlots.slice(1); // Günün sonraki sınavları

  // schedule yapısı: grade -> date -> slotNumber -> subjectObj
  const schedule = {};
  const unassigned = [];
  const availableDaysCount = workingDays.length;

  grades.forEach(grade => {
    schedule[grade] = {};
    workingDays.forEach(day => {
      schedule[grade][day.date] = {};
    });
  });

  // 🚨 ÖZEL KURAL 1: Matematik Sınavları MUTLAKA AYNI GÜN ve İLK SEANSTA Yapılmalı!
  const isMathSubject = (name = '', code = '') => {
    const s = `${name} ${code}`.toUpperCase();
    return s.includes('MAT') || s.includes('GEOMETRİ') || s.includes('GEOM');
  };

  // 🚨 ÖZEL KURAL 2: Edebiyat Sınavları MUTLAKA TÜM OKULDA AYNI GÜN ve İLK SEANSTA Yapılmalı!
  const isLiteratureSubject = (name = '', code = '') => {
    const s = `${name} ${code}`.toUpperCase();
    return s.includes('EDEB') || s.includes('TDEB') || s.includes('TÜRK DİLİ') || s.includes('TURK DILI');
  };

  // Matematik sınavı için ideal ortak bir iş günü seçelim (örn: 2. iş günü, Salı vb.)
  const mathDayIndex = availableDaysCount >= 3 ? 1 : 0;
  const mathDay = workingDays[mathDayIndex];

  // Edebiyat sınavı için ideal ayrı bir ortak iş günü seçelim (örn: 4. iş günü veya matematik ile çakışmayan gün)
  let literatureDayIndex = -1;
  if (availableDaysCount >= 5) {
    literatureDayIndex = 3; // 4. iş günü (Perşembe)
  } else if (availableDaysCount >= 3) {
    literatureDayIndex = mathDayIndex === 1 ? 2 : 1;
  } else if (availableDaysCount >= 2) {
    literatureDayIndex = mathDayIndex === 0 ? 1 : 0;
  }
  const literatureDay = literatureDayIndex !== -1 ? workingDays[literatureDayIndex] : null;

  // 1. Ortak Matematik Sınavını Kilitle
  grades.forEach(grade => {
    const gradeSubjects = subjectsByGrade[grade] || [];
    const mathSub = gradeSubjects.find(s => isMathSubject(s.name, s.code));
    if (mathSub && mathDay) {
      schedule[grade][mathDay.date][firstSlot] = {
        ...mathSub,
        slot: firstSlot,
        isMajor: true,
        isFirstSlotOfMajor: true,
        isCommonMathExam: true
      };
    }
  });

  // 2. Ortak Edebiyat Sınavını Kilitle (Tüm Okul Aynı Anda)
  if (literatureDay && literatureDayIndex !== mathDayIndex) {
    grades.forEach(grade => {
      const gradeSubjects = subjectsByGrade[grade] || [];
      const litSub = gradeSubjects.find(s => isLiteratureSubject(s.name, s.code) && s.isMajor);
      if (litSub) {
        schedule[grade][literatureDay.date][firstSlot] = {
          ...litSub,
          slot: firstSlot,
          isMajor: true,
          isFirstSlotOfMajor: true,
          isCommonLiteratureExam: true
        };
      }
    });
  }

  grades.forEach(grade => {
    const gradeSubjects = subjectsByGrade[grade] || [];
    // Matematik ve Edebiyat zaten ortak günlere yerleştiyse onları ayır
    const remainingSubjects = gradeSubjects.filter(s => {
      const placedInMath = schedule[grade][mathDay?.date]?.[firstSlot];
      const isPlacedInMath = placedInMath && (placedInMath.id === s.id || (placedInMath.name === s.name && placedInMath.code === s.code));
      const placedInLit = literatureDay && schedule[grade][literatureDay.date]?.[firstSlot];
      const isPlacedInLit = placedInLit && (placedInLit.id === s.id || (placedInLit.name === s.name && placedInLit.code === s.code));
      return !isPlacedInMath && !isPlacedInLit;
    });

    // Ana dersler ve Yan dersler olarak ikiye ayır
    const majorSubjects = remainingSubjects.filter(s => s.isMajor);
    const minorSubjects = remainingSubjects.filter(s => !s.isMajor);
    
    // 1. ADIM: KALAN ANA DERSLERİ GÜNLERE DAĞIT (HER GÜNE EN FAZLA 1 ANA DERS VE İLK SEANSA)
    // Matematik ve Edebiyat günlerini ana dersler için dolu kabul ediyoruz
    const usedMajorDays = [];
    if (schedule[grade][mathDay?.date]?.[firstSlot]) usedMajorDays.push(mathDayIndex);
    if (literatureDay && schedule[grade][literatureDay.date]?.[firstSlot]) usedMajorDays.push(literatureDayIndex);
    
    majorSubjects.forEach(sub => {
      // Boş bir gün bul (mümkünse aralıklı)
      let chosenDayIndex = -1;
      for (let i = 0; i < availableDaysCount; i++) {
        if (!usedMajorDays.includes(i) && !schedule[grade][workingDays[i].date]?.[firstSlot]) {
          chosenDayIndex = i;
          break;
        }
      }

      if (chosenDayIndex !== -1) {
        usedMajorDays.push(chosenDayIndex);
        const day = workingDays[chosenDayIndex];
        schedule[grade][day.date][firstSlot] = {
          ...sub,
          slot: firstSlot,
          isFirstSlotOfMajor: true
        };
      } else {
        unassigned.push({
          grade,
          subject: sub,
          reason: "İş günü sayısı ana ders sayısından az olduğu için ayrı güne sığmadı."
        });
      }
    });

    // 2. ADIM: YAN DERSLERİ DAĞIT
    // Yan dersler:
    // - Önce ana ders olan günlerin diğer seanslarına (otherSlots)
    // - Sonra ana ders olmayan boş günlerin ilk veya diğer seanslarına yerleştirilir
    const minorQueue = [...minorSubjects];

    // Önce ana ders konmuş günlerin 2., 3. seanslarını doldurmayı dene
    for (const day of workingDays) {
      const daySchedule = schedule[grade][day.date];
      if (daySchedule[firstSlot]) {
        // O gün ana ders var, kalan diğer seanslara yan ders koy
        for (const slot of otherSlots) {
          if (minorQueue.length > 0) {
            const sub = minorQueue.shift();
            daySchedule[slot] = {
              ...sub,
              slot
            };
          }
        }
      }
    }

    // Eğer hâlâ yan ders varsa, ana ders konmamış tamamen boş günlere yerleştir
    for (const day of workingDays) {
      const daySchedule = schedule[grade][day.date];
      if (!daySchedule[firstSlot]) {
        // Bu gün boş
        for (const slot of sortedSlots) {
          if (minorQueue.length > 0 && !daySchedule[slot]) {
            const sub = minorQueue.shift();
            daySchedule[slot] = {
              ...sub,
              slot
            };
          }
        }
      }
    }

    // Hâlâ yerleşemeyen yan ders kaldıysa
    while (minorQueue.length > 0) {
      const sub = minorQueue.shift();
      unassigned.push({
        grade,
        subject: sub,
        reason: "Sınav tarih aralığındaki seans kapasitesi yetersiz kaldı."
      });
    }
  });

  return {
    success: unassigned.length === 0,
    schedule,
    workingDays,
    examSlots: sortedSlots,
    firstSlot,
    unassigned,
    totalSubjects: Object.values(subjectsByGrade).reduce((acc, list) => acc + (list?.length || 0), 0)
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
    // ⚖️ 11. SINIF EŞİT AĞIRLIK: Ana Dersler: Matematik, Edebiyat, Tarih, Coğrafya
    { id: "s11e_1", name: "Matematik", code: "MAT4", isMajor: true },
    { id: "s11e_2", name: "Türk Dili ve Edebiyatı", code: "TDEB", isMajor: true },
    { id: "s11e_3", name: "Tarih", code: "TARİH", isMajor: true },
    { id: "s11e_4", name: "Coğrafya", code: "COGRFY", isMajor: true },
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
  "12": [
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
          if (baseGrade === '11') {
            const courseSubjects = (classroom.courses || []).map(co => (co.subject || '').toUpperCase());
            const isSay = courseSubjects.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('KMY') || s.includes('BİY'));
            const candidateGrade = isSay ? '11-SAY' : '11-EA';
            grade = examSchedule[candidateGrade] ? candidateGrade : (examSchedule['11'] ? '11' : candidateGrade);
          } else {
            grade = baseGrade;
          }
        }
        const examObj = grade ? examSchedule[grade]?.[day.date]?.[slot] : null;

        // Aday öğretmenleri seç (en az görev alan öğretmenler en önde)
        const candidates = [...teachers]
          .filter(t => !busyTeachersInSession.has(t.id))
          .sort((a, b) => {
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

