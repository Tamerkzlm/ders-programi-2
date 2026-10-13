# Değişiklikler

## Backend
- solver.py: yeniden yazıldı. İki aşamalı: (1) zorunlu kurallarla hızlı geçerli program, (2) boşluk/denge/asgari saat
  kuralları ağır cezalı yumuşak kural olarak iyileştirilir; kalan ihlaller sonuçta listelenir.
  Boşluk hesabı doğrusal (first/last + çarpma kaldırıldı). "Süre doldu" ile "imkânsız" artık ayrı raporlanır.
  Fen/Matematik (STEM) algısı kısa ders kodlarını (MAT, FIZK, KIM9, BİY) ve Türkçe harfleri tanır.
- validators.py: günlük üst sınır + kapalı saatler dikkate alınarak öğretmen kapasite kontrolü eklendi.
- models.py: HardConstraints'e maxDailyHours eklendi.
- requirements.txt: ortools 9.8.3296 -> 9.15.6755 (aynı veride temel çözüm 20 sn -> 2 sn); kullanılmayan pydantic-settings kaldırıldı.

## Frontend
- appStore.js: API adresi artık VITE_API_URL'den okunur (boşsa http://127.0.0.1:8000); öğretmen/sınıf eklerken
  silme sonrası çakışabilen ID üretimi düzeltildi; hiç çağrılmayan loadSampleData kaldırıldı.
- Silinen ölü dosyalar: pages/Timetable.jsx, components/timetable/*, utils/sampleData.js, utils/timeUtils.js,
  App.css, assets/*, public/icons.svg
- Kullanılmayan bağımlılıklar kaldırıldı: @dnd-kit/*, framer-motion, jspdf, jspdf-autotable, react-hot-toast, xlsx
- Kullanılmayan import/değişkenler temizlendi.

## Silmeyi önerdiğim (pakete dahil etmediğim) dosyalar
hz, frontend/frontend@0.0.0, frontend/vite, tum_kodlar.txt, proje_kodlari.txt, proje_kodlari_yeni.txt (19 MB kod dökümü)
