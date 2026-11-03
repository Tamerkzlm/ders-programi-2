// frontend/src/components/timetable/MasterSheet.jsx
import React, { useState } from 'react';
import { 
  Search, 
  GraduationCap, 
  Users, 
  Lock, 
  ExternalLink,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { getCourseColorClass } from '../../utils/courseColors';
import { evaluateSwapOrMove, findSmartSwapOpportunities } from '../../utils/smartSwapEngine';

export default function MasterSheet({
  classrooms = [],
  teachers = [],
  timetable = {},
  daysArray = [],
  periodsArray = [],
  pinnedSlots = [],
  togglePinSlot,
  handleCellMoveOrSwap,
  onSelectTeacher
}) {
  const [sheetMode, setSheetMode] = useState('classes'); // 'classes' | 'teachers'
  const [searchTerm, setSearchTerm] = useState('');

  // 🎯 SÜRÜKLE-BIRAK ANLIK BİLGİ EKRANI DURUMLARI
  const [draggedSource, setDraggedSource] = useState(null);
  const [dragHoverEval, setDragHoverEval] = useState(null);

  // ⚡ SEÇİLEN DERSİN DEĞİŞEBİLECEĞİ DERS SEÇENEKLERİ
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);
  const [swapMap, setSwapMap] = useState(new Map());

  const isSlotPinned = (classId, day, period) => {
    return (pinnedSlots || []).some(
      p => p.classId === classId && p.day === day && Number(p.period) === Number(period)
    );
  };

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

  const handleSelectSlot = (classId, day, period, slot) => {
    if (selectedSlotForSwap && selectedSlotForSwap.classId === classId && selectedSlotForSwap.day === day && Number(selectedSlotForSwap.period) === Number(period)) {
      setSelectedSlotForSwap(null);
      setSwapMap(new Map());
      setDraggedSource(null);
      return;
    }

    const sourcePayload = {
      fromPool: false,
      classId,
      teacherId: slot.teacherId,
      day,
      period,
      subject: slot.subject
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
      target: { classId: targetClassId, day, period },
      timetable,
      teachers,
      classrooms,
      settings: { days: daysArray, periodsPerDay: periodsArray.length }
    });
    setDragHoverEval({
      targetClassId,
      day,
      period,
      ...res
    });
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.branch || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Öğretmen matrisi
  const generateTeacherMatrix = () => {
    const matrix = {};
    teachers.forEach(t => {
      matrix[t.id] = {};
      daysArray.forEach(d => { matrix[t.id][d] = {}; });
    });

    Object.keys(timetable).forEach(cId => {
      const className = classrooms.find(c => c.id === cId)?.name || 'Sınıf';
      daysArray.forEach(day => {
        const slots = timetable[cId]?.[day] || [];
        slots.forEach(slot => {
          if (matrix[slot.teacherId] && matrix[slot.teacherId][day]) {
            matrix[slot.teacherId][day][slot.period] = {
              subject: slot.subject,
              className,
              classId: cId
            };
          }
        });
      });
    });
    return matrix;
  };

  const teacherMatrix = generateTeacherMatrix();

  return (
    <div className="space-y-4 relative">
      
      {/* 🧭 ÜST KONTROL BARI */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
        
        {/* Görünüm Değiştirici: Sınıf Çarşafı / Öğretmen Çarşafı */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSheetMode('classes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sheetMode === 'classes'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={14} />
            <span>Tüm Sınıflar Çarşafı</span>
          </button>
          <button
            type="button"
            onClick={() => setSheetMode('teachers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sheetMode === 'teachers'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Tüm Öğretmenler Çarşafı</span>
          </button>
        </div>

        {/* İpucu ve Arama */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-[11px] text-slate-500 hidden md:inline-flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" />
            <span>Dersleri sürükleyip boş hücrelere veya diğer derslerin üzerine bırakabilirsiniz.</span>
          </span>

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={sheetMode === 'classes' ? "Sınıf filtrele... (Örn: 10-A)" : "Öğretmen filtrele..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

      </div>

      {/* 📋 GENİŞ ÇARŞAF TABLO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[750px] relative select-none">
          <table className="w-full border-collapse text-[11px] text-left">
            
            {/* ÜST GÜN VE SAAT BAŞLIKLARI */}
            <thead className="bg-slate-50/95 sticky top-0 z-20 backdrop-blur-xs border-b border-slate-200/80">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-100 z-30 font-black text-slate-700 uppercase tracking-wider text-[10px] min-w-[130px] border-r border-slate-200/80 shadow-2xs">
                  {sheetMode === 'classes' ? 'Şube / Sınıf' : 'Öğretmen'}
                </th>
                {daysArray.map(day => (
                  <th
                    key={day}
                    colSpan={periodsArray.length}
                    className="p-2 text-center font-extrabold text-slate-800 border-r border-slate-200/80 bg-slate-50"
                  >
                    {day}
                  </th>
                ))}
              </tr>
              <tr className="border-t border-slate-200/60 bg-slate-50/80 text-[10px] text-slate-500 font-mono text-center">
                <th className="sticky left-0 bg-slate-100 z-30 border-r border-slate-200/80 p-1">
                  Saatler ➜
                </th>
                {daysArray.map(day => (
                  <React.Fragment key={day}>
                    {periodsArray.map(p => (
                      <th
                        key={`${day}-${p}`}
                        className="p-1 min-w-[58px] max-w-[65px] font-bold border-r border-slate-100 last:border-r-slate-200"
                      >
                        {p}
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* TABLO SATIRLARI */}
            <tbody className="divide-y divide-slate-100 font-sans">
              
              {/* 1. TÜM SINIFLAR GÖRÜNÜMÜ */}
              {sheetMode === 'classes' && filteredClassrooms.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Sabit Sol Sınıf Adı Sütunu */}
                  <td className="p-2.5 sticky left-0 bg-white font-extrabold text-slate-900 border-r border-slate-200/80 shadow-2xs z-10">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-indigo-600 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                  </td>

                  {/* Gün ve Saat Hücreleri */}
                  {daysArray.map(day => (
                    <React.Fragment key={day}>
                      {periodsArray.map(period => {
                        const slots = timetable[c.id]?.[day] || [];
                        const slot = slots.find(s => Number(s.period) === Number(period));
                        const isPinned = slot ? isSlotPinned(c.id, day, period) : false;
                        const teacherObj = slot ? teachers.find(t => t.id === slot.teacherId) : null;
                        const colorStyle = slot ? getCourseColorClass(slot.subject, c.name) : '';

                        const isHovered = dragHoverEval && dragHoverEval.targetClassId === c.id && dragHoverEval.day === day && dragHoverEval.period === period;
                        const isSelected = selectedSlotForSwap && selectedSlotForSwap.classId === c.id && selectedSlotForSwap.day === day && Number(selectedSlotForSwap.period) === Number(period);
                        const isSwapCandidate = selectedSlotForSwap && selectedSlotForSwap.classId === c.id && swapMap.has(`${day}-${period}`);
                        const swapOpp = isSwapCandidate ? swapMap.get(`${day}-${period}`) : null;

                        return (
                          <td
                            key={`${day}-${period}`}
                            onClick={() => {
                              if (isSwapCandidate && swapOpp) {
                                handleExecuteSwapDirectly(swapOpp);
                              }
                            }}
                            className={`p-1 text-center border-r border-slate-100 align-middle min-w-[56px] h-14 transition-all relative ${
                              isHovered 
                                ? dragHoverEval.isValid
                                  ? dragHoverEval.netGapChange < 0
                                    ? 'bg-emerald-100/90 ring-4 ring-emerald-500 ring-inset shadow-xl scale-[1.03] z-30 animate-pulse'
                                    : dragHoverEval.netGapChange > 0
                                      ? 'bg-rose-100/90 ring-4 ring-rose-500 ring-inset shadow-xl scale-[1.03] z-30 animate-pulse'
                                      : 'bg-indigo-100/80 ring-3 ring-indigo-500 ring-inset shadow-md scale-[1.02] z-30'
                                  : 'bg-rose-100/60 ring-2 ring-rose-400 ring-inset'
                                : isSwapCandidate
                                  ? swapOpp?.netGapChange < 0
                                    ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-inset animate-pulse cursor-pointer shadow-xs'
                                    : swapOpp?.netGapChange > 0
                                      ? 'bg-rose-50/80 ring-2 ring-rose-500 ring-inset animate-pulse cursor-pointer shadow-xs'
                                      : 'bg-indigo-50/70 ring-2 ring-indigo-400 ring-inset cursor-pointer'
                                  : isSelected
                                    ? 'bg-indigo-50/90 ring-2 ring-indigo-500 ring-inset'
                                    : ''
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              handleCellHover(c.id, day, period);
                            }}
                            onDragEnter={() => handleCellHover(c.id, day, period)}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDragEnd();
                              if (!handleCellMoveOrSwap) return;
                              try {
                                const raw = e.dataTransfer.getData("text/plain");
                                if (!raw) return;
                                const source = JSON.parse(raw);
                                handleCellMoveOrSwap(c.id, source, { day, period });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            {/* Değiştirilebilir Rozeti */}
                            {isSwapCandidate && swapOpp && (
                              <div className={`absolute -top-1.5 right-1 z-20 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-none animate-pulse ${
                                swapOpp.netGapChange < 0
                                  ? 'bg-emerald-600 ring-2 ring-emerald-300'
                                  : swapOpp.netGapChange > 0
                                    ? 'bg-rose-600 ring-2 ring-rose-300'
                                    : 'bg-indigo-600'
                              }`}>
                                <span>⇄ Değiştir</span>
                                <span className="bg-black/25 px-1 rounded text-[7.5px]">
                                  {swapOpp.currentTotalGaps}➔{swapOpp.newTotalGaps} ({swapOpp.netGapChange < 0 ? `-${Math.abs(swapOpp.netGapChange)}sa` : swapOpp.netGapChange > 0 ? `+${swapOpp.netGapChange}sa` : '±0'})
                                </span>
                                {swapOpp.netGapChange < 0 ? <span>🌟</span> : swapOpp.netGapChange > 0 ? <span>⚠️</span> : null}
                              </div>
                            )}

                            {slot ? (
                              <div
                                draggable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSwapCandidate && swapOpp) {
                                    handleExecuteSwapDirectly(swapOpp);
                                  } else {
                                    handleSelectSlot(c.id, day, period, slot);
                                  }
                                }}
                                onDragStart={(e) => {
                                  const payload = {
                                    fromPool: false,
                                    classId: c.id,
                                    teacherId: slot.teacherId,
                                    day,
                                    period,
                                    subject: slot.subject
                                  };
                                  e.dataTransfer.setData("text/plain", JSON.stringify(payload));
                                  handleDragStart(payload);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`p-1 rounded-lg border transition-all text-center leading-tight cursor-grab active:cursor-grabbing group relative select-none ${
                                  isSelected 
                                    ? 'ring-2 ring-indigo-600 shadow-md scale-95 ' 
                                    : isPinned 
                                      ? 'ring-2 ring-amber-400 shadow-md ' 
                                      : 'hover:shadow-xs hover:scale-[1.02]'
                                } ${colorStyle}`}
                                title={`${slot.subject} (${teacherObj?.name || 'Öğretmen'}) - Seçmek ve takas seçeneklerini görmek için tıklayın`}
                              >
                                {/* Kilit Butonu */}
                                {togglePinSlot && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePinSlot({
                                        classId: c.id,
                                        day,
                                        period,
                                        subject: slot.subject,
                                        teacherId: slot.teacherId
                                      });
                                    }}
                                    className={`absolute -top-1 -left-1 p-0.5 rounded-full text-[8px] transition-all cursor-pointer ${
                                      isPinned 
                                        ? 'bg-amber-400 text-white' 
                                        : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isPinned ? "Kilitli (Açmak için tıklayın)" : "Dersi Kilitle"}
                                  >
                                    <Lock size={8} />
                                  </button>
                                )}

                                <div className="font-extrabold text-[10px] truncate tracking-tight">
                                  {slot.subject}
                                </div>
                                <div className="text-[9px] font-semibold opacity-90 truncate">
                                  {teacherObj?.name ? teacherObj.name.split(' ')[0] : ''}
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={(e) => {
                                  if (isSwapCandidate && swapOpp) {
                                    e.stopPropagation();
                                    handleExecuteSwapDirectly(swapOpp);
                                  }
                                }}
                                className={`w-full h-full border rounded-lg flex items-center justify-center text-[9px] transition-all ${
                                  isSwapCandidate 
                                    ? 'border-emerald-500 bg-emerald-100/50 text-emerald-700 font-extrabold cursor-pointer' 
                                    : 'border-dashed border-slate-200/60 hover:border-indigo-400 text-slate-300 hover:text-indigo-600 cursor-pointer'
                                }`}
                              >
                                {isSwapCandidate ? 'Buraya Taşı' : '+'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </React.Fragment>
                  ))}

                </tr>
              ))}

              {/* 2. TÜM ÖĞRETMENLER GÖRÜNÜMÜ */}
              {sheetMode === 'teachers' && filteredTeachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Sabit Sol Öğretmen Adı Sütunu */}
                  <td className="p-2.5 sticky left-0 bg-white font-extrabold text-slate-900 border-r border-slate-200/80 shadow-2xs z-10">
                    <div className="flex items-center justify-between gap-1">
                      <div 
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => onSelectTeacher && onSelectTeacher(t.id)}
                        title="Bu öğretmenin tekil haftalık programını aç"
                      >
                        <Users size={14} className="text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold">{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{t.branch || 'Genel'}</div>
                        </div>
                      </div>

                      {onSelectTeacher && (
                        <button
                          type="button"
                          onClick={() => onSelectTeacher(t.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
                          title="Öğretmen programına git"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Gün ve Saat Hücreleri */}
                  {daysArray.map(day => (
                    <React.Fragment key={day}>
                      {periodsArray.map(period => {
                        const item = teacherMatrix[t.id]?.[day]?.[period];
                        const isPinned = item ? isSlotPinned(item.classId, day, period) : false;
                        const colorStyle = item ? getCourseColorClass(item.subject, item.className) : '';

                        return (
                          <td
                            key={`${day}-${period}`}
                            className="p-1 text-center border-r border-slate-100 align-middle min-w-[56px] h-14"
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (item) handleCellHover(item.classId, day, period);
                            }}
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
                          >
                            {item ? (
                              <div
                                draggable
                                onDragStart={(e) => {
                                  const payload = {
                                    fromPool: false,
                                    classId: item.classId,
                                    teacherId: t.id,
                                    day,
                                    period,
                                    subject: item.subject
                                  };
                                  e.dataTransfer.setData("text/plain", JSON.stringify(payload));
                                  handleDragStart(payload);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`p-1 rounded-lg border transition-all text-center leading-tight cursor-grab active:cursor-grabbing group relative select-none ${
                                  isPinned ? 'ring-2 ring-amber-400 shadow-md ' : ''
                                } ${colorStyle}`}
                                title={`${item.subject} (${item.className})`}
                              >
                                {togglePinSlot && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePinSlot({
                                        classId: item.classId,
                                        day,
                                        period,
                                        subject: item.subject,
                                        teacherId: t.id
                                      });
                                    }}
                                    className={`absolute -top-1 -left-1 p-0.5 rounded-full text-[8px] transition-all cursor-pointer ${
                                      isPinned 
                                        ? 'bg-amber-400 text-white' 
                                        : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isPinned ? "Kilitli (Açmak için tıklayın)" : "Dersi Kilitle"}
                                  >
                                    <Lock size={8} />
                                  </button>
                                )}

                                <div className="font-extrabold text-[10px] truncate tracking-tight">
                                  {item.className}
                                </div>
                                <div className="text-[9px] font-semibold opacity-90 truncate">
                                  {item.subject}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full border border-dashed border-slate-200/60 hover:border-indigo-400 rounded-lg flex items-center justify-center text-[9px] text-slate-300 hover:text-indigo-600 transition-all cursor-pointer">
                                +
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

      {/* ⚡ CANLI SÜRÜKLE-BIRAK BİLGİ VE BOŞLUK DEĞİŞİM EKRANI (HUD) */}
      {draggedSource && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-4 text-xs max-w-2xl w-[92%] animate-in fade-in slide-in-from-bottom-3 select-none transition-all ${
          dragHoverEval && dragHoverEval.isValid
            ? dragHoverEval.netGapChange < 0
              ? 'bg-slate-950/95 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/60'
              : dragHoverEval.netGapChange > 0
                ? 'bg-slate-950/95 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/60'
                : 'bg-slate-950/95 border-slate-700/80'
            : 'bg-slate-950/95 border-slate-700/80'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 transition-all ${
            dragHoverEval && dragHoverEval.isValid
              ? dragHoverEval.netGapChange < 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : dragHoverEval.netGapChange > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
              : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
          }`}>
            <ArrowRightLeft size={18} />
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



    </div>
  );
}
