// frontend/src/components/telemetry/TelemetryModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  Server,
  CalendarCheck,
  Zap,
  TrendingDown,
  Users,
  Terminal
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export default function TelemetryModal({ solverTimeout = 300, isGenerating = false, stopAtFirstSolution = false }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      setLiveData(null);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Canlı çözücü ilerlemesini (polling) çek
  useEffect(() => {
    if (!isGenerating) return;
    let isMounted = true;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/solve/progress`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setLiveData(data);
          }
        }
      } catch {
        // Ağ gecikmesi durumunda sessizce devam et
      }
    };

    fetchProgress();
    const pollInterval = setInterval(fetchProgress, 800);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isGenerating]);

  // Saniyeyi mm:ss formatına dönüştürücü
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Canlı aşama varsa onu kullan, yoksa süreye göre yedek aşama göster
  const currentStage = liveData && typeof liveData.stageIndex === 'number'
    ? liveData.stageIndex
    : elapsedSeconds < 4 ? 0 :
      elapsedSeconds < 16 ? 1 :
      elapsedSeconds < 36 ? 2 : 3;

  const stages = [
    { id: 0, title: 'Matematiksel Model & Ön Analiz', desc: 'Müfredat matrisi, kapalı saatler ve kilitli hücreler taranıyor' },
    { id: 1, title: 'Aşama 1: Tam Kısıtlı Arama', desc: 'Tüm kurallar ve günlük sınıf yükü sınırları aktif olarak çözülüyor' },
    { id: 2, title: 'Aşama 2: Nokta Atışı Esnetme', desc: 'Sadece darboğaz oluşan öğretmen-sınıf ikililerinde lokal esnetme' },
    { id: 3, title: 'Aşama 3: Minimum Kısıt & Kurtarma', desc: 'Temel çakışmasızlık korunarak geçerli çizelge aranıyor' }
  ];

  const solutionsFound = liveData?.solutionsFound ?? 0;
  const initialGaps = liveData?.initialGaps;
  const currentGaps = liveData?.currentGaps;
  const hardestTeachers = liveData?.hardestTeachers || [];
  const feed = liveData?.feed || [];
  const totalActivities = liveData?.totalActivities || 0;
  const numVariables = liveData?.numVariables || 0;

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* 🚀 ÜST MOTOR DURUM BAŞLIĞI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Cpu size={22} className="animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                stopAtFirstSolution 
                  ? 'text-amber-800 bg-amber-50 border-amber-300' 
                  : 'text-indigo-700 bg-indigo-50 border-indigo-200/60'
              }`}>
                {stopAtFirstSolution ? '⚡ Yıldırım Modu (İlk Çözüm)' : 'OR-Tools CP-SAT Motoru'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Canlı Telemetri Aktif</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {liveData?.stageTitle || (stopAtFirstSolution 
                ? 'İlk Geçerli Çözüm Hesaplanıyor (Anında Sonuç)...' 
                : 'Matematiksel Dağıtım ve Optimizasyon İşleniyor')}
            </h3>
            {liveData?.stageDesc && (
              <p className="text-xs text-slate-500 mt-0.5">{liveData.stageDesc}</p>
            )}
          </div>
        </div>

        {/* Canlı Kronometre Kartı */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl shrink-0">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
            <Clock size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Geçen Süre
            </span>
            <span className="text-lg font-mono font-black text-slate-900 leading-none">
              {formatTime(elapsedSeconds)}
              <span className="text-xs text-slate-400 font-normal ml-1">
                {stopAtFirstSolution ? '/ Hızlı (1-5s)' : `/ ${formatTime(solverTimeout)}`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 📈 CANLI OPTİMİZASYON METRİKLERİ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Bulunan Çözüm Sayısı */}
        <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
              Bulunan Geçerli Çözüm
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {solutionsFound > 0 ? `${solutionsFound}. Çözüm` : 'Aranıyor...'}
            </div>
            <span className="text-[10px] text-slate-500">
              {solutionsFound > 0 ? 'Her yeni çözümde kalite artar' : 'İlk çakışmasız yerleşim kuruluyor'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0">
            <Sparkles size={18} />
          </div>
        </div>

        {/* Anlık Pencere (Boş Saat) Düşüşü */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
              Anlık Okul Penceresi (Boşluk)
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              {currentGaps !== null && currentGaps !== undefined ? (
                <>
                  {initialGaps !== null && initialGaps !== currentGaps && (
                    <span className="text-xs text-slate-400 line-through font-bold">{initialGaps}</span>
                  )}
                  <span className="text-emerald-700">{currentGaps} Saat</span>
                </>
              ) : (
                <span className="text-slate-400 text-sm font-bold">Hesaplanıyor...</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              {initialGaps !== null && currentGaps !== null && initialGaps > currentGaps
                ? `İlk çözüme göre ${initialGaps - currentGaps} saat pencere eritildi`
                : 'Öğretmen ara boşlukları minimize ediliyor'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <TrendingDown size={18} />
          </div>
        </div>

        {/* Model Karmaşıklığı */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
              Matematiksel Uzay Boyutu
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {totalActivities > 0 ? `${totalActivities} Blok` : 'Hazırlanıyor'}
            </div>
            <span className="text-[10px] text-slate-500">
              {numVariables > 0 ? `${numVariables.toLocaleString('tr-TR')} olasılık değişkeni` : 'Kısıt matrisi derleniyor'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
            <Layers size={18} />
          </div>
        </div>
      </div>

      {/* 📊 AŞAMA VE İTERASYON KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stages.map((st, idx) => {
          const isDone = currentStage > idx;
          const isCurrent = currentStage === idx;
          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                isCurrent 
                  ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs ring-1 ring-indigo-200' 
                  : isDone 
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-700' 
                    : 'bg-slate-50/50 border-slate-200/60 opacity-60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold text-[11px] ${isCurrent ? 'text-indigo-800' : isDone ? 'text-emerald-800' : 'text-slate-500'}`}>
                  Adım {idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : isCurrent ? (
                  <Activity size={14} className="text-indigo-600 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                )}
              </div>
              <div className="font-extrabold text-xs text-slate-900 leading-snug">
                {st.title}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 🔥 EN ZORLAYAN ÖĞRETMEN DÜĞÜMLERİ & CANLI ÇÖZÜCÜ AKIŞI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Sol: En Darboğaz / En Sıkışık Öğretmenler */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
              <Users size={15} className="text-rose-600" />
              <span>En Zorlayan Öğretmen Düğümleri (Darboğaz Analizi)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Ders Yükü / Açık Saat</span>
          </div>
          
          {hardestTeachers.length > 0 ? (
            <div className="space-y-1.5">
              {hardestTeachers.map((ht, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate">{ht.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {ht.load} Sa Ders / {ht.openSlots} Açık Saat
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      %{ht.density} Yoğunluk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center">
              Öğretmen kısıt yoğunlukları hesaplanıyor...
            </div>
          )}
        </div>

        {/* Sağ: Canlı Çözücü Akışı (Feed) */}
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
              <Terminal size={15} />
              <span>Canlı Çözücü Akışı (Gerçek Zamanlı)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">CP-SAT Callback</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px] pr-1">
            {feed.length > 0 ? (
              feed.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{item.time}s]</span>
                  <span className={
                    ['solution', 'success', 'improve'].includes(item.type) ? 'text-emerald-300 font-bold' :
                    item.type === 'warn' ? 'text-amber-300 font-bold' :
                    item.type === 'error' ? 'text-rose-400 font-bold' :
                    'text-slate-300'
                  }>
                    {item.msg}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 py-4 text-center">
                Motor başlatılıyor, ilk geri bildirim bekleniyor...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ℹ️ ARKA PLAN BİLGİLENDİRME BARI */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Server size={15} className="text-indigo-600 shrink-0" />
          <span className="text-[11px] font-medium">
            Dağıtım işlemi arka planda yürütülmektedir. Bu ekranda beklemeden diğer sayfalara geçebilir, işlem bittiğinde sonuçları inceleyebilirsiniz.
          </span>
        </div>
      </div>

    </div>
  );
}

