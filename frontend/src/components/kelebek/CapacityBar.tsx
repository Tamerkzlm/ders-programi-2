import React from 'react';
import { Users, Building2 } from 'lucide-react';

export default function CapacityBar({ students = [], rooms = [], activeGrades = [] }) {
  const activeCount = students.filter(s => !s.isExempt && activeGrades.includes(s.grade)).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);
  const pct = totalCapacity > 0 ? Math.min((activeCount / totalCapacity) * 100, 100) : 0;
  const isOverCapacity = activeCount > totalCapacity && totalCapacity > 0;
  const isNearCapacity = pct >= 90 && !isOverCapacity;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 shrink-0">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-900 font-bold">{activeCount}</span>
          <span>öğrenci</span>
        </div>

        <div className="flex-1 relative">
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverCapacity ? 'bg-rose-500' : isNearCapacity ? 'bg-amber-400' : 'bg-indigo-600'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 shrink-0">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Kapasite:</span>
          <span className={`font-bold ${isOverCapacity ? 'text-rose-600' : 'text-slate-900'}`}>
            {totalCapacity}
          </span>
          {rooms.length > 0 && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({rooms.length} salon)
            </span>
          )}
        </div>

        {isOverCapacity && (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Kapasite aşıldı!
          </span>
        )}
        {isNearCapacity && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Kapasite dolmak üzere
          </span>
        )}
      </div>
    </div>
  );
}
