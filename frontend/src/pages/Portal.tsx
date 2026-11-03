// frontend/src/pages/Portal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  GraduationCap, 
  FileSpreadsheet, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { APP_VERSION_LABEL } from '../config/version';

export default function Portal() {
  const navigate = useNavigate();
  const { settings, teachers, classrooms, dykGroups, examSettings } = useAppStore();

  const totalCourseHours = (classrooms || []).reduce((acc, c) => 
    acc + (c.courses || []).reduce((s, co) => s + (Number(co.hoursPerWeek) || 0), 0), 0
  );

  const modules = [
    {
      id: 'timetable',
      title: 'Haftalık Ders Programı',
      badge: 'MEB Maarif Modeli',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Öğretmen boş gün güvencesi, adalet skoru, nöbet analizi, akıllı motor ve resmi haftalık ders dağıtım sistemi.',
      icon: <CalendarDays size={36} className="text-blue-400" />,
      features: [
        '35 Öğretmen, 18 Şube Tam Uyum',
        'Nöbet Günü Analizi & Smart Swap',
        'Öğretmenler Odası Adalet Skoru',
        '2 Saatlik Blok Bütünlüğü Garantisi'
      ],
      stats: [
        { label: 'Öğretmen', value: teachers?.length || 35 },
        { label: 'Şube', value: classrooms?.length || 18 },
        { label: 'Haftalık Yük', value: `${totalCourseHours} Saat` }
      ],
      gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent hover:border-blue-500/50',
      buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
      actionText: 'Ders Programını Yönet',
      path: '/dashboard'
    },
    {
      id: 'dyk',
      title: 'DYK Kurs Programı',
      badge: 'Destekleme & Yetiştirme',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Hafta içi ve Cumartesi günleri için 15:50-17:00 ve 18:00-19:10 ikişer derslik blok saatlerinde akıllı kurs planlama.',
      icon: <GraduationCap size={36} className="text-emerald-400" />,
      features: [
        '1. Blok: 15:50 - 17:00 (2 Ders)',
        '2. Blok: 18:00 - 19:10 (2 Ders)',
        'Öğretmen Gün Tercihleri Mühürlü',
        'Sınıf & Öğretmen Çakışmasız Dağıtım'
      ],
      stats: [
        { label: 'Aktif Grup', value: dykGroups?.length || 4 },
        { label: 'Blok Sayısı', value: '2 Blok / Gün' },
        { label: 'Seans Aralığı', value: '15:50 - 19:10' }
      ],
      gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent hover:border-emerald-500/50',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
      actionText: 'DYK Programını Başlat',
      path: '/dyk'
    },
    {
      id: 'exams',
      title: 'Okul Ortak Sınav Takvimi',
      badge: 'Resmi MEB Sınav Formatı',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Tarih aralığı, seans seçimi, ana ders kısıtı (aynı güne tek ana ders, günün ilk seansı) ile otomatik sınav takvimi.',
      icon: <FileSpreadsheet size={36} className="text-amber-400" />,
      features: [
        'Aynı Gün Tek Ana Ders Kuralı',
        'Ana Ders Günün İlk Sınavı Şartı',
        'İş Günlerine Dengeli Dağıtım',
        'Resmi Okul Panosu Matris Çıktısı'
      ],
      stats: [
        { label: 'Sınav Seansları', value: (examSettings?.examSlots || [3, 5]).map(s => `${s}. Saat`).join(', ') },
        { label: 'Kademeler', value: '9, 10, 11, 12' },
        { label: 'Kural Güvencesi', value: '%100 Katı' }
      ],
      gradient: 'from-amber-600/20 via-orange-600/10 to-transparent hover:border-amber-500/50',
      buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25',
      actionText: 'Sınav Programını Hazırla',
      path: '/exams'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* ÜST BİLGİ VE HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">
              MA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-wide text-white">
                  {settings?.schoolName || 'Hz. Ayşe Kız Anadolu İmam Hatip Lisesi'}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {APP_VERSION_LABEL} Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Maarif Modeli Bütünleşik Eğitim Yönetim Portalı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
              <Sparkles size={14} className="text-amber-400" />
              <span>3 Modül Aktif & Entegre</span>
            </div>
          </div>
        </div>
      </header>

      {/* ANA İÇERİK - 3 BÜYÜK MODÜL BUTONU */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium mb-4">
            <Award size={14} className="text-blue-400" />
            <span>Türkiye MEB Mevzuatı ve Maarif Modeline %100 Uyumlu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Okul Yönetim & Planlama Merkezi
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Haftalık örgün ders programı, Destekleme ve Yetiştirme Kursları (DYK) ve okul ortak sınav takvimini 
            aynı çatı altında yapay zeka ve kural motoruyla yönetin.
          </p>
        </div>

        {/* 3 BÜYÜK KART / BUTON GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(m.path)}
              className={`group cursor-pointer rounded-3xl bg-slate-900/70 border border-slate-800 p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 relative overflow-hidden bg-gradient-to-b ${m.gradient}`}
            >
              {/* Arka plan ışık efekti */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-500" />

              <div>
                {/* İkon & Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {m.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>

                {/* Başlık & Açıklama */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {m.description}
                </p>

                {/* Özellik Maddeleri */}
                <div className="space-y-2 mb-6 border-t border-slate-800/80 pt-4">
                  {m.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Hızlı İstatistikler */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 mb-6 text-center">
                  {m.stats.map((s, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">{s.label}</span>
                      <span className="text-xs font-bold text-slate-200 truncate">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aksiyon Butonu */}
              <button
                type="button"
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${m.buttonClass}`}
              >
                <span>{m.actionText}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* ALT FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Türkiye Yüzyılı Maarif Modeli Normatif Standartları</span>
          </div>
          <div>
            <span>Tüm Hakları Saklıdır © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
