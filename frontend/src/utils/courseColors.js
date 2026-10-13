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
