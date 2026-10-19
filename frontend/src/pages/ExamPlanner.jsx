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
  Filter,
  Move
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import {
  getWorkingDaysBetween,
  formatExamDay,
  DEFAULT_EXAM_SUBJECTS,
  buildPlacementsFromSchedule,
  checkBranchAvailabilityOnDay,
  getSubjectBranchTeachers,
  normalizeTr
} from '../utils/examEngine';
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
    teachers,
    classrooms,
    timetable,
    examSettings,
    examSubjectsByGrade,
    examSchedule,
    examPlacements,
    examResult,
    updateExamSettings,
    setExamSubjectsByGrade,
    toggleExamSubjectMajor,
    updateExamSubjectMebConfig,
    addExamSubject,
    deleteExamSubject,
    generateExamSchedule,
    setExamPlacements,
    clearExamSchedule
  } = useAppStore();

  // 3 Dikey Menü Sekmesi: 'settings' | 'subjects' | 'distribution'
  const [activeMenu, setActiveMenu] = useState((examSchedule || (examPlacements && examPlacements.length > 0)) ? 'distribution' : 'settings');
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
  const sortedExamSlots = useMemo(() => [...examSlots].sort((a, b) => a - b), [examSlots]);

  // 1. Menü: Tarih Aralığı Günleri (Varsayılan iş günleri)
  const allRangeDays = useMemo(() => {
    return getWorkingDaysBetween(examSettings?.startDate || "2026-11-02", examSettings?.endDate || "2026-11-13");
  }, [examSettings?.startDate, examSettings?.endDate]);

  // Kullanıcının interaktif olarak seçtiği günler (Sadece mevcut tarih aralığındaki geçerli günleri baz alır)
  const selectedDatesList = useMemo(() => {
    const rangeSet = new Set(allRangeDays.map(d => d.date));
    if (examSettings?.selectedDates && Array.isArray(examSettings.selectedDates)) {
      const validInRange = examSettings.selectedDates.filter(d => rangeSet.has(d));
      // Eğer kayıtlı tarihler eski bir yıldan/aralıktan kalmışsa ve mevcut aralıkla hiç eşleşmiyorsa (ancak dizi boş değilse), mevcut aralığın tüm günlerini seçili yap
      if (examSettings.selectedDates.length > 0 && validInRange.length === 0) {
        return allRangeDays.map(d => d.date);
      }
      return validInRange;
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

  // Sadece sınav yapılacak seçili tarihler (Tatiller ve hafta sonları hariç - sütun genişliğini artırmak için)
  const allSelectedRangeDates = useMemo(() => {
    return workingDays.map(d => d.date);
  }, [workingDays]);

  const halfLength = Math.ceil(allSelectedRangeDates.length / 2);
  const firstRowDates = allSelectedRangeDates.slice(0, halfLength);
  const secondRowDates = allSelectedRangeDates.slice(halfLength);

  // 🛡️ Her ders için Zümre Öğretmenleri ve Seçili Günlerdeki Uygunluk Özeti (Memoized)
  const subjectBranchSummaryMap = useMemo(() => {
    const map = new Map();
    const periodsPerDay = settings?.periodsPerDay || 8;
    const uniqueWeekdays = Array.from(new Set(workingDays.map(d => d.dayName).filter(Boolean)));

    Object.values(examSubjectsByGrade || {}).forEach(list => {
      (list || []).forEach(sub => {
        if (!sub?.name) return;
        const norm = normalizeTr(sub.name);
        if (map.has(norm)) return;

        const branchTeachers = getSubjectBranchTeachers(sub.name, sub.code, teachers, classrooms);
        const openDays = [];
        const closedDays = [];

        uniqueWeekdays.forEach(dayName => {
          const check = checkBranchAvailabilityOnDay({
            subjectName: sub.name,
            subjectCode: sub.code,
            dateOrDayName: dayName,
            teachers,
            classrooms,
            timetable,
            periodsPerDay
          });
          if (check.isAvailable) {
            openDays.push(dayName);
          } else {
            closedDays.push(dayName);
          }
        });

        map.set(norm, {
          teacherCount: branchTeachers.length,
          teacherNames: branchTeachers.map(t => t.name),
          openDays,
          closedDays
        });
      });
    });

    return map;
  }, [examSubjectsByGrade, workingDays, teachers, classrooms, timetable, settings?.periodsPerDay]);

  // sinav-takvimi: Aktif sınav yerleşimleri (Sürükle-bırak destekli kartlar)
  const activePlacements = useMemo(() => {
    if (examPlacements && Array.isArray(examPlacements) && examPlacements.length > 0) {
      return examPlacements;
    }
    if (examSchedule) {
      return buildPlacementsFromSchedule(examSchedule, grades, examSlots);
    }
    return [];
  }, [examPlacements, examSchedule, grades, examSlots]);

  // sinav-takvimi: Sürükle ve Bırak (Drag & Drop) İşleyicileri
  const handleDragStart = (e, placementId) => {
    e.dataTransfer.setData("text/plain", placementId);
  };

  const handleDrop = (e, targetDate, targetSlot) => {
    e.preventDefault();
    const placementId = e.dataTransfer.getData("text/plain");
    if (!placementId) return;

    const draggedPlacement = activePlacements.find(p => p.id === placementId);
    if (!draggedPlacement) return;

    if (draggedPlacement.date === targetDate && Number(draggedPlacement.slot) === Number(targetSlot)) {
      return;
    }

    const targetDayObj = formatExamDay(targetDate);
    const targetDayName = targetDayObj?.dayName || targetDate;

    // 🛡️ 1. KONTROL: MEB Ortak Sınavı başka bir güne taşınıyorsa koruma uyarısı
    if (draggedPlacement.isMebExam && draggedPlacement.date !== targetDate) {
      const confirmMove = window.confirm(
        `🏛️ "${draggedPlacement.name}" dersi MEB Ortak Sınavı olarak (${draggedPlacement.mebDate || draggedPlacement.date}) tarihine sabitlenmiştir.\n\nYine de ${targetDayObj?.formatted || targetDate} tarihine taşımak istiyor musunuz?`
      );
      if (!confirmMove) return;
    }

    // 🛡️ 2. KONTROL: Okul içi sınav taşınıyorsa hedef günde zümre öğretmeni okulda mı?
    if (!draggedPlacement.isMebExam) {
      const branchCheck = checkBranchAvailabilityOnDay({
        subjectName: draggedPlacement.name,
        subjectCode: draggedPlacement.code || '',
        dateOrDayName: targetDayName,
        teachers,
        classrooms,
        timetable,
        periodsPerDay: settings?.periodsPerDay || 8
      });

      if (branchCheck.hasTeachers && !branchCheck.isAvailable) {
        const closedNames = branchCheck.unavailableTeachers.map(t => t.name).join(', ');
        showToast(
          `⛔ ${targetDayName} günü "${draggedPlacement.name}" zümresinden hiçbir öğretmen okulda değil (${closedNames})! Bu güne sınav konulamaz.`
        );
        return;
      }
    }

    const updatedPlacements = activePlacements.map(p =>
      p.id === placementId ? { ...p, date: targetDate, slot: Number(targetSlot) } : p
    );
    setExamPlacements(updatedPlacements);
    showToast(`"${draggedPlacement.name}" sınavı ${targetDayName} - ${targetSlot}. Derse taşındı.`);
  };

  // Ders adı normalizasyon yardımcısı (Türkçe karakter duyarlı)
  const normalizeSubName = (str = '') => str.trim().toLocaleLowerCase('tr-TR');

  // 11. Sınıf Otomatik Geçiş, 2026-2027 Dönem Ön Ayarı ve Tarih Aralığı Senkronizasyonu
  useEffect(() => {
    const currentGrades = examSettings?.grades || [];
    let updatedGrades = [...currentGrades];
    const settingsPatch = {};

    if (currentGrades.includes("11") && !currentGrades.includes("11-SAY")) {
      updatedGrades = currentGrades.flatMap(g => g === "11" ? ["11-SAY", "11-EA"] : [g]);
      settingsPatch.grades = updatedGrades;
    }

    if (!examSettings?.schoolYear || examSettings.schoolYear === "2025-2026") {
      settingsPatch.schoolYear = "2026-2027";
    }

    const sDate = examSettings?.startDate === "2025-11-03" ? "2026-11-02" : (examSettings?.startDate || "2026-11-02");
    const eDate = examSettings?.endDate === "2025-11-14" ? "2026-11-13" : (examSettings?.endDate || "2026-11-13");
    if (sDate !== examSettings?.startDate) settingsPatch.startDate = sDate;
    if (eDate !== examSettings?.endDate) settingsPatch.endDate = eDate;

    const rangeDays = getWorkingDaysBetween(sDate, eDate).map(d => d.date);
    const rangeSet = new Set(rangeDays);
    const currentSelected = examSettings?.selectedDates || [];
    const validSelected = currentSelected.filter(d => rangeSet.has(d));

    if (currentSelected.length > 0 && validSelected.length !== currentSelected.length) {
      settingsPatch.selectedDates = validSelected.length > 0 ? validSelected : rangeDays;
    }

    if (Object.keys(settingsPatch).length > 0) {
      updateExamSettings(settingsPatch);
    }

    // 11-SAY ve 11-EA ders havuzunu hazırla + Bir ders bir sınıfta ana ders ise tüm sınıflarda senkronize et
    const basePool = {
      ...examSubjectsByGrade,
      "11-SAY": examSubjectsByGrade?.["11-SAY"] || DEFAULT_EXAM_SUBJECTS["11-SAY"],
      "11-EA": examSubjectsByGrade?.["11-EA"] || DEFAULT_EXAM_SUBJECTS["11-EA"]
    };

    const canonicalMajorByNorm = new Map();
    const gradeOrder = ["9", "10", "11-SAY", "11-EA", "12", ...Object.keys(basePool)];
    gradeOrder.forEach(g => {
      (basePool[g] || []).forEach(s => {
        const norm = normalizeSubName(s.name);
        if (norm && !canonicalMajorByNorm.has(norm)) {
          canonicalMajorByNorm.set(norm, !!s.isMajor);
        }
      });
    });

    let poolChanged = !examSubjectsByGrade?.["11-SAY"] || !examSubjectsByGrade?.["11-EA"];
    const syncedPool = {};
    Object.entries(basePool).forEach(([g, list]) => {
      syncedPool[g] = (list || []).map(s => {
        const norm = normalizeSubName(s.name);
        const targetMajor = canonicalMajorByNorm.has(norm) ? canonicalMajorByNorm.get(norm) : !!s.isMajor;
        if (!!s.isMajor !== targetMajor) poolChanged = true;
        return { ...s, isMajor: targetMajor };
      });
    });

    if (poolChanged) {
      setExamSubjectsByGrade(syncedPool);
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

  // 2. Menü: Ana Ders Yap / Çıkar (Tüm sınıflarda senkronize)
  const handleToggleMajor = (grade, sub) => {
    const nextState = !sub.isMajor;
    toggleExamSubjectMajor(grade, sub.id);
    if (nextState) {
      showToast(`⭐ "${sub.name}" dersi tüm sınıflarda Ana Ders olarak işaretlendi.`);
    } else {
      showToast(`"${sub.name}" dersi tüm sınıflarda ana derslikten çıkarıldı.`);
    }
  };

  // 2. Menü: Ders programı modülünden otomatik çekme (11-SAY/EA ayrımı ve ortak Ana Ders senkronizasyonuyla)
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
        
        // Bir ders bir sınıfta ana ders ise tüm sınıflarda ana ders olmalı
        const isMajor = /EDEB|TDEB|MAT|GEOM|FİZ|FIZ|KİM|KMY|BİY/i.test(rawSubject) || /Matematik|Fizik|Kimya|Biyoloji|Edebiyat/i.test(fullName);

        if (!byGrade[targetGrade].has(fullName)) {
          byGrade[targetGrade].set(fullName, {
            id: `es_${targetGrade}_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 6)}`,
            name: fullName,
            code: co.code || rawSubject.slice(0, 5).toUpperCase(),
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
    showToast(`Ders programından ${detectedGrades.length} grupta toplam ${totalImported} sınav dersi aktarıldı! ✨`);
  };

  // 2. Menü: Varsayılan ders listesine sıfırla
  const handleResetToDefaults = () => {
    setExamSubjectsByGrade(DEFAULT_EXAM_SUBJECTS);
    updateExamSettings({ grades: ALL_POSSIBLE_GRADES });
    setSelectedGrade('9');
    showToast('Tüm kademelerdeki sınav dersleri varsayılan listeye sıfırlandı.');
  };

  // Okuldaki tüm kademelerde tanımlı benzersiz dersler haritası (isim -> { name, code, isMajor })
  const allSchoolSubjectsMap = useMemo(() => {
    const map = new Map();
    Object.values(examSubjectsByGrade || {}).forEach(list => {
      (list || []).forEach(s => {
        const norm = normalizeSubName(s.name);
        if (norm && !map.has(norm)) {
          map.set(norm, { name: s.name, code: s.code, isMajor: !!s.isMajor });
        } else if (norm && s.isMajor) {
          map.get(norm).isMajor = true;
        }
      });
    });
    return map;
  }, [examSubjectsByGrade]);

  // Seçili kademedeki dersler ve dinamik arama eşleşmeleri
  const currentGradeSubjects = useMemo(() => {
    return examSubjectsByGrade[selectedGrade] || [];
  }, [examSubjectsByGrade, selectedGrade]);

  const searchNorm = normalizeSubName(newSubName);

  // Seçili kademede yazılan isimle birebir aynı olan ders var mı?
  const exactDuplicateSubject = useMemo(() => {
    if (!searchNorm) return null;
    return currentGradeSubjects.find(s => normalizeSubName(s.name) === searchNorm) || null;
  }, [currentGradeSubjects, searchNorm]);

  // Seçili kademede yazılan metni içeren mevcut dersler (Dinamik arama gibi filtreleme için)
  const filteredGradeSubjects = useMemo(() => {
    if (!searchNorm) return currentGradeSubjects;
    return currentGradeSubjects.filter(s =>
      normalizeSubName(s.name).includes(searchNorm) ||
      normalizeSubName(s.code || '').includes(searchNorm)
    );
  }, [currentGradeSubjects, searchNorm]);

  // Diğer kademelerde olup bu kademede henüz ekli olmayan ve aramayla eşleşen ders önerileri
  const otherGradeSuggestions = useMemo(() => {
    if (!searchNorm) return [];
    const currentNorms = new Set(currentGradeSubjects.map(s => normalizeSubName(s.name)));
    const suggestions = [];
    allSchoolSubjectsMap.forEach((val, norm) => {
      if (!currentNorms.has(norm) && norm.includes(searchNorm)) {
        suggestions.push(val);
      }
    });
    return suggestions;
  }, [allSchoolSubjectsMap, currentGradeSubjects, searchNorm]);

  // Ders adı yazılırken diğer sınıflarda kayıtlı bir dersle eşleşirse Ana Ders durumunu otomatik senkronize et
  const handleSubjectNameInputChange = (val) => {
    setNewSubName(val);
    setNewSubGrade(selectedGrade);
    const norm = normalizeSubName(val);
    if (norm && allSchoolSubjectsMap.has(norm)) {
      setNewSubIsMajor(!!allSchoolSubjectsMap.get(norm).isMajor);
    }
  };

  // 2. Menü: Manuel ders ekleme (Tekrar ekleme uyarısı + tüm sınıflarda ana ders senkronizasyonu)
  const handleAddSubject = (e) => {
    e.preventDefault();
    const trimmedName = newSubName.trim();
    if (!trimmedName) return;

    const targetGrade = selectedGrade;
    const norm = normalizeSubName(trimmedName);
    const existingInGrade = (examSubjectsByGrade[targetGrade] || []).find(
      s => normalizeSubName(s.name) === norm
    );

    if (existingInGrade) {
      showToast(`⚠️ "${existingInGrade.name}" dersi ${getGradeTitle(targetGrade)} kademesinde zaten ekli!`);
      return;
    }

    // Eğer bu ders başka bir sınıfta varsa onun Ana Ders durumunu koru veya kullanıcının seçimiyle tüm sınıfları eşitle
    const existingGlobal = allSchoolSubjectsMap.get(norm);
    const finalIsMajor = existingGlobal ? (newSubIsMajor || existingGlobal.isMajor) : newSubIsMajor;
    const code = newSubCode.trim() || existingGlobal?.code || trimmedName.slice(0, 5).toUpperCase();

    addExamSubject(targetGrade, {
      name: existingGlobal?.name || trimmedName,
      code: code,
      isMajor: finalIsMajor
    });
    setNewSubName('');
    setNewSubCode('');
    setNewSubIsMajor(false);
    setNewSubSelectedSections([]);
    showToast(`"${existingGlobal?.name || trimmedName}" dersi ${getGradeTitle(targetGrade)} kademesine eklendi.`);
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

  // İlk seans (günün ilk sınavı)
  const firstSlot = [...examSlots].sort((a, b) => a - b)[0] || 2;

  // Seçili kademeye ait okuldaki şubeler
  const activeGradeSections = useMemo(() => {
    return getGradeSections(selectedGrade, classrooms);
  }, [selectedGrade, classrooms]);

  // A4 tek sayfaya sığdırma için dinamik yazı boyutu ve hücre dolgusu (gün ve satır sayısına göre)
  const printFontSizePx = workingDays.length > 11 ? 6.5 : workingDays.length > 8 ? 7.5 : 8.5;
  const totalPrintRows = examSlots.length * grades.length;
  const printCellPadY = totalPrintRows > 12 ? 2 : 3.5;

  return (
    <div className="min-h-screen print:min-h-0 bg-slate-50/70 print:bg-white font-sans text-slate-800 flex flex-col pb-16 print:pb-0">
      
      {/* 🖨️ YAZDIRMA (PRINT / PDF) ÖZEL CSS: sinav-takvimi TEK SAYFA A4 YATAY KART DÜZENİ */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, aside, .print-hide, .print\\:hidden {
            display: none !important;
          }
          main, main > div, main > div > div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
            gap: 0 !important;
          }
          .print-area {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-height: 94vh !important;
            height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
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
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                  
                  {/* Başlık */}
                  <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-700 font-black text-[10px] uppercase tracking-wider">
                        <Sliders size={12} />
                        <span>1. Adım: Yapılandırma</span>
                      </div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Ortak Sınav Tarihi &amp; Seans Yapılandırması
                      </h2>
                    </div>
                  </div>

                  {/* 1. İNTERAKTİF GÜN SEÇİM TAKVİMİ */}
                  <div className="space-y-2.5">
                    {/* Dönem ve Tarih Aralığı Tek Satır Kompakt Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Eğitim-Öğretim Yılı</span>
                        <input
                          type="text"
                          value={examSettings.schoolYear || '2026-2027'}
                          onChange={(e) => updateExamSettings({ schoolYear: e.target.value })}
                          placeholder="2026-2027"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Dönem</span>
                        <select
                          value={examSettings.semester || '1'}
                          onChange={(e) => updateExamSettings({ semester: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="1">1. Dönem</option>
                          <option value="2">2. Dönem</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Sınav No</span>
                        <select
                          value={examSettings.examNo || '1'}
                          onChange={(e) => updateExamSettings({ examNo: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="1">1. Ortak Sınavlar</option>
                          <option value="2">2. Ortak Sınavlar</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Aralık Başlangıç</span>
                        <input
                          type="date"
                          value={examSettings.startDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            const newDays = getWorkingDaysBetween(newStart, examSettings.endDate).map(d => d.date);
                            updateExamSettings({ startDate: newStart, selectedDates: newDays });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Aralık Bitiş</span>
                        <input
                          type="date"
                          value={examSettings.endDate}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            const newDays = getWorkingDaysBetween(examSettings.startDate, newEnd).map(d => d.date);
                            updateExamSettings({ endDate: newEnd, selectedDates: newDays });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    {/* İnteraktif Gün Kartları Grid'i (Kompakt) */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-600">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-slate-800 font-extrabold">Aralıktaki Günler:</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                            Aktif Gün
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                            Kapalı (Tatil)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSelectAllWeekdays}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Tüm Hafta İçi
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAllDays}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Temizle
                          </button>
                          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-black text-[10px]">
                            {workingDays.length} Gün Seçili
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {allRangeDays.map(d => {
                          const isSelected = selectedDatesList.includes(d.date);

                          return (
                            <button
                              key={d.date}
                              type="button"
                              onClick={() => handleToggleDay(d.date)}
                              className={`py-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs hover:bg-emerald-700'
                                  : 'bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300/80'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className={`text-[10px] font-mono font-bold leading-tight ${isSelected ? 'text-emerald-100' : 'text-slate-500 line-through'}`}>
                                  {d.date.slice(5)}
                                </div>
                                <div className={`font-black text-[11px] leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                  {d.dayName}
                                </div>
                              </div>
                              {isSelected ? (
                                <span className="px-1.5 py-0.5 rounded bg-white text-emerald-800 font-extrabold text-[9px] flex items-center gap-0.5 shrink-0">
                                  <Check size={9} strokeWidth={3} />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-300 text-slate-600 text-[9px] font-bold shrink-0">
                                  Kapalı
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ekstra / Özel Gün Ekleme */}
                    <form onSubmit={handleAddCustomDate} className="flex items-center gap-2">
                      <div className="w-40">
                        <input
                          type="date"
                          value={customDateInput}
                          onChange={(e) => setCustomDateInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!customDateInput}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Plus size={12} />
                        <span>Özel Gün Ekle</span>
                      </button>
                    </form>
                  </div>

                  {/* 2. Sınav Seansları (Ders Saatleri - Tek Satır Kompakt) */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                        Günlük Sınav Seansları (Ders Saatleri)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Seçili: {examSlots.join('. ve ')}. Ders
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                        const isSelected = examSlots.includes(slot);
                        const isFirst = slot === firstSlot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleToggleSlot(slot)}
                            className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <span className="font-extrabold text-[11px] leading-tight">{slot}. Ders</span>
                            {isSelected && (
                              <span className={`text-[9px] px-1 py-0 rounded font-semibold leading-tight ${
                                isFirst ? 'bg-amber-800 text-white' : 'bg-white/20 text-white'
                              }`}>
                                {isFirst ? '1. Seans' : 'Seçili'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. SINIF KADEMESİ YÖNETİMİ (Kompakt) */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                        Dahil Edilecek Sınıf &amp; Alan Kademeleri
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddGradeInput(!showAddGradeInput)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus size={11} />
                        <span>Kademe Ekle</span>
                      </button>
                    </div>

                    {/* Yeni Kademe Ekleme Formu */}
                    {showAddGradeInput && (
                      <form onSubmit={handleAddNewGrade} className="p-2 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder="Kademe Adı (Örn: 11-SÖZ, 12-SAY, Hazırlık)..."
                          value={newGradeName}
                          onChange={(e) => setNewGradeName(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Ekle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddGradeInput(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    )}

                    {/* Mevcut Kademeler Listesi */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                      {grades.map(g => {
                        const isSelected = grades.includes(g);
                        const isCustom = !ALL_POSSIBLE_GRADES.includes(g);

                        return (
                          <div
                            key={g}
                            onClick={() => handleToggleGrade(g)}
                            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border text-center relative group flex items-center justify-center gap-1.5 ${
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
                                <X size={9} />
                              </button>
                            )}
                            <span>{getGradeTitle(g)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearSchedule}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} className="text-rose-600" />
                      <span>Sınav Takvimini Sıfırla</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('Tarih ve seans ayarları kaydedildi.')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Ayarları Kaydet
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMenu('subjects')}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>2. Adım: Dersleri Belirle</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 2. DİKEY MENÜ İÇERİĞİ: OKULDA BULUNAN DERSLER          */}
            {/* 🌟 KOMPAKT YAZI PUNTOLARI & KAYDIRMADAN SIĞAN DERSLER   */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'subjects' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                
                {/* ÜST EYLEM KARTI (OTOMATİK ÇEKME & SIFIRLAMA) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-700 font-black text-[10px] uppercase tracking-wider">
                      <BookOpen size={12} />
                      <span>2. Adım: Sınav Dersleri &amp; Ana Ders Seçimi</span>
                    </div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      Sınav Dersleri Yönetimi
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Varsayılan MEB ortak sınav ders listesini yükler"
                    >
                      <RefreshCw size={12} />
                      <span>Varsayılanları Yükle</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoImportFromTimetable}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      title="Ders programındaki dersleri otomatik çeker"
                    >
                      <Sparkles size={13} />
                      <span>Ders Programından Otomatik Aktar</span>
                    </button>
                  </div>
                </div>

                {/* 2 KOLONLU EŞLEŞTİRME MASASI: SINIF KARTLARI ⇄ DERS KARTLARI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">

                  {/* 1. SOL SÜTUN: SINIF / KADEME KARTLARI (lg:col-span-3) */}
                  <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <GraduationCap size={13} className="text-amber-600" />
                        <span>Kademeler ({grades.length})</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {grades.map(g => {
                        const subjects = examSubjectsByGrade[g] || [];
                        const majorCount = subjects.filter(s => s.isMajor).length;
                        const isSelected = selectedGrade === g;

                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setSelectedGrade(g)}
                            className={`w-full py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                              isSelected
                                ? 'bg-amber-50/90 border-2 border-amber-500 shadow-2xs'
                                : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-extrabold text-xs text-slate-900">
                                {getGradeTitle(g)}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0 rounded-full bg-white border border-slate-200 text-slate-700">
                                {subjects.length} Ders
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] w-full text-slate-500">
                              <span className="truncate">Ortak sınav</span>
                              <span className="text-amber-800 font-bold shrink-0">
                                {majorCount} Ana Ders
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. SAĞ SÜTUN: SEÇİLİ KADEMENİN DERSLERİ (lg:col-span-9) */}
                  <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {getGradeTitle(selectedGrade)} Sınav Dersleri
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {currentGradeSubjects.length} Ders
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Bir ders bir sınıfta <strong>Ana Ders</strong> seçildiğinde tüm sınıflarda otomatik Ana Ders olur.
                      </span>
                    </div>

                    {/* Hızlı Ders Ekleme & Dinamik Arama Formu (Kompakt) */}
                    <form onSubmit={handleAddSubject} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6 relative">
                          <input
                            type="text"
                            placeholder="Yeni Ders Ekle veya Mevcut Dersi Ara (Örn: Matematik)..."
                            value={newSubName}
                            onChange={(e) => handleSubjectNameInputChange(e.target.value)}
                            className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 font-bold focus:outline-none focus:ring-2 ${
                              exactDuplicateSubject
                                ? 'border-rose-400 focus:ring-rose-500/30 bg-rose-50/30'
                                : 'border-slate-200 focus:ring-amber-500'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => setNewSubIsMajor(!newSubIsMajor)}
                            className={`w-full h-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              newSubIsMajor
                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                : 'bg-white hover:bg-amber-50/60 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Star size={11} className={newSubIsMajor ? 'fill-white text-white' : 'text-amber-500'} />
                            <span>{newSubIsMajor ? 'Ana Ders (Aktif)' : 'Ana Ders Yap'}</span>
                          </button>
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-1">
                          <button
                            type="submit"
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs transition-all ${
                              exactDuplicateSubject
                                ? 'bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            {exactDuplicateSubject ? (
                              <>
                                <AlertCircle size={12} />
                                <span>Zaten Ekli</span>
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                <span>Dersi Ekle</span>
                              </>
                            )}
                          </button>
                          {newSubName && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewSubName('');
                                setNewSubIsMajor(false);
                              }}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer"
                              title="Aramayı Temizle"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Birebir Tekrar Eden Ders Uyarısı */}
                      {exactDuplicateSubject && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                          <AlertCircle size={13} className="text-rose-600 shrink-0" />
                          <span>
                            <strong>"{exactDuplicateSubject.name}"</strong> dersi {getGradeTitle(selectedGrade)} kademesinde zaten ekli!
                          </span>
                        </div>
                      )}

                      {/* Yazarken Dinamik Eşleşen Ekli Dersler ve Diğer Sınıflardaki Ders Önerileri */}
                      {searchNorm && !exactDuplicateSubject && (filteredGradeSubjects.length > 0 || otherGradeSuggestions.length > 0) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200/90 space-y-1.5 text-[11px]">
                          {otherGradeSuggestions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500">
                                Diğer sınıflardan hazır seç:
                              </span>
                              {otherGradeSuggestions.map(sug => (
                                <button
                                  key={sug.name}
                                  type="button"
                                  onClick={() => {
                                    setNewSubName(sug.name);
                                    setNewSubIsMajor(!!sug.isMajor);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 font-bold text-[10px] cursor-pointer transition-colors"
                                >
                                  + {sug.name} {sug.isMajor ? '(⭐)' : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </form>

                    {/* Sınav Dersleri Kartları Listesi (2 Sütunlu Kompakt Grid - Kaydırmadan Sığar) */}
                    <div>
                      {currentGradeSubjects.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          Bu kademe için henüz sınav dersi tanımlanmadı. Yukarıdan ekleyebilir veya ders programından aktarabilirsiniz.
                        </div>
                      ) : filteredGradeSubjects.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200">
                          <strong>"{newSubName.trim()}"</strong> {getGradeTitle(selectedGrade)} kademesinde henüz ekli değil. <strong>Dersi Ekle</strong> butonuna tıklayarak hemen ekleyebilirsiniz.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredGradeSubjects.map(sub => {
                            const soft = getSubjectSoftColor(sub.name);
                            const isExactMatch = exactDuplicateSubject && exactDuplicateSubject.id === sub.id;
                            const branchSummary = subjectBranchSummaryMap.get(normalizeTr(sub.name));

                            return (
                              <div
                                key={sub.id}
                                className={`py-2 px-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${soft.bg} ${soft.border} ${soft.text} ${
                                  isExactMatch ? 'ring-2 ring-rose-500 shadow-xs' : ''
                                } ${sub.isMebExam ? 'ring-2 ring-purple-500/70' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="font-bold text-[11px] truncate">
                                      {sub.name}
                                    </span>
                                    {sub.isMajor && (
                                      <span className="text-[9px] font-black px-1.5 py-0 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                        ⭐ Ana
                                      </span>
                                    )}
                                    {sub.isMebExam && (
                                      <span className="text-[9px] font-black px-1.5 py-0 rounded-full bg-purple-700 text-white border border-purple-800 shrink-0">
                                        🏛️ MEB Ortak
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* MEB Ortak Sınav Yap Toggle Butonu */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextMeb = !sub.isMebExam;
                                        const defaultDate = sub.mebDate || workingDays[0]?.date || examSettings.startDate;
                                        updateExamSubjectMebConfig(selectedGrade, sub.id, {
                                          isMebExam: nextMeb,
                                          mebDate: nextMeb ? defaultDate : null,
                                          mebSlot: nextMeb ? (sub.mebSlot || firstSlot) : null
                                        }, false);
                                        showToast(
                                          nextMeb
                                            ? `🏛️ "${sub.name}" (${getGradeTitle(selectedGrade)}) MEB Ortak Sınavı olarak işaretlendi.`
                                            : `"${sub.name}" MEB ortak sınavından çıkarıldı.`
                                        );
                                      }}
                                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                        sub.isMebExam
                                          ? 'bg-purple-700 hover:bg-purple-800 text-white border-purple-800'
                                          : 'bg-white/90 hover:bg-purple-50 text-slate-700 hover:text-purple-900 border-slate-300 hover:border-purple-300'
                                      }`}
                                      title="MEB tarafından tarihi önceden belirlenen ortak sınav olarak sabitle (Zümre boş gün şartı aranmaz)"
                                    >
                                      <span>🏛️ MEB</span>
                                    </button>

                                    {/* Ana Ders Yap Toggle Butonu */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMajor(selectedGrade, sub)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                        sub.isMajor 
                                          ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700' 
                                          : 'bg-white/90 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-300 hover:border-amber-300'
                                      }`}
                                      title={
                                        sub.isMajor
                                          ? 'Ana derslikten çıkarmak için tıklayın'
                                          : 'Ana ders yapmak için tıklayın'
                                      }
                                    >
                                      <Star size={10} className={sub.isMajor ? 'fill-white text-white' : 'text-amber-500'} />
                                      <span>{sub.isMajor ? 'Ana Ders' : 'Ana Yap'}</span>
                                    </button>

                                    {/* Dersi Sil Butonu */}
                                    <button
                                      type="button"
                                      onClick={() => deleteExamSubject(selectedGrade, sub.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Dersi Sil"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Zümre Öğretmen Uygunluk Bilgisi */}
                                {branchSummary && (
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[9.5px] opacity-90">
                                    <span
                                      className="inline-flex items-center gap-1 font-semibold text-slate-600"
                                      title={branchSummary.teacherNames.join(', ') || 'Zümre öğretmeni tanımlı değil'}
                                    >
                                      <Users size={10} className="text-slate-500" />
                                      {branchSummary.teacherCount > 0
                                        ? `Zümre: ${branchSummary.teacherCount} Öğrt.`
                                        : 'Zümre tanımlı değil (Esnek)'}
                                    </span>
                                    {!sub.isMebExam && branchSummary.closedDays.length > 0 && (
                                      <span className="px-1.5 py-0 rounded bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                                        ⛔ {branchSummary.closedDays.join(', ')} zümre kapalı
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* MEB Ortak Sınav Tarih ve Seans Seçici Panel */}
                                {sub.isMebExam && (
                                  <div className="mt-0.5 pt-1.5 border-t border-purple-200/80 bg-white/95 rounded-lg p-1.5 flex flex-wrap items-center justify-between gap-1.5 text-slate-800">
                                    <div className="flex items-center gap-1 flex-1 min-w-[130px]">
                                      <span className="text-[9px] font-black text-purple-800 uppercase shrink-0">Tarih:</span>
                                      <select
                                        value={sub.mebDate || workingDays[0]?.date || ''}
                                        onChange={(e) =>
                                          updateExamSubjectMebConfig(selectedGrade, sub.id, {
                                            isMebExam: true,
                                            mebDate: e.target.value,
                                            mebSlot: sub.mebSlot || firstSlot
                                          }, false)
                                        }
                                        className="flex-1 bg-white border border-purple-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        {workingDays.map(d => (
                                          <option key={d.date} value={d.date}>
                                            {d.formatted}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] font-black text-purple-800 uppercase shrink-0">Seans:</span>
                                      <select
                                        value={sub.mebSlot || firstSlot}
                                        onChange={(e) =>
                                          updateExamSubjectMebConfig(selectedGrade, sub.id, {
                                            isMebExam: true,
                                            mebDate: sub.mebDate || workingDays[0]?.date,
                                            mebSlot: Number(e.target.value)
                                          }, false)
                                        }
                                        className="bg-white border border-purple-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        {sortedExamSlots.map(s => (
                                          <option key={s} value={s}>{s}. Ders</option>
                                        ))}
                                      </select>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateExamSubjectMebConfig(selectedGrade, sub.id, {
                                          isMebExam: true,
                                          mebDate: sub.mebDate || workingDays[0]?.date,
                                          mebSlot: sub.mebSlot || firstSlot
                                        }, true);
                                        showToast(`🏛️ "${sub.name}" MEB tarihi tüm kademelerde senkronize edildi.`);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 font-bold text-[9.5px] cursor-pointer transition-colors"
                                      title="Bu MEB sınav tarihini ve seansını diğer kademelerdeki aynı isimli derse de uygula"
                                    >
                                      Tüm Kademelere Uygula
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 3. DİKEY MENÜ İÇERİĞİ: DAĞITIM & ÇIKTILAR               */}
            {/* 🌟 sinav-takvimi OLUŞTUR VE YAZDIR EKRANI               */}
            {/* 🌟 SÜRÜKLE-BIRAK İLE DEĞİŞİKLİK & SADE A4 KART ÇIKTISI  */}
            {/* ------------------------------------------------------- */}
            {activeMenu === 'distribution' && (
              <div className="space-y-4 print:space-y-0 animate-in fade-in duration-200">
                
                {/* Üst Kontrol Çubuğu (YAZDIRMA SIRASINDA GİZLENİR) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-700 font-black text-[11px] uppercase tracking-wider">
                          <Sparkles size={13} />
                          <span>3. Adım: Oluştur &amp; Yazdır</span>
                        </div>
                        <h2 className="text-base font-extrabold text-slate-900">
                          Ortak Sınav Programı (Sürükle-Bırak Düzenleme)
                        </h2>
                      </div>

                      {activePlacements.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold pl-2 border-l border-slate-200">
                          <span className="flex items-center gap-1.5 text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                            🏛️ MEB Ortak Sınavı
                          </span>
                          <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                            Kırmızı: Ana / Önemli Ders
                          </span>
                          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                            Mavi: Diğer Ders
                          </span>
                          <span className="text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Move className="w-3.5 h-3.5 text-slate-600" />
                            Dersleri sürükleyip bırakarak yer değiştirebilirsiniz
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-bold shadow-xs text-xs cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{activePlacements.length > 0 ? 'Yeniden Oluştur' : 'Programı Oluştur'}</span>
                      </button>

                      {activePlacements.length > 0 && (
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition font-bold shadow-xs text-xs cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Programı Yazdır</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dağıtım Özeti / Uyarılar */}
                  {examResult && !examResult.success && (
                    <div className="p-3 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-950 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <span>
                          {examResult.unassigned?.length || 0} ders sığdırılamadı. Sığmayan dersler için 1. adımdan sınav günlerini artırabilir veya kartları sürükleyip bırakarak düzenleyebilirsiniz:
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5 pl-1">
                        {(examResult.unassigned || []).map((u, idx) => (
                          <li key={idx}>
                            <strong>{getGradeTitle(u.grade)} - {u.subject?.name}:</strong> {u.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* HENÜZ DAĞITILMADIYSA ÇAĞRI KARTI */}
                {activePlacements.length === 0 && (
                  <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs my-6 space-y-4 print:hidden">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto shadow-2xs">
                      📝
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Ortak Sınav Takvimi Henüz Oluşturulmadı</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        Sade A4 yatay kart görünümü ve sürükle-bırak düzenleme özelliğiyle sınav programını hemen oluşturun.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      <span>Şimdi Sınav Programını Oluştur</span>
                    </button>
                  </div>
                )}

                {/* ======================================================= */}
                {/* 📄 sinav-takvimi OLUŞTUR & YAZDIR EKRANI (PRINT-AREA)   */}
                {/* 🌟 2 SATIRLI GÜN KARTLARI · SÜRÜKLE-BIRAK DESTEKLİ      */}
                {/* ======================================================= */}
                {activePlacements.length > 0 && (
                  <div className="print-area w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-auto min-h-[75vh] flex flex-col justify-between">
                    
                    {/* Üst Resmi Başlık */}
                    <div className="text-center border-b-4 border-double border-black pb-1 mb-2 print:mb-1.5 flex-shrink-0">
                      <h1 className="text-base print:text-sm font-black tracking-wide m-0 uppercase text-black">
                        {settings?.schoolName || 'OKUL ADI GİRİLMEDİ'}
                      </h1>
                      <h2 className="text-[11px] print:text-[10px] font-bold uppercase mt-0.5 tracking-wider text-black">
                        {examSettings?.schoolYear || '2026-2027'} EĞİTİM ÖĞRETİM YILI {examSettings?.semester || '1'}. DÖNEM {(examSettings?.examNo || '1') === '1' ? '1. ORTAK' : '2. ORTAK'} GENEL YAZILI SINAV PROGRAMI
                      </h2>
                    </div>

                    {/* 2 Satırlı Gün Kartları Alanı (Sadece Sınav Yapılan Tarihler) */}
                    <div className="flex-1 flex flex-col gap-3 print:gap-1.5 justify-between">
                      {/* 1. Satır Günler */}
                      <div className="flex-1 flex gap-2 print:gap-1.5 w-full items-stretch">
                        {firstRowDates.map(dateStr => (
                          <div
                            key={dateStr}
                            className="flex-1 min-w-0 border border-black rounded bg-white flex flex-col shadow-sm"
                          >
                            <div className="bg-gray-800 text-white py-1 px-1 text-center font-bold text-[10px] print:text-[9px] uppercase border-b border-black shrink-0">
                              {new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </div>
                            <div className="flex-1 flex flex-col p-1.5 print:p-1 gap-1.5 print:gap-1 bg-gray-50/30">
                              {sortedExamSlots.map(slot => {
                                const slotPlacements = activePlacements.filter(
                                  pl => pl.date === dateStr && Number(pl.slot) === Number(slot)
                                );
                                return (
                                  <div
                                    key={`${dateStr}-${slot}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, dateStr, slot)}
                                    style={{ flexGrow: Math.max(1, slotPlacements.length), flexBasis: 'auto' }}
                                    className="flex flex-col border border-dashed border-gray-300 rounded p-1.5 print:p-1 bg-white transition-colors hover:bg-blue-50/30 min-h-[54px] print:min-h-[34px]"
                                  >
                                    <div className="text-[9px] print:text-[8px] font-bold text-blue-600 mb-1 print:mb-0.5 border-b border-gray-100 pb-0.5 print:pb-0 shrink-0">
                                      {slot}. Ders
                                    </div>
                                    <div className="flex flex-col gap-1 print:gap-0.5">
                                      {slotPlacements.map(p => (
                                        <div
                                          key={p.id}
                                          draggable={true}
                                          onDragStart={(e) => handleDragStart(e, p.id)}
                                          className={`p-1 print:p-0.5 rounded border text-left leading-none cursor-grab active:cursor-grabbing flex items-start justify-between group/item ${
                                            p.isMebExam
                                              ? 'bg-purple-50 border-purple-300'
                                              : p.isMajor
                                              ? 'bg-red-50 border-red-200'
                                              : 'bg-blue-50 border-blue-200'
                                          }`}
                                        >
                                          <div className="w-full min-w-0">
                                            <div className="font-black text-[10px] print:text-[8.5px] text-black uppercase tracking-tight leading-tight flex items-center gap-1 flex-wrap">
                                              <span>{p.name}</span>
                                              {p.isMebExam && (
                                                <span className="px-1 py-0 rounded bg-purple-700 text-white text-[8px] print:text-[7px] font-extrabold shrink-0">
                                                  MEB
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[8px] print:text-[7px] font-bold text-gray-600 mt-0.5 print:mt-0 leading-tight">
                                              Sınıf: {(p.levels || []).join(', ')}
                                            </div>
                                          </div>
                                          <Move className="w-3 h-3 text-gray-400 opacity-0 group-hover/item:opacity-100 flex-shrink-0 ml-1 print:hidden" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 2. Satır Günler */}
                      {secondRowDates.length > 0 && (
                        <div className="flex-1 flex gap-2 print:gap-1.5 w-full items-stretch">
                          {secondRowDates.map(dateStr => (
                            <div
                              key={dateStr}
                              className="flex-1 min-w-0 border border-black rounded bg-white flex flex-col shadow-sm"
                            >
                              <div className="bg-gray-800 text-white py-1 px-1 text-center font-bold text-[10px] print:text-[9px] uppercase border-b border-black shrink-0">
                                {new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                              <div className="flex-1 flex flex-col p-1.5 print:p-1 gap-1.5 print:gap-1 bg-gray-50/30">
                                {sortedExamSlots.map(slot => {
                                  const slotPlacements = activePlacements.filter(
                                    pl => pl.date === dateStr && Number(pl.slot) === Number(slot)
                                  );
                                  return (
                                    <div
                                      key={`${dateStr}-${slot}`}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => handleDrop(e, dateStr, slot)}
                                      style={{ flexGrow: Math.max(1, slotPlacements.length), flexBasis: 'auto' }}
                                      className="flex flex-col border border-dashed border-gray-300 rounded p-1.5 print:p-1 bg-white transition-colors hover:bg-blue-50/30 min-h-[54px] print:min-h-[34px]"
                                    >
                                      <div className="text-[9px] print:text-[8px] font-bold text-blue-600 mb-1 print:mb-0.5 border-b border-gray-100 pb-0.5 print:pb-0 shrink-0">
                                        {slot}. Ders
                                      </div>
                                      <div className="flex flex-col gap-1 print:gap-0.5">
                                        {slotPlacements.map(p => (
                                          <div
                                            key={p.id}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, p.id)}
                                            className={`p-1 print:p-0.5 rounded border text-left leading-none cursor-grab active:cursor-grabbing flex items-start justify-between group/item ${
                                              p.isMebExam
                                                ? 'bg-purple-50 border-purple-300'
                                                : p.isMajor
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-blue-50 border-blue-200'
                                            }`}
                                          >
                                            <div className="w-full min-w-0">
                                              <div className="font-black text-[10px] print:text-[8.5px] text-black uppercase tracking-tight leading-tight flex items-center gap-1 flex-wrap">
                                                <span>{p.name}</span>
                                                {p.isMebExam && (
                                                  <span className="px-1 py-0 rounded bg-purple-700 text-white text-[8px] print:text-[7px] font-extrabold shrink-0">
                                                    MEB
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[8px] print:text-[7px] font-bold text-gray-600 mt-0.5 print:mt-0 leading-tight">
                                                Sınıf: {(p.levels || []).join(', ')}
                                              </div>
                                            </div>
                                            <Move className="w-3 h-3 text-gray-400 opacity-0 group-hover/item:opacity-100 flex-shrink-0 ml-1 print:hidden" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Alt İmza Alanı */}
                    <div className="mt-2 print:mt-1.5 flex justify-end items-end text-[9px] font-bold text-gray-700 print:text-black px-1 flex-shrink-0">
                      <div className="text-center w-36 border-t border-black pt-1 uppercase text-black text-[9px] font-black">
                        Okul Sınav Komisyonu
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
