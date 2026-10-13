---
name: mini-arena
description: Verilen bir kodlama veya mimari görevini iki farklı stratejiye sahip alt ajana (minimalist vs. savunmacı) çözdürür, çözümleri kıyaslar ve en iyisini seçer. "/arena" dendiğinde veya "bunu yarıştır" istendiğinde çalıştır.
---

# Mini Arena Orkestrasyonu

Kullanıcı bir görev verdiğinde ana oturum dosyaları doğrudan değiştirmeyecek, aşağıdaki adımları sırayla işletecektir:

### 1. Hazırlık
- Kullanıcının görevini ve varsa ilgili dosya içeriklerini net bir görev özeti (`TASK_BRIEF`) haline getir.

### 2. Alt Ajanları Paralel Başlat (`invoke_subagent`)
Aynı görevi iki farklı bakış açısıyla çözen iki izole alt ajan tetikle:

- **Ajan A (KISS / Minimalist Strateji):**
  - **Rol:** "Sen sadelik odaklı bir kıdemli mühendissin."
  - **Kural:** Aşırı mühendislikten (over-engineering) kaçın, en az kod satırıyla, doğrudan ve okunabilir bir çözüm üret.
  - **Yetki:** Salt-okunur (sadece çözüm metnini üret, dosyaları kaydetme).

- **Ajan B (Defensive / Kapsamlı Strateji):**
  - **Rol:** "Sen güvenlik ve sınır durumlar (edge-cases) odaklı bir sistem mimarısın."
  - **Kural:** Olası tüm girdi hatalarını, bellek/performans darboğazlarını ve köşe durumları hesaba katan savunmacı bir çözüm üret.
  - **Yetki:** Salt-okunur (sadece çözüm metnini üret, dosyaları kaydetme).

### 3. Hakem Değerlendirmesi
İki alt ajandan gelen çözümleri al ve şu rubriğe göre kıyasla:
- **Doğruluk ve Eksiksizlik (40 Puan):** Görev tanımına tam uyum.
- **Bakım Kolaylığı (30 Puan):** Kodun sadeliği ve sürdürülebilirliği.
- **Dayanıklılık (30 Puan):** Hata yönetimi ve uç durum koruması.

### 4. Çıktıyı Kullanıcıya Sun
Kullanıcıya şu formatta rapor ver:
1. **Kazanan Çözüm** (ve gerekçesi).
2. **Elenen Çözümün Eksik/Zayıf Yönleri**.
3. Kazanan kodun tam hali ve uygulama onayı sorusu.
