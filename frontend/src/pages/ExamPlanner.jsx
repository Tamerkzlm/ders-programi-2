// frontend/src/pages/ExamPlanner.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  RotateCcw,
  X,
  Users,
  GraduationCap,
  Filter
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getWorkingDaysBetween, formatExamDay, DEFAULT_EXAM_SUBJECTS } from '../utils/examEngine';
import { getSubjectSoftColor } from '../utils/courseColors';

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

// Kademeye ait okuldaki gerçek sınıfları/şubeleri bulur
const getGradeSections = (grade, classrooms = []) => {
  return classrooms.filter(c => {
    const cName = (c.name || '').trim();
    if (grade === '11-SAY') {
      const match = cName.startsWith('11');
      if (!match) return false;
      const coursesUpper = (c.courses || []).map(co => (co.subject || '').toUpperCase());
      return coursesUpper.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('BİY')) || cName.toUpperCase().includes('SAY');
    }
    if (grade === '11-EA') {
      const match = cName.startsWith('11');
      if (!match) return false;
      const coursesUpper = (c.courses || []).map(co => (co.subject || '').toUpperCase());
      const isSay = coursesUpper.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('BİY')) || cName.toUpperCase().includes('SAY');
      return !isSay;
    }
    if (grade === '12-SAY') {
      return cName.startsWith('12') && cName.toUpperCase().includes('SAY');
    }
    if (grade === '12-EA') {
      return cName.startsWith('12') && (cName.toUpperCase().includes('EA') || cName.toUpperCase().includes('EŞİT'));
    }
    return cName.startsWith(grade) || cName.includes(`${grade}-`) || cName.includes(`${grade}/`);
  });
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

  // 1. Menü: Ekstra gün ekleme ve yeni kademe ekleme formları
  const [customDateInput, setCustomDateInput] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [showAddGradeInput, setShowAddGradeInput] = useState(false);

  // 2. Menü: Yeni ders ekleme formu
  const [newSubGrade, setNewSubGrade] = useState('9');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubIsMajor, setNewSubIsMajor] = useState(false);
  const [newSubSelectedSections, setNewSubSelectedSections] = useState([]);

  // Kademeler listesi
  const ALL_POSSIBLE_GRADES = ["9", "10", "11-SAY", "11-EA", "12"];
  const grades = examSettings?.grades || ALL_POSSIBLE_GRADES;
  const examSlots = examSettings?.examSlots || [3, 5];

  // 1. Menü: Tarih Aralığı Günleri (Varsayılan iş günleri)
  const allRangeDays = useMemo(() => {
    return getWorkingDaysBetween(examSettings?.startDate || "2025-11-03", examSettings?.endDate || "2025-11-14");
  }, [examSettings?.startDate, examSettings?.endDate]);

  // Kullanıcının interaktif olarak seçtiği günler
  const selectedDatesList = useMemo(() => {
    if (examSettings?.selectedDates && Array.isArray(examSettings.selectedDates)) {
      return examSettings.selectedDates;
    }
    return allRangeDays.map(d => d.date);
  }, [examSettings?.selectedDates, allRangeDays]);

  // Aktif çalışma günleri (Sıralanmış ve formatlanmış)
  const workingDays = useMemo(() => {
    return selectedDatesList
      .map(d => (typeof d === 'string' ? formatExamDay(d) : d))
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedDatesList]);

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
    if (g === '11-SAY') return '11. Sınıf (SAY)';
    if (g === '11-EA') return '11. Sınıf (EA)';
    if (g === '11-SÖZ') return '11. Sınıf (SÖZ)';
    if (g === '11-DİL') return '11. Sınıf (DİL)';
    if (g === '12-SAY') return '12. Sınıf (SAY)';
    if (g === '12-EA') return '12. Sınıf (EA)';
    if (!isNaN(g)) return `${g}. Sınıf`;
    return g;
  };

  const getGradeShort = (g) => {
    return g;
  };

  const getGradeBadge = (g) => {
    if (g.includes('SAY')) return '🔬 Sayısal';
    if (g.includes('EA')) return '⚖️ Eşit Ağırlık';
    if (g.includes('SÖZ')) return '📚 Sözel';
    if (g.includes('DİL')) return '🌍 Dil';
    return null;
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

  // 1. Menü: Gün toggle (Dahil et / Çıkar - Tatil)
  const handleToggleDay = (dateStr) => {
    let updated;
    if (selectedDatesList.includes(dateStr)) {
      if (selectedDatesList.length === 1) {
        showToast('En az 1 sınav günü seçili kalmalıdır.');
        return;
      }
      updated = selectedDatesList.filter(d => d !== dateStr);
    } else {
      updated = [...selectedDatesList, dateStr].sort();
    }
    updateExamSettings({ selectedDates: updated });
  };

  // 1. Menü: Tüm Hafta İçi Günleri Seç
  const handleSelectAllWeekdays = () => {
    const dates = allRangeDays.map(d => d.date);
    updateExamSettings({ selectedDates: dates });
    showToast('Tarih aralığındaki tüm hafta içi günler seçildi.');
  };

  // 1. Menü: Seçili Günleri Temizle
  const handleClearAllDays = () => {
    updateExamSettings({ selectedDates: [] });
    showToast('Sınav günleri seçimi temizlendi. Takvimden istediğiniz günlere tıklayarak belirleyebilirsiniz.');
  };

  // 1. Menü: Ekstra / Özel Sınav Günü Ekle
  const handleAddCustomDate = (e) => {
    e.preventDefault();
    if (!customDateInput) return;
    if (selectedDatesList.includes(customDateInput)) {
      showToast('Bu tarih zaten sınav günleri listesinde.');
      return;
    }
    const updated = [...selectedDatesList, customDateInput].sort();
    updateExamSettings({ selectedDates: updated });
    setCustomDateInput('');
    showToast(`${customDateInput} tarihi sınav takvimine eklendi.`);
  };

  // 1. Menü: Kademe seçimi toggle
  const handleToggleGrade = (gradeToToggle) => {
    let updated;
    if (grades.includes(gradeToToggle)) {
      if (grades.length === 1) return;
      updated = grades.filter(g => g !== gradeToToggle);
    } else {
      updated = [...grades, gradeToToggle];
    }
    updateExamSettings({ grades: updated });
    if (!updated.includes(selectedGrade)) {
      setSelectedGrade(updated[0] || '9');
    }
  };

  // 1. Menü: Yeni Sınıf Kademesi Ekle
  const handleAddNewGrade = (e) => {
    e.preventDefault();
    const clean = newGradeName.trim().toUpperCase();
    if (!clean) return;
    if (grades.includes(clean)) {
      showToast('Bu kademe zaten mevcut.');
      return;
    }
    const updated = [...grades, clean];
    updateExamSettings({ grades: updated });
    if (!examSubjectsByGrade[clean]) {
      setExamSubjectsByGrade({
        ...examSubjectsByGrade,
        [clean]: []
      });
    }
    setSelectedGrade(clean);
    setNewGradeName('');
    setShowAddGradeInput(false);
    showToast(`"${clean}" sınıf kademesi başarıyla eklendi.`);
  };

  // 1. Menü: Kademe Sil
  const handleRemoveGrade = (gradeToRemove, e) => {
    if (e) e.stopPropagation();
    if (grades.length <= 1) {
      showToast('En az bir kademe bulunmalıdır.');
      return;
    }
    if (window.confirm(`"${gradeToRemove}" kademesini sınav takviminden çıkarmak istediğinize emin misiniz?`)) {
      const updated = grades.filter(g => g !== gradeToRemove);
      updateExamSettings({ grades: updated });
      if (selectedGrade === gradeToRemove) {
        setSelectedGrade(updated[0] || '9');
      }
      showToast(`"${gradeToRemove}" kademesi çıkarıldı.`);
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

  // 2. Menü: Dersin uygulanacağı şubeleri toggle etme
  const handleToggleSubjectSection = (grade, subjectId, sectionName) => {
    const currentList = examSubjectsByGrade[grade] || [];
    const gradeSections = getGradeSections(grade, classrooms).map(c => c.name);

    const updated = currentList.map(s => {
      if (s.id === subjectId) {
        const sections = s.appliedSections !== undefined ? s.appliedSections : [...gradeSections];
        let newSections;
        if (sections.includes(sectionName)) {
          newSections = sections.filter(sec => sec !== sectionName);
        } else {
          newSections = [...sections, sectionName];
        }
        return { ...s, appliedSections: newSections };
      }
      return s;
    });

    setExamSubjectsByGrade({
      ...examSubjectsByGrade,
      [grade]: updated
    });
  };

  // 2. Menü: Tüm şubeleri seç / sıfırla
  const handleToggleAllSections = (grade, subjectId) => {
    const gradeSections = getGradeSections(grade, classrooms).map(c => c.name);
    const currentList = examSubjectsByGrade[grade] || [];
    const updated = currentList.map(s => {
      if (s.id === subjectId) {
        const isAllSelected = s.appliedSections && s.appliedSections.length === gradeSections.length;
        return { ...s, appliedSections: isAllSelected ? [] : [...gradeSections] };
      }
      return s;
    });
    setExamSubjectsByGrade({
      ...examSubjectsByGrade,
      [grade]: updated
    });
  };

  // 2. Menü: Ders programı modülünden otomatik çekme (Şubeler ve 11-SAY/EA ayrımıyla)
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

      let targetGrade = baseGrade;
      if (baseGrade === '11') {
        const courseUpper = (c.courses || []).map(co => (co.subject || '').toUpperCase());
        const isSay = courseUpper.some(s => s.includes('FİZ') || s.includes('FIZ') || s.includes('KİM') || s.includes('KMY') || s.includes('BİY'));
        targetGrade = isSay ? '11-SAY' : '11-EA';
      }

      detectedGradesSet.add(targetGrade);
      if (!byGrade[targetGrade]) byGrade[targetGrade] = new Map();

      (c.courses || []).forEach(co => {
        const rawSubject = (co.subject || '').trim();
        if (!rawSubject) return;
        const upper = rawSubject.toUpperCase();
        if (['REH', 'REHB', 'REHBERLİK', 'ETÜT', 'SOS', 'KULÜP', 'KULUP'].includes(upper)) return;

        const fullName = SUBJECT_FULL_NAMES[rawSubject] || SUBJECT_FULL_NAMES[upper] || rawSubject;
        
        let isMajor = false;
        if (targetGrade === '11-SAY') {
          isMajor = /MAT|GEOM|FİZ|FIZ|KİM|KMY|BİY|EDEB|TDEB/i.test(rawSubject) || /Matematik|Fizik|Kimya|Biyoloji|Edebiyat/i.test(fullName);
        } else if (targetGrade === '11-EA') {
          isMajor = /MAT|GEOM|EDEB|TDEB|TARİH|TAR|COG|COĞRFY|COGRFY/i.test(rawSubject) || /Matematik|Edebiyat|Tarih|Coğrafya/i.test(fullName);
        } else {
          isMajor = /EDEB|TDEB|MAT|FİZ|FIZ|KİM|KMY|BİY/i.test(rawSubject) || /EDEB|TDEB|MAT|FİZ|FIZ|KİM|KMY|BİY/i.test(fullName);
        }

        if (!byGrade[targetGrade].has(fullName)) {
          byGrade[targetGrade].set(fullName, {
            id: `es_${targetGrade}_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 6)}`,
            name: fullName,
            code: co.code || rawSubject.slice(0, 5).toUpperCase(),
            isMajor: isMajor,
            appliedSections: [c.name]
          });
        } else {
          // Mevcut derse bu şubeyi de ekle
          const existing = byGrade[targetGrade].get(fullName);
          if (c.name && !existing.appliedSections.includes(c.name)) {
            existing.appliedSections.push(c.name);
          }
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
    showToast(`Ders programından ${detectedGrades.length} grupta toplam ${totalImported} sınav dersi ve şubeleri aktarıldı! ✨`);
  };

  // 2. Menü: Varsayılan ders listesine sıfırla
  const handleResetToDefaults = () => {
    setExamSubjectsByGrade(DEFAULT_EXAM_SUBJECTS);
    updateExamSettings({ grades: ALL_POSSIBLE_GRADES });
    setSelectedGrade('9');
    showToast('Tüm kademelerdeki sınav dersleri varsayılan listeye sıfırlandı.');
  };

  // 2. Menü: Manuel ders ekleme
  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const code = newSubCode.trim() || newSubName.trim().slice(0, 5).toUpperCase();
    
    // Eğer şube seçilmediyse o kademenin tüm şubelerini varsayılan yap
    const gradeSections = getGradeSections(newSubGrade, classrooms).map(c => c.name);
    const sectionsToApply = newSubSelectedSections.length > 0 ? newSubSelectedSections : gradeSections;

    addExamSubject(newSubGrade, {
      name: newSubName.trim(),
      code: code,
      isMajor: newSubIsMajor,
      appliedSections: sectionsToApply
    });
    setNewSubName('');
    setNewSubCode('');
    setNewSubIsMajor(false);
    setNewSubSelectedSections([]);
    setSelectedGrade(newSubGrade);
    showToast(`"${newSubName.trim()}" dersi ${getGradeTitle(newSubGrade)} kademesine eklendi.`);
  };

  // 3. Menü: Dağıtımı başlat
  const handleGenerate = () => {
    const res = generateExamSchedule();
    setActiveMenu('distribution');
    if (res.success) {
      showToast('Ortak sınav takvimi başarıyla oluşturuldu! 🌟');
    } else {
      showToast(`${res.unassigned?.length || 0} ders sığdırılamadı. Lütfen gün sayısını artırın.`);
    }
  };

  // 3. Menü: Excel / CSV İndir (Günler Sütunda, Seanslar & Kademeler Satırda)
  const handleExportCSV = () => {
    if (!examSchedule) {
      showToast('Henüz dağıtılmış sınav takvimi bulunmuyor.');
      return;
    }
    const headers = ['Sınav Seansı', 'Sınıf Kademesi', ...workingDays.map(d => `${d.dayName} (${d.date})`)];
    const rows = [];

    examSlots.forEach((slot, si) => {
      grades.forEach(g => {
        const row = [
          `${si + 1}. Seans (${slot}. Ders)`,
          getGradeTitle(g)
        ];
        workingDays.forEach(day => {
          const sub = examSchedule?.[g]?.[day.date]?.[slot];
          row.push(sub ? sub.name : '-');
        });
        rows.push(row);
      });
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

  // Seçili kademeye ait okuldaki şubeler
  const activeGradeSections = useMemo(() => {
    return getGradeSections(selectedGrade, classrooms);
  }, [selectedGrade, classrooms]);

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
            padding: 3px 2px !important;
            font-size: 8.5px !important;
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
                  {settings?.schoolName || 'Okul'} &nbsp;·&nbsp; Günler Sütunda &nbsp;·&nbsp; Soft Ders Renkleri
                </p>
              </div>
            </div>
          </div>

          {/* Hızlı Aksiyon Butonları & Görünür Sıfırlama Butonu */}
          <div className="flex items-center gap-2">
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

                  {/* 1. İNTERAKTİF GÜN SEÇİM TAKVİMİ (KULLANICI TALEBİ) */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                          Sınav Yapılacak Günler (Takvimden Doğrudan Seçin)
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tarih aralığı belirleyin ve günlere tıklayarak tatilleri / özel günleri hariç tutun.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllWeekdays}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Tüm Hafta İçi
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllDays}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Temizle
                        </button>
                      </div>
                    </div>

                    {/* Başlangıç ve Bitiş Seçicisi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">Aralık Başlangıç</span>
                        <input
                          type="date"
                          value={examSettings.startDate}
                          onChange={(e) => updateExamSettings({ startDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">Aralık Bitiş</span>
                        <input
                          type="date"
                          value={examSettings.endDate}
                          onChange={(e) => updateExamSettings({ endDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    {/* İnteraktif Gün Kartları Grid'i */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Aralıktaki Günler (Tıklayarak Açıp Kapatın):</span>
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-black">
                          {workingDays.length} Gün Seçili
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                        {allRangeDays.map(d => {
                          const isSelected = selectedDatesList.includes(d.date);

                          return (
                            <button
                              key={d.date}
                              type="button"
                              onClick={() => handleToggleDay(d.date)}
                              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-50/90 border-2 border-amber-500 shadow-2xs ring-2 ring-amber-500/20 text-slate-900'
                                  : 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-60 hover:opacity-90'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-slate-400 line-through'}`}>
                                  {d.date.slice(5)}
                                </span>
                                {isSelected ? (
                                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                                    <Check size={10} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-bold">Tatil</span>
                                )}
                              </div>
                              <div className={`font-black text-xs ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                {d.dayName}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ekstra / Özel Gün Ekleme */}
                    <form onSubmit={handleAddCustomDate} className="flex items-center gap-2 pt-1">
                      <div className="flex-1 sm:max-w-xs">
                        <input
                          type="date"
                          value={customDateInput}
                          onChange={(e) => setCustomDateInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!customDateInput}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Plus size={13} />
                        <span>Özel Gün Ekle</span>
                      </button>
                    </form>
                  </div>

                  {/* 2. Sınav Seansları (Ders Saatleri) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
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

                  {/* 3. SINIF KADEMESİ YÖNETİMİ & YENİ KADEME EKLEME (KULLANICI TALEBİ) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Dahil Edilecek Sınıf & Alan Kademeleri
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddGradeInput(!showAddGradeInput)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus size={12} />
                        <span>Sınıf Kademesi Ekle</span>
                      </button>
                    </div>

                    {/* Yeni Kademe Ekleme Formu */}
                    {showAddGradeInput && (
                      <form onSubmit={handleAddNewGrade} className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder="Kademe Adı (Örn: 11-SÖZ, 12-SAY, 8, Hazırlık)..."
                          value={newGradeName}
                          onChange={(e) => setNewGradeName(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>Ekle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddGradeInput(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </form>
                    )}

                    {/* Mevcut Kademeler Listesi */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {grades.map(g => {
                        const isSelected = grades.includes(g);
                        const isCustom = !ALL_POSSIBLE_GRADES.includes(g);

                        return (
                          <div
                            key={g}
                            onClick={() => handleToggleGrade(g)}
                            className={`py-3 px-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border text-center relative group ${
                              isSelected
                                ? (g.includes('11') ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs' : 'bg-amber-600 text-white border-amber-700 shadow-2xs')
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveGrade(g, e)}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                                title="Kademeyi Sil"
                              >
                                <X size={10} />
                              </button>
                            )}
                            <div>{getGradeTitle(g)}</div>
                            {getGradeBadge(g) && (
                              <div className="text-[9px] font-normal opacity-90 mt-0.5">{getGradeBadge(g)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
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
            {/* 2. DİKEY MENÜ İÇERİĞİ: OKULDA BULUNAN DERSLER          */}
            {/* 🌟 KART EŞLEŞTİRME & UYGULANACAK ŞUBE SEÇİMİ          */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'subjects' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* ÜST EYLEM KARTI (OTOMATİK ÇEKME & SIFIRLAMA) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider mb-1">
                      <BookOpen size={14} />
                      <span>2. Adım: Ders & Şube Eşleştirme</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Sınav Dersleri ve Uygulanacak Şubeler
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

                {/* 2 KOLONLU EŞLEŞTİRME MASASI: SINIF KARTLARI ⇄ DERS KARTLARI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                  {/* 1. SOL SÜTUN: SINIF / KADEME KARTLARI (lg:col-span-4) */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <GraduationCap size={15} className="text-amber-600" />
                        <span>Sınıf Kademeleri ({grades.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                      {grades.map(g => {
                        const subjects = examSubjectsByGrade[g] || [];
                        const majorCount = subjects.filter(s => s.isMajor).length;
                        const isSelected = selectedGrade === g;
                        const sections = getGradeSections(g, classrooms);

                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setSelectedGrade(g)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                              isSelected
                                ? 'bg-amber-50/90 border-2 border-amber-500 shadow-sm ring-2 ring-amber-500/30'
                                : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-black text-xs sm:text-sm text-slate-900">
                                {getGradeTitle(g)}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                                {subjects.length} Ders
                              </span>
                            </div>

                            {/* Şubeler Rozeti */}
                            <div className="flex items-center justify-between text-[11px] w-full pt-1 border-t border-slate-200/60">
                              <span className="text-slate-500 font-medium truncate">
                                Şubeler: {sections.length > 0 ? sections.map(s => s.name).join(', ') : 'Belirtilmedi'}
                              </span>
                              <span className="text-amber-800 font-bold shrink-0">
                                {majorCount} Ana Ders
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. SAĞ SÜTUN: SEÇİLİ KADEMENİN DERSLERİ & ŞUBE UYGULAMA (lg:col-span-8) */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <span>{getGradeTitle(selectedGrade)} Sınav Dersleri</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {(examSubjectsByGrade[selectedGrade] || []).length} Ders
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Her dersin uygulanacağı şubeleri seçebilir ve ana ders önceliğini belirleyebilirsiniz.
                        </p>
                      </div>

                      {/* Hızlı Yeni Ders Ekleme Açılır Butonu */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          {activeGradeSections.length} Şube Mevcut
                        </span>
                      </div>
                    </div>

                    {/* Hızlı Ders Ekleme Formu */}
                    <form onSubmit={handleAddSubject} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Plus size={14} className="text-amber-600" />
                        <span>{getGradeTitle(selectedGrade)} Kademesine Yeni Ders Ekle</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            placeholder="Ders Adı (Örn: Matematik, Fizik)..."
                            value={newSubName}
                            onChange={(e) => {
                              setNewSubName(e.target.value);
                              setNewSubGrade(selectedGrade);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={newSubIsMajor}
                              onChange={(e) => setNewSubIsMajor(e.target.checked)}
                              className="rounded text-amber-600 focus:ring-0"
                            />
                            <span>⭐ Ana Ders</span>
                          </label>
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus size={13} />
                            <span>Dersi Ekle</span>
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Sınav Dersleri Kartları Listesi */}
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                      {(!examSubjectsByGrade[selectedGrade] || examSubjectsByGrade[selectedGrade].length === 0) ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          Bu kademe için henüz sınav dersi tanımlanmadı. Yukarıdan ekleyebilir veya ders programından aktarabilirsiniz.
                        </div>
                      ) : (
                        examSubjectsByGrade[selectedGrade].map(sub => {
                          const soft = getSubjectSoftColor(sub.name);
                          const gradeSections = activeGradeSections.map(c => c.name);
                          const appliedSecs = sub.appliedSections !== undefined ? sub.appliedSections : gradeSections;

                          return (
                            <div
                              key={sub.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${soft.bg} ${soft.border} ${soft.text}`}
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-extrabold text-sm truncate">
                                    {sub.name}
                                  </span>
                                  {sub.isMajor && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                      ⭐ Ana Ders (1. Seans)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Ana Ders Toggle Butonu */}
                                  <button
                                    type="button"
                                    onClick={() => toggleExamSubjectMajor(selectedGrade, sub.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      sub.isMajor 
                                        ? 'bg-amber-600 text-white border-amber-700' 
                                        : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
                                    }`}
                                    title="Ana ders olarak işaretle (Günde en fazla 1 adet ve 1. seansta uygulanır)"
                                  >
                                    {sub.isMajor ? '★ Ana Ders' : '☆ Yan Ders Yap'}
                                  </button>

                                  {/* Dersi Sil Butonu */}
                                  <button
                                    type="button"
                                    onClick={() => deleteExamSubject(selectedGrade, sub.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Dersi Sil"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Uygulanacak Şubeler Seçimi (KULLANICI TALEBİ) */}
                              {activeGradeSections.length > 0 && (
                                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-bold text-slate-600 mr-1">
                                      Uygulanacak Şubeler:
                                    </span>
                                    {activeGradeSections.map(sec => {
                                      const isSecSelected = appliedSecs.includes(sec.name);

                                      return (
                                        <button
                                          key={sec.id}
                                          type="button"
                                          onClick={() => handleToggleSubjectSection(selectedGrade, sub.id, sec.name)}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer border ${
                                            isSecSelected
                                              ? 'bg-white text-slate-900 border-slate-400 shadow-2xs'
                                              : 'bg-transparent text-slate-400 border-transparent hover:border-slate-300 line-through'
                                          }`}
                                          title={isSecSelected ? `${sec.name} şubesinde bu sınav yapılacak` : `${sec.name} hariç tutuldu`}
                                        >
                                          {sec.name}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleAllSections(selectedGrade, sub.id)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                  >
                                    {appliedSecs.length === activeGradeSections.length ? 'Temizle' : 'Tüm Şubeler'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 3. DİKEY MENÜ İÇERİĞİ: DAĞITIM & ÇIKAR                 */}
            {/* 🌟 GÜNLER SÜTUNLARDA · SEANSLAR & KADEMELER SATIRLARDA */}
            {/* 🌟 SOFT PASTEL RENKLER & DERS KODLARI GİZLİ            */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'distribution' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Dağıtım Durumu ve Üst Kontrol */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider mb-1">
                        <Sparkles size={14} />
                        <span>3. Adım: Sınav Takvimi Tablosu</span>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Okul Ortak Sınav Takvimi
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Excel İndir</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        title="A4 Yatay tek sayfaya sığdırılmış resmi okul sınav panosunu yazdır"
                      >
                        <Printer size={15} />
                        <span>Yazdır (A4 Yatay)</span>
                      </button>

                      <button
                        onClick={handleGenerate}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles size={15} />
                        <span>Yeniden Dağıt</span>
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
                              ? `Dağıtım Başarılı: ${workingDays.length} sınav gününde ${examResult.totalSubjects} sınav yerleştirildi!` 
                              : `Kısmi Dağıtım: ${examResult.unassigned?.length || 0} ders sığdırılamadı.`}
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {examResult.success 
                              ? 'Tüm okul aynı gün Matematik ve Edebiyat sınavına giriyor. Ana dersler günde 1 tane ve 1. seansta.'
                              : 'Sığmayan dersler için lütfen 1. menüden takvim günlerini artırın.'}
                          </div>
                        </div>
                      </div>
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
                        Tüm okul için ortak sınav günleri, seanslar ve soft renklerle sınav dağıtımını başlatın.
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
                {/* 📄 YENİ RESMİ ÇIKTI TABLOSU                             */}
                {/* 🌟 GÜNLER SÜTUNDA · SEANSLAR & KADEMELER SATIRLARDA     */}
                {/* 🌟 SOFT PASTEL RENKLER & DERS KODLARI GİZLİ            */}
                {/* ======================================================= */}
                {examSchedule && (
                  <div className="print-page-fit bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none print:rounded-none">
                    
                    {/* Resmi Kurum Başlığı (Yazdırıldığında da görünür) */}
                    <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/60 print:bg-white print:border-black print:p-2">
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest print:text-black">
                          T.C. MİLLİ EĞİTİM BAKANLIĞI
                        </div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900 print:text-black mt-0.5">
                          {settings?.schoolName || 'Okul'} — Ortak Yazılı Sınav Takvimi
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 print:text-gray-800 mt-0.5">
                          Tarih Aralığı: {examSettings.startDate} — {examSettings.endDate} &nbsp;|&nbsp; Günlük Seanslar: {examSlots.join('. ve ')}. Ders Saatleri
                        </p>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Resmi Okul Panosu
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Printer size={14} />
                          <span>Yazdır (A4)</span>
                        </button>
                      </div>
                    </div>

                    {/* YENİ RESMİ MATRİS TABLOSU */}
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="print-matrix-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider print:bg-gray-200 print:text-black print:border-black">
                            <th className="p-3 w-28 text-center border-r border-slate-300 print:border-black print:p-1">
                              Seans
                            </th>
                            <th className="p-3 w-32 text-center border-r border-slate-300 print:border-black print:p-1">
                              Kademe / Sınıf
                            </th>
                            {workingDays.map(day => (
                              <th 
                                key={day.date} 
                                className="p-2.5 text-center border-l border-slate-300 print:border-black print:p-1 min-w-[110px]"
                              >
                                <div className="font-black text-xs print:text-black">{day.dayName}</div>
                                <div className="text-[10px] font-mono opacity-75 print:text-black">{day.date}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 print:divide-black">
                          {examSlots.map((slot, si) => (
                            <React.Fragment key={`slot-group-${slot}`}>
                              {grades.map((grade, gi) => {
                                const allGradeSections = getGradeSections(grade, classrooms);

                                return (
                                  <tr key={`${slot}-${grade}`} className="hover:bg-slate-50/70 transition-colors print:hover:bg-white">
                                    
                                    {/* SEANS BAŞLIĞI (rowSpan ile sadece ilk kademe satırında çizilir) */}
                                    {gi === 0 && (
                                      <td 
                                        rowSpan={grades.length} 
                                        className="p-2 font-black text-center align-middle border-r border-slate-300 bg-slate-100/90 text-slate-900 print:bg-gray-100 print:text-black print:border-black"
                                      >
                                        <div className="text-xs sm:text-sm font-black">
                                          {si + 1}. Seans
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 print:text-black mt-0.5">
                                          ({slot}. Ders Saati)
                                        </div>
                                        {si === 0 && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold block mt-1 print:hidden">
                                            Ana Dersler
                                          </span>
                                        )}
                                      </td>
                                    )}

                                    {/* KADEME ADI */}
                                    <td className="p-2 font-black text-center border-r border-slate-300 bg-slate-50/60 text-slate-900 print:bg-white print:text-black print:border-black whitespace-nowrap">
                                      <div className="text-xs">{getGradeTitle(grade)}</div>
                                      {getGradeBadge(grade) && (
                                        <div className="text-[9px] text-slate-500 font-normal print:hidden">{getGradeBadge(grade)}</div>
                                      )}
                                    </td>

                                    {/* GÜNLERE GÖRE SINAV HÜCRELERİ (DERS KODLARI GÖSTERİLMEZ!) */}
                                    {workingDays.map(day => {
                                      const sub = examSchedule?.[grade]?.[day.date]?.[slot];

                                      return (
                                        <td 
                                          key={`${grade}-${day.date}-${slot}`} 
                                          className="p-1.5 text-center border-l border-slate-200 print:border-black print:p-0.5 align-middle"
                                        >
                                          {sub ? (
                                            (() => {
                                              const soft = getSubjectSoftColor(sub.name);
                                              const isSectionFiltered = sub.appliedSections && sub.appliedSections.length > 0 && sub.appliedSections.length < allGradeSections.length;

                                              return (
                                                <div className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all ${soft.bg} ${soft.border} ${soft.text} shadow-2xs print:border-black print:bg-white print:p-0.5 print:rounded-none`}>
                                                  {/* DERS ADI (BÜYÜK VE OKUNAKLI) */}
                                                  <div className="font-black text-xs leading-tight print:text-black" title={sub.name}>
                                                    {sub.name}
                                                  </div>

                                                  {/* ANA DERS İŞARETİ */}
                                                  {sub.isMajor && (
                                                    <div className="text-[9px] font-bold opacity-80 mt-0.5 print:text-black">
                                                      ⭐ Ana Ders
                                                    </div>
                                                  )}

                                                  {/* ŞUBE FİLTRESİ (TÜM ŞUBELER DEĞİLSE GÖSTER) */}
                                                  {isSectionFiltered && (
                                                    <div className="text-[9px] font-bold opacity-80 mt-0.5 print:text-black truncate" title={`Şubeler: ${sub.appliedSections.join(', ')}`}>
                                                      ({sub.appliedSections.join(', ')})
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <div className="text-center text-slate-300 print:text-gray-300 text-xs italic select-none">
                                              —
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}

                                  </tr>
                                );
                              })}
                            </React.Fragment>
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

              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
