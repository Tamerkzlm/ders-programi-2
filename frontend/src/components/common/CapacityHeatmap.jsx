// frontend/src/components/common/CapacityHeatmap.jsx
import React, { useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  Users, 
  Waves, 
  ShieldAlert, 
  ChevronRight 
} from 'lucide-react';

export default function CapacityHeatmap({ 
  teachers = [], 
  classrooms = [], 
  settings = {}, 
  compact = false,
  onDayClick = null 
}) {
  const days = settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const periods = Number(settings?.periodsPerDay) || 8;

  const analysis = useMemo(() => {
    // 1. Toplam okul haftalık ders talebi
    let totalDemandHours = 0;
    (classrooms || []).forEach(c => {
      (c.courses || []).forEach(co => {
        totalDemandHours += Number(co.hoursPerWeek) || 0;
      });
    });

    const numDays = days.length || 5;
    const dailyDemandHours = Math.round(totalDemandHours / numDays);

    // 2. Kayan tercihi olan öğretmenler
    const floatingTeachers = teachers.filter(t => {
      const pref = t.floatingConstraints?.freeDayPreference;
      const half = t.floatingConstraints?.freeHalfDayPreference;
      return (pref && pref !== 'none') || (half && half !== 'none');
    });

    // 3. Gün bazlı kapasite hesaplama
    const dayStats = days.map(day => {
      let daySupplyHours = 0;
      const offTeachers = [];
      const partialTeachers = [];

      teachers.forEach(t => {
        const closed = t.unavailable?.[day] || [];
        const closedCount = closed.length;
        const maxPerDay = Number(t.maxPerDay) || periods;

        if (closedCount >= periods) {
          offTeachers.push(t);
        } else {
          const openCount = Math.max(0, periods - closedCount);
          const effectiveHours = Math.min(maxPerDay, openCount);
          daySupplyHours += effectiveHours;
          if (closedCount > 0) {
            partialTeachers.push({ teacher: t, closedCount });
          }
        }
      });

      const congestionRatio = daySupplyHours > 0 ? (dailyDemandHours / daySupplyHours) : 999;
      const congestionPct = Math.min(150, Math.round(congestionRatio * 100));

      let status = 'healthy'; // 'healthy', 'warning', 'danger'
      if (daySupplyHours < dailyDemandHours || congestionRatio >= 1.0) {
        status = 'danger';
      } else if (congestionRatio >= 0.85) {
        status = 'warning';
      }

      return {
        day,
        demand: dailyDemandHours,
        supply: daySupplyHours,
        congestionPct,
        congestionRatio,
        status,
        offTeachers,
        partialTeachers
      };
    });

    // En kritik ve en rahat günler
    const sortedByCongestion = [...dayStats].sort((a, b) => b.congestionRatio - a.congestionRatio);
    const mostCongested = sortedByCongestion[0];
    const leastCongested = sortedByCongestion[sortedByCongestion.length - 1];
    const hasDanger = dayStats.some(d => d.status === 'danger');
    const hasWarning = dayStats.some(d => d.status === 'warning');

    return {
      totalDemandHours,
      dailyDemandHours,
      floatingCount: floatingTeachers.length,
      floatingTeachers,
      dayStats,
      mostCongested,
      leastCongested,
      hasDanger,
      hasWarning
    };
  }, [teachers, classrooms, settings, days, periods]);

  if (!classrooms || classrooms.length === 0 || teachers.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl border ${analysis.hasDanger ? 'border-rose-300 shadow-rose-50' : analysis.hasWarning ? 'border-amber-300 shadow-amber-50' : 'border-slate-200'} shadow-xs overflow-hidden transition-all`}>
      {/* BAŞLIK & ÖZET ŞERİDİ */}
      <div className={`p-4 border-b ${analysis.hasDanger ? 'bg-rose-50/60 border-rose-200' : analysis.hasWarning ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            analysis.hasDanger 
              ? 'bg-rose-100 text-rose-700' 
              : analysis.hasWarning 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-indigo-100 text-indigo-700'
          }`}>
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Haftalık Okul Kapasite & Darboğaz Haritası
              </h3>
              {analysis.hasDanger && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] animate-pulse">
                  Kritik Darboğaz!
                </span>
              )}
              {!analysis.hasDanger && analysis.hasWarning && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">
                  Sıkışık Günler Var
                </span>
              )}
              {!analysis.hasDanger && !analysis.hasWarning && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
                  Kapasite Dengeli
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Günlük ortalama ders ihtiyacı: <strong className="text-slate-700">{analysis.dailyDemandHours} Saat</strong> | 
              Kayan Tercihli Öğretmen: <strong className="text-indigo-600">{analysis.floatingCount} Kişi</strong>
            </p>
          </div>
        </div>

        {/* REHBERLİK & TAVSİYE İPUCU */}
        <div className="text-right text-[11px] text-slate-600 hidden md:block">
          {analysis.hasDanger ? (
            <span className="text-rose-700 font-bold flex items-center gap-1 justify-end">
              <AlertTriangle size={13} /> {analysis.mostCongested.day} günü öğretmen kapasitesi yetersiz!
            </span>
          ) : analysis.hasWarning ? (
            <span className="text-amber-800 font-bold flex items-center gap-1 justify-end">
              <Info size={13} /> {analysis.mostCongested.day} günü yoğun. Yeni gün kapatmak yerine 'Kayan Boş Gün' verin.
            </span>
          ) : (
            <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
              <CheckCircle2 size={13} /> Tüm günlerde yeterli öğretmen tamponu mevcut.
            </span>
          )}
        </div>
      </div>

      {/* GÜNLÜK ISI KARTLARI */}
      <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(5, days.length)} gap-3`}>
        {analysis.dayStats.map((stat) => {
          const isDanger = stat.status === 'danger';
          const isWarning = stat.status === 'warning';
          
          let cardBg = 'bg-slate-50 border-slate-200';
          let barColor = 'bg-emerald-500';
          let textStatusColor = 'text-emerald-700';

          if (isDanger) {
            cardBg = 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200';
            barColor = 'bg-rose-600';
            textStatusColor = 'text-rose-700';
          } else if (isWarning) {
            cardBg = 'bg-amber-50/40 border-amber-300';
            barColor = 'bg-amber-500';
            textStatusColor = 'text-amber-700';
          }

          return (
            <div 
              key={stat.day}
              onClick={() => onDayClick && onDayClick(stat.day)}
              className={`p-3.5 rounded-xl border ${cardBg} flex flex-col justify-between transition-all ${
                onDayClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-extrabold text-xs text-slate-800">{stat.day}</span>
                  <span className={`text-[11px] font-black ${textStatusColor}`}>
                    %{stat.congestionPct} Doluluk
                  </span>
                </div>

                {/* DOLULUK / DARBOĞAZ ÇUBUĞU */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, stat.congestionPct)}%` }}
                  />
                </div>

                {/* METRİKLER */}
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Mevcut Öğretmen:</span>
                    <strong className="text-slate-800">{stat.supply} Saat</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ders İhtiyacı:</span>
                    <span className="text-slate-600">{stat.demand} Saat</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-500">Tam Kapalı:</span>
                    <span className={`font-bold ${stat.offTeachers.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {stat.offTeachers.length} Öğretmen
                    </span>
                  </div>
                </div>
              </div>

              {/* KAPALI ÖĞRETMENLER LİSTESİ / ETİKETLER */}
              {stat.offTeachers.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1">
                    <ShieldAlert size={11} className="text-rose-500" />
                    Kapalı Öğretmenler:
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {stat.offTeachers.map(t => (
                      <span 
                        key={t.id} 
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold truncate max-w-[120px]"
                        title={t.name}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ALT BİLGİ VE AKILLI REHBER */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Waves size={14} className="text-indigo-600 shrink-0" />
          <span>
            <strong>Kayan Kısıt Avantajı:</strong> Bir öğretmene "Salı Kapalı" demek yerine "1 Gün Kayan Boş" verdiğinizde, yapay zeka boş günü en az yoğun olan güne (örn: <strong>{analysis.leastCongested.day}</strong>) otomatik atar ve okul darboğazını önler.
          </span>
        </div>
      </div>
    </div>
  );
}
