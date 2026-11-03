// frontend/src/pages/KelebekPlanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { store } from '../utils/kelebek/store';
import { runAlgorithm } from '../utils/kelebek/algorithm';
import { DEFAULT_STUDENTS } from '../utils/kelebek/defaultStudents';

import CapacityBar from '../components/kelebek/CapacityBar';
import StepIndicator from '../components/kelebek/StepIndicator';
import Step1ExamInfo from '../components/kelebek/Step1ExamInfo';
import Step2Students from '../components/kelebek/Step2Students';
import Step3Rooms from '../components/kelebek/Step3Rooms';
import Step4Options from '../components/kelebek/Step4Options';
import Step5Plan from '../components/kelebek/Step5Plan/index';

const DEMO_ROOMS = [
  '9A', '9B', '9C', '9D', '9H',
  '10A', '10B', '10C', '10D',
  '11A', '11B', '11C', '11D', '11E',
  '12A', '12B', '12C', '12D', '12H',
].map((name, i) => ({ id: `room-${i}-${Date.now()}`, name, rows: 5, cols: 3 }));

export default function KelebekPlanner() {
  const navigate = useNavigate();
  const { classrooms, settings } = useAppStore();

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [examInfo, setExamInfo] = useState(store.getExamInfo());
  const [students, setStudents] = useState(store.getStudents());
  const [rooms, setRooms] = useState(store.getRooms());
  const [activeGrades, setActiveGrades] = useState(store.getActiveGrades());
  const [separatePairs, setSeparatePairs] = useState(store.getSeparatePairs());
  const [plan, setPlan] = useState(store.getPlan());
  const [error, setError] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => { store.setExamInfo(examInfo); }, [examInfo]);
  useEffect(() => { store.setStudents(students); }, [students]);
  useEffect(() => { store.setRooms(rooms); }, [rooms]);
  useEffect(() => { store.setActiveGrades(activeGrades); }, [activeGrades]);
  useEffect(() => { store.setSeparatePairs(separatePairs); }, [separatePairs]);

  // If rooms is empty but appStore classrooms exist, pre-fill them
  useEffect(() => {
    if (rooms.length === 0 && classrooms && classrooms.length > 0) {
      const initialRooms = classrooms.map((c, i) => ({
        id: `room-app-${c.id || i}-${Date.now()}`,
        name: c.name,
        rows: 5,
        cols: 3,
      }));
      setRooms(initialRooms);
    }
  }, [classrooms]);

  // localStorage'dan yüklenince maxStep'i ayarla
  useEffect(() => {
    let max = 1;
    if (students.length > 0) max = Math.max(max, 2);
    if (rooms.length > 0) max = Math.max(max, 3);
    if (rooms.length > 0 && students.length > 0) max = Math.max(max, 4);
    if (plan) max = Math.max(max, 5);
    setMaxStep(max);
  }, [students.length, rooms.length, plan]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const goToStep = (n) => {
    setError(null);
    setStep(n);
    setMaxStep(prev => Math.max(prev, n));
  };

  const handleNext = (n) => {
    goToStep(n);
  };

  const handleGenerate = () => {
    setError(null);
    try {
      const newPlan = runAlgorithm(students, rooms, activeGrades, separatePairs);
      setPlan(newPlan);
      store.setPlan(newPlan);
      goToStep(5);
      showToast('Kelebek sınav oturma düzeni başarıyla oluşturuldu!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegenerate = () => {
    setError(null);
    try {
      const newPlan = runAlgorithm(students, rooms, activeGrades, separatePairs);
      setPlan(newPlan);
      store.setPlan(newPlan);
      showToast('Kelebek dağıtım planı yeni oturma düzeniyle güncellendi!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetAll = () => {
    localStorage.removeItem('kelebek_exam_info');
    localStorage.removeItem('kelebek_students');
    localStorage.removeItem('kelebek_rooms');
    localStorage.removeItem('kelebek_plan');
    localStorage.removeItem('kelebek_active_grades');
    localStorage.removeItem('kelebek_separate_pairs');

    setExamInfo({
      okulAdi: settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL',
      sinavDersi: '',
      sinavTarihi: '',
      sinavTuru: 'Ortak Sınav',
      sinavSaati: '2. Ders (09:20)',
    });
    setStudents([]);
    setRooms([]);
    setPlan(null);
    setActiveGrades(['9', '10', '11', '12']);
    setSeparatePairs([]);
    setStep(1);
    setMaxStep(1);
    setError(null);
    setShowResetModal(false);
    showToast('Tüm kelebek sınav verileri sıfırlandı. Yeni sınava başlayabilirsiniz.');
  };

  const handleLoadDemo = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const demoInfo = {
      okulAdi: settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL',
      sinavDersi: 'Matematik',
      sinavTarihi: `${day}.${month}.${year}`,
      sinavTuru: '1. Dönem 1. Yazılı',
      sinavSaati: '2. Ders (09:20)',
    };
    const demoStudents = DEFAULT_STUDENTS.map((s, idx) => ({
      ...s,
      id: `std-demo-${idx}-${Date.now()}`,
    }));

    setExamInfo(demoInfo);
    setStudents(demoStudents);
    setRooms(DEMO_ROOMS);
    setActiveGrades(['9', '10', '11', '12']);
    setPlan(null);
    store.clearPlan();
    setStep(1);
    setMaxStep(4);
    showToast('Örnek sınav bilgileri, öğrenci listesi ve salonlar başarıyla yüklendi!');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 pb-16">
      {/* ÜST KURUMSAL HEADER */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all shadow-2xs cursor-pointer group"
              title="Merkezi Modül Portalına Dön"
            >
              <ArrowLeft size={17} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl select-none shadow-2xs">
                🦋
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight">Kelebek Sistemi</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Sınav Dağıtım Pro
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  {settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL'} &nbsp;·&nbsp; Karma Salon & Oturma Planı
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hızlı Demo Butonu */}
            <button
              onClick={handleLoadDemo}
              title="Sistemi hızlıca test etmek için örnek verileri yükler"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Örnek Demo Yükle</span>
            </button>

            {/* Sıfırla / Yeni Sınav */}
            <button
              onClick={() => setShowResetModal(true)}
              title="Tüm verileri temizle ve sıfırdan başla"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Yeni Sınav (Sıfırla)</span>
            </button>

            {/* Modül Değiştir */}
            <button
              onClick={() => navigate('/')}
              title="Merkezi Modül Portalına Dön"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              <span>Modül Değiştir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Kapasite Takip Çubuğu */}
      <CapacityBar students={students} rooms={rooms} activeGrades={activeGrades} />

      {/* Adım Göstergesi */}
      <div className="max-w-6xl mx-auto px-4">
        <StepIndicator currentStep={step} maxStep={maxStep} onStepClick={goToStep} />
      </div>

      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs sm:text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hata Bildirimi */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-800 flex items-center gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold px-2 py-1 rounded cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Ana İçerik */}
      <main className="max-w-6xl mx-auto px-4">
        {step === 1 && (
          <Step1ExamInfo examInfo={examInfo} onChange={setExamInfo} onNext={() => handleNext(2)} />
        )}
        {step === 2 && (
          <Step2Students students={students} onChange={setStudents} onNext={() => handleNext(3)} onBack={() => goToStep(1)} />
        )}
        {step === 3 && (
          <Step3Rooms rooms={rooms} onChange={setRooms} onNext={() => handleNext(4)} onBack={() => goToStep(2)} />
        )}
        {step === 4 && (
          <Step4Options
            students={students}
            rooms={rooms}
            activeGrades={activeGrades}
            onGradesChange={setActiveGrades}
            separatePairs={separatePairs}
            onSeparatePairsChange={setSeparatePairs}
            onGenerate={handleGenerate}
            onBack={() => goToStep(3)}
          />
        )}
        {step === 5 && plan && (
          <Step5Plan plan={plan} examInfo={examInfo} onBack={() => goToStep(4)} onRegenerate={handleRegenerate} />
        )}
      </main>

      {/* Sıfırlama Onay Modalı */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Yeni Sınav Başlat / Sıfırla</h3>
                <p className="text-xs text-slate-500 font-semibold">Tüm mevcut oturum temizlenecek</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Mevcut sınav bilgileri, yüklenen tüm öğrenciler, tanımlanan salonlar ve üretilen oturma planı kalıcı olarak silinecektir. Devam etmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 ALT BİLGİ (HAZIRLAYAN) */}
      <footer className="print:hidden border-t border-slate-200/80 bg-white py-3.5 px-6 mt-10 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kelebek Sistemi — Karma Salon Sınav Dağıtım Modülü</span>
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>Hazırlayan: Tamer Közleme</span>
            <span className="text-slate-300">|</span>
            <a
              href="https://instagram.com/Tamerkzlm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              instagram: Tamerkzlm
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
