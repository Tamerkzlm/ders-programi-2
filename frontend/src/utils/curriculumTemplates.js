// frontend/src/utils/curriculumTemplates.js
/**
 * 📚 MEB MÜFREDAT VE HAFTALIK DERS ÇİZELGESİ ŞABLONLARI
 * Kullanıcı tek tıkla sınıf kademesine uygun 40 saatlik standart dersleri ekleyebilir.
 */

export const CURRICULUM_TEMPLATES = [
  {
    id: 'anadolu_9',
    name: '9. Sınıf Anadolu Lisesi (40 Saat)',
    grade: '9',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB9', hoursPerWeek: 5 },
      { subject: 'Matematik', code: 'MAT9', hoursPerWeek: 6 },
      { subject: 'Fizik', code: 'FİZ9', hoursPerWeek: 2 },
      { subject: 'Kimya', code: 'KİM9', hoursPerWeek: 2 },
      { subject: 'Biyoloji', code: 'BİY9', hoursPerWeek: 2 },
      { subject: 'Tarih', code: 'TRH9', hoursPerWeek: 2 },
      { subject: 'Coğrafya', code: 'COĞ9', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN9', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG9', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM9', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED9', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS9', hoursPerWeek: 2 },
      { subject: 'Sağlık Bilgisi ve Trafik Kültürü', code: 'SAĞ9', hoursPerWeek: 1 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH9', hoursPerWeek: 1 },
      { subject: 'Seçmeli Temel Dini Bilgiler', code: 'TDB9', hoursPerWeek: 2 },
      { subject: 'Seçmeli Proje Tasarımı', code: 'PRJ9', hoursPerWeek: 3 }
    ]
  },
  {
    id: 'anadolu_10',
    name: '10. Sınıf Anadolu Lisesi (40 Saat)',
    grade: '10',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB10', hoursPerWeek: 5 },
      { subject: 'Matematik', code: 'MAT10', hoursPerWeek: 6 },
      { subject: 'Fizik', code: 'FİZ10', hoursPerWeek: 2 },
      { subject: 'Kimya', code: 'KİM10', hoursPerWeek: 2 },
      { subject: 'Biyoloji', code: 'BİY10', hoursPerWeek: 2 },
      { subject: 'Tarih', code: 'TRH10', hoursPerWeek: 2 },
      { subject: 'Coğrafya', code: 'COĞ10', hoursPerWeek: 2 },
      { subject: 'Felsefe', code: 'FEL10', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN10', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG10', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM10', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED10', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS10', hoursPerWeek: 2 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH10', hoursPerWeek: 1 },
      { subject: 'Seçmeli Astronomi ve Uzay Bilimleri', code: 'AUB10', hoursPerWeek: 2 },
      { subject: 'Seçmeli Drama', code: 'DRM10', hoursPerWeek: 2 }
    ]
  },
  {
    id: 'anadolu_11_say',
    name: '11. Sınıf Sayısal (40 Saat)',
    grade: '11',
    branch: 'SAY',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB11', hoursPerWeek: 5 },
      { subject: 'Tarih', code: 'TRH11', hoursPerWeek: 2 },
      { subject: 'Felsefe', code: 'FEL11', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN11', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG11', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM11', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED11', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS11', hoursPerWeek: 2 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH11', hoursPerWeek: 1 },
      { subject: 'Seçmeli Matematik', code: 'SMAT11', hoursPerWeek: 6 },
      { subject: 'Seçmeli Fizik', code: 'SFİZ11', hoursPerWeek: 4 },
      { subject: 'Seçmeli Kimya', code: 'SKİM11', hoursPerWeek: 4 },
      { subject: 'Seçmeli Biyoloji', code: 'SBİY11', hoursPerWeek: 4 }
    ]
  },
  {
    id: 'anadolu_11_ea',
    name: '11. Sınıf Eşit Ağırlık (40 Saat)',
    grade: '11',
    branch: 'EA',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB11', hoursPerWeek: 5 },
      { subject: 'Tarih', code: 'TRH11', hoursPerWeek: 2 },
      { subject: 'Felsefe', code: 'FEL11', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN11', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG11', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM11', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED11', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS11', hoursPerWeek: 2 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH11', hoursPerWeek: 1 },
      { subject: 'Seçmeli Matematik', code: 'SMAT11', hoursPerWeek: 6 },
      { subject: 'Seçmeli Türk Dili ve Edebiyatı', code: 'SEDB11', hoursPerWeek: 3 },
      { subject: 'Seçmeli Tarih', code: 'STRH11', hoursPerWeek: 4 },
      { subject: 'Seçmeli Coğrafya', code: 'SCOĞ11', hoursPerWeek: 4 },
      { subject: 'Seçmeli Psikoloji', code: 'PSK11', hoursPerWeek: 1 }
    ]
  },
  {
    id: 'anadolu_12_say',
    name: '12. Sınıf Sayısal (40 Saat)',
    grade: '12',
    branch: 'SAY',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB12', hoursPerWeek: 5 },
      { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', code: 'İNK12', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN12', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG12', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM12', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED12', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS12', hoursPerWeek: 2 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH12', hoursPerWeek: 1 },
      { subject: 'Seçmeli Matematik', code: 'SMAT12', hoursPerWeek: 6 },
      { subject: 'Seçmeli Fizik', code: 'SFİZ12', hoursPerWeek: 4 },
      { subject: 'Seçmeli Kimya', code: 'SKİM12', hoursPerWeek: 4 },
      { subject: 'Seçmeli Biyoloji', code: 'SBİY12', hoursPerWeek: 4 },
      { subject: 'Seçmeli Girişimcilik', code: 'GİR12', hoursPerWeek: 2 }
    ]
  },
  {
    id: 'anadolu_12_ea',
    name: '12. Sınıf Eşit Ağırlık (40 Saat)',
    grade: '12',
    branch: 'EA',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB12', hoursPerWeek: 5 },
      { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', code: 'İNK12', hoursPerWeek: 2 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', code: 'DİN12', hoursPerWeek: 2 },
      { subject: 'Birinci Yabancı Dil (İngilizce)', code: 'İNG12', hoursPerWeek: 4 },
      { subject: 'İkinci Yabancı Dil (Almanca)', code: 'ALM12', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED12', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS12', hoursPerWeek: 2 },
      { subject: 'Rehberlik ve Yönlendirme', code: 'REH12', hoursPerWeek: 1 },
      { subject: 'Seçmeli Matematik', code: 'SMAT12', hoursPerWeek: 6 },
      { subject: 'Seçmeli Türk Dili ve Edebiyatı', code: 'SEDB12', hoursPerWeek: 5 },
      { subject: 'Çağdaş Türk ve Dünya Tarihi', code: 'ÇTD12', hoursPerWeek: 4 },
      { subject: 'Seçmeli Coğrafya', code: 'SCOĞ12', hoursPerWeek: 4 },
      { subject: 'Sosyoloji', code: 'SOS12', hoursPerWeek: 1 }
    ]
  },
  {
    id: 'aihl_9',
    name: '9. Sınıf Anadolu İmam Hatip (40 Saat)',
    grade: '9',
    totalHours: 40,
    courses: [
      { subject: 'Türk Dili ve Edebiyatı', code: 'EDB9', hoursPerWeek: 5 },
      { subject: 'Tarih', code: 'TRH9', hoursPerWeek: 2 },
      { subject: 'Coğrafya', code: 'COĞ9', hoursPerWeek: 2 },
      { subject: 'Matematik', code: 'MAT9', hoursPerWeek: 6 },
      { subject: 'Fizik', code: 'FİZ9', hoursPerWeek: 2 },
      { subject: 'Kimya', code: 'KİM9', hoursPerWeek: 2 },
      { subject: 'Biyoloji', code: 'BİY9', hoursPerWeek: 2 },
      { subject: 'Kur\'an-ı Kerim', code: 'KK9', hoursPerWeek: 5 },
      { subject: 'Arapça', code: 'ARP9', hoursPerWeek: 4 },
      { subject: 'Temel Dini Bilgiler', code: 'TDB9', hoursPerWeek: 1 },
      { subject: 'Yabancı Dil (İngilizce)', code: 'İNG9', hoursPerWeek: 2 },
      { subject: 'Beden Eğitimi ve Spor', code: 'BED9', hoursPerWeek: 2 },
      { subject: 'Görsel Sanatlar / Müzik', code: 'GS9', hoursPerWeek: 1 },
      { subject: 'Sağlık Bilgisi ve Trafik Kültürü', code: 'SAĞ9', hoursPerWeek: 1 },
      { subject: 'Rehberlik', code: 'REH9', hoursPerWeek: 1 },
      { subject: 'Seçmeli Adab-ı Muaşeret', code: 'ADB9', hoursPerWeek: 2 }
    ]
  }
];

/**
 * Sınıf adına göre en uygun şablonu tahmin eder.
 * Örn: "9A" -> anadolu_9
 * Örn: "11B SAY" -> anadolu_11_say
 */
export const suggestCurriculumTemplate = (className = '') => {
  const clean = className.toUpperCase();
  if (clean.includes('11')) {
    if (clean.includes('EA') || clean.includes('EŞİT')) return 'anadolu_11_ea';
    return 'anadolu_11_say';
  }
  if (clean.includes('12')) {
    if (clean.includes('EA') || clean.includes('EŞİT')) return 'anadolu_12_ea';
    return 'anadolu_12_say';
  }
  if (clean.includes('10')) return 'anadolu_10';
  if (clean.includes('9')) return 'anadolu_9';
  return 'anadolu_9';
};
