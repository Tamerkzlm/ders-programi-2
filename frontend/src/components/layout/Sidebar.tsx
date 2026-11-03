// frontend/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Network, 
  Sliders, 
  Cpu, 
  Printer,
  CalendarDays,
  LayoutGrid,
  FileSpreadsheet,
  ArrowLeftRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import CloudSyncBar from '../common/CloudSyncBar';
import { APP_VERSION_LABEL } from '../../config/version';

export default function Sidebar() {
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const schoolName = settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL';

  const menuGroups = [
    {
      title: '1. Temel Veriler',
      items: [
        { path: '/settings', icon: <Building2 size={16} />, label: 'Kurum Ayarları' }
      ]
    },
    {
      title: '2. Tanımlamalar & Atamalar',
      items: [
        { path: '/teachers', icon: <Users size={16} />, label: 'Öğretmenler' },
        { path: '/subjects', icon: <BookOpen size={16} />, label: 'Dersler' },
        { path: '/classrooms', icon: <GraduationCap size={16} />, label: 'Sınıflar & Şubeler' },
        { path: '/assignments', icon: <Network size={16} />, label: 'Ders Atamaları' }
      ]
    },
    {
      title: '3. Kural & Öncelik',
      items: [
        { path: '/constraints', icon: <Sliders size={16} />, label: 'Kural & Öncelikler' }
      ]
    },
    {
      title: '4. Dağıtım ve Çıktı',
      items: [
        { path: '/generate', icon: <Cpu size={16} />, label: 'Dağıtım Motoru' },
        { path: '/timetable', icon: <CalendarDays size={16} />, label: 'Manuel Düzenleme' },
        { path: '/export', icon: <Printer size={16} />, label: 'Resmi Çıktılar' }
      ]
    },
    {
      title: 'Diğer Akademik Modüller',
      items: [
        { 
          path: '/dyk', 
          icon: <GraduationCap size={16} className="text-emerald-600" />, 
          label: 'DYK Kurs Programı',
          badge: 'Aktif'
        },
        { 
          path: '/exams', 
          icon: <FileSpreadsheet size={16} className="text-amber-600" />, 
          label: 'Ortak Sınav Takvimi' 
        },
        { 
          path: '/kelebek', 
          icon: <Layers size={16} className="text-indigo-600" />, 
          label: 'Kelebek Sistemi',
          badge: 'Yeni'
        }
      ]
    }
  ];

  return (
    <aside className="print:hidden w-64 bg-white text-slate-700 border-r border-slate-200/80 flex flex-col shadow-xs z-10 shrink-0 select-none">
      
      {/* 🏫 KURUM BAŞLIĞI & MODÜL DEĞİŞTİRME BUTONU */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        
        {/* Hızlı Dönüş Butonu */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 text-slate-700 hover:text-indigo-700 transition-all text-xs font-semibold shadow-2xs group cursor-pointer"
          title="Merkezi Modül Portalına Dön"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className="text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Modül Değiştir</span>
          </div>
          <ArrowLeftRight size={13} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </button>

        {/* Okul ve Program Başlığı */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-600/30 shrink-0">
            MA
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-xs text-slate-900 truncate uppercase tracking-tight" title={schoolName}>
              {schoolName}
            </h1>
            <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles size={11} />
              <span>Ders Dağıtım Motoru</span>
            </p>
          </div>
        </div>

      </div>

      {/* 🧭 DİKEY NAVİGASYON LİSTESİ */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
              {group.title}
            </h2>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600 shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ⚙️ ALT KURUMSAL BİLGİ & HAZIRLAYAN */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2 text-[11px]">
        <CloudSyncBar compact />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700 font-bold">Hazırlayan: Tamer Közleme</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <a
            href="https://instagram.com/Tamerkzlm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
          >
            instagram: Tamerkzlm
          </a>
          <span className="text-slate-400 font-mono">{APP_VERSION_LABEL} • Çevrimiçi</span>
        </div>
      </div>

    </aside>
  );
}
