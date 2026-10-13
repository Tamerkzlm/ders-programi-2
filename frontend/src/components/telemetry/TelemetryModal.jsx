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
  Zap
} from 'lucide-react';

export default function TelemetryModal({ solverTimeout = 300, isGenerating = false, stopAtFirstSolution = false }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Saniyeyi mm:ss formatına dönüştürücü
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Geçen süreye göre aşama durumları
  const currentStage = 
    elapsedSeconds < 4 ? 0 :
    elapsedSeconds < 16 ? 1 :
    elapsedSeconds < 36 ? 2 : 3;

  const stages = [
    { id: 0, title: 'Temel Çakışmasız Çözüm', desc: 'Müfredat matrisi, kapalı saatler ve kilitli hücreler taranıyor' },
    { id: 1, title: 'Bitişiklik & Günlük Denge', desc: 'Günde en az 3 saat, blok dersler ve sınıf çakışmasızlığı' },
    { id: 2, title: 'Boşluk & Adalet Dengesi', desc: 'Öğretmenler odası pencereleri ve adil gün dağılımı' },
    { id: 3, title: 'İstisna & Gün Öncelikleri', desc: 'Öncelikli gün doldurma ve son saat tercihleri optimize ediliyor' }
  ];

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* 🚀 ÜST MOTOR DURUM BAŞLIĞI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Cpu size={22} className="animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                stopAtFirstSolution 
                  ? 'text-amber-800 bg-amber-50 border-amber-300' 
                  : 'text-indigo-700 bg-indigo-50 border-indigo-200/60'
              }`}>
                {stopAtFirstSolution ? '⚡ Yıldırım Modu (İlk Çözüm)' : 'OR-Tools CP-SAT Motoru'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Çoklu Çekirdek Paralel Arama</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {stopAtFirstSolution 
                ? 'İlk Geçerli Çözüm Hesaplanıyor (Anında Sonuç)...' 
                : 'Matematiksel Dağıtım ve Optimizasyon İşleniyor'}
            </h3>
          </div>
        </div>

        {/* Canlı Kronometre Kartı */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
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
                  Aşama {idx + 1}
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

      {/* 💡 DAĞITIM MOTORU BİLGİ KARTLARI (LOG YERİNE SADECE BİLGİ KARTLARI) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs">
            <Zap size={16} className="text-indigo-600" />
            <span>Kısıt Yayılımı (Propagation)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Aktif günler arası fark sınırları kaldırılarak algoritma rahatlatıldı. Motor sadece aktif günlerdeki asgari ders saatini gözeterek çözüm arar.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>İstisna Öğretmen Koruması</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Haftada 1-2 gün gelen ve 17 saatten az dersi olan öğretmenler sert kısıt kurallarından muaftır; günleri sıkıştırılarak yerleştirilir.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
            <CalendarCheck size={16} className="text-amber-600" />
            <span>Öncelikli Gün & Son Saatler</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Belirli bir günü tam doldurulması istenen ve son saatleri tercih edilen öğretmenlerin yerleşimleri ağırlıklı puanlama ile öne alınır.
          </p>
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
