// frontend/src/components/common/DemoDataPromptModal.jsx
import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { 
  Building2, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  Users,
  Download,
  GraduationCap
} from 'lucide-react';

export default function DemoDataPromptModal() {
  const { 
    demoDataChoice, 
    loadHzAyseDemoData, 
    loadAbdiIpekciDemoData,
    clearDataForManualEntry, 
    downloadSchoolBackup,
    teachers,
    classrooms,
    settings
  } = useAppStore();

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChooseHzAyse = () => {
    loadHzAyseDemoData();
    showToast("Hz. Ayşe Kız AİHL verileri güvenle yüklendi.");
  };

  const handleChooseAbdi = () => {
    loadAbdiIpekciDemoData(true);
    showToast("Abdi İpekçi Ortaokulu gerçek verileri (35 öğretmen, 20 şube) başarıyla yüklendi.");
  };

  const handleChooseManual = () => {
    clearDataForManualEntry();
    showToast("Sistem temizlendi, manuel giriş modundasınız.");
  };

  const isHzAyse = demoDataChoice === 'demo' || (settings?.schoolName && settings.schoolName.toLowerCase().includes('ayşe'));
  const isAbdi = demoDataChoice === 'abdi' || (settings?.schoolName && settings.schoolName.toLowerCase().includes('abdi'));

  // Eğer demoDataChoice null ise açılış modalı görünür
  const isPromptVisible = demoDataChoice === null || demoDataChoice === undefined;

  return (
    <>
      {/* 🌟 TOAST MESAJI */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in duration-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 1. AÇILIŞ SORU PENCERESİ */}
      {isPromptVisible && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-7 space-y-5 relative">
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Hangi Okul Verileriyle Başlamak İstersiniz?
                </h2>
                <p className="text-xs text-slate-500">
                  Gerçek okul veri setlerinden birini seçebilir veya sıfırdan kendi okulunuzu ekleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* SEÇENEK 1: HZ. AYŞE */}
              <button
                type="button"
                onClick={handleChooseHzAyse}
                className="group text-left p-4 rounded-2xl border-2 border-indigo-500/80 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-600 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Lise AİHL
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Hz. Ayşe Kız AİHL
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    35 öğretmen, 18 lise şubesi (günde 8 ders saati) ve ders kodları.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs font-bold text-indigo-700">
                  <span>Yükle</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* SEÇENEK 2: ABDİ İPEKÇİ */}
              <button
                type="button"
                onClick={handleChooseAbdi}
                className="group text-left p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Yeni Gerçek Test Verisi
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Abdi İpekçi Ortaokulu
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    PDF'ten doğrulanmış 35 öğretmen, 20 şube (5,6,7,8. sınıflar, günde 7 saat).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Yükle</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* SEÇENEK 3: MANUEL */}
              <button
                type="button"
                onClick={handleChooseManual}
                className="group text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Sıfırdan
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Manuel Sıfır Mod
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Tüm tablolar temizlenir, öğretmen ve sınıfları elle eklersiniz.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Sıfırdan Başla</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 2. SAYFA ÜSTÜ HIZLI KONTROL ŞERİDİ (ÇOKLU OKUL PROFİL ÇUBUĞU) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-6 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isAbdi
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isHzAyse 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            {isAbdi ? <GraduationCap size={18} /> : isHzAyse ? <Building2 size={18} /> : <Users size={18} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              isAbdi
                ? 'bg-emerald-100 text-emerald-800'
                : isHzAyse
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {settings?.schoolName || 'Okul Ders Programı'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {teachers.length} Öğretmen • {classrooms.length} Sınıf • Günde {settings?.periodsPerDay || 8} Saat
            </span>
          </div>
        </div>

        {/* Eylem Butonları */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* HZ. AYŞE GEÇİŞİ */}
          {!isHzAyse && (
            <button
              type="button"
              onClick={handleChooseHzAyse}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Hz. Ayşe verilerine geç (mevcut okul otomatik hafızaya kaydedilir)"
            >
              <RefreshCw size={12} />
              <span>Hz. Ayşe'ye Geç</span>
            </button>
          )}

          {/* ABDİ İPEKÇİ GEÇİŞİ */}
          {!isAbdi && (
            <button
              type="button"
              onClick={handleChooseAbdi}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Abdi İpekçi Ortaokulu verilerine geç (mevcut okul otomatik hafızaya kaydedilir)"
            >
              <GraduationCap size={13} />
              <span>Abdi İpekçi'ye Geç</span>
            </button>
          )}

          {/* TEK TIKLA YEDEK İNDİR */}
          <button
            type="button"
            onClick={downloadSchoolBackup}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Şu an açık olan okulun tüm verilerini bilgisayarına JSON olarak indir"
          >
            <Download size={13} />
            <span>Yedeği İndir (JSON)</span>
          </button>

          {/* SIFIRLAMA */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Dikkat! Sistemdeki veriler temizlenecek ve manuel moda geçilecektir. Devam etmek istiyor musunuz?")) {
                handleChooseManual();
              }
            }}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Verileri temizle"
          >
            <Trash2 size={12} />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>
    </>
  );
}
