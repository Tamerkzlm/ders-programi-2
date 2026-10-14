// frontend/src/pages/Generate.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom'; 
import { 
  Cpu, 
  Play, 
  RotateCcw, 
  XCircle, 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  Clock,
  Trash2,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Waves,
  Sun,
  X
} from 'lucide-react';
import TelemetryModal from '../components/telemetry/TelemetryModal';

export default function Generate() {
  const { 
    classrooms, 
    hardPrefs, 
    setHardPrefs, 
    generateResult, 
    setGenerateResult, 
    isGenerating, 
    startGeneration,
    pinnedSlots,
    recalculateMetrics,
    timetable,
    resetTimetable
  } = useAppStore();

  const navigate = useNavigate(); 
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  useEffect(() => {
    if (timetable && Object.keys(timetable).length > 0) {
      recalculateMetrics?.();
    }
  }, [timetable, recalculateMetrics]);

  const metrics = generateResult?.metrics;

  const totalAssignedSlots = useMemo(() => {
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

  const hasExistingTimetable = totalAssignedSlots > 0;

  const handleConfirmReset = (clearPins) => {
    resetTimetable(clearPins);
    setIsResetModalOpen(false);
    setResetSuccessMessage(clearPins 
      ? 'Ders programı ve kilitli dersler başarıyla sıfırlandı. Sıfırdan yeni dağıtım başlatabilirsiniz.' 
      : 'Ders programı sıfırlandı (kilitli dersler korundu). Sıfırdan yeni dağıtım başlatabilirsiniz.'
    );
    setTimeout(() => setResetSuccessMessage(''), 5000);
  };

  const timeoutOptions = [
    { label: '⚡ Yıldırım Modu: İlk Geçerli Çözümde Dur (1 - 3 Saniye)', value: 'first' },
    { label: 'Hızlı Test (60 Sn / 1 Dk)', value: '60' },
    { label: 'Dengeli Dağıtım (300 Sn / 5 Dk - Önerilen)', value: '300' },
    { label: 'Gelişmiş Optimizasyon (900 Sn / 15 Dk)', value: '900' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto transition-all duration-300 space-y-6">
      
      {/* ÜST BAŞLIK & DURUM */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
          <h1 className="text-xl font-black text-slate-800 mt-1">Dağıtım Motoru</h1>
        </div>

        <div className="flex items-center gap-2">
          {hasExistingTimetable && !isGenerating && (
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 size={13} className="text-rose-600" />
              <span>Programı Sıfırla</span>
            </button>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold animate-pulse">
              <Cpu size={15} className="animate-spin" />
              <span>Motor Çalışıyor...</span>
            </div>
          )}
        </div>
      </div>

      {/* SIFIRLAMA BAŞARI BİLDİRİMİ */}
      {resetSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button type="button" onClick={() => setResetSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* MEVCUT PROGRAM BİLGİLENDİRME VE SIFIRLAMA ŞERİDİ */}
      {hasExistingTimetable && !isGenerating && !generateResult?.success && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div className="text-xs font-bold text-slate-800">
              Kayıtlı Ders Programı Aktif ({totalAssignedSlots} Saat)
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} className="text-rose-600" />
              <span>Programı Sıfırla (Temizle)</span>
            </button>
          </div>
        </div>
      )}

      {/* HATA VE DETAYLI ÇAKIŞMA TEŞHİS PANELİ */}
      {!isGenerating && generateResult && !generateResult.success && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm shrink-0">
              <XCircle size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-rose-950 tracking-tight">{generateResult.message}</h3>
              <p className="text-xs text-rose-700 font-medium">
                Matematiksel çözücü aşağıdaki kısıt çelişkileri veya kapasite yetersizlikleri nedeniyle kilitlendi:
              </p>
            </div>
          </div>

          {/* TEŞHİS MADDELERİ */}
          <div className="space-y-2 bg-white/80 p-4 rounded-xl border border-rose-200">
            <div className="text-[11px] font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-rose-600" />
              <span>Nokta Atışı Çözümsüzlük Teşhis Raporu:</span>
            </div>
            <ul className="space-y-2 text-xs">
              {generateResult.warnings && generateResult.warnings.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 text-rose-900">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed font-semibold">{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* TEKRAR DENE VEYA SIFIRLA */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button 
              type="button"
              onClick={() => setGenerateResult(null)} 
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Uyarıyı Kapat ve Tekrar Dene
            </button>
            <button 
              type="button"
              onClick={() => setIsResetModalOpen(true)} 
              className="text-xs bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-800 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Mevcut Programı Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* DAĞITIM TETİKLEME KARTI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        
        {!isGenerating && (!generateResult || !generateResult.success) && (
          <div className="space-y-4">
            
            {/* KİLİTLİ DERSLER BİLGİLENDİRMESİ */}
            {pinnedSlots && pinnedSlots.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
                  📌
                </div>
                <div className="text-xs space-y-0.5">
                  <span className="font-black text-amber-950 block">
                    📌 {pinnedSlots.length} Ders Kilitlendi (Yeri Korunacak)
                  </span>
                  <span className="text-amber-800 text-[11px] leading-relaxed block">
                    Algoritma bu kilitli derslerin gün ve saatlerine asla dokunmayacak; yalnızca açıkta kalan dersleri yeniden dağıtacaktır.
                  </span>
                </div>
              </div>
            )}

            {/* DAĞITIM MODU VE SÜRE SEÇİCİ */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={15} className="text-indigo-600" />
                Dağıtım Modu & Optimizasyon Süresi:
              </label>
              <select
                value={hardPrefs?.stopAtFirstSolution ? 'first' : String(hardPrefs?.solverTimeout || 300)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'first') {
                    setHardPrefs({ stopAtFirstSolution: true, solverTimeout: 30 });
                  } else {
                    setHardPrefs({ stopAtFirstSolution: false, solverTimeout: Number(val) });
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {timeoutOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {hardPrefs?.stopAtFirstSolution
                  ? '⚡ Yıldırım Modu: Kural ihlalsiz ilk geçerli çakışmasız program bulunduğu milisaniyede aramayı durdurur ve anında ekrana basar (1-3 saniye).'
                  : 'Kısıtları yoğun okullarda 300 saniye (5 dk), pencereleri en aza indiren en adil dağılımı sağlar.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={startGeneration} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Play size={16} /> 
                <span>
                  {pinnedSlots && pinnedSlots.length > 0
                    ? `Kilitli ${pinnedSlots.length} Dersi Koru & Kalanları Dağıt`
                    : 'Dağıtımı Başlat (Arka Planda Çalışır)'}
                </span>
              </button>

              {hasExistingTimetable && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Mevcut dağıtımı temizleyip sıfırdan başlamak için"
                >
                  <RotateCcw size={15} />
                  <span>Programı Sıfırla</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* ÇALIŞMA ESNASINDA CANLI TELEMETRİ & LOG TERMİNALİ */}
        {isGenerating && (
          <div className="w-full">
            <TelemetryModal 
              solverTimeout={hardPrefs?.solverTimeout || 300} 
              isGenerating={isGenerating} 
              stopAtFirstSolution={Boolean(hardPrefs?.stopAtFirstSolution)}
            />
          </div>
        )}

        {/* BAŞARILI SONUÇ EKRANI */}
        {!isGenerating && generateResult && generateResult.success && (
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl font-bold border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400">HESAPLANAN SÜRE</div>
                <div className="text-slate-800 text-sm">{metrics?.solveTimeSeconds || 0}s</div>
                <div className="text-[9px] text-slate-400">Motor Süresi</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl font-bold border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400">ATANAN DERS</div>
                <div className="text-emerald-700 text-sm">{metrics?.totalAssigned || 0} Sa</div>
                <div className="text-[9px] text-emerald-600 font-bold">%100 Tamam</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl font-bold border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400">TOPLAM PENCERE</div>
                <div className="text-indigo-600 text-sm">{metrics?.totalSchoolGaps || 0} Sa</div>
                <div className="text-[9px] text-slate-400">Okul Boşluğu</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl font-bold border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400">ORT. PENCERE</div>
                <div className="text-purple-600 text-sm">{metrics?.averageSchoolGaps || 0} Sa</div>
                <div className="text-[9px] text-slate-400">Öğretmen Başı</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl font-bold border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400">MEDYAN PENCERE</div>
                <div className="text-teal-600 text-sm">{metrics?.medianSchoolGaps ?? 0} Sa</div>
                <div className="text-[9px] text-slate-400">Merkez Değer</div>
              </div>

              {/* 📅 BOŞ GÜN VERİLMEYEN */}
              <div className={`p-2.5 rounded-xl font-bold border flex flex-col justify-between ${
                (metrics?.countWithoutFreeDay || 0) > 0 
                  ? 'bg-rose-50/70 border-rose-200' 
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase">BOŞ GÜN VERİLMEYEN</div>
                <div className={`text-sm font-black ${
                  (metrics?.countWithoutFreeDay || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {metrics?.countWithoutFreeDay ?? 0} Kişi
                </div>
                <div className="text-[9px] text-slate-500">
                  {(metrics?.floatingDayFailed || 0) > 0 
                    ? `(${metrics.floatingDayFailed} kayan talep)` 
                    : 'Haftanın tümü dolu'}
                </div>
              </div>

              {/* ☀️ YARIM GÜN BOŞ VERİLMEYEN */}
              <div className={`p-2.5 rounded-xl font-bold border flex flex-col justify-between ${
                (metrics?.countWithoutHalfDay || 0) > 0 
                  ? 'bg-amber-50/70 border-amber-200' 
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase">YARIM GÜN VERİLMEYEN</div>
                <div className={`text-sm font-black ${
                  (metrics?.countWithoutHalfDay || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {metrics?.countWithoutHalfDay ?? 0} Kişi
                </div>
                <div className="text-[9px] text-slate-500">
                  {(metrics?.floatingHalfFailed || 0) > 0 
                    ? `(${metrics.floatingHalfFailed} kayan talep)` 
                    : 'Sabah & öğle dolu'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button 
                type="button"
                onClick={() => navigate('/timetable')} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Tabloyu Görüntüle</span>
                <ArrowRight size={14} />
              </button>

              <button 
                type="button"
                onClick={() => setGenerateResult(null)} 
                className="text-[11px] border border-slate-200 px-4 py-2.5 rounded-xl text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} /> 
                <span>Yeni Dağıtım Kur</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsResetModalOpen(true)} 
                className="text-[11px] border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-rose-700 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> 
                <span>Programı Sıfırla</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 📋 NİHAİ RAPOR: BOŞ GÜN & YARIM GÜN BOŞLUK DETAYLI ANALİZİ */}
      {!isGenerating && generateResult && generateResult.success && metrics && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-indigo-600" />
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Nihai Rapor: Boş Gün & Yarım Gün Dağılım İstatistiği
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Öğretmenlerin haftalık tam boş gün ve yarım gün (sabah serbest / öğleden sonra serbest) durumları
                </p>
              </div>
            </div>

            {/* Kayan Tercih Başarı Özeti */}
            {((metrics.floatingDayRequested || 0) > 0 || (metrics.floatingHalfRequested || 0) > 0) && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                  <Waves size={12} className="text-cyan-600" />
                  Kayan Tercih: {(metrics.floatingDayRequested || 0) + (metrics.floatingHalfRequested || 0)} Talep | {((metrics.floatingDayFailed || 0) + (metrics.floatingHalfFailed || 0)) === 0 ? 'Tümü Sağlandı ✓' : `${(metrics.floatingDayFailed || 0) + (metrics.floatingHalfFailed || 0)} Sağlanamadı`}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KART 1: BOŞ GÜN VERİLMEYENLER */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              (metrics.countWithoutFreeDay || 0) > 0 
                ? 'bg-rose-50/40 border-rose-200' 
                : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={14} className={(metrics.countWithoutFreeDay || 0) > 0 ? "text-rose-600" : "text-emerald-600"} />
                    Boş Günü Olmayan Öğretmenler
                  </span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    (metrics.countWithoutFreeDay || 0) > 0 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {metrics.countWithoutFreeDay ?? 0} Kişi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Haftanın tüm günlerinde dersi olan ve okulda tam boş günü bulunmayan öğretmenler.
                </p>

                {metrics.teachersWithoutFreeDay && metrics.teachersWithoutFreeDay.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {metrics.teachersWithoutFreeDay.map((t, idx) => (
                      <div 
                        key={t.id || idx}
                        onClick={() => navigate('/timetable', { state: { teacherId: t.id, viewMode: 'teacher' } })}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{t.name}</span>
                          <ArrowRight size={11} className="text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {t.load} Sa / {t.activeDays || 5} Gün
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold text-xs bg-emerald-100/60 p-2.5 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={15} /> Harika! Tüm öğretmenlerin en az 1 tam boş günü var.
                  </div>
                )}
              </div>
            </div>

            {/* KART 2: YARIM GÜN VERİLMEYENLER */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              (metrics.countWithoutHalfDay || 0) > 0 
                ? 'bg-amber-50/40 border-amber-200' 
                : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Clock size={14} className={(metrics.countWithoutHalfDay || 0) > 0 ? "text-amber-600" : "text-emerald-600"} />
                    Yarım Gün Boşluğu Olmayanlar
                  </span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    (metrics.countWithoutHalfDay || 0) > 0 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {metrics.countWithoutHalfDay ?? 0} Kişi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Hiçbir gün sabahı (geç geliş) veya öğleden sonrası (erken çıkış) serbest olmayan öğretmenler.
                </p>

                {metrics.teachersWithoutHalfDay && metrics.teachersWithoutHalfDay.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {metrics.teachersWithoutHalfDay.map((t, idx) => (
                      <div 
                        key={t.id || idx}
                        onClick={() => navigate('/timetable', { state: { teacherId: t.id, viewMode: 'teacher' } })}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{t.name}</span>
                          <ArrowRight size={11} className="text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                          {t.load} Sa Yük
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold text-xs bg-emerald-100/60 p-2.5 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={15} /> Harika! Tüm öğretmenlerin en az 1 yarım günü serbest.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kayan Tercih Verilemeyenler Özel Uyarısı */}
          {((metrics.floatingDayFailed || 0) > 0 || (metrics.floatingHalfFailed || 0) > 0) && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-700" />
                <span>Kayan Tercih Bildirip Karşılanamayan Öğretmenler:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {metrics.floatingDayFailedTeachers?.map((ft, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-amber-200 flex justify-between">
                    <span className="font-bold text-slate-800">{ft.name}</span>
                    <span className="text-rose-600 font-medium">{ft.reason}</span>
                  </div>
                ))}
                {metrics.floatingHalfFailedTeachers?.map((ft, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-amber-200 flex justify-between">
                    <span className="font-bold text-slate-800">{ft.name}</span>
                    <span className="text-amber-700 font-medium">{ft.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MEDYAN ÜSTÜ BOŞLUK RAPORU */}
      {!isGenerating && generateResult && generateResult.success && metrics && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-800 font-bold text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <h2>Okul Medyanı ({metrics.medianSchoolGaps ?? 0} Saat) Üzerinde Penceresi Olan Öğretmenler</h2>
              <span className="text-[10px] text-slate-400 font-normal">(İdareciler hariç)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 Doğrudan programına gitmek için öğretmene tıklayın
            </span>
          </div>
          
          {((metrics.teachersAboveMedian && metrics.teachersAboveMedian.length > 0) || 
            (metrics.teachersAboveAverage && metrics.teachersAboveAverage.length > 0)) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {(metrics.teachersAboveMedian || metrics.teachersAboveAverage).map((t, idx) => (
                <div 
                  key={t.id || idx} 
                  onClick={() => {
                    navigate('/timetable', { state: { teacherId: t.id, viewMode: 'teacher' } });
                  }}
                  className="bg-amber-50/70 hover:bg-indigo-50/80 border border-amber-200 hover:border-indigo-400 p-3 rounded-xl flex justify-between items-center text-xs cursor-pointer transition-all hover:shadow-md group"
                  title={`${t.name} haftalık ders programına git`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-800 group-hover:text-indigo-700 truncate">{t.name}</span>
                    <ArrowRight size={12} className="text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <span className="bg-amber-200 group-hover:bg-indigo-200 text-amber-900 group-hover:text-indigo-950 font-black px-2.5 py-0.5 rounded-lg text-[11px] shrink-0">
                    {t.gaps} Pencere
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-medium">
              Harika! Okul genelinde medyan üzerinde penceresi olan öğretmen yok.
            </div>
          )}
        </div>
      )}

      {/* UYARI VE İHLAL LİSTESİ */}
      {!isGenerating && generateResult && generateResult.success && generateResult.warnings && generateResult.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <ShieldAlert size={16} className="text-amber-700" />
            <h2>İhlaller ve Raporlar</h2>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-amber-800 font-medium max-h-64 overflow-y-auto pr-2">
            {generateResult.warnings.map((v, idx) => (
              <li key={idx}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ⚠️ PROGRAMI SIFIRLAMA ONAY MODALI */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-start gap-3 bg-rose-50/70">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Ders Programını Sıfırla</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mevcut programı temizleyip sıfırdan dağıtım yapmak üzeresiniz.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Ders programını sıfırladığınızda, sınıfların haftalık gün ve saat dağılımları temizlenir.
                <strong> Öğretmenleriniz, sınıflarınız ve ders yükleriniz kesinlikle silinmez, aynen korunur.</strong>
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">Sıfırlama Seçenekleri:</div>
                <div className="text-slate-500">
                  • <strong>Kilitleri Koru:</strong> Yalnızca serbest dersler temizlenir, kilitlediğiniz dersler kalır.
                </div>
                <div className="text-slate-500">
                  • <strong>Tümünü Sıfırla:</strong> Kilitli olanlar dahil tüm saat yerleşimleri sıfırlanır.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                İptal
              </button>

              {pinnedSlots && pinnedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleConfirmReset(false)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Kilitleri Koru & Sıfırla
                </button>
              )}

              <button
                type="button"
                onClick={() => handleConfirmReset(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tüm Programı Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
