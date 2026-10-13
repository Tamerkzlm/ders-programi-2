// frontend/src/pages/DykPlanner.jsx
import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getCourseColorClass } from '../utils/courseColors';

export default function DykPlanner() {
  const navigate = useNavigate();
  const {
    teachers,
    settings,
    dykSettings,
    dykGroups,
    dykAssignments,
    dykTeacherAvailabilities,
    dykSchedule,
    dykResult,
    updateDykSettings,
    addDykGroup,
    deleteDykGroup,
    addDykAssignment,
    deleteDykAssignment,
    setDykTeacherAvailability,
    generateDykSchedule,
    clearDykSchedule
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'teachers' | 'assignments' | 'settings'
  const [selectedGroupId, setSelectedGroupId] = useState(dykGroups?.[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [viewMode, setViewMode] = useState('group'); // 'group' | 'teacher' | 'all'
  const [toastMessage, setToastMessage] = useState('');

  // Yeni grup formu
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('12');

  // DYK Öğretmen Branş Filtresi
  const isDykBranch = (branch = '', subjects = []) => {
    const b = (branch || '').toUpperCase();
    const subs = (subjects || []).map(s => (s || '').toUpperCase()).join(' ');
    const all = `${b} ${subs}`;
    return (
      all.includes('MAT') ||
      all.includes('FİZ') || all.includes('FIZ') ||
      all.includes('KİM') || all.includes('KIM') ||
      all.includes('BİO') || all.includes('BIO') || all.includes('BİY') || all.includes('BIY') ||
      all.includes('FEN') ||
      all.includes('COG') || all.includes('COĞ') ||
      all.includes('TAR') ||
      all.includes('TDEB') || all.includes('EDEB') ||
      all.includes('İNG') || all.includes('ING') ||
      all.includes('FELS')
    );
  };

  const dykEligibleTeachers = (teachers || []).filter(t => isDykBranch(t.branch, t.subjects));

  // 11 ve 12. Sınıf Müfredat Dersleri (DYK Ders Önerileri)
  const DYK_SUGGESTED_SUBJECTS = [
    "Matematik (AYT)",
    "Matematik (TYT / 11. Sınıf)",
    "Fizik (AYT)",
    "Kimya (AYT)",
    "Biyoloji (AYT)",
    "Türk Dili ve Edebiyatı (AYT)",
    "Tarih (AYT / TYT)",
    "Coğrafya (AYT)",
    "Felsefe Grubu (AYT)",
    "İngilizce (YDT)",
    "Matematik (12)",
    "Fizik (12)",
    "Kimya (12)",
    "Biyoloji (12)",
    "Türk Dili ve Edebiyatı (12)",
    "T.C. İnkılap Tarihi",
    "Matematik (11)",
    "Fizik (11)",
    "Kimya (11)",
    "Biyoloji (11)",
    "Türk Dili ve Edebiyatı (11)",
    "Tarih (11)",
    "Coğrafya (11)"
  ];

  // Yeni atama formu
  const [assignGroupId, setAssignGroupId] = useState(dykGroups?.[0]?.id || '');
  const [assignTeacherId, setAssignTeacherId] = useState(dykEligibleTeachers?.[0]?.id || teachers?.[0]?.id || '');
  const [assignSubject, setAssignSubject] = useState(DYK_SUGGESTED_SUBJECTS[0] || '');
  const [assignBlocks, setAssignBlocks] = useState(1);

  const activeDays = dykSettings?.activeDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const blocks = dykSettings?.blocks || [
    { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
    { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Öğretmen gün toggle
  const toggleTeacherDay = (tId, day) => {
    const current = dykTeacherAvailabilities[tId] || [];
    let updated;
    if (current.includes(day)) {
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day];
    }
    setDykTeacherAvailability(tId, updated);
  };

  // Tüm öğretmenlere o günü aç/kapa
  const setAllTeachersDay = (day, enable) => {
    dykEligibleTeachers.forEach(t => {
      const current = dykTeacherAvailabilities[t.id] || [];
      let updated;
      if (enable) {
        updated = current.includes(day) ? current : [...current, day];
      } else {
        updated = current.filter(d => d !== day);
      }
      setDykTeacherAvailability(t.id, updated);
    });
    showToast(`Tüm öğretmenlerin ${day} günü tercihi güncellendi.`);
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addDykGroup({ name: newGroupName.trim(), grade: newGroupGrade });
    setNewGroupName('');
    showToast(`"${newGroupName.trim()}" DYK grubu oluşturuldu.`);
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    if (!assignGroupId || !assignTeacherId || !assignSubject.trim()) return;
    addDykAssignment({
      groupId: assignGroupId,
      teacherId: assignTeacherId,
      subject: assignSubject.trim(),
      blocksPerWeek: Number(assignBlocks) || 1
    });
    showToast(`"${assignSubject.trim()}" ders ataması kaydedildi.`);
  };

  const handleRunSolver = () => {
    const res = generateDykSchedule();
    setActiveTab('schedule');
    if (res.success) {
      showToast(`Tüm ${res.totalActivities} blok ders başarıyla dağıtıldı! 🌟`);
    } else {
      showToast(`${res.unassigned.length} blok ders yerleştirilemedi. Kısıtları gözden geçirin.`);
    }
  };

  const getTeacherName = (tId) => teachers.find(t => t.id === tId)?.name || tId;
  const getGroupName = (gId) => dykGroups.find(g => g.id === gId)?.name || gId;

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
                    Modül 2 / 4
                  </span>
                  <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight">
                    DYK Kurs Planlama Modülü
                  </h1>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  {settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL'} &nbsp;·&nbsp; Destekleme ve Yetiştirme Kursları
                </p>
              </div>
            </div>
          </div>

          {/* Blok Zaman Bilgisi Rozeti */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Clock size={14} className="text-emerald-600" />
            <span className="text-slate-500 font-medium">DYK Saatleri:</span>
            <span className="font-bold text-slate-800">15:50 - 17:00 (1. Blok)</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-800">18:00 - 19:10 (2. Blok)</span>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Printer size={15} className="text-slate-500" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={handleRunSolver}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Otomatik DYK Dağıt</span>
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

        {/* SEKME MENÜSÜ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100 pt-1.5">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CalendarDays size={15} />
            <span>DYK Haftalık Çizelgesi</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Öğretmen Gün Tercihleri ({dykEligibleTeachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'assignments'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={15} />
            <span>DYK Grupları & Ders Atamaları ({dykAssignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders size={15} />
            <span>DYK Ayarları</span>
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full print:p-0 print:max-w-none">
        
        {/* ========================================================= */}
        {/* SEKME 1: DYK ÇİZELGESİ (HAFTALIK TABLO) */}
        {/* ========================================================= */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            
            {/* Durum & Filtre Çubuğu (Print'te gizli) */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Görünüm:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('group')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'group' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Grup Bazlı
                  </button>
                  <button
                    onClick={() => setViewMode('teacher')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'teacher' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Öğretmen Bazlı
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tüm Gruplar Matrisi
                  </button>
                </div>
              </div>

              {/* Grup veya Öğretmen Seçici */}
              {viewMode === 'group' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Seçili Grup:</span>
                  <select
                    value={selectedGroupId || dykGroups[0]?.id}
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
                  <span className="text-xs font-semibold text-slate-500">Öğretmen:</span>
                  <select
                    value={selectedTeacherId || teachers[0]?.id}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dağıtım Durumu Rozeti */}
              {dykResult && (
                <div className={`flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl border font-bold ${
                  dykResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {dykResult.success ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertCircle size={15} className="text-amber-600" />}
                  <span>
                    {dykResult.success 
                      ? `Tüm ${dykResult.totalActivities} blok ders dağıtıldı!` 
                      : `${dykResult.unassigned.length} blok ders yerleştirilemedi.`}
                  </span>
                </div>
              )}
            </div>

            {/* Henüz dağıtım yapılmadıysa uyarı ve hızlı başlat butonu */}
            {!dykSchedule && (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs my-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mx-auto shadow-2xs">
                  🎓
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">DYK Çizelgesi Henüz Oluşturulmadı</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Öğretmen gün onayları ve grup ders atamalarına göre kural motorunu tek tıkla çalıştırarak haftalık kurs çizelgesini oluşturun.
                  </p>
                </div>
                <button
                  onClick={handleRunSolver}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Şimdi Otomatik DYK Dağıtımı Yap</span>
                </button>
              </div>
            )}

            {/* TABLO 1: SEÇİLİ GRUP GÖRÜNÜMÜ */}
            {dykSchedule && viewMode === 'group' && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:bg-white print:border-black">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 print:text-black">
                      {getGroupName(selectedGroupId || dykGroups[0]?.id)} — DYK Haftalık Ders Çizelgesi
                    </h2>
                    <p className="text-xs text-slate-500 print:text-gray-600 mt-0.5">
                      15:50 - 17:00 (1. Blok: 2 Ders) &nbsp;|&nbsp; 18:00 - 19:10 (2. Blok: 2 Ders)
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 print:hidden">
                    Grup Programı
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider print:bg-gray-100 print:text-black print:border-black">
                        <th className="p-4 w-52">Blok & Saat</th>
                        {activeDays.map(day => (
                          <th key={day} className="p-4 text-center border-l border-slate-200 print:border-black">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-black">
                      {blocks.map(block => (
                        <tr key={block.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 bg-slate-50/40 font-semibold border-r border-slate-200 print:bg-gray-50 print:border-black">
                            <div className="text-slate-900 print:text-black font-extrabold text-xs">{block.name}</div>
                            <div className="text-[11px] text-emerald-700 print:text-gray-600 font-bold mt-0.5">2 Derslik Blok</div>
                          </td>
                          {activeDays.map(day => {
                            const curGId = selectedGroupId || dykGroups[0]?.id;
                            const slot = dykSchedule?.[curGId]?.[day]?.[block.id];
                            const colorStyle = slot ? getCourseColorClass(slot.subject, getGroupName(curGId)) : null;

                            return (
                              <td key={day} className="p-3 text-center border-l border-slate-200 print:border-black min-h-[86px]">
                                {slot ? (
                                  <div className={`rounded-2xl p-3 text-center border transition-all ${
                                    colorStyle?.card || 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                  }`}>
                                    <div className="font-extrabold text-sm leading-tight">
                                      {slot.subject}
                                    </div>
                                    <div className="text-xs mt-1.5 flex items-center justify-center gap-1 font-semibold opacity-90">
                                      <Users size={12} className="print:hidden" />
                                      <span>{getTeacherName(slot.teacherId)}</span>
                                    </div>
                                    <div className="mt-1 text-[10px] font-bold opacity-75">
                                      2 Derslik Blok
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-16 flex items-center justify-center text-slate-300 print:text-gray-300 text-xs italic">
                                    — Boş —
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

            {/* TABLO 2: SEÇİLİ ÖĞRETMEN GÖRÜNÜMÜ */}
            {dykSchedule && viewMode === 'teacher' && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:bg-white print:border-black">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 print:text-black">
                      {getTeacherName(selectedTeacherId || teachers[0]?.id)} — DYK Kurs Görev Çizelgesi
                    </h2>
                    <p className="text-xs text-slate-500 print:text-gray-600 mt-0.5">
                      Öğretmenin görev aldığı DYK sınıfları ve blok saatleri
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 print:hidden">
                    Öğretmen Programı
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider print:bg-gray-100 print:text-black print:border-black">
                        <th className="p-4 w-52">Blok & Saat</th>
                        {activeDays.map(day => (
                          <th key={day} className="p-4 text-center border-l border-slate-200 print:border-black">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-black">
                      {blocks.map(block => (
                        <tr key={block.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 bg-slate-50/40 font-semibold border-r border-slate-200 print:bg-gray-50 print:border-black">
                            <div className="text-slate-900 print:text-black font-extrabold text-xs">{block.name}</div>
                            <div className="text-[11px] text-indigo-700 print:text-gray-600 font-bold mt-0.5">2 Derslik Blok</div>
                          </td>
                          {activeDays.map(day => {
                            const curTId = selectedTeacherId || teachers[0]?.id;
                            let teacherSlot = null;
                            let groupName = null;
                            Object.keys(dykSchedule || {}).forEach(gId => {
                              const s = dykSchedule[gId]?.[day]?.[block.id];
                              if (s && s.teacherId === curTId) {
                                teacherSlot = s;
                                groupName = getGroupName(gId);
                              }
                            });

                            const colorStyle = teacherSlot ? getCourseColorClass(teacherSlot.subject, groupName) : null;

                            return (
                              <td key={day} className="p-3 text-center border-l border-slate-200 print:border-black min-h-[86px]">
                                {teacherSlot ? (
                                  <div className={`rounded-2xl p-3 text-center border transition-all ${
                                    colorStyle?.card || 'bg-indigo-50 border-indigo-200 text-indigo-950'
                                  }`}>
                                    <div className="font-extrabold text-sm leading-tight">
                                      {teacherSlot.subject}
                                    </div>
                                    <div className="text-xs mt-1.5 flex items-center justify-center gap-1 font-bold opacity-90">
                                      <GraduationCap size={13} className="print:hidden" />
                                      <span>{groupName}</span>
                                    </div>
                                    <div className="mt-1 text-[10px] font-bold opacity-75">
                                      2 Derslik Blok
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-16 flex items-center justify-center text-slate-300 print:text-gray-300 text-xs italic">
                                    — Görev Yok —
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

            {/* TABLO 3: TÜM GRUPLAR MATRİSİ */}
            {dykSchedule && viewMode === 'all' && (
              <div className="space-y-6">
                {dykGroups.map(group => (
                  <div key={group.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-black print:shadow-none">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center print:border-black">
                      <h3 className="font-extrabold text-sm text-slate-900 print:text-black flex items-center gap-2">
                        <span className="text-emerald-600 font-black">●</span>
                        <span>{group.name}</span>
                        <span className="text-xs font-semibold text-slate-500">({group.grade}. Sınıf DYK Grubu)</span>
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 print:text-gray-600">Haftalık 2 Blok Saat</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider print:border-black">
                            <th className="p-3 w-48">Blok</th>
                            {activeDays.map(day => (
                              <th key={day} className="p-3 text-center border-l border-slate-200 print:border-black">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                          {blocks.map(block => (
                            <tr key={block.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800 print:text-black">{block.name}</td>
                              {activeDays.map(day => {
                                const slot = dykSchedule?.[group.id]?.[day]?.[block.id];
                                const colorStyle = slot ? getCourseColorClass(slot.subject, group.name) : null;

                                return (
                                  <td key={day} className="p-2 text-center border-l border-slate-200 print:border-black">
                                    {slot ? (
                                      <div className={`rounded-xl p-2.5 border text-center ${
                                        colorStyle?.card || 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                      }`}>
                                        <div className="font-extrabold text-xs">{slot.subject}</div>
                                        <div className="text-[10px] font-semibold mt-0.5 opacity-90">{getTeacherName(slot.teacherId)}</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 print:text-gray-300 text-xs">—</span>
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
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* SEKME 2: ÖĞRETMEN GÜN TERCİHLERİ */}
        {/* ========================================================= */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Öğretmen DYK Gün Tercihleri & Uygunluk Matrisi
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Öğretmenlerin kurs verebilecekleri günleri seçin. Algoritma öğretmene yalnızca onayladığı günlerde kurs görevi atayacaktır.
                  </p>
                </div>

                {/* Hızlı Toplu Gün Butonları */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-semibold mr-1">Tümüne Aç:</span>
                  {activeDays.map(day => (
                    <button
                      key={day}
                      onClick={() => setAllTeachersDay(day, true)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      +{day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-4">Öğretmen Adı</th>
                      <th className="p-4">Branş</th>
                      <th className="p-4 text-center">Kurs Verebileceği Günler</th>
                      <th className="p-4 text-center">Onaylı Gün</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dykEligibleTeachers.map(teacher => {
                      const avail = dykTeacherAvailabilities[teacher.id] || [];

                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{teacher.name}</td>
                          <td className="p-4 text-slate-500 font-medium">{teacher.branch}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {activeDays.map(day => {
                                const isChecked = avail.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleTeacherDay(teacher.id, day)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 border border-slate-200/60'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                              avail.length > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {avail.length} Gün
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SEKME 3: GRUPLAR & DERS ATAMALARI */}
        {/* ========================================================= */}
        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL SÜTUN: FORM VE TANIMLAMALAR */}
            <div className="space-y-6">
              {/* 1. Yeni DYK Grubu Ekle */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus size={16} className="text-emerald-600" />
                  <span>Yeni DYK Grubu Tanımla</span>
                </h3>
                <form onSubmit={handleAddGroup} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Grup Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: 12-C Sayısal Kurs Grubu"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Sınıf Seviyesi</label>
                    <select
                      value={newGroupGrade}
                      onChange={(e) => setNewGroupGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold cursor-pointer"
                    >
                      <option value="11">11. Sınıf (YKS Hazırlık)</option>
                      <option value="12">12. Sınıf (YKS/AYT/TYT)</option>
                      <option value="9">9. Sınıf</option>
                      <option value="10">10. Sınıf</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Grubu Kaydet</span>
                  </button>
                </form>
              </div>

              {/* 2. Gruba DYK Dersi ve Öğretmen Ata */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span>Kurs Dersi & Öğretmen Ata</span>
                </h3>
                <form onSubmit={handleAddAssignment} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">DYK Grubu</label>
                    <select
                      value={assignGroupId}
                      onChange={(e) => setAssignGroupId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold cursor-pointer"
                    >
                      {dykGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.grade}. Sınıf)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Görevli Öğretmen (Branş Filtreli)
                    </label>
                    <select
                      value={assignTeacherId}
                      onChange={(e) => setAssignTeacherId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold cursor-pointer"
                    >
                      {dykEligibleTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Kurs Dersi Adı
                    </label>
                    <div className="space-y-2">
                      <select
                        value={assignSubject}
                        onChange={(e) => setAssignSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold cursor-pointer"
                      >
                        {DYK_SUGGESTED_SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Veya serbest ders adı yazın..."
                        value={assignSubject}
                        onChange={(e) => setAssignSubject(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Haftalık Blok Sayısı</label>
                    <select
                      value={assignBlocks}
                      onChange={(e) => setAssignBlocks(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold cursor-pointer"
                    >
                      <option value="1">1 Blok / Hafta (2 Ders Saati)</option>
                      <option value="2">2 Blok / Hafta (4 Ders Saati)</option>
                      <option value="3">3 Blok / Hafta (6 Ders Saati)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Dersi Gruba Ata</span>
                  </button>
                </form>
              </div>
            </div>

            {/* SAĞ SÜTUN: MEVCUT ATAMALAR VE GRUPLAR LİSTESİ */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Gruplar Tablosu */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Aktif DYK Grupları ({dykGroups.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dykGroups.map(g => (
                    <div key={g.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-extrabold text-xs text-slate-900">{g.name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{g.grade}. Sınıf DYK Grubu</div>
                      </div>
                      <button
                        onClick={() => deleteDykGroup(g.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Grubu Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atamalar Tablosu */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Tanımlı Kurs Dersi Atamaları ({dykAssignments.length})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Toplam {dykAssignments.reduce((acc, a) => acc + (Number(a.blocksPerWeek) || 1), 0)} Blok (
                    {dykAssignments.reduce((acc, a) => acc + (Number(a.blocksPerWeek) || 1) * 2, 0)} Ders Saati)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="p-3">DYK Grubu</th>
                        <th className="p-3">Ders</th>
                        <th className="p-3">Öğretmen</th>
                        <th className="p-3 text-center">Haftalık Yük</th>
                        <th className="p-3 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dykAssignments.map(asg => (
                        <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{getGroupName(asg.groupId)}</td>
                          <td className="p-3 font-extrabold text-emerald-700">{asg.subject}</td>
                          <td className="p-3 text-slate-700 font-medium">{getTeacherName(asg.teacherId)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800 border border-slate-200">
                              {asg.blocksPerWeek} Blok ({asg.blocksPerWeek * 2} Saat)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => deleteDykAssignment(asg.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Atamayı Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* SEKME 4: DYK AYARLARI & BLOK SAATLERİ */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  DYK Kurs Zamanı & Blok Ayarları
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kursların yapılabileceği günleri ve günlük blok saat aralıklarını yapılandırın.
                </p>
              </div>

              {/* Günler */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kurs Yapılan Günler
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map(day => {
                    const isActive = activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const updated = isActive
                            ? activeDays.filter(d => d !== day)
                            : [...activeDays, day];
                          updateDykSettings({ activeDays: updated });
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{day}</span>
                        {isActive && <Check size={14} className="text-emerald-600 font-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blok Saatleri Bilgilendirme */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" />
                  <span>Varsayılan Blok Aralıkları</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-slate-800">1. Blok Kurs (2 Derslik)</span>
                    <span className="font-mono text-emerald-700 font-bold">15:50 - 17:00</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-slate-800">2. Blok Kurs (2 Derslik)</span>
                    <span className="font-mono text-emerald-700 font-bold">18:00 - 19:10</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={clearDykSchedule}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Dağıtılan DYK Çizelgesini Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => showToast('DYK ayarları başarıyla kaydedildi.')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Ayarları Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
