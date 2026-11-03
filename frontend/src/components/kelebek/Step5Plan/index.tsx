import { useState, useEffect } from 'react';
import {
  ChevronLeft, Printer, AlertTriangle, CheckCircle2, Building2,
  RotateCcw, DoorOpen, ShieldCheck
} from 'lucide-react';
import RoomGrid from './RoomGrid';
import { getSeatLabel, findViolations } from '../../../utils/kelebek/algorithm';
import { buildRoomListHTML, buildClassListHTML, buildDoorListHTML } from './printBuilder';

const GRADE_COLORS = {
  '9':  'bg-blue-100 border-blue-300 text-blue-900',
  '10': 'bg-emerald-100 border-emerald-300 text-emerald-900',
  '11': 'bg-orange-100 border-orange-300 text-orange-900',
  '12': 'bg-purple-100 border-purple-300 text-purple-900',
  'haz': 'bg-amber-100 border-amber-300 text-amber-900',
};

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=950,height=750');
  if (!w) {
    alert('Yazdırma penceresi açılamadı. Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kontrol edin.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch (e) {
      console.error(e);
    }
  }, 600);
}

export default function Step5Plan({ plan, examInfo = {} as any, onBack, onRegenerate }: any) {
  const [activeRoom, setActiveRoom] = useState(0);
  const [localPlan, setLocalPlan] = useState(plan);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  if (!localPlan) return null;

  const { assignments, violations } = localPlan;
  const currentAssignment = assignments[activeRoom] || assignments[0];

  // Manuel sürükle-bırak takası
  const handleSwap = (src, dst) => {
    const newAssignments = localPlan.assignments.map((a, ai) => {
      if (ai !== activeRoom) return a;
      const newGrid = a.grid.map(row => [...row]);

      const srcGridCol = src.col * 2 + src.seatInBank;
      const dstGridCol = dst.col * 2 + dst.seatInBank;

      const srcStudent = newGrid[src.row][srcGridCol];
      const dstStudent = newGrid[dst.row][dstGridCol];

      if (srcStudent) srcStudent.koltuk = getSeatLabel(dst.col, dst.row, dst.seatInBank);
      if (dstStudent) dstStudent.koltuk = getSeatLabel(src.col, src.row, src.seatInBank);

      newGrid[dst.row][dstGridCol] = srcStudent;
      newGrid[src.row][srcGridCol] = dstStudent;

      const newViolations = findViolations(newGrid, a.room.rows, a.room.cols);
      return { ...a, grid: newGrid, violations: newViolations };
    });

    const totalViolations = newAssignments.reduce((s, a) => s + a.violations.length, 0);
    setLocalPlan({ ...localPlan, assignments: newAssignments, violations: totalViolations });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🦋</span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sınav Oturma Planı</h2>
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            <b className="text-slate-900">{examInfo.okulAdi || 'Okul'}</b> &nbsp;·&nbsp;
            {examInfo.sinavDersi} &nbsp;·&nbsp;
            {examInfo.sinavTarihi} ({examInfo.sinavSaati})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Salon Kapı Listesi */}
          <button
            onClick={() => openPrintWindow(buildDoorListHTML(localPlan, examInfo))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Kapılara asılmak üzere her salon için A4 kapı listesi yazdır"
          >
            <DoorOpen className="w-4 h-4 text-indigo-600" /> Kapı Listesi
          </button>

          {/* Salon Listesi & Oturma Planı */}
          <button
            onClick={() => openPrintWindow(buildRoomListHTML(localPlan, examInfo))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Her salon için imza sirküsü ve oturma krokisi çıktısı al"
          >
            <Printer className="w-4 h-4 text-indigo-600" /> Salon Planı Yazdır
          </button>

          {/* Şube Listesi */}
          <button
            onClick={() => openPrintWindow(buildClassListHTML(localPlan, examInfo))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Sınıflara dağıtılmak üzere şube bazlı koltuk listesi yazdır"
          >
            <Printer className="w-4 h-4 text-indigo-600" /> Şube Listesi
          </button>

          {/* Yeniden Dağıt */}
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Öğrencileri salonlara yeniden rastgele yerleştir"
          >
            <RotateCcw className="w-4 h-4" /> Yeniden Dağıt
          </button>
        </div>
      </div>

      {/* Kelebek Kural Durum Kartı */}
      {violations === 0 ? (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-900">
              Kusursuz Kelebek Dağıtımı: Hiçbir yan yana bankta aynı sınıf veya şube çakışması yoktur!
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Tüm salonlar optimize edilmiş çapraz düzende yerleştirildi.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900">
              {violations} bankta sınıf/şube yakınlığı tespit edildi (Kapasite zorunluluğundan kaynaklı)
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              İlgili koltukları kırmızı çerçeve ile görebilir, öğrencileri sürükleyip başka koltuklarla takas edebilirsiniz.
            </p>
          </div>
        </div>
      )}

      {/* Özel Öğrenci Ayrımı Doğrulama Raporu */}
      {localPlan.separationResults && localPlan.separationResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Özel Öğrenci Ayrımı Doğrulama Raporu
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              {localPlan.separationResults.length} Çift Kontrol Edildi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localPlan.separationResults.map((res, idx) => (
              <div
                key={res.id || idx}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                  res.isDifferentRooms
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : res.isAdjacent
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-extrabold flex items-center gap-1.5 truncate">
                    <span className="truncate">{res.student1Name} ({res.student1Class})</span>
                    <span className="text-slate-400 shrink-0">⟷</span>
                    <span className="truncate">{res.student2Name} ({res.student2Class})</span>
                  </div>
                  {res.isDifferentRooms ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-black shrink-0">
                      Farklı Salon ✓
                    </span>
                  ) : res.isAdjacent ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[10px] font-black shrink-0">
                      Bitişik (Uyarı!)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 text-[10px] font-black shrink-0">
                      Aynı Salon ({res.distance} Sıra Uzak) ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {res.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salon Seçici Sekmeler (Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {assignments.map((a, idx) => {
          const isActive = idx === activeRoom;
          const assignedCount = a.grid.flat().filter(Boolean).length;
          const hasVio = a.violations.length > 0;

          return (
            <button
              key={a.room.id}
              onClick={() => setActiveRoom(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{a.room.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {assignedCount}
              </span>
              {hasVio && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="İhlal var" />
              )}
            </button>
          );
        })}
      </div>

      {/* Salon Matrisi & Canlı Görünüm */}
      {currentAssignment && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Salon: {currentAssignment.room.name}</span>
                <span className="text-xs font-semibold text-slate-400">
                  ({currentAssignment.room.rows} sıra × {currentAssignment.room.cols} bank)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Öğrencilerin yerini değiştirmek için bir koltuk kartını diğerine sürükleyip bırakabilirsiniz.
              </p>
            </div>

            {/* Sınıf Düzeyi Lejantı */}
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries({
                '9': '9. Sınıf',
                '10': '10. Sınıf',
                '11': '11. Sınıf',
                '12': '12. Sınıf',
                'haz': 'Hazırlık'
              }).map(([code, label]) => (
                <span
                  key={code}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${GRADE_COLORS[code] || 'bg-slate-100 text-slate-700'}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <RoomGrid
            assignment={currentAssignment}
            onSwap={handleSwap}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Seçeneklere Dön
        </button>
      </div>
    </div>
  );
}
