// frontend/src/pages/ModuleHub.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  GraduationCap, 
  FileSpreadsheet, 
  Layers,
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { store as kelebekStore } from '../utils/kelebek/store';
import CloudSyncBar from '../components/common/CloudSyncBar';
import { APP_VERSION_LABEL } from '../config/version';

/**
 * 1. Haftalık Ders Programı oluşturuldu mu? (Boş objeleri ve boş gün dizilerini eler)
 */
const checkTimetableCreated = (timetable) => {
  if (!timetable || typeof timetable !== 'object') return false;
  for (const classDays of Object.values(timetable)) {
    if (!classDays || typeof classDays !== 'object') continue;
    for (const daySlots of Object.values(classDays)) {
      if (Array.isArray(daySlots) && daySlots.some(s => s && (s.subject || s.teacherId))) {
        return true;
      }
    }
  }
  return false;
};

/**
 * 2. DYK Kurs Programı oluşturuldu mu? (group -> day -> blockId içinde gerçek atama arar)
 */
const checkDykCreated = (dykSchedule: any) => {
  if (!dykSchedule || typeof dykSchedule !== 'object') return false;
  for (const groupDays of Object.values(dykSchedule)) {
    if (!groupDays || typeof groupDays !== 'object') continue;
    for (const dayBlocks of Object.values(groupDays)) {
      if (!dayBlocks || typeof dayBlocks !== 'object') continue;
      for (const block of Object.values(dayBlocks) as any[]) {
        if (block && typeof block === 'object' && (block.subject || block.teacherId)) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * 3. Kelebek Sınav Yerleşim Planı oluşturuldu mu? (try/catch korumalı)
 */
const getKelebekMeta = (fallbackClassroomsCount = 0) => {
  try {
    const plan = kelebekStore?.getPlan ? kelebekStore.getPlan() : null;
    const savedRooms = kelebekStore?.getRooms ? kelebekStore.getRooms() : [];
    const activeGrades = kelebekStore?.getActiveGrades ? kelebekStore.getActiveGrades() : ['9', '10', '11', '12'];

    const roomCount = Array.isArray(savedRooms) && savedRooms.length > 0
      ? savedRooms.length
      : fallbackClassroomsCount;

    const gradesLabel = Array.isArray(activeGrades) && activeGrades.length > 0
      ? activeGrades.join('-')
      : '9-10-11-12';

    if (!plan || typeof plan !== 'object') {
      return { isCreated: false, roomCount, gradesLabel };
    }

    if (Array.isArray(plan.assignments) && plan.assignments.length > 0) {
      const hasSeatedStudent = plan.assignments.some(a =>
        Array.isArray(a?.grid) && a.grid.some(row => Array.isArray(row) && row.some(seat => seat && (seat.id || seat.name || seat.adSoyad)))
      );
      if (hasSeatedStudent) return { isCreated: true, roomCount: plan.assignments.length, gradesLabel };
    }

    if (Array.isArray(plan.rooms) && plan.rooms.length > 0) {
      return { isCreated: true, roomCount: plan.rooms.length, gradesLabel };
    }
    if (Array.isArray(plan.placements) && plan.placements.length > 0) {
      return { isCreated: true, roomCount, gradesLabel };
    }

    return { isCreated: false, roomCount, gradesLabel };
  } catch {
    return { isCreated: false, roomCount: fallbackClassroomsCount, gradesLabel: '9-10-11-12' };
  }
};

/**
 * 4. Ortak Sınav Takvimi oluşturuldu mu?
 */
const checkExamScheduleCreated = (examPlacements: any, examSchedule: any) => {
  if (Array.isArray(examPlacements) && examPlacements.some(p => p && p.date && p.name)) {
    return true;
  }
  if (examSchedule && typeof examSchedule === 'object') {
    for (const gradeDates of Object.values(examSchedule)) {
      if (!gradeDates || typeof gradeDates !== 'object') continue;
      for (const slotsMap of Object.values(gradeDates)) {
        if (!slotsMap || typeof slotsMap !== 'object') continue;
        for (const sub of Object.values(slotsMap) as any[]) {
          if (sub && sub.name) return true;
        }
      }
    }
  }
  return false;
};

export default function ModuleHub() {
  const navigate = useNavigate();
  const {
    settings,
    teachers,
    classrooms,
    timetable,
    dykGroups,
    dykSettings,
    dykSchedule,
    examSettings,
    examSchedule,
    examPlacements
  } = useAppStore();

  const totalCourseHours = useMemo(() => {
    return (classrooms || []).reduce(
      (acc, c) => acc + (c?.courses || []).reduce((s, co) => s + (Number(co?.hoursPerWeek) || 0), 0),
      0
    );
  }, [classrooms]);

  const isTimetableReady = useMemo(() => checkTimetableCreated(timetable), [timetable]);
  const isDykReady = useMemo(() => checkDykCreated(dykSchedule), [dykSchedule]);
  const kelebekMeta = useMemo(() => getKelebekMeta(classrooms?.length || 0), [classrooms?.length]);
  const isExamsReady = useMemo(
    () => checkExamScheduleCreated(examPlacements, examSchedule),
    [examPlacements, examSchedule]
  );

  const dykBlockCount = Array.isArray(dykSettings?.blocks) && dykSettings.blocks.length > 0
    ? dykSettings.blocks.length
    : 2;

  const examGradesLabel = useMemo(() => {
    const rawGrades = Array.isArray(examSettings?.grades) && examSettings.grades.length > 0
      ? examSettings.grades
      : ['9', '10', '11', '12'];
    const baseGrades = Array.from(new Set(rawGrades.map(g => String(g).split('-')[0])));
    return baseGrades.join(', ');
  }, [examSettings?.grades]);

  const modules = [
    {
      id: 'timetable',
      title: 'Haftalık Ders Dağıtım Motoru',
      isCreated: isTimetableReady,
      icon: <CalendarDays size={30} className="text-indigo-600" />,
      stats: [
        { label: 'Öğretmen', value: teachers?.length || 0 },
        { label: 'Şube', value: classrooms?.length || 0 },
        { label: 'Ders Yükü', value: `${totalCourseHours} Saat` }
      ],
      borderColor: 'hover:border-indigo-500/60',
      actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20',
      actionText: 'Ders Programını Yönet',
      path: '/dashboard'
    },
    {
      id: 'dyk',
      title: 'DYK Kurs Programı',
      isCreated: isDykReady,
      icon: <GraduationCap size={30} className="text-emerald-600" />,
      stats: [
        { label: 'Aktif Grup', value: dykGroups?.length || 0 },
        { label: 'Blok Düzeni', value: `${dykBlockCount} Blok / Gün` },
        { label: 'Saat Aralığı', value: '15:50 - 19:10' }
      ],
      borderColor: 'hover:border-emerald-500/60',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
      actionText: 'DYK Programını Başlat',
      path: '/dyk'
    },
    {
      id: 'kelebek',
      title: 'Kelebek Sistemi',
      isCreated: kelebekMeta.isCreated,
      icon: <Layers size={30} className="text-violet-600" />,
      stats: [
        { label: 'Salon Sayısı', value: kelebekMeta.roomCount },
        { label: 'Kademeler', value: kelebekMeta.gradesLabel },
        { label: 'Düzen', value: 'Çapraz / Karışık' }
      ],
      borderColor: 'hover:border-violet-500/60',
      actionBtn: 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20',
      actionText: 'Kelebek Sistemini Aç',
      path: '/kelebek'
    },
    {
      id: 'exams',
      title: 'Ortak Sınav Takvimi',
      isCreated: isExamsReady,
      icon: <FileSpreadsheet size={30} className="text-amber-600" />,
      stats: [
        { label: 'Sınav Seansları', value: (examSettings?.examSlots || [3, 5]).map(s => `${s}. Saat`).join(', ') },
        { label: 'Seçili Kademeler', value: examGradesLabel },
        { label: 'Sınav Günü', value: `${(examSettings?.selectedDates || []).length || 10} Gün` }
      ],
      borderColor: 'hover:border-amber-500/60',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20',
      actionText: 'Sınav Takvimini Hazırla',
      path: '/exams'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
      
      {/* 🏛️ ÜST KURUMSAL HEADER */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-600/30">
              MEB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Resmi Maarif {APP_VERSION_LABEL}
                </span>
                <span className="text-xs font-semibold text-slate-400">|</span>
                <span className="text-xs font-semibold text-slate-500">Akademik Planlama Portalı</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {settings?.schoolName || 'Antakya Hz. Ayşe Kız Anadolu İmam Hatip Lisesi'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <CloudSyncBar />
            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/70 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-900">
              <span>Hazırlayan: Tamer Közleme</span>
              <span className="text-indigo-300">•</span>
              <a
                href="https://instagram.com/Tamerkzlm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold"
              >
                instagram: Tamerkzlm
              </a>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>4 Modül Çevrimiçi</span>
            </div>
          </div>

        </div>
      </header>

      {/* 🚀 ANA MODÜL KARTLARI (2x2 GRID) */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Akademik Modül Seçimi
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Lütfen üzerinde çalışmak istediğiniz planlama sistemini seçin:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(m.path)}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 cursor-pointer group ${m.borderColor}`}
            >
              {/* Kart Başlığı ve Yeşil "Program Oluşturuldu" Bilgilendirmesi */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform shrink-0">
                    {m.icon}
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                    {m.title}
                  </h3>
                </div>

                {m.isCreated && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Program Oluşturuldu</span>
                  </span>
                )}
              </div>

              {/* Üçlü İstatistik Kartı & Eylem Butonu */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 p-3 rounded-xl border border-slate-100 text-center">
                  {m.stats.map((s, sIdx) => (
                    <div key={sIdx} className="px-1">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                        {s.label}
                      </span>
                      <span className="block text-xs sm:text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(m.path);
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer group/btn ${m.actionBtn}`}
                >
                  <span>{m.actionText}</span>
                  <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* 📌 ALT BİLGİ & SÜRÜM */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 {settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL'} - Kurumsal Yönetim Paketi ({APP_VERSION_LABEL})</span>
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>Hazırlayan: Tamer Közleme</span>
            <span className="text-slate-300">|</span>
            <a
              href="https://instagram.com/Tamerkzlm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              instagram: Tamerkzlm
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
