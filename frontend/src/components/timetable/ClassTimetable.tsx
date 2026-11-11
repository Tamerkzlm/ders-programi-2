// frontend/src/components/timetable/ClassTimetable.jsx
import { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Zap, 
  X, 
  Coffee, 
  AlertTriangle, 
  Layers,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { getCourseColorClass } from '../../utils/courseColors';
import { findSmartSwapOpportunities, evaluateSwapOrMove } from '../../utils/smartSwapEngine';

export default function ClassTimetable({
  classrooms = [],
  teachers = [],
  timetable = {},
  daysArray = [],
  periodsArray = [],
  pinnedSlots = [],
  togglePinSlot,
  handleCellMoveOrSwap,
  handleDeleteSlot,
  checkCellConflict = (_classId?: string, _day?: string, _period?: number, _teacherId?: string) => ({ hasTeacherConflict: false, isTeacherUnavailable: false })
}: any) {
  const [selectedClassId, setSelectedClassId] = useState(classrooms[0]?.id || '');
  const selectedClass = classrooms.find(c => c.id === selectedClassId) || classrooms[0];

  // 🎯 SÜRÜKLE-BIRAK VE SEÇİLEN DERS TAKAS DURUMLARI
  const [draggedSource, setDraggedSource] = useState(null);
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);
  const [swapMap, setSwapMap] = useState(new Map());
  const [dragHoverTarget, setDragHoverTarget] = useState(null);

  const isSlotPinned = (classId, day, period) => {
    return (pinnedSlots || []).some(
      p => p.classId === classId && p.day === day && Number(p.period) === Number(period)
    );
  };

  // Takas hesaplayıcı yardımcı
  const calculateOpportunities = (source) => {
    if (!source || source.fromPool) {
      setSwapMap(new Map());
      return;
    }

    const opps = findSmartSwapOpportunities({
      classId: selectedClass.id,
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

  // 1. Sürükleme Başlangıcı
  const handleDragStart = (source) => {
    setDraggedSource(source);
    setSelectedSlotForSwap(source);
    calculateOpportunities(source);
  };

  const handleDragEnd = () => {
    setDraggedSource(null);
    setDragHoverTarget(null);
    // Not: selectedSlotForSwap'ı koruyoruz ki kullanıcı seçenekler panelinden de tıklayabilsin!
  };

  // 2. Bir Ders Hücresine Tıklayarak Seçme (Sürükleme yapmadan seçenekleri görme)
  const handleSelectSlot = (day, period, slot) => {
    // Aynı hücreye tekrar tıklandıysa seçimi kapat
    if (selectedSlotForSwap && selectedSlotForSwap.day === day && Number(selectedSlotForSwap.period) === Number(period)) {
      setSelectedSlotForSwap(null);
      setSwapMap(new Map());
      setDraggedSource(null);
      return;
    }

    const sourcePayload = {
      fromPool: false,
      classId: selectedClass.id,
      teacherId: slot.teacherId,
      day,
      period,
      subject: slot.subject
    };

    setSelectedSlotForSwap(sourcePayload);
    calculateOpportunities(sourcePayload);
  };

  // 3. Seçenekler Listesinden Doğrudan Takas Yapma
  const handleExecuteSwapDirectly = (opp) => {
    if (!selectedSlotForSwap) return;
    handleCellMoveOrSwap(
      selectedClass.id,
      selectedSlotForSwap,
      {
        day: opp.targetDay,
        period: opp.targetPeriod
      }
    );
    setSelectedSlotForSwap(null);
    setSwapMap(new Map());
    setDraggedSource(null);
  };

  const handleDragHover = (day, period) => {
    const activeSrc = draggedSource || selectedSlotForSwap;
    if (!activeSrc) return;

    const evalResult = evaluateSwapOrMove({
      source: activeSrc,
      target: { classId: selectedClass.id, day, period },
      timetable,
      teachers,
      classrooms,
      settings: { days: daysArray, periodsPerDay: periodsArray.length }
    });
    setDragHoverTarget({ 
      day, 
      period, 
      ...evalResult
    });
  };

  // Açıkta kalan (havuzdaki) dersleri hesapla
  const getUnassignedCourses = () => {
    if (!selectedClass) return [];
    const assignedCounts = {};
    daysArray.forEach(d => {
      const slots = timetable[selectedClass.id]?.[d] || [];
      slots.forEach(s => {
        const key = `${s.subject}_${s.teacherId}`;
        assignedCounts[key] = (assignedCounts[key] || 0) + 1;
      });
    });

    const unassigned = [];
    (selectedClass.courses || []).forEach(course => {
      const key = `${course.subject}_${course.teacherId}`;
      const assigned = assignedCounts[key] || 0;
      const remaining = Number(course.hoursPerWeek) - assigned;
      if (remaining > 0) {
        unassigned.push({
          ...course,
          remaining
        });
      }
    });
    return unassigned;
  };

  const unassignedCourses = getUnassignedCourses();
  const activeFocus = draggedSource || selectedSlotForSwap;

  return (
    <div className="space-y-4">
      
      {/* 🧭 ÜST KONTROL BARI (SINIF SEÇİMİ VE HAVUZ DURUMU) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
        
        {/* Sınıf Seçici Dropdown */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İncelenen Şube</div>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSlotForSwap(null);
                setSwapMap(new Map());
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-extrabold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} Şubesi</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bilgilendirme Rozeti */}
        <div className="flex items-center gap-2">
          {unassignedCourses.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>{unassignedCourses.reduce((sum, c) => sum + c.remaining, 0)} Saat Açıkta (Havuzda)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Tüm Dersler Dağıtıldı (40/40 Saat)</span>
            </div>
          )}
        </div>
      </div>

      {/* 📦 AÇIKTA KALAN (HAVUZDAKİ) DERSLER ŞERİDİ */}
      {unassignedCourses.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 shadow-2xs space-y-2 print:hidden">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-amber-600" />
              <span>Dağıtılmayı Bekleyen Ders Havuzu (Sürükleyip Boş Saate Bırakın):</span>
            </span>
            <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md font-black">
              {unassignedCourses.length} Branş
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {unassignedCourses.map(c => {
              const teacherObj = teachers.find(t => t.id === c.teacherId);
              return (
                <div
                  key={`${c.subject}_${c.teacherId}`}
                  draggable
                  onDragStart={(e) => {
                    const payload = {
                      fromPool: true,
                      classId: selectedClass.id,
                      teacherId: c.teacherId,
                      subject: c.subject,
                      day: null,
                      period: null
                    };
                    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
                    handleDragStart(payload);
                  }}
                  onDragEnd={handleDragEnd}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 font-extrabold text-xs shadow-2xs hover:shadow-xs cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all select-none"
                >
                  <span className="text-indigo-700">{c.subject}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({teacherObj ? teacherObj.name.split(' ')[0] : 'Öğretmen'})</span>
                  <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-black">
                    {c.remaining} sa
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* 📅 HAFTALIK MATRİS TABLOSU: SATIRLAR GÜNLER, SÜTUNLAR SAATLER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto select-none">
        <div style={{ minWidth: `${120 + periodsArray.length * 110}px` }}>
          
          {/* Üst Tablo Başlıkları (Saatler) */}
          <div 
            className="grid border-b border-slate-200/80 bg-slate-50/80 text-xs font-extrabold text-slate-700 select-none"
            style={{ gridTemplateColumns: `100px repeat(${periodsArray.length}, minmax(105px, 1fr))` }}
          >
            <div className="p-3 text-center border-r border-slate-200/80 font-mono text-[11px] text-slate-500 flex items-center justify-center">
              GÜN
            </div>
            {periodsArray.map(period => (
              <div key={period} className="p-3 text-center border-r border-slate-200/80 last:border-r-0 flex items-center justify-center gap-1">
                <span>{period}. Ders</span>
                {period === 5 && (
                  <span title="Öğle Arası Sonrası" className="text-amber-600 text-xs flex items-center"><Coffee size={11} className="inline" /></span>
                )}
              </div>
            ))}
          </div>

          {/* Tablo Gövdesi (Günler x Saatler) */}
          <div className="p-2 space-y-2">
            {daysArray.map(day => (
              <div 
                key={day}
                className="grid gap-2"
                style={{ gridTemplateColumns: `100px repeat(${periodsArray.length}, minmax(105px, 1fr))` }}
              >
                
                {/* Gün Göstergesi */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs font-black text-slate-700">
                  <span className="font-extrabold">{day}</span>
                  {(() => {
                    const daySlots = timetable[selectedClass.id]?.[day] || [];
                    const activeCount = daySlots.filter(s => s && s.subject).length;
                    return activeCount > 0 ? (
                      <span className="text-[10px] font-bold text-indigo-600 mt-0.5">
                        {activeCount} Saat
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                        Boş Gün
                      </span>
                    );
                  })()}
                </div>

                {/* Günün Saat Hücreleri */}
                {periodsArray.map(period => {
                  const slots = timetable[selectedClass.id]?.[day] || [];
                  const slot = slots.find(s => Number(s.period) === Number(period));
                  const isPinned = slot ? isSlotPinned(selectedClass.id, day, period) : false;
                  const conflict: any = slot ? checkCellConflict(selectedClass.id, day, period, slot.teacherId) : {};

                  // Sürükleme ve seçim hedefleri analizi
                  const cellKey = `${day}-${period}`;
                  const isOpportunity = swapMap.has(cellKey);
                  const opp = swapMap.get(cellKey);
                  const isCurrentSelected = activeFocus && !activeFocus.fromPool && activeFocus.day === day && Number(activeFocus.period) === Number(period);

                  const isHovered = dragHoverTarget && dragHoverTarget.day === day && Number(dragHoverTarget.period) === Number(period);

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragHover(day, period);
                      }}
                      onDragEnter={() => handleDragHover(day, period)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDragEnd();
                        try {
                          const raw = e.dataTransfer.getData("text/plain");
                          if (!raw) return;
                          const source = JSON.parse(raw);
                          handleCellMoveOrSwap(selectedClass.id, source, { day, period });
                          setSelectedSlotForSwap(null);
                          setSwapMap(new Map());
                        } catch { /* yoksay */ }
                      }}
                      className={`min-h-[58px] rounded-xl transition-all relative ${
                        isHovered
                          ? dragHoverTarget.isClosedSlot && dragHoverTarget.canUnlockWithConfirm
                            ? 'ring-4 ring-amber-500 bg-amber-100/90 shadow-xl scale-[1.03] z-30 animate-pulse'
                            : dragHoverTarget.isValid
                              ? dragHoverTarget.netGapChange < 0
                                ? 'ring-4 ring-emerald-500 bg-emerald-100/90 shadow-xl scale-[1.03] z-30 animate-pulse'
                                : dragHoverTarget.netGapChange > 0
                                  ? 'ring-4 ring-rose-500 bg-rose-100/90 shadow-xl scale-[1.03] z-30 animate-pulse'
                                  : 'ring-3 ring-indigo-500 bg-indigo-100/80 shadow-md scale-[1.02] z-30'
                              : 'ring-2 ring-rose-400 bg-rose-100/60 z-30'
                          : isCurrentSelected
                            ? 'ring-4 ring-indigo-500 ring-offset-1 shadow-lg scale-[1.02] z-20'
                            : isOpportunity
                              ? opp?.benefitType === 'improved'
                                ? 'ring-2 ring-emerald-500 bg-emerald-50/80 shadow-md scale-[1.01] z-10 animate-pulse cursor-pointer'
                                : opp?.benefitType === 'worse'
                                  ? 'ring-2 ring-rose-500 bg-rose-50/80 shadow-md scale-[1.01] z-10 animate-pulse cursor-pointer'
                                  : 'ring-2 ring-indigo-400 bg-indigo-50/50 cursor-pointer'
                              : activeFocus && !isCurrentSelected
                                ? 'opacity-40'
                                : ''
                      }`}
                    >
                      {/* Değiştirilebilir Rozeti */}
                      {isOpportunity && opp && (
                        <div 
                          onClick={() => handleExecuteSwapDirectly(opp)}
                          className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap cursor-pointer hover:scale-105 transition-transform"
                        >
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md text-white flex items-center gap-1 animate-pulse ${
                            opp.benefitType === 'improved' 
                              ? 'bg-emerald-600 ring-2 ring-emerald-300' 
                              : opp.benefitType === 'worse' 
                                ? 'bg-rose-600 ring-2 ring-rose-300' 
                                : 'bg-indigo-600'
                          }`}>
                            <span>⇄ Değiştir</span>
                            <span className="bg-black/25 px-1 rounded text-[8px] font-bold">
                              {opp.currentTotalGaps}➔{opp.newTotalGaps} ({opp.netGapChange < 0 ? `-${Math.abs(opp.netGapChange)}sa` : opp.netGapChange > 0 ? `+${opp.netGapChange}sa` : '±0'})
                            </span>
                            {opp.benefitType === 'improved' ? <span>🌟</span> : opp.benefitType === 'worse' ? <span>⚠️</span> : null}
                          </span>
                        </div>
                      )}

                      {slot ? (
                        <div
                          draggable
                          onClick={() => {
                            if (isOpportunity && opp) {
                              handleExecuteSwapDirectly(opp);
                            } else {
                              handleSelectSlot(day, period, slot);
                            }
                          }}
                          onDragStart={(e) => {
                            const payload = {
                              fromPool: false,
                              classId: selectedClass.id,
                              teacherId: slot.teacherId,
                              day,
                              period,
                              subject: slot.subject
                            };
                            e.dataTransfer.setData("text/plain", JSON.stringify(payload));
                            handleDragStart(payload);
                          }}
                          onDragEnd={handleDragEnd}
                          className={`p-2 rounded-xl border h-full flex flex-col justify-between relative group cursor-grab active:cursor-grabbing transition-all select-none shadow-2xs ${
                            isPinned 
                              ? `ring-2 ring-amber-400 shadow-md ${getCourseColorClass(slot.subject, selectedClass.name)}` 
                              : conflict.hasTeacherConflict 
                                ? 'bg-red-600 text-white border-red-800 animate-pulse' 
                                : getCourseColorClass(slot.subject, selectedClass.name)
                          }`}
                          title="Tıklayarak değişebileceği alternatif dersleri görün veya sürükleyerek taşıyın"
                        >
                          {/* Üst Bar: Ders Adı & Aksiyonlar */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-extrabold text-xs text-white truncate drop-shadow-xs" title={slot.subject}>
                              {slot.subject}
                            </span>

                            <div className="flex items-center gap-0.5">
                              {/* Kilit Butonu */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePinSlot({
                                    classId: selectedClass.id,
                                    day,
                                    period,
                                    subject: slot.subject,
                                    teacherId: slot.teacherId
                                  });
                                }}
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  isPinned 
                                    ? 'bg-amber-400 text-white shadow-xs' 
                                    : 'bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100'
                                }`}
                                title={isPinned ? "Ders Kilitli (Açmak için tıklayın)" : "Dersi Kilitle (Dağıtımda yeri korunur)"}
                              >
                                <Lock size={10} className={isPinned ? "fill-white" : ""} />
                              </button>

                              {/* Akıllı Takas Butonu */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSlot(day, period, slot);
                                }}
                                className="p-1 rounded-md bg-black/30 hover:bg-amber-500 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="⚡ Değişebileceği Seçenekleri Aç"
                              >
                                <Zap size={10} />
                              </button>

                              {/* Sil Butonu */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`${slot.subject} dersini bu saatten kaldırmak istediğinize emin misiniz? (Havuza aktarılır)`)) {
                                    handleDeleteSlot(selectedClass.id, day, period);
                                  }
                                }}
                                className="p-1 rounded-md bg-black/30 hover:bg-rose-500 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Dersi Havuza Kaldır"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </div>

                          {/* Alt Bar: Öğretmen Adı */}
                          <div className="mt-1 text-[10px] font-bold text-white/90 truncate drop-shadow-xs flex items-center justify-between">
                            <span className="truncate">
                              {teachers.find(t => t.id === slot.teacherId)?.name || 'Öğretmen'}
                            </span>
                            <span className="text-[9px] opacity-75 font-mono">
                              #{period}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* BOŞ HÜCRE */
                        <div 
                          onClick={() => {
                            if (isOpportunity && opp) {
                              handleExecuteSwapDirectly(opp);
                            }
                          }}
                          className={`w-full h-full border border-dashed rounded-xl flex flex-col items-center justify-center p-1 text-[10px] select-none transition-all ${
                            isOpportunity
                              ? 'border-emerald-400 bg-emerald-50/70 text-emerald-800 font-bold cursor-pointer animate-pulse'
                              : 'border-slate-200 text-slate-300'
                          }`}
                        >
                          {isOpportunity ? (
                            <>
                              <span className="font-black">➜ Buraya Taşı</span>
                              <span className="text-[9px] font-extrabold text-emerald-950 bg-emerald-200/80 px-1 py-0.2 rounded mt-0.5">
                                {opp.currentTotalGaps}➔{opp.newTotalGaps} ({opp.netGapChange < 0 ? `-${Math.abs(opp.netGapChange)}sa` : opp.netGapChange > 0 ? `+${opp.netGapChange}sa` : '±0'})
                              </span>
                            </>
                          ) : 'Boş'}
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

      {/* ⚡ CANLI SÜRÜKLE-BIRAK BİLGİ VE TOPLAM PENCERE DEĞİŞİM EKRANI (HUD) */}
      {draggedSource && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-4 text-xs max-w-2xl w-[92%] animate-in fade-in slide-in-from-bottom-3 select-none transition-all ${
          dragHoverTarget?.isClosedSlot && dragHoverTarget?.canUnlockWithConfirm
            ? 'bg-slate-950/95 border-amber-500 ring-2 ring-amber-500/40 shadow-amber-950/60'
            : dragHoverTarget && dragHoverTarget.isValid
              ? dragHoverTarget.netGapChange < 0
                ? 'bg-slate-950/95 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/60'
                : dragHoverTarget.netGapChange > 0
                  ? 'bg-slate-950/95 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/60'
                  : 'bg-slate-950/95 border-slate-700/80'
              : 'bg-slate-950/95 border-slate-700/80'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 transition-all ${
            dragHoverTarget?.isClosedSlot && dragHoverTarget?.canUnlockWithConfirm
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              : dragHoverTarget && dragHoverTarget.isValid
                ? dragHoverTarget.netGapChange < 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : dragHoverTarget.netGapChange > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
          }`}>
            {dragHoverTarget?.isClosedSlot && dragHoverTarget?.canUnlockWithConfirm ? (
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
                {draggedSource.subject} ({teachers.find(t => t.id === draggedSource.teacherId)?.name || 'Öğretmen'})
              </span>
            </div>

            {/* Hedef Üzerine Gelindiğinde Canlı Bilgi */}
            {dragHoverTarget ? (
              dragHoverTarget.isValid ? (
                <div className="text-xs font-bold mt-1 leading-snug">
                  {dragHoverTarget.type === 'swap' ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>⇄ <span className="text-amber-300 font-extrabold">{dragHoverTarget.targetTeacherName}</span> ({dragHoverTarget.targetSubject}) ile yer değiştirebilir.</span>
                      <span>Toplam okul penceresi:</span>
                      <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverTarget.currentTotalGaps} ➔ {dragHoverTarget.newTotalGaps}
                      </span>
                      {dragHoverTarget.netGapChange < 0 ? (
                        <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          🌟 {Math.abs(dragHoverTarget.netGapChange)} saat AZALIR (Önerilen)
                        </span>
                      ) : dragHoverTarget.netGapChange > 0 ? (
                        <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          ⚠️ {dragHoverTarget.netGapChange} saat ARTAR (Boşluk Artışı)
                        </span>
                      ) : (
                        <span className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          ✓ DEĞİŞMEZ (±0)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>➜ <span className="text-emerald-300 font-extrabold">{dragHoverTarget.day} {dragHoverTarget.period}. saatteki boş hücreye</span> taşınabilir.</span>
                      <span>Toplam okul penceresi:</span>
                      <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverTarget.currentTotalGaps} ➔ {dragHoverTarget.newTotalGaps}
                      </span>
                      {dragHoverTarget.netGapChange < 0 ? (
                        <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          🌟 {Math.abs(dragHoverTarget.netGapChange)} saat AZALIR
                        </span>
                      ) : dragHoverTarget.netGapChange > 0 ? (
                        <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                          ⚠️ {dragHoverTarget.netGapChange} saat ARTAR
                        </span>
                      ) : (
                        <span className="text-indigo-300 font-black bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          ✓ DEĞİŞMEZ (±0)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : dragHoverTarget.isClosedSlot && dragHoverTarget.canUnlockWithConfirm ? (
                <div className="text-xs font-bold mt-1 leading-snug">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-amber-300 font-extrabold flex items-center gap-1">
                      <Lock size={12} className="inline" /> Kapalı Slot (Açılabilir):
                    </span>
                    <span>{dragHoverTarget.unlockInfo?.teacherName} için {dragHoverTarget.day} {dragHoverTarget.period}. saat kapalıdır.</span>
                    <span className="text-amber-200 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      {dragHoverTarget.day}: {dragHoverTarget.unlockInfo?.tgtDayHoursBefore} ➔ {dragHoverTarget.unlockInfo?.tgtDayHoursAfter} sa (+1 ders)
                    </span>
                    {dragHoverTarget.unlockInfo?.sourceDay && (
                      <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                        {dragHoverTarget.unlockInfo.sourceDay}: {dragHoverTarget.unlockInfo.srcDayHoursBefore} ➔ {dragHoverTarget.unlockInfo.srcDayHoursAfter} sa (-1 ders)
                      </span>
                    )}
                    <span>Pencere:</span>
                    <span className="text-white font-extrabold bg-slate-800 px-1.5 py-0.5 rounded">
                      {dragHoverTarget.currentTotalGaps} ➔ {dragHoverTarget.newTotalGaps}
                    </span>
                    {dragHoverTarget.netGapChange < 0 ? (
                      <span className="text-emerald-300 font-black bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md animate-pulse">
                        🌟 {Math.abs(dragHoverTarget.netGapChange)} sa AZALIR
                      </span>
                    ) : dragHoverTarget.netGapChange > 0 ? (
                      <span className="text-rose-300 font-black bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse">
                        ⚠️ {dragHoverTarget.netGapChange} sa ARTAR
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
                  <span>⛔ Bu alana taşınamaz: {dragHoverTarget.reason || 'Kısıt çakışması'}</span>
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

    </div>
  );
}
