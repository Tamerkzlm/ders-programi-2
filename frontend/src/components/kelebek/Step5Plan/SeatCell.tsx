const GRADE_COLORS = {
  '9':  { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-900',    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200' },
  '10': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  '11': { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-900',  badgeBg: 'bg-orange-100 text-orange-900 border-orange-200' },
  '12': { bg: 'bg-purple-50',  border: 'border-purple-300',  text: 'text-purple-900',  badgeBg: 'bg-purple-100 text-purple-900 border-purple-200' },
  'haz': { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-900',   badgeBg: 'bg-amber-100 text-amber-900 border-amber-200' },
};

export default function SeatCell({
  student,
  seatLabel,
  isViolation,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const colors = student
    ? (GRADE_COLORS[student.grade] || {
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        text: 'text-slate-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      })
    : null;

  if (!student) {
    return (
      <div
        onDragOver={e => { e.preventDefault(); onDragOver?.(); }}
        onDrop={e => { e.preventDefault(); onDrop?.(); }}
        className={`relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all min-h-[58px] p-1 ${
          isDragOver ? 'border-indigo-600 bg-indigo-50/50 scale-102 ring-2 ring-indigo-400/40' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60'
        }`}
      >
        <span className="text-[10px] text-slate-400 font-mono font-bold">{seatLabel}</span>
        <span className="text-[9px] text-slate-300 font-semibold">Boş</span>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={e => onDragStart?.(e)}
      onDragOver={e => { e.preventDefault(); onDragOver?.(); }}
      onDrop={e => { e.preventDefault(); onDrop?.(); }}
      onDragEnd={onDragEnd}
      title={`${student.adSoyad} (${student.no}) - ${student.sinif}\nKoltuk: ${seatLabel}\nYerini değiştirmek için sürükleyin`}
      className={`relative rounded-xl border flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all min-h-[58px] px-1.5 py-1 select-none ${
        colors.bg
      } ${
        isViolation
          ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.35)] ring-2 ring-rose-400/40 bg-rose-50'
          : isDragOver
          ? 'border-indigo-600 shadow-md ring-2 ring-indigo-400/40 scale-105'
          : `${colors.border} hover:shadow-xs hover:scale-[1.02]`
      }`}
    >
      {/* Üst Bar: Koltuk No & Okul No */}
      <div className="w-full flex items-center justify-between text-[8px] font-mono font-bold leading-none mb-0.5 opacity-70">
        <span>{seatLabel}</span>
        <span>#{student.no}</span>
      </div>

      {/* Öğrenci Adı */}
      <span className={`text-[10px] font-bold ${colors.text} text-center leading-tight line-clamp-1 w-full px-0.5`}>
        {student.adSoyad}
      </span>

      {/* Şube Rozeti */}
      <div className="mt-0.5">
        <span className={`inline-block text-[8.5px] font-black px-1.5 py-0.2 rounded border ${colors.badgeBg} leading-none tracking-tight`}>
          {student.sinif}
        </span>
      </div>

      {isViolation && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-xs">
          !
        </span>
      )}
    </div>
  );
}
