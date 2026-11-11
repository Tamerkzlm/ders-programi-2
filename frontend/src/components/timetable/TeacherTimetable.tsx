// frontend/src/components/timetable/TeacherTimetable.jsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  Lock, 
  Search, 
  X,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import LocalRepairModal from './LocalRepairModal';
import { calculateTeacherDutyDay } from '../../utils/dutyDayCalculator';
import { getCourseColorClass } from '../../utils/courseColors';
import { evaluateSwapOrMove, findSmartSwapOpportunities } from '../../utils/smartSwapEngine';

export default function TeacherTimetable({
  teachers = [],
  classrooms = [],
  timetable = {},
  settings = {},
  pinnedSlots = [],
  togglePinSlot,
  toggleTeacherSchedulePin,
  handleCellMoveOrSwap,
  daysArray = [],
  periodsArray = [],
  initialTeacherId = null
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId || teachers[0]?.id || '');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const startLocalRepair = useAppStore(state => state.startLocalRepair);
  const isLocalRepairing = useAppStore(state => state.isLocalRepairing);

  // Dışarıdan initialTeacherId değişirse senkronize et
  useEffect(() => {
    if (initialTeacherId) {
      setSelectedTeacherId(initialTeacherId);
    }
  }, [initialTeacherId]);

  // Sürükle-bırak canlı bilgi ekranı durumları
  const [draggedSource, setDraggedSource] = useState(null);
  const [dragHoverEval, setDragHoverEval] = useState(null);

  // ⚡ SEÇİLEN DERSİN DEĞİŞEBİLECEĞİ DERS SEÇENEKLERİ
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);
  const [swapMap, setSwapMap] = useState(new Map());

  const calculateOpportunities = (source) => {
    if (!source || source.fromPool) {
      setSwapMap(new Map());
      return;
    }

    const opps = findSmartSwapOpportunities({
      classId: source.classId,
      sourceDay: source.day,
      sourcePeriod: source.period,
      timetable,
      teachers,
      classrooms,
      settings: { days: daysArray, periodsPerDay: periodsArray.length }
    });

    const map = new Map();
    opps.forEach(o => map.set(`${o.targetDay}-${o.targetPeriod}`, o));
    setSwapMap(map);
  };

  const handleDragStart = (payload) => {
    setDraggedSource(payload);
    setSelectedSlotForSwap(payload);
    calculateOpportunities(payload);
  };

  const handleDragEnd = () => {
    setDraggedSource(null);
    setDragHoverEval(null);
  };

  const handleSelectSlot = (classId, day, period, item) => {
    if (selectedSlotForSwap && selectedSlotForSwap.classId === classId && selectedSlotForSwap.day === day && Number(selectedSlotForSwap.period) === Number(period)) {
      setSelectedSlotForSwap(null);
      setSwapMap(new Map());
      setDraggedSource(null);
      return;
    }

    const sourcePayload = {
      fromPool: false,
      classId,
      teacherId: selectedTeacherId,
      day,
      period,
      subject: item.subject
    };

    setSelectedSlotForSwap(sourcePayload);
    calculateOpportunities(sourcePayload);
  };

  const handleExecuteSwapDirectly = (opp) => {
    if (!selectedSlotForSwap) return;
    handleCellMoveOrSwap(
      selectedSlotForSwap.classId,
      selectedSlotForSwap,
      {
        classId: selectedSlotForSwap.classId,
        day: opp.targetDay,
        period: opp.targetPeriod
      }
    );
    setSelectedSlotForSwap(null);
    setSwapMap(new Map());
    setDraggedSource(null);
  };

  const handleCellHover = (targetClassId, day, period) => {
    if (!draggedSource) return;
    const res = evaluateSwapOrMove({
      source: draggedSource,
      target: { classId: targetClassId || draggedSource.classId, day, period },
      timetable,
      teachers,
      classrooms,
      settings: { days: daysArray, periodsPerDay: periodsArray.length }
    });
    setDragHoverEval({
      day,
      period,
      ...res
    });
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.branch || '').toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Arama yapıldığında ilk eşleşen öğretmeni otomatik aç
  const handleSearchChange = (val) => {
    setTeacherSearch(val);
    if (val.trim().length > 0) {
      const match = teachers.find(t => 
        t.name.toLowerCase().includes(val.toLowerCase()) ||
        (t.branch || '').toLowerCase().includes(val.toLowerCase())
      );
      if (match) {
        setSelectedTeacherId(match.id);
      }
    }
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Seçilen öğretmenin ders yükünü ve matrisini hesapla
  const teacherSchedule = {};
  daysArray.forEach(d => { teacherSchedule[d] = {}; });

  let totalHours = 0;
  const dayPeriodCounts = {};
  daysArray.forEach(d => { dayPeriodCounts[d] = []; });

  Object.keys(timetable).forEach(classId => {
    const className = classrooms.find(c => c.id === classId)?.name || 'Sınıf';
    daysArray.forEach(day => {
      const slots = timetable[classId]?.[day] || [];
      slots.forEach(slot => {
        if (slot.teacherId === selectedTeacher?.id) {
          totalHours += 1;
          const p = Number(slot.period);
          teacherSchedule[day][p] = {
            subject: slot.subject,
            className: className,
            classId: classId,
            teacherId: slot.teacherId
          };
          if (!dayPeriodCounts[day].includes(p)) {
            dayPeriodCounts[day].push(p);
          }
        }
      });
    });
  });

  // Boş günleri hesapla
  const freeDays = daysArray.filter(d => (dayPeriodCounts[d] || []).length === 0);

  // Pencere (boşluk) sayısını hesapla
  let totalGaps = 0;
  daysArray.forEach(d => {
    const periods = (dayPeriodCounts[d] || []).sort((a, b) => a - b);
    if (periods.length > 1) {
      const first = periods[0];
      const last = periods[periods.length - 1];
      const span = last - first + 1;
      const gaps = span - periods.length;
      totalGaps += Math.max(0, gaps);
    }
  });

  // Nöbet günü analizi
  const dutyDay = calculateTeacherDutyDay(selectedTeacher?.id, timetable, settings);

  const isSlotPinned = (classId, day, period) => {
    return (pinnedSlots || []).some(
      p => p.classId === classId && p.day === day && Number(p.period) === Number(period)
    );
  };

  const isTeacherClosed = (day, period) => {
    if (!selectedTeacher?.unavailable) return false;
    const closedList = selectedTeacher.unavailable[day] || [];
    return closedList.some(p => Number(p) === Number(period));
  };

  if (!selectedTeacher) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
        Öğretmen verisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* 🧭 ÜST FİLTRE VE SEÇİCİ KONTROL KARTI */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Öğretmen Arama & Dropdown */}
        <div className="flex flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          
          {/* Açılır Liste */}
          <div className="flex-1 max-w-xs relative">
            <select
              value={selectedTeacher.id}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setTeacherSearch('');
              }}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.branch || 'Genel'})
                </option>
              ))}
            </select>
          </div>

          {/* Anında Arama Kutusu */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Öğretmen ara... (Yazınca açılır)"
              value={teacherSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            {teacherSearch && (
              <button
                type="button"
                onClick={() => setTeacherSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}

            {/* Arama Sonuçları Açılır Popover */}
            {isSearchFocused && teacherSearch.trim().length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100"
                onMouseDown={(e) => e.preventDefault()} // Focus kaybını önler
              >
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId(t.id);
                        setTeacherSearch(t.name);
                        setIsSearchFocused(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/70 transition-colors cursor-pointer ${
                        t.id === selectedTeacher.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{t.branch || 'Genel'}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    Eşleşen öğretmen bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 📊 ROZETLER: DERS YÜKÜ, BOŞLUK, BOŞ GÜN, NÖBET */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Toplam Saat */}
          <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ders Yükü</span>
            <span className="text-xs font-black text-slate-800 flex items-center gap-1 justify-center">
              {totalHours} Saat
              {totalHours > 30 && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800">
                  ⚠️ 30+
                </span>
              )}
            </span>
          </div>

          {/* Boşluk (Pencere) */}
          <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencereler</span>
            <span className={`text-xs font-black ${totalGaps > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {totalGaps} Saat Boşluk
            </span>
          </div>

          {/* Boş Günler */}
          <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Boş Gün</span>
            <span className="text-xs font-black text-indigo-700">
              {freeDays.length > 0 ? freeDays.join(', ') : 'Tüm Günler Dolu'}
            </span>
          </div>

          {/* Nöbet Günü */}
          {dutyDay && (
            <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Nöbet Analizi</span>
              <span className="text-xs font-black text-emerald-800">
                {dutyDay}
              </span>
            </div>
          )}

          {/* Tümünü Kilitle / Kilidi Aç Butonu */}
          {toggleTeacherSchedulePin && (
            <button
              type="button"
              onClick={() => toggleTeacherSchedulePin(selectedTeacher.id)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Öğretmenin tüm derslerini kilitle veya kilidi kaldır"
            >
              <Lock size={13} />
              <span>Derslerini Kilitle</span>
            </button>
          )}

          {/* ⚡ LOKAL YENİDEN DAĞITIM (RUIN & RECREATE) BUTONU */}
          <button
            type="button"
            onClick={() => startLocalRepair(selectedTeacher.id)}
            disabled={isLocalRepairing}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Seçili öğretmenin programını sıfırlayıp yalnızca girdiği sınıflar içinde yeniden dağıtır (okulun kalanı dondurulur)"
          >
            <Sparkles size={13} className="text-emerald-600" />
            <span>{isLocalRepairing ? 'Dağıtılıyor...' : 'Bu Öğretmeni Yeniden Dağıt'}</span>
          </button>

        </div>

      </div>

      {/* 📅 HAFTALIK MATRİS: SATIRLAR GÜNLER, SÜTUNLAR SAATLER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-x-auto select-none">
        <div style={{ minWidth: `${120 + periodsArray.length * 110}px` }} className="space-y-3">
          
          {/* Sütun Başlıkları (Saatler) */}
          <div 
            className="grid gap-2 text-center text-xs font-bold"
            style={{ gridTemplateColumns: `100px repeat(${periodsArray.length}, minmax(105px, 1fr))` }}
          >
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center font-extrabold">
              GÜN
            </div>
            {periodsArray.map(period => (
              <div key={period} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-extrabold flex items-center justify-center">
                {period}. Ders
              </div>
            ))}
          </div>

          {/* Gün Satırları (Pazartesi..Cuma) */}
          <div className="space-y-2">
            {daysArray.map(day => (
              <div 
                key={day} 
                className="grid gap-2"
                style={{ gridTemplateColumns: `100px repeat(${periodsArray.length}, minmax(105px, 1fr))` }}
              >
                
                {/* Sol Gün İndikatörü */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs font-black text-slate-700">
                  <span className="font-extrabold">{day}</span>
                  {(() => {
                    const dayLessons = periodsArray.filter(p => !!teacherSchedule[day]?.[p]).length;
                    return dayLessons > 0 ? (
                      <span className="text-[10px] font-bold text-indigo-600 mt-0.5">
                        {dayLessons} Saat
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                        Boş Gün
                      </span>
                    );
                  })()}
                </div>

                {/* Saat Hücreleri (1..P) */}
                {periodsArray.map(period => {
                  const item = teacherSchedule[day]?.[period];
                  const isClosed = isTeacherClosed(day, period);
                  const isPinned = item ? isSlotPinned(item.classId, day, period) : false;
                  const colorStyle = item ? getCourseColorClass(item.subject, item.className) : '';

                  const isHovered = dragHoverEval && dragHoverEval.day === day && dragHoverEval.period === period;
                  const isSelected = selectedSlotForSwap && selectedSlotForSwap.day === day && Number(selectedSlotForSwap.period) === Number(period);
                  const isSwapCandidate = selectedSlotForSwap && swapMap.has(`${day}-${period}`);
                  const candidateOpp = isSwapCandidate ? swapMap.get(`${day}-${period}`) : null;

                  if (isClosed) {
                    return (
                      <div
                        key={period}
                        onDragOver={(e) => {
                          e.preventDefault();
                          handleCellHover(item?.classId, day, period);
                        }}
                        onDragEnter={() => handleCellHover(item?.classId, day, period)}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDragEnd();
                          if (!handleCellMoveOrSwap) return;
                          try {
                            const raw = e.dataTransfer.getData("text/plain");
                            if (!raw) return;
                            const source = JSON.parse(raw);
                            handleCellMoveOrSwap(source.classId, source, { day, period });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`p-2 rounded-xl transition-all relative flex flex-col items-center justify-center text-center select-none min-h-[58px] ${
                          isHovered && dragHoverEval?.isClosedSlot && dragHoverEval?.canUnlockWithConfirm
                            ? 'bg-amber-100/95 ring-4 ring-amber-500 ring-inset shadow-xl scale-[1.03] z-30 animate-pulse text-amber-950 border border-amber-400'
                            : 'bg-slate-100/60 border border-slate-200/60 text-slate-400'
                        }`}
                      >
                        {isHovered && dragHoverEval?.isClosedSlot && dragHoverEval?.canUnlockWithConfirm ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-amber-900 flex items-center justify-center gap-1">
                              <Lock size={11} /> Kısıtı Aç & Bırak
                            </span>
                            <span className="text-[9px] font-extrabold text-amber-700 block">
                              +{dragHoverEval.unlockInfo?.tgtDayHoursAfter - dragHoverEval.unlockInfo?.tgtDayHoursBefore} sa ({dragHoverEval.unlockInfo?.tgtDayHoursBefore}➔{dragHoverEval.unlockInfo?.tgtDayHoursAfter})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold">⛔ Kapalı Saat</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={period}
                      onClick={() => {
                        if (isSwapCandidate && candidateOpp) {
                          handleExecuteSwapDirectly(candidateOpp);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleCellHover(item?.classId, day, period);
                      }}
                      onDragEnter={() => handleCellHover(item?.classId, day, period)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDragEnd();
                        if (!handleCellMoveOrSwap) return;
                        try {
                          const raw = e.dataTransfer.getData("text/plain");
                          if (!raw) return;
                          const source = JSON.parse(raw);
                          handleCellMoveOrSwap(source.classId, source, { day, period });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`min-h-[58px] rounded-xl transition-all relative ${
                        isHovered 
                          ? dragHoverEval.isClosedSlot && dragHoverEval.canUnlockWithConfirm
                            ? 'bg-amber-100/90 ring-4 ring-amber-500 ring-inset shadow-xl scale-[1.02] z-30 animate-pulse'
                            : dragHoverEval.isValid
                              ? dragHoverEval.netGapChange < 0
                                ? 'bg-emerald-100/90 ring-4 ring-emerald-500 ring-inset shadow-xl scale-[1.02] z-30 animate-pulse'
                                : dragHoverEval.netGapChange > 0
                                  ? 'bg-rose-100/90 ring-4 ring-rose-500 ring-inset shadow-xl scale-[1.02] z-30 animate-pulse'
                                  : 'bg-indigo-100/80 ring-3 ring-indigo-500 ring-inset shadow-md scale-[1.01] z-30'
                              : 'bg-rose-100/60 ring-2 ring-rose-400 ring-inset'
                          : isSwapCandidate
                            ? candidateOpp?.netGapChange < 0
                              ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-inset animate-pulse cursor-pointer shadow-xs'
                              : candidateOpp?.netGapChange > 0
                                ? 'bg-rose-50/80 ring-2 ring-rose-500 ring-inset animate-pulse cursor-pointer shadow-xs'
                                : 'bg-indigo-50/70 ring-2 ring-indigo-400 ring-inset cursor-pointer'
                          : isSelected
                            ? 'bg-indigo-50/90 ring-2 ring-indigo-500 ring-inset'
                            : ''
                      }`}
                    >
                      {/* Değiştirilebilir Rozeti */}
                      {isSwapCandidate && candidateOpp && (
                        <div className={`absolute -top-1.5 right-1 z-20 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-none animate-pulse ${
                          candidateOpp.netGapChange < 0
                            ? 'bg-emerald-600 ring-2 ring-emerald-300'
                            : candidateOpp.netGapChange > 0
                              ? 'bg-rose-600 ring-2 ring-rose-300'
                              : 'bg-indigo-600'
                        }`}>
                          <span>⇄ Değiştir</span>
                          <span className="bg-black/25 px-1 rounded text-[7.5px]">
                            {candidateOpp.currentTotalGaps}➔{candidateOpp.newTotalGaps} ({candidateOpp.netGapChange < 0 ? `-${Math.abs(candidateOpp.netGapChange)}sa` : candidateOpp.netGapChange > 0 ? `+${candidateOpp.netGapChange}sa` : '±0'})
                          </span>
                          {candidateOpp.netGapChange < 0 ? <span>🌟</span> : candidateOpp.netGapChange > 0 ? <span>⚠️</span> : null}
                        </div>
                      )}

                      {item ? (
                        <div
                          draggable
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSwapCandidate && candidateOpp) {
                              handleExecuteSwapDirectly(candidateOpp);
                            } else {
                              handleSelectSlot(item.classId, day, period, item);
                            }
                          }}
                          onDragStart={(e) => {
                            const payload = {
                              fromPool: false,
                              classId: item.classId,
                              teacherId: selectedTeacher.id,
                              day,
                              period,
                              subject: item.subject
                            };
                            e.dataTransfer.setData("text/plain", JSON.stringify(payload));
                            handleDragStart(payload);
                          }}
                          onDragEnd={handleDragEnd}
                          className={`p-2.5 rounded-xl border transition-all relative flex flex-col justify-between group cursor-grab active:cursor-grabbing select-none ${
                            isSelected
                              ? 'ring-2 ring-indigo-600 shadow-md scale-95 '
                              : isPinned 
                                ? 'ring-2 ring-amber-400 shadow-md ' 
                                : 'hover:shadow-xs hover:scale-[1.01]'
                          } ${colorStyle}`}
                          title={`${item.subject} (${item.className}) - Seçmek ve değiştirilebilecek seçenekleri görmek için tıklayın`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-extrabold text-xs text-white truncate drop-shadow-xs" title={item.subject}>
                              {item.subject}
                            </span>

                            {/* Kilit Butonu */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinSlot({
                                  classId: item.classId,
                                  day,
                                  period,
                                  subject: item.subject,
                                  teacherId: selectedTeacher.id
                                });
                              }}
                              className={`p-1 rounded-md transition-all cursor-pointer ${
                                isPinned 
                                  ? 'bg-amber-400 text-white shadow-xs' 
                                  : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60'
                              }`}
                              title={isPinned ? "Kilitli (Açmak için tıklayın)" : "Dersi Kilitle"}
                            >
                              <Lock size={10} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[11px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-white/20 text-white">
                              {item.className}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            if (isSwapCandidate && candidateOpp) {
                              e.stopPropagation();
                              handleExecuteSwapDirectly(candidateOpp);
                            }
                          }}
                          className={`w-full h-full border rounded-xl flex items-center justify-center text-[10px] font-semibold transition-all ${
                            isSwapCandidate 
                              ? 'border-emerald-500 bg-emerald-100/50 text-emerald-700 font-extrabold cursor-pointer' 
                              : 'border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/30 hover:bg-indigo-50/20 text-slate-300 hover:text-indigo-600 cursor-pointer'
                          }`}
                        >
                          {isSwapCandidate ? 'Buraya Taşı' : '— Boşluk —'}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ⚡ CANLI SÜRÜKLE-BIRAK BİLGİ VE BOŞLUK DEĞİŞİM EKRANI (HUD) */}
      {draggedSource && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-4 text-xs max-w-2xl w-[92%] animate-in fade-in slide-in-from-bottom-3 select-none transition-all ${
          dragHoverEval?.isClosedSlot && dragHoverEval?.canUnlockWithConfirm
            ? 'bg-slate-950/95 border-amber-500 ring-2 ring-amber-500/40 shadow-amber-950/60'
            : dragHoverEval && dragHoverEval.isValid
              ? dragHoverEval.netGapChange < 0
                ? 'bg-slate-950/95 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/60'
                : dragHoverEval.netGapChange > 0
                  ? 'bg-slate-950/95 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/60'
                  : 'bg-slate-950/95 border-slate-700/80'
              : 'bg-slate-950/95 border-slate-700/80'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 transition-all ${
            dragHoverEval?.isClosedSlot && dragHoverEval?.canUnlockWithConfirm
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              : dragHoverEval && dragHoverEval.isValid
                ? dragHoverEval.netGapChange < 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : dragHoverEval.netGapChange > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
          }`}>
            {dragHoverEval?.isClosedSlot && dragHoverEval?.canUnlockWithConfirm ? (
              <Lock size={18} />
            ) : (
              <ArrowRightLeft size={18} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sürüklenen Ders:
              </span>
              <span className="font-extrabold text-white">
                {draggedSource.subject} ({selectedTeacher.name})
              </span>
            </div>

            {/* Hedef Üzerine Gelindiğinde Canlı Bilgi */}
            {dragHoverEval ? (
              dragHoverEval.isValid ? (
                <div className="text-xs font-bold mt-1 leading-snug">
                  {dragHoverEval.type === 'swap' ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>⇄ <span className="text-amber-300 font-extrabold">{dragHoverEval.targetTeacherName}</span> ({dragHoverEval.targetSubject}) ile yer değiştirebilir.</span>
                      <span>Toplam okul penceresi:</span>
                      <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverEval.currentTotalGaps} ➔ {dragHoverEval.newTotalGaps}
                      </span>
                      {dragHoverEval.netGapChange < 0 ? (
                        <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          🌟 {Math.abs(dragHoverEval.netGapChange)} saat AZALIR (Önerilen)
                        </span>
                      ) : dragHoverEval.netGapChange > 0 ? (
                        <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          ⚠️ {dragHoverEval.netGapChange} saat ARTAR (Boşluk Artışı)
                        </span>
                      ) : (
                        <span className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          ✓ DEĞİŞMEZ (±0)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>➜ <span className="text-emerald-300 font-extrabold">{dragHoverEval.day} {dragHoverEval.period}. saatteki boş hücreye</span> taşınabilir.</span>
                      <span>Toplam okul penceresi:</span>
                      <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverEval.currentTotalGaps} ➔ {dragHoverEval.newTotalGaps}
                      </span>
                      {dragHoverEval.netGapChange < 0 ? (
                        <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          🌟 {Math.abs(dragHoverEval.netGapChange)} saat AZALIR
                        </span>
                      ) : dragHoverEval.netGapChange > 0 ? (
                        <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          ⚠️ {dragHoverEval.netGapChange} saat ARTAR
                        </span>
                      ) : (
                        <span className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          ✓ DEĞİŞMEZ (±0)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : dragHoverEval.isClosedSlot && dragHoverEval.canUnlockWithConfirm ? (
                <div className="text-xs font-bold mt-1 leading-snug">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-amber-300 font-extrabold flex items-center gap-1">
                      <Lock size={12} className="inline" /> Kapalı Slot (Açılabilir):
                    </span>
                    <span>{dragHoverEval.unlockInfo?.teacherName} için {dragHoverEval.day} {dragHoverEval.period}. saat kapalıdır.</span>
                    <span className="text-amber-200 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      {dragHoverEval.day}: {dragHoverEval.unlockInfo?.tgtDayHoursBefore} ➔ {dragHoverEval.unlockInfo?.tgtDayHoursAfter} sa (+1 ders)
                    </span>
                    {dragHoverEval.unlockInfo?.sourceDay && (
                      <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverEval.unlockInfo.sourceDay}: {dragHoverEval.unlockInfo.srcDayHoursBefore} ➔ {dragHoverEval.unlockInfo.srcDayHoursAfter} sa (-1 ders)
                      </span>
                    )}
                    <span>Pencere:</span>
                    <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                      {dragHoverEval.currentTotalGaps} ➔ {dragHoverEval.newTotalGaps}
                    </span>
                    {dragHoverEval.netGapChange < 0 ? (
                      <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse">
                        🌟 {Math.abs(dragHoverEval.netGapChange)} sa AZALIR
                      </span>
                    ) : dragHoverEval.netGapChange > 0 ? (
                      <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse">
                        ⚠️ {dragHoverEval.netGapChange} sa ARTAR
                      </span>
                    ) : (
                      <span className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                        ✓ DEĞİŞMEZ (±0)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-amber-300/90 font-medium mt-1">
                    💡 Bıraktığınızda onayınızla bu saat öğretmen için açılarak ders yerleştirilecektir.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-400 font-bold mt-1 flex items-center gap-1.5">
                  <span>⛔ Bu alana taşınamaz: {dragHoverEval.reason || 'Kısıt çakışması'}</span>
                </div>
              )
            ) : (
              <div className="text-xs text-slate-300 font-medium mt-1">
                💡 Taşımak istediğiniz hücrenin üzerine gelerek yer değişimini ve toplam pencere değişimini görün.
              </div>
            )}
          </div>
        </div>
      )}



      {/* ⚡ LOKAL DAĞITIM VE ÖNİZLEME MODALI */}
      <LocalRepairModal />

    </div>
  );
}
