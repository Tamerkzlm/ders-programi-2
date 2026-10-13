// frontend/src/utils/courseCodeHelper.js
/**
 * 🎓 DERS KODU ÜRETİCİ VE YARDIMCI FONKSİYONLARI
 * 
 * Örnekler:
 * 9. Sınıf Matematik -> MAT9
 * 10. Sınıf Matematik -> MAT10
 * 9. Sınıf Türk Dili ve Edebiyatı -> EDB9
 * 9. Sınıf Fizik -> FİZ9
 * 10. Sınıf Kimya -> KİM10
 * 11. Sınıf Biyoloji -> BİY11
 * 12. Sınıf İnkılap Tarihi -> İNK12
 */

// Kısaltma kök haritası
const SUBJECT_ROOTS = [
  { match: /seçmeli\s*matematik|s\.mat|smat/i, root: 'SMAT' },
  { match: /temel\s*matematik|t\.mat|tmat/i, root: 'TMAT' },
  { match: /matematik|mat/i, root: 'MAT' },
  { match: /seçmeli\s*edebiyat|stdeb|stedb|sedb/i, root: 'SEDB' },
  { match: /edebiyat|tdeb|edb/i, root: 'EDB' },
  { match: /fizik|fiz|fzk/i, root: 'FİZ' },
  { match: /kimya|kmy|kim/i, root: 'KİM' },
  { match: /biyoloji|biy/i, root: 'BİY' },
  { match: /inkılap|t\.c\.|ink/i, root: 'İNK' },
  { match: /tarih|trh|tar/i, root: 'TRH' },
  { match: /coğrafya|cogh|cog|coğ/i, root: 'COĞ' },
  { match: /felsefe|fel/i, root: 'FEL' },
  { match: /psikoloji|psk/i, root: 'PSK' },
  { match: /ingilizce|ing/i, root: 'İNG' },
  { match: /mesleki\s*arapça|marp/i, root: 'MARP' },
  { match: /arapça|arp/i, root: 'ARP' },
  { match: /kuran|kur'an|kker|kkrim|kk/i, root: 'KK' },
  { match: /siyer|siy/i, root: 'SİY' },
  { match: /hadis|had/i, root: 'HAD' },
  { match: /fıkıh|fık/i, root: 'FIK' },
  { match: /tefsir|tef/i, root: 'TEF' },
  { match: /kelam|kel/i, root: 'KEL' },
  { match: /akaid|akd/i, root: 'AKD' },
  { match: /hitabet|hit/i, root: 'HİT' },
  { match: /dinler\s*tarihi|dint/i, root: 'DNT' },
  { match: /islam\s*kültür|ikmed|ikm/i, root: 'İKM' },
  { match: /çağdaş|ctdt/i, root: 'ÇTD' },
  { match: /temel\s*dini|tdb|temd/i, root: 'TDB' },
  { match: /sağlık|sag|sağ/i, root: 'SAĞ' },
  { match: /adab|adabı|muaşeret|a\.mua/i, root: 'ADB' },
  { match: /astronomi|aub/i, root: 'AUB' },
  { match: /fen\s*bilim|fent/i, root: 'FNT' },
  { match: /proje/i, root: 'PRJ' },
  { match: /girişimcilik|giriş/i, root: 'GİR' },
  { match: /görsel|gs/i, root: 'GS' },
  { match: /müzik|mzk/i, root: 'MZK' },
  { match: /beden|bed/i, root: 'BED' },
  { match: /rehberlik|reh/i, root: 'REH' }
];

/**
 * Ders adı ve sınıf/kademe bilgisine göre standart ders kodu üretir.
 * Örn: ("Matematik", "9A") -> "MAT9"
 * Örn: ("Fizik", "10") -> "FİZ10"
 */
export const generateCourseCode = (subjectName = '', gradeOrClassName = '') => {
  if (!subjectName) return '';
  const s = subjectName.trim();
  
  // Sınıf adından veya kademeden rakamı çıkar (örn: "9A" -> "9", "11-SAY" -> "11")
  let grade = '';
  if (gradeOrClassName) {
    const match = String(gradeOrClassName).match(/\d+/);
    if (match) grade = match[0];
  }

  // Eğer ders adı zaten standart kod biçimindeyse (örn: "MAT9", "EDB10", "FİZ11")
  const standardPattern = /^([A-ZÇĞİÖŞÜçğıöşü]+)(\d+)$/i;
  const matchStd = s.match(standardPattern);
  if (matchStd) {
    const prefix = matchStd[1].toUpperCase();
    const existingNum = matchStd[2];
    return `${prefix}${grade || existingNum}`;
  }

  // Kök haritasından eşleşme ara
  for (const item of SUBJECT_ROOTS) {
    if (item.match.test(s)) {
      return `${item.root}${grade}`;
    }
  }

  // Eşleşme yoksa ilk 3 harf + kademe
  const clean = s.replace(/[^a-zA-ZÇĞİÖŞÜçğıöşü0-9]/g, '').toUpperCase();
  return `${clean.slice(0, 3)}${grade}`;
};

/**
 * Ders adını ve kodunu birleştirip formatlar
 * Örn: "Matematik (MAT9)" veya sadece kod varsa kodu döndürür
 */
export const formatCourseDisplay = (subject = '', code = '') => {
  if (!code) return subject;
  if (!subject) return code;
  if (subject.toUpperCase() === code.toUpperCase()) return code;
  return `${subject} (${code})`;
};

// Yaygın Ortaöğretim Müfredat Ders Şablonları (Manuel Eklemede Hızlı Seçim İçin)
export const COMMON_SUBJECT_TEMPLATES = [
  { name: 'Türk Dili ve Edebiyatı', rootCode: 'EDB', hours: 5, category: 'Dil ve Edebiyat' },
  { name: 'Matematik', rootCode: 'MAT', hours: 6, category: 'Matematik ve Fen' },
  { name: 'Fizik', rootCode: 'FİZ', hours: 2, category: 'Matematik ve Fen' },
  { name: 'Kimya', rootCode: 'KİM', hours: 2, category: 'Matematik ve Fen' },
  { name: 'Biyoloji', rootCode: 'BİY', hours: 2, category: 'Matematik ve Fen' },
  { name: 'Tarih', rootCode: 'TRH', hours: 2, category: 'Sosyal Bilimler' },
  { name: 'Coğrafya', rootCode: 'COĞ', hours: 2, category: 'Sosyal Bilimler' },
  { name: 'Felsefe', rootCode: 'FEL', hours: 2, category: 'Sosyal Bilimler' },
  { name: 'İngilizce', rootCode: 'İNG', hours: 4, category: 'Yabancı Dil' },
  { name: 'Arapça', rootCode: 'ARP', hours: 4, category: 'Meslek Dersleri' },
  { name: "Kur'an-ı Kerim", rootCode: 'KK', hours: 4, category: 'Meslek Dersleri' },
  { name: 'Temel Dini Bilgiler', rootCode: 'TDB', hours: 1, category: 'Meslek Dersleri' },
  { name: 'Siyer', rootCode: 'SİY', hours: 2, category: 'Meslek Dersleri' },
  { name: 'Hadis', rootCode: 'HAD', hours: 2, category: 'Meslek Dersleri' },
  { name: 'Fıkıh', rootCode: 'FIK', hours: 2, category: 'Meslek Dersleri' },
  { name: 'Tefsir', rootCode: 'TEF', hours: 2, category: 'Meslek Dersleri' },
  { name: 'Akaid', rootCode: 'AKD', hours: 1, category: 'Meslek Dersleri' },
  { name: 'Hitabet ve Mesleki Uygulama', rootCode: 'HİT', hours: 2, category: 'Meslek Dersleri' },
  { name: 'Görsel Sanatlar', rootCode: 'GS', hours: 1, category: 'Sanat ve Spor' },
  { name: 'Beden Eğitimi', rootCode: 'BED', hours: 2, category: 'Sanat ve Spor' },
  { name: 'Müzik', rootCode: 'MZK', hours: 1, category: 'Sanat ve Spor' },
  { name: 'Sağlık Bilgisi ve Trafik Kültürü', rootCode: 'SAĞ', hours: 1, category: 'Genel' },
  { name: 'Rehberlik ve Yönlendirme', rootCode: 'REH', hours: 1, category: 'Genel' }
];
