// frontend/src/pages/Constraints.jsx
import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  Save, 
  CheckCircle, 
  Clock, 
  Coffee,
  Scale, 
  Layers, 
  BookOpen, 
  Sun, 
  Flame, 
  RotateCcw,
  Info,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowRight,
  Baby,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import CapacityHeatmap from '../components/common/CapacityHeatmap';

export default function Constraints() {
  const navigate = useNavigate();
  const { hardPrefs, setHardPrefs, softPrefs, updateSoftPrefs, teachers, classrooms, settings } = useAppStore();

  // Sert ve yumuşak kısıtların yerel durumu
  const [hard, setHard] = useState({
    enforceMaxTotalGaps: hardPrefs?.enforceMaxTotalGaps ?? true,
    maxTotalGaps: hardPrefs?.maxTotalGaps ?? 4,
    maxTotalGapsLevel: hardPrefs?.maxTotalGapsLevel ?? (hardPrefs?.enforceMaxTotalGaps === false ? 'off' : 'medium'),
    maxTotalGapsPenalty: hardPrefs?.maxTotalGapsPenalty ?? 60,
    enforceMinTotalGaps: hardPrefs?.enforceMinTotalGaps ?? false,
    minTotalGaps: hardPrefs?.minTotalGaps ?? 0,
    minTotalGapsLevel: hardPrefs?.minTotalGapsLevel ?? 'off',
    minTotalGapsPenalty: hardPrefs?.minTotalGapsPenalty ?? 0,
    gapExemptTeacherIds: hardPrefs?.gapExemptTeacherIds ?? [],
    enforceHourlyReserve: hardPrefs?.enforceHourlyReserve ?? false,
    minHourlyReserveTeachers: hardPrefs?.minHourlyReserveTeachers ?? 1,
    hourlyReserveLevel: hardPrefs?.hourlyReserveLevel ?? 'off',
    hourlyReservePenalty: hardPrefs?.hourlyReservePenalty ?? 0,
    enforceCategoricalFairness: hardPrefs?.enforceCategoricalFairness ?? true,
    enforceMinActiveDays: hardPrefs?.enforceMinActiveDays ?? true,
    minActiveDays: hardPrefs?.minActiveDays ?? 4,
    minActiveDaysLevel: hardPrefs?.minActiveDaysLevel ?? 'high',
    minActiveDaysPenalty: hardPrefs?.minActiveDaysPenalty ?? 100,
    minDaysExemptTeacherIds: hardPrefs?.minDaysExemptTeacherIds ?? [],
    enforceDailyBalance: hardPrefs?.enforceDailyBalance ?? true,
    minDailyHours: hardPrefs?.minDailyHours ?? 3,
    enforceConsecutiveClassRules: hardPrefs?.enforceConsecutiveClassRules ?? true,
    enforceIntensiveRules: hardPrefs?.enforceIntensiveRules ?? true,
    maxHoursPerIntensiveCourse: hardPrefs?.maxHoursPerIntensiveCourse ?? 4,
    solverTimeout: hardPrefs?.solverTimeout ?? 300,
    stopAtFirstSolution: hardPrefs?.stopAtFirstSolution ?? false
  });

  const [soft, setSoft] = useState({
    minimizeGaps: softPrefs?.minimizeGaps ?? true,
    gapPenalty: softPrefs?.gapPenalty ?? 40,
    earlyStart: softPrefs?.earlyStart ?? true,
    earlyStartPenalty: softPrefs?.earlyStartPenalty ?? 20,
    avoidStemLate: softPrefs?.avoidStemLate ?? true,
    stemLatePenalty: softPrefs?.stemLatePenalty ?? 35,
    maxTotalGapsLevel: softPrefs?.maxTotalGapsLevel ?? 'medium',
    maxTotalGapsPenalty: softPrefs?.maxTotalGapsPenalty ?? 60,
    minTotalGapsLevel: softPrefs?.minTotalGapsLevel ?? 'off',
    minTotalGapsPenalty: softPrefs?.minTotalGapsPenalty ?? 0,
    hourlyReserveLevel: softPrefs?.hourlyReserveLevel ?? 'off',
    hourlyReservePenalty: softPrefs?.hourlyReservePenalty ?? 0,
    minActiveDaysLevel: softPrefs?.minActiveDaysLevel ?? 'high',
    minActiveDaysPenalty: softPrefs?.minActiveDaysPenalty ?? 100,
    minDaysExemptTeacherIds: softPrefs?.minDaysExemptTeacherIds ?? []
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'teacher', 'pedagogic', 'solver'
  const [saved, setSaved] = useState(false);

  // --- MODEL C: ÖN-SİMÜLASYON VE İSTİSNA ÖĞRETMEN YÖNETİMİ ---
  const [showExemptModal, setShowExemptModal] = useState(false);
  const [exemptSearch, setExemptSearch] = useState('');
  const [showMinDaysExemptModal, setShowMinDaysExemptModal] = useState(false);
  const [minDaysExemptSearch, setMinDaysExemptSearch] = useState('');

  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const numPeriods = Number(settings?.periodsPerDay) || 7;
  const totalSlots = days.length * numPeriods;

  const teacherLoads = useMemo(() => {
    const loads: Record<string, number> = {};
    (classrooms || []).forEach(c => {
      (c.courses || []).forEach(co => {
        if (co.teacherId) {
          loads[co.teacherId] = (loads[co.teacherId] || 0) + (Number(co.hoursPerWeek) || 0);
        }
      });
    });
    return loads;
  }, [classrooms]);

  const teacherAnalysis = useMemo(() => {
    const targetMin = hard.minTotalGaps || 3;
    const userExemptIds = new Set(hard.gapExemptTeacherIds || []);

    const userExemptList: any[] = [];
    const capacityExemptList: any[] = [];
    const guaranteedList: any[] = [];

    (teachers || []).forEach(t => {
      const load = teacherLoads[t.id] || 0;
      if (load <= 0) return;
      const closedCount = Object.values(t.unavailable || {}).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      const openCount = totalSlots - closedCount;
      const margin = Math.max(0, openCount - load);

      const isUserExempt = userExemptIds.has(t.id) || Boolean(t.isExempt);
      const isCapacityExempt = !isUserExempt && margin < targetMin;

      const info = {
        ...t,
        load,
        openCount,
        closedCount,
        margin,
        isUserExempt,
        isCapacityExempt
      };

      if (isUserExempt) {
        userExemptList.push(info);
      } else if (isCapacityExempt) {
        capacityExemptList.push(info);
      } else {
        guaranteedList.push(info);
      }
    });

    return {
      userExemptList,
      capacityExemptList,
      guaranteedList
    };
  }, [teachers, teacherLoads, totalSlots, hard.minTotalGaps, hard.gapExemptTeacherIds]);

  // ⚖️ KATEGORİK ADALET MATRİSİ ANALİZİ (DERS YÜKÜ × BOŞ SLOT)
  const categoricalAnalysis = useMemo(() => {
    const userExemptIds = new Set(hard.gapExemptTeacherIds || []);
    const cat1: any[] = []; // M <= 2 -> 0-1s
    const cat2: any[] = []; // L < 25 & 3 <= M <= 5 -> 1-2s
    const cat3: any[] = []; // L >= 25 & M >= 3 -> 1-2s (M<=5) / 1-3s (M>=6)
    const cat4: any[] = []; // L < 25 & M >= 6 -> 1-3s
    const excluded: any[] = []; // İdareciler ve istisnalar

    (teachers || []).forEach(t => {
      const load = teacherLoads[t.id] || 0;
      if (load <= 0) return;
      const openDays = days.filter(d => (t.unavailable?.[d] || []).length < numPeriods).length;
      const closedCount = Object.values(t.unavailable || {}).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      const openCount = totalSlots - closedCount;
      const freeSlots = Math.max(0, openCount - load);
      const isPartTime = (openDays <= 2 && load < 17) || (Boolean(t.isExempt) && load < 17);
      const isExempt = Boolean(t.isExempt) || load <= 8 || isPartTime || Boolean(t.isAdministrator) || userExemptIds.has(t.id);

      const item = { ...t, load, openCount, freeSlots };
      if (t.isAdministrator || isExempt) {
        excluded.push(item);
      } else if (freeSlots <= 2) {
        cat1.push({ ...item, targetRange: `0–${Math.min(1, freeSlots)}s` });
      } else if (load < 25 && freeSlots <= 5) {
        cat2.push({ ...item, targetRange: '1–2s' });
      } else if (load >= 25) {
        cat3.push({ ...item, targetRange: freeSlots <= 5 ? '1–2s' : '1–3s' });
      } else {
        cat4.push({ ...item, targetRange: '1–3s' });
      }
    });

    return { cat1, cat2, cat3, cat4, excluded };
  }, [teachers, teacherLoads, days, numPeriods, totalSlots, hard.gapExemptTeacherIds]);

  const toggleTeacherGapExemption = (teacherId: string) => {
    const current = hard.gapExemptTeacherIds || [];
    const next = current.includes(teacherId)
      ? current.filter(id => id !== teacherId)
      : [...current, teacherId];
    setHard(prev => ({ ...prev, gapExemptTeacherIds: next }));
  };

  // 📅 HAFTALIK ASGARİ DERS GÜNÜ GÜVENCESİ (İSTİSNA DIŞINDA 3 GÜN VE ALTINDA DERS VERMEME) ANALİZİ
  const minActiveDaysAnalysis = useMemo(() => {
    const targetDays = hard.minActiveDays || 4;
    const userMinDaysExempt = new Set(hard.minDaysExemptTeacherIds || []);

    const guaranteed: any[] = [];
    const capacityExempt: any[] = [];
    const statusExempt: any[] = [];

    (teachers || []).forEach(t => {
      const load = teacherLoads[t.id] || 0;
      if (load <= 0) return;
      const openDays = days.filter(d => (t.unavailable?.[d] || []).length < numPeriods).length;
      const isPartTime = (openDays <= 2 && load < 17) || (Boolean(t.isExempt) && load < 17);
      const fDay = t.floatingConstraints?.freeDayPreference || 'none';
      const isStatusExempt =
        Boolean(t.isAdministrator) ||
        Boolean(t.isExempt) ||
        load <= 8 ||
        isPartTime ||
        fDay === 'floating_2_days' ||
        userMinDaysExempt.has(t.id);

      const maxPossibleDays = Math.min(openDays, Math.max(1, Math.floor(load / 2)));
      const item = { ...t, load, openDays, maxPossibleDays };

      if (isStatusExempt) {
        statusExempt.push(item);
      } else if (maxPossibleDays < targetDays) {
        capacityExempt.push(item);
      } else {
        guaranteed.push(item);
      }
    });

    return { guaranteed, capacityExempt, statusExempt };
  }, [teachers, teacherLoads, days, numPeriods, hard.minActiveDays, hard.minDaysExemptTeacherIds]);

  const toggleTeacherMinDaysExemption = (teacherId: string) => {
    const current = hard.minDaysExemptTeacherIds || [];
    const next = current.includes(teacherId)
      ? current.filter(id => id !== teacherId)
      : [...current, teacherId];
    setHard(prev => ({ ...prev, minDaysExemptTeacherIds: next }));
    setSoft(prev => ({ ...prev, minDaysExemptTeacherIds: next }));
  };

  const getMinActiveDaysLevel = () => {
    if (hard.enforceMinActiveDays === false || hard.minActiveDaysLevel === 'off' || (hard.minActiveDays ?? 4) <= 0) return 'off';
    return hard.minActiveDaysLevel || 'high';
  };

  const setMinActiveDaysLevel = (level: string) => {
    if (level === 'off') {
      setHard(prev => ({ ...prev, enforceMinActiveDays: false, minActiveDaysLevel: 'off', minActiveDaysPenalty: 0 }));
      setSoft(prev => ({ ...prev, minActiveDaysLevel: 'off', minActiveDaysPenalty: 0 }));
    } else if (level === 'low') {
      setHard(prev => ({ ...prev, enforceMinActiveDays: true, minActiveDays: prev.minActiveDays || 4, minActiveDaysLevel: 'low', minActiveDaysPenalty: 30 }));
      setSoft(prev => ({ ...prev, minActiveDaysLevel: 'low', minActiveDaysPenalty: 30 }));
    } else if (level === 'medium') {
      setHard(prev => ({ ...prev, enforceMinActiveDays: true, minActiveDays: prev.minActiveDays || 4, minActiveDaysLevel: 'medium', minActiveDaysPenalty: 80 }));
      setSoft(prev => ({ ...prev, minActiveDaysLevel: 'medium', minActiveDaysPenalty: 80 }));
    } else if (level === 'high') {
      setHard(prev => ({ ...prev, enforceMinActiveDays: true, minActiveDays: prev.minActiveDays || 4, minActiveDaysLevel: 'high', minActiveDaysPenalty: 1000 }));
      setSoft(prev => ({ ...prev, minActiveDaysLevel: 'high', minActiveDaysPenalty: 1000 }));
    }
  };

  // Haftalık toplam maksimum pencere seviyesi ve ceza puanı yönetimi
  const getMaxTotalGapsLevel = () => {
    if (hard.enforceMaxTotalGaps === false || hard.maxTotalGapsLevel === 'off') return 'off';
    return hard.maxTotalGapsLevel || 'medium';
  };

  const setMaxTotalGapsLevel = (level: string) => {
    if (level === 'off') {
      setHard((prev) => ({ ...prev, enforceMaxTotalGaps: false, maxTotalGapsLevel: 'off', maxTotalGapsPenalty: 0 }));
      setSoft((prev) => ({ ...prev, maxTotalGapsLevel: 'off', maxTotalGapsPenalty: 0 }));
    } else if (level === 'low') {
      setHard((prev) => ({ ...prev, enforceMaxTotalGaps: true, maxTotalGapsLevel: 'low', maxTotalGapsPenalty: 20 }));
      setSoft((prev) => ({ ...prev, maxTotalGapsLevel: 'low', maxTotalGapsPenalty: 20 }));
    } else if (level === 'medium') {
      setHard((prev) => ({ ...prev, enforceMaxTotalGaps: true, maxTotalGapsLevel: 'medium', maxTotalGapsPenalty: 60 }));
      setSoft((prev) => ({ ...prev, maxTotalGapsLevel: 'medium', maxTotalGapsPenalty: 60 }));
    } else if (level === 'high') {
      setHard((prev) => ({ ...prev, enforceMaxTotalGaps: true, maxTotalGapsLevel: 'high', maxTotalGapsPenalty: 1000 }));
      setSoft((prev) => ({ ...prev, maxTotalGapsLevel: 'high', maxTotalGapsPenalty: 1000 }));
    }
  };

  // Haftalık toplam minimum pencere seviyesi ve ceza puanı yönetimi
  const getMinTotalGapsLevel = () => {
    return hard.minTotalGapsLevel || 'off';
  };

  const setMinTotalGapsLevel = (level: string) => {
    if (level === 'off') {
      setHard((prev) => ({ ...prev, enforceMinTotalGaps: false, minTotalGapsLevel: 'off', minTotalGapsPenalty: 0 }));
      setSoft((prev) => ({ ...prev, minTotalGapsLevel: 'off', minTotalGapsPenalty: 0 }));
    } else if (level === 'low') {
      setHard((prev) => ({ ...prev, enforceMinTotalGaps: true, minTotalGapsLevel: 'low', minTotalGapsPenalty: 20, minTotalGaps: prev.minTotalGaps || 1 }));
      setSoft((prev) => ({ ...prev, minTotalGapsLevel: 'low', minTotalGapsPenalty: 20 }));
    } else if (level === 'medium') {
      setHard((prev) => ({ ...prev, enforceMinTotalGaps: true, minTotalGapsLevel: 'medium', minTotalGapsPenalty: 60, minTotalGaps: prev.minTotalGaps || 1 }));
      setSoft((prev) => ({ ...prev, minTotalGapsLevel: 'medium', minTotalGapsPenalty: 60 }));
    } else if (level === 'high') {
      setHard((prev) => ({ ...prev, enforceMinTotalGaps: true, minTotalGapsLevel: 'high', minTotalGapsPenalty: 1000, minTotalGaps: prev.minTotalGaps || 1 }));
      setSoft((prev) => ({ ...prev, minTotalGapsLevel: 'high', minTotalGapsPenalty: 1000 }));
    }
  };

  // Saatlik yedek / nöbetçi öğretmen güvencesi (ilk ve son saat hariç ara saatler: 2..P-1)
  const getHourlyReserveLevel = () => {
    if (!hard.enforceHourlyReserve || hard.hourlyReserveLevel === 'off') return 'off';
    return hard.hourlyReserveLevel || 'off';
  };

  const setHourlyReserveLevel = (level: string) => {
    if (level === 'off') {
      setHard((prev) => ({ ...prev, enforceHourlyReserve: false, hourlyReserveLevel: 'off', hourlyReservePenalty: 0 }));
      setSoft((prev) => ({ ...prev, hourlyReserveLevel: 'off', hourlyReservePenalty: 0 }));
    } else if (level === 'low') {
      setHard((prev) => ({ ...prev, enforceHourlyReserve: true, hourlyReserveLevel: 'low', hourlyReservePenalty: 20, minHourlyReserveTeachers: prev.minHourlyReserveTeachers || 1 }));
      setSoft((prev) => ({ ...prev, hourlyReserveLevel: 'low', hourlyReservePenalty: 20 }));
    } else if (level === 'medium') {
      setHard((prev) => ({ ...prev, enforceHourlyReserve: true, hourlyReserveLevel: 'medium', hourlyReservePenalty: 60, minHourlyReserveTeachers: prev.minHourlyReserveTeachers || 1 }));
      setSoft((prev) => ({ ...prev, hourlyReserveLevel: 'medium', hourlyReservePenalty: 60 }));
    } else if (level === 'high') {
      setHard((prev) => ({ ...prev, enforceHourlyReserve: true, hourlyReserveLevel: 'high', hourlyReservePenalty: 1000, minHourlyReserveTeachers: prev.minHourlyReserveTeachers || 1 }));
      setSoft((prev) => ({ ...prev, hourlyReserveLevel: 'high', hourlyReservePenalty: 1000 }));
    }
  };

  // Ceza katsayılarını 4 kademeli sezgisel seviyeye çevirici
  const getEarlyStartLevel = () => {
    if (!soft.earlyStart || soft.earlyStartPenalty === 0) return 'off';
    if (soft.earlyStartPenalty <= 15) return 'low';
    if (soft.earlyStartPenalty <= 30) return 'medium';
    return 'high';
  };

  const setEarlyStartLevel = (level) => {
    if (level === 'off') {
      setSoft({ ...soft, earlyStart: false, earlyStartPenalty: 0 });
    } else if (level === 'low') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 10 });
    } else if (level === 'medium') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 20 });
    } else if (level === 'high') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 50 });
    }
  };

  const getStemLateLevel = () => {
    if (!soft.avoidStemLate || soft.stemLatePenalty === 0) return 'off';
    if (soft.stemLatePenalty <= 20) return 'low';
    if (soft.stemLatePenalty <= 45) return 'medium';
    return 'high';
  };

  const setStemLateLevel = (level) => {
    if (level === 'off') {
      setSoft({ ...soft, avoidStemLate: false, stemLatePenalty: 0 });
    } else if (level === 'low') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 15 });
    } else if (level === 'medium') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 35 });
    } else if (level === 'high') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 70 });
    }
  };

  const handleSave = () => {
    setHardPrefs(hard);
    updateSoftPrefs(soft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultHard = {
      enforceMaxTotalGaps: true,
      maxTotalGaps: 4,
      maxTotalGapsLevel: 'medium' as const,
      maxTotalGapsPenalty: 60,
      enforceMinTotalGaps: false,
      minTotalGaps: 0,
      minTotalGapsLevel: 'off' as const,
      minTotalGapsPenalty: 0,
      gapExemptTeacherIds: [],
      enforceHourlyReserve: false,
      minHourlyReserveTeachers: 1,
      hourlyReserveLevel: 'off' as const,
      hourlyReservePenalty: 0,
      enforceCategoricalFairness: true,
      enforceMinActiveDays: true,
      minActiveDays: 4,
      minActiveDaysLevel: 'high' as const,
      minActiveDaysPenalty: 100,
      minDaysExemptTeacherIds: [],
      enforceDailyBalance: true,
      minDailyHours: 3,
      enforceConsecutiveClassRules: true,
      enforceIntensiveRules: true,
      maxHoursPerIntensiveCourse: 4,
      solverTimeout: 300,
      stopAtFirstSolution: false
    };
    const defaultSoft = {
      minimizeGaps: true,
      gapPenalty: 40,
      earlyStart: true,
      earlyStartPenalty: 20,
      avoidStemLate: true,
      stemLatePenalty: 35,
      maxTotalGapsLevel: 'medium' as const,
      maxTotalGapsPenalty: 60,
      minTotalGapsLevel: 'off' as const,
      minTotalGapsPenalty: 0,
      hourlyReserveLevel: 'off' as const,
      hourlyReservePenalty: 0,
      minActiveDaysLevel: 'high' as const,
      minActiveDaysPenalty: 100,
      minDaysExemptTeacherIds: []
    };
    setHard(defaultHard);
    setSoft(defaultSoft);
    setHardPrefs(defaultHard);
    updateSoftPrefs(defaultSoft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 4 Kademeli Sezgisel Rozet Bileşeni
  const PriorityBadges = ({ currentLevel, onChange, labels = {} as any }: any) => {
    const levels = [
      { id: 'off', label: labels.off || 'Kapalı' },
      { id: 'low', label: labels.low || 'Düşük' },
      { id: 'medium', label: labels.medium || 'Dengeli' },
      { id: 'high', label: labels.high || 'Tavizsiz' }
    ];

    const getColors = (id, active) => {
      if (!active) return 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent';
      switch (id) {
        case 'off': return 'bg-gray-800 text-white border-gray-900 shadow-xs';
        case 'low': return 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs font-bold';
        case 'medium': return 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold';
        case 'high': return 'bg-purple-700 text-white border-purple-800 shadow-md font-extrabold';
        default: return '';
      }
    };

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {levels.map((lvl) => {
          const active = currentLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onChange(lvl.id)}
              className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${getColors(lvl.id, active)}`}
            >
              <div className="font-bold">{lvl.label}</div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ÜST BAŞLIK VE KONTROLLER */}
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            type="button"
            onClick={() => navigate('/generate')} 
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors mb-1"
          >
            ← Dağıtım Motoruna Dön
          </button>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sliders className="text-blue-600" size={24} /> 
            Kural ve Öncelikler
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={handleResetDefaults} 
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Varsayılanlar</span>
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {saved ? <CheckCircle size={16} className="text-green-300 animate-pulse" /> : <Save size={16} />}
            <span>{saved ? 'Kaydedildi' : 'Kuralları Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* BAŞARI MESAJI BİLDİRİMİ */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <span>Kurallar başarıyla kaydedildi.</span>
        </div>
      )}

      {/* 📊 HAFTALIK OKUL KAPASİTE & DARBOĞAZ ISI HARİTASI */}
      <CapacityHeatmap 
        teachers={teachers} 
        classrooms={classrooms} 
        settings={settings} 
      />

      {/* KATEGORİ FİLTRELEME SEKMELERİ */}
      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Tüm Kurallar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Öğretmen Konforu & Boşluk
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pedagogic')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'pedagogic' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pedagojik Standartlar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solver')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'solver' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Motor Süresi & Çözücü
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ÖĞRETMEN KONFORU & BOŞLUK KURALLARI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'teacher') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>1. Öğretmen Konforu ve Boşluk (Pencere) Kuralları</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* KURAL 1.1: HAFTALIK TOPLAM MAKSİMUM PENCERE SINIRI & ÖNCELİK KADEMESİ */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-blue-600 shrink-0" />
                    Öğretmen Haftalık Toplam Maksimum Pencere (Boşluk) Sınırı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Bir öğretmenin hafta genelinde (tüm günlerin toplamında) sahip olabileceği azami boş ders saati sınırıdır.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">İzin Verilen Haftalık Azami Pencere:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 2, 4, 6, 8].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const newHard = { ...hard, maxTotalGaps: val };
                          if ((newHard.minTotalGaps ?? 0) > val) {
                            newHard.minTotalGaps = val;
                          }
                          setHard(newHard);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          hard.maxTotalGaps === val 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val === 0 ? '0 Saat (Sıfır Boşluk)' : `${val} Saat`} {val === 4 && '(Önerilen)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-gray-700 block">Kural Önceliği & Ceza Seviyesi:</label>
                  <PriorityBadges
                    currentLevel={getMaxTotalGapsLevel()}
                    onChange={setMaxTotalGapsLevel}
                    labels={{
                      off: '⚪ Kapalı',
                      low: '🟡 Düşük Öncelik',
                      medium: '🔵 Dengeli (Önerilen)',
                      high: '🟣 Tavizsiz Sınır'
                    }}
                  />
                </div>

                <div className="text-xs pt-1">
                  {getMaxTotalGapsLevel() === 'off' ? (
                    <div className="p-3 bg-amber-50/60 rounded-xl text-amber-900 font-medium">
                      ⚠️ Bu sınır devre dışı. Motor haftalık toplam boşlukları sınırlandırmaz; dersler günlere serbestçe yayılabilir.
                    </div>
                  ) : getMaxTotalGapsLevel() === 'high' ? (
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-950 font-bold border border-purple-200 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                      <span>Tavizsiz Sert Kısıt: Çözücü hiçbir öğretmene hafta boyunca toplam {hard.maxTotalGaps} saatten fazla pencere veremez; program bu sınır korunarak üretilir.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      💡 Dengeli modda motor öğretmenlerin haftalık toplam boşluklarını {hard.maxTotalGaps} saat altında tutmaya çalışır; kilitlenme ve kapalı saat darboğazlarında hafif esnemeye izin verir.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KURAL 1.2: HAFTALIK TOPLAM ASGARİ (MİNİMUM) BOŞ DERS & PROJE SINIRI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Coffee size={16} className="text-blue-600 shrink-0" />
                    Öğretmen Haftalık Asgari Boş Ders & Proje Saati Sınırı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Öğretmenlerin okulda proje, zümre, veli görüşmesi ve ders hazırlığı yapabilmeleri için hafta genelinde en az belirli bir toplam boş saate (pencereye) sahip olmasını sağlar.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">İstenen Haftalık Asgari Boşluk:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const newHard = { ...hard, minTotalGaps: val };
                          if (val > (hard.maxTotalGaps ?? 4)) {
                            newHard.maxTotalGaps = Math.max(val, 6);
                          }
                          if (val > 0 && getMinTotalGapsLevel() === 'off') {
                            newHard.minTotalGapsLevel = 'medium';
                            newHard.minTotalGapsPenalty = 60;
                            newHard.enforceMinTotalGaps = true;
                          } else if (val === 0) {
                            newHard.minTotalGapsLevel = 'off';
                            newHard.minTotalGapsPenalty = 0;
                            newHard.enforceMinTotalGaps = false;
                          }
                          setHard(newHard);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          (hard.minTotalGaps ?? 0) === val 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val === 0 ? '0 Saat (Boşluksuz Serbest)' : `${val} Saat`} {val === 0 && '(Standart)'} {val === 3 && '(Önerilen Proje/Dinlenme)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-gray-700 block">Kural Önceliği & Ceza Seviyesi:</label>
                  <PriorityBadges
                    currentLevel={getMinTotalGapsLevel()}
                    onChange={setMinTotalGapsLevel}
                    labels={{
                      off: '⚪ Kapalı (Boşluksuz Serbest)',
                      low: '🟡 Düşük Öncelik',
                      medium: '🔵 Dengeli',
                      high: '🟣 Tavizsiz Asgari Boşluk'
                    }}
                  />
                </div>

                <div className="text-xs pt-1">
                  {getMinTotalGapsLevel() === 'off' ? (
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-600 font-medium">
                      ✓ Kapalı: Öğretmenin haftalık tüm dersleri tamamen bitişik yerleşebilir (haftalık asgari boşluk zorunluluğu aranmaz).
                    </div>
                  ) : getMinTotalGapsLevel() === 'high' ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-purple-50 rounded-xl text-purple-950 font-bold border border-purple-200 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                        <span>Tavizsiz Asgari Boşluk: Açık saat kapasitesi uygun olan öğretmenlere hafta genelinde KESİNLİKLE en az {hard.minTotalGaps || 3} saat proje/dinlenme boşluğu garanti edilir.</span>
                      </div>
                      <div className="p-2.5 bg-blue-50/70 rounded-xl text-blue-900 text-[11px] border border-blue-100 flex items-center gap-2">
                        <span>💡 <strong>Akıllı Kapasite Koruması:</strong> Ders yükü okulda bulunduğu açık saatleri dolduran öğretmenler (ör. 21 saat dersi olup 2 gün kapalı olanlar), program kilitlenmesini önlemek için bu kuraldan makul muaf tutulur; diğer tüm öğretmenler tavizsiz olarak bu boşluğa sahip olur.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      💡 Dengeli modda motor, haftalık ders yükü olan öğretmenlere hafta boyunca en az {hard.minTotalGaps || 1} saat dinlenme/proje boşluğu bırakmayı hedefler; kilitlenme durumunda esnemeye izin verir.
                    </div>
                  )}
                </div>

                {/* 🛡️ MODEL C: ÖN-SİMÜLASYON & TAVİZSİZ GÜVENCESİ PANELİ */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Zap size={14} className="text-amber-500 fill-amber-500" />
                      Model C: Ön-Simülasyon & Sıfır Taviz Güvencesi
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExemptModal(!showExemptModal)}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Baby size={13} className="text-amber-700" />
                      <span>İstisna / Süt İzni Öğretmen Yönetimi ({teacherAnalysis.userExemptList.length} Seçili)</span>
                      {showExemptModal ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* 3 Kademeli Canlı Gösterge Kartları */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          Tavizsiz Garanti
                        </span>
                        <span className="text-sm font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                          {teacherAnalysis.guaranteedList.length} Öğretmen
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-800/80 mt-1">
                        Açık saat kapasitesi uygun; kural %100 sert kısıtla kesin korunur (0 esnetme).
                      </p>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span className="flex items-center gap-1">
                          <Baby size={14} className="text-amber-600" />
                          Kullanıcı İstisnası
                        </span>
                        <span className="text-sm font-black px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">
                          {teacherAnalysis.userExemptList.length} Öğretmen
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800/80 mt-1">
                        Süt izni / idareci / özel durum; esnek yerleşimle program kilitlenmez.
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="flex items-center gap-1">
                          <ShieldAlert size={14} className="text-slate-500" />
                          Kapasite Muafiyeti
                        </span>
                        <span className="text-sm font-black px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                          {teacherAnalysis.capacityExemptList.length} Öğretmen
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Ders yükü açık saatleri dolduranlar ({teacherAnalysis.capacityExemptList.map(t => t.name).join(', ') || 'Yok'}); otomatik muaf.
                      </p>
                    </div>
                  </div>

                  {/* İstisna Öğretmen Seçim Listesi (Açılır Panel) */}
                  {showExemptModal && (
                    <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                          <Baby size={13} className="text-amber-700 shrink-0" />
                          <span>Süt İzni, Nöbetçi İdareci veya Özel Durumu Olan Öğretmenleri İşaretleyin:</span>
                        </div>
                        <div className="relative w-44">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={exemptSearch}
                            onChange={(e) => setExemptSearch(e.target.value)}
                            placeholder="Öğretmen ara..."
                            className="w-full pl-7 pr-2 py-1 text-xs border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {(teachers || [])
                          .filter(t => !exemptSearch || t.name.toLowerCase().includes(exemptSearch.toLowerCase()) || t.branch?.toLowerCase().includes(exemptSearch.toLowerCase()))
                          .map(t => {
                            const isSelected = (hard.gapExemptTeacherIds || []).includes(t.id);
                            const load = teacherLoads[t.id] || 0;
                            const closedCount = Object.values(t.unavailable || {}).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
                            const openCount = totalSlots - closedCount;
                            const margin = Math.max(0, openCount - load);

                            return (
                              <div
                                key={t.id}
                                onClick={() => toggleTeacherGapExemption(t.id)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-amber-100/80 border-amber-300 font-bold text-amber-950'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by div
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="truncate">{t.name}</span>
                                  <span className="text-[10px] text-gray-400">({t.branch || 'Genel'})</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                                  <span>Yük: {load}s</span>
                                  <span>Açık: {openCount}s</span>
                                  <span className={`font-bold ${margin < (hard.minTotalGaps || 3) ? 'text-rose-600' : 'text-emerald-700'}`}>Boşluk: {margin}s</span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[9px]">
                                      İstisna
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Seçili İstisna Rozetleri */}
                      {(hard.gapExemptTeacherIds || []).length > 0 && (
                        <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-900">Seçilen İstisnalar:</span>
                          {(hard.gapExemptTeacherIds || []).map(id => {
                            const tObj = (teachers || []).find(t => t.id === id);
                            if (!tObj) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200/90 text-amber-950 rounded-md text-[10px] font-bold"
                              >
                                <span>{tObj.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTeacherGapExemption(id);
                                  }}
                                  className="hover:text-red-700 cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KURAL 1.3: SAATLİK YEDEK / NÖBETÇİ ÖĞRETMEN GÜVENCESİ (İLK VE SON SAAT HARİÇ ARA SAATLER) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                    Saatlik Yedek / Nöbetçi Öğretmen Güvencesi (2. – {Math.max(2, numPeriods - 1)}. Saatler)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Okulun ilk (1.) ve son ({numPeriods}.) ders saati hariç tüm ara ders saatlerinde, <strong>idareciler ve istisna öğretmenler sayılmadan</strong> en az belirli sayıda tam zamanlı öğretmenin okulda boş dersinin (penceresinin) olmasını garanti eder.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Her Ara Saatte (2..{Math.max(2, numPeriods - 1)}) Boş Olacak Asgari Öğretmen:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((val) => {
                      const activeVal = getHourlyReserveLevel() === 'off' ? 0 : (hard.minHourlyReserveTeachers ?? 1);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            if (val === 0) {
                              setHourlyReserveLevel('off');
                              setHard(prev => ({ ...prev, enforceHourlyReserve: false, minHourlyReserveTeachers: 0, hourlyReserveLevel: 'off', hourlyReservePenalty: 0 }));
                            } else {
                              const currentLvl = getHourlyReserveLevel();
                              const nextLvl = currentLvl === 'off' ? 'high' : currentLvl;
                              const nextPen = nextLvl === 'high' ? 1000 : nextLvl === 'medium' ? 60 : 20;
                              setHard(prev => ({
                                ...prev,
                                enforceHourlyReserve: true,
                                minHourlyReserveTeachers: val,
                                hourlyReserveLevel: nextLvl,
                                hourlyReservePenalty: nextPen
                              }));
                              setSoft(prev => ({
                                ...prev,
                                hourlyReserveLevel: nextLvl,
                                hourlyReservePenalty: nextPen
                              }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                            activeVal === val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {val === 0 ? 'Kapalı (0)' : `En Az ${val} Öğretmen`} {val === 1 && '(Önerilen)'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-gray-700 block">Kural Önceliği & Ceza Seviyesi:</label>
                  <PriorityBadges
                    currentLevel={getHourlyReserveLevel()}
                    onChange={setHourlyReserveLevel}
                    labels={{
                      off: '⚪ Kapalı',
                      low: '🟡 Düşük Öncelik',
                      medium: '🔵 Dengeli',
                      high: '🟣 Tavizsiz Güvence'
                    }}
                  />
                </div>

                <div className="text-xs pt-1">
                  {getHourlyReserveLevel() === 'off' ? (
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-600 font-medium">
                      ✓ Kapalı: Ara saatlerde (2. – {Math.max(2, numPeriods - 1)}. saatler) zorunlu yedek/boş öğretmen şartı aranmaz.
                    </div>
                  ) : getHourlyReserveLevel() === 'high' ? (
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-950 font-bold border border-purple-200 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                      <span>
                        Tavizsiz Güvence: Her gün 2. saatten {Math.max(2, numPeriods - 1)}. saate kadar tüm ara derslerde (idareciler ve istisnalar hariç) en az {hard.minHourlyReserveTeachers || 1} tam zamanlı öğretmenin okulda boş dersinin (penceresinin) olması garanti edilir.
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      💡 Dengeli modda motor, her gün 2. – {Math.max(2, numPeriods - 1)}. saatlerde en az {hard.minHourlyReserveTeachers || 1} öğretmeni öğretmenler odasında boşta (pencerede) tutmayı hedefler; kapalı saat darboğazlarında esnemeye izin verir.
                    </div>
                  )}
                </div>

                {/* ⚖️ OTOMATİK KATEGORİK ADALET MATRİSİ (DERS YÜKÜ × BOŞ SLOT) */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Scale size={14} className="text-blue-600" />
                        Otomatik Kategorik Adalet Matrisi (Ders Yükü × Boş Slot)
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Boşta öğretmen olma yükünün hep aynı öğretmenlere binmesini önler; saatlerini kapatmayan öğretmenleri korur.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={hard.enforceCategoricalFairness !== false}
                        onChange={(e) => setHard(prev => ({ ...prev, enforceCategoricalFairness: e.target.checked }))}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Kategorik Adil Dağılım Aktif</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* Kategori 1 */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>1. Dar Marj (≤2 Boş)</span>
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[11px] font-black">0–1 Saat</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Boş slotu 0–2 olanlar ({categoricalAnalysis.cat1.length} kişi). Kapasite korumalı.
                      </p>
                      {categoricalAnalysis.cat1.length > 0 && (
                        <div className="text-[10px] text-slate-700 font-medium truncate" title={categoricalAnalysis.cat1.map(t => `${t.name} (${t.load}s / ${t.freeSlots} boş)`).join(', ')}>
                          Örn: {categoricalAnalysis.cat1.slice(0, 2).map(t => `${t.name.split(' ')[0]} (${t.load}s/${t.freeSlots}b)`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Kategori 2 */}
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>2. Sınırlı Marj (3–5 Boş)</span>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[11px] font-black">1–2 Saat</span>
                      </div>
                      <p className="text-[10px] text-amber-800">
                        Yükü &lt;25s, boş slotu 3–5 olanlar ({categoricalAnalysis.cat2.length} kişi). 0 pencereyle kaçamaz.
                      </p>
                      {categoricalAnalysis.cat2.length > 0 && (
                        <div className="text-[10px] text-amber-900 font-medium truncate" title={categoricalAnalysis.cat2.map(t => `${t.name} (${t.load}s / ${t.freeSlots} boş)`).join(', ')}>
                          Örn: {categoricalAnalysis.cat2.slice(0, 2).map(t => `${t.name.split(' ')[0]} (${t.load}s/${t.freeSlots}b)`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Kategori 3 */}
                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-purple-950">
                        <span>3. Ağır Yük (25+ Saat)</span>
                        <span className="px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded text-[11px] font-black">1–2 / 1–3s</span>
                      </div>
                      <p className="text-[10px] text-purple-800">
                        25+ saat dersi olanlar ({categoricalAnalysis.cat3.length} kişi). 3–5 boş: 1–2s, 6+ boş: 1–3s.
                      </p>
                      {categoricalAnalysis.cat3.length > 0 && (
                        <div className="text-[10px] text-purple-900 font-medium truncate" title={categoricalAnalysis.cat3.map(t => `${t.name} (${t.load}s / ${t.freeSlots} boş)`).join(', ')}>
                          Örn: {categoricalAnalysis.cat3.slice(0, 2).map(t => `${t.name.split(' ')[0]} (${t.load}s/${t.freeSlots}b)`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Kategori 4 */}
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span>4. Geniş Marj (6+ Boş)</span>
                        <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[11px] font-black">1–3 Saat</span>
                      </div>
                      <p className="text-[10px] text-emerald-800">
                        Yükü &lt;25s, boş slotu 6+ olanlar ({categoricalAnalysis.cat4.length} kişi). İyi niyet korumalı (≤3s).
                      </p>
                      {categoricalAnalysis.cat4.length > 0 && (
                        <div className="text-[10px] text-emerald-900 font-medium truncate" title={categoricalAnalysis.cat4.map(t => `${t.name} (${t.load}s / ${t.freeSlots} boş)`).join(', ')}>
                          Örn: {categoricalAnalysis.cat4.slice(0, 2).map(t => `${t.name.split(' ')[0]} (${t.load}s/${t.freeSlots}b)`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KURAL 1.4: GÜNLÜK DERS DAĞILIM DENGESİ & HAFTALIK ASGARİ DERS GÜNÜ GÜVENCESİ */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Scale size={16} className="text-blue-600 shrink-0" />
                    Günlük Ders Dağılım Dengesi & Haftalık Asgari Ders Günü Güvencesi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Öğretmenlerin ders yükünü aktif günlere adil dağıtır; istisnalar dışında hiçbir öğretmene haftada 3 gün ve altında ders verilmemesini (en az 4 gün aktif ders) garanti eder.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceDailyBalance} 
                    onChange={(e) => setHard({ ...hard, enforceDailyBalance: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-5">
                {/* BÖLÜM A: HAFTALIK ASGARİ AKTİF DERS GÜNÜ (3 GÜN VE ALTINDA DERS VERMEME) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                      Haftalık Asgari Aktif Ders Günü Sınırı (İstisna Dışında 3 Gün ve Altı Yasak):
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { val: 0, label: 'Kapalı (Serbest)' },
                      { val: 3, label: 'En Az 3 Gün (En Fazla 2 Boş Gün)' },
                      { val: 4, label: 'En Az 4 Gün (3 Gün ve Altı Yasak - Önerilen)' },
                      { val: 5, label: '5 Gün (Boş Günsüz)' }
                    ].map(opt => {
                      const activeVal = getMinActiveDaysLevel() === 'off' ? 0 : (hard.minActiveDays ?? 4);
                      const isSelected = activeVal === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            if (opt.val === 0) {
                              setMinActiveDaysLevel('off');
                              setHard(prev => ({ ...prev, enforceMinActiveDays: false, minActiveDays: 0, minActiveDaysLevel: 'off', minActiveDaysPenalty: 0 }));
                            } else {
                              const currLvl = getMinActiveDaysLevel();
                              const nextLvl = currLvl === 'off' ? 'high' : currLvl;
                              const nextPen = nextLvl === 'high' ? 1000 : nextLvl === 'medium' ? 80 : 30;
                              setHard(prev => ({
                                ...prev,
                                enforceMinActiveDays: true,
                                minActiveDays: opt.val,
                                minActiveDaysLevel: nextLvl,
                                minActiveDaysPenalty: nextPen
                              }));
                              setSoft(prev => ({
                                ...prev,
                                minActiveDaysLevel: nextLvl,
                                minActiveDaysPenalty: nextPen
                              }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-gray-700 block">Asgari Ders Günü Kural Önceliği:</label>
                    <PriorityBadges
                      currentLevel={getMinActiveDaysLevel()}
                      onChange={setMinActiveDaysLevel}
                      labels={{
                        off: '⚪ Kapalı',
                        low: '🟡 Düşük Öncelik',
                        medium: '🔵 Dengeli',
                        high: '🟣 Tavizsiz (3 Gün ve Altı Yasak)'
                      }}
                    />
                  </div>

                  {/* 3 Kademeli Asgari Gün Muafiyet & Güvence Özeti */}
                  {getMinActiveDaysLevel() !== 'off' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <div className="flex items-center justify-between font-bold text-emerald-950">
                            <span>En Az {hard.minActiveDays || 4} Gün Güvencesi</span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black">
                              {minActiveDaysAnalysis.guaranteed.length} Öğretmen
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-800 mt-1">
                            Açık günü ≥{hard.minActiveDays || 4} olan standart öğretmenler; 3 gün ve altına sıkıştırılmaz.
                          </p>
                        </div>

                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                          <div className="flex items-center justify-between font-bold text-amber-950">
                            <span>Kapasite Muafiyeti (≤3 Açık Gün)</span>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-black">
                              {minActiveDaysAnalysis.capacityExempt.length} Öğretmen
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800 mt-1">
                            Takviminde ≤3 açık günü olanlar ({minActiveDaysAnalysis.capacityExempt.map(t => `${t.name} (${t.openDays}g)`).join(', ') || 'Yok'}) otomatik korunur.
                          </p>
                        </div>

                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>İstisna / İdareci / Özel Muaf</span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-black">
                              {minActiveDaysAnalysis.statusExempt.length} Öğretmen
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">
                            İdareci, istisna (&lt;17s / ≤8s), 2 gün kayan boş gün veya özel muaf seçilenler.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-gray-500">
                          💡 Özel izinle 3 gün (veya daha az) derse gelmesine izin verilen öğretmenleri istisna listesine ekleyebilirsiniz.
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMinDaysExemptModal(!showMinDaysExemptModal)}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>3 Gün Ders İstisnası Tanımla ({(hard.minDaysExemptTeacherIds || []).length} Özel Seçili)</span>
                          {showMinDaysExemptModal ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {showMinDaysExemptModal && (
                        <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-indigo-950">
                              3 Gün veya Altında Ders Verilmesine İzin Verilen (Muaf) Öğretmenleri Seçin:
                            </span>
                            <div className="relative w-44">
                              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={minDaysExemptSearch}
                                onChange={(e) => setMinDaysExemptSearch(e.target.value)}
                                placeholder="Öğretmen ara..."
                                className="w-full pl-7 pr-2 py-1 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {(teachers || [])
                              .filter(t => !minDaysExemptSearch || t.name.toLowerCase().includes(minDaysExemptSearch.toLowerCase()) || t.branch?.toLowerCase().includes(minDaysExemptSearch.toLowerCase()))
                              .map(t => {
                                const isSelected = (hard.minDaysExemptTeacherIds || []).includes(t.id);
                                const load = teacherLoads[t.id] || 0;
                                const openDays = days.filter(d => (t.unavailable?.[d] || []).length < numPeriods).length;
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => toggleTeacherMinDaysExemption(t.id)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-indigo-100/80 border-indigo-300 font-bold text-indigo-950'
                                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="truncate">{t.name}</span>
                                      <span className="text-[10px] text-gray-400">({t.branch || 'Genel'})</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                                      <span>Yük: {load}s</span>
                                      <span>Açık Gün: {openDays}g</span>
                                      {isSelected && (
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900 font-bold text-[9px]">
                                          3 Gün Muaf
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BÖLÜM B: AKTİF GÜNDE MİNİMUM DERS SAATİ */}
                {hard.enforceDailyBalance ? (
                  <div className="pt-3 border-t border-gray-100 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Dersli Günde Minimum Ders Saati:</label>
                      <select 
                        value={hard.minDailyHours} 
                        onChange={(e) => setHard({ ...hard, minDailyHours: Number(e.target.value) })}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value={2}>En Az 2 Saat</option>
                        <option value={3}>En Az 3 Saat (Önerilen - Standart)</option>
                        <option value={4}>En Az 4 Saat</option>
                      </select>
                      <span className="text-[10px] text-gray-400 block">
                        Öğretmenin sadece 1 saat ders için okula gelmesini önler. Günlük tavan veya fark sınırları kaldırılmıştır.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/60 text-amber-900 text-xs font-medium rounded-xl">
                    ⚠️ Günlük asgari ders saati dengesi devre dışı.
                  </div>
                )}
              </div>
            </div>

            {/* KURAL 1.4: GÜNE ERKEN BAŞLAMA EĞİLİMİ (SEZGİSEL 4 KADEME) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sun size={16} className="text-amber-500 shrink-0" />
                  Güne Erken Başlama Eğilimi (Sabahçılık Önceliği)
                </h3>
                <p className="text-xs text-gray-500">
                  Öğretmenin günün ilk saatlerinde boş kalıp öğleden sonra geç saatlere kalmasını önler; dersleri sabaha çeker.
                </p>
              </div>

              <PriorityBadges
                currentLevel={getEarlyStartLevel()}
                onChange={setEarlyStartLevel}
                labels={{
                  off: '⚪ Kapalı',
                  low: '🟡 Düşük Öncelik',
                  medium: '🔵 Dengeli (Önerilen)',
                  high: '🟣 Tavizsiz Erken Başlama'
                }}
              />
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PEDAGOJİK VE AKADEMİK STANDARTLAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'pedagogic') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>2. Pedagojik ve Akademik Standartlar</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* KURAL 2.1: SAYISAL DERSLERİ ERKEN SAATE KOY (SEZGİSEL 4 KADEME) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-600 shrink-0" />
                  Sayısal Dersleri Erken Saate Yerleştirme (Zihinsel Odak)
                </h3>
                <p className="text-xs text-gray-500">
                  Matematik, Fizik, Kimya gibi zihinsel odak gerektiren derslerin günün son saatlerine (7. ve 8. saat) düşmesini engeller.
                </p>
              </div>

              <PriorityBadges
                currentLevel={getStemLateLevel()}
                onChange={setStemLateLevel}
                labels={{
                  off: '⚪ Kapalı',
                  low: '🟡 Düşük Öncelik',
                  medium: '🔵 Dengeli (Önerilen)',
                  high: '🟣 Tavizsiz Sabah Tercihi'
                }}
              />
            </div>

            {/* KURAL 2.2: BLOK DERS BİTİŞİKLİK KURALI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-purple-600 shrink-0" />
                    Öğretmen - Sınıf Blok Ders Bitişiklik Kuralı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Aynı öğretmenin aynı sınıfa aynı gün girdiği birden fazla saat aralıksız bitişik (blok) ders olarak planlanır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceConsecutiveClassRules} 
                    onChange={(e) => setHard({ ...hard, enforceConsecutiveClassRules: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed">
                {hard.enforceConsecutiveClassRules ? (
                  <span className="text-purple-900 font-medium">
                    ✓ Aktif: Örneğin 2 saatlik Kimya dersi 2. ve 5. saate ayrı ayrı konulamaz; kesinlikle 1-2 veya 3-4 gibi blok şeklinde ardışık yerleşir.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    ⚠️ Devre Dışı: Aynı gün aynı sınıfa olan dersler gün içine bölük pörçük dağılabilir.
                  </span>
                )}
              </div>
            </div>

            {/* KURAL 2.3: YOĞUN DERS GÜNLÜK SINIRI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Flame size={16} className="text-purple-600 shrink-0" />
                    Yoğun / Ağır Ders Günlük Tavan Sınırı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Haftalık 6 saatten fazla olan dersleri (veya meslek/atölye derslerini) bir günde en fazla 3-4 saat olacak şekilde sınıflara dengeli paylaştırır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceIntensiveRules} 
                    onChange={(e) => setHard({ ...hard, enforceIntensiveRules: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {hard.enforceIntensiveRules ? (
                <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Aynı Dersten Günlük En Fazla:</span>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHard({ ...hard, maxHoursPerIntensiveCourse: val })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          hard.maxHoursPerIntensiveCourse === val 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val} Saat {val === 4 && '(Önerilen)'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 text-amber-900 text-xs font-medium">
                  ⚠️ Bu sınır devre dışı. Aynı dersten aynı güne 5-6 saat verilebilir.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MOTOR SÜRESİ VE ÇÖZÜCÜ AYARLARI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'solver') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>3. Çözücü Motor Performansı & Zaman Sınırı</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Zap size={16} className="text-slate-800 shrink-0" />
                Google OR-Tools CP-SAT Maksimum Optimizasyon Süresi
              </h3>
              <p className="text-xs text-gray-500">
                Çözücü matematik motorunun boşlukları sıfırlamak ve en adil dağılımı bulmak için harcayacağı azami bütçe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: 'İlk Geçerli Çözümde Dur', sub: 'Yıldırım Hızı (1-3 Sn)', value: 85, stopFirst: true, icon: '⚡' },
                { label: 'Hızlı Test', sub: '60 Sn (1 Dk)', value: 60, stopFirst: false, icon: '⏱️' },
                { label: 'Dengeli Dağıtım', sub: '300 Sn (5 Dk)', value: 300, stopFirst: false, icon: '⚖️', recommended: true },
                { label: 'Gelişmiş Optimizasyon', sub: '900 Sn (15 Dk)', value: 900, stopFirst: false, icon: '🧠' }
              ].map((opt) => {
                const isSelected = opt.stopFirst 
                  ? hard.stopAtFirstSolution 
                  : (!hard.stopAtFirstSolution && hard.solverTimeout === opt.value);

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setHard({ ...hard, solverTimeout: opt.value, stopAtFirstSolution: opt.stopFirst })}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/50'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{opt.icon}</span>
                      {opt.recommended && (
                        <span className="text-[9px] bg-blue-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                          ÖNERİLEN
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ALT BUTON BARI */}
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <button 
          type="button"
          onClick={() => navigate('/generate')} 
          className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
        >
          ← Dağıtım Motoruna Git
        </button>
        <button 
          type="button"
          onClick={handleSave} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
        >
          <Save size={15} />
          <span>Kuralları Kaydet ve Dağıtım Motoruna Uygula</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}
