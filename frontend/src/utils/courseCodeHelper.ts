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

// Kısaltma kök haritası (türkçe küçük harfe çevrilmiş metin üzerinden eşleştirilir)
const SUBJECT_ROOTS = [
  { match: /(?:s\.\s*)?matematik\s*ve\s*bilim|mbu/, root: 'MBU' },
  { match: /seçmeli\s*matematik|s\.\s*mat|smat/, root: 'SMAT' },
  { match: /temel\s*matematik|t\.\s*mat|tmat/, root: 'TMAT' },
  { match: /matematik|mat/, root: 'MAT' },
  { match: /seçmeli\s*(?:türk\s*dili(?:\s*ve)?\s*)?edebiyat|s\.\s*türk\s*dili|s\.\s*tde|stdeb|stedb|sedb/, root: 'SEDB' },
  { match: /edebiyat|tdeb|tde|edb/, root: 'EDB' },
  { match: /türk\s*kültür\s*medeniyeti|tkm/, root: 'TKM' },
  { match: /türkçe|trk/, root: 'TRK' },
  { match: /spor\s*ve\s*fizik[iî]|sfe/, root: 'SFE' },
  { match: /s\.\s*fizik|seçmeli\s*fizik|sfiz/, root: 'SFİZ' },
  { match: /fizik|fiz|fzk/, root: 'FİZ' },
  { match: /s\.\s*kimya|seçmeli\s*kimya|skim/, root: 'SKİM' },
  { match: /kimya|kmy|kim/, root: 'KİM' },
  { match: /s\.\s*biyoloji|seçmeli\s*biyoloji|sbiy/, root: 'SBİY' },
  { match: /biyoloji|biy/, root: 'BİY' },
  { match: /ink[ıi]lap|t\.c\.|ink|ikt/, root: 'İNK' },
  { match: /çağdaş|ctdt|çtdt/, root: 'ÇTD' },
  { match: /islam\s*bilim\s*tarihi|ibt/, root: 'İBT' },
  { match: /dinler\s*tarihi|dint/, root: 'DNT' },
  { match: /tarih|trh|tar/, root: 'TRH' },
  { match: /s\.\s*coğrafya|seçmeli\s*coğrafya|scoğ|scog/, root: 'SCOĞ' },
  { match: /coğrafya|cogh|cog|coğ/, root: 'COĞ' },
  { match: /felsefe|fel/, root: 'FEL' },
  { match: /psikoloji|psk/, root: 'PSK' },
  { match: /ingilizce|ing/, root: 'İNG' },
  { match: /mesleki\s*arapça|m\.\s*arapça|marp/, root: 'MARP' },
  { match: /arapça|arp/, root: 'ARP' },
  { match: /kuran|kur'an|kker|kkrim|kk/, root: 'KK' },
  { match: /peygamberimizin\s*hayatı|ph/, root: 'PH' },
  { match: /din\s*kültürü|dk/, root: 'DK' },
  { match: /siyer|siy/, root: 'SİY' },
  { match: /hadis|had/, root: 'HAD' },
  { match: /fıkıh|fık/, root: 'FIK' },
  { match: /tefsir|tef/, root: 'TEF' },
  { match: /kelam|kel/, root: 'KEL' },
  { match: /akaid|akd/, root: 'AKD' },
  { match: /hitabet|hit/, root: 'HİT' },
  { match: /tezhip|tez/, root: 'TEZ' },
  { match: /osmanlıca|osm/, root: 'OSM' },
  { match: /mantık|man/, root: 'MAN' },
  { match: /sosyoloji/, root: 'SOS' },
  { match: /sosyal\s*bilgiler/, root: 'SB' },
  { match: /islam\s*kültür|ikmed|ikm/, root: 'İKM' },
  { match: /temel\s*dini|tdb|temd/, root: 'TDB' },
  { match: /afet\s*bilinci|afb/, root: 'AFB' },
  { match: /bilişim|bty/, root: 'BTY' },
  { match: /teknoloji\s*tasarım/, root: 'TT' },
  { match: /çevre\s*eğ|iklim\s*değ|çeid/, root: 'ÇEİD' },
  { match: /sağlık|sag|sağ/, root: 'SAĞ' },
  { match: /adab|adabı|muaşeret|a\.mua/, root: 'ADB' },
  { match: /astronomi|aub/, root: 'AUB' },
  { match: /^fen\s*bilimleri$/, root: 'FEN' },
  { match: /fen\s*bilim|fent/, root: 'FNT' },
  { match: /proje/, root: 'PRJ' },
  { match: /girişimcilik|giriş/, root: 'GİR' },
  { match: /görsel|gs/, root: 'GS' },
  { match: /müzik|mzk/, root: 'MZK' },
  { match: /beden|bed/, root: 'BED' },
  { match: /rehberlik|reh/, root: 'REH' }
];

/**
 * Ders adı ve sınıf/kademe bilgisine göre standart ders kodu üretir.
 * Örn: ("Matematik", "9A") -> "MAT9"
 * Örn: ("Fizik", "10") -> "FİZ10"
 */
export const generateCourseCode = (subjectName = '', gradeOrClassName = '') => {
  if (!subjectName) return '';
  const s = subjectName.trim();
  const sLower = s.toLocaleLowerCase('tr-TR');
  
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
    if (item.match.test(sLower)) {
      return `${item.root}${grade}`;
    }
  }

  // Eşleşme yoksa ilk 3 harf + kademe
  const clean = s.replace(/[^a-zA-ZÇĞİÖŞÜçğıöşü0-9]/g, '').toUpperCase();
  return `${clean.slice(0, 3)}${grade}`;
};

/**
 * Bir sınıfın haftalık hedef ders saatini döner (örn. karma AİHL'de ortaokul 36, lise 40 saat).
 */
export const getClassroomTargetHours = (
  classroom?: { name?: string; targetWeeklyHours?: number } | null,
  settings?: { days?: string[]; periodsPerDay?: number } | null
): number => {
  const daysCount = settings?.days?.length || 5;
  const periodsPerDay = Number(settings?.periodsPerDay) || 8;
  const defaultTarget = daysCount * periodsPerDay;
  if (!classroom) return defaultTarget;
  if (typeof classroom.targetWeeklyHours === 'number' && classroom.targetWeeklyHours > 0) {
    return classroom.targetWeeklyHours;
  }
  const cleanName = (classroom.name || '').trim();
  if (/^[5678](?![0-9])/.test(cleanName) && periodsPerDay === 8) {
    return Math.min(defaultTarget, 36);
  }
  return defaultTarget;
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
