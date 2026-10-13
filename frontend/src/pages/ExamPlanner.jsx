// frontend/src/pages/ExamPlanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarDays, 
  Clock, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Sliders, 
  BookOpen, 
  LayoutGrid, 
  Check, 
  Info,
  Calendar,
  Download,
  RefreshCw,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getWorkingDaysBetween, DEFAULT_EXAM_SUBJECTS } from '../utils/examEngine';
import { getCourseColorClass } from '../utils/courseColors';

// MEB Ortaöğretim yaygın ders kısaltmaları ve tam isim haritası
const SUBJECT_FULL_NAMES = {
  'EDEBİY': 'Türk Dili ve Edebiyatı',
  'TDEB': 'Türk Dili ve Edebiyatı',
  'STEDB': 'Seçmeli Türk Dili ve Edebiyatı',
  'MAT': 'Matematik',
  'MAT10': 'Matematik',
  'MAT4': 'Matematik',
  'T.MAT2': 'Temel Matematik',
  'FIZK': 'Fizik',
  'FİZİK': 'Fizik',
  'KİM': 'Kimya',
  'KİMYA': 'Kimya',
  'KMYA': 'Kimya',
  'KIM9': 'Kimya',
  'BİY': 'Biyoloji',
  'BİYO': 'Biyoloji',
  'TARİH': 'Tarih',
  'TAR': 'Tarih',
  'COG': 'Coğrafya',
  'COGH2': 'Coğrafya',
  'COĞRFY': 'Coğrafya',
  'COGRFY': 'Coğrafya',
  'FELH1': 'Felsefe',
  '11FEL': 'Felsefe',
  'FEL': 'Felsefe',
  'PSKO': 'Psikoloji',
  'O.TUR2': 'Osmanlı Türkçesi',
  'O.TÜR2': 'Osmanlı Türkçesi',
  'ING': 'İngilizce',
  '9ING': 'İngilizce',
  'ING1': 'İngilizce',
  'ARP9': 'Arapça',
  'ARP10': 'Arapça',
  'MARP11': 'Mesleki Arapça',
  'KKRİM': "Kur'an-ı Kerim",
  'KKER': "Kur'an-ı Kerim",
  'KKER11': "Kur'an-ı Kerim",
  'KURAN': "Kur'an-ı Kerim",
  'SİYER': 'Siyer',
  'HADİS': 'Hadis',
  'FIKIH': 'Fıkıh',
  'TEFSIR': 'Tefsir',
  'TEFSİR': 'Tefsir',
  'AKAID': 'Akaid',
  'HITAB': 'Hitabet ve Mesleki Uygulama',
  'KELAM': 'Kelam',
  'IKMED': 'İslam Kültür ve Medeniyeti',
  'DINT': 'Dinler Tarihi',
  'INKILA': 'T.C. İnkılap Tarihi ve Atatürkçülük',
  'CTDT2': 'Çağdaş Türk ve Dünya Tarihi',
  'TDB': 'Temel Dini Bilgiler',
  '9SAG': 'Sağlık Bilgisi ve Trafik Kültürü',
  'A.MUA2': 'Adab-ı Muaşeret',
  'PROJE': 'Proje Tasarımı ve Uygulamaları',
  'GIRIŞ1': 'Girişimcilik',
  'GS1': 'Görsel Sanatlar',
  'MZK': 'Müzik',
  'BED': 'Beden Eğitimi',
  'FENT': 'Fen Bilimleri Tarihi ve Uygulamaları',
  'AUB1': 'Astronomi ve Uzay Bilimleri'
};

