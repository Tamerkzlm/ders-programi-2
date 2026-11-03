// frontend/src/pages/Subjects.jsx
import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { BookOpen, Plus, Trash2, Search, Sparkles, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DemoDataPromptModal from '../components/common/DemoDataPromptModal';
import { generateCourseCode, COMMON_SUBJECT_TEMPLATES } from '../utils/courseCodeHelper';

export default function Subjects() {
  const { classrooms, updateClassroom } = useAppStore();
  const navigate = useNavigate();
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customSubjectList, setCustomSubjectList] = useState([]);

  // Ders adı yazıldıkça otomatik ders kodu önerisi üret
  const handleSubjectNameChange = (val) => {
    setNewSubjectName(val);
    if (!newSubjectCode || newSubjectCode === generateCourseCode(newSubjectName)) {
      setNewSubjectCode(generateCourseCode(val));
    }
  };

  // Tüm sınıflardaki dersleri ve varsa manuel listeyi tarayarak global bir "Ders Havuzu" çıkarıyoruz
  const globalSubjects = useMemo(() => {
    const subMap = new Map();

    // 1. Sınıflardan topla
    classrooms.forEach(c => {
      c.courses?.forEach(co => {
        if (co.subject) {
          const sName = co.subject.trim();
          const sCode = co.code || generateCourseCode(sName, c.name);
          if (!subMap.has(sName.toLowerCase())) {
            subMap.set(sName.toLowerCase(), { name: sName, code: sCode });
          }
        }
      });
    });

    // 2. Manuel eklenenlerden topla
    customSubjectList.forEach(item => {
      if (!subMap.has(item.name.toLowerCase())) {
        subMap.set(item.name.toLowerCase(), item);
      }
    });

    // Eğer havuz tamamen boşsa MEB şablonlarından birkaç temel ders ver
    if (subMap.size === 0) {
      COMMON_SUBJECT_TEMPLATES.slice(0, 10).forEach(tmpl => {
        subMap.set(tmpl.name.toLowerCase(), { name: tmpl.name, code: tmpl.rootCode });
      });
    }

    return Array.from(subMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [classrooms, customSubjectList]);

  // Yeni Ders Ekleme
  const handleAddSubject = (e) => {
    e.preventDefault();
    const cleanName = newSubjectName.trim();
    if (!cleanName) return;

    const cleanCode = (newSubjectCode.trim() || generateCourseCode(cleanName)).toUpperCase();

    if (globalSubjects.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Bu ders zaten havuzda mevcut!");
      return;
    }

    // Havuz listesine ekle
    setCustomSubjectList(prev => [...prev, { name: cleanName, code: cleanCode }]);

    // Eğer sınıflar varsa ilk sınıfa 0 saatlik dummy havuz dersi olarak da bağla
    if (classrooms.length > 0) {
      const target = classrooms[0];
      const dummyCourse = {
        id: `sub_${Date.now()}`,
        subject: cleanName,
        code: cleanCode,
        teacherId: target.courses?.[0]?.teacherId || '',
        hoursPerWeek: 0 // 0 saat olduğu için dağıtımda dikkate alınmaz, sadece havuz dersidir
      };
      updateClassroom(target.id, {
        courses: [...(target.courses || []), dummyCourse]
      });
    }

    setNewSubjectName('');
    setNewSubjectCode('');
  };

  // Şablondan Toplu Ekleme
  const handleAddTemplateSubject = (tmpl) => {
    if (globalSubjects.some(s => s.name.toLowerCase() === tmpl.name.toLowerCase())) {
      return;
    }
    setCustomSubjectList(prev => [...prev, { name: tmpl.name, code: tmpl.rootCode }]);
  };

  const handleDeleteSubject = (subjectToDelete) => {
    if (window.confirm(`"${subjectToDelete}" dersini tüm okul havuzundan silmek istediğinize emin misiniz?`)) {
      setCustomSubjectList(prev => prev.filter(s => s.name.toLowerCase() !== subjectToDelete.toLowerCase()));
      classrooms.forEach(c => {
        if (c.courses) {
          const filtered = c.courses.filter(co => co.subject.trim().toLowerCase() !== subjectToDelete.toLowerCase());
          if (filtered.length !== c.courses.length) {
            updateClassroom(c.id, { courses: filtered });
          }
        }
      });
    }
  };

  const filteredSubjects = globalSubjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* 🧭 DEMO VERİ / MANUEL MOD PROMPT BANNER & MODAL */}
      <DemoDataPromptModal />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <button onClick={() => navigate('/')} className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors mb-1">
            ← Ana Sayfaya Dön
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={22} /> Dersler ve Branşlar
          </h1>
        </div>
      </div>

      {/* DERS VE DERS KODU EKLEME FORMU */}
      <form onSubmit={handleAddSubject} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
        <div className="space-y-1 flex-1 w-full">
          <label className="font-bold text-gray-600 text-xs">Yeni Ders / Branş Adı</label>
          <input 
            type="text" 
            required 
            placeholder="Örn: Matematik, Fizik..." 
            value={newSubjectName} 
            onChange={(e) => handleSubjectNameChange(e.target.value)} 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" 
          />
        </div>

        <div className="space-y-1 w-full sm:w-36">
          <label className="font-bold text-gray-600 text-xs flex items-center gap-1">
            <Hash size={12} className="text-blue-600" /> Ders Kodu
          </label>
          <input 
            type="text" 
            placeholder="Örn: MAT" 
            value={newSubjectCode} 
            onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())} 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 uppercase font-mono" 
          />
        </div>

        <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5 h-[38px] shrink-0">
          <Plus size={15} /> Dersi Ekle
        </button>
      </form>

      {/* HIZLI ŞABLON DERSLER */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
          <Sparkles size={14} className="text-blue-600" />
          <span>MEB Standart Ders Şablonları</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SUBJECT_TEMPLATES.map((tmpl, idx) => {
            const alreadyAdded = globalSubjects.some(s => s.name.toLowerCase() === tmpl.name.toLowerCase());
            return (
              <button
                key={idx}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddTemplateSubject(tmpl)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  alreadyAdded
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white cursor-pointer shadow-2xs'
                }`}
              >
                <span>{tmpl.name}</span>
                <span className="text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-mono">
                  {tmpl.rootCode}
                </span>
                {!alreadyAdded && <Plus size={10} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ARAMA VE LİSTE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input 
              type="text" 
              placeholder="Ders adı veya kodu ile ara (Örn: MAT)..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <span className="text-xs font-bold text-gray-500">
            Toplam {filteredSubjects.length} Tanımlı Ders
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredSubjects.map((sub, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-800 shadow-2xs group hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono shrink-0">
                  {sub.code || generateCourseCode(sub.name)}
                </span>
                <span className="truncate">{sub.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => handleDeleteSubject(sub.name)} 
                className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0" 
                title="Dersi Sil"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
