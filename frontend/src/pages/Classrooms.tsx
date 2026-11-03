// frontend/src/pages/Classrooms.jsx
import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom'; 
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  AlertTriangle, 
  BookOpen, 
  User, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Search, 
  ArrowRight,
  Hash
} from 'lucide-react';
import DemoDataPromptModal from '../components/common/DemoDataPromptModal';
import { generateCourseCode } from '../utils/courseCodeHelper';

export default function Classrooms() {
  const { classrooms, teachers, addClassroom, updateClassroom, deleteClassroom, settings } = useAppStore();
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [className, setClassName] = useState('');
  const [courses, setCourses] = useState<any[]>([]); 

  const [subjectInput, setSubjectInput] = useState('');
  const [courseCodeInput, setCourseCodeInput] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState<number | string>(2);
  
  // Arama ve Seviye Filtreleri
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all'); // 'all', '9', '10', '11', '12', 'missing'
  
  // Müfredat Kopyalama Durumu
  const [sourceClassForCopy, setSourceClassForCopy] = useState('');
  const [keepTeachersOnCopy, setKeepTeachersOnCopy] = useState(true);

  const targetWeeklyHours = (settings?.days?.length || 5) * (settings?.periodsPerDay || 8); // Genelde 40

  const getExistingSubjects = (): string[] => {
    const subjects = new Set<string>();
    teachers.forEach(t => { if (t.branch) subjects.add(t.branch); });
    classrooms.forEach(c => {
      c.courses?.forEach(co => { if (co.subject) subjects.add(co.subject); });
    });
    return Array.from(subjects);
  };

  const subjectSuggestions = getExistingSubjects();

  // Branş ve Ders Uyuşmazlığı Kontrolü
  const branchWarning = useMemo(() => {
    if (!selectedTeacherId || !subjectInput.trim()) return null;
    const teacherObj = teachers.find(t => t.id === selectedTeacherId);
    if (!teacherObj) return null;

    const cleanBranch = (teacherObj.branch || '').toLowerCase().trim();
    const cleanSubject = subjectInput.toLowerCase().trim();
    const tSubjects = (teacherObj.subjects || []).map(s => s.toLowerCase().trim());

    if (cleanBranch && cleanBranch !== cleanSubject && !tSubjects.includes(cleanSubject)) {
      return `⚠️ Bilgi: Seçtiğiniz öğretmenin ana branşı [${teacherObj.branch}], girmeye çalıştığınız ders [${subjectInput}]. Yetki tanımlıysa sorunsuz kaydedebilirsiniz.`;
    }
    return null;
  }, [selectedTeacherId, subjectInput, teachers]);

  // KPI ve İstatistik Hesaplamaları
  const stats = useMemo(() => {
    let totalCurriculumHours = 0;
    let completeCount = 0;
    let missingCount = 0;
    let overCount = 0;

    classrooms.forEach(c => {
      const h = c.courses?.reduce((sum, co) => sum + (Number(co.hoursPerWeek) || 0), 0) || 0;
      totalCurriculumHours += h;
      if (h === targetWeeklyHours) completeCount++;
      else if (h < targetWeeklyHours) missingCount++;
      else overCount++;
    });

    return {
      totalCurriculumHours,
      completeCount,
      missingCount,
      overCount
    };
  }, [classrooms, targetWeeklyHours]);

  const openModal = (classroom = null) => {
    if (classroom) {
      setEditingClassroom(classroom);
      setClassName(classroom.name);
      setCourses(classroom.courses || []);
    } else {
      setEditingClassroom(null);
      setClassName('');
      setCourses([]);
    }
    setSubjectInput('');
    setCourseCodeInput('');
    setSelectedTeacherId('');
    setHoursPerWeek(2);
    setSourceClassForCopy('');
    setIsModalOpen(true);
  };

  const handleSubjectInputChange = (val) => {
    setSubjectInput(val);
    const generated = generateCourseCode(val, className);
    setCourseCodeInput(generated);
  };

  const handleAddCourseRow = () => {
    if (!subjectInput.trim() || !selectedTeacherId || Number(hoursPerWeek) <= 0) return;

    const finalCode = (courseCodeInput.trim() || generateCourseCode(subjectInput, className)).toUpperCase();

    const newCourse = {
      id: `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      subject: subjectInput.trim(),
      code: finalCode,
      teacherId: selectedTeacherId,
      hoursPerWeek: Number(hoursPerWeek) || 1
    };

    setCourses([...courses, newCourse]);
    setSubjectInput('');
    setCourseCodeInput('');
    setSelectedTeacherId('');
    setHoursPerWeek(2);
  };

  const handleRemoveCourseRow = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  // Başka bir sınıftan müfredatı kopyalama motoru
  const handleCopyCurriculum = () => {
    if (!sourceClassForCopy) return;
    const sourceClass = classrooms.find(c => c.id === sourceClassForCopy);
    if (!sourceClass || !sourceClass.courses) return;

    const clonedCourses = sourceClass.courses.map(co => ({
      ...co,
      id: `co_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      code: co.code || generateCourseCode(co.subject, className),
      teacherId: keepTeachersOnCopy ? co.teacherId : ''
    }));

    setCourses([...courses, ...clonedCourses]);
    setSourceClassForCopy('');
  };

  const handleSaveClassroom = (e) => {
    e.preventDefault();
    if (!className.trim()) return;

    if (editingClassroom) {
      updateClassroom(editingClassroom.id, { name: className.trim(), courses });
    } else {
      addClassroom({ name: className.trim(), courses });
    }
    setIsModalOpen(false);
  };

  // Filtrelenmiş Sınıflar
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      // 1. Arama Metni Filtresi
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.courses || []).some(co => co.subject?.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      // 2. Seviye veya Durum Filtresi
      const totalHours = c.courses?.reduce((sum, co) => sum + (Number(co.hoursPerWeek) || 0), 0) || 0;
      if (gradeFilter === 'missing') return totalHours < targetWeeklyHours;
      if (gradeFilter === 'complete') return totalHours === targetWeeklyHours;
      if (gradeFilter === '9') return c.name.startsWith('9');
      if (gradeFilter === '10') return c.name.startsWith('10');
      if (gradeFilter === '11') return c.name.startsWith('11');
      if (gradeFilter === '12') return c.name.startsWith('12');

      return true;
    });
  }, [classrooms, searchTerm, gradeFilter, targetWeeklyHours]);

  const currentModalTotalHours = courses.reduce((sum, c) => sum + (parseInt(c.hoursPerWeek) || 0), 0);

  return (
    <div className="p-6 space-y-6 transition-all duration-300">
      {/* 🧭 DEMO VERİ / MANUEL MOD PROMPT BANNER & MODAL */}
      <DemoDataPromptModal />
      
      {/* ÜST BAŞLIK VE YENİ SINIF BUTONU */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 w-full">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 pt-1">
            <GraduationCap className="text-indigo-600" size={22} /> Sınıflar ve Şubeler
          </h1>
        </div>
        
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={15} /> Yeni Sınıf Ekle
        </button>
      </div>

      {/* KPI İSTATİSTİK ŞERİDİ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Şube</div>
            <div className="text-base font-black text-slate-800">{classrooms.length} Sınıf</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Tamamlanan ({targetWeeklyHours} sa)</div>
            <div className="text-base font-black text-emerald-700">{stats.completeCount} Sınıf</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            stats.missingCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Eksik Müfredatlı</div>
            <div className={`text-base font-black ${stats.missingCount > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
              {stats.missingCount} Sınıf
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Haftalık Toplam Ders</div>
            <div className="text-base font-black text-slate-800">{stats.totalCurriculumHours} Saat</div>
          </div>
        </div>
      </div>

      {/* ARAMA VE SEVİYE FİLTRELERİ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Sınıf adı veya ders adı ile ara (Örn: 9-A, Matematik)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setGradeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              gradeFilter === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tüm Şubeler ({classrooms.length})
          </button>
          
          <button
            type="button"
            onClick={() => setGradeFilter('missing')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              gradeFilter === 'missing' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle size={12} /> Eksik Saatli Sınıflar ({stats.missingCount})
          </button>

          <button
            type="button"
            onClick={() => setGradeFilter('complete')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              gradeFilter === 'complete' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={12} /> 40 Saat Tamamlananlar ({stats.completeCount})
          </button>

          <button
            type="button"
            onClick={() => setGradeFilter('9')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              gradeFilter === '9' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            9. Sınıflar
          </button>

          <button
            type="button"
            onClick={() => setGradeFilter('10')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              gradeFilter === '10' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            10. Sınıflar
          </button>

          <button
            type="button"
            onClick={() => setGradeFilter('11')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              gradeFilter === '11' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            11. Sınıflar
          </button>

          <button
            type="button"
            onClick={() => setGradeFilter('12')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              gradeFilter === '12' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            12. Sınıflar
          </button>
        </div>
      </div>

      {/* SINIF KARTLARI LİSTESİ */}
      {classrooms.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <GraduationCap className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700">Henüz Sınıf Tanımlanmadı</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Sınıf ve şubeleri ekleyerek haftalık müfredat derslerini girmeye başlayabilirsiniz.</p>
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-xs text-slate-400 text-xs italic">
          Seçilen filtre kriterlerine uygun sınıf bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map(c => {
            const totalHours = c.courses?.reduce((sum, co) => sum + (Number(co.hoursPerWeek) || 0), 0) || 0;
            const isComplete = totalHours === targetWeeklyHours;
            const isMissing = totalHours < targetWeeklyHours;
            const progressPercent = Math.min(100, Math.round((totalHours / targetWeeklyHours) * 100));

            return (
              <div 
                key={c.id} 
                className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 ${
                  isMissing 
                    ? 'border-amber-300/80 bg-amber-50/15' 
                    : isComplete 
                      ? 'border-slate-200' 
                      : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{c.name} Şubesi</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {c.courses?.length || 0} Ders
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => openModal(c)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Müfredatı Düzenle"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => { if(window.confirm(`${c.name} sınıfını ve tüm ders atamalarını silmek istediğinize emin misiniz?`)) deleteClassroom(c.id); }} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Sınıfı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* İLERLEME ÇUBUĞU (HEDEF: 40 SAAT) */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-400 uppercase">Haftalık Müfredat Yükü</span>
                      <span className={isComplete ? 'text-emerald-700' : isMissing ? 'text-amber-800' : 'text-rose-700'}>
                        {totalHours} / {targetWeeklyHours} Saat ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-emerald-500' : isMissing ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* DERS LİSTESİ */}
                  <div className="mt-3 space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {c.courses && c.courses.length > 0 ? (
                      c.courses.map((co, cIdx) => {
                        const tObj = teachers.find(t => t.id === co.teacherId);
                        return (
                          <div key={cIdx} className="flex justify-between items-center text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono shrink-0">
                                {co.code || generateCourseCode(co.subject, c.name)}
                              </span>
                              <span className="truncate">{co.subject}</span>
                            </span>
                            <span className="text-slate-500 font-semibold text-[10px] shrink-0 ml-2">
                              {tObj ? tObj.name.split(' ')[0] : 'Atanmamış'} <strong className="text-slate-800">({co.hoursPerWeek} sa)</strong>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[10px] text-slate-400 italic">
                        Henüz ders atanmadı.
                      </div>
                    )}
                  </div>
                </div>

                {/* DURUM ROZETİ */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                      <CheckCircle2 size={11} /> 40 Saat Tamam
                    </span>
                  ) : isMissing ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-[10px]">
                      <AlertTriangle size={11} /> {targetWeeklyHours - totalHours} Saat Eksik
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md text-[10px]">
                      <AlertTriangle size={11} /> {totalHours - targetWeeklyHours} Saat Fazla
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => openModal(c)}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <span>Ders Ekle / Düzenle</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: SINIF VE MÜFREDAT DÜZENLEME FORMU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 shrink-0">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingClassroom ? `${className} Şubesi Müfredat Düzenleme` : 'Yeni Sınıf & Müfredat Tanımlama'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mevcut Toplam: <strong className={currentModalTotalHours === targetWeeklyHours ? 'text-emerald-700' : 'text-amber-800'}>{currentModalTotalHours} / {targetWeeklyHours} Saat</strong>
                </p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClassroom} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              
              <div className="space-y-1 max-w-xs">
                <label className="font-bold text-slate-700">Sınıf / Şube Adı</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Örn: 9-A, 10-B, 11-A-İH" 
                  value={className} 
                  onChange={(e) => setClassName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" 
                />
              </div>

              {/* 💡 BAŞKA SINIFTAN MÜFREDAT KOPYALAMA MOTORU */}
              {classrooms.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                    <Copy size={13} className="text-indigo-600" />
                    <span>Müfredatı Başka Bir Sınıftan Kopyala</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={sourceClassForCopy}
                      onChange={(e) => setSourceClassForCopy(e.target.value)}
                      className="bg-white border border-indigo-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 flex-1 outline-none"
                    >
                      <option value="">Kaynak Sınıf Seçin...</option>
                      {classrooms.filter(c => c.id !== editingClassroom?.id).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} Şubesi ({c.courses?.length || 0} ders, {c.courses?.reduce((s, co) => s + (Number(co.hoursPerWeek)||0), 0) || 0} saat)
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-900 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keepTeachersOnCopy}
                        onChange={(e) => setKeepTeachersOnCopy(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Öğretmenleri de Koru</span>
                    </label>

                    <button
                      type="button"
                      disabled={!sourceClassForCopy}
                      onClick={handleCopyCurriculum}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] shrink-0"
                    >
                      Dersleri İçe Aktar
                    </button>
                  </div>
                </div>
              )}

              {/* YENİ DERS EKLEME FORMU */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Plus size={13} className="text-indigo-600" /> Sınıf Müfredatına Ders Ekle
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1 relative sm:col-span-1">
                    <label className="font-bold text-slate-600 flex items-center gap-1"><BookOpen size={12}/> Ders Adı</label>
                    <input 
                      type="text" 
                      list="subjects_pool_class" 
                      placeholder="Örn: Matematik" 
                      value={subjectInput} 
                      onChange={(e) => handleSubjectInputChange(e.target.value)} 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" 
                    />
                    <datalist id="subjects_pool_class">
                      {subjectSuggestions.map((sub, sIdx) => <option key={sIdx} value={sub} />)}
                    </datalist>
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-slate-600 flex items-center gap-1"><Hash size={12}/> Ders Kodu</label>
                    <input 
                      type="text" 
                      placeholder="Örn: MAT9" 
                      value={courseCodeInput} 
                      onChange={(e) => setCourseCodeInput(e.target.value.toUpperCase())} 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 uppercase font-mono" 
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-slate-600 flex items-center gap-1"><User size={12}/> Öğretmen</label>
                    <select 
                      value={selectedTeacherId} 
                      onChange={(e) => setSelectedTeacherId(e.target.value)} 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold focus:outline-none text-slate-800 cursor-pointer"
                    >
                      <option value="">Öğretmen Seçin...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.branch || 'Branşsız'})</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 items-center sm:col-span-1">
                    <div className="space-y-1 flex-1">
                      <label className="font-bold text-slate-600">Saat</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="12" 
                        value={hoursPerWeek} 
                        onChange={(e) => setHoursPerWeek(e.target.value)} 
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-black focus:outline-none text-slate-800 text-center" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddCourseRow} 
                      disabled={!subjectInput.trim() || !selectedTeacherId} 
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm mt-4 text-xs h-[38px]"
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                {branchWarning && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[10px] font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <span>{branchWarning}</span>
                  </div>
                )}
              </div>

              {/* EKLENMİŞ DERSLER TABLOSU */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="font-extrabold text-slate-800 text-xs">Müfredat Sepeti ({courses.length} Ders)</label>
                  <span className="text-[11px] font-extrabold text-indigo-700">Toplam: {currentModalTotalHours} Saat</span>
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                  {courses.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 italic">
                      Bu sınıfa henüz bir ders eklenmedi. Yukarıdaki formdan ders ekleyin veya başka bir sınıftan kopyalayın.
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">Kod</th>
                          <th className="p-2.5">Ders Adı</th>
                          <th className="p-2.5">Atanan Öğretmen</th>
                          <th className="p-2.5 text-center">Haftalık Saat</th>
                          <th className="p-2.5 w-12 text-center">Sil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono font-bold text-indigo-700">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px]">
                                {course.code || generateCourseCode(course.subject, className)}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">{course.subject}</td>
                            <td className="p-2.5 text-slate-600 font-medium">
                              {teachers.find(t => t.id === course.teacherId)?.name || <span className="text-slate-400 italic">Atanmamış</span>}
                            </td>
                            <td className="p-2.5 text-center font-black text-indigo-600">{course.hoursPerWeek} Saat</td>
                            <td className="p-2.5 text-center">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveCourseRow(course.id)} 
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl shadow-sm cursor-pointer"
                >
                  Sınıfı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}