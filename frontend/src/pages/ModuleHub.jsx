// frontend/src/pages/ModuleHub.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  GraduationCap, 
  FileSpreadsheet, 
  Layers,
  ArrowRight, 
  Sparkles,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  Shuffle
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function ModuleHub() {
  const navigate = useNavigate();
  const { settings, teachers, classrooms, dykGroups, examSettings } = useAppStore();

  const totalCourseHours = (classrooms || []).reduce((acc, c) => 
    acc + (c.courses || []).reduce((s, co) => s + (Number(co.hoursPerWeek) || 0), 0), 0
  );

  const modules = [
    {
      id: 'timetable',
      title: 'Haftalık Ders Dağıtım Motoru',
      badge: 'MEB Maarif Modeli',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
      description: 'Öğretmen boş gün güvencesi, adalet skoru, nöbet analizi, akıllı motor ve resmi haftalık ders çizelgeleme sistemi.',
      icon: <CalendarDays size={32} className="text-indigo-600" />,
      features: [
        '35 Öğretmen, 18 Şube Tam Uyum',
        'Nöbet Günü Analizi & Smart Swap',
        'Öğretmenler Odası Adalet Skoru',
        '2 Saatlik Blok Bütünlüğü Garantisi'
      ],
      stats: [
        { label: 'Öğretmen', value: teachers?.length || 35 },
        { label: 'Şube', value: classrooms?.length || 18 },
        { label: 'Ders Yükü', value: `${totalCourseHours} Saat` }
      ],
      borderColor: 'hover:border-indigo-500/60',
      actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20',
      actionText: 'Ders Programını Yönet',
      path: '/dashboard'
    },
    {
      id: 'dyk',
      title: 'DYK Kurs Programı',
      badge: 'Destekleme & Yetiştirme',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      description: 'Hafta içi ve Cumartesi günleri için 15:50-17:00 ve 18:00-19:10 ikişer derslik blok saatlerinde akıllı kurs planlama.',
      icon: <GraduationCap size={32} className="text-emerald-600" />,
      features: [
        '1. Blok: 15:50 - 17:00 (2 Ders)',
        '2. Blok: 18:00 - 19:10 (2 Ders)',
        'Öğretmen Gün Tercihleri Mühürlü',
        'Sınıf & Öğretmen Çakışmasız Dağıtım'
      ],
      stats: [
        { label: 'Aktif Grup', value: dykGroups?.length || 4 },
        { label: 'Blok Düzeni', value: '2 Blok / Gün' },
        { label: 'Saat Aralığı', value: '15:50 - 19:10' }
      ],
      borderColor: 'hover:border-emerald-500/60',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
      actionText: 'DYK Programını Başlat',
      path: '/dyk'
    },
    {
      id: 'kelebek',
      title: 'Kelebek Sistemi',
      badge: 'Karma Salon Dağıtımı',
      badgeStyle: 'bg-violet-50 text-violet-700 border-violet-200/70',
      description: 'Farklı kademelerden (9, 10, 11, 12) öğrencilerin salonlara çapraz yerleştirildiği hile önleyici sınav oturma planı.',
      icon: <Layers size={32} className="text-violet-600" />,
      features: [
        'Farklı Kademeler Çapraz Oturma',
        'Salon Kapasitesi & Sıra Düzeni',
        'Yoklama Tutanağı & İsim Listesi',
        'Tek Tıkla PDF ve Çıktı Üretimi'
      ],
      stats: [
        { label: 'Salon Sayısı', value: classrooms?.length || 18 },
        { label: 'Kademeler', value: '9-10-11-12' },
        { label: 'Düzen', value: 'Çapraz / Karışık' }
      ],
      borderColor: 'hover:border-violet-500/60',
      actionBtn: 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20',
      actionText: 'Kelebek Sistemini Aç',
      path: '/kelebek'
    },
    {
      id: 'exams',
      title: 'Ortak Sınav Takvimi',
      badge: 'Resmi MEB Formatı',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200/70',
      description: 'Tarih aralığı, seans seçimi, ana ders kısıtı (aynı güne tek ana ders) ve öğretmen gözetmenlik planlaması.',
      icon: <FileSpreadsheet size={32} className="text-amber-600" />,
      features: [
        'Aynı Gün Tek Ana Ders Kuralı',
        'Günün İlk Seansı Şartı',
        'Gözetmen Öğretmen Eşleştirmesi',
        'Resmi Okul Panosu Matris Çıktısı'
      ],
      stats: [
        { label: 'Sınav Seansları', value: (examSettings?.examSlots || [3, 5]).map(s => `${s}. Saat`).join(', ') },
        { label: 'Seçili Kademeler', value: '9, 10, 11, 12' },
        { label: 'Kural Güvencesi', value: '%100 Katı' }
      ],
      borderColor: 'hover:border-amber-500/60',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20',
      actionText: 'Sınav Takvimini Hazırla',
      path: '/exams'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
      
      {/* 🏛️ ÜST KURUMSAL HEADER */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-600/30">
              MEB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Resmi Maarif v2.4
                </span>
                <span className="text-xs font-semibold text-slate-400">|</span>
                <span className="text-xs font-semibold text-slate-500">Akademik Planlama Portalı</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {settings?.schoolName || 'Antakya Hz. Ayşe Kız Anadolu İmam Hatip Lisesi'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>4 Modül Çevrimiçi</span>
            </div>
          </div>

        </div>
      </header>

      {/* 🚀 ANA MODÜL KARTLARI (2x2 GRID) */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Akademik Modül Seçimi
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Lütfen üzerinde çalışmak istediğiniz planlama sistemini seçin:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((m) => (
            <div
              key={m.id}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 group ${m.borderColor}`}
            >
              <div className="space-y-4">
                
                {/* Kart Başlığı ve Rozet */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform shrink-0">
                      {m.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {m.title}
                      </h3>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 ${m.badgeStyle}`}>
                        {m.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Açıklama */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {m.description}
                </p>

                {/* Özellikler */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  {m.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* İstatistikler & Eylem Butonu */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center">
                  {m.stats.map((s, sIdx) => (
                    <div key={sIdx}>
                      <span className="block text-[10px] text-slate-400 font-medium truncate">{s.label}</span>
                      <span className="block text-xs font-extrabold text-slate-800 truncate">{s.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(m.path)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer group/btn ${m.actionBtn}`}
                >
                  <span>{m.actionText}</span>
                  <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* 📌 ALT BİLGİ & SÜRÜM */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 {settings?.schoolName || 'Antakya Hz. Ayşe Kız AİHL'} - Kurumsal Yönetim Paketi</span>
          <span className="text-[11px] text-slate-400">OR-Tools v9.8 CP-SAT Motoru Destekli</span>
        </div>
      </footer>

    </div>
  );
}
