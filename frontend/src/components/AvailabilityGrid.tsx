// frontend/src/components/AvailabilityGrid.jsx
import { useState, useEffect } from 'react';
import { RefreshCcw, Calendar, AlertTriangle, Sunrise, Sunset, CheckCircle2, Lock, Unlock, CalendarDays } from 'lucide-react';

export default function AvailabilityGrid({ settings, teacher, onChange, totalAssignedHours = 0 }: any) {
  const { days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'], periodsPerDay = 8 } = settings || {};
  const [localUnavailable, setLocalUnavailable] = useState<Record<string, number[]>>(teacher.unavailable || {});
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); 

  useEffect(() => {
    setLocalUnavailable(teacher.unavailable || {});
  }, [teacher.unavailable]);

  const handleMouseDown = (day, period) => {
    setIsDragging(true);
    const isClosed = localUnavailable[day]?.includes(period);
    const newMode = isClosed ? 'open' : 'close';
    setDragMode(newMode);
    applyChange(day, period, newMode, localUnavailable);
  };

  const handleMouseEnter = (day, period) => {
    if (isDragging && dragMode) {
      applyChange(day, period, dragMode, localUnavailable);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const applyChange = (day, period, mode, currentState) => {
    const newState = { ...currentState };
    if (!newState[day]) newState[day] = [];

    if (mode === 'close') {
      if (!newState[day].includes(period)) {
        newState[day] = [...newState[day], period].sort((a, b) => a - b);
      }
    } else if (mode === 'open') {
      newState[day] = newState[day].filter(p => p !== period);
      if (newState[day].length === 0) delete newState[day];
    }

    setLocalUnavailable(newState);
    onChange(teacher.id, newState);
  };

  const toggleWholeDay = (day) => {
    const newState = { ...localUnavailable };
    const allPeriods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

    if (newState[day]?.length === periodsPerDay) {
      delete newState[day]; 
    } else {
      newState[day] = allPeriods; 
    }
    setLocalUnavailable(newState);
    onChange(teacher.id, newState);
  };

  // Belirli bir ders saatini (örn. 1. Ders) tüm günlerde toplu aç/kapat
  const togglePeriodAcrossDays = (period) => {
    const newState = { ...localUnavailable };
    const allClosedForPeriod = days.every(d => (newState[d] || []).includes(period));

    days.forEach(d => {
      if (!newState[d]) newState[d] = [];
      if (allClosedForPeriod) {
        newState[d] = newState[d].filter(p => p !== period);
        if (newState[d].length === 0) delete newState[d];
      } else {
        if (!newState[d].includes(period)) {
          newState[d] = [...newState[d], period].sort((a, b) => a - b);
        }
      }
    });

    setLocalUnavailable(newState);
    onChange(teacher.id, newState);
  };

  // Hazır şablonlar (Presets)
  const applyPreset = (preset) => {
    const newState = { ...localUnavailable };
    const half = Math.floor(periodsPerDay / 2);

    if (preset === 'morning_close') {
      days.forEach((d: string) => {
        const current = new Set<number>(newState[d] || []);
        for (let p = 1; p <= half; p++) current.add(p);
        newState[d] = Array.from(current).sort((a, b) => a - b);
      });
    } else if (preset === 'afternoon_close') {
      days.forEach((d: string) => {
        const current = new Set<number>(newState[d] || []);
        for (let p = half + 1; p <= periodsPerDay; p++) current.add(p);
        newState[d] = Array.from(current).sort((a, b) => a - b);
      });
    } else if (preset === 'clear') {
      setLocalUnavailable({});
      onChange(teacher.id, {});
      return;
    }

    setLocalUnavailable(newState);
    onChange(teacher.id, newState);
  };

  // Kapasite hesaplamaları
  const totalSlots = (days?.length || 5) * (periodsPerDay || 8);
  const closedSlotsCount = Object.values(localUnavailable).reduce((acc, curr) => acc + curr.length, 0);
  const openSlotsCount = totalSlots - closedSlotsCount;
  const isCapacityExceeded = openSlotsCount < totalAssignedHours;
  const marginHours = openSlotsCount - totalAssignedHours;

  const priorityDay = teacher.priorityFullDay || '';
  const fillLate = Boolean(teacher.fillLateHours);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col" onMouseLeave={handleMouseUp}>
      
      {/* ÜST BAŞLIK & HAZIR ŞABLONLAR */}
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="text-indigo-600 shrink-0" size={15} />
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs leading-tight">Sabit Boş Gün & Saat Kapatma Tablosu</h3>
            <p className="text-[10px] text-slate-500">Gün adına tıklayarak tam günü, kutucukları sürükleyerek saatleri kapatın/açın</p>
          </div>
        </div>

        {/* Hızlı Şablon Butonları */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
          <button 
            type="button"
            onClick={() => applyPreset('morning_close')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
            title="Tüm günlerde sabah ilk yarı derslerini kapatır"
          >
            <Sunrise size={11} className="text-amber-600" /> Sabahları Kapat
          </button>
          
          <button 
            type="button"
            onClick={() => applyPreset('afternoon_close')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer"
            title="Tüm günlerde öğleden sonraki dersleri kapatır"
          >
            <Sunset size={11} className="text-purple-600" /> Öğleden Sonra Kapat
          </button>

          <button 
            type="button"
            onClick={() => applyPreset('clear')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title="Tüm kapalı saatleri açar"
          >
            <RefreshCcw size={10} /> Tümünü Aç
          </button>
        </div>
      </div>

      {/* CANLI KAPASİTE GÖSTERGE ŞERİDİ */}
      <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2.5 font-medium text-slate-600">
          <span>Toplam: <strong className="text-slate-800">{totalSlots} sa</strong></span>
          <span className="text-slate-300">•</span>
          <span>Kapalı: <strong className="text-rose-600">{closedSlotsCount} sa</strong></span>
          <span className="text-slate-300">•</span>
          <span>Açık: <strong className="text-emerald-700">{openSlotsCount} sa</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {totalAssignedHours > 0 && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              isCapacityExceeded 
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                : marginHours <= 2 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {isCapacityExceeded ? (
                <>
                  <AlertTriangle size={10} className="text-rose-600" />
                  Kapasite Yetersiz ({marginHours} sa)!
                </>
              ) : (
                <>
                  <CheckCircle2 size={10} className="text-emerald-600" />
                  Ders Yükü: {totalAssignedHours} sa (Pay: +{marginHours} sa)
                </>
              )}
            </span>
          )}
        </div>
      </div>
      
      {/* 🚨 KRİTİK KAPASİTE UYARISI */}
      {isCapacityExceeded && (
        <div className="bg-rose-50 border-b border-rose-200 px-3 py-2 flex gap-2 text-rose-800 text-[11px] items-center">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <div className="leading-snug font-semibold">
            <strong>Kapasite Uyarısı:</strong> Öğretmene <strong>{totalAssignedHours} saat</strong> ders atanmış ancak <strong>{openSlotsCount} saat</strong> açık bırakılmış. En az {Math.abs(marginHours)} saat daha açmalısınız.
          </div>
        </div>
      )}

      {/* MATRİS TABLOSU */}
      <div className="p-2 overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="p-1 border border-slate-200 bg-slate-100/70 w-14 text-[10px] text-slate-500 font-extrabold text-center">
                Saat \ Gün
              </th>
              {days.map(day => {
                const dayClosedCount = (localUnavailable[day] || []).length;
                const isFullDayClosed = dayClosedCount === periodsPerDay;
                const isPriorityDay = priorityDay === day;

                return (
                  <th
                    key={day}
                    className={`p-1 border border-slate-200 text-[11px] font-bold text-center transition-colors ${
                      isFullDayClosed
                        ? 'bg-rose-50/90 text-rose-900'
                        : isPriorityDay
                          ? 'bg-indigo-50/90 text-indigo-900'
                          : 'bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <button 
                      type="button"
                      onClick={() => toggleWholeDay(day)} 
                      className="hover:text-indigo-600 cursor-pointer flex flex-col items-center justify-center w-full gap-0.5"
                      title={`${day} gününün tüm saatlerini kapat (Boş Gün yap) veya aç`}
                    >
                      <span className="leading-tight">{day}</span>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          isFullDayClosed
                            ? 'bg-rose-500 text-white'
                            : dayClosedCount > 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                        }`}>
                          {isFullDayClosed ? 'BOŞ GÜN' : dayClosedCount > 0 ? `${dayClosedCount} Sa Kapalı` : 'Tam Açık'}
                        </span>
                        {isPriorityDay && !isFullDayClosed && (
                          <span className="text-[8px] font-black px-1 rounded bg-indigo-600 text-white flex items-center gap-0.5" title="Öncelikli tam doldurulacak gün">
                            <CalendarDays size={8} /> Dolu
                          </span>
                        )}
                      </div>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map(period => {
              const isLatePeriod = period >= periodsPerDay - 1;
              return (
                <tr key={period}>
                  <td className="p-0.5 border border-slate-200 text-center bg-slate-50">
                    <button
                      type="button"
                      onClick={() => togglePeriodAcrossDays(period)}
                      className="w-full py-1 text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                      title={`${period}. dersi tüm haftada aç / kapat`}
                    >
                      {period}. Saat
                    </button>
                  </td>
                  {days.map(day => {
                    const closed = (localUnavailable[day] || []).includes(period);
                    const isPriorityDay = priorityDay === day;
                    const isPriorityLateHighlight = isPriorityDay && fillLate && isLatePeriod && !closed;

                    return (
                      <td key={`${day}-${period}`} className="p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onMouseDown={() => handleMouseDown(day, period)}
                          onMouseEnter={() => handleMouseEnter(day, period)}
                          className={`w-full h-7 flex items-center justify-center gap-1 rounded-md transition-all cursor-pointer select-none text-[10px] font-black tracking-wide border ${
                            closed 
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300' 
                              : isPriorityLateHighlight
                                ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border-indigo-400 ring-1 ring-indigo-300'
                                : isPriorityDay
                                  ? 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border-indigo-200'
                                  : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title={
                            closed
                              ? 'Kapalı (Tıklayarak aç)'
                              : isPriorityLateHighlight
                                ? `${day} son saat kesin dolu öncelikli (Tıklayarak kapat)`
                                : isPriorityDay
                                  ? `${day} tam doldurma öncelikli (Tıklayarak kapat)`
                                  : 'Uygun (Tıklayarak kapat)'
                          }
                        >
                          {closed ? (
                            <>
                              <Lock size={9} className="text-rose-600 shrink-0" />
                              <span>KAPALI</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={9} className={isPriorityDay ? "text-indigo-600 shrink-0" : "text-emerald-600 shrink-0"} />
                              <span>{isPriorityLateHighlight ? 'SON SA. DOLU' : isPriorityDay ? 'ÖNCELİKLİ' : 'UYGUN'}</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-1.5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-medium">
        <span>💡 Gün başlığına tıklayarak sabit boş gün verebilir, saat numarasına tıklayarak o saati tüm haftada kapatabilirsiniz.</span>
        <span>Fareyle basılı tutup sürükleyebilirsiniz</span>
      </div>

    </div>
  );
}

