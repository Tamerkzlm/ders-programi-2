// frontend/src/components/common/CloudSyncBar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  Share2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import {
  useCloudSyncStore,
  flushCloudSyncNow,
  signOutAndPurgeLocal,
} from '../../services/cloudSyncService';

export default function CloudSyncBar({ compact = false }) {
  const navigate = useNavigate();
  const { user, schoolRecord, syncStatus } = useCloudSyncStore();
  const [copiedShare, setCopiedShare] = useState(false);

  const shareCode = schoolRecord?.share_code;

  const handleCopyMobileShareLink = () => {
    if (!shareCode || typeof window === 'undefined') return;
    const url = `${window.location.origin}/mobile/s/${shareCode}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <button
        type="button"
        onClick={() => navigate('/auth')}
        title="Bulut senkronizasyonu için .env dosyasına Supabase bilgilerini ekleyin"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-bold text-slate-600 transition-all cursor-pointer"
      >
        <CloudOff size={13} className="text-slate-500" />
        <span>⚡ Yerel Mod</span>
      </button>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => navigate('/auth')}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
      >
        <LogIn size={13} />
        <span>Okul Girişi / Bulut Yedek</span>
      </button>
    );
  }

  const statusMeta = {
    loading: { label: 'Bulut Yükleniyor...', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', spin: true },
    syncing: { label: 'Kaydediliyor...', color: 'text-amber-700 bg-amber-50 border-amber-200', spin: true },
    synced: { label: 'Bulutla Eşitlendi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', spin: false },
    offline: { label: 'Çevrimdışı (Yerel)', color: 'text-slate-600 bg-slate-100 border-slate-200', spin: false },
    error: { label: 'Eşitleme Uyarısı', color: 'text-red-700 bg-red-50 border-red-200', spin: false },
    idle: { label: 'Bulut Hazır', color: 'text-slate-700 bg-slate-50 border-slate-200', spin: false },
  }[syncStatus] || { label: 'Bulut Aktif', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', spin: false };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${compact ? 'w-full justify-between' : ''}`}>
      {/* Durum Rozeti ve Şimdi Kaydet */}
      <button
        type="button"
        onClick={() => flushCloudSyncNow(true)}
        title="Şimdi Buluta Eşitlemek İçin Tıklayın"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${statusMeta.color}`}
      >
        {syncStatus === 'error' ? (
          <AlertTriangle size={13} />
        ) : (
          <Cloud size={13} />
        )}
        <span>{statusMeta.label}</span>
        <RefreshCw size={11} className={statusMeta.spin ? 'animate-spin' : 'opacity-60 hover:opacity-100'} />
      </button>

      {/* Öğretmen Canlı Mobil Paylaşım Butonu */}
      {shareCode && (
        <button
          type="button"
          onClick={handleCopyMobileShareLink}
          title="Öğretmenlerin kendi telefonlarından şifresiz programı görebileceği canlı linki kopyala"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-all cursor-pointer"
        >
          {copiedShare ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
          <span>{copiedShare ? 'Mobil Link Kopyalandı!' : 'Canlı Öğretmen Linki'}</span>
        </button>
      )}

      {/* Çıkış Yap */}
      <button
        type="button"
        onClick={() => signOutAndPurgeLocal(true)}
        title={`Çıkış Yap (${user.email})`}
        className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
