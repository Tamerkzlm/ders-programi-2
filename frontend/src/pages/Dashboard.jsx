// frontend/src/pages/Dashboard.jsx
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckCircle2, Circle, ArrowRight, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { settings, teachers, classrooms, timetable } = useAppStore();
  const navigate = useNavigate();

  const isSettingsConfigured = !!settings?.schoolName && (settings?.days?.length > 0);
  const teacherCount = teachers?.length || 0;
  const classroomCount = classrooms?.length || 0;
  const totalCourseHours = classrooms.reduce((sum, c) => sum + (c.courses?.reduce((s, co) => s + co.hoursPerWeek, 0) || 0), 0);
  const isTimetableGenerated = timetable && Object.keys(timetable).length > 0;

  const checklist = [
    { id: 'settings', title: 'Okul Parametreleri & Zaman Ayarları', status: isSettingsConfigured, metaText: isSettingsConfigured ? '✓ Yapılandırıldı' : 'Eksik', path: '/settings' },
    { id: 'teachers', title: 'Öğretmen Kadrosu & Branş Tanımları', status: teacherCount > 0, metaText: `${teacherCount} Öğretmen Aktif`, path: '/teachers' },
    { id: 'classrooms', title: 'Sınıflar & Haftalık Müfredat Sepeti', status: classroomCount > 0 && totalCourseHours > 0, metaText: `${classroomCount} Sınıf (${totalCourseHours} Saat Ders)`, path: '/classrooms' },
    { id: 'generate', title: 'Dağıtım Motoru', status: isTimetableGenerated, metaText: isTimetableGenerated ? '✓ Program Hazır' : 'Henüz Dağıtılmadı', path: '/generate' }
  ];

  const completedSteps = checklist.filter(item => item.status).length;
  const completionPercentage = Math.round((completedSteps / checklist.length) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 transition-all duration-300">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
          <LayoutDashboard className="text-blue-600" size={22} /> {settings?.schoolName || 'Hz. Ayşe Kız Anadolu İmam Hatip Lisesi'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-700 flex items-center gap-1.5"><TrendingUp size={15} className="text-blue-600" /> Kurumsal Veri Entegrasyon Oranı</span>
          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">%{completionPercentage}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">Kurulum ve Dağıtım Adımları</h3>
        <div className="grid grid-cols-1 gap-3">
          {checklist.map((item, index) => (
            <div key={item.id} className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all ${item.status ? 'border-green-100 bg-green-50/10' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{item.status ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-gray-300" size={18} />}</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800 tracking-tight">{index + 1}. {item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.status ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.metaText}</span>
                </div>
              </div>
              <button onClick={() => navigate(item.path)} className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border bg-white text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
                <span>Verileri İncele</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}