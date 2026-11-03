import * as XLSX from 'xlsx';

// Türkçe başlık formatına çevir: "ŞEYDA NUR" → "Şeyda Nur"
export function toTitleCaseTR(str) {
  if (!str) return '';
  const lower = String(str)
    .replace(/İ/g, 'i_dot')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/i_dot/g, 'i');
  return lower.replace(/(^|\s|\/|-)\S/g, ch => ch.toUpperCase());
}

// Sınıf düzeyini tespit et: "9A" → "9", "12-C" → "12", "HAZ-A" → "haz"
export function gradeFromSinif(sinif) {
  if (!sinif) return '9';
  const s = String(sinif).trim().toUpperCase();
  if (s.startsWith('HAZ')) return 'haz';
  const m = s.match(/^(\d+)/);
  if (m) return m[1];
  return '9';
}

// Başlık satırından sınıf/şube çöz:
// "9. Sınıf / A Şubesi", "10/B Şubesi", "11-A", "Hazırlık Sınıfı / A Şubesi"
function parseSinifFromText(text) {
  if (!text) return null;
  const str = String(text).trim();

  // "9. Sınıf / A Şubesi" veya "9. Sınıf / A"
  const m1 = str.match(/(\d+)\.\s*S[ıi]n[ıi]f\s*[\/\-]?\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*(?:[Şş]ubesi)?/i);
  if (m1) return { sinif: m1[1] + m1[2].toUpperCase(), grade: m1[1] };

  // "Hazırlık Sınıfı / A Şubesi"
  const m2 = str.match(/Haz[ıi]rl[ıi]k\s*(?:S[ıi]n[ıi]f[ıi])?\s*[\/\-]?\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*(?:[Şş]ubesi)?/i);
  if (m2) return { sinif: 'HAZ' + m2[1].toUpperCase(), grade: 'haz' };

  // "9/A", "10-B", "12C"
  const m3 = str.match(/^(\d{1,2})\s*[\/\-]?\s*([A-Za-zÇĞİÖŞÜçğıöşü]{1,2})$/i);
  if (m3) return { sinif: m3[1] + m3[2].toUpperCase(), grade: m3[1] };

  return null;
}

// e-Okul veya Standart Excel dosyasını parse et
export function parseEOkulXLS(file: File): Promise<{ students: any[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const resultBuffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(resultBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: true });

        if (!rows || rows.length === 0) {
          reject(new Error('Yüklenen Excel sayfası boş.'));
          return;
        }

        const students = [];
        const errors = [];

        // 1. Önce e-Okul Rapor formatını dene (şube başlıkları satır satır ayrılmış)
        let currentSinif = null;
        let currentGrade = null;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];

          // Şube başlığını herhangi bir hücrede ara
          let foundBranch = null;
          for (const cell of row) {
            const cellStr = String(cell || '');
            for (const line of cellStr.split('\n')) {
              const parsed = parseSinifFromText(line);
              if (parsed) {
                foundBranch = parsed;
                break;
              }
            }
            if (foundBranch) break;
          }

          if (foundBranch) {
            currentSinif = foundBranch.sinif;
            currentGrade = foundBranch.grade;
            continue;
          }

          // Öğrenci satırı kontrolü:
          const sno = row[0];
          const ono = row[1];

          if (
            currentSinif &&
            ((typeof sno === 'number' && Number.isInteger(sno) && sno > 0) ||
             (typeof sno === 'string' && /^\d+$/.test(sno.trim()) && parseInt(sno.trim()) > 0))
          ) {
            let ad = String(row[3] || '').trim();
            let soyad = String(row[7] || '').trim();

            if (!ad && !soyad) {
              const textCells = row.slice(2).filter(c => typeof c === 'string' && c.trim().length > 1);
              if (textCells.length >= 2) {
                ad = textCells[0].trim();
                soyad = textCells[textCells.length - 1].trim();
              } else if (textCells.length === 1) {
                ad = textCells[0].trim();
              }
            }

            if (ad || soyad) {
              const adSoyad = toTitleCaseTR((ad + ' ' + soyad).trim());
              const noVal = String(ono ? (Math.round(Number(ono)) || ono) : sno).trim();
              students.push({
                id: `std-${Date.now()}-${students.length}-${Math.random().toString(36).substr(2, 4)}`,
                no: noVal,
                adSoyad,
                sinif: currentSinif,
                grade: currentGrade,
                isExempt: false,
              });
            }
          }
        }

        // 2. Standart Tablo Formatını dene
        if (students.length === 0) {
          let colIdxNo = -1;
          let colIdxName = -1;
          let colIdxClass = -1;
          let headerRowIdx = -1;

          for (let r = 0; r < Math.min(rows.length, 15); r++) {
            const row = rows[r];
            row.forEach((cell, ci) => {
              const val = String(cell || '').toLowerCase().trim();
              if (val.includes('no') || val.includes('numara')) colIdxNo = ci;
              if (val.includes('ad') || val.includes('isim') || val.includes('öğrenci')) colIdxName = ci;
              if (val.includes('sınıf') || val.includes('şube') || val.includes('sinif') || val.includes('sube')) colIdxClass = ci;
            });

            if (colIdxName !== -1 && colIdxClass !== -1) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            for (let r = headerRowIdx + 1; r < rows.length; r++) {
              const row = rows[r];
              const nameVal = String(row[colIdxName] || '').trim();
              const classVal = String(row[colIdxClass] || '').trim().toUpperCase();
              const noVal = colIdxNo !== -1 ? String(row[colIdxNo] || '').trim() : String(r - headerRowIdx);

              if (nameVal && classVal) {
                const parsedClass = parseSinifFromText(classVal);
                const sinifStr = parsedClass ? parsedClass.sinif : classVal.replace(/\s+/g, '');
                const gradeStr = parsedClass ? parsedClass.grade : gradeFromSinif(sinifStr);

                students.push({
                  id: `std-${Date.now()}-${students.length}-${Math.random().toString(36).substr(2, 4)}`,
                  no: noVal || String(students.length + 1),
                  adSoyad: toTitleCaseTR(nameVal),
                  sinif: sinifStr,
                  grade: gradeStr,
                  isExempt: false,
                });
              }
            }
          }
        }

        if (students.length === 0) {
          reject(new Error(
            'Dosyada geçerli öğrenci listesi bulunamadı. Lütfen e-Okul "Şube Listesi" raporunu veya ' +
            'içinde "No", "Ad Soyad", "Sınıf" sütunları olan bir Excel tablosu yükleyin.'
          ));
          return;
        }

        resolve({ students, errors });
      } catch (err) {
        reject(new Error('Excel dosyası okunamadı: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Dosya okuma sırasında hata oluştu.'));
    reader.readAsArrayBuffer(file);
  });
}

