# Değişiklikler (Changelog)

## Son Güncellemeler (v3.0 — Ortak Sınav Motoru & Dağıtım İyileştirmeleri)

### 🎓 Okul Ortak Sınav Takvimi Modülü (`examEngine.js`, `ExamPlanner.jsx`, `appStore.js`)
- **MEB Ortak Sınav Tarihleri Sabitleme:**
  - MEB tarafından tarihi önceden belirlenen dersler için `isMebExam`, `mebDate` ve `mebSlot` desteği eklendi.
  - 2. Adım ("Okuldaki Dersler") ekranına her ders için `🏛️ MEB` butonu, tarih/seans seçici ve tek tıkla "Tüm Kademelere Uygula" özelliği eklendi.
  - 3. Adım ("Sınav Takvimi") ekranında sabitlenen derslere `🏛️ MEB` rozeti ve sürükle-bırak koruma uyarısı eklendi.
- **Zümre Öğretmeni Okulda Bulunma Zorunluluğu:**
  - MEB ortak sınavları haricindeki tüm derslerin sınavı yerleştirilirken, sınav gününde ilgili zümreden (`SUBJECT_BRANCH_MAP` + dinamik sınıf-ders atamaları) en az bir öğretmenin okulda bulunması (`checkBranchAvailabilityOnDay`) zorunlu hale getirildi.
  - Ders kartlarında zümre öğretmen sayısı ve zümrenin tamamen kapalı olduğu günler (`⛔ [Gün] zümre kapalı`) canlı olarak gösterildi.
  - Sürükle-bırak (`handleDrop`) sırasında hedef günde ilgili zümreden hiçbir öğretmen okulda değilse kullanıcıya uyarı verilmesi sağlandı.
- **Dengeli Dağılım ve Kademeli Günlük Sınav Limiti (Best-Fit Balanced Daily Cap):**
  - Sınavların ilk günlere 3'er adet yığılıp son günlerin boş kalmasına yol açan First-Fit yaklaşımı yerine `evaluatePlacementCost` ve `evaluateScheduleQuality` tabanlı Best-Fit dengeleme algoritmasına geçildi.
  - Dersler **Ana Dersler (Tier 1)** ➔ **Kademeler Arası Okul Geneli Ortak Dersler (Tier 2)** ➔ **Tek Kademe / Alan Lokal Dersleri (Tier 3)** hiyerarşisiyle sıralandı (`buildTieredCourseOrders`).
  - Günde 3 seans seçili olsa bile önce tüm günlere 1'er sınav, ardından 2'şer sınav yayılması; yalnızca kapasite aşıldığında (mecbur kalındığında) 3. sınava çıkılması ve 3. sınavların okul geneli ortak dersler yerine lokal derslerden (*Hadis, Siyer, Fıkıh, Psikoloji, Seçmeli Edebiyat, Tefsir, Hitabet, Kelam* vb.) oluşması sağlandı.
  - `11-SAY` ve `11-EA` alanlarının farklı seanslarda birbirini çapraz bloke etmesini önleyen `Sibling Track Alignment` kuralı eklendi.

### 📅 Haftalık Ders Programı & Çözücü (`solver.py`, `Generate.jsx`, `Teachers.jsx`, `AvailabilityGrid.jsx`)
- **Esnek Kayan Tercihler & Kapasite Isı Haritası:**
  - Öğretmenler için esnek boş gün / yarım gün tercihleri ve haftalık okul kapasite ısı haritası eklendi.
  - Dağıtım sonuçlarında ve nihai raporda yalnızca boş gün veya yarım gün talep edip karşılanmayan öğretmenlerin listelenmesi sağlandı.

---

## Önceki Güncellemeler (v2.0)

### Backend
- `solver.py`: İki aşamalı CP-SAT mimarisi ile yeniden yazıldı: (1) zorunlu kurallarla hızlı geçerli program, (2) boşluk/denge/asgari saat kuralları ağır cezalı yumuşak kural olarak iyileştirilir; kalan ihlaller sonuçta listelenir.
- `validators.py`: Günlük üst sınır + kapalı saatler dikkate alınarak öğretmen kapasite kontrolü eklendi.
- `models.py`: `HardConstraints`'e `maxDailyHours` eklendi.
- `requirements.txt`: `ortools` `9.15.6755` sürümüne yükseltildi.

### Frontend
- `appStore.js`: API adresi `VITE_API_URL`'den okunur; öğretmen/sınıf ID üretimi iyileştirildi.
- Kullanılmayan ölü dosyalar ve bağımlılıklar temizlendi.
