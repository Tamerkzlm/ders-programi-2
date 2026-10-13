Lise Ders Programı Yönetim Sistemi — DESIGN.md 
Versiyon: 2.0 
Hazırlayan: Tamer Közleme 
Referans: openTimetables (rocristoi/openTimetables) — Python OR-Tools backend + React frontend 

1. Proje Özeti 
Okul idarecisinin kullanacağı, tek kullanıcılı, tarayıcı tabanlı bir ders programı hazırlama uygulaması. 
Frontend Netlify'da, Python/OR-Tools backend Render'da barındırılır. 
Veriler localStorage 'da saklanır; backend yalnızca optimizasyon için çağrılır. 

2. Mimari 
GitHub Repo (tek repo, iki klasör) 
    ├── /frontend   →  Netlify (React + Vite + Tailwind) 
    └── /backend    →  Render  (Python + FastAPI + OR-Tools) 

İletişim Akışı 
[Kullanıcı Tarayıcısı] 
        │ 
        │  1. Veri gir (öğretmen, sınıf, kısıtlar) 
        │     localStorage'a kaydet 
        │ 
        │  2. "Program Oluştur" butonuna bas 
        │     POST /solve  →  Render backend 
        │ 
        │  3. OR-Tools çözer, timetable JSON döner 
        │     localStorage'a kaydet 
        │ 
        │  4. Tabloyu göster, PDF/Excel indir 
        ▼ 

Cold Start Çözümü 
Render ücretsiz tier'da servis 15 dk kullanılmazsa uyur. 
→ UptimeRobot  (ücretsiz) ile /health  endpoint'ine her 14 dk ping atılır. 
→ Kullanıcı hiçbir zaman 2-3 saniyelik gecikmeden fazlasını yaşamaz. 

3. Tech Stack 
KatmanTeknolojiPlatform 
Frontend 
React 18 + Vite + Tailwind CSS 
Netlify 
Routing 
React Router v6 
— 
State 
Zustand 
— 
Backend API 
Python 3.11 + FastAPI 
Render 
Algoritma 
Google OR-Tools (CP-SAT) 
Render 
PDF Export 
jsPDF + jsPDF-AutoTable 
Frontend 
Excel Export 
SheetJS (xlsx) 
Frontend 
Storage 
localStorage 
Tarayıcı 

4. Veri Modeli 
4.1 Okul Ayarları ( dps_settings ) 
{ 
  "schoolName": "Hz. Ayşe Kız Anadolu İmam Hatip Lisesi", 
  "days": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"], 
  "periodsPerDay": 8, 
  "periodDuration": 40, 
  "breakDuration": 10, 
  "startTime": "08:00", 
  "lunchBreakAfter": 4, 
  "lunchBreakDuration": 30 
} 

Tüm değerler kullanıcı tarafından düzenlenebilir. 
4.2 Öğretmen ( dps_teachers ) 
{ 
  "id": "uuid", 
  "name": "Ayşe Yılmaz", 
  "branch": "Matematik", 
  "maxPerDay": 6, 
  "unavailable": { 
    "Pazartesi": [1, 2], 
    "Cuma": [7, 8] 
  } 
} 

4.3 Sınıf ( dps_classrooms ) 
{ 
  "id": "uuid", 
  "name": "9-A", 
  "grade": 9, 
  "courses": [ 
    { "subject": "Matematik", "teacherId": "uuid", "hoursPerWeek": 5 }, 
    { "subject": "Türk Dili", "teacherId": "uuid", "hoursPerWeek": 4 } 
  ] 
} 

4.4 Timetable ( dps_timetable ) 
{ 
  "classroomId": "uuid", 
  "slots": { 
    "Pazartesi": [ 
      { "period": 1, "subject": "Matematik", "teacherId": "uuid" }, 
      { "period": 2, "subject": "Türk Dili", "teacherId": "uuid" } 
    ] 
  } 
} 


5. Backend API (FastAPI) 
Endpoint'ler 
MethodPathAçıklama 
GET 
/health 
Servis sağlık kontrolü (UptimeRobot ping) 
POST 
/solve 
OR-Tools ile program oluştur 
POST /solve — İstek Gövdesi 
{ 
  "settings": { ... }, 
  "teachers": [ ... ], 
  "classrooms": [ ... ] 
} 

POST /solve — Yanıt 
{ 
  "status": "ok", 
  "timetable": { ... }, 
  "metrics": { 
    "totalRequired": 120, 
    "totalAssigned": 118, 
    "unassigned": [ 
      { "classroom": "9-A", "subject": "Beden", "missing": 1 } 
    ], 
    "warnings": ["Ayşe Yılmaz Salı günü 7 saat ders veriyor."] 
  } 
} 


6. OR-Tools Algoritması (CP-SAT) 
Değişkenler 
x[c][d][p][t] = 1  →  sınıf c, gün d, ders saati p'de öğretmen t ders veriyor 

Kısıtlar 
Öğretmen çakışması:  Bir öğretmen aynı gün+saatte yalnızca 1 sınıfta olabilir 
Sınıf çakışması:  Bir sınıfın aynı gün+saatinde yalnızca 1 ders olabilir 
Müsaitlik:  unavailable  listesindeki slotlara atama yapılmaz 
Günlük max:  Öğretmenin maxPerDay  limiti aşılmaz 
Haftalık saat:  Her ders için hoursPerWeek  tam olarak karşılanmaya çalışılır 
Dağılım:  Aynı ders aynı gün 2'den fazla tekrar edemez 
Amaç Fonksiyonu (Maximize) 
Atanan toplam ders saati maksimize edilir 
Ek ağırlık: derslerin güne dengeli dağılımı 

7. Frontend Sayfaları 
App 
├── /               → Dashboard 
├── /settings       → Okul Ayarları 
├── /teachers       → Öğretmen Listesi & Düzenleme 
├── /classrooms     → Sınıf Listesi & Ders Atama 
├── /generate       → Program Oluşturma 
├── /timetable      → Görüntüleme & Manuel Düzenleme 
└── /export         → PDF & Excel 


8. UI/UX Prensipleri 
Dil:  Tamamen Türkçe 
Tema:  Açık, mavi-beyaz, eğitim hissi 
Responsive:  Tablet + masaüstü öncelikli 
Bildirimler:  Toast (başarı / hata / uyarı) 
Program Tablosu: 
Sınıf bazlı ↔ Öğretmen bazlı sekme geçişi 
Sürükle-bırak ile manuel düzenleme ( @dnd-kit/core ) 
Çakışan slotlar kırmızıyla vurgulanır 

9. localStorage Anahtarları 
Anahtarİçerik 
dps_settings 
Okul ayarları 
dps_teachers 
Öğretmen listesi 
dps_classrooms 
Sınıf listesi 
dps_timetable 
Oluşturulan program 
dps_version 
Şema versiyonu 

10. Export Formatları 
PDF (jsPDF) 
Sınıf bazlı: her sınıf 1 sayfa 
Öğretmen bazlı: her öğretmen 1 sayfa 
Okul adı + tarih üstte 
Excel (SheetJS) 
Her sınıf ayrı sheet 
"Tüm Program" özet sheet 
