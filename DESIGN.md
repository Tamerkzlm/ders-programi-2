# Lise Ders Programı ve Okul Planlama Sistemi — DESIGN.md
**Versiyon:** 3.0  
**Hazırlayan:** Tamer Közleme  
**Mimari:** React + Zustand Frontend (Netlify) & Python FastAPI + Google OR-Tools CP-SAT Backend (Render)

---

## 1. Proje Özeti
Okul idarecilerinin ihtiyaç duyduğu **4 temel planlama sürecini** tek bir tarayıcı tabanlı uygulamada birleştiren entegre yönetim sistemi:
1. **Haftalık Ders Programı Dağıtımı** (Python OR-Tools CP-SAT Çözücü + Canlı Düzenleme Tahtası)
2. **Okul Ortak Sınav Takvimi ve Gözetmenlik Dağıtımı** (`examEngine.js` — MEB Sabit Sınavları, Zümre Öğretmeni Bulunma Kuralı, 3 Katmanlı Dengeli Günlük Limit ve Adil Gözetmenlik Motoru)
3. **Kelebek Sistemi** (Karma Salon Sınav Yerleştirme ve Oturma Planı Motoru)
4. **DYK Planlayıcı** (Destekleme ve Yetiştirme Kursu Haftalık Planlama Modülü)

Veriler tarayıcıda `localStorage` üzerinde kalıcı olarak saklanır; haftalık ders programı optimizasyonu için Python/OR-Tools servisi çağrılır, Ortak Sınav / Kelebek / DYK algoritmaları ise istemci tarafında yüksek performanslı deterministik çözücülerle anında çalışır.

---

## 2. Sistem Mimarisi

```text
GitHub Repo (Monorepo)
├── /frontend   →  Netlify (React 19 + Vite 8 + Tailwind CSS + Zustand)
│   ├── src/pages/ModuleHub.jsx        → 4'lü Ana Modül Portalı
│   ├── src/pages/ExamPlanner.jsx      → Ortak Sınav & Gözetmenlik Sihirbazı (5 Adım)
│   ├── src/pages/KelebekPlanner.jsx   → Kelebek Karma Sınav Dağıtım Sistemi
│   ├── src/pages/DykPlanner.jsx       → DYK Kurs Planlama Modülü
│   ├── src/pages/Generate.jsx         → OR-Tools Ders Programı Üretim & Telemetri
│   ├── src/pages/TimetableBoard.jsx   → Canlı Ders Programı Tahtası
│   └── src/utils/examEngine.js        → Ortak Sınav & Gözetmenlik Çözücü Motoru
└── /backend    →  Render (Python 3.11 + FastAPI + Google OR-Tools CP-SAT)
    ├── main.py                        → FastAPI Endpoint'leri (/health, /solve)
    ├── solver.py                      → İki Aşamalı CP-SAT Çözücü Motoru
    ├── validators.py                  → Ön Kapasite ve Kısıt Doğrulayıcılar
    └── models.py                      → Pydantic Veri Şemaları
```

---

## 3. Haftalık Ders Programı Çözücü Mimarisi (`backend/solver.py`)

### 3.1 İki Aşamalı CP-SAT Yaklaşımı
1. **Aşama 1 (Feasibility & Hard Constraints):**
   - Bir öğretmenin aynı gün ve saatte birden fazla sınıfta olamaması.
   - Bir sınıfın aynı gün ve saatte birden fazla dersinin olamaması.
   - Öğretmenlerin kapalı (`unavailable`) saatlerine ders atanmaması.
   - Günlük maksimum ders saati (`maxDailyHours`) ve ders blok bütünlüğü (2+2, 2+2+1 vb.).
2. **Aşama 2 (Soft Constraints & Kalite Optimizasyonu):**
   - **Esnek Kayan Tercihler:** Öğretmenlerin "Herhangi 1 Tam Boş Gün (`any_empty_day`)" veya "Yarım Gün (`half_day`)" taleplerinin karşılanması.
   - **Boşluk (Cam) Cezası:** Öğretmenlerin ilk ve son dersi arasındaki boş saatlerin doğrusal olarak minimize edilmesi.
   - **Bilişsel Denge (STEM):** Matematik ve Fen derslerinin sabah saatlerine yönlendirilmesi.
   - **Karşılanmayan Tercih Raporlaması:** Dağıtım sonunda yalnızca boş gün veya yarım gün talep edip karşılanamayan öğretmenlerin detaylı telemetri raporunda listelenmesi.

---

## 4. Okul Ortak Sınav Takvimi ve Gözetmenlik Mimarisi (`frontend/src/utils/examEngine.js`)

### 4.1 MEB Ortak Sınav Tarihlerinin Sabitlenmesi
- MEB tarafından tarihi önceden belirlenen dersler (`isMebExam: true`, `mebDate: "YYYY-MM-DD"`, `mebSlot: number`) kademe bazlı veya tüm kademelerde ortak olarak doğrudan hedef tarih ve seansa sabitlenir (`fixedMebPlacements`).
- MEB sınavı takvim aralığı dışındaysa ilgili iş günü otomatik olarak sınav takvimine eklenir.
- MEB sınavlarında zümre öğretmeni boş gün kısıtı aranmaz.

