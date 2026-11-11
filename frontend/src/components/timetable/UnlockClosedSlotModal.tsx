// frontend/src/components/timetable/UnlockClosedSlotModal.tsx
import React from 'react';
import { 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';

export interface UnlockInfo {
  teacherId: string;
  teacherName: string;
  teacherBranch?: string;
  targetDay: string;
  targetPeriod: number;
  targetClassId: string;
  sourceDay?: string | null;
  sourcePeriod?: number | null;
  sourceClassId?: string;
  subject: string;
  srcDayHoursBefore: number;
  srcDayHoursAfter: number;
  tgtDayHoursBefore: number;
  tgtDayHoursAfter: number;
  isSameDay: boolean;
  maxDaily?: number;
  exceedsDailyCap?: boolean;
  currentTotalGaps: number;
  newTotalGaps: number;
  netGapChange: number;
  isSwap?: boolean;
  targetTeacherId?: string;
  targetTeacherName?: string;
  targetSubject?: string;
  srcIsClosed?: boolean;
  tgtIsClosed?: boolean;
}

interface UnlockClosedSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unlockInfo: UnlockInfo | null;
  targetClassName?: string;
}

export default function UnlockClosedSlotModal({
  isOpen,
  onClose,
  onConfirm,
  unlockInfo,
  targetClassName
}: UnlockClosedSlotModalProps) {
  if (!isOpen || !unlockInfo) return null;

  const targetDiff = unlockInfo.tgtDayHoursAfter - unlockInfo.tgtDayHoursBefore;
  const sourceDiff = unlockInfo.sourceDay 
    ? unlockInfo.srcDayHoursAfter - unlockInfo.srcDayHoursBefore 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in select-none">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BAŞLIK */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-slate-50 to-white border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Unlock size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Kapalı Saati Aç ve Yerleştir
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Öğretmen müsaitlik kısıtı uyarısı ve onay ekranı
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* İÇERİK */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* UYARI / SORU KUTUSU */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <span className="font-extrabold text-amber-950">{unlockInfo.teacherName}</span> için{' '}
              <span className="font-black text-amber-950">{unlockInfo.targetDay} günü {unlockInfo.targetPeriod}. saat</span>{' '}
              sistemde <span className="font-bold underline">KAPALI / KISITLI</span> olarak işaretlenmiş.
              <div className="mt-1 font-bold text-slate-800">
                Bu dersi buraya yerleştirmek için öğretmenin bu saatteki kapalılığı açılacaktır. <span className="text-indigo-600">Emin misiniz?</span>
              </div>
            </div>
          </div>

          {/* DERS BİLGİSİ ROZETİ */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                {unlockInfo.subject.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-extrabold text-slate-800">{unlockInfo.subject}</div>
                <div className="text-[11px] text-slate-500">
                  {unlockInfo.teacherName} {unlockInfo.teacherBranch ? `(${unlockInfo.teacherBranch})` : ''}
                </div>
              </div>
            </div>
            {targetClassName && (
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-extrabold text-xs shadow-2xs">
                {targetClassName} Sınıfı
              </span>
            )}
          </div>

          {/* ETKİ ANALİZİ KARTLARI */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
              Etki Analizi & Günlük Ders Değişimi
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Hedef Gün */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  Hedef Gün ({unlockInfo.targetDay})
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-600">
                    {unlockInfo.tgtDayHoursBefore} sa
                  </span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <span className="text-base font-black text-indigo-700">
                    {unlockInfo.tgtDayHoursAfter} sa
                  </span>
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 mt-0.5">
                  +{targetDiff} ders saati eklenir
                </div>
              </div>

              {/* Kaynak Gün */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  Kaynak Gün ({unlockInfo.sourceDay || 'Havuz'})
                </div>
                {unlockInfo.sourceDay ? (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-slate-600">
                        {unlockInfo.srcDayHoursBefore} sa
                      </span>
                      <ArrowRight size={14} className="text-slate-400" />
                      <span className="text-base font-black text-slate-800">
                        {unlockInfo.srcDayHoursAfter} sa
                      </span>
                    </div>
                    <div className="text-[10px] font-extrabold text-rose-600 mt-0.5">
                      {sourceDiff} ders saati azalır
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-bold text-slate-600 mt-1">
                    Açıkta kalan havuzdan
                  </div>
                )}
              </div>
            </div>

            {/* Azami Ders Uyarısı */}
            {unlockInfo.exceedsDailyCap && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>
                  <strong>Dikkat:</strong> Öğretmen için belirlenen günlük azami sınır ({unlockInfo.maxDaily} saat) 1 saat aşılacaktır!
                </span>
              </div>
            )}

            {/* Toplam Okul Boşluk Değişimi */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Sparkles size={14} />
                </div>
                <div>
                  <div className="font-extrabold text-slate-800">Toplam Okul Pencere (Boşluk) Sayısı</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {unlockInfo.currentTotalGaps} saat ➔ {unlockInfo.newTotalGaps} saat
                  </div>
                </div>
              </div>

              {unlockInfo.netGapChange < 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-[11px] animate-pulse">
                  🌟 {Math.abs(unlockInfo.netGapChange)} sa AZALIR
                </span>
              ) : unlockInfo.netGapChange > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 font-black text-[11px]">
                  ⚠️ +{unlockInfo.netGapChange} sa ARTAR
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 text-slate-700 font-bold text-[11px]">
                  ±0 Değişmez
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AKSİYON BUTONLARI */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-200 hover:shadow-lg transition-all cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Evet, Kısıtı Aç ve Dersi Yerleştir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
