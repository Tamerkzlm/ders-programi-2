// frontend/src/pages/DykPlanner.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarDays, 
  Clock, 
  Users, 
  BookOpen, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  GraduationCap,
  LayoutGrid,
  Filter,
  Check,
  Calendar,
  Sliders,
  ChevronRight,
  Info,
  Building2,
  School,
  UserPlus,
  UserMinus,
  UserCheck,
  FileSpreadsheet,
  ShieldCheck,
  Star,
  CheckSquare,
  ArrowRightLeft,
  Move
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { 
  DEFAULT_DYK_CLASSES, 
  DYK_TARGET_BRANCHES, 
  isDykEligibleBranch, 
  analyzeTeacherSchoolSchedule,
  executeDykSwap,
  placeUnassignedDykActivity,
  checkDykSlotAvailability,
  isTeacherFreeInDyk,
  getDykBlockTimes,
  formatDykScheduleHeaderTimes
} from '../utils/dykEngine';
import { getCourseColorClass } from '../utils/courseColors';

export default function DykPlanner() {
  const navigate = useNavigate();
  const {
    teachers,
    settings,
    timetable,
    dykSettings,
    dykGroups,
    dykAssignments,
    dykTeacherAvailabilities,
    dykSchedule,
    dykResult,
    updateSettings,
    updateDykSettings,
    setDykDayCustomTimes,
    resetDykDayCustomTimes,
    addTeacher,
    excludeTeacherFromDyk,
    includeTeacherInDyk,
    addDykGroup,
    deleteDykGroup,
    addDykAssignment,
    addMultipleDykAssignments,
    deleteDykAssignment,
    setDykTeacherAvailability,
    setDykSchedule,
    setDykResult,
    generateDykSchedule,
    clearDykSchedule
  } = useAppStore();

  // 5 Ana Menü Sekmesi:
  // 1: 'institution' (Kurum ve Zaman)
  // 2: 'classes' (Sınıflar)
  // 3: 'teachers' (Öğretmenler)
  // 4: 'assignments' (Dersler ve Atamalar)
  // 5: 'distribution' (Dağıtım ve Resmi Çıktılar)
  const [activeTab, setActiveTab] = useState('institution');

  // Menü 5 Görünüm Modu
  const [viewMode, setViewMode] = useState('group'); // 'group' | 'teacher' | 'matrix'
  const [selectedGroupId, setSelectedGroupId] = useState(dykGroups?.[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers?.[0]?.id || '');

  // ⚡ SMART SWAP & HAVUZ STATE
  const [selectedSwapSlot, setSelectedSwapSlot] = useState(null); // { groupId, day, blockId, cell }
  const [selectedPoolActivity, setSelectedPoolActivity] = useState(null); // activity from dykResult.unassigned

  // 🖨️ RESMİ EVRAK TARİHLERİ
  const [docIssueDate, setDocIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [docApprovalDate, setDocApprovalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [academicYear, setAcademicYear] = useState("2024 - 2025");

  // Toast Bildirimi
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Zaman Çizelgesi ve Günler
  const activeDays = dykSettings?.activeDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const blocks = dykSettings?.blocks || [
    { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
    { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
  ];
  const dayCustomTimes = dykSettings?.dayCustomTimes || {};

  // 🕒 GÜNE ÖZEL SAAT SEÇİCİ SEKMESİ (Menü 1)
  const [selectedTimeDay, setSelectedTimeDay] = useState("Çarşamba");

  const handleUpdateDayBlockTime = (day, blockId, field, value) => {
    const currentDayTimes = dayCustomTimes[day] || {};
    const defaultBlock = blocks.find(b => b.id === blockId) || {};
    const existing = currentDayTimes[blockId] || {
      startTime: defaultBlock.startTime || "15:50",
      endTime: defaultBlock.endTime || "17:00"
    };
    
    const updated = {
      ...currentDayTimes,
      [blockId]: {
        ...existing,
        [field]: value
      }
    };
    setDykDayCustomTimes(day, updated);
  };

  const handleEnableCustomDayTimes = (day) => {
    const initialMap = {};
    blocks.forEach(b => {
      // Çarşamba için örnek olarak 18:00 başlat, diğerleri için mevcut saati baz al
      if (day === "Çarşamba") {
        if (b.id === "b1") initialMap[b.id] = { startTime: "18:00", endTime: "19:10" };
        else if (b.id === "b2") initialMap[b.id] = { startTime: "19:20", endTime: "20:30" };
        else initialMap[b.id] = { startTime: b.startTime, endTime: b.endTime };
      } else {
        initialMap[b.id] = { startTime: b.startTime, endTime: b.endTime };
      }
    });
    setDykDayCustomTimes(day, initialMap);
    showToast(`"${day}" günü için özel saatler aktif edildi. Aşağıdan saatleri düzenleyebilirsiniz.`);
  };

  const handleResetCustomDayTimes = (day) => {
    resetDykDayCustomTimes(day);
    showToast(`"${day}" günü saatleri varsayılan çizelgeye sıfırlandı.`);
  };

  // 🛡️ MODERN ONAY MODALI (SİSTEM UYARISI YERİNE)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: '',
    confirmText: 'Evet, Sil',
    cancelText: 'Vazgeç',
    isDanger: true,
    onConfirm: null
  });

  const openConfirmModal = ({ title, message, details, confirmText = 'Evet, Sil', cancelText = 'Vazgeç', isDanger = true, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      details,
      confirmText,
      cancelText,
      isDanger,
      onConfirm
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  // 🏫 Okul Ders Programı Son Ders Analizi
  const teacherSchoolAnalysis = useMemo(() => {
    return analyzeTeacherSchoolSchedule(timetable, teachers, settings);
  }, [timetable, teachers, settings]);

  const excludedTeacherIds = dykSettings?.excludedTeacherIds || [];

  // DYK İçin Uygun Öğretmenler (Okul Öğretmenleri + Harici Eklenenler, Hariç Tutulanlar Hariç)
  const dykEligibleTeachers = useMemo(() => {
    return (teachers || []).filter(t => {
      if (excludedTeacherIds.includes(t.id)) return false;
      return t.isExternalDyk || isDykEligibleBranch(t.branch, t.subjects);
    });
  }, [teachers, excludedTeacherIds]);

  // DYK'dan Çıkarılmış / Katılmayan Öğretmenler
  const excludedTeachers = useMemo(() => {
    return (teachers || []).filter(t => excludedTeacherIds.includes(t.id));
  }, [teachers, excludedTeacherIds]);

  // DYK Kadrosuna Eklenebilecek Diğer Okul Öğretmenleri
  const availableSchoolTeachersToAdd = useMemo(() => {
    return (teachers || []).filter(t => !dykEligibleTeachers.some(et => et.id === t.id));
  }, [teachers, dykEligibleTeachers]);

  // 🎯 SADECE KURSTA DERSİ OLAN ÖĞRETMENLER (Öğretmen Bazlı Tablo & Çıktı İçin)
  const teachersWithDykLessons = useMemo(() => {
    const teacherIdsWithLessons = new Set();

    // 1. Dağıtılmış programda (dykSchedule) yerleşen derslerin öğretmenleri
    if (dykSchedule) {
      Object.keys(dykSchedule).forEach(gId => {
        const groupDays = dykSchedule[gId] || {};
        Object.keys(groupDays).forEach(day => {
          const blocksMap = groupDays[day] || {};
          Object.keys(blocksMap).forEach(bId => {
            const cell = blocksMap[bId];
            if (cell && cell.teacherId) {
              teacherIdsWithLessons.add(cell.teacherId);
            }
          });
        });
      });
    }

    // 2. Eğer henüz dağıtım yapılmadıysa veya açıkta havuzdaysa, en azından DYK ders ataması olan öğretmenler
    if (teacherIdsWithLessons.size === 0 && dykAssignments && dykAssignments.length > 0) {
      dykAssignments.forEach(a => {
        if (a.teacherId) teacherIdsWithLessons.add(a.teacherId);
      });
    }

    return (teachers || []).filter(t => teacherIdsWithLessons.has(t.id));
  }, [dykSchedule, dykAssignments, teachers]);

  // Seçili öğretmenin geçerliliği (Sadece kursta dersi olanlar arasında olmalı veya 'ALL' olmalı)
  const effectiveTeacherId = useMemo(() => {
    if (teachersWithDykLessons.length === 0) return '';
    if (selectedTeacherId === 'ALL') return 'ALL';
    if (selectedTeacherId && teachersWithDykLessons.some(t => t.id === selectedTeacherId)) {
      return selectedTeacherId;
    }
    return teachersWithDykLessons[0]?.id || '';
  }, [selectedTeacherId, teachersWithDykLessons]);

  // -------------------------------------------------------------
  // MENÜ 1: KURUM & ZAMAN STATE VE İŞLEMLERİ
  // -------------------------------------------------------------
  const [institutionSchoolName, setInstitutionSchoolName] = useState(settings?.schoolName || "Antakya Hz. Ayşe Kız AİHL");
  const [institutionPrincipal, setInstitutionPrincipal] = useState(settings?.principalName || "Cemil Murat Kuru");
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("19:20");
  const [newBlockEnd, setNewBlockEnd] = useState("20:30");

  const handleSaveInstitution = (e) => {
    e.preventDefault();
    updateSettings({
      schoolName: institutionSchoolName.trim(),
      principalName: institutionPrincipal.trim()
    });
    showToast("Kurum ve zaman bilgileri başarıyla kaydedildi.");
  };

  const handleAddBlock = () => {
    if (!newBlockStart || !newBlockEnd) return;
    const nextIdx = blocks.length + 1;
    const name = newBlockName.trim() || `${nextIdx}. Blok Kurs (${newBlockStart} - ${newBlockEnd})`;
    const updated = [
      ...blocks,
      { id: `b_${Date.now()}`, name, startTime: newBlockStart, endTime: newBlockEnd }
    ];
    updateDykSettings({ blocks: updated });
    setNewBlockName("");
    showToast(`"${name}" blok saati eklendi.`);
  };

  const handleDeleteBlock = (blockId) => {
    if (blocks.length <= 1) {
      showToast("En az 1 blok kurs saati bulunmalıdır.");
      return;
    }
    const updated = blocks.filter(b => b.id !== blockId);
    updateDykSettings({ blocks: updated });
    showToast("Blok saati kaldırıldı.");
  };

  const handleToggleDay = (day) => {
    const updated = activeDays.includes(day)
      ? activeDays.filter(d => d !== day)
      : [...activeDays, day];
    if (updated.length === 0) {
      showToast("En az 1 aktif gün seçili olmalıdır.");
      return;
    }
    updateDykSettings({ activeDays: updated });
  };

  // -------------------------------------------------------------
  // MENÜ 2: SINIFLAR STATE VE İŞLEMLERİ
  // -------------------------------------------------------------
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [newClassBranch, setNewClassBranch] = useState("SAY");

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    addDykGroup({
      name: newClassName.trim(),
      grade: newClassGrade,
      branch: newClassBranch
    });
    setNewClassName("");
    showToast(`"${newClassName.trim()}" sınıfı başarıyla eklendi.`);
  };

  const handleLoadDefaultClasses = () => {
    DEFAULT_DYK_CLASSES.forEach(defClass => {
      const exists = dykGroups.some(g => g.name.toLowerCase() === defClass.name.toLowerCase());
      if (!exists) {
        addDykGroup(defClass);
      }
    });
    showToast("Kayıtlı 8 DYK sınıfı sisteme yüklendi.");
  };

  // -------------------------------------------------------------
  // MENÜ 3: ÖĞRETMENLER STATE VE İŞLEMLERİ
  // -------------------------------------------------------------
  const [teacherFilter, setTeacherFilter] = useState("dyk"); // 'dyk' | 'all'
  const [showExternalTeacherModal, setShowExternalTeacherModal] = useState(false);
  const [externalTeacherName, setExternalTeacherName] = useState("");
  const [externalTeacherBranch, setExternalTeacherBranch] = useState("Matematik");

  const handleAddExternalTeacher = (e) => {
    e.preventDefault();
    if (!externalTeacherName.trim()) return;
    addTeacher({
      name: externalTeacherName.trim().toUpperCase(),
      branch: externalTeacherBranch,
      isExternalDyk: true,
      unavailable: {}
    });
    setExternalTeacherName("");
    setShowExternalTeacherModal(false);
    showToast(`"${externalTeacherName.trim()}" öğretmeni sisteme eklendi.`);
  };

  const toggleTeacherAvailabilityDay = (tId, day) => {
    const current = dykTeacherAvailabilities[tId] || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setDykTeacherAvailability(tId, updated);
  };

  const handleSelectLateDaysOnly = (teacherId) => {
    const analysis = teacherSchoolAnalysis[teacherId] || {};
    const lateDays = Object.keys(analysis).filter(d => analysis[d]?.hasLatePeriod);
    if (lateDays.length === 0) {
      showToast("Bu öğretmenin ana programda son derse girdiği gün bulunamadı.");
      return;
    }
    setDykTeacherAvailability(teacherId, lateDays);
    showToast(`Öğretmenin son dersi olan günler (${lateDays.join(', ')}) seçildi.`);
  };

  const handleSelectAllDays = (teacherId) => {
    setDykTeacherAvailability(teacherId, [...activeDays]);
  };

  const [showAddSchoolTeacherModal, setShowAddSchoolTeacherModal] = useState(false);
  const [selectedSchoolTeacherIdToAdd, setSelectedSchoolTeacherIdToAdd] = useState('');

  // 🗑️ Öğretmeni DYK Modülünden Çıkar / Katılmıyor Yap (Onaysız anında işlem)
  const handleExcludeTeacher = (teacherId, teacherName) => {
    excludeTeacherFromDyk(teacherId);
    showToast(`"${teacherName}" DYK kurs modülünden çıkarıldı.`);
  };

  // ✅ Öğretmeni DYK Modülüne Geri Ekle / Dahil Et
  const handleIncludeTeacher = (teacherId, teacherName) => {
    includeTeacherInDyk(teacherId);
    showToast(`"${teacherName}" DYK kurs kadrosuna dahil edildi.`);
  };

  // ➕ Okul Kadrosundan Seçilen Öğretmeni DYK'ya Ekle
  const handleAddSchoolTeacherToDyk = (e) => {
    e.preventDefault();
    if (!selectedSchoolTeacherIdToAdd) return;
    const t = teachers.find(tch => tch.id === selectedSchoolTeacherIdToAdd);
    includeTeacherInDyk(selectedSchoolTeacherIdToAdd);
    setShowAddSchoolTeacherModal(false);
    setSelectedSchoolTeacherIdToAdd('');
    showToast(`"${t?.name || 'Öğretmen'}" DYK kadrosuna eklendi.`);
  };

  // -------------------------------------------------------------
  // MENÜ 4: DERSLER & ATAMALAR STATE VE İŞLEMLERİ
  // -------------------------------------------------------------
  const [assignClassId, setAssignClassId] = useState(dykGroups?.[0]?.id || "");
  const [assignSubject, setAssignSubject] = useState("Matematik");
  const [assignTeacherId, setAssignTeacherId] = useState(dykEligibleTeachers?.[0]?.id || teachers?.[0]?.id || "");
  const [assignBlocks, setAssignBlocks] = useState(1);
  const [assignmentFilterClass, setAssignmentFilterClass] = useState("ALL");

  const DYK_COMMON_SUBJECTS = [
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Türk Dili ve Edebiyatı",
    "Coğrafya",
    "Tarih",
    "Felsefe",
    "İngilizce"
  ];

  // ⚡ 1-Tıkla Otomatik Eşleştirme ve Tekrar Tıklamayla Eşleştirmeyi Kaldırma (Toggle)
  const handleToggleTeacherAssignment = (teacher) => {
    if (!assignClassId) {
      showToast("Lütfen önce sol sütundan eşleştirmek istediğiniz sınıf kartını seçin.");
      return;
    }

    const existingAsg = dykAssignments.find(
      (a) => a.groupId === assignClassId && a.teacherId === teacher.id
    );

    if (existingAsg) {
      // Tekrar tıklandığında eşleştirme anında kaldırılır
      deleteDykAssignment(existingAsg.id);
      showToast(`"${teacher.name}" öğretmeninin "${getGroupName(assignClassId)}" sınıfındaki ${existingAsg.subject} ataması kaldırıldı.`);
    } else {
      // Bir kez tıklandığında otomatik eşleşir
      let subjectToUse = assignSubject;
      if (teacher.branch) {
        const matched = DYK_TARGET_BRANCHES.find(b => 
          b.toLowerCase().includes(teacher.branch.toLowerCase()) || 
          teacher.branch.toLowerCase().includes(b.toLowerCase())
        );
        subjectToUse = matched || teacher.branch;
      }
      const blocks = Number(assignBlocks) || 1;

      addDykAssignment({
        groupId: assignClassId,
        teacherId: teacher.id,
        subject: subjectToUse,
        blocksPerWeek: blocks
      });

      setAssignTeacherId(teacher.id);
      setAssignSubject(subjectToUse);
      showToast(`✓ "${teacher.name}" (${subjectToUse}) "${getGroupName(assignClassId)}" sınıfına eşlendi.`);
    }
  };

  // ⚡ Seçili Sınıfa Branş Öğretmenlerini Toplu Eşleme Onayı
  const handleBatchAssignToCurrentClass = () => {
    if (!assignClassId) {
      showToast("Lütfen önce bir sınıf kartı seçin.");
      return;
    }

    const currentGroup = dykGroups.find(g => g.id === assignClassId);
    const className = currentGroup?.name || "Seçili Sınıf";
    const isSay = currentGroup?.branch === "SAY" || className.toLowerCase().includes("say");
    const isEa = currentGroup?.branch === "EA" || className.toLowerCase().includes("ea");

    let targetSubjects = DYK_TARGET_BRANCHES;
    if (isSay) {
      targetSubjects = ["Matematik", "Fizik", "Kimya", "Biyoloji"];
    } else if (isEa) {
      targetSubjects = ["Matematik", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya"];
    }

    const newAssignments = [];
    const usedSubjects = new Set(
      dykAssignments.filter(a => a.groupId === assignClassId).map(a => a.subject.toLowerCase())
    );
    const assignedTeacherIds = new Set(
      dykAssignments.filter(a => a.groupId === assignClassId).map(a => a.teacherId)
    );

    targetSubjects.forEach(subj => {
      if (usedSubjects.has(subj.toLowerCase())) return;

      const teacher = dykEligibleTeachers.find(t => {
        if (assignedTeacherIds.has(t.id)) return false;
        const b = (t.branch || "").toLowerCase();
        const s = subj.toLowerCase();
        return b.includes(s) || s.includes(b);
      });

      if (teacher) {
        newAssignments.push({
          groupId: assignClassId,
          teacherId: teacher.id,
          subject: subj,
          blocksPerWeek: Number(assignBlocks) || 1
        });
        assignedTeacherIds.add(teacher.id);
        usedSubjects.add(subj.toLowerCase());
      }
    });

    if (newAssignments.length === 0) {
      showToast(`"${className}" sınıfının hedeflenen branş atamaları zaten tamamlanmış.`);
      return;
    }

    const teacherNames = newAssignments.map(a => `${getTeacherName(a.teacherId)} (${a.subject})`).join(", ");

    openConfirmModal({
      title: `${className} Sınıfına Toplu Branş Eşleme Onayı`,
      message: `"${className}" sınıfına ${newAssignments.length} adet branş dersi ve öğretmeni toplu olarak eşlenecektir.`,
      details: `Eşlenecekler: ${teacherNames}.\nHer ders için varsayılan ${assignBlocks} blok tanımlanacaktır.`,
      confirmText: "Toplu Eşle ve Onayla",
      cancelText: "Vazgeç",
      isDanger: false,
      onConfirm: () => {
        addMultipleDykAssignments(newAssignments);
        showToast(`🎉 "${className}" sınıfına ${newAssignments.length} branş dersi başarıyla eklendi!`);
      }
    });
  };

  // 🚀 Tüm Sınıflara Standart DYK Kadrosunu Toplu Ekle ve Onayla
  const handleBatchAssignAllClassesConfirm = () => {
    if (dykGroups.length === 0) {
      showToast("Kayıtlı DYK sınıfı bulunmuyor.");
      return;
    }

    const allNewAssignments = [];

    dykGroups.forEach(group => {
      const isSay = group.branch === "SAY" || (group.name || "").toLowerCase().includes("say");
      const isEa = group.branch === "EA" || (group.name || "").toLowerCase().includes("ea");

      let targetSubjects = DYK_TARGET_BRANCHES;
      if (isSay) {
        targetSubjects = ["Matematik", "Fizik", "Kimya", "Biyoloji"];
      } else if (isEa) {
        targetSubjects = ["Matematik", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya"];
      }

      const existingClassAsgs = dykAssignments.filter(a => a.groupId === group.id);
      const usedSubjects = new Set(existingClassAsgs.map(a => a.subject.toLowerCase()));
      const assignedTeacherIds = new Set(existingClassAsgs.map(a => a.teacherId));

      targetSubjects.forEach(subj => {
        if (usedSubjects.has(subj.toLowerCase())) return;

        const teacher = dykEligibleTeachers.find(t => {
          if (assignedTeacherIds.has(t.id)) return false;
          const b = (t.branch || "").toLowerCase();
          const s = subj.toLowerCase();
          return b.includes(s) || s.includes(b);
        });

        if (teacher) {
          allNewAssignments.push({
            groupId: group.id,
            teacherId: teacher.id,
            subject: subj,
            blocksPerWeek: Number(assignBlocks) || 1
          });
          assignedTeacherIds.add(teacher.id);
          usedSubjects.add(subj.toLowerCase());
        }
      });
    });

    if (allNewAssignments.length === 0) {
      showToast("Tüm sınıflar için branş atamaları zaten eksiksiz yapılmış durumda.");
      return;
    }

    openConfirmModal({
      title: "Tüm Sınıflara Toplu DYK Eşleme Onayı",
      message: `${dykGroups.length} sınıfın tamamına branşlarına uygun öğretmenler (Sayısal: Mat, Fizik, Kimya, Biyoloji / Eşit Ağırlık: Mat, Edebiyat, Tarih, Coğrafya) otomatik atanacaktır.`,
      details: `Toplam ${allNewAssignments.length} yeni ders ataması oluşturulacaktır. Mevcut atamalarınız korunur. Onaylıyor musunuz?`,
      confirmText: "Evet, Hepsini Eşle ve Onayla",
      cancelText: "Vazgeç",
      isDanger: false,
      onConfirm: () => {
        addMultipleDykAssignments(allNewAssignments);
        showToast(`🎉 Toplam ${allNewAssignments.length} branş ataması tüm sınıflara başarıyla eklendi!`);
      }
    });
  };

  const handleAddAssignment = (e) => {
    e?.preventDefault?.();
    if (!assignClassId || !assignTeacherId || !assignSubject.trim()) {
      showToast("Lütfen tüm alanları doldurun.");
      return;
    }
    addDykAssignment({
      groupId: assignClassId,
      teacherId: assignTeacherId,
      subject: assignSubject.trim(),
      blocksPerWeek: Number(assignBlocks) || 1
    });
    showToast(`"${assignSubject.trim()}" ders ataması kaydedildi.`);
  };

  // -------------------------------------------------------------
  // MENÜ 5: DAĞITIM VE ÇIKTI MOTORU
  // -------------------------------------------------------------
  const handleRunDykSolver = () => {
    if (dykAssignments.length === 0) {
      showToast("Dağıtım yapabilmek için önce '4. Dersler & Atamalar' menüsünden atama yapmalısınız.");
      return;
    }
    const res = generateDykSchedule();
    if (res.success) {
      showToast(`Harika! Tüm ${res.totalActivities} blok ders çakışmasız yerleştirildi. 🌟`);
    } else {
      showToast(`${res.unassigned?.length || 0} blok ders yerleştirilemedi. Kısıtları gözden geçirin.`);
    }
  };

  // ⚡ Smart Swap ve Manuel Yerleştirme Hücre Tıklama / Bırakma İşleyicisi
  const handleSlotClick = (groupId, day, blockId, currentCell) => {
    // 1. Açıkta kalan havuz dersi seçiliyse / sürüklendiyse:
    if (selectedPoolActivity) {
      if (selectedPoolActivity.groupId !== groupId) {
        showToast(`Bu ders "${getGroupName(selectedPoolActivity.groupId)}" sınıfına ait. Yalnızca bu sınıfın çizelgesine yerleştirilebilir.`);
        return;
      }
      const res = placeUnassignedDykActivity({
        dykSchedule,
        activity: selectedPoolActivity,
        targetDay: day,
        targetBlockId: blockId,
        dykTeacherAvailabilities,
        activeDays,
        allowDayOverride: true
      });

      if (res.success) {
        setDykSchedule(res.newSchedule);
        if (res.updatedAvailabilities) {
          setDykTeacherAvailability(
            selectedPoolActivity.teacherId,
            res.updatedAvailabilities[selectedPoolActivity.teacherId]
          );
        }
        const remainingUnassigned = (dykResult?.unassigned || []).filter(a => a.id !== selectedPoolActivity.id);
        setDykResult({
          unassigned: remainingUnassigned,
          assignedCount: (dykResult?.assignedCount || 0) + 1,
          success: remainingUnassigned.length === 0
        });
        if (res.addedDay) {
          showToast(`🎉 "${selectedPoolActivity.subject}" dersi ${day} gününe yerleştirildi! (Öğretmenin DYK günlerine ${day} eklendi)`);
        } else {
          showToast(`🎉 "${selectedPoolActivity.subject}" dersi ${day} gününe başarıyla yerleştirildi!`);
        }
        setSelectedPoolActivity(null);
      } else {
        showToast(`Yerleştirilemedi: ${res.reason}`);
      }
      return;
    }

    // 2. Takas için kaynak slot seçiliyse:
    if (selectedSwapSlot) {
      if (
        selectedSwapSlot.groupId === groupId &&
        selectedSwapSlot.day === day &&
        selectedSwapSlot.blockId === blockId
      ) {
        setSelectedSwapSlot(null);
        return;
      }

      if (selectedSwapSlot.groupId !== groupId) {
        showToast("Takas aynı sınıf çizelgesi içerisindeki saatler arasında yapılabilir.");
        return;
      }

      const res = executeDykSwap({
        dykSchedule,
        groupId,
        sourceDay: selectedSwapSlot.day,
        sourceBlockId: selectedSwapSlot.blockId,
        targetDay: day,
        targetBlockId: blockId,
        dykTeacherAvailabilities,
        activeDays
      });

      if (res.success) {
        setDykSchedule(res.newSchedule);
        setSelectedSwapSlot(null);
        showToast("Dersler başarıyla takas edildi / taşındı! ⚡");
      } else {
        showToast(`Takas yapılamadı: ${res.reason}`);
      }
      return;
    }

    // 3. Normal tıklama: eğer hücre doluysa takas kaynağı yap
    if (currentCell) {
      setSelectedSwapSlot({
        groupId,
        day,
        blockId,
        cell: currentCell
      });
      setSelectedPoolActivity(null);
    }
  };

  const getTeacherName = (tId) => teachers.find(t => t.id === tId)?.name || tId;
  const getGroupName = (gId) => dykGroups.find(g => g.id === gId)?.name || gId;

  const formatDateTurkish = (dateStr) => {
    if (!dateStr) return '... / ... / 2024';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filtrelenmiş Atama Listesi
  const filteredAssignments = useMemo(() => {
    if (assignmentFilterClass === "ALL") return dykAssignments;
    return dykAssignments.filter(a => a.groupId === assignmentFilterClass);
  }, [dykAssignments, assignmentFilterClass]);

  // Öğretmen Listesi (DYK Sekmesi İçin)
  const displayedTeachers = useMemo(() => {
    if (teacherFilter === "dyk") return dykEligibleTeachers;
    if (teacherFilter === "excluded") return excludedTeachers;
    return teachers || [];
  }, [teacherFilter, dykEligibleTeachers, excludedTeachers, teachers]);

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 flex flex-col pb-16">
      
      {/* 🚀 ÜST KURUMSAL HEADER (PRINT'TE GİZLİ) */}
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
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl select-none shadow-2xs">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    DYK MODÜLÜ
                  </span>
                  <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight">
                    Destekleme ve Yetiştirme Kursları Planlayıcı
                  </h1>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  {settings?.schoolName || 'Hz. Ayşe Kız AİHL'} &nbsp;·&nbsp; Okul Programı Entegreli Akıllı Dağıtım
                </p>
              </div>
            </div>
          </div>

          {/* Hızlı Eylem Butonları */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('distribution');
                setTimeout(() => window.print(), 100);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Printer size={15} className="text-slate-500" />
              <span>Resmi Çıktı Al (Yazdır)</span>
            </button>

            <button
              onClick={() => {
                handleRunDykSolver();
                setActiveTab('distribution');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>DYK Programını Dağıt</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <LayoutGrid size={15} className="text-slate-500" />
              <span>Modül Değiştir</span>
            </button>
          </div>
        </div>

        {/* 🌟 5 ADIMLI MENÜ SEKMELERİ (KULLANICI İSTERLERİNE BİREBİR UYUMLU) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 border-t border-slate-100 pt-1.5 scrollbar-none">
          
          {/* Menü 1: Kurum & Zaman */}
          <button
            onClick={() => setActiveTab('institution')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'institution'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 size={15} />
            <span>1. Kurum & Zaman Çizelgesi</span>
          </button>

          {/* Menü 2: Sınıflar */}
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'classes'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GraduationCap size={15} />
            <span>2. Sınıflar ({dykGroups.length})</span>
          </button>

          {/* Menü 3: Öğretmen Seçimi */}
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'teachers'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>3. Öğretmen Seçimi ({dykEligibleTeachers.length})</span>
          </button>

          {/* Menü 4: Dersler ve Atamalar */}
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'assignments'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={15} />
            <span>4. Dersler & Atamalar ({dykAssignments.length})</span>
          </button>

          {/* Menü 5: Dağıtım Motoru ve Çıktılar */}
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'distribution'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={15} />
            <span>5. Dağıtım & Resmi Çıktılar</span>
          </button>

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

      {/* 📄 ANA İÇERİK ALANI */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">

        {/* ========================================================= */}
        {/* 1. MENÜ: KURUM VE ZAMAN ÇİZELGESİ */}
        {/* ========================================================= */}
        {activeTab === 'institution' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Açıklama Banner */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">
                  1. Menü: Kurum Bilgileri ve DYK Zaman Çizelgesi
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  DYK kurslarının yürütüleceği okul/kurum adı, onay makamı olan okul müdürü bilgisi, kurs yapılan günler ve günlük kurs blok saatleri bu ekrandan yönetilir.
                </p>
              </div>
            </div>

            {/* Kurum Bilgileri Formu */}
            <form onSubmit={handleSaveInstitution} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <School size={16} className="text-emerald-600" />
                <span>Kurum ve Yetkili Bilgileri</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Okul / Kurum İsmi
                  </label>
                  <input
                    type="text"
                    value={institutionSchoolName}
                    onChange={(e) => setInstitutionSchoolName(e.target.value)}
                    placeholder="Örn: Antakya Hz. Ayşe Kız Anadolu İmam Hatip Lisesi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Okul Müdürü
                  </label>
                  <input
                    type="text"
                    value={institutionPrincipal}
                    onChange={(e) => setInstitutionPrincipal(e.target.value)}
                    placeholder="Örn: Cemil Murat Kuru"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Kurum Bilgilerini Kaydet
                </button>
              </div>
            </form>

            {/* Kurs Yapılan Günler */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CalendarDays size={16} className="text-emerald-600" />
                    <span>Aktif Kurs Günleri</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haftalık DYK ders programının dağıtılacağı günleri belirleyin (Hafta içi ve Cumartesi).
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {activeDays.length} Gün Aktif
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
                {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"].map(day => {
                  const isActive = activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">{day}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold opacity-75">
                          {isActive ? 'Açık' : 'Kapalı'}
                        </span>
                        {isActive && <Check size={14} className="text-emerald-600 font-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zaman Çizelgesi (Blok Saatleri) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-emerald-600" />
                    <span>DYK Zaman Çizelgesi & Blok Saatleri</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Her blok 2 ders saati süresindedir. İhtiyaca göre blok saat aralıklarını düzenleyebilir veya yeni blok ekleyebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Mevcut Bloklar Listesi */}
              <div className="space-y-2.5">
                {blocks.map((block, idx) => (
                  <div 
                    key={block.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-emerald-700 shadow-2xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{block.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {block.startTime} — {block.endTime} &nbsp;·&nbsp; 2 Ders Saati
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                        {block.startTime} - {block.endTime}
                      </span>
                      {blocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Bloğu Kaldır"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Yeni Blok Ekleme Alanı */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Blok Tanımı
                  </label>
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="Örn: 3. Blok Kurs (Hafta Sonu / Akşam)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Başlangıç
                  </label>
                  <input
                    type="time"
                    value={newBlockStart}
                    onChange={(e) => setNewBlockStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bitiş
                  </label>
                  <input
                    type="time"
                    value={newBlockEnd}
                    onChange={(e) => setNewBlockEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer h-[36px]"
                >
                  <Plus size={14} />
                  <span>Blok Ekle</span>
                </button>
              </div>
            </div>

            {/* 🕒 GÜNE ÖZEL KURS SAATLERİ (ÖRN: ÇARŞAMBA 18:00 BAŞLANGICI) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sliders size={16} className="text-emerald-600" />
                    <span>Güne Özel Kurs Saatleri Ayarlama</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Örneğin <strong>Çarşamba günü kurs 18:00'da başlarken</strong>, diğer günler 15:50'de başlayacak şekilde her güne özel başlangıç ve bitiş saatleri tanımlayabilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Esnek Günlük Çizelge</span>
                </div>
              </div>

              {/* Gün Seçici Sekmeler */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {activeDays.map(day => {
                  const hasCustom = Boolean(dayCustomTimes[day] && Object.keys(dayCustomTimes[day]).length > 0);
                  const isSelected = selectedTimeDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedTimeDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : hasCustom
                          ? 'bg-amber-100/80 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{day}</span>
                      {hasCustom && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
                          isSelected ? 'bg-white text-emerald-800' : 'bg-amber-200 text-amber-950'
                        }`}>
                          Özel Saat
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Seçilen Günün Saat Ayarları Paneli */}
              {(() => {
                const day = selectedTimeDay;
                const hasCustom = Boolean(dayCustomTimes[day] && Object.keys(dayCustomTimes[day]).length > 0);
                const dayTimes = dayCustomTimes[day] || {};

                return (
                  <div className="space-y-4 pt-1">
                    {hasCustom ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              ⚡
                            </span>
                            <div>
                              <div className="text-xs font-extrabold text-amber-950">
                                {day} Günü İçin Özel Saatler Aktif
                              </div>
                              <div className="text-[11px] text-amber-800">
                                Bu gün için ayarladığınız saatler yalnızca {day} günkü çizelgeye yansır.
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetCustomDayTimes(day)}
                            className="px-3 py-1 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Varsayılan Saatlere Sıfırla (15:50)
                          </button>
                        </div>

                        {/* Blok Bazında Saat Düzenleme */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {blocks.map((block, idx) => {
                            const bTime = dayTimes[block.id] || { startTime: block.startTime, endTime: block.endTime };
                            return (
                              <div
                                key={block.id}
                                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-slate-900">
                                    {idx + 1}. Blok ({block.name})
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {bTime.startTime} - {bTime.endTime}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      Başlangıç Saati
                                    </label>
                                    <input
                                      type="time"
                                      value={bTime.startTime}
                                      onChange={(e) => handleUpdateDayBlockTime(day, block.id, 'startTime', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      Bitiş Saati
                                    </label>
                                    <input
                                      type="time"
                                      value={bTime.endTime}
                                      onChange={(e) => handleUpdateDayBlockTime(day, block.id, 'endTime', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                        <div className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                          <strong>{day}</strong> günü şu anda tüm okul için belirlenen varsayılan saatleri (
                          {blocks.map((b, i) => `${i + 1}. Blok: ${b.startTime} - ${b.endTime}`).join(', ')}
                          ) kullanıyor.
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEnableCustomDayTimes(day)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{day} Gününe Özel Saat Belirle (Örn: 18:00 Başlangıç)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* İleri Adım Butonu */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Sonraki adım: Sınıfların ve grupların tanımlanması
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>2. Menü: Sınıflara Geç</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 2. MENÜ: SINIFLAR (11A SAY, 11B SAY... VE YENİ SINIFLAR) */}
        {/* ========================================================= */}
        {activeTab === 'classes' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Başlık ve Eylemler */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-900">
                    2. Menü: DYK Sınıf ve Grup Yönetimi
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistemde 11A say, 11B say, 11C ea, 11D ea, 12A say, 12B say, 12C ea, 12D ea sınıfları kayıtlıdır. Yeni sınıf ekleyebilir veya çıkarabilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadDefaultClasses}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw size={14} className="text-slate-500" />
                <span>Varsayılan 8 Sınıfı Geri Yükle</span>
              </button>
            </div>

            {/* Yeni Sınıf Ekleme Formu */}
            <form onSubmit={handleAddClass} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-emerald-600" />
                <span>Yeni Sınıf / Kurs Grubu Ekle</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sınıf Adı
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Örn: 11E Sözel veya 12E Dil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kademe / Seviye
                  </label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf (Mezun/YKS)</option>
                    <option value="10">10. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alan / Branş
                  </label>
                  <select
                    value={newClassBranch}
                    onChange={(e) => setNewClassBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="SAY">Sayısal (SAY)</option>
                    <option value="EA">Eşit Ağırlık (EA)</option>
                    <option value="SÖZ">Sözel (SÖZ)</option>
                    <option value="DİL">Yabancı Dil</option>
                    <option value="GENEL">Genel</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Sınıfı Kaydet</span>
                </button>
              </div>
            </form>

            {/* Mevcut Sınıflar Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Kayıtlı DYK Sınıfları ({dykGroups.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Toplam {dykAssignments.length} ders ataması mevcut
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {dykGroups.map(group => {
                  const groupAssignments = dykAssignments.filter(a => a.groupId === group.id);
                  const totalBlocks = groupAssignments.reduce((sum, a) => sum + (Number(a.blocksPerWeek) || 1), 0);
                  const is11or12 = group.grade === '11' || group.grade === '12';

                  return (
                    <div 
                      key={group.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all group relative"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            group.branch === 'SAY' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : group.branch === 'EA'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          }`}>
                            {group.grade}. Sınıf · {group.branch || 'Genel'}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              openConfirmModal({
                                title: 'Sınıfı Silmek İstiyor musunuz?',
                                message: `"${group.name}" sınıfını DYK modülünden silmek üzeresiniz.`,
                                details: 'Bu sınıfa ait tüm ders atamaları ve haftalık dağıtım programı da silinecektir.',
                                confirmText: 'Sınıfı Sil',
                                cancelText: 'Vazgeç',
                                isDanger: true,
                                onConfirm: () => {
                                  deleteDykGroup(group.id);
                                  showToast(`"${group.name}" başarıyla silindi.`);
                                }
                              });
                            }}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Sınıfı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {group.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {groupAssignments.length} Farklı Kurs Dersi
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                        <span className="text-slate-500 font-medium">Haftalık Yük:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {totalBlocks} Blok ({totalBlocks * 2} Saat)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* İleri Adım Butonu */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('institution')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                ← 1. Kurum & Zaman
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>3. Menü: Öğretmen Seçimine Geç</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 3. MENÜ: ÖĞRETMEN SEÇİMİ (OKUL ÖĞRETMENLERİ + SON DERS ANALİZİ) */}
        {/* ========================================================= */}
        {activeTab === 'teachers' && (
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Bilgi Banner */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Users size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-900">
                    3. Menü: DYK Öğretmen Tercihleri & Son Ders Entegrasyonu
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Coğrafya ve Tarih öğretmenleri listelenir.
                    <strong className="text-emerald-700 font-bold"> Okul programında son derse girdikleri günler</strong> otomatik tespit edilerek dağıtımda en yüksek öncelikle atanır.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {availableSchoolTeachersToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolTeacherModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <UserPlus size={14} className="text-emerald-700" />
                    <span>+ Okul Kadrosundan Öğretmen Ekle</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowExternalTeacherModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <UserPlus size={14} />
                  <span>+ Dışarıdan / Başka Öğretmen Ekle</span>
                </button>
              </div>
            </div>

            {/* Filtre ve İstatistik Çubuğu */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Gösterim:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
                  <button
                    onClick={() => setTeacherFilter('dyk')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      teacherFilter === 'dyk' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Aktif DYK Kadrosu ({dykEligibleTeachers.length})
                  </button>
                  <button
                    onClick={() => setTeacherFilter('excluded')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      teacherFilter === 'excluded' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    DYK'ya Katılmayan / Çıkarılanlar ({excludedTeachers.length})
                  </button>
                  <button
                    onClick={() => setTeacherFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      teacherFilter === 'all' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tüm Okul Kadrosu ({teachers.length})
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <span className="font-bold text-emerald-700">★ Yeşil Yıldızlı Günler:</span> Okul programında son dersi olduğu için DYK önceliklidir.
              </div>
            </div>

            {/* Öğretmen Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTeachers.map(teacher => {
                const analysis = teacherSchoolAnalysis[teacher.id] || {};
                const teacherAvail = dykTeacherAvailabilities[teacher.id] || activeDays;
                const lateDays = Object.keys(analysis).filter(d => analysis[d]?.hasLatePeriod);
                const hasSchoolLessons = Object.keys(analysis).length > 0;
                const isExcluded = excludedTeacherIds.includes(teacher.id);

                return (
                  <div 
                    key={teacher.id}
                    className={`bg-white border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      isExcluded 
                        ? 'border-rose-200/80 bg-rose-50/20' 
                        : 'border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Üst Bilgi */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-extrabold text-sm ${isExcluded ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {teacher.name}
                            </h4>
                            {teacher.isExternalDyk && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                Harici / Dışarıdan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Branş: <span className="text-slate-800">{teacher.branch || 'Genel'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isExcluded ? (
                            <button
                              type="button"
                              onClick={() => handleIncludeTeacher(teacher.id, teacher.name)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Bu öğretmeni tekrar DYK kurs kadrosuna dahil et"
                            >
                              <UserCheck size={13} className="text-emerald-700" />
                              <span>DYK'ya Geri Ekle</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleExcludeTeacher(teacher.id, teacher.name)}
                              className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs group"
                              title="Bu öğretmeni DYK modülünden çıkar (DYK kursuna girmeyecek)"
                            >
                              <UserMinus size={13} className="group-hover:text-rose-600 transition-colors" />
                              <span className="text-[11px]">DYK'dan Çıkar</span>
                            </button>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            isExcluded ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isExcluded ? 'Katılmıyor' : `${teacherAvail.length} Gün`}
                          </span>
                        </div>
                      </div>

                      {/* 🌟 OKUL DERS PROGRAMINDA SON DERS ANALİZ ROZETİ */}
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock size={13} className="text-emerald-600" />
                            <span>Okul Programı Son Ders Durumu:</span>
                          </span>
                          {lateDays.length > 0 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Star size={11} className="fill-emerald-700 text-emerald-700" />
                              {lateDays.length} Gün Son Dersi Var
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              {hasSchoolLessons ? 'Son saatte ders yok' : 'Okul programında dersi yok'}
                            </span>
                          )}
                        </div>

                        {lateDays.length > 0 && (
                          <div className="text-[11px] text-emerald-900 font-medium">
                            Öncelikli DYK Günleri: <strong>{lateDays.join(', ')}</strong> (Okul çıkışı hemen kurs)
                          </div>
                        )}
                      </div>

                      {/* Gün Tercihleri Seçim Alanı */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            DYK Görev Alabileceği Günler
                          </label>
                          <div className="flex items-center gap-2">
                            {lateDays.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSelectLateDaysOnly(teacher.id)}
                                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                Sadece Son Ders Günleri
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelectAllDays(teacher.id)}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              Tüm Günler
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {activeDays.map(day => {
                            const isSelected = teacherAvail.includes(day);
                            const isLateDay = analysis[day]?.hasLatePeriod;

                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleTeacherAvailabilityDay(teacher.id, day)}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center justify-center cursor-pointer relative ${
                                  isSelected
                                    ? isLateDay 
                                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                }`}
                                title={isLateDay ? `${day}: Okul programında son dersi var!` : day}
                              >
                                <span>{day.slice(0, 3)}</span>
                                {isLateDay && (
                                  <span className={`text-[9px] ${isSelected ? 'text-amber-200' : 'text-emerald-600'}`}>
                                    ★
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>DYK Onayı: {teacherAvail.length > 0 ? 'Aktif' : 'Pasif'}</span>
                      <span className="font-semibold text-slate-700">
                        {dykAssignments.filter(a => a.teacherId === teacher.id).length} Kurs Ataması
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* İleri Adım Butonu */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                ← 2. Sınıflar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>4. Menü: Ders & Atamalara Geç</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 4. MENÜ: DERSLERİN SEÇİMİ VE ATAMALAR */}
        {/* ========================================================= */}
        {activeTab === 'assignments' && (
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Açıklama Banner */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <BookOpen size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-900">
                    4. Menü: DYK Ders Seçimi ve Öğretmen Atamaları
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sınıflara Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Coğrafya ve Tarih kurs derslerini ve öğretmenlerini atayın.
                    Haftalık blok sayısı (1 blok = 2 saat) seçilerek atama yapılır.
                  </p>
                </div>
              </div>

              {/* İstatistik Rozetleri */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Toplam Atama</div>
                  <div className="text-base font-black text-slate-900">{dykAssignments.length} Ders</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Toplam Blok</div>
                  <div className="text-base font-black text-emerald-700">
                    {dykAssignments.reduce((acc, a) => acc + (Number(a.blocksPerWeek) || 1), 0)} Blok (
                    {dykAssignments.reduce((acc, a) => acc + (Number(a.blocksPerWeek) || 1) * 2, 0)} Saat)
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 GÖRSEL EŞLEŞTİRME MASASI: SINIF KARTI ⇄ ÖĞRETMEN KARTI */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-emerald-600" />
                    <span>Sınıf ve Öğretmen Kartı Eşleştirme Masası</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sol panelden bir <strong>Sınıf Kartı</strong>, sağ panelden bir <strong>Öğretmen Kartı</strong> seçin; ders ve blok saatini belirleyip eşleştirin.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Görsel Kart Eşleştirme Aktif</span>
                </div>
              </div>

              {/* İki Kolonlu Kart Seçim Masası */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* 1. SOL KOLON: SINIF KARTLARI */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-emerald-600" />
                      <span>1. Adım: Sınıf Kartı Seçin ({dykGroups.length})</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Seçili: {getGroupName(assignClassId) || 'Seçilmedi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {dykGroups.map(group => {
                      const isSelected = assignClassId === group.id;
                      const groupAsgs = dykAssignments.filter(a => a.groupId === group.id);
                      const totalBlocks = groupAsgs.reduce((sum, a) => sum + (Number(a.blocksPerWeek) || 1), 0);

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setAssignClassId(group.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                              : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-extrabold text-xs text-slate-900">
                              {group.name}
                            </span>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] w-full pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 font-medium">
                              {group.grade}. Sınıf · {group.branch || 'Genel'}
                            </span>
                            <span className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                              {totalBlocks} Blok
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SAĞ KOLON: ÖĞRETMEN KARTLARI */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users size={15} className="text-emerald-600" />
                      <span>2. Adım: Öğretmen Kartı Seçin ({dykEligibleTeachers.length})</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Seçili: {getTeacherName(assignTeacherId) || 'Seçilmedi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {dykEligibleTeachers.map(teacher => {
                      const matchedAsg = assignClassId
                        ? dykAssignments.find(a => a.groupId === assignClassId && a.teacherId === teacher.id)
                        : null;
                      const isMatched = !!matchedAsg;
                      const isSelectedTeacher = assignTeacherId === teacher.id;
                      const analysis = teacherSchoolAnalysis[teacher.id] || {};
                      const lateDays = Object.keys(analysis).filter(d => analysis[d]?.hasLatePeriod);

                      return (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => handleToggleTeacherAssignment(teacher)}
                          title={isMatched ? "Eşleşmeyi kaldırmak için tıklayın" : "Seçili sınıfa eşlemek için tıklayın"}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer relative group ${
                            isMatched
                              ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/40 text-slate-900'
                              : isSelectedTeacher
                              ? 'bg-slate-100/90 border-slate-400'
                              : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-1">
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {teacher.name}
                            </span>
                            {isMatched ? (
                              <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0 shadow-2xs">
                                <Check size={11} strokeWidth={3} />
                                <span>Eşleşti</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-emerald-50 border border-slate-200/60 transition-colors shrink-0">
                                + Eşle
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] w-full pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-slate-700 truncate">
                                {teacher.branch || 'Genel'}
                              </span>
                              {isMatched && (
                                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                  {matchedAsg.blocksPerWeek} Blok ({matchedAsg.subject})
                                </span>
                              )}
                            </div>
                            {lateDays.length > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                ★ Son Ders
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* 3. ALT EŞLEŞTİRME VE TOPLU ONAY KONSOLU */}
              <div className="pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                
                {/* 🌟 TOPLU EŞLEŞTİRME VE ONAY KONSOLU */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>Toplu Eşleştirme & Onay Konsolu</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Otomatik
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Öğretmen kartlarına 1 kez tıklayarak eşleyebilir, aşağıdaki butonlarla tek onayda toplu atama yapabilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. Seçili Sınıfa Branşları Toplu Ekle */}
                    <button
                      type="button"
                      onClick={handleBatchAssignToCurrentClass}
                      disabled={!assignClassId}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Seçili sınıfa Matematik, Fen/Sosyal branş öğretmenlerini toplu eşler"
                    >
                      <CheckSquare size={14} />
                      <span>"{getGroupName(assignClassId) || 'Seçili Sınıf'}" Sınıfına Branşları Toplu Ekle</span>
                    </button>

                    {/* 2. Tüm Sınıflara Hepsini Toplu Ekle ve Onayla */}
                    <button
                      type="button"
                      onClick={handleBatchAssignAllClassesConfirm}
                      disabled={dykGroups.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Tüm kayıtlı DYK sınıflarına branşlarına uygun öğretmenleri tek onay ile atar"
                    >
                      <Layers size={14} />
                      <span>🚀 Tüm Sınıflara Hepsini Toplu Ekle ve Onayla</span>
                    </button>
                  </div>
                </div>

                {/* Eşleştirme Görsel Bağlantı İndikatörü */}
                <div className="flex flex-wrap items-center justify-center gap-3 py-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-2xs">
                    <GraduationCap size={15} className="text-emerald-600" />
                    <span>{getGroupName(assignClassId) || 'Sınıf Seçiniz'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 animate-pulse">
                    <ArrowRightLeft size={14} />
                    <span>Eşleştirme Modu (1 Tıkla Eşle / Kaldır)</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-2xs">
                    <Users size={15} className="text-emerald-600" />
                    <span>{getTeacherName(assignTeacherId) || 'Öğretmen Seçiniz'}</span>
                  </div>
                </div>

                {/* Ders ve Blok Parametreleri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Kurs Dersi
                    </label>
                    <input
                      type="text"
                      value={assignSubject}
                      onChange={(e) => setAssignSubject(e.target.value)}
                      placeholder="Örn: Matematik"
                      list="dyk-subjects-list"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <datalist id="dyk-subjects-list">
                      {DYK_COMMON_SUBJECTS.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Haftalık Blok Yükü
                    </label>
                    <select
                      value={assignBlocks}
                      onChange={(e) => setAssignBlocks(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      <option value="1">1 Blok (Haftada 2 Ders Saati)</option>
                      <option value="2">2 Blok (Haftada 4 Ders Saati)</option>
                      <option value="3">3 Blok (Haftada 6 Ders Saati)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddAssignment}
                      disabled={!assignClassId || !assignTeacherId || !assignSubject.trim()}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer h-[37px]"
                    >
                      <Plus size={15} />
                      <span>Eşleştirmeyi Kaydet & Atamayı Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Hızlı Ders Butonları */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Ders Kısayolları:</span>
                    {DYK_COMMON_SUBJECTS.map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setAssignSubject(subj)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                          assignSubject === subj
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium italic">
                    💡 İpucu: Öğretmen kartına 1 kez tıklayarak eşleyebilir, tekrar tıklayarak eşleştirmeyi kaldırabilirsiniz.
                  </span>
                </div>

              </div>
            </div>

            {/* Atamalar Tablosu */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-0">
              
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Kayıtlı DYK Atamaları ({filteredAssignments.length})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Toplam {filteredAssignments.reduce((acc, a) => acc + (Number(a.blocksPerWeek) || 1), 0)} Blok
                  </span>
                </div>

                {/* Sınıf Filtresi */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sınıf Filtresi:</span>
                  <select
                    value={assignmentFilterClass}
                    onChange={(e) => setAssignmentFilterClass(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">Tüm Sınıflar</option>
                    {dykGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  Henüz tanımlanmış bir ders ataması bulunmuyor. Yukarıdaki formu kullanarak atama ekleyin.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="p-3.5">DYK Sınıfı</th>
                        <th className="p-3.5">Kurs Dersi</th>
                        <th className="p-3.5">Öğretmen</th>
                        <th className="p-3.5 text-center">Haftalık Yük</th>
                        <th className="p-3.5 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssignments.map(asg => {
                        const t = teachers.find(tch => tch.id === asg.teacherId);
                        const analysis = teacherSchoolAnalysis[asg.teacherId] || {};
                        const lateDays = Object.keys(analysis).filter(d => analysis[d]?.hasLatePeriod);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">{getGroupName(asg.groupId)}</td>
                            <td className="p-3.5 font-extrabold text-emerald-700">{asg.subject}</td>
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-800">{getTeacherName(asg.teacherId)}</div>
                              {lateDays.length > 0 && (
                                <div className="text-[10px] text-emerald-700 font-medium">
                                  ★ Son Ders: {lateDays.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800 border border-slate-200">
                                {asg.blocksPerWeek} Blok ({asg.blocksPerWeek * 2} Ders Saati)
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => {
                                  deleteDykAssignment(asg.id);
                                  showToast("Atama silindi.");
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Atamayı Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* İleri Adım Butonu */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                ← 3. Öğretmen Seçimi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('distribution')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>5. Menü: Dağıtım & Yazdırmaya Geç</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 5. MENÜ: DAĞITIM MOTORU VE RESMİ ÇIKTILAR (YAZDIR BUTONU) */}
        {/* ========================================================= */}
        {activeTab === 'distribution' && (
          <div className="space-y-6">

            {/* 🎯 KONTROL VE EYLEM KARTI (PRINT'TE GİZLİ) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    5. Menü: Dağıtım Motoru ve Resmi Çıktılar
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Akıllı dağıtım algoritması öğretmenlerin okulda son dersi olduğu günlere öncelik vererek çakışmasız haftalık çizelgeyi üretir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    openConfirmModal({
                      title: 'DYK Dağıtımını Temizle',
                      message: 'Mevcut DYK haftalık ders dağıtım çizelgesini temizlemek istediğinize emin misiniz?',
                      details: 'Oluşturulmuş olan ders saatleri sıfırlanacaktır. Tanımladığınız ders atamaları korunur.',
                      confirmText: 'Dağıtımı Temizle',
                      cancelText: 'Vazgeç',
                      isDanger: true,
                      onConfirm: () => {
                        clearDykSchedule();
                        showToast("DYK programı dağıtımı temizlendi.");
                      }
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Dağıtımı Temizle
                </button>

                <button
                  onClick={handleRunDykSolver}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>DYK Programını Dağıt</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Resmi Çıktı Al (Yazdır)</span>
                </button>
              </div>
            </div>

            {/* 📅 YAZDIRMA VE RESMİ ONAY BİLGİLERİ (TARİH & MÜDÜR ONAYI GİRİŞİ) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Resmi Çıktı Tarih ve Onay Bilgileri
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600">Düzenleme Tarihi:</label>
                  <input
                    type="date"
                    value={docIssueDate}
                    onChange={(e) => setDocIssueDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600">Müdür Onay Tarihi:</label>
                  <input
                    type="date"
                    value={docApprovalDate}
                    onChange={(e) => setDocApprovalDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600">Öğretim Yılı:</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2024 - 2025"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 w-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* DAĞITIM DURUMU & İSTATİSTİK ÖZETİ (PRINT'TE GİZLİ) */}
            {dykResult && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 print:hidden ${
                dykResult.success 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {dykResult.success ? (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm">
                      {dykResult.success 
                        ? 'Dağıtım Başarılı: Tüm Kurs Blokları Çakışmasız Yerleştirildi!' 
                        : `${dykResult.unassigned?.length || 0} Blok Ders Açıkta Kaldı!`}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Toplam {dykResult.totalActivities} bloktan {dykResult.assignedCount} tanesi yerleştirildi.
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-bold">
                  <span>Başarı Oranı: </span>
                  <span className="text-sm font-black">
                    {Math.round((dykResult.assignedCount / (dykResult.totalActivities || 1)) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* ⚠️ YERLEŞTİRİLMEYEN DERSLER HAVUZU */}
            {dykResult?.unassigned && dykResult.unassigned.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      ⚠️
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                        Yerleştirilmeyen Dersler Havuzu ({dykResult.unassigned.length} Blok)
                      </h3>
                      <p className="text-[11px] text-amber-800">
                        Aşağıdaki dersleri <strong>sürükleyip çizelgedeki yeşil (müsait) saatlere bırakabilir</strong> veya karta tıklayarak boş bir saate yerleştirebilirsiniz.
                      </p>
                    </div>
                  </div>
                  {selectedPoolActivity && (
                    <button
                      onClick={() => setSelectedPoolActivity(null)}
                      className="px-3 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Seçimi İptal Et
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dykResult.unassigned.map(act => {
                    const isSelected = selectedPoolActivity?.id === act.id;
                    return (
                      <div
                        key={act.id}
                        draggable={true}
                        onDragStart={(e) => {
                          setSelectedPoolActivity(act);
                          setSelectedSwapSlot(null);
                          setSelectedGroupId(act.groupId);
                          setViewMode('group');
                          e.dataTransfer.setData("application/json", JSON.stringify(act));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 select-none cursor-grab active:cursor-grabbing ${
                          isSelected
                            ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
                            : 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-xs shadow-2xs'
                        }`}
                        title="Sürükleyip aşağıdaki yeşil renkli müsait bir saate bırakın veya butona tıklayın"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-amber-950">{getGroupName(act.groupId)}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                              {act.duration || 2} Saat (1 Blok)
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-800 mt-1">{act.subject}</div>
                          <div className="text-[11px] text-slate-600 font-medium">{getTeacherName(act.teacherId)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPoolActivity(null);
                            } else {
                              setSelectedPoolActivity(act);
                              setSelectedSwapSlot(null);
                              setSelectedGroupId(act.groupId);
                              setViewMode('group');
                              showToast(`"${act.subject}" seçildi. Aşağıdaki çizelgede yeşil renkli müsait bir saate tıklayın.`);
                            }
                          }}
                          className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          }`}
                        >
                          <Move size={13} />
                          <span>{isSelected ? 'Seçili (Müsait Yere Tıkla)' : 'Seç & Yerleştir'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ⚡ SMART SWAP AKTİF BİLGİ ÇUBUĞU */}
            {selectedSwapSlot && (
              <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                      <span>Akıllı Takas & Taşıma Modu Aktif</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-[10px] uppercase font-bold tracking-wider">
                        Smart Swap
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-0.5">
                      Seçilen: <strong>{getGroupName(selectedSwapSlot.groupId)}</strong> · <strong>{selectedSwapSlot.day}</strong> {selectedSwapSlot.blockId} ({selectedSwapSlot.cell.subject} - {getTeacherName(selectedSwapSlot.cell.teacherId)}).
                      Taşımak için boş bir saate veya takas etmek için başka bir derse tıklayın.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSwapSlot(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Takası İptal Et
                </button>
              </div>
            )}

            {/* ÇİZELGE GÖRÜNÜM SEÇİCİ (PRINT'TE GİZLİ) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Görünüm:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
                  <button
                    onClick={() => setViewMode('group')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      viewMode === 'group' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sınıf Bazlı
                  </button>
                  <button
                    onClick={() => setViewMode('teacher')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      viewMode === 'teacher' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Öğretmen Bazlı
                  </button>
                  <button
                    onClick={() => setViewMode('matrix')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      viewMode === 'matrix' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Genel Çarşaf Liste (Tüm Sınıflar)
                  </button>
                </div>
              </div>

              {viewMode === 'group' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sınıf Seç:</span>
                  <select
                    value={selectedGroupId || dykGroups?.[0]?.id}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {dykGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.grade}. Sınıf)</option>
                    ))}
                  </select>
                </div>
              )}

              {viewMode === 'teacher' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Öğretmen Seç:</span>
                  {teachersWithDykLessons.length === 0 ? (
                    <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      Kursta dersi olan öğretmen bulunamadı
                    </span>
                  ) : (
                    <select
                      value={effectiveTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                    >
                      {teachersWithDykLessons.length > 1 && (
                        <option value="ALL">📋 Tüm Kurs Öğretmenleri ({teachersWithDykLessons.length} Öğretmen - Toplu)</option>
                      )}
                      {teachersWithDykLessons.map(t => {
                        const assignedBlocks = dykAssignments
                          .filter(a => a.teacherId === t.id)
                          .reduce((sum, a) => sum + (Number(a.blocksPerWeek) || 1), 0);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.branch || 'Genel'} · {assignedBlocks} Blok)
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Henüz dağıtım yapılmadıysa yönlendirme */}
            {!dykSchedule && (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs my-6 space-y-4 print:hidden">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mx-auto shadow-2xs">
                  🎓
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">DYK Çizelgesi Henüz Dağıtılmadı</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Öğretmenlerin son ders günleri ve ders atamalarına göre kural motorunu tek tıkla çalıştırarak haftalık kurs çizelgesini oluşturun.
                  </p>
                </div>
                <button
                  onClick={handleRunDykSolver}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Şimdi DYK Programını Dağıt</span>
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* 🖨️ RESMİ MEB ÇIKTI BAŞLIĞI (PRINT ESNASINDA VE EKRANDA GÖRÜNÜR) */}
            {/* ========================================================= */}
            {dykSchedule && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* Resmi Çıktı Başlık Bloğu */}
                <div className="text-center space-y-1 pb-4 border-b border-slate-200 print:border-black">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 print:text-black">
                    T.C. MİLLÎ EĞİTİM BAKANLIĞI
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 print:text-black uppercase">
                    {settings?.schoolName || 'Antakya Hz. Ayşe Kız Anadolu İmam Hatip Lisesi'}
                  </h2>
                  <div className="text-xs sm:text-sm font-extrabold text-emerald-800 print:text-black">
                    DESTEKLEME VE YETİŞTİRME KURSLARI (DYK) HAFTALIK DERS DAĞITIM ÇİZELGESİ
                  </div>
                  <p className="text-[11px] text-slate-500 print:text-gray-700">
                    {academicYear || '2024 - 2025'} Eğitim ve Öğretim Yılı &nbsp;|&nbsp; Kurs Saatleri: {formatDykScheduleHeaderTimes(dykSettings)}
                  </p>
                </div>

                {/* 1. GÖRÜNÜM: SINIF BAZLI TABLO */}
                {viewMode === 'group' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center print:border-b print:pb-1">
                      <h3 className="text-sm font-extrabold text-slate-900 print:text-black">
                        Sınıf / Grup: <span className="text-emerald-700 print:text-black font-black">{getGroupName(selectedGroupId || dykGroups?.[0]?.id)}</span>
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold print:text-black">
                        Haftalık DYK Programı
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl print:border-black print:rounded-none">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold print:bg-white print:border-black">
                            <th className="p-3 border-r border-slate-200 text-left font-black print:border-black">Kurs Blokları</th>
                            {activeDays.map(day => {
                              const hasCustom = Boolean(dayCustomTimes[day] && Object.keys(dayCustomTimes[day]).length > 0);
                              return (
                                <th key={day} className="p-3 border-r border-slate-200 last:border-r-0 font-extrabold print:border-black">
                                  <div>{day}</div>
                                  {hasCustom && (
                                    <span className="text-[9px] text-amber-700 font-normal font-mono block print:text-black">
                                      (Özel Saat)
                                    </span>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                          {blocks.map(block => (
                            <tr key={block.id} className="hover:bg-slate-50/50 print:border-b print:border-black">
                              <td className="p-3 text-left border-r border-slate-200 bg-slate-50/80 font-bold text-slate-800 print:bg-white print:border-black">
                                <div>{block.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono print:text-gray-600">
                                  Varsayılan: {block.startTime} - {block.endTime}
                                </div>
                              </td>
                              {activeDays.map(day => {
                                const currentGroupId = selectedGroupId || dykGroups?.[0]?.id;
                                const item = dykSchedule?.[currentGroupId]?.[day]?.[block.id];
                                const times = getDykBlockTimes(dykSettings, day, block.id);
                                const isSelected = selectedSwapSlot && 
                                  selectedSwapSlot.groupId === currentGroupId && 
                                  selectedSwapSlot.day === day && 
                                  selectedSwapSlot.blockId === block.id;
                                
                                const isSwapActive = Boolean(selectedSwapSlot);
                                const isPoolActive = Boolean(selectedPoolActivity);

                                const slotAvailability = selectedPoolActivity
                                  ? checkDykSlotAvailability({
                                      activity: selectedPoolActivity,
                                      targetGroupId: currentGroupId,
                                      targetDay: day,
                                      targetBlockId: block.id,
                                      dykSchedule,
                                      dykTeacherAvailabilities,
                                      dykGroups
                                    })
                                  : null;

                                const isAvailableForPool = Boolean(slotAvailability && slotAvailability.canPlace && !item);
                                const isConflictForPool = Boolean(slotAvailability && !slotAvailability.canPlace && slotAvailability.status === 'teacher_conflict');

                                return (
                                  <td
                                    key={day}
                                    onClick={() => handleSlotClick(currentGroupId, day, block.id, item)}
                                    onDragOver={(e) => {
                                      if (selectedPoolActivity || selectedSwapSlot) {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleSlotClick(currentGroupId, day, block.id, item);
                                    }}
                                    className={`p-3 border-r border-slate-200 last:border-r-0 print:border-black transition-all cursor-pointer select-none relative ${
                                      isSelected 
                                        ? 'bg-emerald-100 ring-2 ring-emerald-500 shadow-sm'
                                        : isAvailableForPool
                                        ? 'bg-emerald-50/90 hover:bg-emerald-100 border-2 border-dashed border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                                        : isConflictForPool
                                        ? 'bg-rose-50/70 border border-rose-300 text-rose-800 cursor-not-allowed'
                                        : isSwapActive && !item
                                        ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-dashed border-emerald-400'
                                        : isSwapActive && item && !isSelected
                                        ? 'hover:bg-blue-50/80 border-dashed border-blue-400'
                                        : isPoolActive && item
                                        ? 'opacity-50 hover:opacity-80'
                                        : 'hover:bg-slate-50/80'
                                    }`}
                                    title={
                                      isSelected
                                        ? "Seçili slot (İptal etmek için tekrar tıklayın)"
                                        : isAvailableForPool
                                        ? `✓ Müsait Kurs Saati: Bırakın veya tıklayarak yerleştirin (${times.startTime} - ${times.endTime})`
                                        : isConflictForPool
                                        ? `🚫 Meşgul: ${slotAvailability.reason}`
                                        : isSwapActive
                                        ? (item ? "Bu ders ile TAKAS ET" : "Bu boş saate TAŞI")
                                        : isPoolActive
                                        ? (item ? "Dolu saat (Başka bir hücre seçiniz)" : "Havuzdaki dersi BURAYA YERLEŞTİR")
                                        : item ? `Akıllı Takas / Taşıma için Tıklayın (${times.startTime} - ${times.endTime})` : `Boş saat (${times.startTime} - ${times.endTime})`
                                    }
                                  >
                                    {item ? (
                                      <div 
                                        draggable={true}
                                        onDragStart={(e) => {
                                          setSelectedSwapSlot({
                                            groupId: currentGroupId,
                                            day,
                                            blockId: block.id,
                                            cell: item
                                          });
                                          setSelectedPoolActivity(null);
                                          e.dataTransfer.setData("application/json", JSON.stringify({ type: 'slot', groupId: currentGroupId, day, blockId: block.id }));
                                          e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className={`p-2 rounded-xl border font-bold transition-all cursor-grab active:cursor-grabbing print:bg-white print:border print:border-black ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                                          : 'bg-emerald-50/90 border-emerald-200 text-emerald-950 hover:border-emerald-400'
                                      }`}>
                                        <div className={`text-xs font-black ${isSelected ? 'text-white' : 'text-emerald-900 print:text-black'}`}>
                                          {item.subject}
                                        </div>
                                        <div className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-600 print:text-black'}`}>
                                          {getTeacherName(item.teacherId)}
                                        </div>
                                        <div className={`text-[10px] font-mono mt-1 flex items-center justify-between ${
                                          isSelected ? 'text-emerald-200' : 'text-emerald-800 print:text-gray-600'
                                        }`}>
                                          <span>{times.startTime} - {times.endTime}</span>
                                          {times.isCustom && (
                                            <span className="text-[8px] px-1 rounded bg-amber-200 text-amber-900 font-bold print:hidden">
                                              Özel
                                            </span>
                                          )}
                                        </div>
                                        {isSwapActive && !isSelected && (
                                          <div className="text-[10px] font-bold text-blue-700 mt-1 flex items-center justify-center gap-1 print:hidden">
                                            <ArrowRightLeft size={10} />
                                            <span>Takas Et</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="py-2 text-center">
                                        {isAvailableForPool ? (
                                          <div className="animate-pulse">
                                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300 block shadow-2xs">
                                              ✓ Müsait (Bırak / Tıkla)
                                            </span>
                                            <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">
                                              {times.startTime} - {times.endTime}
                                            </span>
                                          </div>
                                        ) : isConflictForPool ? (
                                          <div>
                                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 block">
                                              🚫 Meşgul
                                            </span>
                                            <span className="text-[9px] text-rose-600 block mt-0.5 truncate" title={slotAvailability.reason}>
                                              {slotAvailability.reason}
                                            </span>
                                          </div>
                                        ) : isSwapActive ? (
                                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-300 block print:hidden">
                                            + Buraya Taşı
                                          </span>
                                        ) : isPoolActive ? (
                                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 block print:hidden">
                                            Seçilemez
                                          </span>
                                        ) : (
                                          <div>
                                            <span className="text-slate-300 font-bold print:text-gray-400">—</span>
                                            <span className="text-[10px] text-slate-400 font-mono block print:hidden mt-0.5">
                                              {times.startTime}
                                            </span>
                                          </div>
                                        )}
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
                  </div>
                )}

                {/* 2. GÖRÜNÜM: ÖĞRETMEN BAZLI TABLO (SADECE KURSTA DERSİ OLAN ÖĞRETMENLER) */}
                {viewMode === 'teacher' && (
                  <div className="space-y-6">
                    {teachersWithDykLessons.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-2">
                        <div className="text-2xl">👨‍🏫</div>
                        <div className="font-bold text-slate-700">Henüz DYK Kursunda Dersi Olan Öğretmen Bulunmuyor</div>
                        <p className="text-slate-400">
                          Öğretmen bazlı çizelgeyi görüntülemek için önce "4. Ders & Atamalar" menüsünden ders ataması yapıp dağıtım motorunu çalıştırın.
                        </p>
                      </div>
                    ) : (
                      (effectiveTeacherId === 'ALL' 
                        ? teachersWithDykLessons 
                        : teachersWithDykLessons.filter(t => t.id === effectiveTeacherId)
                      ).map((curTeacher) => (
                        <div key={curTeacher.id} className="space-y-3 print:break-after-page">
                          <div className="flex justify-between items-center print:border-b print:pb-1">
                            <h3 className="text-sm font-extrabold text-slate-900 print:text-black flex items-center gap-2">
                              <span>Öğretmen:</span>
                              <span className="text-emerald-700 print:text-black font-black">{curTeacher.name}</span>
                              <span className="text-xs text-slate-500 font-normal">({curTeacher.branch || 'Genel'})</span>
                            </h3>
                            <span className="text-xs text-slate-500 font-semibold print:text-black">
                              Kişisel DYK Kurs Çizelgesi
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-2xl print:border-black print:rounded-none">
                            <table className="w-full text-center text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold print:bg-white print:border-black">
                                  <th className="p-3 border-r border-slate-200 text-left font-black print:border-black">Kurs Blokları</th>
                                  {activeDays.map(day => (
                                    <th key={day} className="p-3 border-r border-slate-200 last:border-r-0 font-extrabold print:border-black">
                                      {day}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 print:divide-black">
                                {blocks.map(block => (
                                  <tr key={block.id} className="hover:bg-slate-50/50 print:border-b print:border-black">
                                    <td className="p-3 text-left border-r border-slate-200 bg-slate-50/80 font-bold text-slate-800 print:bg-white print:border-black">
                                      <div>{block.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono print:text-gray-600">
                                        {block.startTime} - {block.endTime}
                                      </div>
                                    </td>
                                    {activeDays.map(day => {
                                      // dykSchedule içinde bu öğretmenin dersini bul
                                      let found = null;
                                      Object.keys(dykSchedule || {}).forEach(gId => {
                                        const cell = dykSchedule[gId]?.[day]?.[block.id];
                                        if (cell && cell.teacherId === curTeacher.id) {
                                          found = { ...cell, groupName: getGroupName(gId) };
                                        }
                                      });

                                      return (
                                        <td key={day} className="p-3 border-r border-slate-200 last:border-r-0 print:border-black">
                                          {found ? (
                                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-bold print:bg-white print:border print:border-black">
                                              <div className="text-xs font-black text-blue-900 print:text-black">
                                                {found.subject}
                                              </div>
                                              <div className="text-[11px] text-slate-600 print:text-black font-semibold mt-0.5">
                                                {found.groupName}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-slate-300 font-bold print:text-gray-400">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. GÖRÜNÜM: GENEL ÇARŞAF LİSTE (TÜM SINIFLAR MATRİSİ) */}
                {viewMode === 'matrix' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center print:border-b print:pb-1">
                      <h3 className="text-sm font-extrabold text-slate-900 print:text-black">
                        Tüm Sınıflar Genel DYK Dağıtım Çizelgesi (Çarşaf Liste)
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold print:text-black">
                        Toplam {dykGroups.length} Grup
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl print:border-black print:rounded-none">
                      <table className="w-full text-center text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold print:bg-white print:border-black">
                            <th className="p-2 border-r border-slate-200 text-left font-black print:border-black">DYK Sınıfı</th>
                            {activeDays.map(day => {
                              const hasCustom = Boolean(dayCustomTimes[day] && Object.keys(dayCustomTimes[day]).length > 0);
                              return (
                                <th key={day} colSpan={blocks.length} className="p-2 border-r border-slate-200 last:border-r-0 font-extrabold print:border-black">
                                  <div>{day}</div>
                                  {hasCustom && (
                                    <div className="text-[9px] text-amber-700 font-mono font-normal print:text-black">
                                      (Özel Saat)
                                    </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 text-[10px] font-bold print:bg-white print:border-black">
                            <th className="p-1 border-r border-slate-200 print:border-black"></th>
                            {activeDays.map(day => (
                              <React.Fragment key={day}>
                                {blocks.map((b, idx) => {
                                  const times = getDykBlockTimes(dykSettings, day, b.id);
                                  return (
                                    <th key={b.id} className="p-1 border-r border-slate-200 last:border-r-0 font-mono print:border-black">
                                      <div>{idx + 1}. Blok</div>
                                      <div className="text-[9px] font-normal opacity-75">{times.startTime}</div>
                                    </th>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                          {dykGroups.map(group => (
                            <tr key={group.id} className="hover:bg-slate-50/50 print:border-b print:border-black">
                              <td className="p-2 text-left border-r border-slate-200 bg-slate-50/80 font-bold text-slate-900 print:bg-white print:border-black whitespace-nowrap">
                                {group.name}
                              </td>
                              {activeDays.map(day => (
                                <React.Fragment key={day}>
                                  {blocks.map(b => {
                                    const cell = dykSchedule?.[group.id]?.[day]?.[b.id];
                                    const times = getDykBlockTimes(dykSettings, day, b.id);
                                    const isSelected = selectedSwapSlot &&
                                      selectedSwapSlot.groupId === group.id &&
                                      selectedSwapSlot.day === day &&
                                      selectedSwapSlot.blockId === b.id;
                                    const isSwapActive = Boolean(selectedSwapSlot);
                                    const isPoolActive = Boolean(selectedPoolActivity);

                                    const slotAvailability = selectedPoolActivity
                                      ? checkDykSlotAvailability({
                                          activity: selectedPoolActivity,
                                          targetGroupId: group.id,
                                          targetDay: day,
                                          targetBlockId: b.id,
                                          dykSchedule,
                                          dykTeacherAvailabilities,
                                          dykGroups
                                        })
                                      : null;

                                    const isAvailableForPool = Boolean(slotAvailability && slotAvailability.canPlace && !cell);
                                    const isConflictForPool = Boolean(slotAvailability && !slotAvailability.canPlace && slotAvailability.status === 'teacher_conflict');
                                    const isWrongGroup = Boolean(slotAvailability && slotAvailability.status === 'wrong_group');

                                    return (
                                      <td
                                        key={b.id}
                                        onClick={() => handleSlotClick(group.id, day, b.id, cell)}
                                        onDragOver={(e) => {
                                          if (selectedPoolActivity || selectedSwapSlot) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                          }
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          handleSlotClick(group.id, day, b.id, cell);
                                        }}
                                        className={`p-1.5 border-r border-slate-200 last:border-r-0 print:border-black min-w-[95px] transition-all cursor-pointer select-none relative ${
                                          isSelected
                                            ? 'bg-emerald-100 ring-2 ring-emerald-500'
                                            : isAvailableForPool
                                            ? 'bg-emerald-50 border-2 border-dashed border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                                            : isConflictForPool
                                            ? 'bg-rose-50/70 border border-rose-300 text-rose-800 cursor-not-allowed'
                                            : isWrongGroup
                                            ? 'opacity-35 cursor-not-allowed'
                                            : isSwapActive && !cell && selectedSwapSlot.groupId === group.id
                                            ? 'bg-emerald-50/80 hover:bg-emerald-100 border-dashed border-emerald-400'
                                            : isSwapActive && cell && selectedSwapSlot.groupId === group.id && !isSelected
                                            ? 'hover:bg-blue-50/80 border-dashed border-blue-400'
                                            : isPoolActive && cell
                                            ? 'opacity-50'
                                            : 'hover:bg-slate-50/80'
                                        }`}
                                        title={
                                          isSelected
                                            ? "Seçili slot"
                                            : isAvailableForPool
                                            ? `✓ Müsait: ${times.startTime} - ${times.endTime} (Bırakın veya tıklayın)`
                                            : isConflictForPool
                                            ? `🚫 Meşgul: ${slotAvailability.reason}`
                                            : isWrongGroup
                                            ? `Bu ders ${getGroupName(selectedPoolActivity.groupId)} sınıfına ait`
                                            : isSwapActive && selectedSwapSlot.groupId === group.id
                                            ? (cell ? "Takas Et" : "Buraya Taşı")
                                            : cell ? `Seçmek için tıklayın (${times.startTime} - ${times.endTime})` : `Boş (${times.startTime} - ${times.endTime})`
                                        }
                                      >
                                        {cell ? (
                                          <div 
                                            draggable={true}
                                            onDragStart={(e) => {
                                              setSelectedSwapSlot({
                                                groupId: group.id,
                                                day,
                                                blockId: b.id,
                                                cell
                                              });
                                              setSelectedPoolActivity(null);
                                              e.dataTransfer.setData("application/json", JSON.stringify({ type: 'slot', groupId: group.id, day, blockId: b.id }));
                                              e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            className={`p-1 rounded font-semibold text-[10px] border transition-all cursor-grab active:cursor-grabbing print:bg-white print:border-black ${
                                            isSelected
                                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                          }`}>
                                            <div className={`font-bold ${isSelected ? 'text-white' : 'text-emerald-900 print:text-black'}`}>
                                              {cell.subject}
                                            </div>
                                            <div className={`text-[9px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500 print:text-black'}`}>
                                              {getTeacherName(cell.teacherId)}
                                            </div>
                                            <div className={`text-[8px] font-mono mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400 print:text-black'}`}>
                                              {times.startTime}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="py-1 text-center">
                                            {isAvailableForPool ? (
                                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 block shadow-2xs animate-pulse">
                                                ✓ Müsait
                                              </span>
                                            ) : isConflictForPool ? (
                                              <span className="text-[8px] font-bold text-rose-700 bg-rose-100 px-1 py-0.5 rounded border border-rose-200 block truncate" title={slotAvailability.reason}>
                                                🚫 Meşgul
                                              </span>
                                            ) : isSwapActive && selectedSwapSlot.groupId === group.id ? (
                                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-300 block print:hidden">
                                                +Taşı
                                              </span>
                                            ) : (
                                              <span className="text-slate-200 print:text-gray-300">—</span>
                                            )}
                                          </div>
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
                  </div>
                )}

                {/* RESMİ İMZA VE MÜHÜR ALANI (A4 ÇIKTISININ ALTINDA) */}
                <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-700 font-bold print:text-black">
                  <div className="space-y-12">
                    <p>Düzenleyen<br /><span className="font-normal text-[11px] text-slate-500 print:text-black">Müdür Yardımcısı / DYK Koordinatörü</span></p>
                    <p className="font-mono">{formatDateTurkish(docIssueDate)}<br />İmza</p>
                  </div>

                  <div className="space-y-12">
                    <p>
                      UYGUNDUR<br />
                      <span className="font-black text-sm text-slate-900 print:text-black">{settings?.principalName || 'Cemil Murat Kuru'}</span><br />
                      <span className="font-normal text-[11px] text-slate-500 print:text-black">Okul Müdürü</span>
                    </p>
                    <p className="font-mono">{formatDateTurkish(docApprovalDate)}<br />İmza / Mühür</p>
                  </div>
                </div>

              </div>
            )}

            {/* Geri Adım Butonu */}
            <div className="flex justify-between items-center pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                ← 4. Dersler & Atamalar
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 🌟 DIŞARIDAN / HARİCİ ÖĞRETMEN EKLEME MODALI */}
      {/* ========================================================= */}
      {showExternalTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-600" />
                <span>Harici / Dışarıdan Öğretmen Ekle</span>
              </h3>
              <button
                onClick={() => setShowExternalTeacherModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Okul kadrosunda olmayıp DYK kapsamında ders verecek başka bir öğretmeni sisteme dahil edin.
            </p>

            <form onSubmit={handleAddExternalTeacher} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Öğretmen Adı Soyadı
                </label>
                <input
                  type="text"
                  value={externalTeacherName}
                  onChange={(e) => setExternalTeacherName(e.target.value)}
                  placeholder="Örn: AHMET YILMAZ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Branş
                </label>
                <select
                  value={externalTeacherBranch}
                  onChange={(e) => setExternalTeacherBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {DYK_TARGET_BRANCHES.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                  <option value="Felsefe">Felsefe</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExternalTeacherModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Öğretmeni Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏫 OKUL KADROSUNDAN ÖĞRETMEN EKLEME MODALI */}
      {/* ========================================================= */}
      {showAddSchoolTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-600" />
                <span>Okul Kadrosundan DYK'ya Dahil Et</span>
              </h3>
              <button
                onClick={() => setShowAddSchoolTeacherModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              DYK'dan çıkarılmış veya diğer branşlarda olan okul öğretmenlerinden birini kurs kadrosuna dahil edin.
            </p>

            <form onSubmit={handleAddSchoolTeacherToDyk} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Öğretmen Seçin ({availableSchoolTeachersToAdd.length} Öğretmen Mevcut)
                </label>
                <select
                  value={selectedSchoolTeacherIdToAdd}
                  onChange={(e) => setSelectedSchoolTeacherIdToAdd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  required
                >
                  <option value="">-- Öğretmen Seçiniz --</option>
                  {availableSchoolTeachersToAdd.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.branch || 'Genel'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolTeacherModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!selectedSchoolTeacherIdToAdd}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  DYK Kadrosuna Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* 🛡️ MODERN ONAY MODALI (SİSTEM UYARISI YERİNE) */}
      {/* ========================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl border ${
                confirmModal.isDanger
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {confirmModal.isDanger ? '🗑️' : '⚠️'}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lütfen işleminizi onaylayın.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {confirmModal.message}
              </p>
              {confirmModal.details && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {confirmModal.details}
                </p>
              )}
            </div>

            <div className="flex justify-end items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Vazgeç'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                  closeConfirmModal();
                }}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all cursor-pointer ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.confirmText || 'Evet, Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
