// frontend/src/pages/TimetableBoard.tsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { Calendar, Users, GraduationCap, AlertCircle, AlertTriangle, ArrowLeft, Undo2, Redo2, Pin, Play, FileSpreadsheet, RotateCcw } from 'lucide-react';
import TeacherTimetable from '../components/timetable/TeacherTimetable';
import ClassTimetable from '../components/timetable/ClassTimetable';
import MasterSheet from '../components/timetable/MasterSheet';

export default function TimetableBoard() {
  const { 
    settings, 
    teachers, 
    classrooms, 
    timetable, 
    setTimetable, 
    pinnedSlots, 
    togglePinSlot, 
    toggleTeacherSchedulePin,
    clearAllPins,
    setPinnedSlots,
    generateResult,
    resetTimetable
  } = useAppStore();

  const navigate = useNavigate(); 
  const location = useLocation();

  const incomingTeacherId = location.state?.teacherId || new URLSearchParams(location.search).get('teacherId');
  const incomingMode = location.state?.viewMode || 'teacher';
  
  const [viewMode, setViewMode] = useState(incomingMode);
  const [activeTeacherId, setActiveTeacherId] = useState(incomingTeacherId || teachers[0]?.id || '');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (incomingTeacherId) {
      setActiveTeacherId(incomingTeacherId);
      setViewMode('teacher');
    }
  }, [location.state, location.search]);

  // 🔄 UNDO / REDO (GERİ AL / İLERİ AL) DURUM YÖNETİMİ
  const [history, setHistory] = useState(() => timetable ? [JSON.parse(JSON.stringify(timetable))] : []);
  const [historyIndex, setHistoryIndex] = useState(0);

  const applyTimetableChange = (newTimetable) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newTimetable)));
    if (updatedHistory.length > 50) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setTimetable(newTimetable);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTimetable(JSON.parse(JSON.stringify(history[prevIndex])));
      setAlertMsg("↩️ Son işlem geri alındı.");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTimetable(JSON.parse(JSON.stringify(history[nextIndex])));
      setAlertMsg("↪️ İşlem tekrar uygulandı.");
    }
  };

  // ⌨️ KLAVYE KISAYOLLARI (Ctrl+Z: Geri Al, Ctrl+Y veya Ctrl+Shift+Z: İleri Al)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  const numPeriods = settings?.periodsPerDay || 8;
  const periodsArray = Array.from({ length: numPeriods }, (_, i) => i + 1);
  const daysArray = settings?.days || [];

  if (!timetable || Object.keys(timetable).length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mx-auto hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Ana Sayfaya (Dashboard) Dön
        </button>
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Görüntülenecek Program Bulunmadı</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Çarşaf listeyi görebilmek için önce "Oluştur" sayfasından algoritmayı tetiklemeniz gerekir.
        </p>
      </div>
    );
  }

  // 1. Kapsamlı Müsaitlik ve Çakışma Doğrulama Fonksiyonu
  const validateSlotAssignment = (classId: string, targetDay: string, targetPeriod: number, teacherId: string, options: any = {}) => {
    const {
      role = 'Sürüklenen ders',
      ignoreClassId = null,
      ignoreDay = null,
      ignorePeriod = null
    } = options;

    const teacherObj = teachers.find(t => t.id === teacherId);
    if (!teacherObj) return { valid: true };

    const pNum = Number(targetPeriod);

    // KURAL A: Öğretmenin Kısıtlı / Kapalı Saat Kontrolü (Müsaitlik)
    const dayUnavailable = teacherObj.unavailable?.[targetDay] || [];
    const isClosed = dayUnavailable.some(p => Number(p) === pNum);
    if (isClosed) {
      return { 
        valid: false, 
        message: `⚠️ Müsaitlik Engeli: ${teacherObj.name} (${role}) ${targetDay} günü ${pNum}. ders saatinde KISITLI / KAPALI!` 
      };
    }

    // KURAL B: Öğretmenin Başka Bir Sınıfta Dersi Olma Durumu (Çakışma)
    for (const cId of Object.keys(timetable)) {
      if (cId !== classId) {
        const slots = timetable[cId]?.[targetDay] || [];
        const busySlot = slots.find(s => {
          if (Number(s.period) !== pNum || s.teacherId !== teacherId) return false;
          // Yer değiştirme esnasında kaynak saatten taşınacak slotu çakışma sayma
          if (ignoreClassId && cId === ignoreClassId && ignoreDay === targetDay && Number(ignorePeriod) === pNum) return false;
          return true;
        });

        if (busySlot) {
          const conflictClass = classrooms.find(c => c.id === cId)?.name || 'Başka Sınıf';
          return { 
            valid: false, 
            message: `🚨 Çakışma Hatası: ${teacherObj.name} (${role}) zaten ${targetDay} günü ${pNum}. derste ${conflictClass} sınıfında derste!` 
          };
        }
      }
    }

    return { valid: true };
  };

  // 2. Günlük Azami Ders Saati Kontrolü
  const checkTeacherDailyCap = (teacherId, targetDay, isDifferentDay) => {
    if (!isDifferentDay) return { valid: true };
    const teacherObj = teachers.find(t => t.id === teacherId);
    if (!teacherObj) return { valid: true };

    const maxDaily = teacherObj.hasCustomConstraints && teacherObj.customMaxHours
      ? Number(teacherObj.customMaxHours)
      : Number(teacherObj.maxPerDay || numPeriods);

    let currentHours = 0;
    Object.keys(timetable).forEach(cId => {
      (timetable[cId]?.[targetDay] || []).forEach(s => {
        if (s.teacherId === teacherId) currentHours++;
      });
    });

    if (currentHours >= maxDaily) {
      return {
        valid: false,
        message: `⚠️ Günlük Ders Sınırı: ${teacherObj.name} için ${targetDay} günü azami ${maxDaily} saat ders sınırına ulaşıldı (Şu an: ${currentHours} saat)!`
      };
    }
    return { valid: true };
  };

  // 3. Sürükle Bırak / Yer Değiştirme Yöneticisi
  const handleCellMoveOrSwap = (classId, source, target) => {
    setAlertMsg(null);
    const updatedTimetable = JSON.parse(JSON.stringify(timetable));

    const srcClassId = source.classId || classId;
    const tgtClassId = target.classId || classId;
    const srcDay = source.day;
    const srcPeriod = source.period !== undefined && source.period !== null ? parseInt(source.period) : null;
    const tgtDay = target.day;
    const tgtPeriod = parseInt(target.period);
    const srcTeacherId = source.teacherId;

    if (!updatedTimetable[srcClassId]) updatedTimetable[srcClassId] = {};
    if (!updatedTimetable[tgtClassId]) updatedTimetable[tgtClassId] = {};
    if (srcDay && !updatedTimetable[srcClassId][srcDay]) updatedTimetable[srcClassId][srcDay] = [];
    if (!updatedTimetable[tgtClassId][tgtDay]) updatedTimetable[tgtClassId][tgtDay] = [];

    const sourceData = (srcDay && srcPeriod !== null)
      ? updatedTimetable[srcClassId][srcDay].find(s => Number(s.period) === srcPeriod)
      : null;
    const targetData = updatedTimetable[tgtClassId][tgtDay].find(s => Number(s.period) === tgtPeriod);

    // KONTROL 1: Havuzdan sürükleniyorsa ve hedef hücre doluysa
    if (source.fromPool && targetData) {
      const tgtTeacher = teachers.find(t => t.id === targetData.teacherId)?.name || 'Öğretmen';
      setAlertMsg(`⚠️ Hedef Hücre Dolu: ${tgtDay} ${tgtPeriod}. derste zaten ${targetData.subject} (${tgtTeacher}) var. Lütfen önce o dersi silin veya boş bir saate bırakın.`);
      return;
    }

    // KONTROL 2: Sürüklenen dersin öğretmeni hedef saatte müsait mi ve çakışması var mı?
    const srcValidation = validateSlotAssignment(tgtClassId, tgtDay, tgtPeriod, srcTeacherId, {
      role: 'Sürüklenen ders',
      ignoreClassId: srcClassId,
      ignoreDay: srcDay,
      ignorePeriod: srcPeriod
    });
    if (!srcValidation.valid) {
      setAlertMsg(srcValidation.message);
      return;
    }

    // KONTROL 3: Sürüklenen dersin öğretmeni için günlük limit aşımı
    if (source.fromPool || srcDay !== tgtDay) {
      const isTargetSameTeacher = targetData && targetData.teacherId === srcTeacherId;
      if (!isTargetSameTeacher) {
        const capValidation = checkTeacherDailyCap(srcTeacherId, tgtDay, true);
        if (!capValidation.valid) {
          setAlertMsg(capValidation.message);
          return;
        }
      }
    }

    // KONTROL 4: SWAP (Yer Değiştirme) Durumu - Hedefteki ders kaynak saate taşınabilir mi?
    if (!source.fromPool && targetData && srcPeriod !== null && srcClassId === tgtClassId) {
      const tgtTeacherId = targetData.teacherId;

      // Hedefteki öğretmenin kaynak saatte müsaitliği ve çakışması:
      const tgtValidation = validateSlotAssignment(srcClassId, srcDay, srcPeriod, tgtTeacherId, {
        role: 'Yer değiştiren ders',
        ignoreClassId: tgtClassId,
        ignoreDay: tgtDay,
        ignorePeriod: tgtPeriod
      });
      if (!tgtValidation.valid) {
        setAlertMsg(`🔄 Yer Değiştirme Engeli: ${tgtValidation.message}`);
        return;
      }

      // Hedefteki öğretmenin kaynak günde günlük limiti:
      if (srcDay !== tgtDay && tgtTeacherId !== srcTeacherId) {
        const tgtCapValidation = checkTeacherDailyCap(tgtTeacherId, srcDay, true);
        if (!tgtCapValidation.valid) {
          setAlertMsg(`🔄 Yer Değiştirme Engeli: ${tgtCapValidation.message}`);
          return;
        }
      }
    }

    // KONTROL 5: Farklı sınıflar arası swap (Öğretmen çarşafı görünümünde)
    if (!source.fromPool && targetData && srcPeriod !== null && srcClassId !== tgtClassId) {
      if (targetData.teacherId === srcTeacherId) {
        const busyInTgtAtSrc = (updatedTimetable[tgtClassId]?.[srcDay] || []).find(s => Number(s.period) === srcPeriod && s.teacherId !== srcTeacherId);
        if (busyInTgtAtSrc) {
          const cName = classrooms.find(c => c.id === tgtClassId)?.name || 'Hedef Sınıf';
          setAlertMsg(`🚨 Sınıf Çakışması: ${cName} sınıfının ${srcDay} ${srcPeriod}. derste zaten başka bir dersi var!`);
          return;
        }
        const busyInSrcAtTgt = (updatedTimetable[srcClassId]?.[tgtDay] || []).find(s => Number(s.period) === tgtPeriod && s.teacherId !== srcTeacherId);
        if (busyInSrcAtTgt) {
          const cName = classrooms.find(c => c.id === srcClassId)?.name || 'Kaynak Sınıf';
          setAlertMsg(`🚨 Sınıf Çakışması: ${cName} sınıfının ${tgtDay} ${tgtPeriod}. derste zaten başka bir dersi var!`);
          return;
        }

        updatedTimetable[srcClassId][srcDay] = updatedTimetable[srcClassId][srcDay].filter(s => Number(s.period) !== srcPeriod);
        updatedTimetable[srcClassId][tgtDay].push({ period: tgtPeriod, subject: sourceData.subject, teacherId: srcTeacherId });

        updatedTimetable[tgtClassId][tgtDay] = updatedTimetable[tgtClassId][tgtDay].filter(s => Number(s.period) !== tgtPeriod);
        updatedTimetable[tgtClassId][srcDay].push({ period: srcPeriod, subject: targetData.subject, teacherId: srcTeacherId });

        updatedTimetable[srcClassId][srcDay].sort((a, b) => a.period - b.period);
        updatedTimetable[srcClassId][tgtDay].sort((a, b) => a.period - b.period);
        updatedTimetable[tgtClassId][srcDay].sort((a, b) => a.period - b.period);
        updatedTimetable[tgtClassId][tgtDay].sort((a, b) => a.period - b.period);
        applyTimetableChange(updatedTimetable);
        return;
      }
    }

    // TAŞIMAYI UYGULA (Standart taşıma ve aynı sınıf içi swap)
    if (source.fromPool) {
      updatedTimetable[tgtClassId][tgtDay] = updatedTimetable[tgtClassId][tgtDay].filter(s => Number(s.period) !== tgtPeriod);
      updatedTimetable[tgtClassId][tgtDay].push({
        period: tgtPeriod,
        subject: source.subject,
        teacherId: source.teacherId
      });
    } else {
      updatedTimetable[srcClassId][srcDay] = updatedTimetable[srcClassId][srcDay].filter(s => Number(s.period) !== srcPeriod);
      updatedTimetable[tgtClassId][tgtDay] = updatedTimetable[tgtClassId][tgtDay].filter(s => Number(s.period) !== tgtPeriod);

      if (sourceData) {
        updatedTimetable[tgtClassId][tgtDay].push({
          period: tgtPeriod,
          subject: sourceData.subject,
          teacherId: sourceData.teacherId
        });
      }
      if (targetData) {
        updatedTimetable[srcClassId][srcDay].push({
          period: srcPeriod,
          subject: targetData.subject,
          teacherId: targetData.teacherId
        });
        updatedTimetable[srcClassId][srcDay].sort((a, b) => a.period - b.period);
      }
    }

    if (srcPeriod !== null && updatedTimetable[srcClassId]?.[srcDay]) {
      updatedTimetable[srcClassId][srcDay].sort((a, b) => a.period - b.period);
    }
    if (updatedTimetable[tgtClassId]?.[tgtDay]) {
      updatedTimetable[tgtClassId][tgtDay].sort((a, b) => a.period - b.period);
    }

    // 📌 KİLİT SENKRONİZASYONU: Taşınan veya takas edilen hücrelerin kilit koordinatlarını güncelle
    if (pinnedSlots && pinnedSlots.length > 0 && !source.fromPool && srcPeriod !== null) {
      const srcPinIdx = pinnedSlots.findIndex(p => p.classId === srcClassId && p.day === srcDay && Number(p.period) === Number(srcPeriod));
      const tgtPinIdx = pinnedSlots.findIndex(p => p.classId === tgtClassId && p.day === tgtDay && Number(p.period) === Number(tgtPeriod));

      if (srcPinIdx !== -1 || tgtPinIdx !== -1) {
        const nextPins = [...pinnedSlots];
        if (srcPinIdx !== -1) {
          nextPins[srcPinIdx] = { ...nextPins[srcPinIdx], classId: tgtClassId, day: tgtDay, period: tgtPeriod };
        }
        if (tgtPinIdx !== -1) {
          nextPins[tgtPinIdx] = { ...nextPins[tgtPinIdx], classId: srcClassId, day: srcDay, period: srcPeriod };
        }
        setPinnedSlots(nextPins);
      }
    }

    applyTimetableChange(updatedTimetable);
  };

  // Ders Silme Fonksiyonu (Silinen ders anında ilgili sınıf ve öğretmen havuzuna düşer)
  const handleDeleteSlot = (classId, day, period) => {
    const updated = JSON.parse(JSON.stringify(timetable));
    if (updated[classId]?.[day]) {
      updated[classId][day] = updated[classId][day].filter(s => Number(s.period) !== Number(period));

      // 📌 Silinen ders kilitli ise kilidi kaldır (boş hücre kilitli kalıp çözücüyü patlatmasın)
      if (pinnedSlots && pinnedSlots.length > 0) {
        const remainingPins = pinnedSlots.filter(p => !(p.classId === classId && p.day === day && Number(p.period) === Number(period)));
        if (remainingPins.length !== pinnedSlots.length) {
          setPinnedSlots(remainingPins);
        }
      }

      applyTimetableChange(updated);
      setAlertMsg("🗑️ Ders tablodan kaldırıldı ve havuza aktarıldı. İstediğiniz zaman havuza sürükleyebilir veya Geri Al (Ctrl+Z) yapabilirsiniz.");
    }
  };

  // 4. Hücre Renklendirmesi için Çakışma ve Müsaitlik Kontrolü
  const checkCellConflict = (classId, day, period, teacherId) => {
    let hasTeacherConflict = false;
    let conflictClassName = '';
    let isTeacherUnavailable = false;

    const pNum = Number(period);

    Object.keys(timetable).forEach(cId => {
      if (cId !== classId) {
        const slots = timetable[cId]?.[day] || [];
        const match = slots.find(s => Number(s.period) === pNum && s.teacherId === teacherId);
        if (match) {
          hasTeacherConflict = true;
          conflictClassName = classrooms.find(cl => cl.id === cId)?.name || 'Başka Sınıf';
        }
      }
    });

    const teacherObj = teachers.find(t => t.id === teacherId);
    if (teacherObj?.unavailable && teacherObj.unavailable[day]) {
      if (teacherObj.unavailable[day].some(p => Number(p) === pNum)) {
        isTeacherUnavailable = true;
      }
    }

    return { hasTeacherConflict, conflictClassName, isTeacherUnavailable };
  };

  return (
    <div className="p-6 space-y-6 transition-all duration-300 print:p-0 print:bg-white max-w-7xl mx-auto">
      
      <style dangerouslySetInnerHTML={{__html: `@media print { .print\\:hidden { display: none !important; } .page-break { page-break-after: always !important; break-after: page !important; } table { page-break-inside: avoid !important; } tr { page-break-inside: avoid !important; } }`}} />

      {/* ÜST BAŞLIK & NAVİGASYON */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors mb-1"
          >
            <ArrowLeft size={14} /> Ana Sayfaya (Dashboard) Dön
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={22} /> Manuel Düzenleme
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 📊 CANLI BOŞLUK & DAĞITIM DURUM ROZETİ */}
          {generateResult?.metrics && (
            <div className="flex items-center gap-2.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs text-xs font-bold">
              <div className="flex items-center gap-1.5 text-gray-700" title="Okul Genelindeki Gün İçi Toplam Pencere (Boş Ders) Saati">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-gray-500">Boşluk:</span>
                <span className="text-blue-600 font-black">{generateResult.metrics.totalSchoolGaps ?? 0} Sa</span>
              </div>
              <div className="w-[1px] h-3.5 bg-gray-200"></div>
              <div className="flex items-center gap-1 text-gray-700" title="Öğretmen Başına Düşen Ortalama Pencere (Boşluk) Saati">
                <span className="text-[11px] text-gray-500">Ort:</span>
                <span className="text-purple-600 font-black">{generateResult.metrics.averageSchoolGaps ?? 0} Sa</span>
              </div>
              <div className="w-[1px] h-3.5 bg-gray-200"></div>
              <div className="flex items-center gap-1 text-gray-700" title="Boş gün talep ettiği halde karşılanamayan öğretmen sayısı">
                <span className="text-[11px] text-gray-500">Boş Gün Açıkta:</span>
                <span className={`font-black ${(generateResult.metrics.countWithoutFreeDay || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {generateResult.metrics.countWithoutFreeDay ?? 0}
                </span>
              </div>
              <div className="w-[1px] h-3.5 bg-gray-200"></div>
              <div className="flex items-center gap-1 text-gray-700" title="Yarım gün boşluk talep ettiği halde karşılanamayan öğretmen sayısı">
                <span className="text-[11px] text-gray-500">Yarım Gün Açıkta:</span>
                <span className={`font-black ${(generateResult.metrics.countWithoutHalfDay || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {generateResult.metrics.countWithoutHalfDay ?? 0}
                </span>
              </div>

              {generateResult.metrics.unassigned > 0 && (
                <>
                  <div className="w-[1px] h-3.5 bg-gray-200"></div>
                  <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded-md animate-pulse" title="Henüz Tabloya Yerleştirilmemiş Ders Saati">
                    ⚠️ {generateResult.metrics.unassigned} Sa Havuzda
                  </span>
                </>
              )}
            </div>
          )}

          {/* ↩️ GERİ AL & ↪️ İLERİ AL BUTONLARI */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Son Yapılan İşlemi Geri Al (Ctrl+Z)"
            >
              <Undo2 size={14} className="text-blue-600" />
              <span>Geri Al</span>
            </button>
            <div className="w-[1px] h-4 bg-gray-200"></div>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Geri Alınan İşlemi Tekrar Uygula (Ctrl+Y)"
            >
              <Redo2 size={14} className="text-blue-600" />
              <span>İleri Al</span>
            </button>
          </div>

          {/* 🧹 PROGRAMI SIFIRLA BUTONU */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Ders programını sıfırla ve yeniden dağıtıma hazırlan"
          >
            <RotateCcw size={14} className="text-rose-600" />
            <span>Programı Sıfırla</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('classroom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'classroom' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} /> Sınıf Programı
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'teacher' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} /> Öğretmen Programı
            </button>
            <button
              onClick={() => setViewMode('master')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'master' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={15} /> Çarşaf Liste
            </button>
          </div>



          {/* 📌 KİLİTLİ DERSLER KONTROLÜ */}
          {(pinnedSlots || []).length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs">
              <Pin size={13} className="text-amber-600 fill-amber-500" />
              <span className="text-xs font-bold text-amber-900">
                {pinnedSlots.length} Ders Kilitli
              </span>
              <button
                type="button"
                onClick={clearAllPins}
                className="ml-1 text-[10px] text-amber-700 hover:text-red-700 underline font-bold cursor-pointer"
                title="Tüm kilitleri kaldır"
              >
                Kaldır
              </button>
            </div>
          )}

          {(pinnedSlots || []).length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/generate')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Kilitli derslerin yerini koruyarak sadece açıkta kalan dersleri yeniden dağıt"
            >
              <Play size={13} />
              <span>Kilitlileri Koru & Dağıt</span>
            </button>
          )}
        </div>
      </div>

      {alertMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-red-700 max-w-xl w-[90%] print:hidden">
          <AlertTriangle size={20} className="shrink-0 text-white" />
          <span className="flex-1 leading-snug">{alertMsg}</span>
          <button 
            onClick={() => setAlertMsg(null)} 
            className="bg-red-700 hover:bg-red-800 text-white rounded-lg px-2.5 py-1 text-xs font-black cursor-pointer transition-colors shrink-0"
          >
            ✕ Kapat
          </button>
        </div>
      )}

      {/* 📊 3 FARKLI ÇİZELGE GÖRÜNÜMÜ: SINIF PROGRAMI, ÖĞRETMEN PROGRAMI, ÇARŞAF LİSTE */}
      {viewMode === 'classroom' && (
        <ClassTimetable
          classrooms={classrooms}
          teachers={teachers}
          timetable={timetable}
          daysArray={daysArray}
          periodsArray={periodsArray}
          pinnedSlots={pinnedSlots}
          togglePinSlot={togglePinSlot}
          handleCellMoveOrSwap={handleCellMoveOrSwap}
          handleDeleteSlot={handleDeleteSlot}
          checkCellConflict={checkCellConflict}
        />
      )}

      {viewMode === 'teacher' && (
        <TeacherTimetable
          teachers={teachers}
          classrooms={classrooms}
          timetable={timetable}
          settings={settings}
          pinnedSlots={pinnedSlots}
          togglePinSlot={togglePinSlot}
          toggleTeacherSchedulePin={toggleTeacherSchedulePin}
          handleCellMoveOrSwap={handleCellMoveOrSwap}
          daysArray={daysArray}
          periodsArray={periodsArray}
          initialTeacherId={activeTeacherId}
        />
      )}

      {viewMode === 'master' && (
        <MasterSheet
          classrooms={classrooms}
          teachers={teachers}
          timetable={timetable}
          daysArray={daysArray}
          periodsArray={periodsArray}
          pinnedSlots={pinnedSlots}
          togglePinSlot={togglePinSlot}
          handleCellMoveOrSwap={handleCellMoveOrSwap}
          onSelectTeacher={(tId) => {
            setActiveTeacherId(tId);
            setViewMode('teacher');
          }}
        />
      )}

      {/* 🧹 PROGRAMI SIFIRLA ONAY MODALI */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Ders Programını Sıfırla</h3>
                <p className="text-xs text-slate-500">Mevcut ders dağıtımı sıfırlanacaktır.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Dikkat:</p>
              <p>Öğretmenler, sınıflar ve müfredat ders yükleri <strong>kesinlikle silinmez</strong>. Yalnızca haftalık ders programındaki yerleşimler temizlenir.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetTimetable(false);
                  setShowResetConfirm(false);
                  setAlertMsg("🧹 Kilitli olmayan dersler sıfırlandı. Kilitler korundu.");
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Pin size={14} />
                <span>Kilitleri Koru & Sıfırla</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetTimetable(true);
                  setShowResetConfirm(false);
                  setAlertMsg("🧹 Tüm ders programı ve kilitler tamamen sıfırlandı.");
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Tüm Programı Sıfırla (Kilitler Dahil)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer mt-1"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
