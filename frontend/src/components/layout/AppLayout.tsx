// frontend/src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased print:block print:bg-white print:h-auto">
      
      {/* 🧭 SOL DİKEY KURUMSAL MENÜ (Print sırasında gizlenir) */}
      <Sidebar />

      {/* 📄 ANA ÇALIŞMA ALANI & SAYFA İÇERİĞİ */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50 print:overflow-visible print:bg-white">
        <Outlet />
      </main>

    </div>
  );
}