export default function ExamPlanner() {
  const navigate = useNavigate();
  const {
    settings,
    classrooms,
    examSettings,
    examSubjectsByGrade,
    examSchedule,
    examResult,
    updateExamSettings,
    setExamSubjectsByGrade,
    toggleExamSubjectMajor,
    addExamSubject,
    deleteExamSubject,
    generateExamSchedule,
    clearExamSchedule
  } = useAppStore();

  // 3 Dikey Menü Sekmesi: 'settings' | 'subjects' | 'distribution'
  const [activeMenu, setActiveMenu] = useState(examSchedule ? 'distribution' : 'settings');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'single'
  const [toastMessage, setToastMessage] = useState('');

  // 2. Menü: Yeni ders ekleme formu
  const [newSubGrade, setNewSubGrade] = useState('9');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubIsMajor, setNewSubIsMajor] = useState(false);

  // Kademeler ve 11. Sınıf Sayısal / Eşit Ağırlık Desteği
  const ALL_POSSIBLE_GRADES = ["9", "10", "11-SAY", "11-EA", "12"];
  const grades = examSettings?.grades || ALL_POSSIBLE_GRADES;
  const examSlots = examSettings?.examSlots || [3, 5];
  const workingDays = getWorkingDaysBetween(examSettings?.startDate || "2025-11-03", examSettings?.endDate || "2025-11-14");

  // 11. Sınıf Otomatik Geçiş ve Senkronizasyon (Varsa eski "11"i 11-SAY ve 11-EA'ya yükselt)
  useEffect(() => {
    const currentGrades = examSettings?.grades || [];
    let updatedGrades = [...currentGrades];
    let needsUpdate = false;

    if (currentGrades.includes("11") && !currentGrades.includes("11-SAY")) {
      updatedGrades = currentGrades.flatMap(g => g === "11" ? ["11-SAY", "11-EA"] : [g]);
      needsUpdate = true;
    }

    if (needsUpdate) {
      updateExamSettings({ grades: updatedGrades });
    }

    // 11-SAY ve 11-EA ders havuzunu hazırla
    if (!examSubjectsByGrade?.["11-SAY"] || !examSubjectsByGrade?.["11-EA"]) {
      setExamSubjectsByGrade({
        ...examSubjectsByGrade,
        "11-SAY": examSubjectsByGrade?.["11-SAY"] || DEFAULT_EXAM_SUBJECTS["11-SAY"],
        "11-EA": examSubjectsByGrade?.["11-EA"] || DEFAULT_EXAM_SUBJECTS["11-EA"]
      });
    }
  }, []);

  // Kademe İsimlendirme Yardımcıları
  const getGradeTitle = (g) => {
    if (g === '11-SAY') return '11. Sınıf (Sayısal)';
    if (g === '11-EA') return '11. Sınıf (Eşit Ağırlık)';
    return `${g}. Sınıf`;
  };

  const getGradeShort = (g) => {
    if (g === '11-SAY') return '11-SAY';
    if (g === '11-EA') return '11-EA';
    return `${g}. Sınıf`;
  };

  const getGradeBadge = (g) => {
    if (g === '11-SAY') return '🔬 Sayısal';
    if (g === '11-EA') return '⚖️ Eşit Ağırlık';
    return null;
  };

  const getGradeMajorDescription = (g) => {
    if (g === '11-SAY') return 'Ana Dersler: Matematik, Fizik, Kimya, Biyoloji, Edebiyat';
    if (g === '11-EA') return 'Ana Dersler: Matematik, Edebiyat, Tarih, Coğrafya';
    return 'Ana Dersler: Günde en fazla 1 adet ve 1. seansta';
  };

  // Toplam tanımlı ders sayısı
  const totalExamSubjects = Object.values(examSubjectsByGrade || {}).reduce(
    (acc, list) => acc + (list?.length || 0), 
    0
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Sıfırlama Eylemi
  const handleClearSchedule = () => {
    clearExamSchedule();
    showToast('Sınav takvimi dağıtımı başarıyla sıfırlandı.');
  };

  // 1. Menü: Kademe seçimi toggle
  const handleToggleGrade = (gradeToToggle) => {
    let updated;
    if (grades.includes(gradeToToggle)) {
      if (grades.length === 1) return;
      updated = grades.filter(g => g !== gradeToToggle);
    } else {
      updated = [...grades, gradeToToggle].sort((a, b) => {
        const order = { "9": 1, "10": 2, "11-SAY": 3, "11-EA": 4, "11": 5, "12": 6 };
        return (order[a] || 99) - (order[b] || 99);
      });
    }
    updateExamSettings({ grades: updated });
    if (!updated.includes(selectedGrade)) {
      setSelectedGrade(updated[0] || '9');
    }
  };

  // 1. Menü: Seans saati toggle
  const handleToggleSlot = (slotNumber) => {
    const current = [...examSlots];
    let updated;
    if (current.includes(slotNumber)) {
      if (current.length === 1) return;
      updated = current.filter(s => s !== slotNumber);
    } else {
      updated = [...current, slotNumber].sort((a, b) => a - b);
    }
    updateExamSettings({ examSlots: updated });
  };

  // 2. Menü: Ders programı modülünden otomatik çekme (11-SAY ve 11-EA ayrımıyla)
  const handleAutoImportFromTimetable = () => {
    if (!classrooms || classrooms.length === 0) {
      showToast('Ders programında tanımlı sınıf veya ders bulunamadı.');
      return;
    }

    const byGrade = {};
    const detectedGradesSet = new Set();

    classrooms.forEach(c => {
      const match = (c.name || '').match(/^(\d+)/);
      if (!match) return;
      const baseGrade = match[1];

      // 11. Sınıflarda Sayısal ve Eşit Ağırlık Ayrımı:
      let targetGrade = baseGrade;
      if (baseGrade === '11') {
        const courseUpper = (c.courses || []).map(co => (co.subject || '').toUpperCase());
        const isSay = courseUpper.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('KMY') || s.includes('BİY'));
        targetGrade = isSay ? '11-SAY' : '11-EA';
      }

      detectedGradesSet.add(targetGrade);
      if (!byGrade[targetGrade]) byGrade[targetGrade] = new Map();

      (c.courses || []).forEach(co => {
        const code = (co.subject || '').trim();
        if (!code) return;
        const upper = code.toUpperCase();
        if (['REH', 'REHB', 'REHBERLİK', 'ETÜT', 'SOS', 'KULÜP', 'KULUP'].includes(upper)) return;

        if (!byGrade[targetGrade].has(code)) {
          const fullName = SUBJECT_FULL_NAMES[code] || SUBJECT_FULL_NAMES[upper] || code;
          
          // Ana Ders Tespiti:
          let isMajor = false;
          if (targetGrade === '11-SAY') {
            // Sayısalcıların ana dersleri: Matematik, Fizik, Kimya, Biyoloji, Edebiyat
            isMajor = /MAT|GEOM|FİZ|FIZ|KİM|KMY|BİY|EDEB|TDEB/i.test(code) || /Matematik|Fizik|Kimya|Biyoloji|Edebiyat/i.test(fullName);
          } else if (targetGrade === '11-EA') {
            // Eşit ağırlıkçıların ana dersleri: Matematik, Edebiyat, Tarih, Coğrafya
            isMajor = /MAT|GEOM|EDEB|TDEB|TARİH|TAR|COG|COĞRFY|COGRFY/i.test(code) || /Matematik|Edebiyat|Tarih|Coğrafya/i.test(fullName);
          } else {
            // 9, 10, 12. sınıflar:
            isMajor = /EDEB|TDEB|MAT|FİZ|FIZ|KİM|KMY|BİY/i.test(code) || /EDEB|TDEB|MAT|FİZ|FIZ|KİM|KMY|BİY/i.test(fullName);
          }
          
          byGrade[targetGrade].set(code, {
            id: `es_${targetGrade}_${code.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 7)}`,
            name: fullName,
            code: code,
            isMajor: isMajor
          });
        }
      });
    });

    const finalSubjects = {};
    const order = { "9": 1, "10": 2, "11-SAY": 3, "11-EA": 4, "11": 5, "12": 6 };
    const detectedGrades = Array.from(detectedGradesSet).sort((a, b) => (order[a] || 99) - (order[b] || 99));

    detectedGrades.forEach(g => {
      finalSubjects[g] = Array.from(byGrade[g].values());
    });

    setExamSubjectsByGrade(finalSubjects);
    if (detectedGrades.length > 0) {
      updateExamSettings({ grades: detectedGrades });
      if (!detectedGrades.includes(selectedGrade)) {
        setSelectedGrade(detectedGrades[0]);
      }
    }

    const totalImported = Object.values(finalSubjects).reduce((acc, l) => acc + l.length, 0);
    showToast(`Ders programından ${detectedGrades.length} grupta toplam ${totalImported} ders otomatik aktarıldı! ✨`);
  };

  // 2. Menü: Varsayılan ders listesine sıfırla
  const handleResetToDefaults = () => {
    setExamSubjectsByGrade(DEFAULT_EXAM_SUBJECTS);
    updateExamSettings({ grades: ALL_POSSIBLE_GRADES });
    setSelectedGrade('9');
    showToast('Tüm kademelerdeki sınav dersleri varsayılan MEB listesine sıfırlandı.');
  };

  // 2. Menü: Manuel ders ekleme
  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const code = newSubCode.trim() || newSubName.trim().slice(0, 5).toUpperCase();
    addExamSubject(newSubGrade, {
      name: newSubName.trim(),
      code: code,
      isMajor: newSubIsMajor
    });
    setNewSubName('');
    setNewSubCode('');
    setNewSubIsMajor(false);
    setSelectedGrade(newSubGrade);
    showToast(`"${newSubName.trim()}" dersi ${getGradeTitle(newSubGrade)} kademesine eklendi.`);
  };

  // 3. Menü: Dağıtımı başlat
  const handleGenerate = () => {
    const res = generateExamSchedule();
    setActiveMenu('distribution');
    if (res.success) {
      showToast('Ortak sınav takvimi başarıyla oluşturuldu! (Matematik ve Edebiyat tüm okul aynı anda planlandı) 🌟');
    } else {
      showToast(`${res.unassigned.length} ders sığdırılamadı. Tarih aralığını genişletin.`);
    }
  };

  // 3. Menü: Excel / CSV olarak indir (Dikeyde Günler, Yatayda Saatler ve Kademeler)
  const handleExportCSV = () => {
    if (!examSchedule) {
      showToast('Henüz dağıtılmış sınav takvimi bulunmuyor.');
      return;
    }
    const headers = ['Tarih', 'Gün'];
    examSlots.forEach(slot => {
      grades.forEach(g => {
        headers.push(`${slot}. Ders (${getGradeShort(g)})`);
      });
    });

    const rows = [];
    workingDays.forEach(day => {
      const row = [day.date, day.dayName];
      examSlots.forEach(slot => {
        grades.forEach(g => {
          const sub = examSchedule?.[g]?.[day.date]?.[slot];
          row.push(sub ? `${sub.name} (${sub.code})` : '-');
        });
      });
      rows.push(row);
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ortak_Sinav_Takvimi_${examSettings.startDate}_${examSettings.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sınav takvimi Excel (CSV) formatında indirildi.');
  };

  // İlk seans (günün ilk sınavı)
  const firstSlot = [...examSlots].sort((a, b) => a - b)[0] || 2;

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 flex flex-col pb-16">
      
      {/* 🖨️ YAZDIRMA (PRINT) ÖZEL CSS: A4 YATAY TEK SAYFAYA SIĞDIRMA */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm 6mm 6mm 6mm;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          header, aside, .print-hide, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .print-page-fit {
            width: 100% !important;
            max-height: 98vh !important;
            height: auto !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .print-matrix-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .print-matrix-table th, .print-matrix-table td {
            border: 1px solid #111 !important;
            padding: 2.5px 2px !important;
            font-size: 8px !important;
            line-height: 1.15 !important;
            text-align: center !important;
          }
          .print-matrix-table th {
            background-color: #f1f5f9 !important;
            font-weight: 800 !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* 🚀 ÜST KURUMSAL HEADER (YAZDIRMA SIRASINDA GİZLENİR) */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all shadow-2xs cursor-pointer group"
              title="Merkezi Modül Portalına Dön"
            >
              <ArrowLeft size={17} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl select-none shadow-2xs">
                📝
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                    Modül 4 / 4
                  </span>
                  <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight">
                    Okul Ortak Sınav Takvimi
                  </h1>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  {settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL'} &nbsp;·&nbsp; Ortak Matematik & Edebiyat &nbsp;·&nbsp; 11-SAY & 11-EA
                </p>
              </div>
            </div>
          </div>

          {/* MEB Kural Güvencesi Rozetleri */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold" title="Tüm okulda aynı gün ve 1. seansta ortak yapılır">
              <Star size={14} className="fill-amber-500 text-amber-600" />
              <span>Ortak Matematik & Edebiyat Günü</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Günde Max 1 Ana Ders ({firstSlot}. Ders)</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <Clock size={14} className="text-emerald-600" />
              <span>Ders Öğretmeni Sorumluluğu</span>
            </div>
          </div>

          {/* Hızlı Aksiyon Butonları & Görünür Sıfırlama Butonu */}
          <div className="flex items-center gap-2">
            
            {/* 🔴 GÖRÜNÜR DAĞITIMI SIFIRLAMA BUTONU (KULLANICI TALEBİ) */}
            {examSchedule && (
              <button
                onClick={handleClearSchedule}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Mevcut dağıtılmış ortak sınav takvimini tamamen sıfırlar"
              >
                <RotateCcw size={14} className="text-rose-600" />
                <span>Dağıtımı Sıfırla</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveMenu('distribution');
                setViewMode('matrix');
                setTimeout(() => window.print(), 150);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="A4 Yatay tek sayfaya sığdırılmış resmi okul sınav panosunu yazdır"
            >
              <Printer size={15} className="text-slate-500" />
              <span>Yatayı Yazdır (A4)</span>
            </button>

            <button
              onClick={handleGenerate}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Otomatik Dağıt</span>
            </button>

            <button
              onClick={() => navigate('/')}
              title="Merkezi Modül Portalına Dön"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <LayoutGrid size={15} className="text-slate-500" />
              <span>Modül Değiştir</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST BİLDİRİMİ */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs sm:text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 📄 ANA DÜZEN (DİKEY MENÜ SOLDA, İÇERİK SAĞDA) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full print:p-0 print:max-w-none">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* ========================================================= */}
          {/* 🌟 SOL SÜTUN: DİKEY MENÜLER (VERTICAL SIDEBAR NAVIGATION) */}
          {/* ========================================================= */}
          <aside className="w-full md:w-72 lg:w-80 shrink-0 space-y-3 print:hidden">
            <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-xs space-y-2">
              <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                Sınav Takvimi Adımları
              </div>

              {/* 1. MENÜ: Tarih & Seans Yapılandırması */}
              <button
                type="button"
                onClick={() => setActiveMenu('settings')}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                  activeMenu === 'settings'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    activeMenu === 'settings' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs leading-snug">
                      1. Tarih & Seanslar
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  activeMenu === 'settings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {workingDays.length} Gün
                </span>
              </button>

              {/* 2. MENÜ: Okulda Bulunan Dersler */}
              <button
                type="button"
                onClick={() => setActiveMenu('subjects')}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                  activeMenu === 'subjects'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    activeMenu === 'subjects' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs leading-snug">
                      2. Okuldaki Dersler
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  activeMenu === 'subjects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {totalExamSubjects} Ders
                </span>
              </button>

              {/* 3. MENÜ: Dağıtım Tuşu & Çıktılar */}
              <button
                type="button"
                onClick={() => setActiveMenu('distribution')}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                  activeMenu === 'distribution'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    activeMenu === 'distribution' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs leading-snug">
                      3. Dağıtım & Çıktılar
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  activeMenu === 'distribution' 
                    ? 'bg-white/20 text-white' 
                    : examSchedule ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {examSchedule ? 'Hazır' : 'Bekliyor'}
                </span>
              </button>
            </div>

            {/* Ortak Sınav Kural Güvenceleri Kartı */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                <span>🌟 MEB Ortak Sınav Standartları</span>
              </div>
              <div className="text-[11px] text-amber-900 space-y-2 leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80">
                  <strong className="block text-amber-950 font-bold">📐 Ortak Matematik Günü:</strong>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    Tüm sınıflar aynı gün ilk sınav seansında Matematik sınavına girer.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80">
                  <strong className="block text-amber-950 font-bold">📖 Ortak Edebiyat Günü:</strong>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    Tüm okul aynı gün ilk sınav seansında Türk Dili ve Edebiyatı sınavına girer.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80">
                  <strong className="block text-amber-950 font-bold">⚖️ 11. Sınıf Alan Ayrımı:</strong>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    Sayısal (Mat, Fiz, Kim, Biyo, Edebiyat) ve Eşit Ağ. (Mat, Edebiyat, Tarih, Coğrafya) ana dersleri günde 1 tane olacak şekilde dağıtılır.
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* 📄 SAĞ SÜTUN: SEÇİLİ DİKEY MENÜNÜN İÇERİĞİ */}
          {/* ========================================================= */}
          <div className="flex-1 w-full min-w-0">

            {/* ------------------------------------------------------- */}
            {/* 1. DİKEY MENÜ İÇERİĞİ: TARİH & SEANS YAPILANDIRILMASI */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  
                  {/* Başlık */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider mb-1">
                      <Sliders size={14} />
                      <span>1. Adım: Yapılandırma</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Ortak Sınav Tarihi & Seans Yapılandırması
                    </h2>
                  </div>

                  {/* 1. Tarih Aralığı */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Sınav Takvimi Tarih Aralığı
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">Sınav Başlangıç Tarihi</span>
                        <input
                          type="date"
                          value={examSettings.startDate}
                          onChange={(e) => updateExamSettings({ startDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">Sınav Bitiş Tarihi</span>
                        <input
                          type="date"
                          value={examSettings.endDate}
                          onChange={(e) => updateExamSettings({ endDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    {/* Canlı İş Günleri Göstergesi */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Calendar size={15} className="text-amber-700 shrink-0" />
                        <span>Hafta İçi Toplam <strong>{workingDays.length} İş Günü</strong> Tespit Edildi (Hafta sonları hariç)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {workingDays.map(d => (
                          <span key={d.date} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800">
                            {d.formatted.split(' ')[0]} {d.dayName.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Sınav Seansları (Ders Saatleri) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Günlük Sınav Seansları (Ders Saatleri)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Örn: 2. ve 5. Ders Saatleri
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                        const isSelected = examSlots.includes(slot);
                        const isFirst = slot === firstSlot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleToggleSlot(slot)}
                            className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <span className="font-extrabold text-sm">{slot}. Ders Saati</span>
                            {isSelected && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                isFirst ? 'bg-amber-800 text-white' : 'bg-white/20 text-white'
                              }`}>
                                {isFirst ? '1. Seans (Ana Ders)' : '2. Seans (Yan Ders)'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Dahil Edilecek Kademeler (11-SAY ve 11-EA dahil) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Dahil Edilecek Sınıf & Alan Kademeleri
                      </label>
                      <span className="text-[11px] text-indigo-700 font-bold">
                        11. Sınıflar Sayısal & Eşit Ağırlık olarak 2 ayrı gruptur
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {ALL_POSSIBLE_GRADES.map(g => {
                        const isSelected = grades.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleToggleGrade(g)}
                            className={`py-3 px-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border text-center ${
                              isSelected
                                ? (g.includes('11') ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs' : 'bg-amber-600 text-white border-amber-700 shadow-2xs')
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <div>{getGradeTitle(g)}</div>
                            {getGradeBadge(g) && (
                              <div className="text-[9px] font-normal opacity-90 mt-0.5">{getGradeBadge(g)}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aksiyon Butonları & Görünür Sıfırla Butonu */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearSchedule}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} className="text-rose-600" />
                      <span>Sınav Takvimini Sıfırla</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('Tarih ve seans ayarları kaydedildi.')}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ayarları Kaydet
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMenu('subjects')}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>2. Adım: Dersleri Belirle</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 2. DİKEY MENÜ İÇERİĞİ: OKULDA BULUNAN DERSLER */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'subjects' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* ÜST EYLEM KARTI (OTOMATİK ÇEKME & SIFIRLAMA) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider mb-1">
                      <BookOpen size={14} />
                      <span>2. Adım: Ders Havuzu</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Okulda Bulunan Sınav Dersleri
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Varsayılan MEB ortak sınav ders listesini yükler"
                    >
                      <RefreshCw size={14} />
                      <span>Varsayılanları Yükle</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoImportFromTimetable}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                      title="Ders programındaki dersleri otomatik çeker"
                    >
                      <Sparkles size={15} />
                      <span>Ders Programından Otomatik Aktar</span>
                    </button>
                  </div>
                </div>

                {/* 🌟 HER SINIF VE ALAN KADEMESİNDE TANIMLI DERS İSİMLERİ VE SAYILARI (CANLI ÖZET) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Kademeler & Alan Grupları Bazında Tanımlı Sınav Dersleri (Canlı Özet)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {grades.map(g => {
                      const subjects = examSubjectsByGrade[g] || [];
                      const majorCount = subjects.filter(s => s.isMajor).length;
                      const isSelected = selectedGrade === g;

                      return (
                        <div
                          key={g}
                          onClick={() => setSelectedGrade(g)}
                          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-black text-sm text-slate-900 leading-tight">
                              {getGradeTitle(g)}
                            </div>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {subjects.length} Ders
                            </span>
                          </div>

                          {getGradeBadge(g) && (
                            <div className="text-[10px] font-bold text-indigo-700 mb-1">
                              {getGradeBadge(g)}
                            </div>
                          )}

                          <div className="text-[11px] text-amber-800 font-bold mb-2 flex items-center gap-1">
                            <Star size={12} className="fill-amber-500 text-amber-500" />
                            <span>{majorCount} Ana Ders · {subjects.length - majorCount} Yan Ders</span>
                          </div>

                          {/* Anlık Tanımlı Ders İsimleri Chips */}
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {subjects.map(sub => (
                              <span
                                key={sub.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-tight ${
                                  sub.isMajor
                                    ? 'bg-amber-100/90 text-amber-950 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                                title={`${sub.name} (${sub.code})`}
                              >
                                {sub.code || sub.name} {sub.isMajor && '⭐'}
                              </span>
                            ))}
                            {subjects.length === 0 && (
                              <span className="text-[11px] text-slate-400 italic">Ders tanımlanmadı</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MANUEL DERS EKLEME VE SEÇİLİ KADEME DERS LİSTESİ YÖNETİMİ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* SOL: Yeni Ders Ekleme Formu */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Plus size={16} className="text-amber-600" />
                      <span>Manuel Ders Ekle</span>
                    </h3>

                    <form onSubmit={handleAddSubject} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Kademeyi / Grubu Seçin</label>
                        <select
                          value={newSubGrade}
                          onChange={(e) => setNewSubGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          {grades.map(g => (
                            <option key={g} value={g}>{getGradeTitle(g)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Ders Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Biyoloji veya Coğrafya"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Ders Kodu (Kısa Ad)</label>
                        <input
                          type="text"
                          placeholder="Örn: BİY veya COĞ"
                          value={newSubCode}
                          onChange={(e) => setNewSubCode(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="newSubIsMajor"
                          checked={newSubIsMajor}
                          onChange={(e) => setNewSubIsMajor(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="newSubIsMajor" className="text-xs font-bold text-amber-950 cursor-pointer leading-tight">
                          ⭐ Ana Ders Olarak İşaretle
                          <span className="block text-[10px] font-normal text-amber-800 mt-0.5">
                            (Günde en fazla 1 adet ve günün ilk sınav seansına yerleşir)
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus size={15} />
                        <span>Dersi Kademeye Ekle</span>
                      </button>
                    </form>
                  </div>

                  {/* SAĞ: Seçili Kademeye Ait Ders Tablosu & Yıldızla Ana Ders Değiştirme */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* Kademe Sekmeleri */}
                    <div className="flex flex-wrap gap-2">
                      {grades.map(g => (
                        <button
                          key={g}
                          onClick={() => setSelectedGrade(g)}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                            selectedGrade === g
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {getGradeShort(g)} ({(examSubjectsByGrade[g] || []).length} Ders)
                        </button>
                      ))}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">
                              {getGradeTitle(selectedGrade)} Sınav Dersleri Listesi
                            </h3>
                            {getGradeBadge(selectedGrade) && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {getGradeBadge(selectedGrade)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {getGradeMajorDescription(selectedGrade)}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                          {(examSubjectsByGrade[selectedGrade] || []).length} Ders
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {(examSubjectsByGrade[selectedGrade] || []).map(sub => (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              sub.isMajor
                                ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => toggleExamSubjectMajor(selectedGrade, sub.id)}
                                className="cursor-pointer p-1 rounded-lg hover:bg-white/80 transition-colors"
                                title={sub.isMajor ? "Ana dersten çıkar" : "Ana ders yap"}
                              >
                                <Star 
                                  size={16} 
                                  className={sub.isMajor ? "fill-amber-500 text-amber-600" : "text-slate-300 hover:text-amber-400"} 
                                />
                              </button>
                              <div>
                                <div className="font-extrabold text-xs leading-tight">{sub.name}</div>
                                <div className="text-[10px] font-mono font-bold mt-0.5 flex items-center gap-1.5">
                                  <span className="opacity-75">{sub.code}</span>
                                  {sub.isMajor && (
                                    <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-200/70 px-1 rounded">
                                      Ana Ders
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteExamSubject(selectedGrade, sub.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Dersi Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}

                        {(!examSubjectsByGrade[selectedGrade] || examSubjectsByGrade[selectedGrade].length === 0) && (
                          <div className="col-span-2 text-center py-8 text-xs text-slate-400">
                            Bu kademede henüz sınav dersi bulunmuyor. Yukarıdaki "Ders Programından Otomatik Aktar" butonunu kullanabilirsiniz.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sonraki Adıma Geçiş Butonu */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveMenu('distribution')}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>3. Adım: Dağıtım & Çıktılara Geç</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 3. DİKEY MENÜ İÇERİĞİ: DAĞITIM MOTORU & RESMİ ÇIKTILAR */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'distribution' && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* DAĞITIM VE KONTROL PANOSU (YAZDIRMADA GİZLİ) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider mb-1">
                        <Sparkles size={14} />
                        <span>3. Adım: Motor & Çıktılar</span>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Otomatik Dağıtım Motoru & Resmi Çıktılar
                      </h2>
                    </div>

                    {/* Aksiyon Butonları (Dağıt & Görünür Sıfırla Butonu) */}
                    <div className="flex items-center gap-2.5">
                      
                      {/* 🔴 GÖRÜNÜR DAĞITIMI SIFIRLAMA BUTONU */}
                      {examSchedule && (
                        <button
                          onClick={handleClearSchedule}
                          className="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Mevcut dağıtılmış ortak sınav takvimini sıfırlar"
                        >
                          <RotateCcw size={15} className="text-rose-600" />
                          <span>Dağıtımı Sıfırla</span>
                        </button>
                      )}

                      {/* Büyük Dağıtım Butonu */}
                      <button
                        onClick={handleGenerate}
                        className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Sparkles size={16} />
                        <span>Sınav Takvimini Otomatik Dağıt</span>
                      </button>
                    </div>
                  </div>

                  {/* Dağıtım Durumu ve İstatistikler */}
                  {examResult && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                      examResult.success 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-3">
                        {examResult.success ? (
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                            <CheckCircle2 size={18} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                            <AlertCircle size={18} />
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-xs">
                            {examResult.success 
                              ? `Dağıtım Başarılı: ${workingDays.length} iş gününde ${examResult.totalSubjects} sınav yerleştirildi!` 
                              : `Kısmi Dağıtım: ${examResult.unassigned.length} ders sığdırılamadı.`}
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {examResult.success 
                              ? 'Tüm okul aynı gün Matematik ve Edebiyat sınavına giriyor. Ana dersler günde 1 tane ve 1. seansta.'
                              : 'Sığmayan dersler için lütfen 1. menüden tarih aralığını genişletin.'}
                          </div>
                        </div>
                      </div>

                      {/* Çıktı ve Sıfırlama Butonları */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet size={15} className="text-emerald-600" />
                          <span>Excel (CSV) İndir</span>
                        </button>

                        <button
                          onClick={() => {
                            setViewMode('matrix');
                            setTimeout(() => window.print(), 150);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="A4 Yatay tek sayfaya sığdırılmış resmi okul sınav panosunu yazdır"
                        >
                          <Printer size={15} className="text-slate-600" />
                          <span>Yatayı Yazdır (A4)</span>
                        </button>

                        <button
                          onClick={handleClearSchedule}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Dağıtımı Sıfırla"
                        >
                          <RotateCcw size={13} className="text-rose-600" />
                          <span>Sıfırla</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Görünüm Seçimi & Kademe Filtresi */}
                  {examSchedule && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Pano Düzeni:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => setViewMode('matrix')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              viewMode === 'matrix' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Okul Panosu (Dikeyde Günler · Yatayda Seanslar)
                          </button>
                          <button
                            onClick={() => setViewMode('gradeMatrix')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              viewMode === 'gradeMatrix' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Kademeler Matrisi
                          </button>
                          <button
                            onClick={() => setViewMode('single')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              viewMode === 'single' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Tek Kademe Çizelgesi
                          </button>
                        </div>
                      </div>

                      {viewMode === 'single' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Grup:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {grades.map(g => (
                              <button
                                key={g}
                                onClick={() => setSelectedGrade(g)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  selectedGrade === g
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {getGradeShort(g)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* HENÜZ DAĞITILMADIYSA ÇAĞRI KARTI */}
                {!examSchedule && (
                  <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs my-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto shadow-2xs">
                      📝
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Ortak Sınav Takvimi Henüz Dağıtılmadı</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        Tüm okul için ortak Matematik ve Edebiyat günleri, 11-SAY ve 11-EA dengesiyle sınav dağıtımını başlatın.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      <span>Şimdi Otomatik Sınav Takvimini Oluştur</span>
                    </button>
                  </div>
                )}

                {/* ======================================================= */}
                {/* 📄 ÇIKTI GÖRÜNÜMÜ 1: OKUL GENEL SINAV PANOSU (MATRİS)    */}
                {/* 🌟 DİKEYDE GÜNLER · YATAYDA SAATLER VE DERS İSİMLERİ   */}
                {/* 🌟 A4 YATAY TEK SAYFAYA SIĞACAK RESMİ BASKI DÜZENİ     */}
                {/* ======================================================= */}
                {examSchedule && viewMode === 'matrix' && (
                  <div className="print-page-fit bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none print:rounded-none">
                    
                    {/* Resmi Kurum Başlığı (Yazdırıldığında da görünür) */}
                    <div className="p-3.5 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 print:bg-white print:border-black print:p-2">
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest print:text-black">
                          T.C. MİLLİ EĞİTİM BAKANLIĞI
                        </div>
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 print:text-black mt-0.5">
                          {settings?.schoolName || 'Okul'} — Ortak Yazılı Sınav Takvimi
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 print:text-gray-800 mt-0.5">
                          Tarih Aralığı: {examSettings.startDate} — {examSettings.endDate} &nbsp;|&nbsp; Günlük Sınav Seansları: {examSlots.join('. ve ')}. Ders Saatleri
                        </p>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Okul Genel Panosu (Yatay)
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Printer size={14} />
                          <span>Yazdır (A4 Yatay)</span>
                        </button>
                      </div>
                    </div>

                    {/* TABLO: DİKEYDE GÜNLER, YATAYDA SEANS KUTULARI */}
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="print-matrix-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider print:bg-gray-200 print:text-black print:border-black">
                            <th 
                              className="p-3 w-36 sm:w-44 text-center border-r border-slate-300 print:border-black print:p-1.5 print:w-32 bg-slate-200/70 print:bg-gray-200 align-middle"
                            >
                              Tarih & Gün
                            </th>
                            {examSlots.map((slot, si) => (
                              <th 
                                key={slot} 
                                className={`p-3 text-center border-l border-slate-300 print:border-black print:p-1.5 font-black ${
                                  si === 0 ? 'bg-amber-100/70 text-amber-950 print:bg-gray-100' : 'bg-slate-100 text-slate-900 print:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xs sm:text-sm font-black">{si + 1}. Sınav Seansı ({slot}. Ders)</span>
                                  {si === 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold print:hidden">
                                      Ana Dersler
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 print:divide-black">
                          {workingDays.map((day) => (
                            <tr key={day.date} className="hover:bg-slate-50/70 transition-colors print:hover:bg-white">
                              
                              {/* DİKEYDE GÜN VE TARİH HÜCRESİ */}
                              <td className="p-2.5 sm:p-3 font-extrabold text-slate-900 border-r border-slate-300 bg-slate-50/50 print:bg-white print:border-black print:p-1 text-center align-middle whitespace-nowrap">
                                <div className="text-xs sm:text-sm font-black text-slate-900 print:text-black leading-tight">
                                  {day.dayName}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5 print:text-black">
                                  {day.date}
                                </div>
                              </td>

                              {/* YATAYDA SEANS KUTULARI (HER SEANS İÇİN AYRI BİR KUTU) */}
                              {examSlots.map((slot) => {
                                const slotExams = grades.map(g => ({
                                  grade: g,
                                  exam: examSchedule?.[g]?.[day.date]?.[slot]
                                })).filter(x => x.exam);

                                const uniqueNames = Array.from(new Set(slotExams.map(x => x.exam.name)));
                                const isCommonToAll = uniqueNames.length === 1 && slotExams.length === grades.length;

                                return (
                                  <td 
                                    key={`${day.date}-${slot}`} 
                                    className="p-2 sm:p-3 border-l border-slate-200 print:border-black print:p-1 align-top"
                                  >
                                    {slotExams.length === 0 ? (
                                      <div className="py-4 text-center text-slate-300 print:text-gray-400 text-xs italic">
                                        — Sınav Yok —
                                      </div>
                                    ) : isCommonToAll ? (
                                      <div className="rounded-xl p-2.5 sm:p-3 border bg-amber-50/90 border-amber-300 text-amber-950 font-extrabold shadow-2xs print:border-black print:bg-white print:p-1 print:rounded-none">
                                        <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md print:border print:border-black print:bg-white print:text-black mb-1">
                                          <span>⭐ Tüm Okul Ortak Sınavı</span>
                                        </div>
                                        <div className="font-black text-xs sm:text-sm text-slate-900 print:text-black leading-tight">
                                          {uniqueNames[0]}
                                        </div>
                                        <div className="text-[10px] text-slate-600 print:text-black font-mono mt-0.5">
                                          Tüm Kademeler Ortak
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 print:grid-cols-5 print:gap-1 text-left">
                                        {grades.map(g => {
                                          const sub = examSchedule?.[g]?.[day.date]?.[slot];
                                          if (!sub) return null;
                                          const colorStyle = getCourseColorClass(sub.name, `${g}A`);
                                          return (
                                            <div 
                                              key={g} 
                                              className={`p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between print:border-black print:bg-white print:p-0.5 print:rounded-none ${
                                                sub.isMajor
                                                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-extrabold shadow-2xs'
                                                  : colorStyle?.card || 'bg-slate-50 border-slate-200 text-slate-900 font-semibold'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 print:text-black">
                                                <span>{getGradeShort(g)}:</span>
                                                {sub.isMajor && <span className="text-amber-600 print:text-black font-bold" title="Ana Ders">⭐</span>}
                                              </div>
                                              <div className="font-extrabold text-xs text-slate-900 print:text-black leading-tight mt-0.5 truncate" title={sub.name}>
                                                {sub.name}
                                              </div>
                                              <div className="text-[9px] text-slate-500 print:text-black font-mono mt-0.5">
                                                {sub.code}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Resmi İmza & Onay Alanı (Yazdırma için) */}
                    <div className="p-3.5 sm:p-5 border-t border-slate-200 print:border-black flex justify-between items-center text-xs text-slate-700 print:text-black print:p-2 print:text-[10px]">
                      <div className="text-center">
                        <div className="font-bold">Sınav Yürütme Komisyonu</div>
                        <div className="mt-4 sm:mt-6 text-[10px] text-slate-400 print:text-black">İmza / Kaşe</div>
                      </div>
                      <div className="text-center font-bold">
                        UYGUNDUR<br />
                        <span className="text-[10px] font-normal">{new Date().toLocaleDateString('tr-TR')}</span>
                        <div className="mt-3 sm:mt-4 font-extrabold text-slate-900 print:text-black">
                          {settings?.principalName || 'Okul Müdürü'}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ======================================================= */}
                {/* 📄 ÇIKTI GÖRÜNÜMÜ: KADEMELER MATRİSİ (SINIF BAZLI TABLO) */}
                {/* ======================================================= */}
                {examSchedule && viewMode === 'gradeMatrix' && (
                  <div className="print-page-fit bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none print:rounded-none">
                    <div className="p-3.5 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 print:bg-white print:border-black print:p-2">
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest print:text-black">
                          T.C. MİLLİ EĞİTİM BAKANLIĞI
                        </div>
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 print:text-black mt-0.5">
                          {settings?.schoolName || 'Okul'} — Kademeler Bazında Ortak Sınav Matrisi
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 print:text-gray-800 mt-0.5">
                          Tarih Aralığı: {examSettings.startDate} — {examSettings.endDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Printer size={14} />
                          <span>Yazdır (A4 Yatay)</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="print-matrix-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider print:bg-gray-200 print:text-black print:border-black">
                            <th className="p-3 w-32 text-center border-r border-slate-300">Kademe / Sınıf</th>
                            {workingDays.map(day => (
                              <th key={day.date} colSpan={examSlots.length} className="p-2.5 text-center border-l border-slate-300 print:border-black">
                                <div>{day.dayName}</div>
                                <div className="text-[10px] font-mono opacity-75">{day.date}</div>
                              </th>
                            ))}
                          </tr>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] print:bg-gray-100 print:text-black">
                            <th className="border-r border-slate-300"></th>
                            {workingDays.map(day => (
                              <React.Fragment key={`sub-${day.date}`}>
                                {examSlots.map((slot, si) => (
                                  <th key={`${day.date}-${slot}`} className="p-1.5 text-center border-l border-slate-200">
                                    {si + 1}. Sınav ({slot}. Saat)
                                  </th>
                                ))}
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 print:divide-black">
                          {grades.map(grade => (
                            <tr key={grade} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-300 bg-slate-50/50 text-center align-middle whitespace-nowrap">
                                <div className="font-black text-xs sm:text-sm">{getGradeTitle(grade)}</div>
                              </td>
                              {workingDays.map(day => (
                                <React.Fragment key={`${grade}-${day.date}`}>
                                  {examSlots.map(slot => {
                                    const sub = examSchedule?.[grade]?.[day.date]?.[slot];
                                    return (
                                      <td key={`${grade}-${day.date}-${slot}`} className="p-1.5 text-center border-l border-slate-200 align-middle">
                                        {sub ? (
                                          <div className={`p-1.5 rounded-lg border text-xs ${
                                            sub.isMajor ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
                                          }`}>
                                            <div className="font-extrabold truncate" title={sub.name}>{sub.name}</div>
                                            <div className="text-[9px] text-slate-500 font-mono">{sub.code}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 italic text-[11px]">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3.5 sm:p-5 border-t border-slate-200 print:border-black flex justify-between items-center text-xs text-slate-700 print:text-black print:p-2 print:text-[10px]">
                      <div className="text-center">
                        <div className="font-bold">Sınav Yürütme Komisyonu</div>
                        <div className="mt-4 sm:mt-6 text-[10px] text-slate-400 print:text-black">İmza / Kaşe</div>
                      </div>
                      <div className="text-center font-bold">
                        UYGUNDUR<br />
                        <span className="text-[10px] font-normal">{new Date().toLocaleDateString('tr-TR')}</span>
                        <div className="mt-3 sm:mt-4 font-extrabold text-slate-900 print:text-black">
                          {settings?.principalName || 'Okul Müdürü'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* 📄 ÇIKTI GÖRÜNÜMÜ 2: KADEME / GRUP BAZLI TABLO         */}
                {/* ======================================================= */}
                {examSchedule && viewMode === 'single' && (
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:bg-white print:border-black">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest print:text-black">
                          T.C. MİLLİ EĞİTİM BAKANLIĞI
                        </div>
                        <h2 className="text-base font-extrabold text-slate-900 print:text-black mt-0.5">
                          {getGradeTitle(selectedGrade)} Ortak Sınav Takvimi
                        </h2>
                        <p className="text-xs text-slate-500 print:text-gray-700 mt-0.5">
                          {getGradeMajorDescription(selectedGrade)} &nbsp;|&nbsp; Ana ders daima günün ilk sınav seansında ({firstSlot}. Ders)
                        </p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 print:hidden">
                        {getGradeTitle(selectedGrade)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider print:bg-gray-100 print:text-black print:border-black">
                            <th className="p-4 w-48">Tarih</th>
                            <th className="p-4 w-32">Gün</th>
                            {examSlots.map(s => (
                              <th key={s} className="p-4 text-center border-l border-slate-200 print:border-black">
                                {s}. Ders Saati Sınavı
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                          {workingDays.map(day => (
                            <tr key={day.date} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-700">{day.date}</td>
                              <td className="p-4 font-extrabold text-slate-900">{day.dayName}</td>
                              {examSlots.map(slot => {
                                const sub = examSchedule?.[selectedGrade]?.[day.date]?.[slot];

                                return (
                                  <td key={slot} className="p-3 text-center border-l border-slate-200 print:border-black min-h-[64px]">
                                    {sub ? (
                                      <div className={`rounded-xl p-3 border ${
                                        sub.isMajor
                                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-black'
                                          : 'bg-slate-50 border-slate-200 text-slate-900 font-bold'
                                      }`}>
                                        <div className="text-xs">{sub.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                                          {sub.code} {sub.isMajor && '• Ana Ders'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 print:text-gray-300 text-xs italic">— Boş —</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Resmi İmza & Onay Alanı */}
                    <div className="p-6 border-t border-slate-100 print:border-black flex justify-between items-center text-xs text-slate-600 print:text-black">
                      <div className="text-center">
                        <div className="font-bold">Zümre / Sınav Komisyonu</div>
                        <div className="mt-8 text-[11px] text-slate-400">İmza / Kaşe</div>
                      </div>
                      <div className="text-center font-bold">
                        UYGUNDUR<br />
                        <span className="text-[11px] font-normal">{new Date().toLocaleDateString('tr-TR')}</span>
                        <div className="mt-6 font-extrabold text-slate-900 print:text-black">
                          {settings?.principalName || 'Okul Müdürü'}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
