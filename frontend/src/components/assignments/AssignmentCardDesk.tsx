// frontend/src/components/assignments/AssignmentCardDesk.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  Sparkles, 
  X, 
  Copy, 
  Filter, 
  Layers, 
  Clock, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { generateCourseCode } from '../../utils/courseCodeHelper';
import { CURRICULUM_TEMPLATES, suggestCurriculumTemplate } from '../../utils/curriculumTemplates';

export default function AssignmentCardDesk() {
  const { classrooms, teachers, updateClassroom, settings } = useAppStore();

  // Hedef haftalık saat (Genellikle 5 gün x 8 saat = 40 saat)
  const targetWeeklyHours = (settings?.days?.length || 5) * (settings?.periodsPerDay || 8);

  // Seçili Durumlar (Sınıf, Ders, Öğretmen)
  const [selectedClassId, setSelectedClassId] = useState(classrooms[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  // Arama ve Filtreler
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState('all'); // 'all', '9', '10', '11', '12', 'incomplete'
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherBranchFilter, setTeacherBranchFilter] = useState('all');
  const [onlyCompatibleTeachers, setOnlyCompatibleTeachers] = useState(false);

  // Modallar ve Hızlı Formlar
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ subject: '', code: '', hoursPerWeek: 2, teacherId: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Bildirim Toast fonksiyonu
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Geçerli seçili sınıf
  const currentClass = useMemo(() => {
    return classrooms.find(c => c.id === selectedClassId) || classrooms[0] || null;
  }, [classrooms, selectedClassId]);

  // Öğretmen ders yükleri hesaplama
  const teacherLoads = useMemo(() => {
    const loads = {};
    teachers.forEach(t => { loads[t.id] = 0; });
    classrooms.forEach(c => {
      (c.courses || []).forEach(co => {
        if (co.teacherId && loads[co.teacherId] !== undefined) {
          loads[co.teacherId] += Number(co.hoursPerWeek) || 0;
        }
      });
    });
    return loads;
  }, [teachers, classrooms]);

  // Tüm sınıfların durum analizi (Tamamlandı mı, saat eksik mi, öğretmen eksik mi?)
  const classStatusMap = useMemo(() => {
    const map: Record<string, {
      totalHours: number;
      unassignedCount: number;
      isHoursFull: boolean;
      isAllTeachersAssigned: boolean;
      isComplete: boolean;
      missingHours: number;
    }> = {};
    classrooms.forEach(c => {
      const courses = c.courses || [];
      const totalHours = courses.reduce((sum, co) => sum + (Number(co.hoursPerWeek) || 0), 0);
      const unassignedCourses = courses.filter(co => !co.teacherId);
      const isHoursFull = totalHours >= targetWeeklyHours;
      const isAllTeachersAssigned = courses.length > 0 && unassignedCourses.length === 0;
      const isComplete = isHoursFull && isAllTeachersAssigned;

      map[c.id] = {
        totalHours,
        unassignedCount: unassignedCourses.length,
        isHoursFull,
        isAllTeachersAssigned,
        isComplete,
        missingHours: Math.max(0, targetWeeklyHours - totalHours)
      };
    });
    return map;
  }, [classrooms, targetWeeklyHours]);

  // Filtrelenmiş Sınıflar
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(classSearchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const status = classStatusMap[c.id];
      if (classGradeFilter === 'incomplete') return !status?.isComplete;
      if (classGradeFilter !== 'all') {
        const cleanName = c.name.trim();
        return cleanName.startsWith(classGradeFilter) || cleanName.includes(`${classGradeFilter}-`) || cleanName.includes(`${classGradeFilter}/`);
      }
      return true;
    });
  }, [classrooms, classSearchTerm, classGradeFilter, classStatusMap]);

  // Sıradaki eksik sınıfı bul (Tamamlanınca otomatik geçiş için)
  const nextIncompleteClass = useMemo(() => {
    return classrooms.find(c => c.id !== selectedClassId && !classStatusMap[c.id]?.isComplete);
  }, [classrooms, selectedClassId, classStatusMap]);

  // Seçili ders objesi
  const currentCourse = useMemo(() => {
    if (!currentClass || !selectedCourseId) return null;
    return (currentClass.courses || []).find(co => co.id === selectedCourseId) || null;
  }, [currentClass, selectedCourseId]);

  // Seçili öğretmen objesi
  const currentTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return teachers.find(t => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // Bir öğretmenin bir dersi verebilme uygunluğu (Branş eşleşmesi)
  const isTeacherEligibleForCourse = (teacher, course) => {
    if (!teacher || !course) return false;
    const cleanSubject = (course.subject || '').toLowerCase().trim();
    const cleanBranch = (teacher.branch || '').toLowerCase().trim();
    const subjects = (teacher.subjects || []).map(s => s.toLowerCase().trim());

    if (cleanBranch && (cleanSubject.includes(cleanBranch) || cleanBranch.includes(cleanSubject))) return true;
    if (subjects.some(s => cleanSubject.includes(s) || s.includes(cleanSubject))) return true;

    // Ortak branş kök eşleştirmeleri
    if (cleanSubject.includes('matematik') && cleanBranch.includes('mat')) return true;
    if (cleanSubject.includes('edebiyat') && (cleanBranch.includes('edebiyat') || cleanBranch.includes('türkçe'))) return true;
    if (cleanSubject.includes('türkçe') && (cleanBranch.includes('edebiyat') || cleanBranch.includes('türkçe'))) return true;
    if (cleanSubject.includes('fizik') && cleanBranch.includes('fizik')) return true;
    if (cleanSubject.includes('kimya') && cleanBranch.includes('kimya')) return true;
    if (cleanSubject.includes('biyoloji') && cleanBranch.includes('biyo')) return true;
    if (cleanSubject.includes('tarih') && cleanBranch.includes('tarih')) return true;
    if (cleanSubject.includes('coğrafya') && cleanBranch.includes('coğ')) return true;
    if (cleanSubject.includes('ingilizce') && cleanBranch.includes('ing')) return true;
    if (cleanSubject.includes('almanca') && cleanBranch.includes('alm')) return true;
    if (cleanSubject.includes('din') && (cleanBranch.includes('din') || cleanBranch.includes('ihk') || cleanBranch.includes('ilahiyat'))) return true;
    if (cleanSubject.includes('beden') && cleanBranch.includes('beden')) return true;
    if (cleanSubject.includes('müzik') && cleanBranch.includes('müzik')) return true;
    if (cleanSubject.includes('görsel') && (cleanBranch.includes('görsel') || cleanBranch.includes('resim'))) return true;
    if (cleanSubject.includes('felsefe') && cleanBranch.includes('fel')) return true;

    return false;
  };

  // Filtrelenmiş Öğretmenler
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) || 
                          (t.branch || '').toLowerCase().includes(teacherSearchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (teacherBranchFilter !== 'all' && t.branch !== teacherBranchFilter) return false;

      // Eğer bir ders seçiliyse ve "Sadece Uygun Branşlar" aktifse
      if (currentCourse && onlyCompatibleTeachers) {
        return isTeacherEligibleForCourse(t, currentCourse);
      }

      return true;
    }).sort((a, b) => {
      // Eğer bir ders seçiliyse uygun branşları en üste al
      if (currentCourse) {
        const aEligible = isTeacherEligibleForCourse(a, currentCourse);
        const bEligible = isTeacherEligibleForCourse(b, currentCourse);
        if (aEligible && !bEligible) return -1;
        if (!aEligible && bEligible) return 1;
      }
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [teachers, teacherSearchTerm, teacherBranchFilter, currentCourse, onlyCompatibleTeachers]);

  // Mevcut öğretmen branşlarının tekil listesi
  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(teachers.map(t => t.branch).filter(Boolean))).sort();
  }, [teachers]);

  // ==============================================================
  // ATAMA VE KART AKSİYONLARI
  // ==============================================================

  // 1. Öğretmeni Derse Ata
  const handleAssignTeacherToCourse = (courseId, teacherId) => {
    if (!currentClass) return;
    const targetCourse = (currentClass.courses || []).find(c => c.id === courseId);
    const teacher = teachers.find(t => t.id === teacherId);

    const updatedCourses = (currentClass.courses || []).map(co => {
      if (co.id === courseId) {
        return { ...co, teacherId };
      }
      return co;
    });

    updateClassroom(currentClass.id, { courses: updatedCourses });
    showToast(`"${targetCourse?.subject}" dersine ${teacher?.name} atandı.`);

    // Eğer bir sonraki atanmamış ders varsa ona yumuşakça odaklan
    const remainingUnassigned = updatedCourses.filter(co => !co.teacherId && co.id !== courseId);
    if (remainingUnassigned.length > 0) {
      setSelectedCourseId(remainingUnassigned[0].id);
    } else {
      setSelectedCourseId(null);
      // Sınıf 40 saate ulaştıysa tebrik et!
      const totalHours = updatedCourses.reduce((sum, co) => sum + (Number(co.hoursPerWeek) || 0), 0);
      if (totalHours >= targetWeeklyHours) {
        showToast(`🎉 Tebrikler! "${currentClass.name}" sınıfının tüm atamaları tamamlandı!`, 'complete');
      }
    }
  };

  // 2. Atamayı Kaldır
  const handleUnassignTeacher = (courseId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentClass) return;
    const targetCourse = (currentClass.courses || []).find(c => c.id === courseId);

    const updatedCourses = (currentClass.courses || []).map(co => {
      if (co.id === courseId) {
        return { ...co, teacherId: '' };
      }
      return co;
    });

    updateClassroom(currentClass.id, { courses: updatedCourses });
    showToast(`"${targetCourse?.subject}" dersinin öğretmen ataması kaldırıldı.`, 'info');
  };

  // 3. Ders Saatini Artır / Azalt
  const handleAdjustHours = (courseId, delta, e) => {
    if (e) e.stopPropagation();
    if (!currentClass) return;

    const updatedCourses = (currentClass.courses || []).map(co => {
      if (co.id === courseId) {
        const newHours = Math.max(1, Math.min(10, (Number(co.hoursPerWeek) || 2) + delta));
        return { ...co, hoursPerWeek: newHours };
      }
      return co;
    });

    updateClassroom(currentClass.id, { courses: updatedCourses });
  };

  // 4. Dersi Sınıftan Sil
  const handleDeleteCourse = (courseId, e) => {
    if (e) e.stopPropagation();
    if (!currentClass) return;
    const targetCourse = (currentClass.courses || []).find(c => c.id === courseId);

    if (window.confirm(`"${targetCourse?.subject}" dersini ${currentClass.name} sınıfından silmek istediğinize emin misiniz?`)) {
      const updatedCourses = (currentClass.courses || []).filter(co => co.id !== courseId);
      updateClassroom(currentClass.id, { courses: updatedCourses });
      if (selectedCourseId === courseId) setSelectedCourseId(null);
      showToast(`"${targetCourse?.subject}" dersi silindi.`, 'info');
    }
  };

  // 5. Yeni Ders Ekle
  const handleAddNewCourse = (e) => {
    e.preventDefault();
    if (!newCourse.subject.trim() || !currentClass) return;

    const generatedCode = newCourse.code.trim() || generateCourseCode(newCourse.subject, currentClass.name);
    const newCourseObj = {
      id: `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      subject: newCourse.subject.trim(),
      code: generatedCode.toUpperCase(),
      hoursPerWeek: Number(newCourse.hoursPerWeek) || 2,
      teacherId: newCourse.teacherId || ''
    };

    updateClassroom(currentClass.id, {
      courses: [...(currentClass.courses || []), newCourseObj]
    });

    setNewCourse({ subject: '', code: '', hoursPerWeek: 2, teacherId: '' });
    setShowAddCourseForm(false);
    showToast(`"${newCourseObj.subject}" dersi ${currentClass.name} sınıfına eklendi.`);
  };

  // 6. Müfredat Şablonu Uygula
  const handleApplyTemplate = (template) => {
    if (!currentClass || !template) return;

    const existingSubjects = new Set((currentClass.courses || []).map(c => c.subject.toLowerCase().trim()));
    const newCoursesFromTemplate = template.courses.map(tCourse => ({
      id: `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      subject: tCourse.subject,
      code: tCourse.code || generateCourseCode(tCourse.subject, currentClass.name),
      hoursPerWeek: tCourse.hoursPerWeek,
      teacherId: ''
    }));

    if (window.confirm(`"${template.name}" şablonundaki ${template.courses.length} ders ${currentClass.name} sınıfına yüklenecektir. Onaylıyor musunuz?`)) {
      updateClassroom(currentClass.id, {
        courses: newCoursesFromTemplate
      });
      setShowTemplateModal(false);
      showToast(`"${template.name}" başarıyla yüklendi.`);
    }
  };

  // 7. Başka Sınıfın Derslerini Kopyala
  const handleCopyFromClass = () => {
    if (!currentClass || !copySourceClassId) return;
    const sourceClass = classrooms.find(c => c.id === copySourceClassId);
    if (!sourceClass || !sourceClass.courses) return;

    if (window.confirm(`"${sourceClass.name}" sınıfının müfredat dersleri "${currentClass.name}" sınıfına aktarılacak. Onaylıyor musunuz?`)) {
      const clonedCourses = sourceClass.courses.map(co => ({
        id: `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
        subject: co.subject,
        code: generateCourseCode(co.subject, currentClass.name),
        hoursPerWeek: co.hoursPerWeek,
        teacherId: co.teacherId || '' // Varsa öğretmenini de kopyala
      }));

      updateClassroom(currentClass.id, { courses: clonedCourses });
      setShowCopyModal(false);
      showToast(`"${sourceClass.name}" sınıfının dersleri başarıyla kopyalandı.`);
    }
  };

  // 8. Süper Güç: Bu Öğretmeni Aynı Kademedeki Diğer Şubelere de Ata
  const handleCopyTeacherToOtherSections = (course, teacherId, e) => {
    if (e) e.stopPropagation();
    if (!currentClass || !course || !teacherId) return;

    const teacher = teachers.find(t => t.id === teacherId);
    const gradePrefix = currentClass.name.match(/\d+/)?.[0] || '';
    if (!gradePrefix) {
      showToast("Sınıfın kademesi tespit edilemedi.", "info");
      return;
    }

    // Aynı kademedeki diğer sınıflar (Örn: 9-B, 9-C, 9-D)
    const otherClassesInGrade = classrooms.filter(c => 
      c.id !== currentClass.id && 
      (c.name.startsWith(gradePrefix) || c.name.includes(`${gradePrefix}-`) || c.name.includes(`${gradePrefix}/`))
    );

    let updatedCount = 0;
    otherClassesInGrade.forEach(otherClass => {
      const matchingCourse = (otherClass.courses || []).find(
        co => co.subject.toLowerCase().trim() === course.subject.toLowerCase().trim()
      );
      if (matchingCourse) {
        const updatedCourses = (otherClass.courses || []).map(co => {
          if (co.id === matchingCourse.id) {
            return { ...co, teacherId };
          }
          return co;
        });
        updateClassroom(otherClass.id, { courses: updatedCourses });
        updatedCount++;
      }
    });

    showToast(`${teacher?.name}, diğer ${updatedCount} şubenin "${course.subject}" dersine de atandı!`);
  };

  // Seçili sınıf değiştiğinde ders seçimini temizle
  useEffect(() => {
    setSelectedCourseId(null);
  }, [selectedClassId]);

  return (
    <div className="space-y-4">

      {/* 🌟 BİLDİRİM TOAST BANNERI */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'complete'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400'
            : toastMessage.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
            {toastMessage.type === 'complete' ? (
              <Sparkles size={18} className="animate-spin text-amber-300" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          {toastMessage.type === 'complete' && nextIncompleteClass && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassId(nextIncompleteClass.id);
                setToastMessage(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>{nextIncompleteClass.name} Sınıfına Geç</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* 🧭 ÜST KONTROL & İLERLEME ÇUBUĞU */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-black">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Akıllı Kart Eşleştirme Masası</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Canlı Eşleme Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sol sütundan sınıfınızı seçin; ortadaki ders kartlarına tıklayarak sağdaki öğretmenlerle anında çakışmasız eşleyin.
            </p>
          </div>
        </div>

        {/* Okul Tamamlanma Durumu */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Okul Tamamlanma Durumu</div>
            <div className="text-sm font-black text-slate-800">
              {Object.values(classStatusMap).filter(s => s.isComplete).length} / {classrooms.length} Sınıf Tam
            </div>
          </div>
          <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{
                width: `${classrooms.length ? (Object.values(classStatusMap).filter(s => s.isComplete).length / classrooms.length) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3 KOLONLU ÇALIŞMA MASASI (SINIFLAR ⇄ DERSLER ⇄ ÖĞRETMENLER)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* ══════════════════════════════════════════════════════════════
            1. KOLON: SINIF KARTLARI (md:col-span-3)
            ══════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col h-[750px]">
          {/* Başlık ve Filtreler */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <GraduationCap size={15} className="text-indigo-600" />
                <span>1. Sınıflar ({classrooms.length})</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Hedef: {targetWeeklyHours} Sa
              </span>
            </div>

            {/* Arama Kutusu */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Sınıf ara (9A, 11B)..."
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Kademe Filtre Çipleri */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              {['all', '9', '10', '11', '12', 'incomplete'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setClassGradeFilter(tab)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer ${
                    classGradeFilter === tab
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'Tümü' : tab === 'incomplete' ? '⚠️ Eksikler' : `${tab}. Sınıf`}
                </button>
              ))}
            </div>
          </div>

          {/* Sınıf Kartları Listesi */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
            {filteredClassrooms.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Filtreye uygun sınıf bulunamadı.
              </div>
            ) : (
              filteredClassrooms.map(c => {
                const isSelected = selectedClassId === c.id;
                const status: any = classStatusMap[c.id] || {};
                const percent = Math.min(100, Math.round((status.totalHours / targetWeeklyHours) * 100));

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassId(c.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-2 ring-indigo-500/30'
                        : status.isComplete
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
                        : status.missingHours > 10
                        ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-amber-50/30 hover:bg-amber-50/60 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900">
                          {c.name}
                        </span>
                        {status.isComplete ? (
                          <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                            <Check size={10} strokeWidth={3} />
                            <span>Tam</span>
                          </span>
                        ) : status.unassignedCount > 0 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                            {status.unassignedCount} Boş
                          </span>
                        ) : null}
                      </div>

                      <span className={`text-[11px] font-black ${
                        status.isComplete 
                          ? 'text-emerald-700' 
                          : status.totalHours > targetWeeklyHours
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}>
                        {status.totalHours} / {targetWeeklyHours} Sa
                      </span>
                    </div>

                    {/* Canlı İlerleme Çubuğu */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          status.isComplete
                            ? 'bg-emerald-500'
                            : status.totalHours > targetWeeklyHours
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            2. KOLON: SEÇİLİ SINIFIN DERSLERİ & MÜFREDAT KARTLARI (md:col-span-5)
            ══════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col h-[750px]">
          {currentClass ? (
            <>
              {/* Kolon Üst Başlığı & Hızlı Aksiyonlar */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <BookOpen size={15} className="text-indigo-600" />
                      <span>{currentClass.name} Müfredatı</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      classStatusMap[currentClass.id]?.isComplete
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}>
                      {classStatusMap[currentClass.id]?.totalHours || 0} / {targetWeeklyHours} Saat
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="MEB standart müfredat şablonu yükle"
                    >
                      <Sparkles size={12} className="text-indigo-600" />
                      <span>Şablon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCopyModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Başka bir sınıfın derslerini buraya kopyala"
                    >
                      <Copy size={12} />
                      <span>Kopyala</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus size={12} />
                      <span>Ders Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Hızlı Ders Ekleme Formu (Açılır-Kapanır) */}
                {showAddCourseForm && (
                  <form onSubmit={handleAddNewCourse} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                        <Plus size={12} className="text-indigo-600" />
                        <span>Yeni Müfredat Dersi Tanımla</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCourseForm(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Ders Adı (Örn: Matematik)"
                          value={newCourse.subject}
                          onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Kod"
                          value={newCourse.code}
                          onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={newCourse.hoursPerWeek}
                          onChange={(e) => setNewCourse({ ...newCourse, hoursPerWeek: Number(e.target.value) || 1 })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Haftalık Saat"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Dersi Ekle</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sınıfın Ders Kartları Listesi */}
              <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
                {(!currentClass.courses || currentClass.courses.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Bu sınıfta henüz ders yok</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Yukarıdaki <strong>"Şablon"</strong> butonuna tıklayarak MEB standart 40 saatlik müfredatını tek tıkla yükleyebilirsiniz.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Sparkles size={14} />
                      <span>Standart Müfredat Yükle</span>
                    </button>
                  </div>
                ) : (
                  currentClass.courses.map(course => {
                    const isSelected = selectedCourseId === course.id;
                    const assignedTeacher = teachers.find(t => t.id === course.teacherId);
                    const isTeacherSelected = Boolean(selectedTeacherId);
                    const isCompatibleWithSelectedTeacher = isTeacherSelected 
                      ? isTeacherEligibleForCourse(currentTeacher, course)
                      : false;
                    const isCurrentTeacherAssigned = course.teacherId === selectedTeacherId;

                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          // Eğer bir öğretmen zaten seçiliyse, bu derse tıklanınca anında ata!
                          if (selectedTeacherId) {
                            if (isCurrentTeacherAssigned) {
                              handleUnassignTeacher(course.id);
                            } else {
                              handleAssignTeacherToCourse(course.id, selectedTeacherId);
                            }
                          } else {
                            // Öğretmen seçili değilse bu dersi seç (Öğretmenler listesinde filtreleme tetikle)
                            setSelectedCourseId(isSelected ? null : course.id);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer relative group ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-500/40'
                            : isTeacherSelected && isCompatibleWithSelectedTeacher
                            ? 'bg-emerald-50/80 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : isTeacherSelected && !isCompatibleWithSelectedTeacher
                            ? 'opacity-50 bg-slate-50 border-slate-200'
                            : assignedTeacher
                            ? 'bg-white hover:bg-slate-50/80 border-slate-200'
                            : 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {course.subject}
                            </span>
                            {course.code && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                {course.code}
                              </span>
                            )}
                          </div>

                          {/* Saat Ayarlama Düğmeleri */}
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleAdjustHours(course.id, -1, e)}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                              title="1 Saat Azalt"
                            >
                              -
                            </button>
                            <span className="text-xs font-black px-1.5 text-slate-800">
                              {course.hoursPerWeek} Sa
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustHours(course.id, +1, e)}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                              title="1 Saat Artır"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Alt Kısım: Öğretmen Atama Durumu & Aksiyonlar */}
                        <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100/80 text-[11px]">
                          {assignedTeacher ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                👤
                              </span>
                              <span className="font-bold text-slate-800 truncate">
                                {assignedTeacher.name}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                ({assignedTeacher.branch || 'Genel'})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                              <AlertTriangle size={13} className="text-amber-500" />
                              <span>Öğretmen Atanmadı</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Diğer Şubelere de Ata Butonu */}
                            {assignedTeacher && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyTeacherToOtherSections(course, assignedTeacher.id, e)}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                                title="Bu öğretmeni aynı kademedeki diğer şubelerin bu dersine de ata"
                              >
                                Diğer Şubelere Ata
                              </button>
                            )}

                            {/* Atamayı Kaldır */}
                            {assignedTeacher && (
                              <button
                                type="button"
                                onClick={(e) => handleUnassignTeacher(course.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Öğretmeni Kaldır"
                              >
                                <X size={13} />
                              </button>
                            )}

                            {/* Dersi Sil */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCourse(course.id, e)}
                              className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Dersi Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Lütfen sol panelden bir sınıf seçin.
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            3. KOLON: ÖĞRETMENLER KARTI (md:col-span-4)
            ══════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col h-[750px]">
          {/* Başlık ve Filtreler */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Users size={15} className="text-indigo-600" />
                <span>3. Öğretmenler ({teachers.length})</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Maaş/Ek Kota: 30 Sa
              </span>
            </div>

            {/* Arama Kutusu */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Öğretmen veya branş ara..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Branş Filtresi & Sadece Uygun Branş Switch */}
            <div className="flex items-center justify-between gap-2">
              <select
                value={teacherBranchFilter}
                onChange={(e) => setTeacherBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer flex-1"
              >
                <option value="all">Tüm Branşlar ({uniqueBranches.length})</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {currentCourse && (
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none shrink-0 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={onlyCompatibleTeachers}
                    onChange={(e) => setOnlyCompatibleTeachers(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Sadece Uygunlar</span>
                </label>
              )}
            </div>
          </div>

          {/* Öğretmen Kartları Listesi */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Filtreye uygun öğretmen bulunamadı.
              </div>
            ) : (
              filteredTeachers.map(teacher => {
                const load = teacherLoads[teacher.id] || 0;
                const isOverloaded = load > 30;
                const isSelected = selectedTeacherId === teacher.id;
                const isEligibleForSelectedCourse = currentCourse 
                  ? isTeacherEligibleForCourse(teacher, currentCourse)
                  : false;

                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => {
                      // Eğer ortada bir ders seçiliyse: öğretmene tıklandığı an atama gerçekleşsin!
                      if (selectedCourseId) {
                        handleAssignTeacherToCourse(selectedCourseId, teacher.id);
                      } else {
                        // Ortada ders seçili değilse: öğretmeni seç (Dersler listesinde uyumluları parlat)
                        setSelectedTeacherId(isSelected ? null : teacher.id);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-2 ring-indigo-500/30'
                        : selectedCourseId && isEligibleForSelectedCourse
                        ? 'bg-emerald-50/80 border-2 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : isOverloaded
                        ? 'bg-amber-50/50 hover:bg-amber-50/80 border-amber-300'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {teacher.name}
                        </span>
                        {selectedCourseId && isEligibleForSelectedCourse && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-600 text-white shrink-0">
                            ✓ Uygun
                          </span>
                        )}
                      </div>

                      {/* Canlı Yük Sayacı */}
                      <span className={`text-[11px] font-black shrink-0 px-2 py-0.5 rounded-full ${
                        isOverloaded
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : load === 30
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {load} / 30 Sa
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] w-full pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-500 truncate">
                        {teacher.branch || 'Genel'}
                      </span>
                      {selectedCourseId ? (
                        <span className="text-[10px] font-bold text-emerald-700 group-hover:underline">
                          + Bu Dersi Ata
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? 'Seçili' : 'Seçmek için tıkla'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          MÜFREDAT ŞABLONU SEÇİM MODALI
          ══════════════════════════════════════════════════════════════ */}
      {showTemplateModal && currentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  MEB Müfredat Şablonu Yükle ({currentClass.name})
                </h3>
              </div>
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Aşağıdaki şablonlardan birini seçtiğinizde, MEB standartlarına uygun haftalık 40 saatlik dersler otomatik olarak {currentClass.name} sınıfına aktarılacaktır.
            </p>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {CURRICULUM_TEMPLATES.map(tmpl => {
                const isSuggested = suggestCurriculumTemplate(currentClass.name) === tmpl.id;

                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSuggested
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-2xs hover:bg-indigo-100/90'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {tmpl.name}
                        </span>
                        {isSuggested && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                            Önerilen
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {tmpl.courses.length} farklı ders · Toplam {tmpl.totalHours} saat
                      </p>
                    </div>

                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BAŞKA SINIFTAN DERS KOPYALAMA MODALI
          ══════════════════════════════════════════════════════════════ */}
      {showCopyModal && currentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Copy size={20} className="text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Müfredat Kopyala
                </h3>
              </div>
              <button 
                onClick={() => setShowCopyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Başka bir sınıfın tüm müfredat derslerini ve atanmış öğretmenlerini <strong>{currentClass.name}</strong> sınıfına aktarabilirsiniz.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kaynak Sınıfı Seçin
              </label>
              <select
                value={copySourceClassId}
                onChange={(e) => setCopySourceClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Bir sınıf seçin...</option>
                {classrooms.filter(c => c.id !== currentClass.id).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({(c.courses || []).length} Ders · {classStatusMap[c.id]?.totalHours || 0} Saat)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!copySourceClassId}
                onClick={handleCopyFromClass}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check size={14} />
                <span>Kopyala ve Aktar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
