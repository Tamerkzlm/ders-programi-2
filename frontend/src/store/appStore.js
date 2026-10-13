// frontend/src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { solveDykSchedule } from '../utils/dykEngine';
import { solveExamSchedule, solveSupervisors, DEFAULT_EXAM_SUBJECTS } from '../utils/examEngine';
import { generateCourseCode } from '../utils/courseCodeHelper';

// Backend adresi: .env dosyasındaki VITE_API_URL (boşsa yerel geliştirme sunucusu)
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Silme sonrası bile çakışmayan benzersiz kimlik
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) VARSAYILAN VERİLERİ
const DEFAULT_DYK_GROUPS = [
  { id: "dg1", name: "12-A Sayısal Grubu", grade: "12" },
  { id: "dg2", name: "12-B Eşit Ağırlık Grubu", grade: "12" },
  { id: "dg3", name: "11-A Sayısal Grubu", grade: "11" },
  { id: "dg4", name: "8-A LGS Hazırlık Grubu", grade: "8" }
];

const DEFAULT_DYK_ASSIGNMENTS = [
  { id: "da1", groupId: "dg1", teacherId: "t5", subject: "Matematik (AYT)", blocksPerWeek: 2 },
  { id: "da2", groupId: "dg1", teacherId: "t8", subject: "Fizik (AYT)", blocksPerWeek: 1 },
  { id: "da3", groupId: "dg1", teacherId: "t10", subject: "Kimya (AYT)", blocksPerWeek: 1 },
  { id: "da4", groupId: "dg1", teacherId: "t12", subject: "Biyoloji (AYT)", blocksPerWeek: 1 },
  { id: "da5", groupId: "dg2", teacherId: "t2", subject: "Edebiyat (AYT)", blocksPerWeek: 2 },
  { id: "da6", groupId: "dg2", teacherId: "t5", subject: "Matematik (AYT)", blocksPerWeek: 2 },
  { id: "da7", groupId: "dg2", teacherId: "t13", subject: "Coğrafya (AYT)", blocksPerWeek: 1 },
  { id: "da8", groupId: "dg3", teacherId: "t24", subject: "Matematik (11)", blocksPerWeek: 2 },
  { id: "da9", groupId: "dg3", teacherId: "t8", subject: "Fizik (11)", blocksPerWeek: 1 },
  { id: "da10", groupId: "dg4", teacherId: "t25", subject: "Matematik (LGS)", blocksPerWeek: 2 }
];

const DEFAULT_DYK_AVAILABILITIES = {
  "t5": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cumartesi"],
  "t2": ["Pazartesi", "Çarşamba", "Cuma", "Cumartesi"],
  "t8": ["Salı", "Perşembe", "Cumartesi"],
  "t10": ["Pazartesi", "Çarşamba", "Cuma"],
  "t12": ["Salı", "Perşembe", "Cumartesi"],
  "t13": ["Pazartesi", "Çarşamba", "Cumartesi"],
  "t24": ["Salı", "Cuma", "Cumartesi"],
  "t25": ["Pazartesi", "Perşembe", "Cumartesi"]
};

