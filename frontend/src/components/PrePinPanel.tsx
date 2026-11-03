import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Pin, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  X, 
  Info, 
  Check, 
  RotateCcw, 
  Users, 
  Sparkles, 
  Link2 
} from 'lucide-react';

export default function PrePinPanel() {
  const { 
    classrooms, 
    teachers, 
    settings, 
    pinnedSlots, 
    addPrePin, 
    removePinGroup, 
    setPinnedSlots, 
    clearAllPins 
  } = useAppStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState(null);
  // Aktif blok tamamlama tavsiyesi: { classId, day, basePeriod, targetPeriod, subject, teacherId }
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Gün ve ders saatleri ayarları
  const days = useMemo(() => {
    return settings?.days && settings.days.length > 0
      ? settings.days 
      : ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  }, [settings?.days]);

  const periodsCount = Number(settings?.periodsPerDay) || 8;
  const lunchAfter = settings?.lunchAfter !== undefined ? Number(settings.lunchAfter) : 4;

  // Varsayılan sınıf seçimi
  useEffect(() => {
    if (!selectedClassId && classrooms && classrooms.length > 0) {
      setSelectedClassId(classrooms[0].id);
    }
  }, [classrooms, selectedClassId]);

  // Sınıf değiştiğinde aktif tavsiyeyi temizle
  useEffect(() => {
    setActiveSuggestion(null);
    setMessage(null);
  }, [selectedClassId]);

  const selectedClass = useMemo(() => {
    return (classrooms || []).find((c) => c.id === selectedClassId) || classrooms?.[0] || null;
  }, [classrooms, selectedClassId]);

  // Seçili sınıfın dersleri ve kota istatistikleri
  const classCourses = useMemo(() => {
    if (!selectedClass) return [];
    const courses = selectedClass.courses || [];

    return courses.map((course) => {
      const courseSubject = course.subject || course.name;
      const teacherObj = (teachers || []).find((t) => t.id === course.teacherId);
      
      const pinnedHours = (pinnedSlots || []).filter(
        (p) => p.classId === selectedClass.id && p.subject === courseSubject
      ).length;

      const totalHours = Number(course.hoursPerWeek) || 0;
      const remainingHours = Math.max(0, totalHours - pinnedHours);

      return {
        ...course,
        courseSubject,
        teacherName: teacherObj ? teacherObj.name : 'Öğretmen Yok',
        teacherObj,
        totalHours,
        pinnedHours,
        remainingHours,
        isCompleted: remainingHours === 0
      };
    });
  }, [selectedClass, pinnedSlots, teachers]);

  // Seçili ders kotası dolarsa ilk uygun derse odaklan
  useEffect(() => {
    if (classCourses.length === 0) {
      setSelectedSubject('');
      return;
    }
    const current = classCourses.find((c) => c.courseSubject === selectedSubject);
    if (!current || current.isCompleted) {
      const firstAvailable = classCourses.find((c) => !c.isCompleted);
      if (firstAvailable) {
        setSelectedSubject(firstAvailable.courseSubject);
      }
    }
  }, [classCourses, selectedSubject]);

  const activeCourse = useMemo(() => {
    return classCourses.find((c) => c.courseSubject === selectedSubject) || null;
  }, [classCourses, selectedSubject]);

  // Bu sınıfa ait kilitli hücreler
  const currentClassPins = useMemo(() => {
    if (!selectedClass) return [];
    return (pinnedSlots || []).filter((p) => p.classId === selectedClass.id);
  }, [pinnedSlots, selectedClass]);

  // Bir hücrenin müsaitliğini ve kilit durumunu denetleyen motor
  const getSlotStatus = (day, period) => {
    const pNum = Number(period);

    // 1. Durum: Hücre bu sınıfta zaten kilitli mi?
    const existingPin = currentClassPins.find(
      (p) => p.day === day && Number(p.period) === pNum
    );
    if (existingPin) {
      return { type: 'pinned', pin: existingPin };
    }

    // 2. Durum: Ders seçimi ve kota denetimi
    if (!activeCourse) {
      return { type: 'disabled', reason: 'Lütfen yukarıdan kilitlenecek bir ders seçin.' };
    }

    if (activeCourse.remainingHours <= 0) {
      return { type: 'disabled', reason: `"${activeCourse.courseSubject}" dersinin haftalık kotası doldu.` };
    }

    const teacher = activeCourse.teacherObj;

    // 3. Durum: Öğretmen müsaitlik (unavailable) kontrolü
    if (teacher && teacher.unavailable) {
      const closedPeriods = teacher.unavailable[day] || [];
      if (closedPeriods.includes(pNum)) {
        return {
          type: 'teacher_closed',
          reason: `${teacher.name} öğretmeni ${day} günü ${pNum}. saatte kapalıdır!`
        };
      }
    }

    // 4. Durum: Öğretmen başka sınıfta kilitli mi?
    if (teacher && teacher.id && selectedClass) {
      const teacherCollision = (pinnedSlots || []).find(
        (p) => p.teacherId === teacher.id && p.day === day && Number(p.period) === pNum && p.classId !== selectedClass.id
      );
      if (teacherCollision) {
        const otherCls = (classrooms || []).find((c) => c.id === teacherCollision.classId)?.name || 'Başka Sınıf';
        return {
          type: 'teacher_collision',
          otherClassName: otherCls,
          reason: `${teacher.name} öğretmeni bu saatte ${otherCls} sınıfına sabitlenmiş!`
        };
      }
    }

    return { type: 'available' };
  };

  // Hedef saatin blok tamamlama için uygunluğunu denetler
  const isPeriodValidForBlock = (day, targetP, course) => {
    if (targetP < 1 || targetP > periodsCount) return false;
    
    // Sınıfta o saat boş mu?
    const isOccupied = currentClassPins.some(
      (p) => p.day === day && Number(p.period) === targetP
    );
    if (isOccupied) return false;

    // Öğretmen müsait mi?
    const teacher = course.teacherObj;
    if (teacher?.unavailable?.[day]?.includes(targetP)) return false;

    // Öğretmen başka sınıfta kilitli mi?
    if (teacher?.id && selectedClass) {
      const collision = (pinnedSlots || []).find(
        (p) => p.teacherId === teacher.id && p.day === day && Number(p.period) === targetP && p.classId !== selectedClass.id
      );
      if (collision) return false;
    }

    return true;
  };

  // Kilitlenen bir saat için ardışık saat tavsiyesi üretir
  const findConsecutiveSuggestion = (day, baseP, course) => {
    // Dersin toplam saati en az 2 olmalı ve 1 saat kilitlendikten sonra en az 1 saat daha kotası kalmalı
    if (course.totalHours < 2 || course.remainingHours < 2) {
      return null;
    }

    // Öncelik 1: p + 1 (Öğle arasını bölmüyorsa)
    const nextP = baseP + 1;
    const breaksLunchNext = lunchAfter && lunchAfter > 0 && baseP === lunchAfter;
    if (!breaksLunchNext && isPeriodValidForBlock(day, nextP, course)) {
      return {
        classId: selectedClass.id,
        day,
        basePeriod: baseP,
        targetPeriod: nextP,
        subject: course.courseSubject,
        teacherId: course.teacherId
      };
    }

    // Öncelik 2: p - 1 (Günün son saatindeyse veya ileri yön uygun değilse)
    const prevP = baseP - 1;
    const breaksLunchPrev = lunchAfter && lunchAfter > 0 && prevP === lunchAfter;
    if (!breaksLunchPrev && isPeriodValidForBlock(day, prevP, course)) {
      return {
        classId: selectedClass.id,
        day,
        basePeriod: baseP,
        targetPeriod: prevP,
        subject: course.courseSubject,
        teacherId: course.teacherId
      };
    }

    return null;
  };

  // Tavsiye edilen ardışık saati kilitler ve ikisini tek bir blok yapar
  const handleApplyBlockSuggestion = (suggestion = activeSuggestion) => {
    if (!suggestion) return;

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. İlk kilitlenen saate groupId ata
    const updatedPins = (pinnedSlots || []).map((p) => {
      if (
        p.classId === suggestion.classId &&
        p.day === suggestion.day &&
        Number(p.period) === Number(suggestion.basePeriod)
      ) {
        return { ...p, groupId };
      }
      return p;
    });

    // 2. Ardışık saati aynı groupId ile ekle
    updatedPins.push({
      classId: suggestion.classId,
      day: suggestion.day,
      period: Number(suggestion.targetPeriod),
      subject: suggestion.subject,
      teacherId: suggestion.teacherId,
      groupId
    });

    setPinnedSlots(updatedPins);
    setActiveSuggestion(null);

    const minP = Math.min(suggestion.basePeriod, suggestion.targetPeriod);
    const maxP = Math.max(suggestion.basePeriod, suggestion.targetPeriod);

    setMessage({
      type: 'success',
      text: `🎉 "${suggestion.subject}" dersi ${suggestion.day} ${minP}. ve ${maxP}. saatlere 2 saatlik blok olarak bağlandı.`
    });
  };

  // Hücreye tıklama (Kilitleme veya Kilidi Kaldırma)
  const handleCellClick = (day, period) => {
    setMessage(null);
    if (!selectedClass) return;

    const pNum = Number(period);

    // KULLANICI AKTİF BİR TAVSİYE HÜCRESİNE TIKLADIYSA: Doğrudan blok yap
    if (
      activeSuggestion &&
      activeSuggestion.day === day &&
      activeSuggestion.targetPeriod === pNum
    ) {
      handleApplyBlockSuggestion(activeSuggestion);
      return;
    }

    const status = getSlotStatus(day, pNum);

    // KİLİTLİ HÜCRE: Tek tıkla sil (Blok ise çiftiyle birlikte atomik kaldır)
    if (status.type === 'pinned') {
      const pin = status.pin;
      if (pin.groupId) {
        removePinGroup(pin.groupId);
        setMessage({
          type: 'info',
          text: `📌 "${pin.subject}" dersinin 2 saatlik blok kilidi kaldırıldı.`
        });
      } else {
        setPinnedSlots(
          (pinnedSlots || []).filter(
            (p) => !(p.classId === pin.classId && p.day === pin.day && Number(p.period) === Number(pin.period))
          )
        );
        setMessage({
          type: 'info',
          text: `📌 "${pin.subject}" dersinin tek saatlik kilidi kaldırıldı.`
        });
      }

      // Aktif öneri bu hücreyle ilgiliyse sıfırla
      if (activeSuggestion && activeSuggestion.day === day && 
         (activeSuggestion.basePeriod === pNum || activeSuggestion.targetPeriod === pNum)) {
        setActiveSuggestion(null);
      }
      return;
    }

    // UYGUN OLMAYAN HÜCRE
    if (status.type !== 'available') {
      setMessage({
        type: 'error',
        text: status.reason || 'Bu saat kilitlenemez!'
      });
      return;
    }

    // 1 SAAT SABİTLEME (VARSAYILAN SADELİK)
    const teacherId = activeCourse?.teacherId || undefined;
    addPrePin({
      classId: selectedClass.id,
      day,
      period: pNum,
      subject: activeCourse.courseSubject,
      teacherId
    });

    // Kilitlendikten sonra ardışık saat tavsiyesi ara
    const suggestion = findConsecutiveSuggestion(day, pNum, activeCourse);
    if (suggestion) {
      setActiveSuggestion(suggestion);
      setMessage({
        type: 'suggestion',
        text: `✅ "${activeCourse.courseSubject}" (${day} ${pNum}. saat) kilitlendi. İsterseniz ardışık saat ile 2'li blok yapabilirsiniz:`,
        suggestion
      });
    } else {
      setActiveSuggestion(null);
      setMessage({
        type: 'success',
        text: `✅ "${activeCourse.courseSubject}" dersi (${day} ${pNum}. saat) tek saat olarak kilitlendi.`
      });
    }
  };

  // Bu sınıfın tüm kilitlerini temizle
  const handleClearCurrentClassPins = () => {
    if (!selectedClass) return;
    const remaining = (pinnedSlots || []).filter((p) => p.classId !== selectedClass.id);
    setPinnedSlots(remaining);
    setActiveSuggestion(null);
    setMessage({
      type: 'info',
      text: `${selectedClass.name} için kilitlenen tüm saatler temizlendi.`
    });
  };

  // Okul genelindeki tüm kilitleri temizle
  const handleClearAllPinsPrompt = () => {
    if (window.confirm('Tüm sınıflardaki dağıtım öncesi kilitleri kaldırmak istediğinize emin misiniz?')) {
      clearAllPins();
      setActiveSuggestion(null);
      setMessage({
        type: 'info',
        text: 'Tüm sınıflara ait kilitler temizlendi.'
      });
    }
  };

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center text-sm font-semibold text-slate-500">
        Ön yerleşim yapabilmek için lütfen önce sınıf ve ders bilgilerini oluşturun.
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* ÜST BAŞLIK VE KONTROLLER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shadow-xs">
            <Pin size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800">Dağıtım Öncesi Sabit Dersler (Ön Yerleşim Masası)</h3>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pinnedSlots?.length || 0} Saat Kilitli
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Dersi seçip saate tıklayın (1 saat kilitlenir). Dilerseniz beliren tavsiyeyle tek tıkla 2 saatlik blok yapın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentClassPins.length > 0 && (
            <button
              type="button"
              onClick={handleClearCurrentClassPins}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              title="Sadece bu sınıfın kilitlerini kaldır"
            >
              <RotateCcw size={12} />
              <span>Bu Sınıfı Temizle ({currentClassPins.length})</span>
            </button>
          )}

          {pinnedSlots && pinnedSlots.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllPinsPrompt}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Okul genelindeki tüm kilitleri kaldır"
            >
              <Trash2 size={12} />
              <span>Tümünü Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* BİLDİRİM VE TAVSİYE ŞERİDİ */}
      {message && (
        <div className={`p-2.5 rounded-xl text-xs font-bold flex flex-wrap items-center justify-between gap-2.5 transition-all ${
          message.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border border-rose-200' 
            : message.type === 'info'
            ? 'bg-sky-50 text-sky-800 border border-sky-200'
            : message.type === 'suggestion'
            ? 'bg-amber-50/95 text-amber-950 border border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            {message.type === 'error' && <AlertCircle size={15} className="shrink-0 text-rose-600" />}
            {message.type === 'info' && <Info size={15} className="shrink-0 text-sky-600" />}
            {message.type === 'suggestion' && <Sparkles size={16} className="shrink-0 text-amber-600 animate-pulse" />}
            {message.type === 'success' && <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />}
            <span>{message.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 🔗 TEK TIKLA BLOĞA TAMAMLAMA TAVSİYE BUTONU */}
            {message.type === 'suggestion' && message.suggestion && (
              <button
                type="button"
                onClick={() => handleApplyBlockSuggestion(message.suggestion)}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer ring-2 ring-amber-400/50"
              >
                <Link2 size={13} />
                <span>🔗 {message.suggestion.targetPeriod}. Saate de Uygula (Blok Yap)</span>
              </button>
            )}

            <button 
              type="button" 
              onClick={() => {
                setMessage(null);
                setActiveSuggestion(null);
              }}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              title="Kapat"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ADIM 1: SINIF SEÇİMİ VE DERS ÇİPLERİ */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1">
              <Users size={13} className="text-amber-600" /> Sınıf:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubject('');
                setActiveSuggestion(null);
                setMessage(null);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
            >
              {(classrooms || []).map((c) => {
                const pCount = (pinnedSlots || []).filter((p) => p.classId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {pCount > 0 ? `(${pCount}s kilitli)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            💡 Tıklanan saat doğrudan 1 saat kilitlenir; ardışık saat için otomatik blok önerisi sunulur.
          </div>
        </div>

        {/* DERS ÇİPLERİ / BUTONLARI */}
        <div>
          <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Sabitlenecek Dersi Seçin:</span>
            {activeCourse && (
              <span className="text-amber-800 lowercase font-medium">
                Öğretmen: <span className="font-bold">{activeCourse.teacherName}</span> • Kalan:{' '}
                <span className="font-bold">{activeCourse.remainingHours} saat</span>
              </span>
            )}
          </div>

          {classCourses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Bu sınıfa tanımlı ders bulunamadı.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {classCourses.map((course) => {
                const isSelected = course.courseSubject === selectedSubject;
                const isCompleted = course.isCompleted;

                return (
                  <button
                    key={course.courseSubject}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => {
                      setSelectedSubject(course.courseSubject);
                      setActiveSuggestion(null);
                      setMessage(null);
                    }}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-1 bg-amber-500 text-white border-amber-600 shadow-xs'
                        : isCompleted
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700 hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    <span>{course.courseSubject}</span>

                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {isCompleted ? (
                        <span className="flex items-center gap-0.5"><Check size={10} /> Bitti</span>
                      ) : (
                        `${course.remainingHours}s`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADIM 2: İNTERAKTİF HAFTALIK DERS PROGRAMI MATRİSİ */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">İnteraktif Çizelge:</span>
            <span>Boş hücreye tıklayarak sabitleyin; kilitli hücreye tıklayarak kilidi kaldırın.</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Kilitli
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-300 border border-amber-400 inline-block"></span> Blok Tavsiyesi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-300 inline-block"></span> Öğrt. Kapalı
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-300 inline-block"></span> Çakışma
            </span>
          </div>
        </div>

        {/* RESPONSIVE YATAY TABLO */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">Saat</th>
                {days.map((d) => (
                  <th key={d} className="py-2.5 px-3 text-center border-r border-slate-200 last:border-r-0">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                const isLunchDivider = lunchAfter && lunchAfter > 0 && p === lunchAfter + 1;

                return (
                  <React.Fragment key={p}>
                    {/* ÖĞLE ARASI AYIRICI ŞERİT */}
                    {isLunchDivider && (
                      <tr className="bg-amber-50/80 border-y border-amber-200">
                        <td
                          colSpan={days.length + 1}
                          className="py-1 px-3 text-center text-[10px] font-black text-amber-900 tracking-widest"
                        >
                          🍽️ ÖĞLE ARASI (Ders blokları öğle arasını bölemez)
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      {/* SAAT SÜTUNU */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-slate-50/50 font-black text-xs text-slate-600">
                        {p}. Saat
                      </td>

                      {/* GÜN HÜCRELERİ */}
                      {days.map((day) => {
                        const status = getSlotStatus(day, p);
                        const isPinned = status.type === 'pinned';
                        const pin = status.pin;
                        const isTeacherClosed = status.type === 'teacher_closed';
                        const isTeacherCollision = status.type === 'teacher_collision';

                        // Bu hücre o an tavsiye edilen ardışık hedef saat mi?
                        const isTargetSuggestion = Boolean(
                          activeSuggestion &&
                          activeSuggestion.day === day &&
                          activeSuggestion.targetPeriod === p &&
                          !isPinned
                        );

                        return (
                          <td
                            key={day}
                            onClick={() => handleCellClick(day, p)}
                            className={`p-1.5 border-r border-slate-100 last:border-r-0 align-middle transition-all select-none ${
                              isPinned
                                ? 'bg-emerald-50/80 hover:bg-rose-50 cursor-pointer group'
                                : isTargetSuggestion
                                ? 'bg-amber-100/70 ring-2 ring-amber-400 ring-inset cursor-pointer'
                                : isTeacherClosed
                                ? 'bg-slate-100/90 text-slate-400 cursor-not-allowed'
                                : isTeacherCollision
                                ? 'bg-amber-50/70 text-amber-800 cursor-not-allowed'
                                : 'hover:bg-amber-50/40 cursor-pointer'
                            }`}
                            title={
                              isPinned
                                ? `📌 ${pin.subject} (${pin.groupId ? '2 Saatlik Blok' : 'Tek Saat'}) - Kaldırmak için tıklayın`
                                : isTargetSuggestion
                                ? `✨ ${activeSuggestion.subject} için 2. saati kilitleyip blok yapmak için tıklayın`
                                : status.reason || 'Sabitlemek için tıklayın'
                            }
                          >
                            {/* 1. KİLİTLİ HÜCRE */}
                            {isPinned ? (
                              <div className="relative border border-emerald-300 bg-white/95 rounded-lg p-2 shadow-2xs group-hover:border-rose-300 transition-colors">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-black text-emerald-950 text-xs truncate">
                                    {pin.subject}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Lock size={11} className="text-emerald-600 group-hover:hidden" />
                                    <Trash2 size={12} className="text-rose-600 hidden group-hover:inline-block" />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-emerald-800 mt-0.5">
                                  <span className="truncate max-w-[70px]">
                                    {(teachers || []).find((t) => t.id === pin.teacherId)?.name || 'Öğretmen'}
                                  </span>
                                  {pin.groupId ? (
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 px-1 rounded ml-1 shrink-0">
                                      Blok (2s)
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 rounded ml-1 shrink-0">
                                      1s
                                    </span>
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-rose-600/10 rounded-lg hidden group-hover:flex items-center justify-center text-[10px] font-black text-rose-700 backdrop-blur-[0.5px]">
                                  {pin.groupId ? 'Bloğu Kaldır ✕' : 'Kilidi Kaldır ✕'}
                                </div>
                              </div>
                            ) : isTargetSuggestion ? (
                              // 2. ARDIŞIK HÜCRE TAVSİYE ROZETİ (TEK TIKLA BLOK YAPMA HEDEFİ)
                              <div className="h-10 flex flex-col items-center justify-center text-center p-1 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 transition-all shadow-xs group">
                                <span className="text-[10px] font-black text-amber-900 flex items-center gap-1">
                                  <Link2 size={11} className="text-amber-700" /> + Bloğa Tamamla
                                </span>
                                <span className="text-[8.5px] font-bold text-amber-800">
                                  ({p}. Saat)
                                </span>
                              </div>
                            ) : isTeacherClosed ? (
                              // 3. ÖĞRETMEN KAPALI
                              <div className="h-10 flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-slate-200 bg-slate-100/50">
                                <span className="text-[9.5px] font-bold text-slate-400 flex items-center gap-1">
                                  ⛔ Kapalı
                                </span>
                              </div>
                            ) : isTeacherCollision ? (
                              // 4. ÖĞRETMEN ÇAKIŞMASI
                              <div className="h-10 flex flex-col items-center justify-center text-center p-1 rounded-lg border border-amber-200 bg-amber-100/40">
                                <span className="text-[9.5px] font-extrabold text-amber-800 flex items-center gap-0.5 truncate max-w-full">
                                  ⚠️ {status.otherClassName}
                                </span>
                                <span className="text-[8.5px] text-amber-700 truncate">Çakışma</span>
                              </div>
                            ) : (
                              // 5. BOŞ VE KİLİTLENEBİLİR HÜCRE
                              <div className="h-10 flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group">
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-amber-700 transition-colors">
                                  + Sabitle
                                </span>
                                <span className="text-[8.5px] text-slate-300 group-hover:text-amber-600">
                                  1 Saat
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
