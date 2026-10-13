// frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout'; 
import ModuleHub from './pages/ModuleHub';

// 🚀 Yüksek Performanslı Sayfa Bazlı Kod Bölme (Code Splitting)
const KelebekPlanner = lazy(() => import('./pages/KelebekPlanner'));
const DykPlanner = lazy(() => import('./pages/DykPlanner'));
const ExamPlanner = lazy(() => import('./pages/ExamPlanner'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Classrooms = lazy(() => import('./pages/Classrooms'));
const Assignments = lazy(() => import('./pages/Assignments')); 
const Subjects = lazy(() => import('./pages/Subjects'));
const Constraints = lazy(() => import('./pages/Constraints'));
const Settings = lazy(() => import('./pages/Settings'));
const Generate = lazy(() => import('./pages/Generate'));
const Export = lazy(() => import('./pages/Export'));
const TimetableBoard = lazy(() => import('./pages/TimetableBoard')); 
const MobileTeacherView = lazy(() => import('./pages/MobileTeacherView'));

const PageLoading = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">Sayfa Yükleniyor...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* 🌟 1. ANA AÇILIŞ PORTALI (4 Büyük Modül: Ders Programı, DYK, Kelebek, Sınav) */}
            <Route path="/" element={<ModuleHub />} />

            {/* 🎯 2. DYK (DESTEKLEME VE YETİŞTİRME KURSU) MODÜLÜ */}
            <Route path="/dyk" element={<DykPlanner />} />

            {/* 🦋 3. KELEBEK SİSTEMİ (KARMA SALON SINAV DAĞITIMI) MODÜLÜ */}
            <Route path="/kelebek" element={<KelebekPlanner />} />

            {/* 🎓 4. OKUL ORTAK SINAV TAKVİMİ MODÜLÜ */}
            <Route path="/exams" element={<ExamPlanner />} />

            {/* 🏫 HAFTALIK DERS PROGRAMI SUITE (Sidebar Layout ile) */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/teachers" element={<Teachers />} />
              
              {/* Tanımlamalar ve Atama Rotaları */}
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/classrooms" element={<Classrooms />} />
              <Route path="/assignments" element={<Assignments />} />
              
              {/* Kural & Öncelik Yönetimi (Birleştirilmiş Merkez) */}
              <Route path="/constraints" element={<Constraints />} />
              <Route path="/constraints-hard" element={<Navigate to="/constraints" replace />} />
              <Route path="/constraints-soft" element={<Navigate to="/constraints" replace />} />
              
              {/* Dağıtım ve Çıktı Rotaları */}
              <Route path="/generate" element={<Generate />} />
              <Route path="/timetable" element={<TimetableBoard />} />
              <Route path="/export" element={<Export />} />
            </Route>
            
            {/* 📱 Mobil Öğretmen Web Portalı (Sidebar'sız Fullscreen App View) */}
            <Route path="/mobile" element={<MobileTeacherView />} />
            <Route path="/mobile/teacher/:teacherId" element={<MobileTeacherView />} />

            {/* Tanımsız bir URL girilirse ana portala yönlendir */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

