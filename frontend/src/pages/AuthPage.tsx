// frontend/src/pages/AuthPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  CloudOff,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { initializeUserCloudSession, useCloudSyncStore, signOutAndPurgeLocal } from '../services/cloudSyncService';
import { useAppStore } from '../store/appStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, schoolRecord } = useCloudSyncStore();
  const { settings } = useAppStore();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [schoolName, setSchoolName] = useState(settings?.schoolName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLocalDataOnRegister, setKeepLocalDataOnRegister] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanSchool = schoolName.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    if (mode === 'register' && cleanSchool.length < 3) {
      setErrorMsg('Lütfen okulunuzun tam adını girin (en az 3 karakter).');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Supabase bağlantı anahtarları (.env) henüz tanımlanmamış. Çevrimdışı modda devam edebilirsiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        if (data?.user) {
          await initializeUserCloudSession(data.user);
          navigate('/');
        }
      } else {
        if (!keepLocalDataOnRegister) {
          useAppStore.getState().clearDataForManualEntry();
          useAppStore.getState().updateSettings({ schoolName: cleanSchool });
        } else {
          useAppStore.getState().updateSettings({ schoolName: cleanSchool });
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { school_name: cleanSchool },
          },
        });
        if (error) throw error;

        if (data?.session?.user) {
          await initializeUserCloudSession(data.session.user, cleanSchool);
          navigate('/');
        } else {
          setInfoMsg(
            'Okul kaydınız oluşturuldu! E-posta doğrulaması aktifse lütfen gelen kutunuzu onaylayıp giriş yapın.'
          );
          setMode('login');
        }
      }
    } catch (err) {
      const raw = err?.message || '';
      if (raw.includes('Invalid login credentials')) {
        setErrorMsg('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
      } else if (raw.includes('User already registered')) {
        setErrorMsg('Bu e-posta adresiyle kayıtlı bir okul zaten var. Lütfen "Okul Girişi" sekmesini kullanın.');
      } else {
        setErrorMsg(raw || 'İşlem sırasında bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10">
        {/* Üst Başlık */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Portala Dön</span>
          </button>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck size={13} />
            <span>Çoklu Okul Bulut Sistemi</span>
          </span>
        </div>

        <div className="space-y-1.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Building2 size={24} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Okul Yönetim & Planlama Bulutu
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Programlarınızı bulutta güvenle yedekleyin, farklı bilgisayarlardan erişin ve öğretmenlerinizle canlı mobil link paylaşın.
          </p>
        </div>

        {user ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-center">
            <div className="text-xs font-bold text-emerald-400">Aktif Oturum Açık</div>
            <div className="text-sm font-black text-white">{schoolRecord?.school_name || settings?.schoolName}</div>
            <div className="text-xs text-slate-400">{user.email}</div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Programa Geç
              </button>
              <button
                type="button"
                onClick={() => signOutAndPurgeLocal(true)}
                className="flex-1 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/50 text-red-300 font-bold text-xs cursor-pointer"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Giriş / Kayıt Sekmeleri */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn size={14} />
                <span>Okul Girişi</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setInfoMsg(''); }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus size={14} />
                <span>Yeni Okul Kaydı</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs font-medium flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Kurum / Okul Adı
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Örn: Atatürk Anadolu Lisesi"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-semibold outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Kurumsal veya Kişisel E-Posta
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="muduryardimcisi@okul.k12.tr"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Şifre
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepLocalDataOnRegister}
                    onChange={(e) => setKeepLocalDataOnRegister(e.target.checked)}
                    className="mt-0.5 rounded accent-indigo-600"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    Tarayıcımda şu an açık olan ders/öğretmen verilerini yeni okul hesabıma aktar
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      (İşareti kaldırırsanız sıfırdan boş bir okul veritabanı açılır)
                    </span>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn size={15} />
                    <span>Okul Hesabına Giriş Yap</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Okul Kaydını Oluştur ve Buluta Yedekle</span>
                  </>
                )}
              </button>
            </form>

            {/* Misafir / Çevrimdışı Mod */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <CloudOff size={13} />
                <span>Üye Olmadan Tarayıcı Hafızasında (Çevrimdışı) Devam Et</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
