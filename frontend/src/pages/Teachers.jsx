// frontend/src/pages/Teachers.jsx
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom'; 
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Calendar, 
  X, 
  BookOpen, 
  Hash, 
  Check, 
  Sparkles, 
  Search, 
  Layers, 
  ShieldAlert, 
  Star, 
  Pin, 
  Landmark,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  CalendarDays,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import AvailabilityGrid from '../components/AvailabilityGrid'; 
import { getCourseColorClass } from '../utils/courseColors';
import DemoDataPromptModal from '../components/common/DemoDataPromptModal';
import { generateCourseCode } from '../utils/courseCodeHelper';

export default function Teachers() {
  const { 
    teachers, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher, 
    settings, 
    classrooms, 
    timetable, 
    pinnedSlots, 
    toggleTeacherSchedulePin,
    resetTimetable,
    clearAllTeacherConstraints
  } = useAppStore();
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState(null);
  const [selectedTeacherForTimetable, setSelectedTeacherForTimetable] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetFeedbackMsg, setResetFeedbackMsg] = useState('');

  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]); 
  const [isExempt, setIsExempt] = useState(false);
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [priorityFullDay, setPriorityFullDay] = useState('');
  const [fillLateHours, setFillLateHours] = useState(false);
  
  // Filtre durumları
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overloaded', 'exempt', 'admin', 'pinned', 'constrained'
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  
  // 💡 Zümre toplu güncelleme onay kutusu state'i
  const [propagateToPeers, setPropagateToPeers] = useState(false);

  const numPeriods = settings?.periodsPerDay || 8;
  const periodsArray = Array.from({ length: numPeriods }, (_, i) => i + 1);
  const daysArray = settings?.days || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

  const globalSubjects = useMemo(() => {
    const subSet = new Set();
    classrooms.forEach(c => {
      c.courses?.forEach(co => {
        if (co.subject) subSet.add(co.subject.trim());
      });
    });
    if (subSet.size === 0) {
      return ["Matematik", "Geometri", "Seçmeli Matematik", "Türk Dili ve Edebiyatı", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "İngilizce", "Arapça", "Kur'an-ı Kerim"];
    }
    return Array.from(subSet).sort();
  }, [classrooms]);

  const uniqueBranches = useMemo(() => {
    const bSet = new Set();
    teachers.forEach(t => { if (t.branch) bSet.add(t.branch.trim()); });
    return Array.from(bSet).sort();
  }, [teachers]);

  // Öğretmen ders yükü hesaplama
  const getTeacherLoad = (tId) => {
    return classrooms.reduce((sum, c) => sum + (c.courses?.filter(co => co.teacherId === tId).reduce((s, co) => s + (parseInt(co.hoursPerWeek)||0), 0) || 0), 0);
  };

  // KPI ve İstatistik Metrikleri
  const stats = useMemo(() => {
    let totalAssignedHours = 0;
    let overloadedCount = 0;
    let exemptCount = 0;
    let constrainedCount = 0;
    let adminCount = 0;

    teachers.forEach(t => {
      const load = getTeacherLoad(t.id);
      totalAssignedHours += load;
      if (load > 30) overloadedCount++;
      const fullOffDays = daysArray.filter(d => (t.unavailable?.[d] || []).length === numPeriods).length;
      const isPartTimeOrExempt = t.isExempt || (fullOffDays >= 3 && load < 17 && load > 0);
      if (isPartTimeOrExempt) exemptCount++;
      if (t.isAdministrator) adminCount++;
      
      const closedSlots = Object.values(t.unavailable || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0);
      if (closedSlots > 0) constrainedCount++;
    });

    return {
      totalAssignedHours,
      overloadedCount,
      exemptCount,
      constrainedCount,
      adminCount,
      averageLoad: teachers.length > 0 ? Math.round(totalAssignedHours / teachers.length) : 0
    };
  }, [teachers, classrooms, daysArray, numPeriods]);

  // Sistemde kayıtlı yerleşmiş ders sayısı
  const totalTimetableSlots = useMemo(() => {
    if (!timetable) return 0;
    let count = 0;
    Object.values(timetable).forEach(daysObj => {
      if (!daysObj) return;
      Object.values(daysObj).forEach(slots => {
        if (Array.isArray(slots)) count += slots.length;
      });
    });
    return count;
  }, [timetable]);

  // Aynı branştaki diğer öğretmenleri tespit etme
  const sameBranchPeers = useMemo(() => {
    if (!branch.trim()) return [];
    return teachers.filter(t => 
      t.branch && 
      t.branch.trim().toLowerCase() === branch.trim().toLowerCase() && 
      t.id !== editingTeacher?.id
    );
  }, [branch, teachers, editingTeacher]);

  const openModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setName(teacher.name);
      setBranch(teacher.branch || '');
      setSelectedSubjects(teacher.subjects || (teacher.branch ? [teacher.branch] : []));
      setIsExempt(teacher.isExempt || false);
      setIsAdministrator(teacher.isAdministrator || false);
      setPriorityFullDay(teacher.priorityFullDay || '');
      setFillLateHours(teacher.fillLateHours || false);
    } else {
      setEditingTeacher(null);
      setName('');
      setBranch('');
      setSelectedSubjects([]);
      setIsExempt(false);
      setIsAdministrator(false);
      setPriorityFullDay('');
      setFillLateHours(false);
    }
    setSubjectSearchQuery('');
    setPropagateToPeers(false);
    setIsModalOpen(true);
  };

  const handleSubjectToggle = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teacherPayload = { 
      name, 
      branch, 
      subjects: selectedSubjects, 
      isExempt,
      isAdministrator,
      priorityFullDay: priorityFullDay || null,
      fillLateHours: Boolean(fillLateHours)
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherPayload);
      
      if (propagateToPeers && sameBranchPeers.length > 0) {
        sameBranchPeers.forEach(st => {
          updateTeacher(st.id, { subjects: selectedSubjects });
        });
      }
    } else {
      addTeacher({ ...teacherPayload, unavailable: {} });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, tName) => {
    if (window.confirm(`Sayın ${tName} öğretmenini sistemden silmek istediğinize emin misiniz?`)) {
      deleteTeacher(id);
    }
  };

  // 📅 Tek tıkla bir günü boş gün (tam gün kapalı) yap veya aç
  const toggleDayOff = (teacher, day) => {
    const currentUnavailable = teacher.unavailable || {};
    const currentDaySlots = currentUnavailable[day] || [];
    const allPeriods = Array.from({ length: numPeriods }, (_, i) => i + 1);
    const newUnavailable = { ...currentUnavailable };

    if (currentDaySlots.length === numPeriods) {
      delete newUnavailable[day];
      setResetFeedbackMsg(`${teacher.name} öğretmeninin ${day} günü açıldı.`);
    } else {
      newUnavailable[day] = allPeriods;
      setResetFeedbackMsg(`${teacher.name} öğretmenine ${day} günü BOŞ GÜN olarak ayarlandı.`);
    }
    updateTeacher(teacher.id, { unavailable: newUnavailable });
    setTimeout(() => setResetFeedbackMsg(''), 3500);
  };

  // Filtrelenmiş Öğretmen Listesi
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      // 1. Arama Metni Filtresi
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.branch && t.branch.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      // 2. Branş Filtresi
      if (selectedBranchFilter && t.branch !== selectedBranchFilter) return false;

      // 3. Durum / Rozet Filtresi
      const load = getTeacherLoad(t.id);
      const closedSlots = Object.values(t.unavailable || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0);

      // Kilit kontrolü
      let tAssignedSlots = 0;
      let tPinnedSlots = 0;
      Object.keys(timetable || {}).forEach((cId) => {
        const daysMap = timetable[cId] || {};
        Object.keys(daysMap).forEach((d) => {
          (daysMap[d] || []).forEach((s) => {
            if (s.teacherId === t.id) {
              tAssignedSlots++;
              const isPin = (pinnedSlots || []).some(
                (p) => p.classId === cId && p.day === d && Number(p.period) === Number(s.period)
              );
              if (isPin) tPinnedSlots++;
            }
          });
        });
      });
      const isPinned = tPinnedSlots > 0;

      if (activeFilter === 'overloaded') return load > 30;
      if (activeFilter === 'admin') return t.isAdministrator;
      if (activeFilter === 'exempt') {
        const fullOffDays = daysArray.filter(d => (t.unavailable?.[d] || []).length === numPeriods).length;
        return t.isExempt || (fullOffDays >= 3 && load < 17 && load > 0);
      }
      if (activeFilter === 'pinned') return isPinned;
      if (activeFilter === 'constrained') return closedSlots > 0;

      return true;
    });
  }, [teachers, searchTerm, selectedBranchFilter, activeFilter, classrooms, timetable, pinnedSlots, daysArray, numPeriods]);

  // Seçili öğretmenin haftalık ders programı gridi
  const teacherTimetableGrid = useMemo(() => {
    if (!selectedTeacherForTimetable || !timetable) return {};
    const grid = {};
    daysArray.forEach(d => { grid[d] = {}; });

    Object.entries(timetable).forEach(([clsId, daysObj]) => {
      if (!daysObj) return;
      Object.entries(daysObj).forEach(([day, slots]) => {
        if (!Array.isArray(slots)) return;
        slots.forEach(slot => {
          if (slot.teacherId === selectedTeacherForTimetable.id) {
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
  }, [selectedTeacherForTimetable, timetable, daysArray, classrooms]);

  const filteredGlobalSubjects = globalSubjects.filter(s => s.toLowerCase().includes(subjectSearchQuery.toLowerCase()));

  return (
    <div className="p-6 space-y-6 transition-all duration-300">
      {/* 🧭 DEMO VERİ / MANUEL MOD PROMPT BANNER & MODAL */}
      <DemoDataPromptModal />
      
      {/* ÜST BAŞLIK VE AKSİYON DÜĞMELERİ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 w-full">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 pt-1">
            <Users className="text-indigo-600" size={22} /> Öğretmenler
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Program Sıfırla Butonu */}
          <button 
            type="button"
            onClick={() => setIsResetConfirmOpen(true)} 
            className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              totalTimetableSlots > 0 
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
          >
            <RotateCcw size={14} className={totalTimetableSlots > 0 ? "text-rose-600" : "text-slate-500"} />
            <span>Programı Sıfırla {totalTimetableSlots > 0 ? `(${totalTimetableSlots} sa)` : ''}</span>
          </button>

          {/* Tüm Kapalı Saat Kısıtlarını Temizle Butonu */}
          {stats.constrainedCount > 0 && (
            <button 
              type="button"
              onClick={() => {
                if (window.confirm("Tüm öğretmenlerin takvimindeki kapalı saatler uygun yapılacaktır. Onaylıyor musunuz?")) {
                  clearAllTeacherConstraints();
                  setResetFeedbackMsg("Tüm öğretmen kapalı saatleri açıldı.");
                  setTimeout(() => setResetFeedbackMsg(''), 3000);
                }
              }} 
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className="text-amber-600" />
              <span>Tüm Kısıtları Aç</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => openModal()} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <UserPlus size={15} /> Yeni Öğretmen Ekle
          </button>
        </div>
      </div>

      {/* GERİ BİLDİRİM TOAST */}
      {resetFeedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{resetFeedbackMsg}</span>
          </div>
          <button type="button" onClick={() => setResetFeedbackMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs">
            ✕
          </button>
        </div>
      )}

      {/* DERS PROGRAMI DURUMU */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
        totalTimetableSlots > 0 
          ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
            totalTimetableSlots > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {totalTimetableSlots > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          </div>
          <div className="font-bold text-xs">
            {totalTimetableSlots > 0 
              ? `Ders Programı Aktif (${totalTimetableSlots} Saat Yerleşik)`
              : 'Ders Programı Boş'}
          </div>
        </div>

        {totalTimetableSlots > 0 && (
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="shrink-0 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs text-[11px] flex items-center gap-1.5"
          >
            <RotateCcw size={12} className="text-rose-600" />
            <span>Programı Şimdi Sıfırla</span>
          </button>
        )}
      </div>

      {/* KPI İSTATİSTİK ŞERİDİ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Kayıtlı Kadro</div>
            <div className="text-base font-black text-slate-800">{teachers.length} Öğretmen</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Ders Yükü</div>
            <div className="text-base font-black text-slate-800">{stats.totalAssignedHours} Saat</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">İstisna Öğretmen</div>
            <div className="text-base font-black text-slate-800">{stats.exemptCount} Kişi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Kapalı Saati Olan</div>
            <div className="text-base font-black text-slate-800">{stats.constrainedCount} Öğretmen</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            stats.overloadedCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">30+ Saat Yükü Olan</div>
            <div className={`text-base font-black ${stats.overloadedCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
              {stats.overloadedCount} Öğretmen
            </div>
          </div>
        </div>
      </div>

      {/* ARAMA VE GELİŞMİŞ FİLTRE ÇUBUĞU */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="Öğretmen adı veya branş ile ara..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" 
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">🎯 Tüm Branşlar ({uniqueBranches.length})</option>
              {uniqueBranches.map((br, bIdx) => (
                <option key={bIdx} value={br}>{br}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FİLTRE HAPLARI (TABS) */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tüm Kadro ({teachers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('overloaded')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'overloaded' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle size={12} /> 30+ Saat Aşırı Yüklü ({stats.overloadedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('exempt')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'exempt' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldAlert size={12} /> İstisna Öğretmenler ({stats.exemptCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('admin')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'admin' ? 'bg-indigo-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Landmark size={12} /> İdareciler ({stats.adminCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('constrained')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'constrained' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar size={12} /> Kapalı Saati Olanlar ({stats.constrainedCount})
          </button>
        </div>
      </div>

      {/* ÖĞRETMEN LİSTESİ / KARTLARI */}
      {teachers.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700">Öğretmen Kadrosu Boş</h3>
          <p className="text-xs text-slate-400 mt-1">Sisteme öğretmen ekleyerek ders dağıtımına başlayabilirsiniz.</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-xs text-slate-400 text-xs italic">
          Seçili filtreleme kriterine uyan öğretmen bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(t => {
            let closedSlotsCount = 0;
            Object.keys(t.unavailable || {}).forEach(day => { closedSlotsCount += (t.unavailable[day] || []).length; });

            let totalAssignedHours = getTeacherLoad(t.id);
            const isOverloaded = totalAssignedHours > 30;

            const assignedCourseEntries = [];
            classrooms.forEach(c => {
              const coursesForTeacher = c.courses?.filter(course => course.teacherId === t.id && course.hoursPerWeek > 0) || [];
              coursesForTeacher.forEach(co => {
                const code = co.code || generateCourseCode(co.subject, c.name);
                assignedCourseEntries.push(`${code} (${c.name})`);
              });
            });
            const uniqueClasses = assignedCourseEntries.slice(0, 4).join(', ') + (assignedCourseEntries.length > 4 ? ` +${assignedCourseEntries.length - 4}` : '');

            // Kilit kontrolü
            let tAssignedSlots = 0;
            let tPinnedSlots = 0;
            Object.keys(timetable || {}).forEach((cId) => {
              const daysMap = timetable[cId] || {};
              Object.keys(daysMap).forEach((d) => {
                (daysMap[d] || []).forEach((s) => {
                  if (s.teacherId === t.id) {
                    tAssignedSlots++;
                    const isPin = (pinnedSlots || []).some(
                      (p) => p.classId === cId && p.day === d && Number(p.period) === Number(s.period)
                    );
                    if (isPin) tPinnedSlots++;
                  }
                });
              });
            });
            const isFullyPinned = tAssignedSlots > 0 && tPinnedSlots === tAssignedSlots;

            return (
              <div 
                key={t.id} 
                className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 ${
                  isOverloaded 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : t.priorityFullDay
                      ? 'border-indigo-200'
                      : t.isExempt
                        ? 'border-amber-200'
                        : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{t.name}</h3>
                        {t.isAdministrator && (
                          <span className="bg-purple-100 text-purple-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1" title="Okul İdarecisi">
                            <Landmark size={10} className="text-purple-700" /> İdareci
                          </span>
                        )}
                        {isFullyPinned && (
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1" title="Öğretmenin tüm ders programı kilitli">
                            <Pin size={10} className="fill-amber-600 text-amber-700" /> Kilitli
                          </span>
                        )}
                        {(t.isExempt || (daysArray.filter(d => (t.unavailable?.[d] || []).length === numPeriods).length >= 3 && totalAssignedHours < 17 && totalAssignedHours > 0)) && !t.isAdministrator && (
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1" title="İstisna öğretmen: 1-2 gün gelen / <17 saat dersi olan; sert kısıt kurallarından muaftır">
                            <ShieldAlert size={10} className="text-amber-700" /> İstisna
                          </span>
                        )}
                        {t.priorityFullDay && (
                          <span className="bg-indigo-100 text-indigo-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1" title={`${t.priorityFullDay} günü tam doldurulacak${t.fillLateHours ? ', son saatler kesin dolu olsun' : ''}`}>
                            <CalendarDays size={10} className="text-indigo-700" /> 📌 {t.priorityFullDay.slice(0, 3)} {t.fillLateHours ? 'Tam + Son Sa.' : 'Tam Dolu'}
                          </span>
                        )}
                      </div>
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">
                        {t.branch || 'Branş Belirtilmemiş'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => openModal(t)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Öğretmeni Düzenle"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(t.id, t.name)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Öğretmeni Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Detay Bilgileri */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2 mt-2">
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                      <Hash size={12} className="mt-0.5 shrink-0 text-slate-400" /> 
                      <span>Yetkili Dersler: <strong className="text-slate-800">{t.subjects?.join(', ') || t.branch || '-'}</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                      <BookOpen size={12} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>Dersler & Şubeler: <strong className="text-slate-800">{uniqueClasses || 'Henüz atanmadı'}</strong></span>
                    </div>
                    
                    {/* Ders Yükü Şeridi */}
                    <div className="flex items-center justify-between px-1 border-t border-slate-200/80 pt-1.5 mt-1 text-[11px]">
                      <span className="font-bold text-slate-500">Haftalık Ders Yükü:</span>
                      {isOverloaded ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md" title="MEB normu 30 saati aşmıştır. Optimizasyon motoru esnek limitlerle yerleşimi sağlayacaktır.">
                          <AlertTriangle size={11} className="text-amber-600" />
                          Aşırı Yüklü ({totalAssignedHours} sa)
                        </span>
                      ) : (
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {totalAssignedHours} Saat
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 📅 HIZLI BOŞ GÜN SEÇİCİ (TEK TIKLA BOŞ GÜN VERME) */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-indigo-600" /> Boş Gün Seçimi (Hızlı Tıkla):
                      </span>
                      {(() => {
                        const fullOffDays = daysArray.filter(d => (t.unavailable?.[d] || []).length === numPeriods);
                        return fullOffDays.length > 0 ? (
                          <span className="text-rose-600 font-black">{fullOffDays.join(', ')} BOŞ</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Boş gün yok</span>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {daysArray.map(day => {
                        const isDayOff = (t.unavailable?.[day] || []).length === numPeriods;
                        const isPartiallyClosed = (t.unavailable?.[day] || []).length > 0 && !isDayOff;
                        const shortDay = day.slice(0, 3);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDayOff(t, day)}
                            className={`py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isDayOff
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs ring-1 ring-rose-400 scale-[1.02]'
                                : isPartiallyClosed
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border-slate-200'
                            }`}
                            title={`${day} gününü boş gün yap veya aç`}
                          >
                            <span>{shortDay}</span>
                            <span className="text-[8px] font-bold">
                              {isDayOff ? 'BOŞ' : isPartiallyClosed ? `${t.unavailable[day].length}k` : 'Açık'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Alt Aksiyon Butonları */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => { setSelectedTeacherForSchedule(t); setIsScheduleModalOpen(true); }}
                      className={`font-bold flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer text-[10px] flex-1 truncate ${
                        closedSlotsCount > 0 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      }`}
                      title="Detaylı saat bazlı müsaitlik ve kapalı saatleri düzenle"
                    >
                      <Clock size={11} className={closedSlotsCount > 0 ? 'text-rose-600' : 'text-indigo-600'} />
                      <span className="truncate">{closedSlotsCount > 0 ? `${closedSlotsCount} sa Kapalı (Düzenle)` : 'Detaylı Saat Kısıtı Belirle'}</span>
                    </button>

                    {tAssignedSlots > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleTeacherSchedulePin(t.id)}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                          isFullyPinned
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                        }`}
                        title={isFullyPinned ? "Tüm program kilidini aç" : "Öğretmenin tüm derslerini kilitle"}
                      >
                        <Pin size={10} className={isFullyPinned ? "fill-white" : ""} />
                        <span>{isFullyPinned ? "Kilitli" : "Kilitle"}</span>
                      </button>
                    )}
                  </div>

                  {/* Eğer program oluşturulmuşsa ve öğretmenin dersi varsa Programı Gör, yoksa Program Yok bilgisi */}
                  {tAssignedSlots > 0 ? (
                    <button 
                      type="button"
                      onClick={() => setSelectedTeacherForTimetable(t)} 
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer hover:underline text-[11px] px-2 py-1.5 rounded-xl hover:bg-indigo-50/60 transition-colors shrink-0"
                      title="Öğretmenin haftalık ders programını incele"
                    >
                      <span>Programı Gör</span>
                      <ArrowRight size={12} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 rounded-lg bg-slate-100 shrink-0 select-none" title="Ders programı sıfırlanmış veya henüz dağıtılmamıştır">
                      Program Yok (Sıfırlandı)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ÖĞRETMEN DÜZENLEME / EKLEME */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 shrink-0">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {editingTeacher ? `${editingTeacher.name} - Bilgileri Düzenle` : 'Yeni Öğretmen Kaydı'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Adı Soyadı</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Örn: Ahmet Yılmaz"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Ana Branşı</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Örn: Matematik"
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" 
                  />
                </div>
              </div>

              {/* 1. İSTİSNA ÖĞRETMEN SEÇENEĞİ */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="isExempt"
                  checked={isExempt}
                  onChange={(e) => setIsExempt(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer mt-0.5 shrink-0"
                />
                <label htmlFor="isExempt" className="cursor-pointer space-y-0.5">
                  <span className="font-black text-amber-900 block text-[11px] flex items-center gap-1.5">
                    <ShieldAlert size={13} className="text-amber-700" />
                    İstisna Öğretmen (1-2 Gün Gelen / &lt;17 Saat Dersi Olan)
                  </span>
                  <span className="text-[10px] text-amber-700 block leading-tight">
                    Bu öğretmenlere sert kısıtlar (bir sınıfa aynı gün 3 saat girmeme kuralı, günlük denge tavanı vb.) uygulanmaz. Dersleri okula geldiği 1-2 güne serbestçe toplanır.
                  </span>
                </label>
              </div>

              {/* 2. ÖNCELİKLİ TAM DOLDURULACAK GÜN & SON SAATLER */}
              <div className="bg-indigo-50/50 border border-indigo-200/80 p-3.5 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="font-black text-indigo-950 block text-[11px] flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-indigo-600" />
                    Öncelikli Tam Doldurulacak Gün:
                  </label>
                  <select
                    value={priorityFullDay}
                    onChange={(e) => setPriorityFullDay(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Seçilmedi (Standart Dengeli Dağıtım)</option>
                    {daysArray.map((d) => (
                      <option key={d} value={d}>📌 {d} Günü Tam Doldurulsun</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-indigo-700 block leading-tight mt-1">
                    Örn: Tamer öğretmenin Pazartesi gününe olabildiğince çok ders konulmasını sağlar.
                  </span>
                </div>

                {priorityFullDay && (
                  <div className="pt-2 border-t border-indigo-100 flex items-start gap-2.5">
                    <input 
                      type="checkbox" 
                      id="fillLateHours" 
                      checked={fillLateHours}
                      onChange={(e) => setFillLateHours(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer mt-0.5 shrink-0"
                    />
                    <label htmlFor="fillLateHours" className="cursor-pointer space-y-0.5">
                      <span className="font-bold text-indigo-950 block text-[11px]">
                        Son Saatleri Kesin Dolu Olsun (7. ve 8. saatler)
                      </span>
                      <span className="text-[10px] text-indigo-700 block leading-tight">
                        {priorityFullDay} günündeki dersler özellikle günün son saatlerine yerleştirilir.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* 3. OKUL İDARECİSİ KUTUCUĞU */}
              <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="isAdministrator"
                  checked={isAdministrator}
                  onChange={(e) => setIsAdministrator(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer mt-0.5 shrink-0"
                />
                <label htmlFor="isAdministrator" className="cursor-pointer space-y-0.5">
                  <span className="font-black text-purple-900 block text-[11px] flex items-center gap-1">
                    <Landmark size={12} className="text-purple-700" /> Okul İdarecisi Olarak Tanımla
                  </span>
                  <span className="text-[10px] text-purple-700 block leading-tight">İdarecilerin dersleri en son kalan boş saatlere yerleştirilir ve program dengesini zorlamaz.</span>
                </label>
              </div>

              {/* DERS YETKİLERİ HAVUZU */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Girebileceği Dersler (Yetki Havuzu)</label>
                  <span className="text-[10px] text-slate-400">{selectedSubjects.length} ders seçildi</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1 bg-slate-50">
                  {filteredGlobalSubjects.map((sub, sIdx) => {
                    const isChecked = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSubjectToggle(sub)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isChecked ? 'bg-indigo-100/70 text-indigo-900 font-bold border border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span className="text-[11px]">{sub}</span>
                        {isChecked && <Check size={14} className="text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ZÜMRE TOPLU GÜNCELLEME ALANI */}
              {sameBranchPeers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                    <Layers size={14} className="text-amber-600" />
                    <span>Zümre Eşitleme Önerisi ({sameBranchPeers.length} Diğer Öğretmen)</span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Aynı branşta (<strong className="text-amber-900">{branch}</strong>) şu meslektaşlarınız da kayıtlı: <strong className="text-amber-900">{sameBranchPeers.map(t => t.name).join(', ')}</strong>
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200/60 select-none">
                    <input 
                      type="checkbox" 
                      checked={propagateToPeers} 
                      onChange={(e) => setPropagateToPeers(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-amber-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-900">Seçilen ders yetkilerini aynı branştakilere de otomatik uygula</span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-50">İptal</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl cursor-pointer shadow-sm">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAKVİM KISIT GİRİŞİ (AVAILABILITY GRID) */}
      {isScheduleModalOpen && selectedTeacherForSchedule && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Haftalık Müsaitlik & Kapalı Saat Ayarları (Kısıtlar)</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Öğretmen: <strong className="text-slate-800">{selectedTeacherForSchedule.name}</strong> ({selectedTeacherForSchedule.branch || 'Genel'})</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 text-[11px] text-indigo-900 flex items-center gap-2">
              <span className="font-bold">💡 Bilgi:</span>
              <span>Bu ekrandaki kutucuklar öğretmenin haftalık ders programı değil; derse giremeyeceği <strong>özel kapalı saatleridir (kısıtlar)</strong>. Program sıfırlansa dahi kısıtlar korunur; açmak için <strong>"Tümünü Aç"</strong> butonunu kullanabilirsiniz.</span>
            </div>

            <div className="p-5 space-y-4">
              <AvailabilityGrid 
                settings={settings} 
                teacher={selectedTeacherForSchedule} 
                onChange={(id, unavailable) => updateTeacher(id, { unavailable })} 
                totalAssignedHours={getTeacherLoad(selectedTeacherForSchedule.id)}
              />
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateTeacher(selectedTeacherForSchedule.id, { unavailable: {} });
                    setResetFeedbackMsg(`${selectedTeacherForSchedule.name} öğretmeninin tüm kapalı saatleri açıldı.`);
                    setTimeout(() => setResetFeedbackMsg(''), 4000);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                >
                  Bu Öğretmenin Tüm Saatlerini Aç
                </button>

                <button 
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)} 
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Kapat ve Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ÖĞRETMEN HAFTALIK DERS PROGRAMI GÖSTERİMİ */}
      {selectedTeacherForTimetable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-lg">
                  <Users size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selectedTeacherForTimetable.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                      {selectedTeacherForTimetable.branch || 'Genel'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haftalık Atanan Ders Yükü: <strong className="text-slate-800">{getTeacherLoad(selectedTeacherForTimetable.id)} Saat</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalTimetableSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Ders programı sıfırlanacaktır. Onaylıyor musunuz?")) {
                        resetTimetable(true);
                        setSelectedTeacherForTimetable(null);
                        setResetFeedbackMsg("Ders programı başarıyla sıfırlandı.");
                        setTimeout(() => setResetFeedbackMsg(''), 4000);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-rose-600" />
                    <span>Programı Sıfırla</span>
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={() => setSelectedTeacherForTimetable(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {!timetable || Object.keys(timetable).length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <Calendar size={28} className="mx-auto text-slate-400" />
                  <div className="text-xs font-bold text-slate-700">Ders Programı Henüz Oluşturulmamış (Sıfırlanmış)</div>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Ders programı tablosu boştur. Öğretmenin saat bazlı yerleşimlerini oluşturmak için lütfen sol menüden "Oluştur" sayfasına giderek algoritmayı çalıştırınız.
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
                          const daySchedule = teacherTimetableGrid[day] || {};
                          const unavailablePeriods = selectedTeacherForTimetable.unavailable?.[day] || [];

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

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTeacherForTimetable(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🧹 PROGRAMI SIFIRLA ONAY MODALI */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Ders Programını Sıfırla</h3>
                <p className="text-xs text-slate-500">Mevcut ders dağıtımı sıfırlanacaktır.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Dikkat:</p>
              <p>Öğretmenler, sınıflar ve haftalık müfredat ders yükleri <strong>kesinlikle silinmez</strong>. Yalnızca haftalık ders programındaki yerleşimler temizlenir.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetTimetable(false);
                  setIsResetConfirmOpen(false);
                  setResetFeedbackMsg("Kilitli olmayan dersler sıfırlandı. Kilitler korundu.");
                  setTimeout(() => setResetFeedbackMsg(''), 4000);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Pin size={14} />
                <span>Kilitleri Koru & Sıfırla</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetTimetable(true);
                  setIsResetConfirmOpen(false);
                  setResetFeedbackMsg("Tüm ders programı ve kilitler tamamen sıfırlandı.");
                  setTimeout(() => setResetFeedbackMsg(''), 4000);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Tüm Programı Sıfırla (Kilitler Dahil)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer mt-1"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
