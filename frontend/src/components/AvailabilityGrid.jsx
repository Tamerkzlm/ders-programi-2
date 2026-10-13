// frontend/src/components/AvailabilityGrid.jsx
import { useState, useEffect } from 'react';
import { RefreshCcw, Calendar, AlertTriangle, Sunrise, Sunset, CheckCircle2, Lock, Unlock } from 'lucide-react';

export default function AvailabilityGrid({ settings, teacher, onChange, totalAssignedHours = 0 }) {
  const { days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'], periodsPerDay = 8 } = settings || {};
  const [localUnavailable, setLocalUnavailable] = useState(teacher.unavailable || {});
  
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
      // 1'den half'a kadar tüm günlerde kapat
      days.forEach(d => {
        const current = new Set(newState[d] || []);
        for (let p = 1; p <= half; p++) current.add(p);
        newState[d] = Array.from(current).sort((a, b) => a - b);
      });
    } else if (preset === 'afternoon_close') {
      // (half+1)'den periodsPerDay'e kadar tüm günlerde kapat
      days.forEach(d => {
        const current = new Set(newState[d] || []);
        for (let p = half + 1; p <= periodsPerDay; p++) current.add(p);
        newState[d] = Array.from(current).sort((a, b) => a - b);
      });
    } else if (preset === 'clear') {
      // Tümünü aç
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" onMouseLeave={handleMouseUp}>
      
      {/* ÜST BAŞLIK & HAZIR ŞABLONLAR */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-indigo-600" size={16} />
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs">Haftalık Müsaitlik & Kapalı Saatler</h3>
            <p className="text-[10px] text-slate-500">Kutucukları tıklayarak veya sürükleyerek uygun/kapalı yapın</p>
          </div>
        </div>

        {/* Hızlı Şablon Butonları */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <button 
            type="button"
            onClick={() => applyPreset('morning_close')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
            title="Tüm günlerde sabah ilk yarı derslerini kapatır"
          >
            <Sunrise size={12} className="text-amber-600" /> Sabahları Kapat
          </button>
          
          <button 
            type="button"
            onClick={() => applyPreset('afternoon_close')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer"
            title="Tüm günlerde öğleden sonraki dersleri kapatır"
          >
            <Sunset size={12} className="text-purple-600" /> Öğleden Sonra Kapat
          </button>

          <button 
            type="button"
            onClick={() => applyPreset('clear')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Tüm kapalı saatleri açar"
          >
            <RefreshCcw size={11} /> Tümünü Aç
          </button>
        </div>
      </div>

      {/* CANLI KAPASİTE GÖSTERGE ŞERİDİ */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
          <span>Toplam Okul: <strong className="text-slate-800">{totalSlots} sa</strong></span>
          <span className="text-slate-300">•</span>
          <span>Kapalı: <strong className="text-rose-600">{closedSlotsCount} sa</strong></span>
          <span className="text-slate-300">•</span>
          <span>Açık Vakit: <strong className="text-emerald-700">{openSlotsCount} sa</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {totalAssignedHours > 0 && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              isCapacityExceeded 
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                : marginHours <= 2 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {isCapacityExceeded ? (
                <>
                  <AlertTriangle size={11} className="text-rose-600" />
                  Kapasite Yetersiz ({marginHours} sa açık)!
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  Yük: {totalAssignedHours} sa / Pay: +{marginHours} sa
                </>
              )}
            </span>
          )}
        </div>
      </div>
      
      {/* 🚨 KRİTİK KAPASİTE UYARISI */}
      {isCapacityExceeded && (
        <div className="bg-rose-50 border-b border-rose-200 p-3 flex gap-2.5 text-rose-800 text-xs">
          <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="text-[11px] leading-relaxed font-semibold">
            <strong>Kritik Kapasite Uyarısı:</strong> Öğretmene toplam <strong>{totalAssignedHours} saat</strong> ders atanmıştır, ancak takvimde yalnızca <strong>{openSlotsCount} saat</strong> açık vakit bırakılmıştır. Dağıtım motorunun programı oluşturabilmesi için lütfen kapalı saatlerden en az {Math.abs(marginHours)} saati açınız.
          </div>
        </div>
      )}

      {/* MATRİS TABLOSU */}
      <div className="p-3 overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="p-1.5 border border-slate-200 bg-slate-100/70 w-16 text-[10px] text-slate-500 font-extrabold text-center">
                Saat / Gün
              </th>
              {days.map(day => {
                const dayClosedCount = (localUnavailable[day] || []).length;
                const isFullDayClosed = dayClosedCount === periodsPerDay;

                return (
                  <th key={day} className="p-1.5 border border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 text-center">
                    <button 
                      type="button"
                      onClick={() => toggleWholeDay(day)} 
                      className="hover:text-indigo-600 hover:underline cursor-pointer flex flex-col items-center justify-center w-full"
                      title={`${day} gününün tüm saatlerini aç / kapat`}
                    >
                      <span>{day}</span>
                      <span className={`text-[9px] font-black px-1 rounded ${
                        isFullDayClosed ? 'bg-rose-200 text-rose-800' : dayClosedCount > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400 font-normal'
                      }`}>
                        {isFullDayClosed ? 'Tam Kapalı' : dayClosedCount > 0 ? `${dayClosedCount}k` : 'Açık'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map(period => (
              <tr key={period}>
                <td className="p-1 border border-slate-200 text-center bg-slate-50">
                  <button
                    type="button"
                    onClick={() => togglePeriodAcrossDays(period)}
                    className="w-full py-1 text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                    title={`${period}. dersi tüm haftada aç / kapat`}
                  >
                    {period}. Ders
                  </button>
                </td>
                {days.map(day => {
                  const closed = (localUnavailable[day] || []).includes(period);
                  return (
                    <td key={`${day}-${period}`} className="p-1 border border-slate-200">
                      <button
                        type="button"
                        onMouseDown={() => handleMouseDown(day, period)}
                        onMouseEnter={() => handleMouseEnter(day, period)}
                        className={`w-full h-8 flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer select-none text-[10px] font-black tracking-wide border ${
                          closed 
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 shadow-2xs' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-2xs'
                        }`}
                        title={closed ? 'Kapalı (Tıklayarak aç)' : 'Uygun (Tıklayarak kapat)'}
                      >
                        {closed ? (
                          <>
                            <Lock size={10} className="text-rose-600" />
                            <span>KAPALI</span>
                          </>
                        ) : (
                          <>
                            <Unlock size={10} className="text-emerald-600" />
                            <span>UYGUN</span>
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>💡 İpucu: Gün başlıklarına tıklayarak tüm günü, ders numaralarına tıklayarak o saati tüm haftada değiştirebilirsiniz.</span>
        <span>Sürükleyerek toplu boyama yapabilirsiniz</span>
      </div>

    </div>
  );
}
