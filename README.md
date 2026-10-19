# 🏫 Okul Yönetim ve Planlama Platformu (Ders Programı • Ortak Sınav • Kelebek • DYK)

Okul idarecileri ve müdür yardımcıları için geliştirilmiş; **Haftalık Ders Programı Dağıtımı (OR-Tools CP-SAT)**, **Okul Ortak Sınav Takvimi ve Gözetmenlik Planlama**, **Kelebek Karma Salon Sınav Sistemi** ve **DYK (Destekleme ve Yetiştirme Kursu) Planlama** süreçlerini tek çatı altında toplayan modern web platformu.

---

## 🌟 Ana Modüller (4'lü Modül Merkezi)

### 1. 📅 Haftalık Ders Programı Modülü (`/dashboard`, `/generate`, `/timetable`)
- **Google OR-Tools (CP-SAT) İki Aşamalı Çözücü:**
  - Zorunlu kurallar (sınıf/öğretmen çakışmaması, öğretmen kapalı saatleri, günlük maksimum ders saati, blok ders bütünlüğü) ve yumuşak kısıtlar (cam/boşluk minimizasyonu, günlük yük dengesi, STEM derslerinin sabah saatlerine önceliklendirilmesi) ile saniyeler içinde %100 geçerli ders programı üretir.
- **Esnek Kayan Tercihler & Kapasite Isı Haritası:**
  - Öğretmenler için "Herhangi 1 Tam Boş Gün" veya "Yarım Gün" esnek tercihleri tanımlanabilir.
  - Haftalık Okul Kapasite Isı Haritası (`CapacityHeatmap`) ile darboğaz oluşturan gün/saat dilimleri dağıtım öncesinde görselleştirilir.
  - Dağıtım sonunda yalnızca boş gün veya yarım gün talep edip karşılanamayan öğretmenler detaylı telemetri raporunda listelenir.
- **Canlı Sürükle-Bırak Tahtası & Mobil Öğretmen Görünümü (`/mobile`):**
  - Sınıf ve öğretmen bazlı interaktif ders programı tahtası, PDF/Excel resmi çıktı şablonları ve öğretmenler için tam ekran mobil portal.

---

### 2. 🎓 Okul Ortak Sınav Takvimi ve Gözetmenlik Modülü (`/exams`)
- **MEB Ortak Sınav Tarihlerini Sabitleme (`🏛️ MEB`):**
  - MEB tarafından ülke/il genelinde tarihi ve seansı önceden belirlenen dersler (`isMebExam`, `mebDate`, `mebSlot`) tek kademe veya "Tüm Kademelere Uygula" seçeneği ile doğrudan ilgili tarih ve seansa sabitlenir.
- **Zümre Öğretmeni Okulda Bulunma Zorunluluğu:**
  - MEB ortak sınavları haricindeki tüm okul içi sınavlar yerleştirilirken, sınavın konulduğu günde ilgili dersin zümresinden (`SUBJECT_BRANCH_MAP` + dinamik sınıf-ders atamaları) **en az bir öğretmenin okulda nöbetçi/derste bulunması** (tüm zümre öğretmenlerinin aynı anda boş günü olmaması) zorunlu tutulur.
  - Ders kartlarında ilgili zümrede kaç öğretmen olduğu ve hangi günlerde zümrenin tamamen kapalı olduğu (`⛔ [Gün] zümre kapalı`) canlı rozetlerle gösterilir.
- **3 Katmanlı Dengeli Dağılım ve Kademeli Günlük Sınav Limiti (Best-Fit Balanced Daily Cap):**
  - Sınavlar ilk günlere yığılmaz; seçilen tüm sınav günlerine homojen olarak dağıtılır (hiçbir gün boş bırakılmaz).
  - **Ders Öncelik Hiyerarşisi:**
    1. **Katman 1 — Ana Dersler (`isMajor`):** Matematik, Türk Dili ve Edebiyatı, Fizik, Kimya, Biyoloji (öncelikli olarak 1. seanslara ve farklı günlere yayılır).
    2. **Katman 2 — Kademeler Arası Okul Geneli Ortak Dersler:** Tarih, Coğrafya, İngilizce, Felsefe, Arapça, Kur'an-ı Kerim vb. (1. ve 2. seanslara dengeli dağıtılır, 11-SAY / 11-EA alan çapraz blokajı önlenir).
    3. **Katman 3 — Tek Kademe / Alan Lokal Dersleri:** Sadece tek bir sınıf kademesinde veya alanda okutulan dersler (Örn: *Hadis, Siyer, Fıkıh, Psikoloji, Seçmeli Edebiyat, Tefsir, Hitabet, Akaid, Kelam, Dinler Tarihi, Sağlık Bilgisi*).
  - **Kademeli Günlük Limit (1 ➔ 2 ➔ Mecbur Kalınırsa 3 Sınav):**
    - Kullanıcı günde 3 sınav seansı seçmiş olsa bile algoritma önce tüm günlere 1'er sınav, ardından 2'şer sınav yerleştirir.
    - Günde 2 sınav ile kapasite yetiyorsa **asla 3. sınava çıkmaz**. Kapasitenin aşıldığı sıkışık takvimlerde ise 3. seansa yalnızca en sona kalan **lokal dersler** yerleştirilir.
- **Adil Gözetmenlik Dağıtım Motoru:**
  - Her sınav şubesine/salonuna kendi dersine giren öğretmen veya ders programı uygun öğretmenler arasından adil görev sayısı (`min-max` farkı en fazla 1 olacak şekilde) ve branş koruması gözetilerek otomatik gözetmen atanır.

---

### 3. 🦋 Kelebek Sistemi — Karma Salon Sınav Dağıtımı (`/kelebek`)
- Öğrencileri sınıf seviyelerine ve salon kapasitelerine göre farklı sınav salonlarına yan yana aynı kademeden öğrenci gelmeyecek şekilde karma yerleştirir.
- Salon oturma planları, yoklama listeleri, sınıf kapı listeleri ve gözetmen görev kağıtlarını PDF olarak üretir.

---

### 4. 🎯 DYK — Destekleme ve Yetiştirme Kursu Modülü (`/dyk`)
- Hafta sonu ve hafta içi DYK kurs gruplarını, öğretmen tercihlerini ve derslik/saat planlamasını çakışmasız şekilde oluşturur ve resmi tablo çıktısı verir.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS | Hızlı, bileşen tabanlı, kod bölünmüş (Code-Split) SPA |
| **State Yönetimi** | Zustand + `localStorage` | Kalıcı yerel durum yönetimi (`dps_*` anahtarları) |
| **İkonlar & UI** | Lucide React | Modern eğitim ve yönetim arayüzü |
| **Backend API** | Python 3.11 + FastAPI | Yüksek performanslı REST API (`/health`, `/solve`) |
| **Çözücü Motor** | Google OR-Tools (`9.15+` CP-SAT) | Kısıt programlama tabanlı ders programı optimizasyonu |

---

## 🚀 Kurulum ve Çalıştırma

### 1. Backend (FastAPI + OR-Tools)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresini açarak uygulamayı kullanabilirsiniz. Üretim derlemesi için `npm run build` komutunu çalıştırabilirsiniz.