### 4.2 Zümre Öğretmeni Okulda Bulunma Kuralı (`checkBranchAvailabilityOnDay`)
- MEB ortak sınavları haricindeki tüm okul içi sınavlarda, sınavın konulduğu günde ilgili dersin zümresinden **en az bir öğretmenin okulda bulunması** zorunludur.
- **İki Katmanlı Zümre Tespiti (`getSubjectBranchTeachers`):**
  1. `SUBJECT_BRANCH_MAP` sözlüğü ile ders adından zümre kodu (`IHL`, `MAT`, `TDEB`, `FİZ`, `KIM`, `BIO`, `TAR`, `COG`, `ING`, `ARP`, `FEL`, `GSBD`) bulunur.
  2. Sözlükte yer almayan özel dersler için `classrooms` içindeki ders atamalarından derse giren öğretmenler dinamik çekilir.
- **Günlük Bulunma Kontrolü (`isTeacherPresentOnDay`):**
  - Dağıtılmış ders programı (`timetable`) varsa öğretmenin o gün en az 1 saat dersinin olup olmadığına bakılır.
  - Ders programı henüz dağıtılmamışsa öğretmenin `unavailable[dayName]` kapalı saat sayısının günlük toplam ders saatinden (`periodsPerDay`) az olup olmadığı kontrol edilir.
  - Performans için tüm `ders × gün` kombinasyonları `buildBranchAvailabilityCache` ile `O(1)` erişimli önbelleğe alınır.

### 4.3 3 Katmanlı Dengeli Dağılım ve Kademeli Günlük Sınav Limiti (`evaluatePlacementCost`)
Sınavların ilk günlere 3'er adet yığılıp son günlerin boş kalmasını önlemek için **Best-Fit Balanced Daily Cap** algoritması uygulanır:
1. **Katmanlı Ders Sıralaması (`buildTieredCourseOrders`):**
   - **Tier 1 (Ana Dersler):** `isMajor === true` (Matematik, Edebiyat, Fizik, Kimya, Biyoloji).
   - **Tier 2 (Okul Geneli Kademeler Arası Ortak Dersler):** `!isMajor && getDistinctBaseGradesCount(course) >= 2` (Tarih, Coğrafya, İngilizce, Felsefe, Arapça, Kur'an-ı Kerim).
   - **Tier 3 (Tek Kademe / Alan Lokal Dersleri):** `!isMajor && getDistinctBaseGradesCount(course) === 1` (Hadis, Siyer, Fıkıh, Psikoloji, Seçmeli Edebiyat, Tefsir, Hitabet, Akaid, Kelam, Dinler Tarihi, Sağlık Bilgisi, Temel Dini Bilgiler).
2. **Kademeli Günlük Limit (Progressive Daily Cap):**
   - İlgili sınıfların o gün `0` sınavı varsa maliyet `0` (önce tüm günlere 1'er sınav yayılır, hiçbir gün boş kalmaz).
   - İlgili sınıfların o gün `1` sınavı varsa (2. sınav olacaksa) orta maliyet (`+450`) ve ilk 2 seans tercih edilir.
   - İlgili sınıfların o gün zaten `2` sınavı varsa (3. sınav olacaksa) yüksek ceza (`+12000`) ve 3. seans (`slotIndex >= 2`) için ek ceza (`+4500`) uygulanır. Okul geneli ortak derslerin 3. seansa girmesine ekstra ağır ceza (`+25000`) verilerek 3. sınavların yalnızca lokal derslerden oluşması garanti altına alınır.
   - **Alan Çapraz Blokaj Önleme:** `11-SAY` ve `11-EA` derslerinin aynı günde farklı seansları çapraz kapatması önlenerek paralel seanslara yerleşmesi teşvik edilir.

### 4.4 Adil Gözetmenlik Dağıtımı (`assignInvigilatorsToSchedule`)
- Her sınav şubesi (`9-A`, `9-B`, `10-A` vb.) için ilgili saatte dersi olan veya okulda uygun bulunan öğretmenler arasından görevlendirme yapılır.
- Öğretmenlerin toplam gözetmenlik yükü dengelenir ve kendi branşının sınavında gözetmen olmama (branş koruması) kuralı gözetilir.

---

## 5. Veri Saklama Anahtarları (`localStorage`)
- `dps_settings`: Okul ayarları ve günlük ders saati yapılandırması
- `dps_teachers`: Öğretmen listesi, branşlar, kapalı saatler ve esnek boş gün tercihleri
- `dps_classrooms`: Sınıf/şube listesi ve ders-öğretmen atamaları
- `dps_timetable`: Aktif haftalık ders programı
- `dps_exam_config`: Ortak sınav takvimi ayarları, dersler (`subjectsByGrade`), MEB sınav sabitlemeleri, yerleşimler (`placements`) ve gözetmen atamaları
