import { useState } from 'react';
import { ChevronLeft, Play, AlertTriangle, CheckCircle2, UserX, Plus, Trash2, Search } from 'lucide-react';

const GRADE_COLORS: Record<string, string> = {
  '9': 'bg-blue-50 border-blue-300 text-blue-900',
  '10': 'bg-emerald-50 border-emerald-300 text-emerald-900',
  '11': 'bg-orange-50 border-orange-300 text-orange-900',
  '12': 'bg-purple-50 border-purple-300 text-purple-900',
  'haz': 'bg-amber-50 border-amber-300 text-amber-900',
};

export default function Step4Options({ 
  students = [], 
  rooms = [], 
  activeGrades = [], 
  onGradesChange, 
  separatePairs = [], 
  onSeparatePairsChange = (_pairs?: any) => {}, 
  onGenerate, 
  onBack 
}: any) {
  const [student1Id, setStudent1Id] = useState('');
  const [student2Id, setStudent2Id] = useState('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [pairError, setPairError] = useState('');

  const availableGrades: string[] = [...new Set<string>(students.filter((s: any) => !s.isExempt).map((s: any) => String(s.grade)))].sort();
  const activeCount = students.filter(s => !s.isExempt && activeGrades.includes(s.grade)).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);
  const isOverCapacity = activeCount > totalCapacity;
  const tooFewGrades = activeGrades.filter(g => availableGrades.includes(g)).length < 2;

  const candidateStudents = students.filter(s => !s.isExempt && activeGrades.includes(s.grade));

  const filteredStudents1 = candidateStudents.filter(s => {
    if (!search1) return true;
    const q = search1.toLowerCase();
    return (
      (s.adSoyad && s.adSoyad.toLowerCase().includes(q)) ||
      (s.no && String(s.no).includes(q)) ||
      (s.sinif && s.sinif.toLowerCase().includes(q))
    );
  });

  const filteredStudents2 = candidateStudents.filter(s => {
    if (!search2) return true;
    const q = search2.toLowerCase();
    return (
      (s.adSoyad && s.adSoyad.toLowerCase().includes(q)) ||
      (s.no && String(s.no).includes(q)) ||
      (s.sinif && s.sinif.toLowerCase().includes(q))
    );
  });

  const handleAddPair = () => {
    setPairError('');
    if (!student1Id || !student2Id) {
      setPairError('Lütfen ayrılacak her iki öğrenciyi de seçin.');
      return;
    }
    if (student1Id === student2Id) {
      setPairError('Aynı öğrenciyi kendisinden ayıramazsınız. İki farklı öğrenci seçin.');
      return;
    }
    const alreadyExists = (separatePairs || []).some(
      p => (String(p.student1Id) === String(student1Id) && String(p.student2Id) === String(student2Id)) ||
           (String(p.student1Id) === String(student2Id) && String(p.student2Id) === String(student1Id))
    );
    if (alreadyExists) {
      setPairError('Bu öğrenci çifti zaten ayrık listesinde kayıtlı.');
      return;
    }

    const s1 = students.find(s => String(s.id || s.no) === String(student1Id));
    const s2 = students.find(s => String(s.id || s.no) === String(student2Id));

    if (!s1 || !s2) {
      setPairError('Öğrenci bulunamadı.');
      return;
    }

    const newPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student1Id: s1.id || s1.no,
      student1Name: s1.adSoyad,
      student1Class: s1.sinif,
      student1No: s1.no,
      student1Grade: s1.grade,
      student2Id: s2.id || s2.no,
      student2Name: s2.adSoyad,
      student2Class: s2.sinif,
      student2No: s2.no,
      student2Grade: s2.grade,
    };

    onSeparatePairsChange([...(separatePairs || []), newPair]);
    setStudent1Id('');
    setStudent2Id('');
    setSearch1('');
    setSearch2('');
  };

  const handleRemovePair = (pairId) => {
    onSeparatePairsChange((separatePairs || []).filter(p => p.id !== pairId));
  };

  const toggle = (grade) => {
    const updated = activeGrades.includes(grade)
      ? activeGrades.filter(g => g !== grade)
      : [...activeGrades, grade];
    onGradesChange(updated);
  };

  const selectAllGrades = () => onGradesChange(availableGrades);
  const clearAllGrades = () => onGradesChange([]);

  const gradeStats = availableGrades.map(g => ({
    grade: g,
    count: students.filter(s => !s.isExempt && s.grade === g).length,
    active: activeGrades.includes(g),
  }));

  const maxGradeCount = Math.max(...gradeStats.filter(s => s.active).map(s => s.count), 0);
  const isOneGradeDominant = activeCount > 0 && (maxGradeCount / activeCount) > 0.55;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sınav Seçenekleri & Kademeler</h2>
          <p className="text-xs text-slate-500 mt-1">
            Bu oturuma hangi sınıf düzeylerinin katılacağını belirleyin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAllGrades}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Tümünü Seç
          </button>
          <button
            onClick={clearAllGrades}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Grade Selector Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Sınava Girecek Sınıf Düzeyleri</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gradeStats.map(({ grade, count, active }) => (
            <button
              key={grade}
              type="button"
              onClick={() => toggle(grade)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                active
                  ? `${GRADE_COLORS[grade] || 'bg-blue-50 border-blue-300 text-blue-900'} shadow-2xs`
                  : 'bg-slate-50 border-slate-200/80 text-slate-400 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-extrabold text-sm">
                  {grade === 'haz' ? 'Hazırlık Sınıfı' : `${grade}. Sınıf`}
                </div>
                <div className="text-xs opacity-80 mt-0.5 font-semibold">
                  {count} aktif öğrenci
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  active ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' : 'border-slate-300 bg-white'
                }`}
              >
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Özel Öğrenci Ayrımı (Uzak Tutulacak Çiftler) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Özel Öğrenci Ayrımı (Uzak Tutulacak Çiftler)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Yan yana gelmemesi veya aynı salonda oturmaması gereken iki öğrenciyi seçin. Algoritma bu öğrencileri <b>öncelikle farklı salonlara</b>, tek salon varsa <b>çapraz en uzak köşelere</b> yerleştirir.
            </p>
          </div>
          {separatePairs && separatePairs.length > 0 && (
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl shrink-0">
              {separatePairs.length} Çift Tanımlı
            </span>
          )}
        </div>

        {/* Form Alanı */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Öğrenci */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>1. Öğrenci</span>
                {candidateStudents.length > 0 && (
                  <span className="text-slate-400 font-normal">({filteredStudents1.length} aday)</span>
                )}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, No veya Sınıf Ara..."
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <select
                value={student1Id}
                onChange={(e) => { setStudent1Id(e.target.value); setPairError(''); }}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- 1. Öğrenciyi Seçin --</option>
                {filteredStudents1.map(s => (
                  <option key={s.id || s.no} value={s.id || s.no}>
                    {s.no} - {s.adSoyad} ({s.sinif})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Öğrenci */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>2. Öğrenci (Uzak Tutulacak)</span>
                {candidateStudents.length > 0 && (
                  <span className="text-slate-400 font-normal">({filteredStudents2.length} aday)</span>
                )}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, No veya Sınıf Ara..."
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <select
                value={student2Id}
                onChange={(e) => { setStudent2Id(e.target.value); setPairError(''); }}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- 2. Öğrenciyi Seçin --</option>
                {filteredStudents2.map(s => (
                  <option key={s.id || s.no} value={s.id || s.no}>
                    {s.no} - {s.adSoyad} ({s.sinif})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pairError && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{pairError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddPair}
              disabled={!student1Id || !student2Id}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ayrık Çift Olarak Ekle
            </button>
          </div>
        </div>

        {/* Eklenmiş Çiftlerin Listesi */}
        {separatePairs && separatePairs.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Ayrık Tutulacak Öğrenci Çiftleri:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {separatePairs.map((pair) => (
                <div
                  key={pair.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <div className="truncate">
                      <span className="font-extrabold text-slate-900">{pair.student1Name}</span>
                      <span className="text-[10px] text-slate-500 ml-1 font-semibold">({pair.student1Class} - #{pair.student1No})</span>
                    </div>
                    <span className="text-indigo-600 font-black shrink-0">⟷</span>
                    <div className="truncate">
                      <span className="font-extrabold text-slate-900">{pair.student2Name}</span>
                      <span className="text-[10px] text-slate-500 ml-1 font-semibold">({pair.student2Class} - #{pair.student2No})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePair(pair.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            Henüz ayrılacak öğrenci çifti tanımlanmadı. İsteğe bağlı olarak yukarıdan ekleyebilirsiniz.
          </div>
        )}
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Kapasite ve Dağılım Özeti</h3>
        <div className="space-y-2.5 text-xs font-medium">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Sınava girecek öğrenci</span>
            <span className="font-bold text-slate-900">{activeCount} öğrenci</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Toplam salon kapasitesi</span>
            <span className="font-bold text-slate-900">{totalCapacity} koltuk ({rooms.length} salon)</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500">Boş kalacak koltuk</span>
            <span className={`font-black ${isOverCapacity ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isOverCapacity ? 'Yetersiz Kapasite' : `${totalCapacity - activeCount} koltuk`}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings & Advice */}
      {tooFewGrades && activeGrades.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            Kelebek sisteminin sağlıklı çalışabilmesi ve öğrencilerin çapraz oturabilmesi için <b>en az 2 farklı sınıf düzeyi</b> seçilmesi önerilir.
          </p>
        </div>
      )}

      {isOneGradeDominant && !tooFewGrades && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <b>Bilgi:</b> Seçilen bir sınıf düzeyindeki öğrenci sayısı toplamın %50'sinden fazladır. Kelebek algoritması bank komşuluklarını ve şube ayrımını azami düzeyde koruyarak yerleşim yapacaktır.
          </p>
        </div>
      )}

      {isOverCapacity && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 leading-relaxed font-bold">
            Öğrenci sayısı ({activeCount}) toplam salon kapasitesini ({totalCapacity}) aşıyor! Lütfen bir önceki adıma dönüp salon ekleyin veya öğrenci sayısını azaltın.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
        <button
          onClick={onGenerate}
          disabled={isOverCapacity || activeCount === 0 || tooFewGrades}
          className="flex items-center gap-2 bg-indigo-600 text-white px-7 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4" /> Kelebek Planını Oluştur
        </button>
      </div>
    </div>
  );
}
