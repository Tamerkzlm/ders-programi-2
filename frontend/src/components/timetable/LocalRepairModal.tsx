// frontend/src/components/timetable/LocalRepairModal.tsx
import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Lock, 
  Users, 
  Layers, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export default function LocalRepairModal() {
  const { 
    isLocalRepairing, 
    localRepairPreview, 
    localRepairError, 
    applyLocalRepair, 
    cancelLocalRepair,
    teachers 
  } = useAppStore();

  const [showAllDetails, setShowAllDetails] = useState(false);

  if (!isLocalRepairing && !localRepairPreview && !localRepairError) {
    return null;
  }

  const diff = localRepairPreview?.diff;
  const targetTeacher = teachers.find(t => t.id === localRepairPreview?.targetTeacherId);

  const gapDifference = diff 
    ? diff.targetTeacherGapsAfter - diff.targetTeacherGapsBefore 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 🌟 BAŞLIK VE MODAL ÜST BARI */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              {isLocalRepairing ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>Lokal Yeniden Dağıtım</span>
                {diff && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Önizleme
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isLocalRepairing 
                  ? 'Hedef sınıflar serbest bırakılarak CP-SAT motoru çalıştırılıyor...'
                  : targetTeacher 
                    ? `${targetTeacher.name} (${targetTeacher.branch || 'Öğretmen'}) için optimize edildi`
                    : 'Kısmi program onarımı'}
              </p>
            </div>
          </div>

          {!isLocalRepairing && (
            <button
              type="button"
              onClick={cancelLocalRepair}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ⏳ YÜKLENİYOR (SOLVING) DURUMU */}
        {isLocalRepairing && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-bold text-xs">
                CP-SAT
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Okulun %85-95'i Donduruldu</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Yalnızca ilgili öğretmenin girdiği sınıflar serbest bırakıldı. Dışarıdaki sınıfların saatleri kilitlendiği için işlem saniyeler içinde tamamlanacaktır.
              </p>
            </div>
          </div>
        )}

        {/* 🚨 HATA (INFEASIBLE / BAĞLANTI) DURUMU */}
        {localRepairError && !isLocalRepairing && (
          <div className="p-8 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-sm text-amber-800 block">Lokal Çözüm Bulunamadı</span>
                <p className="text-slate-700 leading-relaxed">
                  {localRepairError}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Neden Kaynaklandı ve Ne Yapabilirsiniz?
              </span>
              <p className="leading-relaxed">
                İlgili sınıflarda dersi olan diğer öğretmenlerin (okulun diğer sınıflarındaki) kilitli ders saatleri, bu sınıflarda takas yapmak için yeterli serbest alan bırakmamış olabilir.
              </p>
              <p className="leading-relaxed font-semibold text-indigo-700">
                💡 Öneri: Sınıf tablosundan veya Akıllı Takas (Smart Swap) panelinden tekil saatleri manuel olarak yer değiştirmeyi deneyebilirsiniz.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={cancelLocalRepair}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* 📊 BAŞARILI SONUÇ VE ÖNİZLEME EKRANI */}
        {diff && !isLocalRepairing && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
            
            {/* 1. ÖZET METRİK KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              
              {/* Boşluk Değişimi */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hedef Boşluk
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-black">
                  <span className="text-slate-500 line-through">
                    {diff.targetTeacherGapsBefore} Saat
                  </span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className={gapDifference <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {diff.targetTeacherGapsAfter} Saat
                  </span>
                  {gapDifference < 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {gapDifference} Saat
                    </span>
                  )}
                </div>
              </div>

              {/* Etkilenen Sınıflar */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Açılan Sınıflar
                </span>
                <div className="mt-1 text-xs font-black text-indigo-950 truncate" title={diff.affectedClassNames.join(', ')}>
                  {diff.affectedClassNames.join(', ') || 'Yok'}
                </div>
              </div>

              {/* Korunan Okul Oranı */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Korunan Okul
                </span>
                <div className="mt-1 text-xs font-black text-emerald-950 flex items-center gap-1">
                  <Lock size={12} className="text-emerald-600" />
                  <span>
                    {diff.untouchedClassesCount} / {diff.totalSchoolClassesCount} Sınıf
                  </span>
                </div>
              </div>

              {/* Kaydırılan Ders Saati */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Yer Değişen Ders
                </span>
                <div className="mt-1 text-xs font-black text-slate-800 flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  <span>{diff.changedSlotsCount} Saat</span>
                </div>
              </div>

            </div>

            {/* 2. ETKİLENEN DİĞER ÖĞRETMENLER LİSTESİ */}
            <div className="pt-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Bu Dağıtımdan Etkilenen Öğretmenler ({diff.affectedTeachers.length})
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Hedef öğretmen ve sınıftaki partner branşlar)
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {diff.affectedTeachers.map((t) => {
                  const isTarget = t.teacherId === diff.targetTeacherId;
                  const tGapDiff = t.gapsAfter - t.gapsBefore;

                  return (
                    <div 
                      key={t.teacherId}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        isTarget 
                          ? 'bg-indigo-50/70 border-indigo-200' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{t.teacherName}</span>
                          {isTarget && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                              HEDEF
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {t.branch} • {t.movedHours} saat kaydırıldı
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Boşluk</span>
                        <span className={`text-xs font-black ${
                          tGapDiff < 0 ? 'text-emerald-600' : tGapDiff > 0 ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {t.gapsBefore}h → {t.gapsAfter}h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. TÜM DEĞİŞEN DERSLER TABLOSU (AKORDEON) */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-500" />
                  Değişen Saatlerin Detay Listesi ({diff.changedSlots.length} Hücre)
                </span>
                {showAllDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAllDetails && (
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-[11px]">
                  {diff.changedSlots.map((slot, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800">
                          {slot.className} • {slot.day} {slot.period}. Ders
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-slate-400 line-through">
                          {slot.oldSubject} ({slot.oldTeacherName})
                        </span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="text-indigo-700 font-bold">
                          {slot.newSubject} ({slot.newTeacherName})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 🚀 AKSİYON BUTONLARI (FOOTER) */}
        {diff && !isLocalRepairing && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              💡 Onayladığınızda mevcut programınız otomatik olarak yedeklenecektir.
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={cancelLocalRepair}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer"
              >
                Vazgeç / İptal
              </button>
              <button
                type="button"
                onClick={applyLocalRepair}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Değişiklikleri Onayla ve Uygula</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