// Boş Örnek Excel Şablonu İndir
export function downloadStudentTemplate() {
  const templateData = [
    { 'No': '101', 'Ad Soyad': 'Ahmet Yılmaz', 'Sınıf': '9A' },
    { 'No': '102', 'Ad Soyad': 'Ayşe Demir', 'Sınıf': '9A' },
    { 'No': '201', 'Ad Soyad': 'Mehmet Kaya', 'Sınıf': '10A' },
    { 'No': '202', 'Ad Soyad': 'Fatma Çelik', 'Sınıf': '10A' },
    { 'No': '301', 'Ad Soyad': 'Ali Öztürk', 'Sınıf': '11A' },
    { 'No': '302', 'Ad Soyad': 'Zeynep Şahin', 'Sınıf': '11A' },
    { 'No': '401', 'Ad Soyad': 'Burak Aydın', 'Sınıf': '12A' },
    { 'No': '402', 'Ad Soyad': 'Elif Yıldız', 'Sınıf': '12A' },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Öğrenciler');
  XLSX.writeFile(wb, 'Kelebek_Ogrenci_Sablonu.xlsx');
}

// Sınav Oturma Planını Excel (.xlsx) olarak indir
export function exportPlanToExcel(plan, examInfo) {
  if (!plan || !plan.assignments) return;

  const wb = XLSX.utils.book_new();

  // 1. Özet & Genel Liste Sayfası
  const summaryRows = [
    ['KELEBEK SINAV SİSTEMİ — GENEL ÖĞRENCİ YERLEŞİM LİSTESİ'],
    ['Okul Adı:', examInfo.okulAdi || ''],
    ['Sınav Dersi:', examInfo.sinavDersi || ''],
    ['Sınav Tarihi:', examInfo.sinavTarihi || '', 'Sınav Saati:', examInfo.sinavSaati || ''],
    [''],
    ['Öğrenci No', 'Adı Soyadı', 'Kendi Sınıfı', 'Sınav Salonu', 'Koltuk No'],
  ];

  const allAssignedStudents = [];
  plan.assignments.forEach(assignment => {
    const { room, grid } = assignment;
    grid.forEach(row => {
      row.forEach(s => {
        if (s) {
          allAssignedStudents.push({
            no: s.no,
            adSoyad: s.adSoyad,
            sinif: s.sinif,
            salon: room.name,
            koltuk: s.koltuk,
          });
        }
      });
    });
  });

  allAssignedStudents.sort((a, b) => a.sinif.localeCompare(b.sinif, 'tr') || a.adSoyad.localeCompare(b.adSoyad, 'tr'));

  allAssignedStudents.forEach(s => {
    summaryRows.push([s.no, s.adSoyad, s.sinif.toUpperCase(), s.salon, s.koltuk]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Genel Liste');

  // 2. Her Salon İçin Ayrı Oturma Planı ve Yoklama Sayfası
  plan.assignments.forEach(assignment => {
    const { room, grid } = assignment;
    const roomSheetRows = [
      [`SALON: ${room.name} — OTURMA DÜZENİ VE İMZA LİSTESİ`],
      ['Ders:', examInfo.sinavDersi || '', 'Tarih:', examInfo.sinavTarihi || ''],
      ['Kapasite:', `${room.rows} Sıra × ${room.cols} Bank (${room.rows * room.cols * 2} Kişi)`],
      [''],
      ['Koltuk', 'Öğrenci No', 'Adı Soyadı', 'Sınıfı', 'İmza'],
    ];

    const roomStudents = [];
    grid.forEach(row => {
      row.forEach(s => {
        if (s) roomStudents.push(s);
      });
    });

    roomStudents.sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr'));
    roomStudents.forEach(s => {
      roomSheetRows.push([s.koltuk, s.no, s.adSoyad, (s.sinif || '').toUpperCase(), '']);
    });

    const sheetTitle = room.name.substring(0, 31).replace(/[\/\\?*:[\]]/g, '_');
    const wsRoom = XLSX.utils.aoa_to_sheet(roomSheetRows);
    XLSX.utils.book_append_sheet(wb, wsRoom, sheetTitle);
  });

  const fileName = `${(examInfo.sinavDersi || 'Sinav').replace(/\s+/g, '_')}_Kelebek_Plani.xlsx`;
  XLSX.writeFile(wb, fileName);
}
