# Değişiklikler (Changelog)

## Son Güncellemeler (v3.0 — Ortak Sınav Motoru & Dağıtım İyileştirmeleri)

### 🎓 Okul Ortak Sınav Takvimi Modülü (`examEngine.js`, `ExamPlanner.jsx`, `appStore.js`)
- **12. Sınıflar Sayısal (12-SAY) ve Eşit Ağırlık (12-EA) Ön Tanımlı Kademe Desteği & Kademe Yönetimi:**
  - Ortak sınav programında 12. sınıflar, 11. sınıflarda olduğu gibi `12-SAY` (Sayısal: Fizik, Kimya, Biyoloji, Matematik, Edebiyat vb.) ve `12-EA` (Eşit Ağırlık: Coğrafya, Seçmeli Edebiyat, Çağdaş Türk ve Dünya Tarihi, Matematik vb.) olmak üzere iki bağımsız alan kademesi olarak ön tanımlı hale getirildi.
  - Okul ders programından otomatik ders aktarımı (`handleAutoImportFromTimetable`) ve şube eşleştirme (`getGradeSections`) fonksiyonları 12A/12B (SAY) ve 12C/12D/12E (EA) sınıflarını ders ve isim bazlı otomatik tespit edecek şekilde zenginleştirildi.
  - Sınav motoru `examEngine.js` içinde `12-SAY` ve `12-EA` için Sibling Track Alignment (aynı seansta paralel sınav yerleşimi ve çapraz blokaj önleme) kuralı devreye alındı.
  - Kullanıcıların istemediği kademeleri (örn: YKS denemeleri nedeniyle 12. sınıfları ortak sınavdan muaf tutmak istediklerinde) tek tıkla takvimden çıkarabilmesi (`handleRemoveGrade`), çıkarılan kademelerin listelenmesi ve istendiğinde tek tıkla yeniden programa dahil edilebilmesi (`allCandidateGrades`) sağlandı.
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
