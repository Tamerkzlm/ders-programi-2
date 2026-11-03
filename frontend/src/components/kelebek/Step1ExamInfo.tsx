import { useState, useEffect } from 'react';
import { School, BookOpen, Calendar, Clock, FileText, ChevronRight } from 'lucide-react';

const EXAM_TYPES = [
  'Ortak Sınav',
  '1. Dönem 1. Yazılı',
  '1. Dönem 2. Yazılı',
  '2. Dönem 1. Yazılı',
  '2. Dönem 2. Yazılı',
  'Deneme Sınavı',
  'Telafi Sınavı',
];

const LESSON_HOURS = [
  '1. Ders (08:30)',
  '2. Ders (09:20)',
  '3. Ders (10:10)',
  '4. Ders (11:00)',
  '5. Ders (11:50)',
  '6. Ders (13:10)',
  '7. Ders (14:00)',
  '8. Ders (14:50)',
];

const COMMON_LESSONS = [
  'Türk Dili ve Edebiyatı',
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'İngilizce',
  'Din Kültürü ve Ahlak Bilgisi',
  'Felsefe',
];

export default function Step1ExamInfo({ examInfo = {} as any, onChange, onNext }: any) {
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!examInfo.sinavTarihi) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      onChange({
        ...examInfo,
        sinavTarihi: `${day}.${month}.${year}`,
        okulAdi: examInfo.okulAdi || 'Antakya Hz. Ayşe Kız AİHL',
        sinavTuru: examInfo.sinavTuru || EXAM_TYPES[0],
        sinavSaati: examInfo.sinavSaati || LESSON_HOURS[1],
      });
    }
  }, []);

  const update = (field: string, value: any) => {
    onChange({ ...examInfo, [field]: value });
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!examInfo.okulAdi?.trim()) e.okulAdi = 'Okul adı gereklidir';
    if (!examInfo.sinavDersi?.trim()) e.sinavDersi = 'Sınav dersi gereklidir';
    if (!examInfo.sinavTarihi?.trim()) e.sinavTarihi = 'Sınav tarihi gereklidir';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sınav Genel Bilgileri</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sınav salon planları, yoklama tutanakları ve kapı listelerinde yer alacak bilgileri girin.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        {/* Okul Adı */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <School className="w-4 h-4 text-indigo-600" /> Okul Adı *
            </span>
          </label>
          <input
            type="text"
            value={examInfo.okulAdi || ''}
            onChange={e => update('okulAdi', e.target.value)}
            placeholder="Örn: Antakya Hz. Ayşe Kız AİHL"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
              errors.okulAdi ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
            }`}
          />
          {errors.okulAdi && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.okulAdi}</p>}
        </div>

        {/* Sınav Dersi */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Sınav Dersi *
            </span>
          </label>
          <input
            type="text"
            value={examInfo.sinavDersi || ''}
            onChange={e => update('sinavDersi', e.target.value)}
            placeholder="Örn: Matematik"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
              errors.sinavDersi ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
            }`}
          />
          {errors.sinavDersi && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.sinavDersi}</p>}

          {/* Hızlı Ders Seçim Rozetleri */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Hızlı Seçim:</span>
            {COMMON_LESSONS.slice(0, 6).map(lesson => (
              <button
                key={lesson}
                type="button"
                onClick={() => update('sinavDersi', lesson)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 transition-colors cursor-pointer"
              >
                {lesson}
              </button>
            ))}
          </div>
        </div>

        {/* Tarih ve Sınav Türü */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Sınav Tarihi *
              </span>
            </label>
            <input
              type="text"
              value={examInfo.sinavTarihi || ''}
              onChange={e => update('sinavTarihi', e.target.value)}
              placeholder="GG.AA.YYYY"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                errors.sinavTarihi ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.sinavTarihi && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.sinavTarihi}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Sınav Türü
              </span>
            </label>
            <select
              value={examInfo.sinavTuru || EXAM_TYPES[0]}
              onChange={e => update('sinavTuru', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Sınav Saati */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Sınav Saati / Ders Saati
            </span>
          </label>
          <select
            value={examInfo.sinavSaati || LESSON_HOURS[1]}
            onChange={e => update('sinavSaati', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            {LESSON_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <span>Öğrenci Listesine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