// 📋 ANTAKYA HZ. AYŞE KIZ AİHL GERÇEK ÖĞRETMEN LİSTESİ (35 ÖĞRETMEN - KISITLAR VE BOŞ GÜNLER DAHİL)
const REAL_TEACHERS = [
  { id: "t1", name: "PINAR TOKLAR", branch: "IHL", unavailable: { "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t2", name: "CESUR BEYAZÇİÇEK", branch: "TDEB", unavailable: { "Salı": [1, 2] }, isExempt: false },
  { id: "t3", name: "RIZA DÖNMEZ", branch: "TDEB", unavailable: {}, isExempt: false },
  { id: "t4", name: "SUNA ÇAKIROĞLU", branch: "TDEB", unavailable: { "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t5", name: "TAMER KÖZLEME", branch: "MAT", unavailable: { "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false, priorityFullDay: "Pazartesi", fillLateHours: true },
  { id: "t6", name: "YELİZ OKUYAN", branch: "MAT", unavailable: { "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t7", name: "SAFFET AYDINER", branch: "MAT", unavailable: { "Salı": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t8", name: "SEVCAN YOĞUN", branch: "FİZ", unavailable: { "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t9", name: "FERİDUN KİMYA", branch: "KIM", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8], "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8], "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true }, // 8 Saat - Part-time / Muaf (Salı-Çarşamba)
  { id: "t10", name: "ÖZGE CEYLAN", branch: "KIM", unavailable: { "Cuma": [7, 8] }, isExempt: false },
  { id: "t11", name: "BAHAR DİNDAR YILMAZ", branch: "BIO", unavailable: {}, isExempt: false },
  { id: "t12", name: "MERYEM AĞCA", branch: "BIO", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8], "Salı": [1, 2, 3, 4, 5, 6, 7, 8], "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true }, // 12 Saat - Part-time / Muaf (Çarşamba-Perşembe)
  { id: "t13", name: "GÖKHAN SAĞMEN", branch: "COG", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t14", name: "MEHMET DAGLI", branch: "ING", unavailable: { "Çarşamba": [1] }, isExempt: false },
  { id: "t15", name: "ALI BİLGİÇ", branch: "FEL", unavailable: { "Pazartesi": [1, 2] }, isExempt: false },
  { id: "t16", name: "VOLKAN BARTIK", branch: "COG", unavailable: {}, isExempt: false },
  { id: "t17", name: "KEMAL KUNDAK", branch: "MAT", unavailable: { "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t18", name: "SEMA ÇETİN", branch: "IHL", unavailable: {}, isExempt: false },
  { id: "t19", name: "YASIN DURAK", branch: "IHL", unavailable: {}, isExempt: false },
  { id: "t20", name: "CEMİL MURAT KURU", branch: "TDEB", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8], "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8], "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8], "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true, isAdministrator: true }, // 2 Saat - Müdür V. (Yalnız Salı)
  { id: "t21", name: "ZÜLEYHA DÖKMECİ", branch: "IHL", unavailable: { "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8], "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8], "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true }, // 10 Saat - Part-time / Muaf (Pazartesi-Salı)
  { id: "t22", name: "MEHMET USLU", branch: "IHL", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8], "Salı": [1, 2, 3, 4, 5, 6, 7, 8], "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true }, // 11 Saat - Part-time / Muaf (Perşembe-Cuma)
  { id: "t23", name: "ESRA BEREKET", branch: "ARP", unavailable: {}, isExempt: false },
  { id: "t24", name: "ABDULSETTAR AY", branch: "MAT", unavailable: { "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t25", name: "SELIM BEYOĞLU", branch: "MAT", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t26", name: "ALI SARIOĞLU", branch: "FİZ", unavailable: {}, isExempt: false },
  { id: "t27", name: "SUNA ŞERİFOĞLU", branch: "ING", unavailable: { "Salı": [1, 2, 3, 4, 5, 6, 7, 8], "Perşembe": [7, 8] }, isExempt: false },
  { id: "t28", name: "BÜŞRA AKSOY ÖZTÜRK", branch: "IHL", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t29", name: "MEHMET ALKAN", branch: "IHL", unavailable: {}, isExempt: false },
  { id: "t30", name: "AYŞE NUR GÜLER", branch: "GSBD", unavailable: { "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t31", name: "MUSTAFA BAYAR", branch: "COG", unavailable: { "Pazartesi": [1, 2, 3, 4, 5, 6, 7, 8], "Salı": [1, 2, 3, 4, 5, 6, 7, 8], "Çarşamba": [1, 2, 3, 4, 5, 6, 7, 8], "Cuma": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: true }, // 6 Saat - Part-time / Muaf (Yalnız Perşembe)
  { id: "t32", name: "DILAY ALTINÖZ", branch: "TAR", unavailable: {}, isExempt: false },
  { id: "t33", name: "IRMAK KÜÇÜKBAŞ YARAR", branch: "TDEB", unavailable: { "Perşembe": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false },
  { id: "t34", name: "MUSTAFA BULUT", branch: "IHL", unavailable: {}, isExempt: false },
  { id: "t35", name: "REYYAN GÜNEŞ", branch: "TAR", unavailable: { "Salı": [1, 2, 3, 4, 5, 6, 7, 8] }, isExempt: false }
];

// 🏫 ATAMA LİSTESİNDEKİ TÜM SINIFLAR VE BİREBİR DERS ATAMALARI (18 ŞUBE - 720 SAAT)
const REAL_CLASSROOMS = [
  // 9. SINIFLAR
  {
    id: "c1", name: "9A",
    courses: [
      { id: "co1_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t33" },
      { id: "co1_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t24" },
      { id: "co1_3", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co1_4", subject: "KIM9", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co1_5", subject: "BİY", hoursPerWeek: 2, teacherId: "t12" },
      { id: "co1_6", subject: "9SAG", hoursPerWeek: 1, teacherId: "t12" },
      { id: "co1_7", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co1_8", subject: "COGH2", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co1_9", subject: "9ING", hoursPerWeek: 5, teacherId: "t27" },
      { id: "co1_10", subject: "ARP9", hoursPerWeek: 4, teacherId: "t23" },
      { id: "co1_11", subject: "KKRİM", hoursPerWeek: 5, teacherId: "t19" },
      { id: "co1_12", subject: "TDB", hoursPerWeek: 1, teacherId: "t19" },
      { id: "co1_13", subject: "GSBD", hoursPerWeek: 2, teacherId: "t30" },
      { id: "co1_14", subject: "REHB", hoursPerWeek: 1, teacherId: "t19" }
    ]
  },
  {
    id: "c2", name: "9B",
    courses: [
      { id: "co2_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t33" },
      { id: "co2_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t25" },
      { id: "co2_3", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co2_4", subject: "KIM9", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co2_5", subject: "BİY", hoursPerWeek: 2, teacherId: "t12" },
      { id: "co2_6", subject: "9SAG", hoursPerWeek: 1, teacherId: "t12" },
      { id: "co2_7", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co2_8", subject: "COGH2", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co2_9", subject: "9ING", hoursPerWeek: 5, teacherId: "t27" },
      { id: "co2_10", subject: "ARP9", hoursPerWeek: 4, teacherId: "t23" },
      { id: "co2_11", subject: "KKRİM", hoursPerWeek: 5, teacherId: "t18" },
      { id: "co2_12", subject: "TDB", hoursPerWeek: 1, teacherId: "t19" },
      { id: "co2_13", subject: "GSBD", hoursPerWeek: 2, teacherId: "t30" },
      { id: "co2_14", subject: "REHB", hoursPerWeek: 1, teacherId: "t18" }
    ]
  },
  {
    id: "c3", name: "9C",
    courses: [
      { id: "co3_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t33" },
      { id: "co3_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t17" },
      { id: "co3_3", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co3_4", subject: "KIM9", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co3_5", subject: "BİY", hoursPerWeek: 2, teacherId: "t12" },
      { id: "co3_6", subject: "9SAG", hoursPerWeek: 1, teacherId: "t12" },
      { id: "co3_7", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co3_8", subject: "COGH2", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co3_9", subject: "9ING", hoursPerWeek: 5, teacherId: "t27" },
      { id: "co3_10", subject: "ARP9", hoursPerWeek: 4, teacherId: "t23" },
      { id: "co3_11", subject: "KKRİM", hoursPerWeek: 5, teacherId: "t28" },
      { id: "co3_12", subject: "TDB", hoursPerWeek: 1, teacherId: "t19" },
      { id: "co3_13", subject: "GSBD", hoursPerWeek: 2, teacherId: "t30" },
      { id: "co3_14", subject: "REHB", hoursPerWeek: 1, teacherId: "t27" }
    ]
  },
  {
    id: "c4", name: "9D",
    courses: [
      { id: "co4_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t33" },
      { id: "co4_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t7" },
      { id: "co4_3", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co4_4", subject: "KIM9", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co4_5", subject: "BİY", hoursPerWeek: 2, teacherId: "t12" },
      { id: "co4_6", subject: "9SAG", hoursPerWeek: 1, teacherId: "t12" },
      { id: "co4_7", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co4_8", subject: "COGH2", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co4_9", subject: "9ING", hoursPerWeek: 5, teacherId: "t27" },
      { id: "co4_10", subject: "ARP9", hoursPerWeek: 4, teacherId: "t23" },
      { id: "co4_11", subject: "KKRİM", hoursPerWeek: 5, teacherId: "t29" },
      { id: "co4_12", subject: "TDB", hoursPerWeek: 1, teacherId: "t19" },
      { id: "co4_13", subject: "GSBD", hoursPerWeek: 2, teacherId: "t30" },
      { id: "co4_14", subject: "REHB", hoursPerWeek: 1, teacherId: "t23" }
    ]
  },

  // 10. SINIFLAR
  {
    id: "c5", name: "10A",
    courses: [
      { id: "co5_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t4" },
      { id: "co5_2", subject: "MAT10", hoursPerWeek: 6, teacherId: "t25" },
      { id: "co5_3", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co5_4", subject: "COG", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co5_5", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co5_6", subject: "KİMYA", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co5_7", subject: "BİY", hoursPerWeek: 2, teacherId: "t11" },
      { id: "co5_8", subject: "FELH1", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co5_9", subject: "KKER", hoursPerWeek: 4, teacherId: "t1" },
      { id: "co5_10", subject: "SİYER", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co5_11", subject: "HADİS", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co5_12", subject: "FIKIH", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co5_13", subject: "ARP10", hoursPerWeek: 2, teacherId: "t23" },
      { id: "co5_14", subject: "O.TÜR2", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co5_15", subject: "ING", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co5_16", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c6", name: "10B",
    courses: [
      { id: "co6_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t4" },
      { id: "co6_2", subject: "MAT10", hoursPerWeek: 6, teacherId: "t5" },
      { id: "co6_3", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co6_4", subject: "COG", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co6_5", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co6_6", subject: "KİMYA", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co6_7", subject: "BİY", hoursPerWeek: 2, teacherId: "t11" },
      { id: "co6_8", subject: "FELH1", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co6_9", subject: "KKER", hoursPerWeek: 4, teacherId: "t34" },
      { id: "co6_10", subject: "SİYER", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co6_11", subject: "HADİS", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co6_12", subject: "FIKIH", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co6_13", subject: "ARP10", hoursPerWeek: 2, teacherId: "t23" },
      { id: "co6_14", subject: "O.TÜR2", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co6_15", subject: "ING", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co6_16", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c7", name: "10C",
    courses: [
      { id: "co7_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t4" },
      { id: "co7_2", subject: "MAT10", hoursPerWeek: 6, teacherId: "t5" },
      { id: "co7_3", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co7_4", subject: "COG", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co7_5", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co7_6", subject: "KİMYA", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co7_7", subject: "BİY", hoursPerWeek: 2, teacherId: "t11" },
      { id: "co7_8", subject: "FELH1", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co7_9", subject: "KKER", hoursPerWeek: 4, teacherId: "t18" },
      { id: "co7_10", subject: "SİYER", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co7_11", subject: "HADİS", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co7_12", subject: "FIKIH", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co7_13", subject: "ARP10", hoursPerWeek: 2, teacherId: "t23" },
      { id: "co7_14", subject: "O.TÜR2", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co7_15", subject: "ING", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co7_16", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c8", name: "10D",
    courses: [
      { id: "co8_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t3" },
      { id: "co8_2", subject: "MAT10", hoursPerWeek: 6, teacherId: "t24" },
      { id: "co8_3", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co8_4", subject: "COG", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co8_5", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co8_6", subject: "KİMYA", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co8_7", subject: "BİY", hoursPerWeek: 2, teacherId: "t11" },
      { id: "co8_8", subject: "FELH1", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co8_9", subject: "KKER", hoursPerWeek: 4, teacherId: "t18" },
      { id: "co8_10", subject: "SİYER", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co8_11", subject: "HADİS", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co8_12", subject: "FIKIH", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co8_13", subject: "ARP10", hoursPerWeek: 2, teacherId: "t23" },
      { id: "co8_14", subject: "O.TÜR2", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co8_15", subject: "ING", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co8_16", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c9", name: "10H", // HAFIZLIK ŞUBESİ
    courses: [
      { id: "co9_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t4" },
      { id: "co9_2", subject: "MAT10", hoursPerWeek: 6, teacherId: "t7" },
      { id: "co9_3", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co9_4", subject: "COG", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co9_5", subject: "FIZK", hoursPerWeek: 2, teacherId: "t8" },
      { id: "co9_6", subject: "KİMYA", hoursPerWeek: 2, teacherId: "t10" },
      { id: "co9_7", subject: "BİY", hoursPerWeek: 2, teacherId: "t11" },
      { id: "co9_8", subject: "FELH1", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co9_9", subject: "KKER", hoursPerWeek: 4, teacherId: "t22" },
      { id: "co9_10", subject: "SİYER", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co9_11", subject: "HADİS", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co9_12", subject: "FIKIH", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co9_13", subject: "ARAPÇ3", hoursPerWeek: 3, teacherId: "t34" },
      { id: "co9_14", subject: "O.TÜR1", hoursPerWeek: 1, teacherId: "t34" },
      { id: "co9_15", subject: "ING", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co9_16", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },

  // 11. SINIFLAR
  {
    id: "c10", name: "11A",
    courses: [
      { id: "co10_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t3" },
      { id: "co10_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t6" },
      { id: "co10_3", subject: "FİZİK", hoursPerWeek: 4, teacherId: "t26" },
      { id: "co10_4", subject: "KMYA", hoursPerWeek: 4, teacherId: "t10" },
      { id: "co10_5", subject: "BİYO", hoursPerWeek: 4, teacherId: "t11" },
      { id: "co10_6", subject: "TARİH", hoursPerWeek: 2, teacherId: "t35" },
      { id: "co10_7", subject: "11FEL", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co10_8", subject: "KKER11", hoursPerWeek: 3, teacherId: "t19" },
      { id: "co10_9", subject: "TEFSIR", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co10_10", subject: "AKAID", hoursPerWeek: 1, teacherId: "t29" },
      { id: "co10_11", subject: "HITAB", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co10_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co10_13", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co10_14", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c11", name: "11B",
    courses: [
      { id: "co11_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t3" },
      { id: "co11_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t17" },
      { id: "co11_3", subject: "FİZİK", hoursPerWeek: 4, teacherId: "t26" },
      { id: "co11_4", subject: "KMYA", hoursPerWeek: 4, teacherId: "t10" },
      { id: "co11_5", subject: "BİYO", hoursPerWeek: 4, teacherId: "t11" },
      { id: "co11_6", subject: "TARİH", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co11_7", subject: "11FEL", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co11_8", subject: "KKER11", hoursPerWeek: 3, teacherId: "t19" },
      { id: "co11_9", subject: "TEFSIR", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co11_10", subject: "AKAID", hoursPerWeek: 1, teacherId: "t29" },
      { id: "co11_11", subject: "HITAB", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co11_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co11_13", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co11_14", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c12", name: "11C",
    courses: [
      { id: "co12_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t3" },
      { id: "co12_2", subject: "STEDB", hoursPerWeek: 2, teacherId: "t33" },
      { id: "co12_3", subject: "O.TUR2", hoursPerWeek: 2, teacherId: "t3" },
      { id: "co12_4", subject: "MAT4", hoursPerWeek: 4, teacherId: "t6" },
      { id: "co12_5", subject: "T.MAT2", hoursPerWeek: 2, teacherId: "t6" },
      { id: "co12_6", subject: "COGRFY", hoursPerWeek: 4, teacherId: "t16" },
      { id: "co12_7", subject: "TARİH", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co12_8", subject: "11FEL", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co12_9", subject: "PSKO", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co12_10", subject: "KKER11", hoursPerWeek: 3, teacherId: "t1" },
      { id: "co12_11", subject: "TEFSIR", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co12_12", subject: "AKAID", hoursPerWeek: 1, teacherId: "t29" },
      { id: "co12_13", subject: "HITAB", hoursPerWeek: 2, teacherId: "t18" },
      { id: "co12_14", subject: "MARP11", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co12_15", subject: "A.MUA2", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co12_16", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co12_17", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },
  {
    id: "c13", name: "11D",
    courses: [
      { id: "co13_1", subject: "TDEB", hoursPerWeek: 5, teacherId: "t3" },
      { id: "co13_2", subject: "STEDB", hoursPerWeek: 2, teacherId: "t4" },
      { id: "co13_3", subject: "O.TÜR2", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co13_4", subject: "MAT4", hoursPerWeek: 4, teacherId: "t7" },
      { id: "co13_5", subject: "T.MAT2", hoursPerWeek: 2, teacherId: "t7" },
      { id: "co13_6", subject: "COGRFY", hoursPerWeek: 4, teacherId: "t16" },
      { id: "co13_7", subject: "A.MUA2", hoursPerWeek: 2, teacherId: "t16" },
      { id: "co13_8", subject: "TARİH", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co13_9", subject: "11FEL", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co13_10", subject: "PSKO", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co13_11", subject: "KKER11", hoursPerWeek: 3, teacherId: "t1" },
      { id: "co13_12", subject: "TEFSİR", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co13_13", subject: "AKAID", hoursPerWeek: 1, teacherId: "t29" },
      { id: "co13_14", subject: "HITAB", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co13_15", subject: "MARP11", hoursPerWeek: 2, teacherId: "t1" },
      { id: "co13_16", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" },
      { id: "co13_17", subject: "GS1", hoursPerWeek: 1, teacherId: "t30" }
    ]
  },

  // 12. SINIFLAR
  {
    id: "c14", name: "12A",
    courses: [
      { id: "co14_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t2" },
      { id: "co14_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t6" },
      { id: "co14_3", subject: "FİZİK", hoursPerWeek: 4, teacherId: "t26" },
      { id: "co14_4", subject: "KMYA", hoursPerWeek: 4, teacherId: "t9" },
      { id: "co14_5", subject: "BİYO", hoursPerWeek: 4, teacherId: "t11" },
      { id: "co14_6", subject: "FENT", hoursPerWeek: 2, teacherId: "t26" },
      { id: "co14_7", subject: "AUB1", hoursPerWeek: 1, teacherId: "t26" },
      { id: "co14_8", subject: "INKILA", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co14_9", subject: "DINT", hoursPerWeek: 1, teacherId: "t21" },
      { id: "co14_10", subject: "KURAN", hoursPerWeek: 3, teacherId: "t21" },
      { id: "co14_11", subject: "KELAM", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co14_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t19" },
      { id: "co14_13", subject: "IKMED", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co14_14", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" }
    ]
  },
  {
    id: "c15", name: "12B",
    courses: [
      { id: "co15_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t2" },
      { id: "co15_2", subject: "MAT", hoursPerWeek: 6, teacherId: "t17" },
      { id: "co15_3", subject: "FİZİK", hoursPerWeek: 4, teacherId: "t26" },
      { id: "co15_4", subject: "KMYA", hoursPerWeek: 4, teacherId: "t9" },
      { id: "co15_5", subject: "BİYO", hoursPerWeek: 4, teacherId: "t11" },
      { id: "co15_6", subject: "FENT", hoursPerWeek: 2, teacherId: "t26" },
      { id: "co15_7", subject: "AUB1", hoursPerWeek: 1, teacherId: "t26" },
      { id: "co15_8", subject: "INKILA", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co15_9", subject: "DINT", hoursPerWeek: 1, teacherId: "t21" },
      { id: "co15_10", subject: "KURAN", hoursPerWeek: 3, teacherId: "t29" },
      { id: "co15_11", subject: "KELAM", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co15_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co15_13", subject: "IKMED", hoursPerWeek: 2, teacherId: "t28" },
      { id: "co15_14", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" }
    ]
  },
  {
    id: "c16", name: "12C",
    courses: [
      { id: "co16_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t2" },
      { id: "co16_2", subject: "STEDB", hoursPerWeek: 2, teacherId: "t4" },
      { id: "co16_3", subject: "MAT", hoursPerWeek: 6, teacherId: "t5" },
      { id: "co16_4", subject: "T.MAT2", hoursPerWeek: 2, teacherId: "t17" },
      { id: "co16_5", subject: "COĞRFY", hoursPerWeek: 4, teacherId: "t16" },
      { id: "co16_6", subject: "PROJE", hoursPerWeek: 2, teacherId: "t31" },
      { id: "co16_7", subject: "INKILA", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co16_8", subject: "CTDT2", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co16_9", subject: "DINT", hoursPerWeek: 1, teacherId: "t21" },
      { id: "co16_10", subject: "KURAN", hoursPerWeek: 3, teacherId: "t29" },
      { id: "co16_11", subject: "KELAM", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co16_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co16_13", subject: "IKMED", hoursPerWeek: 2, teacherId: "t22" },
      { id: "co16_14", subject: "A.MUA2", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co16_15", subject: "GIRIŞ1", hoursPerWeek: 1, teacherId: "t7" },
      { id: "co16_16", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" }
    ]
  },
  {
    id: "c17", name: "12D",
    courses: [
      { id: "co17_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t2" },
      { id: "co17_2", subject: "STEDB", hoursPerWeek: 2, teacherId: "t33" },
      { id: "co17_3", subject: "MAT", hoursPerWeek: 6, teacherId: "t25" },
      { id: "co17_4", subject: "T.MAT2", hoursPerWeek: 2, teacherId: "t24" },
      { id: "co17_5", subject: "COĞRFY", hoursPerWeek: 4, teacherId: "t16" },
      { id: "co17_6", subject: "PROJE", hoursPerWeek: 2, teacherId: "t31" },
      { id: "co17_7", subject: "INKILA", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co17_8", subject: "CTDT2", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co17_9", subject: "DINT", hoursPerWeek: 1, teacherId: "t21" },
      { id: "co17_10", subject: "KURAN", hoursPerWeek: 3, teacherId: "t22" },
      { id: "co17_11", subject: "KELAM", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co17_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co17_13", subject: "IKMED", hoursPerWeek: 2, teacherId: "t22" },
      { id: "co17_14", subject: "A.MUA2", hoursPerWeek: 2, teacherId: "t15" },
      { id: "co17_15", subject: "GIRIŞ1", hoursPerWeek: 1, teacherId: "t5" },
      { id: "co17_16", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" }
    ]
  },
  {
    id: "c18", name: "12E",
    courses: [
      { id: "co18_1", subject: "EDEBİY", hoursPerWeek: 5, teacherId: "t2" },
      { id: "co18_2", subject: "STEDB", hoursPerWeek: 2, teacherId: "t20" },
      { id: "co18_3", subject: "MAT", hoursPerWeek: 6, teacherId: "t24" },
      { id: "co18_4", subject: "T.MAT2", hoursPerWeek: 2, teacherId: "t25" },
      { id: "co18_5", subject: "COGRFY", hoursPerWeek: 4, teacherId: "t16" },
      { id: "co18_6", subject: "PROJE", hoursPerWeek: 2, teacherId: "t31" },
      { id: "co18_7", subject: "INKILA", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co18_8", subject: "CTDT2", hoursPerWeek: 2, teacherId: "t32" },
      { id: "co18_9", subject: "DINT", hoursPerWeek: 1, teacherId: "t21" },
      { id: "co18_10", subject: "KURAN", hoursPerWeek: 3, teacherId: "t18" },
      { id: "co18_11", subject: "KELAM", hoursPerWeek: 2, teacherId: "t34" },
      { id: "co18_12", subject: "MARP11", hoursPerWeek: 2, teacherId: "t29" },
      { id: "co18_13", subject: "IKMED", hoursPerWeek: 2, teacherId: "t21" },
      { id: "co18_14", subject: "A.MUA2", hoursPerWeek: 2, teacherId: "t13" },
      { id: "co18_15", subject: "GIRIŞ1", hoursPerWeek: 1, teacherId: "t6" },
      { id: "co18_16", subject: "ING1", hoursPerWeek: 2, teacherId: "t14" }
    ]
  }
];

// 📚 SINIFLARDAKİ TÜM DERSLERİ STANDART DERS KODLARIYLA (MAT9, EDB9, FİZ10 vb.) ZENGİNLEŞTİRME
export const enrichCoursesWithCodes = (clsList = []) => {
  return (clsList || []).map(cls => ({
    ...cls,
    courses: (cls.courses || []).map(co => ({
      ...co,
      code: co.code || generateCourseCode(co.subject, cls.name)
    }))
  }));
};

// 📊 CANLI METRİK VE PENCERE (BOŞLUK) HESAPLAMA MOTORU
// Manuel sürükle-bırak, silme veya taşıma işlemlerinde anında çalışarak dağıtım raporunu günceller.
export const calculateLiveMetrics = (timetable, teachers = [], classrooms = [], settings = {}) => {
  if (!timetable || Object.keys(timetable).length === 0) {
    return {
      totalRequired: 0,
      totalAssigned: 0,
      unassigned: 0,
      totalSchoolGaps: 0,
      averageSchoolGaps: 0,
      teachersAboveAverage: [],
      gapReport: {},
      violations: []
    };
  }

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

  // 1. Toplam gereken ve atanan ders saati
  let totalRequired = 0;
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      totalRequired += Number(co.hoursPerWeek) || 0;
    });
  });

  let totalAssigned = 0;
  const busy = {};
  (teachers || []).forEach(t => {
    busy[t.id] = {};
    days.forEach(d => {
      busy[t.id][d] = [];
    });
  });

  Object.keys(timetable).forEach(cId => {
    const classDays = timetable[cId] || {};
    days.forEach(d => {
      const slots = classDays[d] || [];
      slots.forEach(slot => {
        totalAssigned++;
        if (slot.teacherId && busy[slot.teacherId] && busy[slot.teacherId][d]) {
          const p = Number(slot.period);
          if (!busy[slot.teacherId][d].includes(p)) {
            busy[slot.teacherId][d].push(p);
          }
        }
      });
    });
  });

  const unassigned = Math.max(0, totalRequired - totalAssigned);

  // 2. Öğretmen haftalık ders yükleri
  const teacherLoads = {};
  (teachers || []).forEach(t => { teacherLoads[t.id] = 0; });
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      if (co.teacherId && teacherLoads[co.teacherId] !== undefined) {
        teacherLoads[co.teacherId] += Number(co.hoursPerWeek) || 0;
      }
    });
  });

  // 3. Boşluk (pencere) hesaplama
  const gapReport = {};
  let totalSchoolGaps = 0;

  (teachers || []).forEach(t => {
    let tGaps = 0;
    days.forEach(d => {
      const b = (busy[t.id]?.[d] || []).slice().sort((a, b) => a - b);
      if (b.length > 1) {
        const minP = b[0];
        const maxP = b[b.length - 1];
        const span = maxP - minP + 1;
        const g = span - b.length;
        if (g > 0) tGaps += g;
      }
    });
    gapReport[t.name] = tGaps;
    totalSchoolGaps += tGaps;
  });

  // 4. Adalet Skalası: İdareciler, muaf/istisna olanlar ve ders yükü olmayanlar hariç tutulur
  const standardActiveTeachers = (teachers || []).filter(t => {
    const load = teacherLoads[t.id] || 0;
    const isExempt = t.isExempt === true || (load <= 8 && load > 0);
    const isPartTime = t.isPartTime || load <= 12;
    const isAdmin = t.isAdministrator === true;
    return !isExempt && !isPartTime && !isAdmin && load > 0;
  });

  const allGaps = standardActiveTeachers.map(t => gapReport[t.name] || 0).sort((a, b) => a - b);
  const standardCount = standardActiveTeachers.length;

  // Medyan Hesabı (İdareciler hariç veri grubu)
  let medianGaps = 0;
  if (standardCount > 0) {
    const mid = Math.floor(standardCount / 2);
    medianGaps = standardCount % 2 !== 0 
      ? allGaps[mid] 
      : Math.round(((allGaps[mid - 1] + allGaps[mid]) / 2) * 10) / 10;
  }

  const standardGaps = allGaps.reduce((acc, g) => acc + g, 0);
  const avg = standardCount > 0 ? Math.round((standardGaps / standardCount) * 100) / 100 : 0;

  // Okul medyanının üzerinde boşluğu olan öğretmenler (tıklanabilir yönlendirme için id ile birlikte)
  const teachersAboveMedian = standardActiveTeachers
    .filter(t => (gapReport[t.name] || 0) > medianGaps)
    .map(t => ({ id: t.id, name: t.name, gaps: gapReport[t.name] || 0 }))
    .sort((a, b) => b.gaps - a.gaps);

  // Geriye dönük uyumluluk için teachersAboveAverage
  const teachersAboveAverage = standardActiveTeachers
    .filter(t => (gapReport[t.name] || 0) >= 3 || (gapReport[t.name] || 0) > avg)
    .map(t => ({ id: t.id, name: t.name, gaps: gapReport[t.name] || 0 }))
    .sort((a, b) => b.gaps - a.gaps);

  // 5. Gelişmiş Öğretmenler Odası Adalet Skoru (Medyan, sağa çarpıklık ve uç değer cezaları)
  let fairnessScore = 100;
  let fairnessLabel = "Mükemmel Adalet";
  let fairnessColor = "emerald";

  if (standardCount > 0) {
    const variance = allGaps.reduce((acc, g) => acc + Math.pow(g - avg, 2), 0) / standardCount;
    const stdDev = Math.sqrt(variance);
    const maxGap = allGaps.length > 0 ? allGaps[allGaps.length - 1] : 0;

    let penalty = 0;
    allGaps.forEach(g => {
      if (g === 3) penalty += 3.5;
      else if (g === 4) penalty += 7;
      else if (g >= 5) penalty += 12 + (g - 5) * 5;
    });

    if (maxGap > 2) {
      penalty += (maxGap - 2) * 5;
    }

    penalty += stdDev * 8;

    // Medyan ve sağa çarpıklık etkisi (Tabanın %50+'sinin boşluksuz olması adalet lehinedir)
    if (medianGaps === 0) {
      penalty -= 6; // Çoğunluğun 0 boşluğu var
    } else if (medianGaps <= 1 && medianGaps <= avg) {
      penalty -= 3; // Taban rahat, sağa çarpık dengeli dağılım
    } else if (medianGaps >= 2) {
      penalty += (medianGaps - 1) * 8; // Tabanın yarısından fazlasında yüksek boşluk var
    }

    fairnessScore = Math.max(15, Math.min(100, Math.round(100 - penalty)));

    if (fairnessScore >= 90) {
      fairnessLabel = "Mükemmel Adalet (Taban Boşluksuz)";
      fairnessColor = "emerald";
    } else if (fairnessScore >= 78) {
      fairnessLabel = "Yüksek Adalet (Dengeli Dağılım)";
      fairnessColor = "blue";
    } else if (fairnessScore >= 60) {
      fairnessLabel = "Orta Adalet (Yüksek Boşluklu Öğretmenler Var)";
      fairnessColor = "amber";
    } else {
      fairnessLabel = "Düşük Adalet (Pencere Dağılımı Dengesiz)";
      fairnessColor = "red";
    }
  }

  return {
    totalRequired,
    totalAssigned,
    unassigned,
    totalSchoolGaps,
    averageSchoolGaps: avg,
    medianSchoolGaps: medianGaps,
    teachersAboveMedian,
    teachersAboveAverage,
    gapReport,
    fairnessScore,
    fairnessLabel,
    fairnessColor
  };
};

// 🚨 CANLI İHLAL VE ÇAKIŞMA DENETİM MOTORU
// Manuel sürükle-bırak, ders taşıma veya silme yapıldığında anında çalışarak
// dağıtım motorunun "İhlaller ve Raporlar" panelini dinamik olarak günceller.
export const calculateLiveViolations = (timetable, teachers = [], classrooms = [], settings = {}, hardPrefs = {}) => {
  const violations = [];
  if (!timetable || Object.keys(timetable).length === 0) return violations;

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const maxGaps = hardPrefs?.maxGapsPerDay ?? 2;
  const minDaily = hardPrefs?.minDailyHours ?? 3;
  const enforceGaps = hardPrefs?.enforceMaxGaps !== false;
  const enforceBalance = hardPrefs?.enforceDailyBalance !== false;

  // 1. Öğretmenlerin haftalık toplam müfredat yükleri
  const teacherLoads = {};
  (teachers || []).forEach(t => { teacherLoads[t.id] = 0; });
  (classrooms || []).forEach(c => {
    (c.courses || []).forEach(co => {
      if (co.teacherId && teacherLoads[co.teacherId] !== undefined) {
        teacherLoads[co.teacherId] += Number(co.hoursPerWeek) || 0;
      }
    });
  });

  // 2. Tablodaki yerleşimleri tara (Öğretmen ve Sınıf çakışmaları, kapalı saatler)
  const teacherBusy = {}; // tId -> { [day]: [ { period, classId, className, subject } ] }
  (teachers || []).forEach(t => {
    teacherBusy[t.id] = {};
    days.forEach(d => { teacherBusy[t.id][d] = []; });
  });

  Object.keys(timetable).forEach(cId => {
    const cName = classrooms.find(c => c.id === cId)?.name || 'Sınıf';
    const cDays = timetable[cId] || {};
    days.forEach(d => {
      const slots = cDays[d] || [];
      const periodSeen = {};
      slots.forEach(slot => {
        const p = Number(slot.period);
        if (periodSeen[p]) {
          violations.push(`🚨 Sınıf Çakışması: ${cName} sınıfında ${d} ${p}. saatte birden fazla ders var (${slot.subject} ve ${periodSeen[p]}).`);
        } else {
          periodSeen[p] = slot.subject;
        }

        if (slot.teacherId && teacherBusy[slot.teacherId] && teacherBusy[slot.teacherId][d]) {
          teacherBusy[slot.teacherId][d].push({ period: p, classId: cId, className: cName, subject: slot.subject });
        }
      });
    });
  });

  // 3. Öğretmen bazlı ihlal denetimi (Boşluk sınırı, asgari ders saati, çakışma, kapalı saat)
  (teachers || []).forEach(t => {
    const load = teacherLoads[t.id] || 0;
    const isExempt = t.isExempt === true || (load <= 8 && load > 0);
    const isPartTime = t.isPartTime || load <= 12;

    const hours = {};
    days.forEach(d => {
      const assigned = teacherBusy[t.id]?.[d] || [];

      // Öğretmen çakışması (aynı saatte birden fazla sınıfta ders)
      const periodMap = {};
      assigned.forEach(item => {
        if (!periodMap[item.period]) periodMap[item.period] = [];
        periodMap[item.period].push(item.className);
      });
      Object.entries(periodMap).forEach(([p, classList]) => {
        if (classList.length > 1) {
          violations.push(`🚨 Öğretmen Çakışması: ${t.name} – ${d} ${p}. saatte ${classList.length} farklı sınıfta (${classList.join(', ')}) derse giriyor!`);
        }
      });

      // Kapalı saat ihlali
      const closed = t.unavailable?.[d] || [];
      assigned.forEach(item => {
        if (closed.includes(item.period)) {
          violations.push(`⛔ Kapalı Saat İhlali: ${t.name} – ${d} ${item.period}. saatte kapalı olmasına rağmen ${item.className} sınıfında dersi var.`);
        }
      });

      // Boşluk (pencere) kontrolü
      const pList = assigned.map(a => a.period).sort((a, b) => a - b);
      const uniquePeriods = Array.from(new Set(pList));
      hours[d] = uniquePeriods.length;

      if (uniquePeriods.length > 1) {
        const span = uniquePeriods[uniquePeriods.length - 1] - uniquePeriods[0] + 1;
        const g = span - uniquePeriods.length;
        if (!isExempt && !isPartTime && enforceGaps && g > maxGaps) {
          violations.push(`${t.name} – ${d}: ${g} boşluk (sınır ${maxGaps}).`);
        }
      }
    });

    // Günlük asgari ders saati kontrolü
    if (!isExempt && !isPartTime && enforceBalance && load > 0) {
      const activeDays = days.filter(d => (hours[d] || 0) > 0);
      const adaptiveMin = Math.min(minDaily, load);
      activeDays.forEach(d => {
        if (hours[d] < adaptiveMin) {
          violations.push(`${t.name} – ${d}: ${hours[d]} saat (asgari ${adaptiveMin}).`);
        }
      });
    }
  });

  return violations;
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      demoDataChoice: null, // null: Henüz sorulmadı, 'demo': Hz. Ayşe örnek verisi, 'manual': Manuel sıfırdan ekleme
      settings: {
        schoolName: "Hz. Ayşe Kız Anadolu İmam Hatip Lisesi",
        days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
        periodsPerDay: 8,
        lunchAfter: 4,
        lunchDuration: 1,
        principalName: "Okul Müdürü"
      },
      teachers: REAL_TEACHERS,
      classrooms: enrichCoursesWithCodes(REAL_CLASSROOMS),
      timetable: {},

      softPrefs: {
        minimizeGaps: true,
        gapPenalty: 40,
        earlyStart: true,
        earlyStartPenalty: 20,
        avoidStemLate: true,
        stemLatePenalty: 35
      },
      updateSoftPrefs: (newPrefs) => set((state) => ({ softPrefs: { ...state.softPrefs, ...newPrefs } })),

      hardPrefs: {
        enforceMaxGaps: true,
        maxGapsPerDay: 2,
        enforceDailyBalance: true,
        minDailyHours: 3,
        enforceConsecutiveClassRules: true,
        enforceIntensiveRules: true,
        maxHoursPerIntensiveCourse: 4,
        solverTimeout: 60,
        stopAtFirstSolution: false
      },
      setHardPrefs: (newPrefs) => set((state) => ({ hardPrefs: { ...state.hardPrefs, ...newPrefs } })),

      pinnedSlots: [], // 📌 KİLİTLİ (PINNED) DERS HÜCRELERİ
      togglePinSlot: (slot) => set((state) => {
        const pNum = Number(slot.period);
        const exists = state.pinnedSlots.some(
          (p) => p.classId === slot.classId && p.day === slot.day && Number(p.period) === pNum
        );
        if (exists) {
          return {
            pinnedSlots: state.pinnedSlots.filter(
              (p) => !(p.classId === slot.classId && p.day === slot.day && Number(p.period) === pNum)
            )
          };
        } else {
          return {
            pinnedSlots: [
              ...state.pinnedSlots,
              {
                classId: slot.classId,
                day: slot.day,
                period: pNum,
                subject: slot.subject,
                teacherId: slot.teacherId
              }
            ]
          };
        }
      }),

      // 🔒 BİR ÖĞRETMENİN TÜM PROGRAMINI TEK TIKLA KİLİTLE
      pinTeacherSchedule: (teacherId) => set((state) => {
        const { timetable } = state;
        const newPins = [...state.pinnedSlots];
        
        Object.keys(timetable || {}).forEach((cId) => {
          const daysMap = timetable[cId] || {};
          Object.keys(daysMap).forEach((day) => {
            const slots = daysMap[day] || [];
            slots.forEach((s) => {
              if (s.teacherId === teacherId) {
                const pNum = Number(s.period);
                const already = newPins.some(
                  (p) => p.classId === cId && p.day === day && Number(p.period) === pNum
                );
                if (!already) {
                  newPins.push({
                    classId: cId,
                    day,
                    period: pNum,
                    subject: s.subject,
                    teacherId
                  });
                }
              }
            });
          });
        });

        return { pinnedSlots: newPins };
      }),

      // 🔓 BİR ÖĞRETMENİN TÜM KİLİTLERİNİ TEK TIKLA KALDIR
      unpinTeacherSchedule: (teacherId) => set((state) => ({
        pinnedSlots: state.pinnedSlots.filter((p) => p.teacherId !== teacherId)
      })),

      // 🔄 ÖĞRETMENİN TÜM PROGRAMI KİLİTLİ Mİ / TOGGLE
      toggleTeacherSchedulePin: (teacherId) => {
        const { timetable, pinnedSlots } = get();
        let totalAssigned = 0;
        let pinnedCount = 0;

        Object.keys(timetable || {}).forEach((cId) => {
          const daysMap = timetable[cId] || {};
          Object.keys(daysMap).forEach((day) => {
            const slots = daysMap[day] || [];
            slots.forEach((s) => {
              if (s.teacherId === teacherId) {
                totalAssigned++;
                const pNum = Number(s.period);
                const isPinned = (pinnedSlots || []).some(
                  (p) => p.classId === cId && p.day === day && Number(p.period) === pNum
                );
                if (isPinned) pinnedCount++;
              }
            });
          });
        });

        if (totalAssigned > 0 && pinnedCount === totalAssigned) {
          get().unpinTeacherSchedule(teacherId);
          return { action: 'unpinned', count: totalAssigned };
        } else {
          get().pinTeacherSchedule(teacherId);
          return { action: 'pinned', count: totalAssigned };
        }
      },

      clearAllPins: () => set({ pinnedSlots: [] }),

      isGenerating: false,
      generateResult: null,
      setGenerateResult: (result) => set({ generateResult: result }),

      startGeneration: async () => {
        const { settings, teachers, classrooms, softPrefs, hardPrefs, pinnedSlots } = get();

        if (!settings?.days || settings.days.length === 0) {
          set({
            generateResult: {
              success: false,
              message: 'Dağıtım Yapılamaz: Okul Ayarları Eksik.',
              unassignedCount: 0,
              warnings: ['Lütfen "Ayarlar" sekmesinden günleri mühürleyin.']
            }
          });
          return;
        }

        set({ isGenerating: true, generateResult: null });

        try {
          const response = await fetch(`${API_URL}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings,
              teachers,
              classrooms,
              softConstraints: softPrefs,
              hardConstraints: hardPrefs,
              pinnedSlots: pinnedSlots || []
            })
          });

          const data = await response.json();

          if (data.status === 'ok') {
            set({
              timetable: data.timetable,
              generateResult: {
                success: true,
                metrics: data.metrics,
                unassignedCount: data.metrics?.unassigned || 0,
                warnings: data.metrics?.violations || []
              },
              isGenerating: false
            });
          } else {
            const errorMsg = data.detail || data.message || 'Dağıtım Yapılamadı!';
            const errorWarnings = data.metrics?.warnings && data.metrics.warnings.length > 0
              ? data.metrics.warnings
              : (data.detail ? [data.detail] : ['Lütfen öğretmen kapalı saatlerini ve ders saatlerini kontrol edin.']);
            set({
              generateResult: {
                success: false,
                message: errorMsg,
                unassignedCount: 0,
                warnings: errorWarnings
              },
              isGenerating: false
            });
          }
        } catch (err) {
          set({
            generateResult: {
              success: false,
              message: 'Bağlantı veya Sunucu Hatası!',
              unassignedCount: 0,
              warnings: [
                'Backend API sunucusuna ulaşılamadı.',
                err?.message || 'Terminalden Python sunucusunun (FastAPI) çalıştığından emin olun.'
              ]
            },
            isGenerating: false
          });
        }
      },

      // 🏫 HZ. AYŞE KIZ AİHL ÖRNEK VERİLERİ VS. MANUEL MOD EYLEMLERİ
      loadHzAyseDemoData: () => set({
        settings: {
          schoolName: "Hz. Ayşe Kız Anadolu İmam Hatip Lisesi",
          days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
          periodsPerDay: 8,
          lunchAfter: 4,
          lunchDuration: 1,
          principalName: "Cemil Murat Kuru"
        },
        teachers: REAL_TEACHERS,
        classrooms: enrichCoursesWithCodes(REAL_CLASSROOMS),
        timetable: {},
        pinnedSlots: [],
        generateResult: null,
        demoDataChoice: 'demo'
      }),

      clearDataForManualEntry: () => set({
        settings: {
          schoolName: "Okul Ders Programı",
          days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
          periodsPerDay: 8,
          lunchAfter: 4,
          lunchDuration: 1,
          principalName: "Okul Müdürü"
        },
        teachers: [],
        classrooms: [],
        timetable: {},
        pinnedSlots: [],
        generateResult: null,
        demoDataChoice: 'manual'
      }),

      setDemoDataChoice: (choice) => set({ demoDataChoice: choice }),
      resetDemoPrompt: () => set({ demoDataChoice: null }),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      addTeacher: (teacher) => set((state) => ({ teachers: [...state.teachers, { ...teacher, id: newId('t') }] })),
      updateTeacher: (id, updatedFields) => set((state) => ({ teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)) })),
      deleteTeacher: (id) => set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),
      addClassroom: (classroom) => set((state) => {
        const enrichedCourses = (classroom.courses || []).map(co => ({
          ...co,
          code: co.code || generateCourseCode(co.subject, classroom.name)
        }));
        return {
          classrooms: [...state.classrooms, { ...classroom, id: newId('c'), courses: enrichedCourses }]
        };
      }),
      updateClassroom: (id, updatedFields) => set((state) => ({
        classrooms: state.classrooms.map((c) => {
          if (c.id !== id) return c;
          const updated = { ...c, ...updatedFields };
          if (updatedFields.courses) {
            updated.courses = updatedFields.courses.map(co => ({
              ...co,
              code: co.code || generateCourseCode(co.subject, updated.name)
            }));
          }
          return updated;
        })
      })),
      deleteClassroom: (id) => set((state) => ({ classrooms: state.classrooms.filter((c) => c.id !== id) })),
      setTimetable: (newTimetable) => {
        const { teachers, classrooms, settings, hardPrefs } = get();
        const liveMetrics = calculateLiveMetrics(newTimetable, teachers, classrooms, settings);
        const liveViolations = calculateLiveViolations(newTimetable, teachers, classrooms, settings, hardPrefs);
        set((state) => ({
          timetable: newTimetable,
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),
              ...liveMetrics,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
              violations: liveViolations
            }
          }
        }));
      },
      resetTimetable: (clearPins = false) => {
        set((state) => ({
          timetable: {},
          generateResult: null,
          liveTelemetry: null,
          pinnedSlots: clearPins ? [] : state.pinnedSlots
        }));
      },
      clearAllTeacherConstraints: () => {
        set((state) => ({
          teachers: state.teachers.map((t) => ({
            ...t,
            unavailable: {}
          }))
        }));
      },
      recalculateMetrics: () => {
        const { timetable, teachers, classrooms, settings, hardPrefs } = get();
        const liveMetrics = calculateLiveMetrics(timetable, teachers, classrooms, settings);
        const liveViolations = calculateLiveViolations(timetable, teachers, classrooms, settings, hardPrefs);
        set((state) => ({
          generateResult: state.generateResult ? {
            ...state.generateResult,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...(state.generateResult.metrics || {}),
              ...liveMetrics,
              violations: liveViolations
            }
          } : {
            success: true,
            unassignedCount: liveMetrics.unassigned,
            warnings: liveViolations,
            metrics: {
              ...liveMetrics,
              violations: liveViolations
            }
          }
        }));
      },

      // ==========================================
      // 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) MODÜLÜ
      // ==========================================
      dykSettings: {
        activeDays: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
        blocks: [
          { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
          { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
        ]
      },
      dykGroups: DEFAULT_DYK_GROUPS,
      dykAssignments: DEFAULT_DYK_ASSIGNMENTS,
      dykTeacherAvailabilities: DEFAULT_DYK_AVAILABILITIES,
      dykSchedule: null,
      dykResult: null,

      updateDykSettings: (newSettings) => set((state) => ({ dykSettings: { ...state.dykSettings, ...newSettings } })),
      addDykGroup: (group) => set((state) => ({ dykGroups: [...state.dykGroups, { ...group, id: newId('dg') }] })),
      updateDykGroup: (id, fields) => set((state) => ({ dykGroups: state.dykGroups.map(g => g.id === id ? { ...g, ...fields } : g) })),
      deleteDykGroup: (id) => set((state) => ({
        dykGroups: state.dykGroups.filter(g => g.id !== id),
        dykAssignments: state.dykAssignments.filter(a => a.groupId !== id)
      })),
      addDykAssignment: (assignment) => set((state) => ({ dykAssignments: [...state.dykAssignments, { ...assignment, id: newId('da') }] })),
      updateDykAssignment: (id, fields) => set((state) => ({ dykAssignments: state.dykAssignments.map(a => a.id === id ? { ...a, ...fields } : a) })),
      deleteDykAssignment: (id) => set((state) => ({ dykAssignments: state.dykAssignments.filter(a => a.id !== id) })),
      setDykTeacherAvailability: (teacherId, days) => set((state) => ({
        dykTeacherAvailabilities: {
          ...state.dykTeacherAvailabilities,
          [teacherId]: days
        }
      })),
      setDykSchedule: (schedule) => set({ dykSchedule: schedule }),
      generateDykSchedule: () => {
        const { dykGroups, dykAssignments, dykTeacherAvailabilities, dykSettings, teachers } = get();
        const res = solveDykSchedule({
          dykGroups,
          dykAssignments,
          dykTeacherAvailabilities,
          dykSettings,
          teachers
        });
        set({
          dykSchedule: res.schedule,
          dykResult: {
            success: res.success,
            unassigned: res.unassigned,
            totalActivities: res.totalActivities,
            assignedCount: res.assignedCount
          }
        });
        return res;
      },
      clearDykSchedule: () => set({ dykSchedule: null, dykResult: null }),

      // ==========================================
      // 🎓 OKUL ORTAK SINAV TAKVİMİ MODÜLÜ
      // ==========================================
      examSettings: {
        startDate: "2025-11-03",
        endDate: "2025-11-14",
        examSlots: [3, 5],
        grades: ["9", "10", "11-SAY", "11-EA", "12"]
      },
      examSubjectsByGrade: DEFAULT_EXAM_SUBJECTS,
      examSchedule: null,
      examResult: null,
      examSupervisors: null,
      examSupervisorResult: null,

      updateExamSettings: (newSettings) => set((state) => ({ examSettings: { ...state.examSettings, ...newSettings } })),
      setExamSubjectsByGrade: (newSubjects) => set({ examSubjectsByGrade: newSubjects }),
      toggleExamSubjectMajor: (grade, subjectId) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: current.map(s => s.id === subjectId ? { ...s, isMajor: !s.isMajor } : s)
          }
        };
      }),
      addExamSubject: (grade, subject) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: [...current, { ...subject, id: newId('es') }]
          }
        };
      }),
      deleteExamSubject: (grade, subjectId) => set((state) => {
        const current = state.examSubjectsByGrade[grade] || [];
        return {
          examSubjectsByGrade: {
            ...state.examSubjectsByGrade,
            [grade]: current.filter(s => s.id !== subjectId)
          }
        };
      }),
      generateExamSchedule: () => {
        const { examSettings, examSubjectsByGrade } = get();
        const res = solveExamSchedule({
          startDate: examSettings.startDate,
          endDate: examSettings.endDate,
          examSlots: examSettings.examSlots,
          grades: examSettings.grades,
          subjectsByGrade: examSubjectsByGrade
        });
        set({
          examSchedule: res.schedule,
          examResult: {
            success: res.success,
            unassigned: res.unassigned,
            workingDays: res.workingDays,
            examSlots: res.examSlots,
            firstSlot: res.firstSlot,
            totalSubjects: res.totalSubjects
          }
        });
        return res;
      },
      generateExamSupervisors: (avoidSameBranch = true) => {
        const { examSchedule, examResult, classrooms, teachers, examSettings } = get();
        if (!examSchedule || !examResult?.workingDays) return null;
        const res = solveSupervisors({
          examSchedule,
          workingDays: examResult.workingDays,
          examSlots: examSettings.examSlots,
          classrooms,
          teachers,
          avoidSameBranch
        });
        set({
          examSupervisors: res.assignments,
          examSupervisorResult: {
            success: res.success,
            teacherDuties: res.teacherDuties,
            stats: res.stats
          }
        });
        return res;
      },
      updateExamSupervisorSlot: (date, slot, classroomId, teacherId) => set((state) => {
        const current = { ...(state.examSupervisors || {}) };
        if (!current[date]) current[date] = {};
        if (!current[date][slot]) current[date][slot] = {};
        current[date][slot][classroomId] = teacherId;
        return { examSupervisors: current };
      }),
      clearExamSchedule: () => set({ examSchedule: null, examResult: null, examSupervisors: null, examSupervisorResult: null }),
      clearExamSupervisors: () => set({ examSupervisors: null, examSupervisorResult: null })

    }),
    {
      name: 'hz-ayse-timetable-v1',
      // 🛡️ 5MB localStorage kota patlamasını (QuotaExceededError) önleyen filtre:
      // Sadece kalıcı veritabanı alanları saklanır; anlık ve geçici veriler filtrelenir.
      partialize: (state) => ({
        demoDataChoice: state.demoDataChoice,
        settings: state.settings,
        teachers: state.teachers,
        classrooms: state.classrooms,
        timetable: state.timetable,
        softPrefs: state.softPrefs,
        hardPrefs: state.hardPrefs,
        pinnedSlots: state.pinnedSlots,
        dykSettings: state.dykSettings,
        dykGroups: state.dykGroups,
        dykAssignments: state.dykAssignments,
        dykTeacherAvailabilities: state.dykTeacherAvailabilities,
        dykSchedule: state.dykSchedule,
        examSettings: state.examSettings,
        examSubjectsByGrade: state.examSubjectsByGrade,
        examSchedule: state.examSchedule,
        examSupervisors: state.examSupervisors
      })
    }
  )
);

