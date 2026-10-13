// frontend/src/components/common/DemoDataPromptModal.jsx
import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { 
  Building2, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  Users
} from 'lucide-react';

export default function DemoDataPromptModal() {
  const { 
    demoDataChoice, 
    loadHzAyseDemoData, 
    clearDataForManualEntry, 
    teachers,
    classrooms
  } = useAppStore();

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChooseDemo = () => {
    loadHzAyseDemoData();
    showToast("Hz. Ayşe Kız AİHL örnek verileri yüklendi.");
  };

  const handleChooseManual = () => {
    clearDataForManualEntry();
    showToast("Sistem temizlendi, manuel giriş modundasınız.");
  };

  // Eğer demoDataChoice null ise açılış modalı görünür
  const isPromptVisible = demoDataChoice === null || demoDataChoice === undefined;

  return (
    <>
      {/* 🌟 1. AÇILIŞ SORU PENCERESİ */}
      {isPromptVisible && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 space-y-5 relative">
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Hz. Ayşe Kız AİHL Örnek Verileri Eklensin mi?
                </h2>
                <p className="text-xs text-slate-500">
                  Hazır okul verileriyle hemen başlayabilir veya sıfırdan kendi verilerinizi girebilirsiniz.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* SEÇENEK 1: EVET */}
              <button
                type="button"
                onClick={handleChooseDemo}
                className="group text-left p-4 rounded-2xl border-2 border-indigo-500/80 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-600 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Önerilen
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Evet, Örnek Verileri Yükle
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    35 öğretmen, 18 şube ve ders kodlarıyla (MAT9, EDB9...) hazır yüklenir.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs font-bold text-indigo-700">
                  <span>Yükle</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* SEÇENEK 2: HAYIR */}
              <button
                type="button"
                onClick={handleChooseManual}
                className="group text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Manuel
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Hayır, Manuel Olarak Ekle
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Veritabanı sıfırlanır, kendi öğretmen ve sınıflarınızı eklersiniz.
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

      {/* 🌟 2. SAYFA ÜSTÜ HIZLI KONTROL ŞERİDİ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            demoDataChoice === 'demo' || demoDataChoice === null 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {demoDataChoice === 'demo' || demoDataChoice === null ? <Building2 size={16} /> : <Users size={16} />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              demoDataChoice === 'demo' || demoDataChoice === null
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {demoDataChoice === 'demo' || demoDataChoice === null ? 'Hz. Ayşe Kız AİHL Örnek Verileri' : 'Manuel Veri Modu'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {teachers.length} Öğretmen • {classrooms.length} Sınıf
            </span>
          </div>
        </div>

        {/* Eylem Butonları */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {demoDataChoice === 'manual' ? (
            <button
              type="button"
              onClick={handleChooseDemo}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw size={12} />
              <span>Hz. Ayşe Örnek Verilerini Yükle</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Tüm veriler silinecektir. Devam etmek istiyor musunuz?")) {
                  handleChooseManual();
                }
              }}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 size={12} />
              <span>Verileri Sıfırla (Manuel Mod)</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
