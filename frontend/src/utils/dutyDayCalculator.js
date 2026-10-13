// frontend/src/utils/dutyDayCalculator.js
/**
 * MEB Standartlarında Öğretmen Nöbet Günü Analiz Motoru
 * 
 * Nöbet Kriterleri:
 * 1. Erken gelip geç çıkma: Öğretmenin sabah ilk derste (1. saat) başlayıp 
 *    son saate (7 veya 8. saat) kadar okulda bulunması esas alınır.
 * 2. Boş ders (pencere) güvencesi: Nöbet görevinin (kat/bahçe kontrolü) sağlıklı 
 *    yapılabilmesi için gün içinde en az 1-2 saat boş dersinin bulunması tercih edilir.
 * 3. Boş günlere veya tek saatlik günlere nöbet verilmez.
 * 
 * Çıktı: "Pazartesi" veya "Pazartesi veya Çarşamba" (Öneri ifadesi içermez).
 */

export const calculateTeacherDutyDay = (teacherId, timetable = {}, settings = {}) => {
  if (!teacherId || !timetable || Object.keys(timetable).length === 0) {
    return null;
  }

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const numPeriods = Number(settings?.periodsPerDay) || 8;

  // 1. Öğretmenin her gün girdiği fiili ders saatlerini topla
  const teacherDayPeriods = {};
  days.forEach(d => { teacherDayPeriods[d] = []; });

  Object.keys(timetable).forEach(cId => {
    const classDays = timetable[cId] || {};
    days.forEach(d => {
      const slots = classDays[d] || [];
      slots.forEach(slot => {
        if (slot.teacherId === teacherId) {
          const p = Number(slot.period);
          if (!teacherDayPeriods[d].includes(p)) {
            teacherDayPeriods[d].push(p);
          }
        }
      });
    });
  });

  // 2. Her gün için nöbet uygunluk puanını hesapla
  const scoredDays = [];

  days.forEach(day => {
    const periods = teacherDayPeriods[day].slice().sort((a, b) => a - b);
    const count = periods.length;

    // Dersi olmayan (boş gün) veya sadece 1 saat dersi olan günde nöbet tutulamaz
    if (count <= 1) {
      return;
    }

    const startP = periods[0];
    const endP = periods[count - 1];
    const span = endP - startP + 1; // Okulda bulunma aralığı
    const gaps = span - count;       // Gün içi boş ders sayısı

    let score = 0;

    // A) Okulda bulunma genişliği puanı (erken gelip geç çıkma)
    score += span * 3;

    // Sabah 1. saatte okulda olma bonusu
    if (startP === 1) score += 12;
    else if (startP === 2) score += 6;

    // Akşam son saatte çıkma bonusu
    if (endP === numPeriods) score += 12;
    else if (endP === numPeriods - 1) score += 6;

    // B) Boş ders (pencere) bonusu (nöbet görevini rahat yapabilmesi için)
    if (gaps === 1) score += 14;      // 1 boş saat ideal
    else if (gaps === 2) score += 12; // 2 boş saat harika
    else if (gaps >= 3) score += 8;
    else if (gaps === 0) score += 0;  // Hiç boşluğu yoksa nöbet tutması zorlaşır

    // C) Dengeli ders saati bonusu (3-6 saat arası ders en ideal nöbet günüdür)
    if (count >= 3 && count <= 6) {
      score += 8;
    } else if (count >= 7) {
      score -= 4; // Çok yorucu gün
    }

    scoredDays.push({
      day,
      score,
      span,
      gaps,
      count,
      startP,
      endP
    });
  });

  if (scoredDays.length === 0) {
    return null;
  }

  // Puana göre büyükten küçüğe sırala
  scoredDays.sort((a, b) => b.score - a.score);

  const bestDay = scoredDays[0];
  if (bestDay.score <= 10) {
    return null;
  }

  // İkinci gün de en iyi güne çok yakın puandaysa (fark <= 4 ise) "Pazartesi veya Çarşamba" şeklinde döndür
  if (scoredDays.length > 1) {
    const secondDay = scoredDays[1];
    if (bestDay.score - secondDay.score <= 4) {
      // Gün sırasına göre dizelim (Pazartesi, Salı, Çarşamba, Perşembe, Cuma)
      const pair = [bestDay.day, secondDay.day].sort((a, b) => days.indexOf(a) - days.indexOf(b));
      return `${pair[0]} veya ${pair[1]}`;
    }
  }

  return bestDay.day;
};

/**
 * Tüm öğretmenler için toplu nöbet günü haritası üretir
 * { [teacherId]: "Pazartesi" | "Pazartesi veya Çarşamba" | null }
 */
export const calculateAllTeachersDutyDays = (teachers = [], timetable = {}, settings = {}) => {
  const result = {};
  (teachers || []).forEach(t => {
    result[t.id] = calculateTeacherDutyDay(t.id, timetable, settings);
  });
  return result;
};
