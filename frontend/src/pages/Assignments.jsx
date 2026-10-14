// frontend/src/pages/Assignments.jsx
import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Network, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  ArrowRight, 
  Info, 
  X, 
  Calendar, 
  CalendarDays, 
  GraduationCap, 
  User, 
  Users,
  Layers, 
  Sparkles,
  Clock,
  CheckCircle2,
  BookOpen,
  Lock,
  Hash
} from 'lucide-react';
import { getCourseColorClass } from '../utils/courseColors';
import DemoDataPromptModal from '../components/common/DemoDataPromptModal';
import { generateCourseCode } from '../utils/courseCodeHelper';
import AssignmentCardDesk from '../components/assignments/AssignmentCardDesk';

// Sınıf adı ve ders adına göre tutarlı gradyan renkler
const MODERN_GRADIENTS = [
  'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xs',
  'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs',
  'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs',
  'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs',
  'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-xs',
  'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-xs',
  'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-xs',
  'bg-gradient-to-r from-lime-600 to-emerald-700 text-white shadow-xs'
];

const getSubjectStyle = (subjectName = '', className = '') => {
  const key = `${className}-${subjectName}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return MODERN_GRADIENTS[Math.abs(hash) % MODERN_GRADIENTS.length];
};

export default function Assignments() {
  const { classrooms, teachers, updateClassroom, settings, timetable } = useAppStore();
  
  // Ana Sekme: 'cards' (Akıllı Kart Masası), 'list' (Atama Listesi) veya 'schedule' (Haftalık İlişki Çizelgesi)
  const [activeTab, setActiveTab] = useState('cards');

  // Filtreler (Atama Listesi İçin)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  // Öğretmen Ders Yükleri Paneli Durumları
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [isTeacherLoadExpanded, setIsTeacherLoadExpanded] = useState(true);
  
  // Yeni Atama Modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    classroomId: '',
    subject: '',
    code: '',
    teacherId: '',
    hoursPerWeek: 2
  });

  // Hızlı Çizelge İnceleme Modalı
  const [previewModalData, setPreviewModalData] = useState(null);

  // Haftalık İlişki Çizelgesi Sekmesi Durumları
  const [scheduleClassId, setScheduleClassId] = useState(classrooms[0]?.id || '');
  const [scheduleMode, setScheduleMode] = useState('subject'); // 'subject' veya 'teacher'
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const numPeriods = settings?.periodsPerDay || 8;
  const periodsArray = Array.from({ length: numPeriods }, (_, i) => i + 1);
  const daysArray = settings?.days || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

  // Tüm atamaların düz listesi
  const allAssignments = useMemo(() => {
    let list = [];
    classrooms.forEach(c => {
      if (c.courses) {
        c.courses.forEach(course => {
          list.push({
            ...course,
            code: course.code || generateCourseCode(course.subject, c.name),
            classroomId: c.id,
            className: c.name,
            teacherName: teachers.find(t => t.id === course.teacherId)?.name || 'Atanmamış'
          });
        });
      }
    });
    return list;
  }, [classrooms, teachers]);

  const filteredAssignments = allAssignments.filter(a => {
    const matchSearch = (a.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (a.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass ? a.classroomId === filterClass : true;
    const matchTeacher = filterTeacher ? a.teacherId === filterTeacher : true;
    return matchSearch && matchClass && matchTeacher;
  });

  const uniqueSubjects = Array.from(new Set(allAssignments.map(a => a.subject).filter(Boolean)));

  const getTeacherLoad = (tId) => {
    return allAssignments.filter(a => a.teacherId === tId).reduce((sum, a) => sum + (parseInt(a.hoursPerWeek) || 0), 0);
  };

  // Öğretmen ders yükü ve > 30 saat aşırı yük analizi
  const teacherLoadStats = useMemo(() => {
    return teachers.map(t => {
      const load = getTeacherLoad(t.id);
      const isOverloaded = load > 30;
      const courses = allAssignments.filter(a => a.teacherId === t.id);
      return {
        ...t,
        load,
        isOverloaded,
        courses
      };
    }).sort((a, b) => b.load - a.load);
  }, [teachers, allAssignments]);

  const overloadedTeachers = useMemo(() => {
    return teacherLoadStats.filter(t => t.isOverloaded);
  }, [teacherLoadStats]);

  const teacherForModal = useMemo(() => {
    if (!selectedTeacherForSchedule) return null;
    return teacherLoadStats.find(t => t.id === selectedTeacherForSchedule) || null;
  }, [selectedTeacherForSchedule, teacherLoadStats]);

  // Seçili öğretmenin haftalık ders programı grid verisi
  const teacherModalSchedule = useMemo(() => {
    if (!selectedTeacherForSchedule || !timetable) return {};
    const grid = {};
    daysArray.forEach(d => { grid[d] = {}; });

    Object.entries(timetable).forEach(([clsId, daysObj]) => {
      if (!daysObj) return;
      Object.entries(daysObj).forEach(([day, slots]) => {
        if (!Array.isArray(slots)) return;
        slots.forEach(slot => {
          if (slot.teacherId === selectedTeacherForSchedule) {
            grid[day][slot.period] = {
              ...slot,
              classId: clsId,
              className: classrooms.find(c => c.id === clsId)?.name || clsId
            };
          }
        });
      });
    });
    return grid;
  }, [selectedTeacherForSchedule, timetable, daysArray, classrooms]);

  // Akıllı Öğretmen Filtreleme Motoru
  const eligibleTeachers = useMemo(() => {
    if (!newAssignment.subject.trim()) return [];
    const subjectToMatch = newAssignment.subject.trim().toLowerCase();
    return teachers.filter(t => {
      const tSubjects = (t.subjects || []).map(s => s.toLowerCase());
      const tBranch = (t.branch || '').toLowerCase();
      return tSubjects.includes(subjectToMatch) || tBranch === subjectToMatch;
    });
  }, [newAssignment.subject, teachers]);

  const isSubjectAlreadyAssigned = useMemo(() => {
    try {
      if (!newAssignment?.classroomId || !newAssignment?.subject) return false;
      const targetClass = classrooms.find(c => c.id === newAssignment.classroomId);
      if (!targetClass || !targetClass.courses) return false;
      const searchSubject = String(newAssignment.subject).trim().toLowerCase();
      if (!searchSubject) return false;
      return targetClass.courses.some(
        c => c.subject && String(c.subject).trim().toLowerCase() === searchSubject
      );
    } catch {
      return false; 
    }
  }, [newAssignment.classroomId, newAssignment.subject, classrooms]);

  const targetWeeklyHours = 40; 
  const missingClassLoads = useMemo(() => {
    return classrooms.map(c => {
      const totalHours = c.courses?.reduce((sum, co) => sum + (parseInt(co.hoursPerWeek) || 0), 0) || 0;
      return {
        id: c.id,
        name: c.name,
        totalHours,
        missing: targetWeeklyHours - totalHours
      };
    }).filter(c => c.missing > 0).sort((a, b) => b.missing - a.missing);
  }, [classrooms]);

  const handleQuickAction = (classId, missingHours) => {
    setNewAssignment({ 
      classroomId: classId, 
      subject: '', 
      teacherId: '', 
      hoursPerWeek: missingHours || 2 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (classroomId, courseId) => {
    if (window.confirm('Bu ders atamasını silmek istediğinize emin misiniz?')) {
      const targetClass = classrooms.find(c => c.id === classroomId);
      if (targetClass && targetClass.courses) {
        const updatedCourses = targetClass.courses.filter(c => c.id !== courseId);
        updateClassroom(classroomId, { courses: updatedCourses });
      }
    }
  };

  const handleSaveAssignment = (e) => {
    e.preventDefault();
    if (isSubjectAlreadyAssigned) return; 

    const targetClass = classrooms.find(c => c.id === newAssignment.classroomId);
    if (targetClass) {
      const safeId = `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      const finalCode = (newAssignment.code?.trim() || generateCourseCode(newAssignment.subject, targetClass.name)).toUpperCase();
      
      const newCourse = {
        id: safeId,
        subject: String(newAssignment.subject).trim(),
        code: finalCode,
        teacherId: newAssignment.teacherId,
        hoursPerWeek: parseInt(newAssignment.hoursPerWeek) || 1
      };
      
      updateClassroom(targetClass.id, {
        courses: [...(targetClass.courses || []), newCourse]
      });
      
      setIsModalOpen(false);
      setNewAssignment({ classroomId: '', subject: '', code: '', teacherId: '', hoursPerWeek: 2 });
    }
  };

  // Seçili sınıf ve ders/öğretmen için haftalık çizelge verisi hesaplama
  const selectedClass = useMemo(() => {
    return classrooms.find(c => c.id === scheduleClassId) || classrooms[0] || null;
  }, [classrooms, scheduleClassId]);

  // Seçili sınıfa ait atanmış dersler
  const classSubjects = useMemo(() => {
    if (!selectedClass || !selectedClass.courses) return [];
    return Array.from(new Set(selectedClass.courses.map(c => c.subject).filter(Boolean)));
  }, [selectedClass]);

  // Seçili sınıfa giren öğretmenler
  const classTeachers = useMemo(() => {
    if (!selectedClass || !selectedClass.courses) return [];
    const tIds = Array.from(new Set(selectedClass.courses.map(c => c.teacherId).filter(Boolean)));
    return teachers.filter(t => tIds.includes(t.id));
  }, [selectedClass, teachers]);

  // Seçili derse veya öğretmene göre timetable dağılım analizi
  const scheduleStats = useMemo(() => {
    if (!selectedClass || !timetable || !timetable[selectedClass.id]) {
      return { totalHours: 0, byDay: {}, isGenerated: false };
    }

    const classSlots = timetable[selectedClass.id];
    let total = 0;
    const byDay = {};

    daysArray.forEach(d => {
      const slots = classSlots[d] || [];
      const matchedSlots = slots.filter(s => {
        if (scheduleMode === 'subject') {
          return selectedSubject ? s.subject.toLowerCase() === selectedSubject.toLowerCase() : true;
        } else {
          return selectedTeacherId ? s.teacherId === selectedTeacherId : true;
        }
      });

      if (matchedSlots.length > 0) {
        byDay[d] = matchedSlots.sort((a, b) => a.period - b.period);
        total += matchedSlots.length;
      }
    });

    return { totalHours: total, byDay, isGenerated: Object.keys(classSlots).length > 0 };
  }, [selectedClass, timetable, scheduleMode, selectedSubject, selectedTeacherId, daysArray]);

  return (
    <div className="p-6 space-y-6 transition-all duration-300">
      {/* 🧭 DEMO VERİ / MANUEL MOD PROMPT BANNER & MODAL */}
      <DemoDataPromptModal />
      
      {/* ÜST BAŞLIK VE SEKME DEĞİŞTİRİCİ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Network className="text-blue-600" size={22} /> Ders Atamaları & İlişki Matrisi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* SEKME DÜĞMELERİ */}
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'cards' ? 'text-amber-300' : 'text-indigo-600'} />
              <span>🎴 Akıllı Kart Masası</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers size={14} /> 📋 Atama Listesi
            </button>
            <button
              onClick={() => {
                setActiveTab('schedule');
                if (!scheduleClassId && classrooms[0]) setScheduleClassId(classrooms[0].id);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <CalendarDays size={14} /> 📅 Haftalık Çizelge
            </button>
          </div>

          {activeTab === 'list' && (
            <button 
              onClick={() => { setNewAssignment({ classroomId: '', subject: '', teacherId: '', hoursPerWeek: 2 }); setIsModalOpen(true); }} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus size={15} /> Yeni Atama Yap
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SEKME 0: AKILLI KART EŞLEŞTİRME MASASI (3 KOLONLU MODERN DÜZEN)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cards' && (
        <AssignmentCardDesk />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SEKME 1: ATAMA LİSTESİ (MATRİS BAĞLANTILARI)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {missingClassLoads.length > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <AlertTriangle size={16} />
                <h2>Eksik Ders Yükü Olan Sınıflar (Hedef: 40 Saat)</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingClassLoads.map(mc => (
                  <button 
                    key={mc.id}
                    onClick={() => handleQuickAction(mc.id, mc.missing)}
                    className="bg-white border border-amber-300 hover:bg-amber-100 hover:border-amber-400 text-amber-900 text-[11px] font-bold px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    <span>{mc.name}</span>
                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      {mc.missing} Saat Eksik
                    </span>
                    <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl shadow-sm flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <Info size={16} /> Tüm sınıfların 40 saatlik ders yükü atamaları eksiksiz tamamlanmıştır.
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ÖĞRETMEN DERS YÜKLERİ & KAPASİTE ÖZETİ PANOLARI
              ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    Öğretmen Ders Yükleri
                    <span className="text-[11px] font-semibold text-slate-500 lowercase">({teachers.length} öğretmen)</span>
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {overloadedTeachers.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[11px] shadow-2xs">
                    <AlertTriangle size={13} className="text-amber-600" />
                    {overloadedTeachers.length} Öğretmen Aşırı Yüklü (&gt;30 Sa)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsTeacherLoadExpanded(!isTeacherLoadExpanded)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {isTeacherLoadExpanded ? 'Paneli Daralt' : 'Tüm Öğretmenleri Göster'}
                </button>
              </div>
            </div>

            {isTeacherLoadExpanded && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Öğretmen yükü ara (ad veya branş)..."
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {teacherLoadStats
                    .filter(t => 
                      t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) || 
                      (t.branch || '').toLowerCase().includes(teacherSearchTerm.toLowerCase())
                    )
                    .map(t => {
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTeacherForSchedule(t.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                            t.isOverloaded 
                              ? 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-300 shadow-2xs hover:shadow-xs' 
                              : t.load === 0
                                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 opacity-60'
                                : 'bg-white hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs'
                          }`}
                          title="Haftalık ders programını incelemek için tıklayın"
                        >
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {t.branch || 'Genel'}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                              t.isOverloaded 
                                ? 'bg-amber-200/90 text-amber-950 font-black' 
                                : t.load === 0 
                                  ? 'bg-slate-200 text-slate-600 font-semibold' 
                                  : 'bg-indigo-50 text-indigo-700 font-extrabold'
                            }`}>
                              {t.load} sa
                            </span>

                            {t.isOverloaded ? (
                              <span className="text-[10px] font-extrabold text-amber-700 flex items-center gap-0.5" title="Haftalık 30 saatten fazla ders">
                                <AlertTriangle size={11} className="text-amber-600" /> &gt;30s
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 font-semibold transition-colors">
                                Gör ➔
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text" 
                placeholder="Ders veya öğretmen ara..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={filterClass} 
                onChange={(e) => setFilterClass(e.target.value)} 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="">🏫 Tüm Sınıflar</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} Şubesi</option>)}
              </select>
              <select 
                value={filterTeacher} 
                onChange={(e) => setFilterTeacher(e.target.value)} 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="">👤 Tüm Öğretmenler</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 font-bold text-gray-500">
                  <tr>
                    <th className="p-4 w-24">Şube</th>
                    <th className="p-4">Ders / Branş</th>
                    <th className="p-4">Atanan Öğretmen</th>
                    <th className="p-4 text-center w-28">Haftalık Saat</th>
                    <th className="p-4 text-center w-36">Haftalık Çizelge</th>
                    <th className="p-4 text-center w-16">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.length > 0 ? filteredAssignments.map((a, i) => {
                    const teacherLoad = getTeacherLoad(a.teacherId);
                    const isOverloaded = teacherLoad > 30;

                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-black text-gray-800">{a.className}</td>
                        <td className="p-4 font-bold text-blue-700">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold shrink-0">
                              {a.code || generateCourseCode(a.subject, a.className)}
                            </span>
                            <span>{a.subject}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {a.teacherId ? (
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherForSchedule(a.teacherId)}
                              className="group flex flex-col items-start text-left cursor-pointer transition-colors"
                              title={`${a.teacherName} haftalık ders programını incele`}
                            >
                              <span className="font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1.5 text-xs transition-colors">
                                <User size={13} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                {a.teacherName}
                              </span>
                              {isOverloaded ? (
                                <span 
                                  className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[10px]"
                                  title="MEB haftalık ders yükü 30 saati aşmıştır. Dağıtım motoru esnek limitlerle yerleştirecektir."
                                >
                                  <AlertTriangle size={10} className="text-amber-600" />
                                  Aşırı Yüklü ({teacherLoad} sa)
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 transition-colors">
                                  Yük: {teacherLoad} sa • Programı Gör ➔
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 italic font-medium">Atanmamış</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-black text-gray-700 bg-gray-50/30">{a.hoursPerWeek} sa</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setPreviewModalData({
                              classroomId: a.classroomId,
                              className: a.className,
                              subject: a.subject,
                              teacherId: a.teacherId,
                              teacherName: a.teacherName,
                              hoursPerWeek: a.hoursPerWeek
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-blue-200"
                            title="Haftalık ders saatleri ve gün dağılımını göster"
                          >
                            <CalendarDays size={13} />
                            <span>Çizelgeyi Gör</span>
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(a.classroomId, a.id)} 
                            className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Atamayı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400 italic">Eşleşen atama bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SEKME 2: HAFTALIK İLİŞKİ ÇİZELGESİ (SINIF & DERS & ÖĞRETMEN)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* FİLTRE VE SEÇİM KONTROL PANELİ */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Haftalık Ders & Öğretmen Dağılım Matrisi
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  İncelemek istediğiniz sınıfı seçin; ders veya öğretmen bazında haftanın hangi gün ve saatlerine yerleştiğini görün.
                </p>
              </div>

              {/* MOD SEÇİMİ: DERS BAZLI VS ÖĞRETMEN BAZLI */}
              <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setScheduleMode('subject'); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    scheduleMode === 'subject' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <GraduationCap size={14} /> Ders Bazlı Çizelge
                </button>
                <button
                  type="button"
                  onClick={() => { setScheduleMode('teacher'); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    scheduleMode === 'teacher' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <User size={14} /> Öğretmen Bazlı Çizelge
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
              {/* 1. SINIF SEÇİCİ */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  🏫 1. Sınıf Seçin
                </label>
                <select
                  value={scheduleClassId}
                  onChange={(e) => {
                    setScheduleClassId(e.target.value);
                    setSelectedSubject('');
                    setSelectedTeacherId('');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} Şubesi</option>
                  ))}
                </select>
              </div>

              {/* 2. DERS VEYA ÖĞRETMEN SEÇİCİ */}
              {scheduleMode === 'subject' ? (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    📚 2. İncelenecek Dersi Seçin
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSelectedSubject('')}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedSubject === '' 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🌟 Tüm Dersler
                    </button>
                    {classSubjects.map((sub, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setSelectedSubject(sub)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedSubject.toLowerCase() === sub.toLowerCase()
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    👤 2. İncelenecek Öğretmeni Seçin
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherId('')}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedTeacherId === '' 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🌟 Tüm Öğretmenler
                    </button>
                    {classTeachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeacherId(t.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedTeacherId === t.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* İSTATİSTİK VE DAĞILIM ÖZETİ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Seçili Dağılım Yükü</div>
                <div className="text-base font-black text-gray-800">
                  {scheduleStats.totalHours} Saat Yerleşmiş
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Calendar size={20} />
              </div>
              <div className="truncate">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Ders Olan Günler</div>
                <div className="text-xs font-bold text-gray-800 truncate">
                  {Object.keys(scheduleStats.byDay).length > 0
                    ? Object.keys(scheduleStats.byDay).join(', ')
                    : 'Henüz yerleşmedi'}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Odak Durumu</div>
                <div className="text-xs font-bold text-gray-800 truncate">
                  {scheduleMode === 'subject'
                    ? (selectedSubject ? `Ders: ${selectedSubject}` : 'Tüm Dersler Vurgulu')
                    : (selectedTeacherId ? `Öğretmen: ${teachers.find(t => t.id === selectedTeacherId)?.name}` : 'Tüm Öğretmenler Vurgulu')}
                </div>
              </div>
            </div>
          </div>

          {/* HAFTALIK MATRİS TABLOSU (5 GÜN x 8 SAAT) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-600" />
                <span>{selectedClass?.name} Şubesi Haftalık Çizelgesi</span>
              </h3>
              <span className="text-[11px] font-semibold text-gray-500">
                Seçili ders ve öğretmenler parlak kart olarak vurgulanmıştır
              </span>
            </div>

            {!timetable || Object.keys(timetable).length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <div className="font-bold text-gray-800 text-sm">Ders Programı Henüz Oluşturulmadı</div>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Haftalık çizelgeyi görüntülemek için lütfen sol menüdeki "Oluştur" sayfasından algoritmayı tetikleyiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto p-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200">
                      <th className="p-3 w-28 border-r border-gray-200">Gün</th>
                      {periodsArray.map(p => (
                        <th key={p} className="p-3 text-center min-w-[110px] border-r last:border-r-0">
                          {p}. Ders
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {daysArray.map(day => {
                      const daySlots = timetable[selectedClass?.id]?.[day] || [];

                      return (
                        <tr key={day} className="hover:bg-gray-50/40">
                          <td className="p-3 font-bold text-gray-700 bg-gray-50/30 capitalize border-r border-gray-200">
                            {day}
                          </td>
                          {periodsArray.map(p => {
                            const slot = daySlots.find(s => Number(s.period) === Number(p));
                            
                            if (!slot) {
                              return (
                                <td key={p} className="p-2 text-center h-16 border-r last:border-r-0">
                                  <div className="w-full h-full border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[10px] text-gray-300 select-none">
                                    Boş
                                  </div>
                                </td>
                              );
                            }

                            // Eşleşme kontrolü: Odaklanılan ders veya öğretmen mi?
                            const isMatch = scheduleMode === 'subject'
                              ? (!selectedSubject || slot.subject.toLowerCase() === selectedSubject.toLowerCase())
                              : (!selectedTeacherId || slot.teacherId === selectedTeacherId);

                            const teacherName = teachers.find(t => t.id === slot.teacherId)?.name || 'Öğretmen';

                            return (
                              <td key={p} className="p-2 text-center h-16 border-r last:border-r-0">
                                {isMatch ? (
                                  <div 
                                    className={`p-2 rounded-xl h-full flex flex-col justify-center shadow-xs ring-2 ring-blue-400/50 transition-all ${getSubjectStyle(slot.subject, selectedClass?.name)}`}
                                  >
                                    <div className="font-black text-[11px] truncate">{slot.subject}</div>
                                    <div className="text-[9px] font-semibold opacity-90 truncate">{teacherName.split(' ')[0]}</div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-xl h-full flex flex-col justify-center bg-gray-100/70 border border-gray-200 text-gray-400 opacity-50">
                                    <div className="font-semibold text-[10px] truncate">{slot.subject}</div>
                                    <div className="text-[8px] truncate">{teacherName.split(' ')[0]}</div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HIZLI İNCELEME MODALI (Atama Satırındaki "Çizelgeyi Gör" Butonu İçin)
          ══════════════════════════════════════════════════════════════════ */}
      {previewModalData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Haftalık Dağılım Çizelgesi: {previewModalData.className} - {previewModalData.subject}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewModalData(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/60 border border-blue-100 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500">Şube: </span>
                  <span className="font-bold text-gray-800">{previewModalData.className}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-gray-500">Ders: </span>
                  <span className="font-bold text-blue-700">{previewModalData.subject}</span>
                </div>
                <div>
                  <span className="text-gray-500">Öğretmen: </span>
                  <span className="font-bold text-gray-800">{previewModalData.teacherName}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-gray-500">Haftalık: </span>
                  <span className="font-black text-gray-900">{previewModalData.hoursPerWeek} Saat</span>
                </div>
              </div>

              {!timetable || !timetable[previewModalData.classroomId] ? (
                <div className="p-8 text-center text-gray-400 italic">
                  Ders programı henüz oluşturulmadığı için haftalık yerleşim bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200">
                        <th className="p-2.5 w-24 border-r border-gray-200">Gün</th>
                        {periodsArray.map(p => (
                          <th key={p} className="p-2.5 text-center min-w-[70px] border-r last:border-r-0">
                            {p}. Ders
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {daysArray.map(day => {
                        const daySlots = timetable[previewModalData.classroomId]?.[day] || [];
                        return (
                          <tr key={day} className="hover:bg-gray-50/40">
                            <td className="p-2.5 font-bold text-gray-700 bg-gray-50/30 capitalize border-r border-gray-200">
                              {day}
                            </td>
                            {periodsArray.map(p => {
                              const slot = daySlots.find(s => Number(s.period) === Number(p));
                              const isTargetSubject = slot && slot.subject.toLowerCase() === previewModalData.subject.toLowerCase();

                              return (
                                <td key={p} className="p-1.5 text-center h-12 border-r last:border-r-0">
                                  {isTargetSubject ? (
                                    <div className={`p-1 rounded-lg h-full flex flex-col justify-center shadow-xs font-black text-[10px] ${getSubjectStyle(slot.subject, previewModalData.className)}`}>
                                      {slot.subject}
                                    </div>
                                  ) : slot ? (
                                    <div className="p-1 rounded-lg h-full flex flex-col justify-center bg-gray-100 text-gray-400 opacity-40 text-[9px] truncate">
                                      {slot.subject}
                                    </div>
                                  ) : (
                                    <div className="w-full h-full border border-dashed border-gray-100 rounded-lg flex items-center justify-center text-[9px] text-gray-300">
                                      -
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const cId = previewModalData.classroomId;
                    const sub = previewModalData.subject;
                    setPreviewModalData(null);
                    setScheduleClassId(cId);
                    setSelectedSubject(sub);
                    setScheduleMode('subject');
                    setActiveTab('schedule');
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Tam Çizelge Sekmesine Git <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalData(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 text-xs rounded-xl cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          YENİ ATAMA MODALI (Yeni Matris Bağı Ekleme)
          ══════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Network size={14} className="text-blue-600"/> Yeni Matris Bağı (Atama)
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 relative col-span-2">
                  <label className="font-bold text-gray-600">Ders Adı</label>
                  <input 
                    type="text" 
                    required 
                    list="matris_subjects" 
                    placeholder="Önce ders ismini yazın (Örn: Matematik)" 
                    value={newAssignment.subject} 
                    onChange={(e) => {
                      const sub = e.target.value;
                      const cName = classrooms.find(c => c.id === newAssignment.classroomId)?.name || '';
                      setNewAssignment({
                        ...newAssignment, 
                        subject: sub, 
                        code: generateCourseCode(sub, cName),
                        teacherId: ''
                      });
                    }} 
                    className={`w-full bg-gray-50 border rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${isSubjectAlreadyAssigned ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} 
                  />
                  <datalist id="matris_subjects">
                    {uniqueSubjects.map((sub, sIdx) => <option key={sIdx} value={sub} />)}
                  </datalist>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-gray-600 flex items-center gap-1"><Hash size={12}/> Ders Kodu</label>
                  <input 
                    type="text" 
                    placeholder="Örn: MAT9" 
                    value={newAssignment.code || ''} 
                    onChange={(e) => setNewAssignment({...newAssignment, code: e.target.value.toUpperCase()})} 
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Şube / Sınıf Seçimi</label>
                <select 
                  required 
                  value={newAssignment.classroomId} 
                  onChange={(e) => {
                    const cId = e.target.value;
                    const cName = classrooms.find(c => c.id === cId)?.name || '';
                    setNewAssignment({
                      ...newAssignment, 
                      classroomId: cId,
                      code: newAssignment.subject ? generateCourseCode(newAssignment.subject, cName) : newAssignment.code
                    });
                  }} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 cursor-pointer"
                >
                  <option value="">Sınıf Seçin...</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {isSubjectAlreadyAssigned && (
                <div className="p-3 rounded-xl border bg-red-50 border-red-200 text-red-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div className="text-[11px] font-medium">
                    Seçili sınıfa <strong>{newAssignment.subject}</strong> dersi daha önce atanmış!
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Öğretmen Ataması</label>
                <select 
                  required 
                  value={newAssignment.teacherId} 
                  onChange={(e) => setNewAssignment({...newAssignment, teacherId: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 cursor-pointer"
                >
                  <option value="">Öğretmen Seçin...</option>
                  {!newAssignment.subject.trim() ? (
                    <option disabled>☝️ Öğretmenleri görmek için önce ders adını yazın</option>
                  ) : eligibleTeachers.length === 0 ? (
                    <option disabled>❌ Bu dersi verebilecek kayıtlı öğretmen yok!</option>
                  ) : (
                    eligibleTeachers.map(t => {
                      const load = getTeacherLoad(t.id);
                      const closedCount = Object.values(t.unavailable || {}).reduce((acc, curr) => acc + curr.length, 0);
                      const totalSchoolSlots = (settings?.days?.length || 5) * (settings?.periodsPerDay || 8);
                      const maxCapacity = Math.max(0, totalSchoolSlots - closedCount);
                      const required = parseInt(newAssignment.hoursPerWeek) || 1;
                      const nextLoad = load + required;
                      const isDisabled = nextLoad > maxCapacity;
                      const isOverloaded = nextLoad > 30;

                      let statusBadge = '';
                      if (isDisabled) {
                        statusBadge = ' - [KAPASİTE YETERSİZ]';
                      } else if (isOverloaded) {
                        statusBadge = ` - [⚠️ 30+ SAAT AŞIRI YÜK (${nextLoad} sa)]`;
                      }

                      return (
                        <option key={t.id} value={t.id} disabled={isDisabled} className={isOverloaded ? 'font-bold text-amber-700' : ''}>
                          {t.name} - Yük: {load} Saat {statusBadge}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {newAssignment.teacherId && (getTeacherLoad(newAssignment.teacherId) + (parseInt(newAssignment.hoursPerWeek) || 0) > 30) && (
                <div className="p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Aşırı Yük Bildirimi:</strong> Bu atama ile öğretmen haftalık <strong>{getTeacherLoad(newAssignment.teacherId) + (parseInt(newAssignment.hoursPerWeek) || 0)} saat</strong> yüke ulaşacaktır (&gt;30 saat). Dağıtım motoru esnek günlük limitlerle yerleşimi sorunsuz gerçekleştirecektir.
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Haftalık Ders Saati</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max="15" 
                  value={newAssignment.hoursPerWeek} 
                  onChange={(e) => setNewAssignment({...newAssignment, hoursPerWeek: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubjectAlreadyAssigned || !newAssignment.teacherId} 
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Bağlantıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ÖĞRETMEN HAFTALIK DERS PROGRAMI MODALI (Tıklanan Öğretmen İçin)
          ══════════════════════════════════════════════════════════════════ */}
      {teacherForModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Üst Başlık */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                  teacherForModal.isOverloaded 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  <User size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{teacherForModal.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                      {teacherForModal.branch || 'Branş Belirtilmemiş'}
                    </span>
                    {teacherForModal.isOverloaded && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs shadow-xs animate-pulse">
                        <AlertTriangle size={13} className="text-amber-600" /> Aşırı Yüklü: {teacherForModal.load} Saat
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haftalık Atanan Toplam Ders Yükü: <strong className="text-slate-800">{teacherForModal.load} Saat</strong> {teacherForModal.load <= 30 ? '(MEB Norm Sınırı İçinde)' : '(MEB Normu: 30 Saat)'}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedTeacherForSchedule(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Aşırı Yük Açıklama Bildirimi */}
              {teacherForModal.isOverloaded && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-extrabold text-amber-950">Aşırı Ders Yükü Bildirimi ({teacherForModal.load} Saat &gt; 30 Saat)</div>
                    <div className="text-[11px] text-amber-800/90 leading-relaxed">
                      MEB standart haftalık tam zamanlı ders yükü 30 saattir. Bu öğretmenimize 30 saatin üzerinde ({teacherForModal.load} saat) ders tanımlanmıştır. 
                      Sistem optimizasyon motoru (solver), öğretmenin günlük ders tavan sınırlarını ihtiyaç duyulan seviyeye otomatik esneterek dağıtım sürecinde kilitlenme veya hata oluşturmadan programı üretecektir.
                    </div>
                  </div>
                </div>
              )}

              {/* Atanan Dersler ve Şubeler Özeti */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>Atanan Şubeler ve Dersler ({teacherForModal.courses.length} Atama - {teacherForModal.load} Saat)</span>
                </div>
                {teacherForModal.courses.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                    Bu öğretmene henüz atanmış bir ders bulunmamaktadır.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teacherForModal.courses.map((c, cIdx) => (
                      <div 
                        key={cIdx} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors text-xs"
                      >
                        <span className="font-extrabold text-slate-800">{c.className}</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-indigo-700">{c.subject}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-black text-[11px] text-slate-700">
                          {c.hoursPerWeek} sa
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Haftalık Ders Programı Matrisi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-indigo-600" />
                    <span>Haftalık Ders Dağılım Çizelgesi</span>
                  </div>
                  {timetable && Object.keys(timetable).length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {Object.values(teacherModalSchedule).reduce((total, dayObj) => total + Object.keys(dayObj).length, 0)} saat yerleşmiş
                    </span>
                  )}
                </div>

                {!timetable || Object.keys(timetable).length === 0 ? (
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                    <Calendar size={28} className="mx-auto text-slate-400" />
                    <div className="text-xs font-bold text-slate-700">Ders Programı Henüz Oluşturulmamış</div>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Öğretmenin saat bazlı haftalık programını görebilmek için lütfen sol menüden "Oluştur" sayfasına giderek ders dağıtım algoritmasını çalıştırınız.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 font-bold text-slate-600">
                            <th className="p-3 w-28 border-r border-slate-200">Gün</th>
                            {periodsArray.map(p => (
                              <th key={p} className="p-3 text-center min-w-[95px] border-r border-slate-200 last:border-r-0">
                                {p}. Ders
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {daysArray.map(day => {
                            const daySchedule = teacherModalSchedule[day] || {};
                            const unavailablePeriods = teacherForModal.unavailable?.[day] || [];

                            return (
                              <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-extrabold text-slate-700 bg-slate-50/40 border-r border-slate-200 capitalize">
                                  {day}
                                </td>
                                {periodsArray.map(p => {
                                  const slot = daySchedule[p];
                                  const isUnavailable = unavailablePeriods.includes(p);

                                  return (
                                    <td key={p} className="p-1.5 text-center h-16 border-r border-slate-200 last:border-r-0">
                                      {slot ? (
                                        <div className={`p-1.5 rounded-xl h-full flex flex-col justify-center shadow-xs transition-all ${getCourseColorClass(slot.subject, slot.className)}`}>
                                          <div className="font-black text-[11px] truncate">{slot.className}</div>
                                          <div className="text-[10px] font-bold opacity-90 truncate">{slot.subject}</div>
                                        </div>
                                      ) : isUnavailable ? (
                                        <div className="w-full h-full rounded-xl bg-slate-100/90 border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-400 font-semibold gap-0.5">
                                          <Lock size={11} className="text-slate-400" />
                                          <span>Kapalı</span>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-300">
                                          -
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Alt Kısım */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const tId = teacherForModal.id;
                  setSelectedTeacherForSchedule(null);
                  setSelectedTeacherId(tId);
                  setScheduleMode('teacher');
                  setActiveTab('schedule');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <span>Haftalık İlişki Çizelgesinde Ayrıntılı İncele</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeacherForSchedule(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
