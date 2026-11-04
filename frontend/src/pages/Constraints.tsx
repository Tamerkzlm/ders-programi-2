// frontend/src/pages/Constraints.jsx
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  Save, 
  CheckCircle, 
  Clock, 
  Scale, 
  Layers, 
  BookOpen, 
  Sun, 
  Flame, 
  RotateCcw,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import CapacityHeatmap from '../components/common/CapacityHeatmap';

export default function Constraints() {
  const navigate = useNavigate();
  const { hardPrefs, setHardPrefs, softPrefs, updateSoftPrefs, teachers, classrooms, settings } = useAppStore();

  // Sert ve yumuşak kısıtların yerel durumu
  const [hard, setHard] = useState({
    enforceMaxGaps: hardPrefs?.enforceMaxGaps ?? true,
    maxGapsPerDay: hardPrefs?.maxGapsPerDay ?? 2,
    enforceDailyBalance: hardPrefs?.enforceDailyBalance ?? true,
    minDailyHours: hardPrefs?.minDailyHours ?? 3,
    enforceConsecutiveClassRules: hardPrefs?.enforceConsecutiveClassRules ?? true,
    enforceIntensiveRules: hardPrefs?.enforceIntensiveRules ?? true,
    maxHoursPerIntensiveCourse: hardPrefs?.maxHoursPerIntensiveCourse ?? 4,
    solverTimeout: hardPrefs?.solverTimeout ?? 300,
    stopAtFirstSolution: hardPrefs?.stopAtFirstSolution ?? false
  });

  const [soft, setSoft] = useState({
    minimizeGaps: softPrefs?.minimizeGaps ?? true,
    gapPenalty: softPrefs?.gapPenalty ?? 40,
    earlyStart: softPrefs?.earlyStart ?? true,
    earlyStartPenalty: softPrefs?.earlyStartPenalty ?? 20,
    avoidStemLate: softPrefs?.avoidStemLate ?? true,
    stemLatePenalty: softPrefs?.stemLatePenalty ?? 35
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'teacher', 'pedagogic', 'solver'
  const [saved, setSaved] = useState(false);

  // Ceza katsayılarını 4 kademeli sezgisel seviyeye çevirici
  const getEarlyStartLevel = () => {
    if (!soft.earlyStart || soft.earlyStartPenalty === 0) return 'off';
    if (soft.earlyStartPenalty <= 15) return 'low';
    if (soft.earlyStartPenalty <= 30) return 'medium';
    return 'high';
  };

  const setEarlyStartLevel = (level) => {
    if (level === 'off') {
      setSoft({ ...soft, earlyStart: false, earlyStartPenalty: 0 });
    } else if (level === 'low') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 10 });
    } else if (level === 'medium') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 20 });
    } else if (level === 'high') {
      setSoft({ ...soft, earlyStart: true, earlyStartPenalty: 50 });
    }
  };

  const getStemLateLevel = () => {
    if (!soft.avoidStemLate || soft.stemLatePenalty === 0) return 'off';
    if (soft.stemLatePenalty <= 20) return 'low';
    if (soft.stemLatePenalty <= 45) return 'medium';
    return 'high';
  };

  const setStemLateLevel = (level) => {
    if (level === 'off') {
      setSoft({ ...soft, avoidStemLate: false, stemLatePenalty: 0 });
    } else if (level === 'low') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 15 });
    } else if (level === 'medium') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 35 });
    } else if (level === 'high') {
      setSoft({ ...soft, avoidStemLate: true, stemLatePenalty: 70 });
    }
  };

  const handleSave = () => {
    setHardPrefs(hard);
    updateSoftPrefs(soft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultHard = {
      enforceMaxGaps: true,
      maxGapsPerDay: 2,
      enforceDailyBalance: true,
      minDailyHours: 3,
      enforceConsecutiveClassRules: true,
      enforceIntensiveRules: true,
      maxHoursPerIntensiveCourse: 4,
      solverTimeout: 300,
      stopAtFirstSolution: false
    };
    const defaultSoft = {
      minimizeGaps: true,
      gapPenalty: 40,
      earlyStart: true,
      earlyStartPenalty: 20,
      avoidStemLate: true,
      stemLatePenalty: 35
    };
    setHard(defaultHard);
    setSoft(defaultSoft);
    setHardPrefs(defaultHard);
    updateSoftPrefs(defaultSoft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 4 Kademeli Sezgisel Rozet Bileşeni
  const PriorityBadges = ({ currentLevel, onChange, labels = {} as any }: any) => {
    const levels = [
      { id: 'off', label: labels.off || 'Kapalı' },
      { id: 'low', label: labels.low || 'Düşük' },
      { id: 'medium', label: labels.medium || 'Dengeli' },
      { id: 'high', label: labels.high || 'Tavizsiz' }
    ];

    const getColors = (id, active) => {
      if (!active) return 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent';
      switch (id) {
        case 'off': return 'bg-gray-800 text-white border-gray-900 shadow-xs';
        case 'low': return 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs font-bold';
        case 'medium': return 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold';
        case 'high': return 'bg-purple-700 text-white border-purple-800 shadow-md font-extrabold';
        default: return '';
      }
    };

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {levels.map((lvl) => {
          const active = currentLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onChange(lvl.id)}
              className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${getColors(lvl.id, active)}`}
            >
              <div className="font-bold">{lvl.label}</div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ÜST BAŞLIK VE KONTROLLER */}
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            type="button"
            onClick={() => navigate('/generate')} 
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors mb-1"
          >
            ← Dağıtım Motoruna Dön
          </button>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sliders className="text-blue-600" size={24} /> 
            Kural ve Öncelikler
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={handleResetDefaults} 
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Varsayılanlar</span>
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {saved ? <CheckCircle size={16} className="text-green-300 animate-pulse" /> : <Save size={16} />}
            <span>{saved ? 'Kaydedildi' : 'Kuralları Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* BAŞARI MESAJI BİLDİRİMİ */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <span>Kurallar başarıyla kaydedildi.</span>
        </div>
      )}

      {/* 📊 HAFTALIK OKUL KAPASİTE & DARBOĞAZ ISI HARİTASI */}
      <CapacityHeatmap 
        teachers={teachers} 
        classrooms={classrooms} 
        settings={settings} 
      />

      {/* KATEGORİ FİLTRELEME SEKMELERİ */}
      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Tüm Kurallar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Öğretmen Konforu & Boşluk
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pedagogic')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'pedagogic' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pedagojik Standartlar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solver')}
          className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'solver' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Motor Süresi & Çözücü
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ÖĞRETMEN KONFORU & BOŞLUK KURALLARI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'teacher') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>1. Öğretmen Konforu ve Boşluk (Pencere) Kuralları</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* KURAL 1.1: GÜNLÜK PENCERE SINIRI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-blue-600 shrink-0" />
                    Öğretmen Günlük Maksimum Pencere (Boşluk) Sınırı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Bir öğretmenin gün içindeki dersleri arasında kalabilecek azami boş saat sınırıdır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceMaxGaps} 
                    onChange={(e) => setHard({ ...hard, enforceMaxGaps: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {hard.enforceMaxGaps ? (
                <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">İzin Verilen Günlük Azami Boşluk:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHard({ ...hard, maxGapsPerDay: val })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          hard.maxGapsPerDay === val 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val} Saat {val === 2 && '(Önerilen)'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 text-amber-900 text-xs font-medium">
                  ⚠️ Bu sınır devre dışı. Motor boşlukları en aza indirmeye çalışır ancak kilitlenme durumunda daha geniş pencerelere izin verir.
                </div>
              )}
            </div>

            {/* KURAL 1.2: GÜNLÜK DERS DAĞILIM DENGESİ & BOŞ GÜN GÜVENCESİ */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Scale size={16} className="text-blue-600 shrink-0" />
                    Günlük Ders Dağılım Dengesi & Boş Gün Güvencesi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Öğretmenin ders yükünü aktif günlere adil dağıtır; dersi az olan öğretmenlerin derslerini sıkılaştırarak tam boş gün kazanmalarını sağlar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceDailyBalance} 
                    onChange={(e) => setHard({ ...hard, enforceDailyBalance: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {hard.enforceDailyBalance ? (
                <div className="p-4 sm:p-5 bg-white space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-950 font-bold">🌟 Tam Boş Gün Koruma Mekanizması Açık</strong>
                      <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                        Haftalık 10-18 saat dersi olan öğretmenlere haftada en az 1 veya 2 tam boş gün ayrılır. 0 saat olan boş günler denge kısıtını bozmaz.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Dersli Günde Minimum Ders Saati:</label>
                      <select 
                        value={hard.minDailyHours} 
                        onChange={(e) => setHard({ ...hard, minDailyHours: Number(e.target.value) })}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value={2}>En Az 2 Saat</option>
                        <option value={3}>En Az 3 Saat (Önerilen - Standart)</option>
                        <option value={4}>En Az 4 Saat</option>
                      </select>
                      <span className="text-[10px] text-gray-400 block">
                        Öğretmenin sadece 1 saat ders için okula gelmesini önler. Günlük tavan veya fark sınırları kaldırılmıştır.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 text-amber-900 text-xs font-medium">
                  ⚠️ Bu kural devre dışı. Motor günleri dengelemeye çalışmaz.
                </div>
              )}
            </div>

            {/* KURAL 1.3: GÜNE ERKEN BAŞLAMA EĞİLİMİ (SEZGİSEL 4 KADEME) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sun size={16} className="text-amber-500 shrink-0" />
                  Güne Erken Başlama Eğilimi (Sabahçılık Önceliği)
                </h3>
                <p className="text-xs text-gray-500">
                  Öğretmenin günün ilk saatlerinde boş kalıp öğleden sonra geç saatlere kalmasını önler; dersleri sabaha çeker.
                </p>
              </div>

              <PriorityBadges
                currentLevel={getEarlyStartLevel()}
                onChange={setEarlyStartLevel}
                labels={{
                  off: '⚪ Kapalı',
                  low: '🟡 Düşük Öncelik',
                  medium: '🔵 Dengeli (Önerilen)',
                  high: '🟣 Tavizsiz Erken Başlama'
                }}
              />
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PEDAGOJİK VE AKADEMİK STANDARTLAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'pedagogic') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>2. Pedagojik ve Akademik Standartlar</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* KURAL 2.1: SAYISAL DERSLERİ ERKEN SAATE KOY (SEZGİSEL 4 KADEME) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-600 shrink-0" />
                  Sayısal Dersleri Erken Saate Yerleştirme (Zihinsel Odak)
                </h3>
                <p className="text-xs text-gray-500">
                  Matematik, Fizik, Kimya gibi zihinsel odak gerektiren derslerin günün son saatlerine (7. ve 8. saat) düşmesini engeller.
                </p>
              </div>

              <PriorityBadges
                currentLevel={getStemLateLevel()}
                onChange={setStemLateLevel}
                labels={{
                  off: '⚪ Kapalı',
                  low: '🟡 Düşük Öncelik',
                  medium: '🔵 Dengeli (Önerilen)',
                  high: '🟣 Tavizsiz Sabah Tercihi'
                }}
              />
            </div>

            {/* KURAL 2.2: BLOK DERS BİTİŞİKLİK KURALI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-purple-600 shrink-0" />
                    Öğretmen - Sınıf Blok Ders Bitişiklik Kuralı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Aynı öğretmenin aynı sınıfa aynı gün girdiği birden fazla saat aralıksız bitişik (blok) ders olarak planlanır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceConsecutiveClassRules} 
                    onChange={(e) => setHard({ ...hard, enforceConsecutiveClassRules: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed">
                {hard.enforceConsecutiveClassRules ? (
                  <span className="text-purple-900 font-medium">
                    ✓ Aktif: Örneğin 2 saatlik Kimya dersi 2. ve 5. saate ayrı ayrı konulamaz; kesinlikle 1-2 veya 3-4 gibi blok şeklinde ardışık yerleşir.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    ⚠️ Devre Dışı: Aynı gün aynı sınıfa olan dersler gün içine bölük pörçük dağılabilir.
                  </span>
                )}
              </div>
            </div>

            {/* KURAL 2.3: YOĞUN DERS GÜNLÜK SINIRI */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Flame size={16} className="text-purple-600 shrink-0" />
                    Yoğun / Ağır Ders Günlük Tavan Sınırı
                  </h3>
                  <p className="text-xs text-gray-500">
                    Bir sınıfa aynı dersten tek bir günde aşırı yükleme yapılmasını engeller.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hard.enforceIntensiveRules} 
                    onChange={(e) => setHard({ ...hard, enforceIntensiveRules: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {hard.enforceIntensiveRules ? (
                <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Aynı Dersten Günlük En Fazla:</span>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHard({ ...hard, maxHoursPerIntensiveCourse: val })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          hard.maxHoursPerIntensiveCourse === val 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val} Saat {val === 4 && '(Önerilen)'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 text-amber-900 text-xs font-medium">
                  ⚠️ Bu sınır devre dışı. Aynı dersten aynı güne 5-6 saat verilebilir.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MOTOR SÜRESİ VE ÇÖZÜCÜ AYARLARI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'solver') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span>3. Çözücü Motor Performansı & Zaman Sınırı</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Zap size={16} className="text-slate-800 shrink-0" />
                Google OR-Tools CP-SAT Maksimum Optimizasyon Süresi
              </h3>
              <p className="text-xs text-gray-500">
                Çözücü matematik motorunun boşlukları sıfırlamak ve en adil dağılımı bulmak için harcayacağı azami bütçe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: 'İlk Geçerli Çözümde Dur', sub: 'Yıldırım Hızı (1-3 Sn)', value: 85, stopFirst: true, icon: '⚡' },
                { label: 'Hızlı Test', sub: '60 Sn (1 Dk)', value: 60, stopFirst: false, icon: '⏱️' },
                { label: 'Dengeli Dağıtım', sub: '300 Sn (5 Dk)', value: 300, stopFirst: false, icon: '⚖️', recommended: true },
                { label: 'Gelişmiş Optimizasyon', sub: '900 Sn (15 Dk)', value: 900, stopFirst: false, icon: '🧠' }
              ].map((opt) => {
                const isSelected = opt.stopFirst 
                  ? hard.stopAtFirstSolution 
                  : (!hard.stopAtFirstSolution && hard.solverTimeout === opt.value);

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setHard({ ...hard, solverTimeout: opt.value, stopAtFirstSolution: opt.stopFirst })}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/50'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{opt.icon}</span>
                      {opt.recommended && (
                        <span className="text-[9px] bg-blue-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                          ÖNERİLEN
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ALT BUTON BARI */}
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <button 
          type="button"
          onClick={() => navigate('/generate')} 
          className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
        >
          ← Dağıtım Motoruna Git
        </button>
        <button 
          type="button"
          onClick={handleSave} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
        >
          <Save size={15} />
          <span>Kuralları Kaydet ve Dağıtım Motoruna Uygula</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}
