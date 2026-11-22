// frontend/src/store/seedDataHassa.ts
// HASSA KIZ ANADOLU İMAM HATİP LİSESİ - GERÇEK OKUL VERİLERİ (PDFten Doğrulanmış: 24 Öğretmen, 15 Şube, 580 Saat)
import type { Settings, Teacher, Classroom } from '../types';

export const HASSA_SETTINGS: Settings = {
  "schoolName": "Hassa Kız Anadolu İmam Hatip Lisesi",
  "days": [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma"
  ],
  "periodsPerDay": 8,
  "lunchAfter": 5,
  "lunchBreakAfter": 5,
  "lunchDuration": 1,
  "lunchBreakDuration": 50,
  "startTime": "08:30",
  "periodDuration": 40,
  "breakDuration": 10,
  "principalName": "Ahmet Yaprak"
};

export const HASSA_TEACHERS: Teacher[] = [
  {
    "id": "hassa_t1",
    "shortCode": "OS",
    "name": "OSMAN SÖNMEZ",
    "branch": "SOS",
    "subjects": [
      "S.AFET BİLİNCİ",
      "BEDEN EĞİTİMİ",
      "GÖRSEL SANATLAR",
      "MÜZİK",
      "SOSYAL BİLGİLER",
      "REHBERLİK",
      "TEKNOLOJİ TASARIM",
      "İNKİLAP TARİHİ"
    ],
    "unavailable": {},
    "classTeacherOf": "5B",
    "isExempt": false,
    "totalWeeklyHours": 29
  },
  {
    "id": "hassa_t2",
    "shortCode": "BG",
    "name": "BÜŞRA GÜRBÜZ",
    "branch": "ARP",
    "subjects": [
      "ARAPÇA"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 32
  },
  {
    "id": "hassa_t3",
    "shortCode": "DG",
    "name": "DOĞUŞ GÖKPINAR",
    "branch": "İNG",
    "subjects": [
      "İNGİLİZCE",
      "REHBERLİK"
    ],
    "unavailable": {},
    "classTeacherOf": "5A",
    "isExempt": false,
    "totalWeeklyHours": 24
  },
  {
    "id": "hassa_t4",
    "shortCode": "AHP",
    "name": "ABDULLAH HARTLAP",
    "branch": "FEN",
    "subjects": [
      "BİLİŞİM TEK. VE YAZILIM",
      "FEN BİLİMLERİ",
      "S. MATEMATİK VE BİLİM UYG.",
      "BEDEN EĞİTİMİ",
      "S.ÇEVRE EĞT. VE İKLİM DEĞŞKLĞİ",
      "S.SPOR VE FİZİKİ ETKİNLİKLER"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 27
  },
  {
    "id": "hassa_t5",
    "shortCode": "HBAH",
    "name": "HÜSEYİN BAHAR",
    "branch": "DKAB",
    "subjects": [
      "DİN KÜLTÜRÜ",
      "KURAN",
      "PEYGAMBERİMİZİN HAYATI",
      "GÖRSEL SANATLAR",
      "MÜZİK",
      "TEMEL DİNİ BİLGİLER"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 26
  },
  {
    "id": "hassa_t6",
    "shortCode": "M.GA",
    "name": "MAŞİDE GAZİOĞLU",
    "branch": "MAT",
    "subjects": [
      "MATEMATİK",
      "REHBERLİK"
    ],
    "unavailable": {},
    "classTeacherOf": "8A",
    "isExempt": false,
    "totalWeeklyHours": 26
  },
  {
    "id": "hassa_t7",
    "shortCode": "ASM",
    "name": "ASLI TÜRK MUCUK",
    "branch": "TRK",
    "subjects": [
      "TÜRKÇE",
      "REHBERLİK"
    ],
    "unavailable": {},
    "classTeacherOf": "6A",
    "isExempt": false,
    "totalWeeklyHours": 29
  },
  {
    "id": "hassa_t8",
    "shortCode": "HKO",
    "name": "HİLAL KORKMAZ",
    "branch": "DKAB",
    "subjects": [
      "BEDEN EĞİTİMİ",
      "DİN KÜLTÜRÜ",
      "PEYGAMBERİMİZİN HAYATI",
      "REHBERLİK",
      "TEMEL DİNİ BİLGİLER",
      "GÖRSEL SANATLAR",
      "KURAN"
    ],
    "unavailable": {},
    "classTeacherOf": "7A",
    "isExempt": false,
    "totalWeeklyHours": 18
  },
  {
    "id": "hassa_t9",
    "shortCode": "AYP",
    "name": "AHMET YAPRAK",
    "branch": "İHL",
    "subjects": [
      "KURAN"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": true,
    "totalWeeklyHours": 2,
    "isAdministrator": true
  },
  {
    "id": "hassa_t10",
    "shortCode": "FBK",
    "name": "FUAT BEKTAŞ",
    "branch": "TAR",
    "subjects": [
      "BEDEN EĞİTİMİ",
      "TARİH",
      "REHBERLİK",
      "TÜRK KÜLTÜR MEDENİYETİ",
      "İNKİLAP TARİHİ",
      "S.ÇAĞDAŞ TÜRK DÜNYA TARİHİ"
    ],
    "unavailable": {},
    "classTeacherOf": "9A",
    "isExempt": false,
    "totalWeeklyHours": 30
  },
  {
    "id": "hassa_t11",
    "shortCode": "ŞHV",
    "name": "ŞAHVER DEMİR",
    "branch": "BİY",
    "subjects": [
      "BİYOLOJİ",
      "REHBERLİK",
      "SAĞLIK BİLGİSİ",
      "S.BİYOLOJİ",
      "SEÇMELİ BİYOLOJİ"
    ],
    "unavailable": {},
    "classTeacherOf": "9A FEN",
    "isExempt": false,
    "totalWeeklyHours": 24
  },
  {
    "id": "hassa_t12",
    "shortCode": "ACK",
    "name": "ALİ CAHİT KAPLAN",
    "branch": "COĞ",
    "subjects": [
      "COĞRAFYA",
      "S.COĞRAFYA"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "hassa_t13",
    "shortCode": "EG",
    "name": "EKREM GÖKMEN",
    "branch": "FİZ",
    "subjects": [
      "FİZİK",
      "REHBERLİK",
      "S.FİZİK"
    ],
    "unavailable": {},
    "classTeacherOf": "9BFEN",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "hassa_t14",
    "shortCode": "SY",
    "name": "SAMET YILDIRIM",
    "branch": "İNG",
    "subjects": [
      "İNGİLİZCE"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 26
  },
  {
    "id": "hassa_t15",
    "shortCode": "KİM",
    "name": "BEYZANUR KIRLANGIÇ",
    "branch": "KİM",
    "subjects": [
      "KİMYA",
      "S.KİMYA",
      "SEÇMELİ KİMYA"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 19
  },
  {
    "id": "hassa_t16",
    "shortCode": "ŞC",
    "name": "ŞAZİYE CENGİZ",
    "branch": "İHL",
    "subjects": [
      "KURAN",
      "TEMEL DİNİ BİLGİLER",
      "HADİS",
      "FIKIH",
      "HİTABET MESLEKİ UYGULAMA",
      "S.TEZHİP"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "hassa_t17",
    "shortCode": "BİÇOL",
    "name": "BİLAL ÇOLAK",
    "branch": "MAT",
    "subjects": [
      "MATEMATİK",
      "S.MATEMATİK"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 30
  },
  {
    "id": "hassa_t18",
    "shortCode": "NÖS",
    "name": "NERGİZ ÖZLÜK SOLAK",
    "branch": "İHL",
    "subjects": [
      "TEMEL DİNİ BİLGİLER",
      "FIKIH",
      "OSMANLICA",
      "KURAN",
      "TEFSİR",
      "S.İSLAM BİLİM TARİHİ"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 24
  },
  {
    "id": "hassa_t19",
    "shortCode": "ESY",
    "name": "EMİNE SULTAN YILMAZ",
    "branch": "TDEB",
    "subjects": [
      "TÜRK DİLİ EDEBİYATI",
      "S.TÜRK DİLİ EDEBİYATI"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 28
  },
  {
    "id": "hassa_t20",
    "shortCode": "BEYZ",
    "name": "BEYZA BAZAR",
    "branch": "FEL",
    "subjects": [
      "BEDEN EĞİTİMİ",
      "FELSEFE",
      "S.PSİKOLOJİ"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 12
  },
  {
    "id": "hassa_t21",
    "shortCode": "H.KAH",
    "name": "HALİL KAHYA",
    "branch": "İHL",
    "subjects": [
      "KURAN",
      "AKAİD",
      "M.ARAPÇA",
      "TEFSİR",
      "DİNLER TARİHİ",
      "İSLAM KÜLTÜR MEDENİYETİ"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 25
  },
  {
    "id": "hassa_t22",
    "shortCode": "ŞNUR",
    "name": "ŞAHİZER NUR",
    "branch": "MAT",
    "subjects": [
      "MATEMATİK",
      "S.MATEMATİK"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 30
  },
  {
    "id": "hassa_t23",
    "shortCode": "MAS",
    "name": "MEHMET ALİ SU",
    "branch": "TDEB",
    "subjects": [
      "TÜRK DİLİ EDEBİYATI",
      "REHBERLİK",
      "SEÇMELİ TÜRK DİLİ VE EDEBİYATI"
    ],
    "unavailable": {},
    "classTeacherOf": "9B",
    "isExempt": false,
    "totalWeeklyHours": 28
  },
  {
    "id": "hassa_t24",
    "shortCode": "HAK",
    "name": "HALİL KILIÇ",
    "branch": "İHL",
    "subjects": [
      "KURAN",
      "FELSEFE",
      "SİYER",
      "BEDEN EĞİTİMİ",
      "KELAM",
      "S.MANTIK",
      "S.SOSYOLOJİ"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 30
  }
];

export const HASSA_CLASSROOMS: Classroom[] = [
  {
    "id": "c_hassa_5a",
    "name": "5A",
    "grade": 5,
    "targetWeeklyHours": 36,
    "courses": [
      {
        "id": "co_hassa_5a_1",
        "subject": "S.AFET BİLİNCİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5a_2",
        "subject": "ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_5a_3",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_5a_4",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5a_5",
        "subject": "BİLİŞİM TEK. VE YAZILIM",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_5a_6",
        "subject": "DİN KÜLTÜRÜ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5a_7",
        "subject": "FEN BİLİMLERİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_5a_8",
        "subject": "GÖRSEL SANATLAR",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5a_9",
        "subject": "KURAN",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5a_10",
        "subject": "MATEMATİK",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_5a_11",
        "subject": "MÜZİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5a_12",
        "subject": "PEYGAMBERİMİZİN HAYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5a_13",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_5a_14",
        "subject": "SOSYAL BİLGİLER",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5a_15",
        "subject": "TÜRKÇE",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      }
    ]
  },
  {
    "id": "c_hassa_5b",
    "name": "5B",
    "grade": 5,
    "targetWeeklyHours": 36,
    "courses": [
      {
        "id": "co_hassa_5b_1",
        "subject": "S.AFET BİLİNCİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5b_2",
        "subject": "ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_5b_3",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_5b_4",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_5b_5",
        "subject": "BİLİŞİM TEK. VE YAZILIM",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_5b_6",
        "subject": "DİN KÜLTÜRÜ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_5b_7",
        "subject": "FEN BİLİMLERİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_5b_8",
        "subject": "GÖRSEL SANATLAR",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5b_9",
        "subject": "KURAN",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t9",
        "teacherName": "AHMET YAPRAK"
      },
      {
        "id": "co_hassa_5b_10",
        "subject": "MATEMATİK",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_5b_11",
        "subject": "MÜZİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5b_12",
        "subject": "PEYGAMBERİMİZİN HAYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_5b_13",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5b_14",
        "subject": "SOSYAL BİLGİLER",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_5b_15",
        "subject": "TÜRKÇE",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      }
    ]
  },
  {
    "id": "c_hassa_6a",
    "name": "6A",
    "grade": 6,
    "targetWeeklyHours": 36,
    "courses": [
      {
        "id": "co_hassa_6a_1",
        "subject": "S.AFET BİLİNCİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_6a_2",
        "subject": "ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_6a_3",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_6a_4",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_6a_5",
        "subject": "BİLİŞİM TEK. VE YAZILIM",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_6a_6",
        "subject": "DİN KÜLTÜRÜ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_6a_7",
        "subject": "FEN BİLİMLERİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_6a_8",
        "subject": "GÖRSEL SANATLAR",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_6a_9",
        "subject": "KURAN",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_6a_10",
        "subject": "MATEMATİK",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_6a_11",
        "subject": "MÜZİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_6a_12",
        "subject": "PEYGAMBERİMİZİN HAYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_6a_13",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      },
      {
        "id": "co_hassa_6a_14",
        "subject": "SOSYAL BİLGİLER",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_6a_15",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_6a_16",
        "subject": "TÜRKÇE",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      }
    ]
  },
  {
    "id": "c_hassa_7a",
    "name": "7A",
    "grade": 7,
    "targetWeeklyHours": 36,
    "courses": [
      {
        "id": "co_hassa_7a_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_7a_2",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_7a_3",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_7a_4",
        "subject": "DİN KÜLTÜRÜ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_7a_5",
        "subject": "FEN BİLİMLERİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_7a_6",
        "subject": "GÖRSEL SANATLAR",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_7a_7",
        "subject": "KURAN",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_7a_8",
        "subject": "MATEMATİK",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_7a_9",
        "subject": "MÜZİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_7a_10",
        "subject": "PEYGAMBERİMİZİN HAYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_7a_11",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_7a_12",
        "subject": "SOSYAL BİLGİLER",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_7a_13",
        "subject": "TEKNOLOJİ TASARIM",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_7a_14",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_7a_15",
        "subject": "TÜRKÇE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      },
      {
        "id": "co_hassa_7a_16",
        "subject": "S. MATEMATİK VE BİLİM UYG.",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      }
    ]
  },
  {
    "id": "c_hassa_8a",
    "name": "8A",
    "grade": 8,
    "targetWeeklyHours": 36,
    "courses": [
      {
        "id": "co_hassa_8a_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_8a_2",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_8a_3",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_8a_4",
        "subject": "TEKNOLOJİ TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_8a_5",
        "subject": "DİN KÜLTÜRÜ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_8a_6",
        "subject": "FEN BİLİMLERİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_8a_7",
        "subject": "GÖRSEL SANATLAR",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_8a_8",
        "subject": "İNKİLAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t1",
        "teacherName": "OSMAN SÖNMEZ"
      },
      {
        "id": "co_hassa_8a_9",
        "subject": "KURAN",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_8a_10",
        "subject": "MATEMATİK",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_8a_11",
        "subject": "MÜZİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t5",
        "teacherName": "HÜSEYİN BAHAR"
      },
      {
        "id": "co_hassa_8a_12",
        "subject": "PEYGAMBERİMİZİN HAYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_8a_13",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t6",
        "teacherName": "MAŞİDE GAZİOĞLU"
      },
      {
        "id": "co_hassa_8a_14",
        "subject": "TÜRKÇE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t7",
        "teacherName": "ASLI TÜRK MUCUK"
      },
      {
        "id": "co_hassa_8a_15",
        "subject": "S.ÇEVRE EĞT. VE İKLİM DEĞŞKLĞİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      },
      {
        "id": "co_hassa_8a_16",
        "subject": "S.SPOR VE FİZİKİ ETKİNLİKLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t4",
        "teacherName": "ABDULLAH HARTLAP"
      }
    ]
  },
  {
    "id": "c_hassa_9a_fen",
    "name": "9A FEN",
    "grade": 9,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_9a_fen_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_9a_fen_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9a_fen_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9a_fen_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_9a_fen_5",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_9a_fen_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_9a_fen_7",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_9a_fen_8",
        "subject": "KURAN",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_9a_fen_9",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t17",
        "teacherName": "BİLAL ÇOLAK"
      },
      {
        "id": "co_hassa_9a_fen_10",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9a_fen_11",
        "subject": "SAĞLIK BİLGİSİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9a_fen_12",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9a_fen_13",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_9a_fen_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      }
    ]
  },
  {
    "id": "c_hassa_9a",
    "name": "9A",
    "grade": 9,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_9a_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_9a_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_9a_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9a_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_9a_5",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_9a_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_9a_7",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_9a_8",
        "subject": "KURAN",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_9a_9",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t17",
        "teacherName": "BİLAL ÇOLAK"
      },
      {
        "id": "co_hassa_9a_10",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9a_11",
        "subject": "SAĞLIK BİLGİSİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9a_12",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9a_13",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_9a_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      }
    ]
  },
  {
    "id": "c_hassa_9bfen",
    "name": "9BFEN",
    "grade": 9,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_9bfen_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_9bfen_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9bfen_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9bfen_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_9bfen_5",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_9bfen_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_9bfen_7",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_9bfen_8",
        "subject": "KURAN",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t8",
        "teacherName": "HİLAL KORKMAZ"
      },
      {
        "id": "co_hassa_9bfen_9",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t22",
        "teacherName": "ŞAHİZER NUR"
      },
      {
        "id": "co_hassa_9bfen_10",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_9bfen_11",
        "subject": "SAĞLIK BİLGİSİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9bfen_12",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9bfen_13",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_9bfen_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      }
    ]
  },
  {
    "id": "c_hassa_9b",
    "name": "9B",
    "grade": 9,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_9b_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_9b_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_9b_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9b_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_9b_5",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_9b_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_9b_7",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_9b_8",
        "subject": "KURAN",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_9b_9",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t22",
        "teacherName": "ŞAHİZER NUR"
      },
      {
        "id": "co_hassa_9b_10",
        "subject": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      },
      {
        "id": "co_hassa_9b_11",
        "subject": "SAĞLIK BİLGİSİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_9b_12",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_9b_13",
        "subject": "TEMEL DİNİ BİLGİLER",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_9b_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      }
    ]
  },
  {
    "id": "c_hassa_10a",
    "name": "10A",
    "grade": 10,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_10a_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_10a_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_10a_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_10a_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_10a_5",
        "subject": "FELSEFE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10a_6",
        "subject": "FIKIH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_10a_7",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_10a_8",
        "subject": "HADİS",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_10a_9",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_10a_10",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_10a_11",
        "subject": "KURAN",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10a_12",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t22",
        "teacherName": "ŞAHİZER NUR"
      },
      {
        "id": "co_hassa_10a_13",
        "subject": "OSMANLICA",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_10a_14",
        "subject": "SİYER",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10a_15",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_10a_16",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      }
    ]
  },
  {
    "id": "c_hassa_10b",
    "name": "10B",
    "grade": 10,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_10b_1",
        "subject": "ARAPÇA",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t2",
        "teacherName": "BÜŞRA GÜRBÜZ"
      },
      {
        "id": "co_hassa_10b_2",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10b_3",
        "subject": "BİYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_10b_4",
        "subject": "COĞRAFYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_10b_5",
        "subject": "FELSEFE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10b_6",
        "subject": "FIKIH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_10b_7",
        "subject": "FİZİK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_10b_8",
        "subject": "HADİS",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_10b_9",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_10b_10",
        "subject": "KİMYA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_10b_11",
        "subject": "KURAN",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10b_12",
        "subject": "MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t22",
        "teacherName": "ŞAHİZER NUR"
      },
      {
        "id": "co_hassa_10b_13",
        "subject": "OSMANLICA",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_10b_14",
        "subject": "SİYER",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_10b_15",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_10b_16",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      }
    ]
  },
  {
    "id": "c_hassa_11a",
    "name": "11A",
    "grade": 11,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_11a_1",
        "subject": "AKAİD",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_11a_2",
        "subject": "M.ARAPÇA",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_11a_3",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_11a_4",
        "subject": "S.BİYOLOJİ",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_11a_5",
        "subject": "FELSEFE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_11a_6",
        "subject": "S.FİZİK",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_11a_7",
        "subject": "HİTABET MESLEKİ UYGULAMA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_11a_8",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t14",
        "teacherName": "SAMET YILDIRIM"
      },
      {
        "id": "co_hassa_11a_9",
        "subject": "S.KİMYA",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      },
      {
        "id": "co_hassa_11a_10",
        "subject": "KURAN",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_11a_11",
        "subject": "S.MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t17",
        "teacherName": "BİLAL ÇOLAK"
      },
      {
        "id": "co_hassa_11a_12",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_11a_13",
        "subject": "TEFSİR",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_11a_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      }
    ]
  },
  {
    "id": "c_hassa_11b",
    "name": "11B",
    "grade": 11,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_11b_1",
        "subject": "AKAİD",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_11b_2",
        "subject": "M.ARAPÇA",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_11b_3",
        "subject": "BEDEN EĞİTİMİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_11b_4",
        "subject": "S.COĞRAFYA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_11b_5",
        "subject": "FELSEFE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_11b_6",
        "subject": "HİTABET MESLEKİ UYGULAMA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_11b_7",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_11b_8",
        "subject": "KURAN",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_11b_9",
        "subject": "S.MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t22",
        "teacherName": "ŞAHİZER NUR"
      },
      {
        "id": "co_hassa_11b_10",
        "subject": "S.PSİKOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t20",
        "teacherName": "BEYZA BAZAR"
      },
      {
        "id": "co_hassa_11b_11",
        "subject": "TARİH",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_11b_12",
        "subject": "TEFSİR",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_11b_13",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      },
      {
        "id": "co_hassa_11b_14",
        "subject": "TÜRK KÜLTÜR MEDENİYETİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_11b_15",
        "subject": "SEÇMELİ TÜRK DİLİ VE EDEBİYATI",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      }
    ]
  },
  {
    "id": "c_hassa_12a",
    "name": "12A",
    "grade": 12,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_12a_1",
        "subject": "S.İSLAM BİLİM TARİHİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_12a_2",
        "subject": "M.ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12a_3",
        "subject": "S.TEZHİP",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_12a_4",
        "subject": "DİNLER TARİHİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12a_5",
        "subject": "S.FİZİK",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t13",
        "teacherName": "EKREM GÖKMEN"
      },
      {
        "id": "co_hassa_12a_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_12a_7",
        "subject": "İNKİLAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_12a_8",
        "subject": "İSLAM KÜLTÜR MEDENİYETİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12a_9",
        "subject": "KELAM",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_12a_10",
        "subject": "KURAN",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_12a_11",
        "subject": "S.MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t17",
        "teacherName": "BİLAL ÇOLAK"
      },
      {
        "id": "co_hassa_12a_12",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      },
      {
        "id": "co_hassa_12a_13",
        "subject": "SEÇMELİ BİYOLOJİ",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t11",
        "teacherName": "ŞAHVER DEMİR"
      },
      {
        "id": "co_hassa_12a_14",
        "subject": "SEÇMELİ KİMYA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t15",
        "teacherName": "BEYZANUR KIRLANGIÇ"
      }
    ]
  },
  {
    "id": "c_hassa_12b",
    "name": "12B",
    "grade": 12,
    "targetWeeklyHours": 40,
    "courses": [
      {
        "id": "co_hassa_12b_1",
        "subject": "M.ARAPÇA",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12b_2",
        "subject": "S.TEZHİP",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t16",
        "teacherName": "ŞAZİYE CENGİZ"
      },
      {
        "id": "co_hassa_12b_3",
        "subject": "S.COĞRAFYA",
        "hoursPerWeek": 4,
        "teacherId": "hassa_t12",
        "teacherName": "ALİ CAHİT KAPLAN"
      },
      {
        "id": "co_hassa_12b_4",
        "subject": "S.ÇAĞDAŞ TÜRK DÜNYA TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_12b_5",
        "subject": "DİNLER TARİHİ",
        "hoursPerWeek": 1,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12b_6",
        "subject": "İNGİLİZCE",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t3",
        "teacherName": "DOĞUŞ GÖKPINAR"
      },
      {
        "id": "co_hassa_12b_7",
        "subject": "İNKİLAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t10",
        "teacherName": "FUAT BEKTAŞ"
      },
      {
        "id": "co_hassa_12b_8",
        "subject": "İSLAM KÜLTÜR MEDENİYETİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t21",
        "teacherName": "HALİL KAHYA"
      },
      {
        "id": "co_hassa_12b_9",
        "subject": "KELAM",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_12b_10",
        "subject": "KURAN",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t18",
        "teacherName": "NERGİZ ÖZLÜK SOLAK"
      },
      {
        "id": "co_hassa_12b_11",
        "subject": "S.MANTIK",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_12b_12",
        "subject": "S.MATEMATİK",
        "hoursPerWeek": 6,
        "teacherId": "hassa_t17",
        "teacherName": "BİLAL ÇOLAK"
      },
      {
        "id": "co_hassa_12b_13",
        "subject": "S.SOSYOLOJİ",
        "hoursPerWeek": 2,
        "teacherId": "hassa_t24",
        "teacherName": "HALİL KILIÇ"
      },
      {
        "id": "co_hassa_12b_14",
        "subject": "TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 5,
        "teacherId": "hassa_t23",
        "teacherName": "MEHMET ALİ SU"
      },
      {
        "id": "co_hassa_12b_15",
        "subject": "S.TÜRK DİLİ EDEBİYATI",
        "hoursPerWeek": 3,
        "teacherId": "hassa_t19",
        "teacherName": "EMİNE SULTAN YILMAZ"
      }
    ]
  }
];
