import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle, 
  Clock, 
  Calendar, 
  UserCheck, 
  Building2, 
  RefreshCw, 
  Trash2
} from 'lucide-react';
import DemoDataPromptModal from '../components/common/DemoDataPromptModal';

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    demoDataChoice, 
    loadHzAyseDemoData, 
    clearDataForManualEntry, 
    teachers,
    classrooms
  } = useAppStore();

  const [successMessage, setSuccessMessage] = useState('');

  const [schoolName, setSchoolName] = useState(settings?.schoolName || '');
  const [principalName, setPrincipalName] = useState(settings?.principalName || '');
  const [periodsPerDay, setPeriodsPerDay] = useState(settings?.periodsPerDay || 8);
  const [periodDuration, setPeriodDuration] = useState(settings?.periodDuration || 40);
  const [breakDuration, setBreakDuration] = useState(settings?.breakDuration || 10);
  const [startTime, setStartTime] = useState(settings?.startTime || '08:00');
  const [lunchBreakAfter, setLunchBreakAfter] = useState(settings?.lunchBreakAfter || 5);
  const [lunchBreakDuration, setLunchBreakDuration] = useState(settings?.lunchBreakDuration || 60);

  const allWeekDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const [selectedDays, setSelectedDays] = useState(settings?.days || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]);

  useEffect(() => {
    if (settings?.schoolName) setSchoolName(settings.schoolName);
    if (settings?.principalName) setPrincipalName(settings.principalName);
    if (settings?.days) setSelectedDays(settings.days);
    if (settings?.periodsPerDay) setPeriodsPerDay(settings.periodsPerDay);
  }, [settings?.schoolName, settings?.principalName, settings?.days, settings?.periodsPerDay]);

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      const updated = [...selectedDays, day];
      const sorted = allWeekDays.filter(d => updated.includes(d));
      setSelectedDays(sorted);
    }
  };

  const handleLoadDemo = () => {
    loadHzAyseDemoData();
    setSchoolName("Hz. Ayşe Kız Anadolu İmam Hatip Lisesi");
    setPrincipalName("Cemil Murat Kuru");
    setSuccessMessage('Hz. Ayşe Kız AİHL örnek verileri yüklendi.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleClearData = () => {
    if (window.confirm("Tüm öğretmen, sınıf ve dersler temizlenecektir. Onaylıyor musunuz?")) {
      clearDataForManualEntry();
      setSchoolName("Okul Ders Programı");
      setPrincipalName("Okul Müdürü");
      setSuccessMessage('Sistem temizlendi, manuel giriş moduna geçildi.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    updateSettings({
      schoolName,
      principalName,
      days: selectedDays,
      periodsPerDay: parseInt(periodsPerDay),
      periodDuration: parseInt(periodDuration),
      breakDuration: parseInt(breakDuration),
      startTime,
      lunchBreakAfter: parseInt(lunchBreakAfter),
      lunchBreakDuration: parseInt(lunchBreakDuration),
    });

    setSuccessMessage('Ayarlar başarıyla kaydedildi.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 transition-all duration-300">
      
      {/* İLK GİRİŞ KARAR PENCERESİ */}
      <DemoDataPromptModal />

      <div className="border-b border-gray-200 pb-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-blue-600" size={22} /> Kurum Ayarları
        </h1>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* OKUL VERİ SETİ KONTROLÜ (DAİMA AKTİF) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              {demoDataChoice === 'demo' || demoDataChoice === null 
                ? 'Hz. Ayşe Kız AİHL Örnek Veri Seti' 
                : 'Manuel Veri Giriş Modu'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {teachers.length} Öğretmen • {classrooms.length} Sınıf
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} />
            <span>Hz. Ayşe Örnek Verilerini Yükle</span>
          </button>

          <button
            type="button"
            onClick={handleClearData}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Verileri Sıfırla (Manuel Mod)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* KART 1: KURUM VE YETKİLİ BİLGİLERİ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide border-b border-gray-100 pb-2">
            Kurum & Yetkili Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Okul Adı</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600 flex items-center gap-1">
                <UserCheck size={13} className="text-gray-400"/> Okul Müdürü
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Cemil Murat Kuru"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* KART 2: HAFTALIK AKTİF ÇALIŞMA GÜNLERİ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide border-b border-gray-100 pb-2">
            <Calendar size={14} className="text-blue-600" /> Haftalık Çalışma Günleri
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {allWeekDays.map((day) => {
              const isChecked = selectedDays.includes(day);
              return (
                <label key={day} onClick={() => handleDayToggle(day)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold cursor-pointer select-none transition-all ${isChecked ? 'bg-blue-50/70 border-blue-400 text-blue-700 shadow-2xs' : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={isChecked} readOnly className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none w-3.5 h-3.5" />
                  <span>{day}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* KART 3: GÜNLÜK DERS & TENEFFÜS YAPISI */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide border-b border-gray-100 pb-2">
            <Clock size={14} className="text-blue-600" /> Günlük Ders & Teneffüs Saatleri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Günlük Ders Saati</label>
              <input type="number" min="1" max="12" value={periodsPerDay} onChange={(e) => setPeriodsPerDay(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Ders Süresi (dk)</label>
              <input type="number" min="10" max="90" value={periodDuration} onChange={(e) => setPeriodDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Teneffüs Süresi (dk)</label>
              <input type="number" min="0" max="60" value={breakDuration} onChange={(e) => setBreakDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600">İlk Ders Başlangıcı</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800 cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Öğle Arası Kaçıncı Dersten Sonra?</label>
              <input type="number" min="1" max="8" value={lunchBreakAfter} onChange={(e) => setLunchBreakAfter(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Öğle Arası Süresi (dk)</label>
              <input type="number" min="10" max="120" value={lunchBreakDuration} onChange={(e) => setLunchBreakDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all">
            <Save size={15} /> Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}