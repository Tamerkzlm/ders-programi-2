// frontend/src/utils/courseColors.js
/**
 * Her sınıf + ders kombinasyonuna (ör. 9A-MAT, 10B-MAT, 11A-FİZ) özel
 * deterministik, yüksek kontrastlı ve modern renk stilleri üretir.
 */

export const COURSE_PALETTES = [
  // 1. İndigo / Gece Mavisi (Matematik vb.)
  {
    bg: 'bg-gradient-to-r from-indigo-600 to-blue-600',
    border: 'border-indigo-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-indigo-500/20'
  },
  // 2. Zümrüt / Turkuaz (Biyoloji, Fen vb.)
  {
    bg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    border: 'border-emerald-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-emerald-500/20'
  },
  // 3. Gül / Pembe (Edebiyat, Türkçe vb.)
  {
    bg: 'bg-gradient-to-r from-rose-600 to-pink-600',
    border: 'border-rose-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-rose-500/20'
  },
  // 4. Kehribar / Sıcak Turuncu (Tarih, Sosyal vb.)
  {
    bg: 'bg-gradient-to-r from-amber-600 to-orange-600',
    border: 'border-amber-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-amber-500/20'
  },
  // 5. Menekşe / Mor (Fizik vb.)
  {
    bg: 'bg-gradient-to-r from-violet-600 to-purple-600',
    border: 'border-violet-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-violet-500/20'
  },
  // 6. Camgöbeği / Gök Mavisi (İngilizce, Yabancı Dil vb.)
  {
    bg: 'bg-gradient-to-r from-cyan-600 to-sky-600',
    border: 'border-cyan-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-cyan-500/20'
  },
  // 7. Fuşya / Canlı Pembe (Kimya vb.)
  {
    bg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600',
    border: 'border-fuchsia-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-fuchsia-500/20'
  },
  // 8. Kiremit / Mercan (Coğrafya vb.)
  {
    bg: 'bg-gradient-to-r from-orange-600 to-red-600',
    border: 'border-orange-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-orange-500/20'
  },
  // 9. Deniz Yeşili / Teal (Din Kültürü, İHL vb.)
  {
    bg: 'bg-gradient-to-r from-teal-600 to-emerald-700',
    border: 'border-teal-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-teal-500/20'
  },
  // 10. Limon Yeşili / Orman (Beden, Müzik vb.)
  {
    bg: 'bg-gradient-to-r from-lime-600 to-emerald-700',
    border: 'border-lime-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-lime-500/20'
  },
  // 11. Mavi / Kobalt
  {
    bg: 'bg-gradient-to-r from-blue-600 to-indigo-700',
    border: 'border-blue-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-blue-500/20'
  },
  // 12. Derin Mor / Plum
  {
    bg: 'bg-gradient-to-r from-purple-700 to-indigo-800',
    border: 'border-purple-800',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-purple-500/20'
  },
  // 13. Sıcak Kırmızı / Bordo
  {
    bg: 'bg-gradient-to-r from-red-600 to-rose-700',
    border: 'border-red-700',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-red-500/20'
  },
  // 14. Altın Sarısı / Amber
  {
    bg: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    border: 'border-amber-600',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-amber-500/20'
  },
  // 15. Koyu Turkuaz
  {
    bg: 'bg-gradient-to-r from-teal-700 to-cyan-800',
    border: 'border-teal-800',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-teal-500/20'
  },
  // 16. Çivit / Slate
  {
    bg: 'bg-gradient-to-r from-slate-700 to-indigo-900',
    border: 'border-slate-800',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    shadow: 'shadow-xs shadow-slate-500/20'
  }
];

