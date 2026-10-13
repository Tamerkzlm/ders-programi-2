import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Building2, RotateCcw, Copy, Edit2, Check
} from 'lucide-react';

const DEFAULT_ROOMS = [
  '9A', '9B', '9C', '9D', '9H',
  '10A', '10B', '10C', '10D',
  '11A', '11B', '11C', '11D', '11E',
  '12A', '12B', '12C', '12D', '12H',
].map((name, i) => ({ id: `default-${i}`, name, rows: 5, cols: 3 }));

// Mini kroki önizlemesi
function RoomSketch({ rows, cols, onDeleteRow, onAddRow }) {
  const r = Math.min(Math.max(parseInt(rows) || 0, 0), 20);
  const c = Math.min(Math.max(parseInt(cols) || 0, 0), 10);
  if (r === 0 || c === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 select-none">
      {/* Tahta ve Kapı */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
          KAPI
        </div>
        <div className="flex-1 text-center text-[9px] font-bold text-slate-700 bg-slate-200 rounded py-0.5 tracking-wider">
          TAHTA / ÖĞRETMEN MASASI
        </div>
      </div>

      <div className="flex gap-1.5 items-stretch">
        {/* Sol taraftaki cam şeridi */}
        <div
          className="flex flex-col justify-center items-center w-5 rounded-lg border-2 border-blue-300 bg-blue-50/70"
          style={{ minHeight: r * 20 }}
        >
          <span
            className="text-[7.5px] text-blue-600 font-bold tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            CAM
          </span>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {Array.from({ length: r }, (_, ri) => (
            <div key={ri} className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-400 w-4 text-right font-mono shrink-0">
                {ri + 1}
              </span>
              <div className="flex gap-1.5 flex-1">
                {Array.from({ length: c }, (_, ci) => (
                  <div key={ci} className="flex gap-0.5 flex-1">
                    <div className="flex-1 h-4 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors" />
                    <div className="flex-1 h-4 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors" />
                  </div>
                ))}
              </div>
              {onDeleteRow && (
                <button
                  onClick={() => onDeleteRow(ri)}
                  title="Bu sırayı kaldır"
                  className="w-4 h-4 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs flex items-center justify-center shrink-0 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {onAddRow && (
        <button
          onClick={onAddRow}
          className="mt-2 w-full text-xs text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl py-1.5 border border-dashed border-indigo-300 transition-colors cursor-pointer"
        >
          + Sıra Ekle
        </button>
      )}

      <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
        {c} bank sütunu × {r} sıra = <b className="text-slate-800">{c * r * 2}</b> kişi kapasite
      </p>
    </div>
  );
}

export default function Step3Rooms({ rooms = [], onChange, onNext, onBack }) {
  const [newRoom, setNewRoom] = useState({ name: '', rows: 5, cols: 3 });
  const [errors, setErrors] = useState({});
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (rooms.length === 0) onChange(DEFAULT_ROOMS);
  }, []);

  const addRoom = () => {
    const e = {};
    if (!newRoom.name.trim()) e.name = 'Salon adı gereklidir';
    const rNum = parseInt(newRoom.rows);
    const cNum = parseInt(newRoom.cols);
    if (!rNum || rNum < 1) e.rows = 'Sıra sayısı en az 1 olmalı';
    if (!cNum || cNum < 1) e.cols = 'Bank sayısı en az 1 olmalı';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const room = {
      id: `salon-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newRoom.name.trim(),
      rows: rNum,
      cols: cNum,
    };
    onChange([...rooms, room]);
    setNewRoom({ name: '', rows: 5, cols: 3 });
  };

  const removeRoom = (id) => {
    onChange(rooms.filter(r => r.id !== id));
    if (expandedRoom === id) setExpandedRoom(null);
  };

  const duplicateRoom = (room) => {
    const copy = {
      ...room,
      id: `salon-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${room.name} (Kopya)`,
    };
    onChange([...rooms, copy]);
  };

  const startRename = (room) => {
    setEditingRoomId(room.id);
    setEditingName(room.name);
  };

  const saveRename = (id) => {
    if (!editingName.trim()) return;
    onChange(rooms.map(r => r.id === id ? { ...r, name: editingName.trim() } : r));
    setEditingRoomId(null);
  };

  const deleteRowFromRoom = (roomId, rowIndex) => {
    onChange(rooms.map(r => {
      if (r.id !== roomId) return r;
      const newRows = r.rows - 1;
      return newRows < 1 ? r : { ...r, rows: newRows };
    }));
  };

  const addRowToRoom = (roomId) => {
    onChange(rooms.map(r => r.id === roomId ? { ...r, rows: r.rows + 1 } : r));
  };

  const addBatchRooms = (count, rows, cols) => {
    const startNum = rooms.length + 1;
    const batch = Array.from({ length: count }, (_, i) => ({
      id: `salon-batch-${Date.now()}-${i}`,
      name: `Salon ${startNum + i}`,
      rows,
      cols,
    }));
    onChange([...rooms, ...batch]);
  };

  const totalCap = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sınav Salonları & Kapasite</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sınav yapılacak sınıfları veya salonları ekleyin. Sıra ve bank sayılarını dilediğiniz gibi özelleştirin.
          </p>
        </div>
      </div>

      {/* Add Room Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Yeni Salon Ekle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Salon Adı</label>
            <input
              type="text"
              value={newRoom.name}
              onChange={e => {
                setNewRoom(r => ({ ...r, name: e.target.value }));
                setErrors(er => ({ ...er, name: null }));
              }}
              placeholder="Örn: 9A veya Salon 1"
              className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sıra Sayısı (Satır)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={newRoom.rows}
              onChange={e => setNewRoom(r => ({ ...r, rows: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Sayısı (Çiftli Masa)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={newRoom.cols}
              onChange={e => setNewRoom(r => ({ ...r, cols: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Live Preview */}
        <RoomSketch rows={newRoom.rows} cols={newRoom.cols} />

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-slate-500">
            Salon Kapasitesi: <b className="text-slate-900">{parseInt(newRoom.rows || 0) * parseInt(newRoom.cols || 0) * 2}</b> kişi
          </p>
          <button
            onClick={addRoom}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Salonu Ekle
          </button>
        </div>
      </div>

      {/* Quick Batch Add Bar */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-600">Hızlı Salon Oluştur:</span>
        <div className="flex gap-2">
          <button
            onClick={() => addBatchRooms(5, 5, 3)}
            className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs"
          >
            + 5 Salon (30 Kişilik)
          </button>
          <button
            onClick={() => addBatchRooms(10, 5, 3)}
            className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs"
          >
            + 10 Salon (30 Kişilik)
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onChange(DEFAULT_ROOMS)}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <RotateCcw className="w-3 h-3" /> Örnek Salonlar
          </button>
          <button
            onClick={() => onChange([])}
            className="text-xs text-rose-600 hover:text-rose-700 transition-colors ml-2 cursor-pointer font-semibold"
          >
            Tümünü Temizle
          </button>
        </div>
      </div>

      {/* Room List */}
      {rooms.length > 0 && (
        <div className="space-y-2.5">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
              <div
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    {editingRoomId === room.id ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="px-2 py-0.5 border border-indigo-600 rounded-lg text-sm font-bold outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(room.id)}
                          className="p-1 rounded bg-indigo-600 text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        {room.name}
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(room); }}
                          className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Yeniden adlandır"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      {room.rows} sıra × {room.cols} bank = <b className="text-slate-900">{room.rows * room.cols * 2}</b> kişi kapasite
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => duplicateRoom(room)}
                    title="Salonu kopyala"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeRoom(room.id)}
                    title="Salonu sil"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 text-xs cursor-pointer font-bold"
                  >
                    {expandedRoom === room.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {expandedRoom === room.id && (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <RoomSketch
                    rows={room.rows}
                    cols={room.cols}
                    onDeleteRow={ri => deleteRowFromRoom(room.id, ri)}
                    onAddRow={() => addRowToRoom(room.id)}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Total Capacity Pill */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 shadow-2xs">
            <span className="text-xs font-bold text-indigo-900">Toplam Salon Sayısı & Kapasite</span>
            <span className="text-xs font-black text-indigo-900">
              {rooms.length} Salon &nbsp;—&nbsp; {totalCap} Koltuk
            </span>
          </div>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-indigo-600" />
          <p className="text-sm font-bold">Henüz salon eklenmedi.</p>
          <p className="text-xs mt-1">Yukarıdan salon ekleyebilir veya 'Örnek Salonlar' butonuna basabilirsiniz.</p>
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
          onClick={onNext}
          disabled={rooms.length === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <span>Seçeneklere Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
