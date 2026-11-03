import { useState, useRef, useEffect } from 'react';
import {
  Upload, AlertCircle, ChevronRight, ChevronLeft, Search,
  FileSpreadsheet, Loader2, UserPlus, X, Check, Download, Trash2, Edit2
} from 'lucide-react';
import { parseEOkulXLS, downloadStudentTemplate, gradeFromSinif } from '../../utils/kelebek/parser';
import { DEFAULT_STUDENTS } from '../../utils/kelebek/defaultStudents';

const GRADE_COLORS = {
  '9': 'bg-blue-50 border-blue-200 text-blue-700',
  '10': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  '11': 'bg-orange-50 border-orange-200 text-orange-700',
  '12': 'bg-purple-50 border-purple-200 text-purple-700',
  'haz': 'bg-amber-50 border-amber-200 text-amber-700',
};

export default function Step2Students({ students = [], onChange, onNext, onBack }: any) {
  const [addTab, setAddTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [manualForm, setManualForm] = useState({ no: '', adSoyad: '', sinif: '9A', grade: '9' });
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let needsUpdate = false;
    const fixed = students.map((s, idx) => {
      if (!s.id) {
        needsUpdate = true;
        return { ...s, id: `std-${idx}-${Date.now()}` };
      }
      return s;
    });
    if (needsUpdate) {
      onChange(fixed);
    }
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const loadDefaults = () => {
    const listWithIds = DEFAULT_STUDENTS.map((s, idx) => ({
      ...s,
      id: s.id || `std-default-${idx}-${Date.now()}`,
    }));
    onChange(listWithIds);
    setErrors([]);
    showNotification(`${listWithIds.length} öğrenci başarıyla yüklendi.`);
  };

  const clearAllStudents = () => {
    if (window.confirm('Tüm öğrenci listesini temizlemek istediğinize emin misiniz?')) {
      onChange([]);
      setErrors([]);
    }
  };

  const handleXLS = async (file) => {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    try {
      const { students: parsed, errors: errs } = await parseEOkulXLS(file);
      onChange([...students, ...parsed]);
      setErrors(errs);
      showNotification(`${parsed.length} öğrenci başarıyla listeye eklendi.`);
      setAddTab(null);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualForm.adSoyad.trim()) {
      setErrors(['Lütfen öğrencinin Adı ve Soyadını girin.']);
      return;
    }
    const sinifVal = (manualForm.sinif.trim() || manualForm.grade).toUpperCase();
    const student = {
      id: `std-man-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      no: manualForm.no.trim() || String(students.length + 1),
      adSoyad: manualForm.adSoyad.trim(),
      sinif: sinifVal,
      grade: manualForm.grade || gradeFromSinif(sinifVal),
      isExempt: false,
    };
    onChange([...students, student]);
    setManualForm({ no: '', adSoyad: '', sinif: sinifVal, grade: manualForm.grade });
    setErrors([]);
    showNotification(`${student.adSoyad} listeye eklendi.`);
  };

  const handleSaveEdit = () => {
    if (!editingStudent || !editingStudent.adSoyad.trim()) return;
    const sinifVal = editingStudent.sinif.trim().toUpperCase();
    const updated = students.map(s => {
      if (s.id === editingStudent.id) {
        return {
          ...s,
          no: editingStudent.no.trim(),
          adSoyad: editingStudent.adSoyad.trim(),
          sinif: sinifVal,
          grade: gradeFromSinif(sinifVal),
        };
      }
      return s;
    });
    onChange(updated);
    setEditingStudent(null);
    showNotification('Öğrenci bilgileri güncellendi.');
  };

  const removeStudentById = (id) => {
    onChange(students.filter(s => s.id !== id));
  };

  const removeClass = (sinif) => {
    if (window.confirm(`${sinif} şubesindeki tüm öğrencileri silmek istiyor musunuz?`)) {
      onChange(students.filter(s => s.sinif !== sinif));
      showNotification(`${sinif} şubesi silindi.`);
    }
  };

  const toggleExemptById = (id) => {
    onChange(students.map(s => (s.id === id ? { ...s, isExempt: !s.isExempt } : s)));
  };

  const grades: string[] = [...new Set<string>(students.map((s: any) => String(s.grade)))].sort();
  const siniflar: string[] = [...new Set<string>(students.map((s: any) => String(s.sinif)))].sort();

  const filtered = students.filter(s => {
    const mG = filterGrade === 'all' || s.grade === filterGrade;
    const mC = filterClass === 'all' || s.sinif === filterClass;
    const q = search.toLowerCase().trim();
    const mS = !q || s.adSoyad.toLowerCase().includes(q) || s.no.includes(q) || s.sinif.toLowerCase().includes(q);
    return mG && mC && mS;
  });

  const activeCount = students.filter(s => !s.isExempt).length;
  const exemptCount = students.filter(s => s.isExempt).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Öğrenci Listesi</h2>
          <p className="text-xs text-slate-500 mt-1">
            e-Okul'dan aldığınız XLS dosyasını yükleyin, kendi Excel dosyanızı ekleyin veya manuel öğrenci girin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadStudentTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Boş örnek Excel şablonu indir"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" /> Şablon Excel İndir
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {students.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="font-extrabold text-indigo-900 text-sm">Hızlı Başlangıç: Örnek Öğrenci Listesi</p>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              9/A'dan 12/H'ye gerçekçi lise öğrenci listesini tek tıkla yükleyip sistemi hemen deneyebilirsiniz.
            </p>
          </div>
          <button
            onClick={loadDefaults}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
          >
            Örnek Listeyi Yükle
          </button>
        </div>
      )}

      {/* Action Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAddTab(addTab === 'xls' ? null : 'xls')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            addTab === 'xls'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel / e-Okul XLS Ekle
        </button>
        <button
          onClick={() => setAddTab(addTab === 'manual' ? null : 'manual')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            addTab === 'manual'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Manuel Öğrenci Ekle
        </button>

        {students.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={clearAllStudents}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Tümünü Temizle
            </button>
          </div>
        )}
      </div>

      {/* XLS Upload Area */}
      {addTab === 'xls' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-900 leading-relaxed">
            <span className="text-base leading-none">💡</span>
            <div>
              <p className="font-bold mb-1">e-Okul veya Kendi Excel Dosyanız:</p>
              <p>
                • <b>e-Okul için:</b> Öğrenci İşleri → Raporlar → <b>Şube Listesi (Öğrenci No Sıralı)</b> raporunu Excel formatında indirip yükleyin.<br/>
                • <b>Kendi listeniz için:</b> İçinde <b>No</b>, <b>Ad Soyad</b> ve <b>Sınıf</b> sütunları bulunan herhangi bir Excel tablosu doğrudan tanınır.
              </p>
            </div>
          </div>

          <div
            onDrop={e => { e.preventDefault(); handleXLS(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/30 transition-all bg-white shadow-2xs"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              style={{ display: 'none' }}
              onChange={e => handleXLS(e.target.files[0])}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-slate-800">Excel Dosyası Okunuyor...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">Excel (.xlsx, .xls) dosyasını buraya sürükleyin veya seçin</p>
                <p className="text-xs text-slate-500">e-Okul Şube Listesi veya standart öğrenci tablosu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      {addTab === 'manual' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-bold text-slate-900 text-sm">Tek Öğrenci Ekle</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Okul No</label>
              <input
                type="text"
                value={manualForm.no}
                onChange={e => setManualForm(f => ({ ...f, no: e.target.value }))}
                placeholder="Örn: 245"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ad Soyad *</label>
              <input
                type="text"
                value={manualForm.adSoyad}
                onChange={e => setManualForm(f => ({ ...f, adSoyad: e.target.value }))}
                placeholder="Örn: Ayşe Kaya"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Şube (Örn: 9A, 11-C)</label>
              <input
                type="text"
                value={manualForm.sinif}
                onChange={e => setManualForm(f => ({ ...f, sinif: e.target.value, grade: gradeFromSinif(e.target.value) }))}
                placeholder="Örn: 9A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sınıf Düzeyi</label>
              <select
                value={manualForm.grade}
                onChange={e => setManualForm(f => ({ ...f, grade: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {['9', '10', '11', '12', 'haz'].map(g => (
                  <option key={g} value={g}>{g === 'haz' ? 'Hazırlık' : `${g}. Sınıf`}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleManualAdd}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-2xs cursor-pointer"
          >
            <Check className="w-4 h-4" /> Öğrenciyi Ekle
          </button>
        </div>
      )}

      {/* Errors Box */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <AlertCircle className="w-4 h-4" /> {errors.length} uyarı / hata
          </div>
          <ul className="text-xs text-rose-600 space-y-0.5 max-h-24 overflow-y-auto">
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Student List View */}
      {students.length > 0 && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
              <div className="text-2xl font-black text-slate-900">{students.length}</div>
              <div className="text-xs text-slate-500 font-semibold">Toplam Kayıtlı</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
              <div className="text-2xl font-black text-indigo-600">{activeCount}</div>
              <div className="text-xs text-slate-500 font-semibold">Sınava Girecek</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
              <div className="text-2xl font-black text-amber-600">{exemptCount}</div>
              <div className="text-xs text-slate-500 font-semibold">Muaf Tutulan</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Öğrenci adı, no veya şube ara..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-pointer"
              >
                <option value="all">Tüm Düzeyler</option>
                {grades.map(g => (
                  <option key={g} value={g}>{g === 'haz' ? 'Hazırlık' : `${g}. Sınıf`}</option>
                ))}
              </select>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-pointer"
              >
                <option value="all">Tüm Şubeler</option>
                {siniflar.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch Delete Tags */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Şubeler ({siniflar.length}):</span>
            {siniflar.map(sinif => {
              const countInClass = students.filter(s => s.sinif === sinif).length;
              return (
                <button
                  key={sinif}
                  onClick={() => removeClass(sinif)}
                  title={`${sinif} şubesini sil (${countInClass} öğrenci)`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer"
                >
                  {sinif} <span className="text-[10px] text-slate-400">({countInClass})</span> <X className="w-2.5 h-2.5 opacity-50" />
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2.5 w-16">No</th>
                    <th className="text-left px-4 py-2.5">Ad Soyad</th>
                    <th className="text-center px-4 py-2.5 w-24">Şube</th>
                    <th className="text-center px-4 py-2.5 w-32">Sınava Giriyor</th>
                    <th className="w-20 text-center px-2 py-2.5">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(s => (
                    <tr key={s.id} className={`transition-colors ${s.isExempt ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-4 py-2 text-slate-400 font-mono font-bold">{s.no}</td>
                      <td className="px-4 py-2 font-bold text-slate-900">{s.adSoyad}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${GRADE_COLORS[s.grade] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {s.sinif}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => toggleExemptById(s.id)}
                          title={s.isExempt ? 'Sınava dahil et' : 'Sınavdan muaf tut'}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            !s.isExempt ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              !s.isExempt ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingStudent({ ...s })}
                            title="Düzenle"
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeStudentById(s.id)}
                            title="Sil"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Arama kriterlerine uygun öğrenci bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-slate-900 text-base mb-4">Öğrenciyi Düzenle</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Okul No</label>
                <input
                  type="text"
                  value={editingStudent.no}
                  onChange={e => setEditingStudent({ ...editingStudent, no: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={editingStudent.adSoyad}
                  onChange={e => setEditingStudent({ ...editingStudent, adSoyad: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Şube</label>
                <input
                  type="text"
                  value={editingStudent.sinif}
                  onChange={e => setEditingStudent({ ...editingStudent, sinif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
        <button
          onClick={onNext}
          disabled={activeCount === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <span>Salon Bilgilerine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
