import React from 'react';
import { ChevronRight, ChevronLeft, Play, AlertTriangle, CheckCircle2 } from 'lucide-react';

const GRADE_COLORS = {
  '9': 'bg-blue-50 border-blue-300 text-blue-900',
  '10': 'bg-emerald-50 border-emerald-300 text-emerald-900',
  '11': 'bg-orange-50 border-orange-300 text-orange-900',
  '12': 'bg-purple-50 border-purple-300 text-purple-900',
  'haz': 'bg-amber-50 border-amber-300 text-amber-900',
};

export default function Step4Options({ students = [], rooms = [], activeGrades = [], onGradesChange, onGenerate, onBack }) {
  const availableGrades = [...new Set(students.filter(s => !s.isExempt).map(s => s.grade))].sort();
  const activeCount = students.filter(s => !s.isExempt && activeGrades.includes(s.grade)).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);
  const isOverCapacity = activeCount > totalCapacity;
  const tooFewGrades = activeGrades.filter(g => availableGrades.includes(g)).length < 2;

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
