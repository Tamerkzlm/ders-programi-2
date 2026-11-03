// frontend/src/store/seedDataAbdi.ts
// 🏫 ABDİ İPEKÇİ ORTAOKULU - GERÇEK OKUL VERİLERİ (PDF'ten 100% Doğrulanmış)
import type { Settings, Teacher, Classroom, Timetable } from '../types';

export const ABDI_SETTINGS: Settings = {
  "schoolName": "Abdi İpekçi Ortaokulu",
  "days": [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma"
  ],
  "periodsPerDay": 7,
  "lunchAfter": 5,
  "lunchDuration": 1,
  "principalName": "Taner Eryılmaz"
};

export const ABDI_TEACHERS: Teacher[] = [
  {
    "id": "abdi_t1",
    "name": "TANER ERYILMAZ",
    "branch": "İNG",
    "subjects": [
      "YDS5"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 2
  },
  {
    "id": "abdi_t2",
    "name": "MUSTAFA KEFÇİ",
    "branch": "DİĞER",
    "subjects": [
      "CVB6"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 6
  },
  {
    "id": "abdi_t3",
    "name": "ALEV YÜKSEK",
    "branch": "BED",
    "subjects": [
      "BED5"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 6
  },
  {
    "id": "abdi_t4",
    "name": "ARİFE DOĞRU",
    "branch": "BED",
    "subjects": [
      "BED5",
      "GSS6"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t5",
    "name": "GÜLİZAR İĞDE HOROZ",
    "branch": "BED",
    "subjects": [
      "BED5",
      "GSS6"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t6",
    "name": "ZEYNEP TUKAÇ",
    "branch": "BİL",
    "subjects": [
      "BTY5"
    ],
    "unavailable": {},
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t7",
    "name": "GÜLÜZAR ÖZDOĞAN KEÇİLİ",
    "branch": "DİN",
    "subjects": [
      "DİN5"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t8",
    "name": "DOĞAN MANSUROĞLU",
    "branch": "FEN",
    "subjects": [
      "FEN5",
      "BİLİM",
      "REH"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "7E",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t9",
    "name": "ZEYNEP ÇİÇEKÇİOĞLU",
    "branch": "FEN",
    "subjects": [
      "FEN5",
      "REH",
      "BİLİM"
    ],
    "unavailable": {
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "7B",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t10",
    "name": "MERVE YILMAZ AKÇE",
    "branch": "FEN",
    "subjects": [
      "FEN5",
      "BİLİM",
      "REH"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "6C",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t11",
    "name": "EMİNE KARSLI ÜSTÜNDAĞ",
    "branch": "FEN",
    "subjects": [
      "FEN5",
      "REH"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "5A",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t12",
    "name": "SELMA EROL KÖZLEME",
    "branch": "MAT",
    "subjects": [
      "MAT5",
      "REH"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "5E",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t13",
    "name": "SÜMEYYE ŞENKAYA",
    "branch": "MAT",
    "subjects": [
      "MAT5",
      "BİLİM"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 24
  },
  {
    "id": "abdi_t14",
    "name": "BÜŞRA ÇAYA ER",
    "branch": "MAT",
    "subjects": [
      "MAT5",
      "REH"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "5D",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t15",
    "name": "KÜBRA ÖKTEN ÖZTEKİN",
    "branch": "MAT",
    "subjects": [
      "MAT5",
      "REH",
      "BİLİM"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "6B",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t16",
    "name": "TUĞBA KANMAZ",
    "branch": "MAT",
    "subjects": [
      "MAT5",
      "BİLİM",
      "REH"
    ],
    "unavailable": {},
    "classTeacherOf": "5C",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t17",
    "name": "DERYA ÇOLAK",
    "branch": "İNG",
    "subjects": [
      "YD5",
      "YAB7",
      "YDS5"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 22
  },
  {
    "id": "abdi_t18",
    "name": "ÇAĞLA SÜRMEGÖZ",
    "branch": "İNG",
    "subjects": [
      "YAB7",
      "REH",
      "YDS5",
      "YD5"
    ],
    "unavailable": {},
    "classTeacherOf": "8E",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t19",
    "name": "LEYLA GÜLERYÜZ",
    "branch": "İNG",
    "subjects": [
      "YAB7",
      "YD5",
      "YDS5",
      "REH"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "7D",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t20",
    "name": "NİMET GÜZELKOKAR",
    "branch": "İNG",
    "subjects": [
      "YAB7",
      "YDS5",
      "REH",
      "YD5"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "7A",
    "isExempt": false,
    "totalWeeklyHours": 23
  },
  {
    "id": "abdi_t21",
    "name": "AYLİN TAYAR",
    "branch": "SOS",
    "subjects": [
      "İNK",
      "SOS5",
      "KMYV5",
      "REH"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "8C",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t22",
    "name": "NİSA GÜREL",
    "branch": "SOS",
    "subjects": [
      "SOS5",
      "KMYV5",
      "İNK",
      "AVE5",
      "REH"
    ],
    "unavailable": {},
    "classTeacherOf": "8D",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t23",
    "name": "CANSEL ÖZTÜRK",
    "branch": "SOS",
    "subjects": [
      "SOS5",
      "KMYV5",
      "AVE5"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 19
  },
  {
    "id": "abdi_t24",
    "name": "GONCAGÜL DENİZ",
    "branch": "SOS",
    "subjects": [
      "SOS5",
      "REH",
      "AVE5"
    ],
    "unavailable": {
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "6E",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t25",
    "name": "ESRA MAHSENOĞLU",
    "branch": "TRK",
    "subjects": [
      "REH",
      "TRK5",
      "MAS"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "5B",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t26",
    "name": "FATMA İMAÇ",
    "branch": "TRK",
    "subjects": [
      "TUR7",
      "KMYV5",
      "MD5",
      "REH",
      "MAS"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "8A",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t27",
    "name": "SEDA FİDAN",
    "branch": "TRK",
    "subjects": [
      "TUR7",
      "TRK5",
      "REH",
      "MD5"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "8B",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t28",
    "name": "MEDİNE ÇALPAN",
    "branch": "TRK",
    "subjects": [
      "KMYV5",
      "TRK5",
      "REH",
      "MAS"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "6D",
    "isExempt": false,
    "totalWeeklyHours": 22
  },
  {
    "id": "abdi_t29",
    "name": "GAMZE GÜNEŞ SIKAR",
    "branch": "TRK",
    "subjects": [
      "TUR7",
      "TRK5",
      "KMYV5"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t30",
    "name": "MEHMET MANSURGÜLER",
    "branch": "TRK",
    "subjects": [
      "TUR7",
      "REH",
      "MD5",
      "KMYV5"
    ],
    "unavailable": {
      "Cuma": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "7C",
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t31",
    "name": "KARDELEN ALTIN",
    "branch": "TRK",
    "subjects": [
      "TRK5",
      "TUR7",
      "REH",
      "MAS",
      "MD5"
    ],
    "unavailable": {
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": "6A",
    "isExempt": false,
    "totalWeeklyHours": 21
  },
  {
    "id": "abdi_t32",
    "name": "ALİ ŞAFAK CEYLAN",
    "branch": "MÜZ",
    "subjects": [
      "MÜZ5"
    ],
    "unavailable": {
      "Çarşamba": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  },
  {
    "id": "abdi_t33",
    "name": "GÖKÇE EŞSİZ",
    "branch": "GÖR",
    "subjects": [
      "GS5",
      "GSS6"
    ],
    "unavailable": {
      "Perşembe": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 22
  },
  {
    "id": "abdi_t34",
    "name": "BEGONYA KAÇAN",
    "branch": "GÖR",
    "subjects": [
      "TEK",
      "GSS6"
    ],
    "unavailable": {
      "Pazartesi": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 22
  },
  {
    "id": "abdi_t35",
    "name": "DİN KÜLTÜRÜ",
    "branch": "DİN",
    "subjects": [
      "DİN5"
    ],
    "unavailable": {
      "Salı": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "classTeacherOf": null,
    "isExempt": false,
    "totalWeeklyHours": 20
  }
];

export const ABDI_CLASSROOMS: Classroom[] = [
  {
    "id": "c_5a",
    "name": "5A",
    "courses": [
      {
        "id": "co_5A_YDS5_abdi_t1",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t1",
        "teacherName": "TANER ERYILMAZ"
      },
      {
        "id": "co_5A_BED5_abdi_t3",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t3",
        "teacherName": "ALEV YÜKSEK"
      },
      {
        "id": "co_5A_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_5A_FEN5_abdi_t11",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_5A_REH_abdi_t11",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_5A_MAT5_abdi_t15",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_5A_YD5_abdi_t17",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5A_SOS5_abdi_t21",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_5A_AVE5_abdi_t23",
        "subject": "AVE5",
        "subjectName": "Ahlak ve Vatandaşlık Eğitimi (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_5A_TRK5_abdi_t28",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_5A_MAS_abdi_t28",
        "subject": "MAS",
        "subjectName": "SEÇMELİ MASAL1",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_5A_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_5A_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_5A_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_5b",
    "name": "5B",
    "courses": [
      {
        "id": "co_5B_BED5_abdi_t3",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t3",
        "teacherName": "ALEV YÜKSEK"
      },
      {
        "id": "co_5B_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_5B_FEN5_abdi_t9",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_5B_MAT5_abdi_t14",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t14",
        "teacherName": "BÜŞRA ÇAYA ER"
      },
      {
        "id": "co_5B_YDS5_abdi_t17",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5B_YD5_abdi_t20",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_5B_AVE5_abdi_t23",
        "subject": "AVE5",
        "subjectName": "Ahlak ve Vatandaşlık Eğitimi (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_5B_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_5B_REH_abdi_t25",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_5B_TRK5_abdi_t25",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_5B_MAS_abdi_t25",
        "subject": "MAS",
        "subjectName": "SEÇMELİ MASAL1 Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_5B_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_5B_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_5B_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_5c",
    "name": "5C",
    "courses": [
      {
        "id": "co_5C_BED5_abdi_t3",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t3",
        "teacherName": "ALEV YÜKSEK"
      },
      {
        "id": "co_5C_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_5C_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_5C_FEN5_abdi_t8",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_5C_MAT5_abdi_t16",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_5C_REH_abdi_t16",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_5C_YD5_abdi_t17",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5C_YDS5_abdi_t17",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5C_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_5C_AVE5_abdi_t24",
        "subject": "AVE5",
        "subjectName": "Ahlak ve Vatandaşlık Eğitimi (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_5C_TRK5_abdi_t25",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_5C_MAS_abdi_t25",
        "subject": "MAS",
        "subjectName": "SEÇMELİ MASAL1",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_5C_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_5C_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      }
    ]
  },
  {
    "id": "c_5d",
    "name": "5D",
    "courses": [
      {
        "id": "co_5D_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_5D_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_5D_FEN5_abdi_t10",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_5D_MAT5_abdi_t14",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t14",
        "teacherName": "BÜŞRA ÇAYA ER"
      },
      {
        "id": "co_5D_REH_abdi_t14",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t14",
        "teacherName": "BÜŞRA ÇAYA ER"
      },
      {
        "id": "co_5D_YD5_abdi_t17",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5D_YDS5_abdi_t17",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_5D_SOS5_abdi_t22",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_5D_AVE5_abdi_t22",
        "subject": "AVE5",
        "subjectName": "Ahlak ve Vatandaşlık Eğitimi (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_5D_MAS_abdi_t26",
        "subject": "MAS",
        "subjectName": "SEÇMELİ MASAL1 Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_5D_TRK5_abdi_t29",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t29",
        "teacherName": "GAMZE GÜNEŞ SIKAR"
      },
      {
        "id": "co_5D_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_5D_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_5D_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_5e",
    "name": "5E",
    "courses": [
      {
        "id": "co_5E_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_5E_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_5E_FEN5_abdi_t8",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_5E_MAT5_abdi_t12",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t12",
        "teacherName": "SELMA EROL KÖZLEME"
      },
      {
        "id": "co_5E_REH_abdi_t12",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t12",
        "teacherName": "SELMA EROL KÖZLEME"
      },
      {
        "id": "co_5E_YD5_abdi_t18",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_5E_YDS5_abdi_t19",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_5E_SOS5_abdi_t23",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_5E_AVE5_abdi_t23",
        "subject": "AVE5",
        "subjectName": "Ahlak ve Vatandaşlık Eğitimi (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_5E_TRK5_abdi_t31",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_5E_MAS_abdi_t31",
        "subject": "MAS",
        "subjectName": "SEÇMELİ MASAL1",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_5E_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_5E_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_5E_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_6a",
    "name": "6A",
    "courses": [
      {
        "id": "co_6A_GSS6_abdi_t4",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli) Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_6A_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6A_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_6A_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_6A_FEN5_abdi_t10",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_6A_MAT5_abdi_t15",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_6A_BİLİM_abdi_t15",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_6A_YD5_abdi_t19",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_6A_SOS5_abdi_t21",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_6A_KMYV5_abdi_t23",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_6A_TRK5_abdi_t31",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_6A_REH_abdi_t31",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_6A_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_6A_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      }
    ]
  },
  {
    "id": "c_6b",
    "name": "6B",
    "courses": [
      {
        "id": "co_6B_GSS6_abdi_t4",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_6B_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6B_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_6B_FEN5_abdi_t11",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_6B_BİLİM_abdi_t13",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_6B_REH_abdi_t15",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_6B_MAT5_abdi_t15",
        "subject": "MAT5",
        "subjectName": "Matematik Toplamlar",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_6B_YD5_abdi_t19",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_6B_SOS5_abdi_t23",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_6B_KMYV5_abdi_t23",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_6B_TRK5_abdi_t25",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t25",
        "teacherName": "ESRA MAHSENOĞLU"
      },
      {
        "id": "co_6B_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_6B_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_6B_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_6c",
    "name": "6C",
    "courses": [
      {
        "id": "co_6C_CVB6_abdi_t2",
        "subject": "CVB6",
        "subjectName": "Çevre Eğitimi ve İklim Değişikliği (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t2",
        "teacherName": "MUSTAFA KEFÇİ"
      },
      {
        "id": "co_6C_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6C_GSS6_abdi_t5",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6C_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_6C_FEN5_abdi_t10",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_6C_REH_abdi_t10",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_6C_MAT5_abdi_t13",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_6C_YD5_abdi_t18",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_6C_SOS5_abdi_t21",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_6C_TRK5_abdi_t27",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_6C_KMYV5_abdi_t28",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_6C_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_6C_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_6C_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_6d",
    "name": "6D",
    "courses": [
      {
        "id": "co_6D_CVB6_abdi_t2",
        "subject": "CVB6",
        "subjectName": "Çevre Eğitimi ve İklim Değişikliği (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t2",
        "teacherName": "MUSTAFA KEFÇİ"
      },
      {
        "id": "co_6D_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_6D_GSS6_abdi_t5",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6D_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_6D_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_6D_FEN5_abdi_t9",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri Toplamlar",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_6D_MAT5_abdi_t14",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t14",
        "teacherName": "BÜŞRA ÇAYA ER"
      },
      {
        "id": "co_6D_YD5_abdi_t17",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_6D_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_6D_KMYV5_abdi_t28",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_6D_TRK5_abdi_t28",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_6D_REH_abdi_t28",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_6D_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_6D_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      }
    ]
  },
  {
    "id": "c_6e",
    "name": "6E",
    "courses": [
      {
        "id": "co_6E_CVB6_abdi_t2",
        "subject": "CVB6",
        "subjectName": "Çevre Eğitimi ve İklim Değişikliği (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t2",
        "teacherName": "MUSTAFA KEFÇİ"
      },
      {
        "id": "co_6E_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_6E_GSS6_abdi_t5",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_6E_BTY5_abdi_t6",
        "subject": "BTY5",
        "subjectName": "Bilişim Teknolojileri ve Yazılım",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t6",
        "teacherName": "ZEYNEP TUKAÇ"
      },
      {
        "id": "co_6E_FEN5_abdi_t8",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_6E_MAT5_abdi_t12",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t12",
        "teacherName": "SELMA EROL KÖZLEME"
      },
      {
        "id": "co_6E_YD5_abdi_t20",
        "subject": "YD5",
        "subjectName": "Yabancı Dil",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_6E_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_6E_REH_abdi_t24",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_6E_TRK5_abdi_t29",
        "subject": "TRK5",
        "subjectName": "Türkçe",
        "hoursPerWeek": 6,
        "teacherId": "abdi_t29",
        "teacherName": "GAMZE GÜNEŞ SIKAR"
      },
      {
        "id": "co_6E_KMYV5_abdi_t29",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t29",
        "teacherName": "GAMZE GÜNEŞ SIKAR"
      },
      {
        "id": "co_6E_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_6E_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_6E_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_7a",
    "name": "7A",
    "courses": [
      {
        "id": "co_7A_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_7A_GSS6_abdi_t5",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_7A_BİLİM_abdi_t10",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_7A_FEN5_abdi_t11",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_7A_MAT5_abdi_t16",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_7A_REH_abdi_t20",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_7A_YAB7_abdi_t20",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL Toplamlar",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_7A_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_7A_TUR7_abdi_t26",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_7A_KMYV5_abdi_t28",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_7A_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_7A_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7A_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      },
      {
        "id": "co_7A_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_7b",
    "name": "7B",
    "courses": [
      {
        "id": "co_7B_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_7B_REH_abdi_t9",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_7B_BİLİM_abdi_t9",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_7B_FEN5_abdi_t9",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_7B_MAT5_abdi_t14",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t14",
        "teacherName": "BÜŞRA ÇAYA ER"
      },
      {
        "id": "co_7B_YAB7_abdi_t17",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t17",
        "teacherName": "DERYA ÇOLAK"
      },
      {
        "id": "co_7B_SOS5_abdi_t23",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t23",
        "teacherName": "CANSEL ÖZTÜRK"
      },
      {
        "id": "co_7B_TUR7_abdi_t27",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_7B_KMYV5_abdi_t28",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t28",
        "teacherName": "MEDİNE ÇALPAN"
      },
      {
        "id": "co_7B_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_7B_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7B_GSS6_abdi_t34",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      },
      {
        "id": "co_7B_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      },
      {
        "id": "co_7B_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_7c",
    "name": "7C",
    "courses": [
      {
        "id": "co_7C_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_7C_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_7C_BİLİM_abdi_t8",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_7C_FEN5_abdi_t9",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_7C_MAT5_abdi_t12",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t12",
        "teacherName": "SELMA EROL KÖZLEME"
      },
      {
        "id": "co_7C_YAB7_abdi_t18",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_7C_SOS5_abdi_t21",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_7C_TUR7_abdi_t30",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_7C_REH_abdi_t30",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_7C_KMYV5_abdi_t30",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_7C_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_7C_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7C_GSS6_abdi_t34",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      },
      {
        "id": "co_7C_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_7d",
    "name": "7D",
    "courses": [
      {
        "id": "co_7D_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_7D_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_7D_FEN5_abdi_t8",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_7D_MAT5_abdi_t13",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_7D_BİLİM_abdi_t13",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_7D_YAB7_abdi_t19",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_7D_REH_abdi_t19",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_7D_SOS5_abdi_t24",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t24",
        "teacherName": "GONCAGÜL DENİZ"
      },
      {
        "id": "co_7D_TUR7_abdi_t29",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t29",
        "teacherName": "GAMZE GÜNEŞ SIKAR"
      },
      {
        "id": "co_7D_KMYV5_abdi_t29",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t29",
        "teacherName": "GAMZE GÜNEŞ SIKAR"
      },
      {
        "id": "co_7D_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_7D_GSS6_abdi_t33",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7D_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7D_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_7e",
    "name": "7E",
    "courses": [
      {
        "id": "co_7E_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_7E_FEN5_abdi_t8",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_7E_REH_abdi_t8",
        "subject": "REH",
        "subjectName": "REHBERLİK Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t8",
        "teacherName": "DOĞAN MANSUROĞLU"
      },
      {
        "id": "co_7E_MAT5_abdi_t12",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t12",
        "teacherName": "SELMA EROL KÖZLEME"
      },
      {
        "id": "co_7E_BİLİM_abdi_t16",
        "subject": "BİLİM",
        "subjectName": "SEÇMELİ BİLİM UYG",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_7E_YAB7_abdi_t19",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_7E_SOS5_abdi_t22",
        "subject": "SOS5",
        "subjectName": "Sosyal Bilgiler",
        "hoursPerWeek": 3,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_7E_KMYV5_abdi_t26",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_7E_TUR7_abdi_t30",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_7E_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_7E_GSS6_abdi_t33",
        "subject": "GSS6",
        "subjectName": "Geleneksel Sanatlar (Seçmeli)",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7E_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_7E_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      },
      {
        "id": "co_7E_DİN5_abdi_t35",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t35",
        "teacherName": "DİN KÜLTÜRÜ"
      }
    ]
  },
  {
    "id": "c_8a",
    "name": "8A",
    "courses": [
      {
        "id": "co_8A_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_8A_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_8A_FEN5_abdi_t9",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t9",
        "teacherName": "ZEYNEP ÇİÇEKÇİOĞLU"
      },
      {
        "id": "co_8A_MAT5_abdi_t13",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_8A_YAB7_abdi_t20",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_8A_YDS5_abdi_t20",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_8A_KMYV5_abdi_t22",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8A_İNK_abdi_t22",
        "subject": "İNK",
        "subjectName": "İNKILAP TARİHİ Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8A_TUR7_abdi_t26",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_8A_MD5_abdi_t26",
        "subject": "MD5",
        "subjectName": "Masal ve Destanlarımız (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_8A_REH_abdi_t26",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_8A_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_8A_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar Toplamlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_8A_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_8b",
    "name": "8B",
    "courses": [
      {
        "id": "co_8B_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_8B_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_8B_FEN5_abdi_t10",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_8B_MAT5_abdi_t13",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t13",
        "teacherName": "SÜMEYYE ŞENKAYA"
      },
      {
        "id": "co_8B_YAB7_abdi_t19",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_8B_YDS5_abdi_t19",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t19",
        "teacherName": "LEYLA GÜLERYÜZ"
      },
      {
        "id": "co_8B_KMYV5_abdi_t21",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_8B_İNK_abdi_t21",
        "subject": "İNK",
        "subjectName": "İNKILAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_8B_TUR7_abdi_t27",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_8B_REH_abdi_t27",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_8B_MD5_abdi_t27",
        "subject": "MD5",
        "subjectName": "Masal ve Destanlarımız (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_8B_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_8B_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_8B_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_8c",
    "name": "8C",
    "courses": [
      {
        "id": "co_8C_BED5_abdi_t4",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t4",
        "teacherName": "ARİFE DOĞRU"
      },
      {
        "id": "co_8C_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_8C_FEN5_abdi_t11",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_8C_MAT5_abdi_t16",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_8C_YAB7_abdi_t20",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_8C_YDS5_abdi_t20",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t20",
        "teacherName": "NİMET GÜZELKOKAR"
      },
      {
        "id": "co_8C_İNK_abdi_t21",
        "subject": "İNK",
        "subjectName": "İNKILAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_8C_REH_abdi_t21",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_8C_KMYV5_abdi_t21",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t21",
        "teacherName": "AYLİN TAYAR"
      },
      {
        "id": "co_8C_TUR7_abdi_t26",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t26",
        "teacherName": "FATMA İMAÇ"
      },
      {
        "id": "co_8C_MD5_abdi_t27",
        "subject": "MD5",
        "subjectName": "Masal ve Destanlarımız (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t27",
        "teacherName": "SEDA FİDAN"
      },
      {
        "id": "co_8C_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_8C_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_8C_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_8d",
    "name": "8D",
    "courses": [
      {
        "id": "co_8D_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_8D_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_8D_FEN5_abdi_t10",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t10",
        "teacherName": "MERVE YILMAZ AKÇE"
      },
      {
        "id": "co_8D_MAT5_abdi_t15",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t15",
        "teacherName": "KÜBRA ÖKTEN ÖZTEKİN"
      },
      {
        "id": "co_8D_YAB7_abdi_t18",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_8D_YDS5_abdi_t18",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_8D_KMYV5_abdi_t22",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8D_İNK_abdi_t22",
        "subject": "İNK",
        "subjectName": "İNKILAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8D_REH_abdi_t22",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8D_TUR7_abdi_t31",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_8D_MD5_abdi_t31",
        "subject": "MD5",
        "subjectName": "Masal ve Destanlarımız (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t31",
        "teacherName": "KARDELEN ALTIN"
      },
      {
        "id": "co_8D_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_8D_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_8D_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  },
  {
    "id": "c_8e",
    "name": "8E",
    "courses": [
      {
        "id": "co_8E_BED5_abdi_t5",
        "subject": "BED5",
        "subjectName": "Beden Eğitimi ve Spor Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t5",
        "teacherName": "GÜLİZAR İĞDE HOROZ"
      },
      {
        "id": "co_8E_DİN5_abdi_t7",
        "subject": "DİN5",
        "subjectName": "Din Kültürü ve Ahlak Bilgisi",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t7",
        "teacherName": "GÜLÜZAR ÖZDOĞAN KEÇİLİ"
      },
      {
        "id": "co_8E_FEN5_abdi_t11",
        "subject": "FEN5",
        "subjectName": "Fen Bilimleri",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t11",
        "teacherName": "EMİNE KARSLI ÜSTÜNDAĞ"
      },
      {
        "id": "co_8E_MAT5_abdi_t16",
        "subject": "MAT5",
        "subjectName": "Matematik",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t16",
        "teacherName": "TUĞBA KANMAZ"
      },
      {
        "id": "co_8E_YAB7_abdi_t18",
        "subject": "YAB7",
        "subjectName": "YABANCI DİL",
        "hoursPerWeek": 4,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_8E_REH_abdi_t18",
        "subject": "REH",
        "subjectName": "REHBERLİK",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_8E_YDS5_abdi_t18",
        "subject": "YDS5",
        "subjectName": "Yabancı Dil (Seçmeli) Toplamlar",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t18",
        "teacherName": "ÇAĞLA SÜRMEGÖZ"
      },
      {
        "id": "co_8E_İNK_abdi_t22",
        "subject": "İNK",
        "subjectName": "İNKILAP TARİHİ",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8E_KMYV5_abdi_t22",
        "subject": "KMYV5",
        "subjectName": "Kültür ve Medeniyetimize Yön Verenler (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t22",
        "teacherName": "NİSA GÜREL"
      },
      {
        "id": "co_8E_TUR7_abdi_t30",
        "subject": "TUR7",
        "subjectName": "TÜRKÇE7",
        "hoursPerWeek": 5,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_8E_MD5_abdi_t30",
        "subject": "MD5",
        "subjectName": "Masal ve Destanlarımız (Seçmeli)",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t30",
        "teacherName": "MEHMET MANSURGÜLER"
      },
      {
        "id": "co_8E_MÜZ5_abdi_t32",
        "subject": "MÜZ5",
        "subjectName": "Müzik",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t32",
        "teacherName": "ALİ ŞAFAK CEYLAN"
      },
      {
        "id": "co_8E_GS5_abdi_t33",
        "subject": "GS5",
        "subjectName": "Görsel Sanatlar",
        "hoursPerWeek": 1,
        "teacherId": "abdi_t33",
        "teacherName": "GÖKÇE EŞSİZ"
      },
      {
        "id": "co_8E_TEK_abdi_t34",
        "subject": "TEK",
        "subjectName": "TEKNOLOJİ VE TASARIM",
        "hoursPerWeek": 2,
        "teacherId": "abdi_t34",
        "teacherName": "BEGONYA KAÇAN"
      }
    ]
  }
];

export const ABDI_TIMETABLE: Timetable = {
  "c_5a": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 2,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 3,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 6,
        "subject": "YDS5",
        "teacherId": "abdi_t1"
      },
      {
        "period": 7,
        "subject": "YDS5",
        "teacherId": "abdi_t1"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 5,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 6,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 7,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      },
      {
        "period": 2,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 4,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t11"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 3,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 4,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 5,
        "subject": "MAS",
        "teacherId": "abdi_t28"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      }
    ]
  },
  "c_5b": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "REH",
        "teacherId": "abdi_t25"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 6,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 7,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 2,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 3,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      },
      {
        "period": 2,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 6,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 7,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 2,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 3,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 6,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 7,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 2,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 5,
        "subject": "MAS",
        "teacherId": "abdi_t25"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      }
    ]
  },
  "c_5c": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 4,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 5,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 2,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 4,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 5,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 6,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 7,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 3,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 5,
        "subject": "MAS",
        "teacherId": "abdi_t25"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 2,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t16"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 4,
        "subject": "AVE5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 5,
        "subject": "AVE5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      },
      {
        "period": 7,
        "subject": "BED5",
        "teacherId": "abdi_t3"
      }
    ]
  },
  "c_5d": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 2,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 3,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 2,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 3,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 4,
        "subject": "REH",
        "teacherId": "abdi_t14"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 2,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 3,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 5,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 6,
        "subject": "AVE5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 7,
        "subject": "AVE5",
        "teacherId": "abdi_t22"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 7,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 2,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 3,
        "subject": "MAS",
        "teacherId": "abdi_t26"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      }
    ]
  },
  "c_5e": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 6,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 7,
        "subject": "AVE5",
        "teacherId": "abdi_t23"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 3,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 5,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 6,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 7,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 2,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 2,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 5,
        "subject": "YDS5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 6,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 7,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 2,
        "subject": "REH",
        "teacherId": "abdi_t12"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 5,
        "subject": "MAS",
        "teacherId": "abdi_t31"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      }
    ]
  },
  "c_6a": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 2,
        "subject": "KMYV5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 4,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 5,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 6,
        "subject": "BİLİM",
        "teacherId": "abdi_t15"
      },
      {
        "period": 7,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 3,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 3,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 5,
        "subject": "BİLİM",
        "teacherId": "abdi_t15"
      },
      {
        "period": 6,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 7,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t31"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 6,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 7,
        "subject": "GSS6",
        "teacherId": "abdi_t4"
      }
    ]
  },
  "c_6b": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t13"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 4,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t15"
      },
      {
        "period": 6,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 7,
        "subject": "GSS6",
        "teacherId": "abdi_t4"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 3,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 7,
        "subject": "BİLİM",
        "teacherId": "abdi_t13"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 4,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t25"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 2,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 6,
        "subject": "KMYV5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 7,
        "subject": "KMYV5",
        "teacherId": "abdi_t23"
      }
    ]
  },
  "c_6c": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 3,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 3,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 4,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 6,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 7,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 2,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 4,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      },
      {
        "period": 5,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 5,
        "subject": "GSS6",
        "teacherId": "abdi_t5"
      },
      {
        "period": 6,
        "subject": "YD5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 7,
        "subject": "REH",
        "teacherId": "abdi_t10"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 5,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t27"
      }
    ]
  },
  "c_6d": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 2,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 3,
        "subject": "GSS6",
        "teacherId": "abdi_t5"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 4,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t28"
      },
      {
        "period": 6,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 7,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 2,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      },
      {
        "period": 3,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 5,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 3,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 4,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 5,
        "subject": "YD5",
        "teacherId": "abdi_t17"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 7,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 6,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 7,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      }
    ]
  },
  "c_6e": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 2,
        "subject": "BTY5",
        "teacherId": "abdi_t6"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 6,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 7,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 2,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t24"
      },
      {
        "period": 4,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 5,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 6,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      },
      {
        "period": 7,
        "subject": "CVB6",
        "teacherId": "abdi_t2"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 2,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 7,
        "subject": "GSS6",
        "teacherId": "abdi_t5"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 2,
        "subject": "TRK5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 3,
        "subject": "YD5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 5,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "KMYV5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 2,
        "subject": "KMYV5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 3,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 6,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 7,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      }
    ]
  },
  "c_7a": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 2,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 3,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 6,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 7,
        "subject": "REH",
        "teacherId": "abdi_t20"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 2,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 5,
        "subject": "BİLİM",
        "teacherId": "abdi_t10"
      },
      {
        "period": 6,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 7,
        "subject": "GSS6",
        "teacherId": "abdi_t5"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 3,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 5,
        "subject": "BİLİM",
        "teacherId": "abdi_t10"
      },
      {
        "period": 6,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 7,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 3,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      }
    ]
  },
  "c_7b": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 2,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t9"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 5,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 6,
        "subject": "YAB7",
        "teacherId": "abdi_t17"
      },
      {
        "period": 7,
        "subject": "YAB7",
        "teacherId": "abdi_t17"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "BİLİM",
        "teacherId": "abdi_t9"
      },
      {
        "period": 2,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t9"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 6,
        "subject": "YAB7",
        "teacherId": "abdi_t17"
      },
      {
        "period": 7,
        "subject": "YAB7",
        "teacherId": "abdi_t17"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "GSS6",
        "teacherId": "abdi_t34"
      },
      {
        "period": 2,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 6,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 7,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t14"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t23"
      },
      {
        "period": 6,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      },
      {
        "period": 7,
        "subject": "KMYV5",
        "teacherId": "abdi_t28"
      }
    ]
  },
  "c_7c": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 4,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 2,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 3,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 7,
        "subject": "REH",
        "teacherId": "abdi_t30"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 2,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 5,
        "subject": "GSS6",
        "teacherId": "abdi_t34"
      },
      {
        "period": 6,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 7,
        "subject": "BİLİM",
        "teacherId": "abdi_t8"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 2,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 6,
        "subject": "KMYV5",
        "teacherId": "abdi_t30"
      },
      {
        "period": 7,
        "subject": "KMYV5",
        "teacherId": "abdi_t30"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t8"
      },
      {
        "period": 4,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 5,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      }
    ]
  },
  "c_7d": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "TUR7",
        "teacherId": "abdi_t29"
      },
      {
        "period": 2,
        "subject": "TUR7",
        "teacherId": "abdi_t29"
      },
      {
        "period": 3,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 4,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 5,
        "subject": "GSS6",
        "teacherId": "abdi_t33"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 7,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 5,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t29"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t29"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t13"
      },
      {
        "period": 4,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 5,
        "subject": "SOS5",
        "teacherId": "abdi_t24"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 7,
        "subject": "REH",
        "teacherId": "abdi_t19"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 3,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 7,
        "subject": "BİLİM",
        "teacherId": "abdi_t13"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 2,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t29"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 6,
        "subject": "KMYV5",
        "teacherId": "abdi_t29"
      },
      {
        "period": 7,
        "subject": "KMYV5",
        "teacherId": "abdi_t29"
      }
    ]
  },
  "c_7e": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 2,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t16"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "KMYV5",
        "teacherId": "abdi_t26"
      },
      {
        "period": 2,
        "subject": "KMYV5",
        "teacherId": "abdi_t26"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 6,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 7,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "GSS6",
        "teacherId": "abdi_t33"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 3,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 4,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 6,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 2,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t8"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 6,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      },
      {
        "period": 7,
        "subject": "FEN5",
        "teacherId": "abdi_t8"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "SOS5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 2,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 3,
        "subject": "BİLİM",
        "teacherId": "abdi_t16"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 5,
        "subject": "DİN5",
        "teacherId": "abdi_t35"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t12"
      }
    ]
  },
  "c_8a": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 5,
        "subject": "YDS5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 6,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 7,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "MD5",
        "teacherId": "abdi_t26"
      },
      {
        "period": 2,
        "subject": "MD5",
        "teacherId": "abdi_t26"
      },
      {
        "period": 3,
        "subject": "REH",
        "teacherId": "abdi_t26"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t9"
      },
      {
        "period": 3,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 4,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 7,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      }
    ]
  },
  "c_8b": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 5,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 7,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 7,
        "subject": "REH",
        "teacherId": "abdi_t27"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 3,
        "subject": "YDS5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t19"
      },
      {
        "period": 5,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 6,
        "subject": "İNK",
        "teacherId": "abdi_t21"
      },
      {
        "period": 7,
        "subject": "İNK",
        "teacherId": "abdi_t21"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t19"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 4,
        "subject": "MAT5",
        "teacherId": "abdi_t13"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t27"
      },
      {
        "period": 6,
        "subject": "MD5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 7,
        "subject": "MD5",
        "teacherId": "abdi_t27"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 3,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 5,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 6,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 7,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      }
    ]
  },
  "c_8c": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "İNK",
        "teacherId": "abdi_t21"
      },
      {
        "period": 2,
        "subject": "İNK",
        "teacherId": "abdi_t21"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 5,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 3,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 4,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t4"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 2,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 3,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 6,
        "subject": "YDS5",
        "teacherId": "abdi_t20"
      },
      {
        "period": 7,
        "subject": "YDS5",
        "teacherId": "abdi_t20"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 3,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t21"
      },
      {
        "period": 6,
        "subject": "KMYV5",
        "teacherId": "abdi_t21"
      },
      {
        "period": 7,
        "subject": "KMYV5",
        "teacherId": "abdi_t21"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "MD5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 2,
        "subject": "MD5",
        "teacherId": "abdi_t27"
      },
      {
        "period": 3,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t26"
      },
      {
        "period": 6,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      },
      {
        "period": 7,
        "subject": "YAB7",
        "teacherId": "abdi_t20"
      }
    ]
  },
  "c_8d": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t31"
      },
      {
        "period": 6,
        "subject": "YDS5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 7,
        "subject": "YDS5",
        "teacherId": "abdi_t18"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 2,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t31"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t31"
      },
      {
        "period": 5,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "TUR7",
        "teacherId": "abdi_t31"
      },
      {
        "period": 2,
        "subject": "TUR7",
        "teacherId": "abdi_t31"
      },
      {
        "period": 3,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 5,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 6,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 7,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 3,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 4,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t22"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 2,
        "subject": "MAT5",
        "teacherId": "abdi_t15"
      },
      {
        "period": 3,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 4,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 5,
        "subject": "FEN5",
        "teacherId": "abdi_t10"
      },
      {
        "period": 6,
        "subject": "MD5",
        "teacherId": "abdi_t31"
      },
      {
        "period": 7,
        "subject": "MD5",
        "teacherId": "abdi_t31"
      }
    ]
  },
  "c_8e": {
    "Pazartesi": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 3,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 4,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 5,
        "subject": "REH",
        "teacherId": "abdi_t18"
      },
      {
        "period": 6,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 7,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      }
    ],
    "Salı": [
      {
        "period": 1,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 2,
        "subject": "DİN5",
        "teacherId": "abdi_t7"
      },
      {
        "period": 3,
        "subject": "GS5",
        "teacherId": "abdi_t33"
      },
      {
        "period": 4,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 5,
        "subject": "TEK",
        "teacherId": "abdi_t34"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      }
    ],
    "Çarşamba": [
      {
        "period": 1,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 2,
        "subject": "İNK",
        "teacherId": "abdi_t22"
      },
      {
        "period": 3,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 4,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 5,
        "subject": "MD5",
        "teacherId": "abdi_t30"
      },
      {
        "period": 6,
        "subject": "MD5",
        "teacherId": "abdi_t30"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      }
    ],
    "Perşembe": [
      {
        "period": 1,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 2,
        "subject": "FEN5",
        "teacherId": "abdi_t11"
      },
      {
        "period": 3,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 4,
        "subject": "KMYV5",
        "teacherId": "abdi_t22"
      },
      {
        "period": 5,
        "subject": "TUR7",
        "teacherId": "abdi_t30"
      },
      {
        "period": 6,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      },
      {
        "period": 7,
        "subject": "BED5",
        "teacherId": "abdi_t5"
      }
    ],
    "Cuma": [
      {
        "period": 1,
        "subject": "MÜZ5",
        "teacherId": "abdi_t32"
      },
      {
        "period": 2,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 3,
        "subject": "YAB7",
        "teacherId": "abdi_t18"
      },
      {
        "period": 4,
        "subject": "YDS5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 5,
        "subject": "YDS5",
        "teacherId": "abdi_t18"
      },
      {
        "period": 6,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      },
      {
        "period": 7,
        "subject": "MAT5",
        "teacherId": "abdi_t16"
      }
    ]
  }
};
