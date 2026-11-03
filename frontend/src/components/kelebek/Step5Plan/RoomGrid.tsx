import { useState } from 'react';
import SeatCell from './SeatCell';
import { getSeatLabel } from '../../../utils/kelebek/algorithm';

export default function RoomGrid({ assignment, onSwap }) {
  const { room, grid, violations } = assignment;
  const [dragSource, setDragSource] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // İhlal haritası
  const violationSet = new Set(violations.map(v => `${v.row}-${v.col}`));

  const handleDragStart = (row, col, seatInBank) => {
    setDragSource({ row, col, seatInBank });
  };

  const handleDragOver = (row, col, seatInBank) => {
    setDragOver({ row, col, seatInBank });
  };

  const handleDrop = (row, col, seatInBank) => {
    if (!dragSource) return;
    const src = dragSource;
    const dst = { row, col, seatInBank };
    if (src.row !== dst.row || src.col !== dst.col || src.seatInBank !== dst.seatInBank) {
      onSwap(src, dst);
    }
    setDragSource(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOver(null);
  };

  const colLetters = Array.from({ length: room.cols }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="overflow-x-auto select-none pb-2">
      {/* Tahta Çizelgesi */}
      <div className="max-w-2xl mx-auto mb-4 px-2">
        <div className="w-full text-center py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-black text-slate-700 tracking-wider shadow-2xs">
          TAHTA / ÖĞRETMEN MASASI
        </div>
      </div>

      <div className="flex gap-2.5 items-stretch min-w-[500px]">
        {/* Sol taraftaki CAM cephesi */}
        <div className="flex items-center justify-center w-7 shrink-0 rounded-2xl border-2 border-blue-300 bg-blue-50/70 shadow-2xs">
          <span
            className="text-[10px] text-blue-600 font-extrabold tracking-widest select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            PENCERE / CAM KENARI
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Koltuk Başlıkları: A1/B1, C1/D1 */}
          <div className="flex gap-2 mb-1.5 pl-8">
            {colLetters.map((_, colIdx) => {
              const leftLetter = String.fromCharCode(65 + colIdx * 2);
              const rightLetter = String.fromCharCode(65 + colIdx * 2 + 1);
              return (
                <div key={colIdx} className="flex gap-1.5 flex-1">
                  <div className="flex-1 text-center text-xs font-black text-slate-400 font-mono">
                    {leftLetter}
                  </div>
                  <div className="flex-1 text-center text-xs font-black text-slate-400 font-mono">
                    {rightLetter}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Satırları */}
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-2 mb-1.5">
              {/* Sıra Numarası */}
              <div className="w-6 shrink-0 text-xs font-mono font-bold text-slate-400 text-right pr-1">
                {rowIdx + 1}
              </div>

              {/* Banklar */}
              {colLetters.map((_, colIdx) => {
                const leftSeatIdx = colIdx * 2;
                const rightSeatIdx = colIdx * 2 + 1;
                const leftStudent = row[leftSeatIdx];
                const rightStudent = row[rightSeatIdx];
                const leftLabel = getSeatLabel(colIdx, rowIdx, 0);
                const rightLabel = getSeatLabel(colIdx, rowIdx, 1);
                const isViolation = violationSet.has(`${rowIdx}-${colIdx}`);
                const isLeftDragOver = dragOver?.row === rowIdx && dragOver?.col === colIdx && dragOver?.seatInBank === 0;
                const isRightDragOver = dragOver?.row === rowIdx && dragOver?.col === colIdx && dragOver?.seatInBank === 1;

                return (
                  <div
                    key={colIdx}
                    className={`flex gap-1 flex-1 p-1 rounded-2xl border transition-all ${
                      isViolation
                        ? 'bg-rose-50/60 border-rose-300'
                        : 'bg-slate-50/40 border-slate-200/80'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <SeatCell
                        student={leftStudent}
                        seatLabel={leftLabel}
                        isViolation={isViolation && !!leftStudent}
                        isDragOver={isLeftDragOver}
                        onDragStart={() => handleDragStart(rowIdx, colIdx, 0)}
                        onDragOver={() => handleDragOver(rowIdx, colIdx, 0)}
                        onDrop={() => handleDrop(rowIdx, colIdx, 0)}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                    <div className="w-px bg-slate-200/80 self-stretch my-1" />
                    <div className="flex-1 min-w-0">
                      <SeatCell
                        student={rightStudent}
                        seatLabel={rightLabel}
                        isViolation={isViolation && !!rightStudent}
                        isDragOver={isRightDragOver}
                        onDragStart={() => handleDragStart(rowIdx, colIdx, 1)}
                        onDragOver={() => handleDragOver(rowIdx, colIdx, 1)}
                        onDrop={() => handleDrop(rowIdx, colIdx, 1)}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
