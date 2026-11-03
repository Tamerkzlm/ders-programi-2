// frontend/src/pages/MobileTeacherView.jsx
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useCloudSyncStore } from '../services/cloudSyncService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { calculateTeacherDutyDay } from '../utils/dutyDayCalculator';
import { QRCodeSVG } from '../utils/qrCodeGenerator';
import {
  Calendar,
  GraduationCap,
  ShieldCheck,
  Share2,
  ArrowLeft,
  Search,
  Coffee,
  Sparkles,
  Check,
  Printer,
  QrCode,
  FileCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function MobileTeacherView() {
  const { shareCode: paramShareCode, teacherId: paramTeacherId } = useParams();
  const navigate = useNavigate();
  const localStore = useAppStore();
  const cloudShareCode = useCloudSyncStore((s) => s.schoolRecord?.share_code);

  const [remoteSchool, setRemoteSchool] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(Boolean(paramShareCode));
  const [remoteError, setRemoteError] = useState('');

  // 🌐 URL'de :shareCode varsa Supabase RPC üzerinden şifresiz canlı veriyi çek
  useEffect(() => {
    if (!paramShareCode) {
      setLoadingRemote(false);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setRemoteError('Bulut bağlantısı yapılandırılmadığı için canlı paylaşım kodu okunamadı.');
      setLoadingRemote(false);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);
    setRemoteError('');

    supabase
      .rpc('get_published_school_by_share_code', { p_share_code: paramShareCode })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || !data.published_mobile) {
          setRemoteError('Bu paylaşım koduna ait güncel okul programı bulunamadı veya bağlantı yenilenmiş.');
        } else {
          setRemoteSchool(data.published_mobile);
        }
        setLoadingRemote(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteError('Canlı program yüklenirken ağ hatası oluştu.');
          setLoadingRemote(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paramShareCode]);

  const activeSource = remoteSchool || localStore;
  const teachers = activeSource?.teachers || [];
  const classrooms = activeSource?.classrooms || [];
  const timetable = activeSource?.timetable || {};
  const settings = activeSource?.settings || {};
  const examSupervisors = activeSource?.examSupervisors || null;

  const effectiveShareCode = paramShareCode || cloudShareCode || '';

  const days = settings?.days || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const numPeriods = Number(settings?.periodsPerDay) || 8;
  const periodsArray = Array.from({ length: numPeriods }, (_, i) => i + 1);

  // Bugünün gün adını bul (Hafta sonuysa Pazartesi)
  const getTodayDayName = () => {
    const dayIndex = new Date().getDay();
    const dayMap = { 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma' };
    return dayMap[dayIndex] || 'Pazartesi';
  };

  const [activeDay, setActiveDay] = useState(getTodayDayName());
  const [selectedTeacherId, setSelectedTeacherId] = useState(paramTeacherId || teachers[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Uzaktan öğretmen listesi yüklendiğinde seçili öğretmeni senkronize et
  useEffect(() => {
    if (paramTeacherId && teachers.some((t) => t.id === paramTeacherId)) {
      setSelectedTeacherId(paramTeacherId);
    } else if (!selectedTeacherId && teachers[0]?.id) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, paramTeacherId, selectedTeacherId]);

  // Aktif seçili öğretmen
  const currentTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // Öğretmenin toplam yükü
  const teacherLoad = useMemo(() => {
    if (!currentTeacher) return 0;
    let total = 0;
    classrooms.forEach((c) => {
      (c.courses || []).forEach((co) => {
        if (co.teacherId === currentTeacher.id) total += Number(co.hoursPerWeek) || 0;
      });
    });
    return total;
  }, [classrooms, currentTeacher]);

  // Öğretmenin nöbet günü (FAZ 3 Analiz Motoru)
  const dutyDay = useMemo(() => {
    if (!currentTeacher) return null;
    return calculateTeacherDutyDay(currentTeacher.id, timetable, settings);
  }, [currentTeacher, timetable, settings]);

  // Öğretmenin tüm günlerdeki ders haritası: day -> period -> { subject, className, classId }
  const teacherSchedule = useMemo(() => {
    if (!currentTeacher) return {};
    const schedule = {};
    days.forEach((d) => {
      schedule[d] = {};
    });

    Object.keys(timetable).forEach((cId) => {
      const cName = classrooms.find((c) => c.id === cId)?.name || 'Sınıf';
      days.forEach((day) => {
        const slots = timetable[cId]?.[day] || [];
        slots.forEach((slot) => {
          if (slot.teacherId === currentTeacher.id) {
            schedule[day][slot.period] = {
              subject: slot.subject,
              className: cName,
              classId: cId,
            };
          }
        });
      });
    });

    return schedule;
  }, [currentTeacher, timetable, classrooms, days]);

  // 🎓 Öğretmenin Ortak Sınav Gözetmenlik Görevleri
  const supervisorDuties = useMemo(() => {
    if (!currentTeacher || !examSupervisors || typeof examSupervisors !== 'object') return [];
    const list = [];
    Object.entries(examSupervisors).forEach(([date, slotsObj]) => {
      Object.entries(slotsObj || {}).forEach(([slot, roomsObj]) => {
        Object.entries(roomsObj || {}).forEach(([cId, tId]) => {
          if (tId === currentTeacher.id) {
            const cName = classrooms.find((c) => c.id === cId)?.name || cId;
            list.push({ date, slot, className: cName });
          }
        });
      });
    });
    return list.sort((a, b) => a.date.localeCompare(b.date) || Number(a.slot) - Number(b.slot));
  }, [currentTeacher, examSupervisors, classrooms]);

  // Aktif günün dersleri
  const activeDayLessons = teacherSchedule[activeDay] || {};
  const activeDayLessonCount = Object.keys(activeDayLessons).length;

  // Paylaşım linki (Bulut shareCode varsa her telefondan açılan canlı linki üretir!)
  const currentUrl =
    typeof window !== 'undefined'
      ? effectiveShareCode
        ? `${window.location.origin}/mobile/s/${effectiveShareCode}/teacher/${currentTeacher?.id || ''}`
        : `${window.location.origin}/mobile/teacher/${currentTeacher?.id || ''}`
      : '';

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTeacherChange = (newTeacherId) => {
    setSelectedTeacherId(newTeacherId);
    if (paramShareCode) {
      navigate(`/mobile/s/${paramShareCode}/teacher/${newTeacherId}`);
    } else if (effectiveShareCode) {
      navigate(`/mobile/s/${effectiveShareCode}/teacher/${newTeacherId}`);
    } else {
      navigate(`/mobile/teacher/${newTeacherId}`);
    }
  };

  if (loadingRemote) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 size={28} className="text-indigo-400 animate-spin" />
        <span className="text-xs font-bold text-slate-300">Canlı okul ders programı yükleniyor...</span>
      </div>
    );
  }

  if (remoteError) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4">
          <AlertTriangle size={32} className="text-amber-400 mx-auto" />
          <h2 className="text-sm font-black text-white">Program Görüntülenemedi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{remoteError}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16 print:bg-white print:text-black print:pb-0">
      {/* 📱 MOBİL ÜST BAR (APP HEADER) */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 print:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!paramShareCode && (
              <button
                type="button"
                onClick={() => navigate('/timetable')}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Ana Çarşaf Tablosuna Dön"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                {settings?.schoolName || 'Hz. Ayşe Kız AİHL'}
              </div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>Mobil Öğretmen Portalı</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Bu Programın QR Kodunu Aç"
            >
              <QrCode size={15} />
              <span className="hidden sm:inline">QR Kod</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Bağlantıyı Kopyala"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* 🔍 ÖĞRETMEN SEÇİCİ DROPDOWN */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <Search size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Öğretmen Seç / Değiştir:</span>
          </div>
          <select
            value={selectedTeacherId}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 outline-none focus:border-blue-500 cursor-pointer"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.branch})
              </option>
            ))}
          </select>
        </div>

        {/* 👤 ÖĞRETMEN KİMLİK KARTI & NÖBET BİLGİSİ */}
        {currentTeacher && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden print:border-gray-800 print:bg-white print:text-black">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50">
                  {currentTeacher.branch} Branşı
                </span>
                <h2 className="text-base font-black text-white mt-1 tracking-tight print:text-black">
                  {currentTeacher.name}
                </h2>
                <div className="text-xs text-slate-400 font-semibold mt-0.5 print:text-gray-600">
                  Haftalık Ders Yükü: <strong className="text-slate-200 print:text-black">{teacherLoad} Saat</strong>
                </div>
              </div>

              {/* HIZLI QR KOD KÜÇÜK GÖSTERGE */}
              <div
                onClick={() => setShowQRModal(true)}
                className="bg-white p-1.5 rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md print:hidden"
                title="Büyütmek için tıklayın"
              >
                <QRCodeSVG value={currentUrl} size={50} />
              </div>
            </div>

            {/* 🛡️ NÖBET GÜNÜ MÜHRÜ */}
            {dutyDay ? (
              <div className="bg-indigo-950/60 border border-indigo-700/60 rounded-2xl p-3 flex items-center gap-2.5 text-indigo-200">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Resmi Nöbet Görevi</div>
                  <div className="text-xs font-black text-white">Nöbet Günü: {dutyDay}</div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">
                Nöbet günü program yoğunluğuna göre belirlenmemiştir.
              </div>
            )}
          </div>
        )}

        {/* 📅 GÜN SEÇİCİ SEKMELER (DAY PILLS) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar print:hidden">
          {days.map((day) => {
            const hasLessons = Object.keys(teacherSchedule[day] || {}).length > 0;
            const isSelected = activeDay === day;
            const isToday = getTodayDayName() === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`flex-1 min-w-[70px] py-2 px-1 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                    : hasLessons
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80 opacity-60'
                }`}
              >
                <div>{day.slice(0, 3)}</div>
                {isToday && (
                  <div className={`text-[8px] font-extrabold uppercase mt-0.5 ${isSelected ? 'text-blue-200' : 'text-blue-400'}`}>
                    Bugün
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ⏰ AKTİF GÜNÜN ZAMAN ÇİZELGESİ */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-blue-400" />
              <span>{activeDay} Programı</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {activeDayLessonCount > 0 ? `${activeDayLessonCount} Saat Ders` : 'Ders Yok (Boş Gün)'}
            </span>
          </div>

          {activeDayLessonCount === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Coffee size={24} />
              </div>
              <h4 className="text-sm font-black text-white">Tebrikler, Bugün Boş Gününüz!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Bu gün okulda atanmış dersiniz bulunmamaktadır. Dinlenebilir veya hazırlık yapabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {periodsArray.map((p) => {
                const lesson = activeDayLessons[p];

                if (lesson) {
                  return (
                    <div
                      key={p}
                      className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black leading-none">{p}</span>
                          <span className="text-[8px] font-semibold text-blue-300">Ders</span>
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-2">
                            <span>{lesson.subject}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <GraduationCap size={13} className="text-blue-400" />
                            <span>{lesson.className} Şubesi</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg">
                          Aktif Ders
                        </span>
                      </div>
                    </div>
                  );
                }

                const allPeriods = Object.keys(activeDayLessons)
                  .map(Number)
                  .sort((a, b) => a - b);
                const minP = allPeriods[0];
                const maxP = allPeriods[allPeriods.length - 1];

                if (p > minP && p < maxP) {
                  return (
                    <div
                      key={p}
                      className="bg-slate-900/60 border border-dashed border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-between text-slate-400"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">
                          {p}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <Coffee size={13} className="text-amber-400" />
                          <span>Boş Saat (Pencere / Dinlenme)</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">Nöbet / Hazırlık</span>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* 🎓 ORTAK SINAV GÖZETMENLİK GÖREVLERİ (Varsa Gösterilir) */}
        {supervisorDuties.length > 0 && (
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck size={14} />
              <span>Ortak Sınav Gözetmenlik Görevleri ({supervisorDuties.length})</span>
            </h3>
            <div className="space-y-1.5">
              {supervisorDuties.map((d, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl"
                >
                  <span className="font-bold text-slate-200">
                    {d.date} • {d.slot}. Ders
                  </span>
                  <span className="font-black text-amber-400">{d.className} Salonu</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🖨️ YAZDIR / PAYLAŞ BUTONLARI */}
        <div className="pt-2 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            <span>{copied ? 'Link Kopyalandı!' : 'Linki Paylaş'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* 📱 QR KOD MODAL PENCERESİ */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-white uppercase tracking-wide">
                Cep Telefonundan Görüntüle
              </h3>
              <p className="text-xs text-slate-400">
                Kameranızı açarak bu QR kodu okutun. Program anında telefonunuzda açılacaktır.
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl inline-block shadow-inner">
              <QRCodeSVG value={currentUrl} size={180} />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-black text-white">{currentTeacher?.name}</div>
              <div className="text-[11px] text-blue-400 font-bold">
                {dutyDay ? `Nöbet Günü: ${dutyDay}` : 'Ders Programı'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