export const getCourseColorClass = (subjectName = '', className = '') => {
  const key = `${className}-${subjectName}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COURSE_PALETTES.length;
  const p = COURSE_PALETTES[index];
  return `${p.bg} ${p.border} ${p.text} ${p.shadow}`;
};

/**
 * 🌸 HER DERSE ÖZGÜ SOFT / PASTEL RENK PALETİ
 * Ortak sınav takviminde bir ders (örn: Matematik) tüm sınıf kademelerinde aynı soft renkle görünür.
 */
export const SOFT_SUBJECT_PALETTES = {
  matematik: {
    bg: 'bg-blue-50/90',
    border: 'border-blue-300',
    text: 'text-blue-950',
    badge: 'bg-blue-100 text-blue-900',
    rawHex: '#dbeafe',
    rawText: '#1e3a8a'
  },
  edebiyat: {
    bg: 'bg-rose-50/90',
    border: 'border-rose-300',
    text: 'text-rose-950',
    badge: 'bg-rose-100 text-rose-900',
    rawHex: '#ffe4e6',
    rawText: '#881337'
  },
  fizik: {
    bg: 'bg-cyan-50/90',
    border: 'border-cyan-300',
    text: 'text-cyan-950',
    badge: 'bg-cyan-100 text-cyan-900',
    rawHex: '#cffafe',
    rawText: '#164e63'
  },
  kimya: {
    bg: 'bg-purple-50/90',
    border: 'border-purple-300',
    text: 'text-purple-950',
    badge: 'bg-purple-100 text-purple-900',
    rawHex: '#f3e8ff',
    rawText: '#581c87'
  },
  biyoloji: {
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-900',
    rawHex: '#d1fae5',
    rawText: '#064e3b'
  },
  tarih: {
    bg: 'bg-amber-50/90',
    border: 'border-amber-300',
    text: 'text-amber-950',
    badge: 'bg-amber-100 text-amber-900',
    rawHex: '#fef3c7',
    rawText: '#78350f'
  },
  cografya: {
    bg: 'bg-teal-50/90',
    border: 'border-teal-300',
    text: 'text-teal-950',
    badge: 'bg-teal-100 text-teal-900',
    rawHex: '#ccfbf1',
    rawText: '#134e4a'
  },
  felsefe: {
    bg: 'bg-fuchsia-50/90',
    border: 'border-fuchsia-300',
    text: 'text-fuchsia-950',
    badge: 'bg-fuchsia-100 text-fuchsia-900',
    rawHex: '#fae8ff',
    rawText: '#701a75'
  },
  ingilizce: {
    bg: 'bg-indigo-50/90',
    border: 'border-indigo-300',
    text: 'text-indigo-950',
    badge: 'bg-indigo-100 text-indigo-900',
    rawHex: '#e0e7ff',
    rawText: '#312e81'
  },
  almanca: {
    bg: 'bg-orange-50/90',
    border: 'border-orange-300',
    text: 'text-orange-950',
    badge: 'bg-orange-100 text-orange-900',
    rawHex: '#ffedd5',
    rawText: '#7c2d12'
  },
  din: {
    bg: 'bg-lime-50/90',
    border: 'border-lime-300',
    text: 'text-lime-950',
    badge: 'bg-lime-100 text-lime-900',
    rawHex: '#ecfccb',
    rawText: '#365314'
  },
  saglik: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
    rawHex: '#e6f4ea',
    rawText: '#137333'
  }
};

export const getSubjectSoftColor = (subjectName = '') => {
  const clean = (subjectName || '').toLowerCase().trim()
    .replace(/^seçmeli\s+/i, '')
    .replace(/^temel\s+/i, '')
    .replace(/^ortak\s+/i, '')
    .replace(/\s*\d+.*$/i, ''); // e.g. "Matematik 10" -> "matematik"

  if (clean.includes('mat')) return SOFT_SUBJECT_PALETTES.matematik;
  if (clean.includes('edeb') || clean.includes('tdeb') || clean.includes('türkçe') || clean.includes('turkce') || clean.includes('türk dili')) return SOFT_SUBJECT_PALETTES.edebiyat;
  if (clean.includes('fiz')) return SOFT_SUBJECT_PALETTES.fizik;
  if (clean.includes('kim')) return SOFT_SUBJECT_PALETTES.kimya;
  if (clean.includes('biy')) return SOFT_SUBJECT_PALETTES.biyoloji;
  if (clean.includes('tar') || clean.includes('inkılap') || clean.includes('inkilap') || clean.includes('çağdaş')) return SOFT_SUBJECT_PALETTES.tarih;
  if (clean.includes('coğ') || clean.includes('cog')) return SOFT_SUBJECT_PALETTES.cografya;
  if (clean.includes('fel') || clean.includes('psk') || clean.includes('sos') || clean.includes('man')) return SOFT_SUBJECT_PALETTES.felsefe;
  if (clean.includes('ing') || clean.includes('yabancı dil')) return SOFT_SUBJECT_PALETTES.ingilizce;
  if (clean.includes('alm')) return SOFT_SUBJECT_PALETTES.almanca;
  if (clean.includes('din') || clean.includes('kuran') || clean.includes('siyer') || clean.includes('hadis') || clean.includes('fıkıh') || clean.includes('arp')) return SOFT_SUBJECT_PALETTES.din;
  if (clean.includes('sağ') || clean.includes('sag') || clean.includes('bed') || clean.includes('müz') || clean.includes('gör')) return SOFT_SUBJECT_PALETTES.saglik;

  const fallbacks = [
    { bg: 'bg-sky-50/90', border: 'border-sky-300', text: 'text-sky-950', badge: 'bg-sky-100 text-sky-900', rawHex: '#e0f2fe', rawText: '#0c4a6e' },
    { bg: 'bg-violet-50/90', border: 'border-violet-300', text: 'text-violet-950', badge: 'bg-violet-100 text-violet-900', rawHex: '#ede9fe', rawText: '#4c1d95' },
    { bg: 'bg-yellow-50/90', border: 'border-yellow-300', text: 'text-yellow-950', badge: 'bg-yellow-100 text-yellow-900', rawHex: '#fef9c3', rawText: '#713f12' },
    { bg: 'bg-pink-50/90', border: 'border-pink-300', text: 'text-pink-950', badge: 'bg-pink-100 text-pink-900', rawHex: '#fce7f3', rawText: '#831843' },
    { bg: 'bg-teal-50/90', border: 'border-teal-300', text: 'text-teal-950', badge: 'bg-teal-100 text-teal-900', rawHex: '#ccfbf1', rawText: '#134e4a' },
    { bg: 'bg-stone-50/90', border: 'border-stone-300', text: 'text-stone-900', badge: 'bg-stone-100 text-stone-800', rawHex: '#f5f5f4', rawText: '#1c1917' }
  ];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  return fallbacks[Math.abs(hash) % fallbacks.length];
};

