// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout'; 
import ModuleHub from './pages/ModuleHub';
import KelebekPlanner from './pages/KelebekPlanner';
import DykPlanner from './pages/DykPlanner';
import ExamPlanner from './pages/ExamPlanner';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classrooms from './pages/Classrooms';
import Assignments from './pages/Assignments'; 
import Subjects from './pages/Subjects';
import Constraints from './pages/Constraints';
import Settings from './pages/Settings';
import Generate from './pages/Generate';
import Export from './pages/Export';
import TimetableBoard from './pages/TimetableBoard'; 
import MobileTeacherView from './pages/MobileTeacherView';

export default function App() {
  return (
    <Router>
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
    </Router>
  );
}
