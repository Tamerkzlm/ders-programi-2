import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Printer, FileText, Users, GraduationCap, AlertCircle, Download, Upload, CheckCircle } from 'lucide-react';
import { calculateTeacherDutyDay } from '../utils/dutyDayCalculator';

export default function Export() {
  // Tüm store verilerini ve tek tek set aksiyonlarını çekiyoruz
  const storeState = useAppStore();
  const { settings, teachers, classrooms, timetable } = storeState;
  
  const [printMode, setPrintMode] = useState('teachers'); 
  const [backupMessage, setBackupMessage] = useState({ type: '', text: '' });
  
  const numPeriods = settings?.periodsPerDay || 8;
  const periodsArray = Array.from({ length: numPeriods }, (_, i) => i + 1);
  const daysArray = settings?.days || [];
  
  const principalTitle = settings?.principalName ? `${settings.principalName}\nOkul Müdürü` : 'Okul Müdürü';
  const schoolTitle = settings?.schoolName || 'Hz. Ayşe Kız Anadolu İmam Hatip Lisesi';

  // 📥 1. AKSİYON: TÜM VERİ TABANINI JSON OLARAK DIŞA AKTAR (YEDEKLE)
  const handleExportBackup = () => {
    try {
      const backupData = {
        settings: storeState.settings,
        teachers: storeState.teachers,
        classrooms: storeState.classrooms,
        timetable: storeState.timetable,
        exportDate: new Date().toISOString(),
        version: "1.0.0"
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      
      // Dosya adını kurumsal yapalım: okul-adi_tarih_yedek.json
      const cleanSchoolName = (settings?.schoolName || "okul").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const today = new Date().toISOString().split('T')[0];
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${cleanSchoolName}_ders_programi_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupMessage({ type: 'success', text: 'Tüm sistem veritabanı başarıyla bilgisayarınıza yedeklendi.' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 4000);
    } catch {
      setBackupMessage({ type: 'error', text: 'Yedekleme dosyası oluşturulurken teknik bir hata oluştu.' });
    }
  };

  // 📤 2. AKSİYON: BİLGİSAYARDAKİ JSON YEDEĞİNİ SİSTEME ENJEKTE ET (GERİ YÜKLE)
  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("Dikkat! Yedek dosyasını geri yüklediğinizde, şu an sistemde açık olan tüm öğretmen, sınıf ve ders ayarları silinecek ve yedekteki veriler yazılacaktır. Devam etmek istiyor musunuz?")) {
      e.target.value = ''; // Inputu temizle
      return;
    }

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Temel şema doğrulama testi (Validasyon)
        if (!parsedData.settings || !parsedData.teachers || !parsedData.classrooms) {
          throw new Error("Geçersiz yedek şeması.");
        }

        // Zustand Store'u canlı olarak yeni verilerle besliyoruz
        useAppStore.setState({
          settings: parsedData.settings,
          teachers: parsedData.teachers,
          classrooms: parsedData.classrooms,
          timetable: parsedData.timetable || {}
        });

        setBackupMessage({ type: 'success', text: 'Yedek dosyası başarıyla çözüldü. Tüm okul veritabanı geri yüklendi!' });
        setTimeout(() => setBackupMessage({ type: '', text: '' }), 4000);
      } catch {
        setBackupMessage({ type: 'error', text: 'HATA: Seçtiğiniz dosya geçerli bir ders programı yedek dosyası değil!' });
      } finally {
        e.target.value = ''; // Inputu sıfırla
      }
    };
    
    fileReader.readAsText(file);
  };

  if (!timetable || Object.keys(timetable).length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm"><AlertCircle size={32} /></div>
        <h3 className="text-lg font-bold text-gray-800">Dışa Aktarılacak Program Bulunmadı</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">Baskı alabilmek için önce programın oluşturulmuş olması gerekir.</p>
      </div>
    );
  }

  const getTeacherLessons = (teacherId) => {
    const teacherData = {};
    daysArray.forEach(d => { teacherData[d] = {}; });
    Object.keys(timetable).forEach(cId => {
      const className = classrooms.find(c => c.id === cId)?.name || 'Sınıf';
      daysArray.forEach(day => {
        const slots = timetable[cId]?.[day] || [];
        slots.forEach(slot => {
          if (slot.teacherId === teacherId) {
            teacherData[day][slot.period] = { subject: slot.subject, className };
          }
        });
      });
    });
    return teacherData;
  };

  const getTeacherTotalLoad = (teacherId) => {
    let total = 0;
    classrooms.forEach(c => {
      (c.courses || []).forEach(co => {
        if (co.teacherId === teacherId) total += Number(co.hoursPerWeek) || 0;
      });
    });
    return total;
  };

  return (
    <div className="p-6 space-y-6 transition-all duration-300">
      
      {/* 🛡️ EKRAN PANELİ 1: VERİ SİGORTASI VE YEDEKLEME MERKEZİ (PRINT ESNASINDA GİZLENİR) */}
      <div className="print:hidden bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 shadow-md rounded-2xl p-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            Veri Yedekleme & Geri Yükleme
          </h3>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Yedek İndirme Butonu */}
          <button
            onClick={handleExportBackup}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 font-bold text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Download size={14} /> Sistemi Yedekle (JSON)
          </button>

          {/* Yedek Yükleme Gizli Input Tetikleyicisi */}
          <label className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 font-bold text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20">
            <Upload size={14} /> Yedekten Geri Yükle
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ANLIK BİLDİRİM BANNERI */}
      {backupMessage.text && (
        <div className={`print:hidden p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 animate-in fade-in duration-200 ${
          backupMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {backupMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span>{backupMessage.text}</span>
        </div>
      )}

      {/* EKRAN PANELİ 2: BASKI SEÇENEKLERİ KUMANDASI */}
      <div className="print:hidden bg-white border border-gray-200 shadow-sm rounded-2xl p-5 space-y-4">
        <div>
          <h1 className="text-sm font-black uppercase text-gray-700 flex items-center gap-1.5">
            <Printer className="text-blue-600" size={18} /> Resmi Çıktılar
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setPrintMode('teachers')} className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${printMode === 'teachers' ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Users size={18} /><span className="text-xs font-bold">Öğretmen El Programları</span></button>
          <button onClick={() => setPrintMode('classrooms')} className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${printMode === 'classrooms' ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><GraduationCap size={18} /><span className="text-xs font-bold">Sınıf Pano Programları</span></button>
          <button onClick={() => setPrintMode('general')} className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${printMode === 'general' ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><FileText size={18} /><span className="text-xs font-bold">Okul Genel Çarşafı</span></button>
        </div>

        <div className="pt-1 flex justify-end">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer">
            <Printer size={15} /> Resmi PDF Çıktısı Al
          </button>
        </div>
      </div>

      {/* 🖨️ NİHAİ RESMİ BASKI MABEDİ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 print:p-0 print:border-none print:shadow-none">
        <style dangerouslySetInnerHTML={{__html: `@media print { body { background: white !important; color: black !important; font-size: 10pt !important; } .print\\:hidden { display: none !important; } .page-break { page-break-after: always !important; break-after: page !important; } table { page-break-inside: avoid !important; } tr { page-break-inside: avoid !important; } }`}} />

        <div className="text-center space-y-1 mb-6 pb-4 border-b-2 border-gray-800">
          <h2 className="text-base font-black uppercase tracking-wide text-gray-900">T.C. MİLLÎ EĞİTİM BAKANLIĞI</h2>
          <h3 className="text-sm font-bold text-gray-800">{schoolTitle}</h3>
          <div className="text-[10px] text-gray-500 print:text-black font-semibold">Haftalık Ders Dağıtım Çizelgesi Raporu</div>
        </div>

        {printMode === 'teachers' && (
          <div className="space-y-8 print:space-y-0">
            {teachers.map((t, idx) => {
              const teacherLessons = getTeacherLessons(t.id);
              const teacherLoad = getTeacherTotalLoad(t.id);
              const dutyDay = calculateTeacherDutyDay(t.id, timetable, settings);
              return (
                <div key={t.id} className={`bg-white border border-gray-300 rounded-xl p-4 ${idx > 0 ? 'print:mt-6' : ''} print:border-gray-800 print:rounded-none page-break`}>
                  <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-3">
                    <div>
                      <span className="font-black text-xs text-gray-900 block">Sayın: {t.name.toUpperCase()}</span>
                      {dutyDay && (
                        <span className="text-[10px] font-black text-indigo-950 block mt-0.5">
                          Nöbet Günü: {dutyDay}
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-gray-600 block mt-0.5">
                        Haftalık Ders: {teacherLoad} Saat • Branş: {t.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[9px] font-bold text-gray-700 block">Tebliğ Tarihi: ____/____/2026</span>
                        <span className="text-[8.5px] text-gray-500 block mt-0.5">Öğretmen İmzası: ____________</span>
                      </div>
                    </div>
                  </div>
                  
                  <table className="w-full border-collapse border border-gray-400 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400 font-bold">
                        <th className="border border-gray-400 p-1.5 w-20">Gün</th>
                        {periodsArray.map(p => <th key={p} className="border border-gray-400 p-1.5 text-center">{p}. Ders</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {daysArray.map(day => (
                        <tr key={day} className="border-b border-gray-300">
                          <td className="border border-gray-400 p-1.5 font-bold capitalize bg-gray-50/50">{day}</td>
                          {periodsArray.map(p => {
                            const lesson = teacherLessons[day]?.[p];
                            return (
                              <td key={p} className="border border-gray-400 p-1 text-center h-10 min-w-[70px]">
                                {lesson ? (
                                  <div>
                                    <div className="font-bold text-gray-900">{lesson.subject}</div>
                                    <div className="text-[8px] font-semibold text-gray-600">{lesson.className}</div>
                                  </div>
                                ) : <span className="text-gray-300">-</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 flex justify-between text-[9px] font-bold text-gray-600 print:text-black whitespace-pre-line">
                    <div>Yukarıdaki ders programını tebellüğ ettim.<br/><br/>İmza: </div>
                    <div className="text-right">{principalTitle}<br/><br/>İmza - Mühür</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {printMode === 'classrooms' && (
          <div className="space-y-8 print:space-y-0">
            {classrooms.map((c) => (
              <div key={c.id} className="bg-white border border-gray-300 rounded-xl p-4 print:border-gray-800 print:rounded-none page-break">
                <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3">
                  <span className="font-black text-xs text-gray-900">Sınıf / Şube: {c.name}</span>
                </div>

                <table className="w-full border-collapse border border-gray-400 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-400 font-bold">
                      <th className="border border-gray-400 p-1.5 w-20">Gün</th>
                      {periodsArray.map(p => <th key={p} className="border border-gray-400 p-1.5 text-center">{p}. Ders</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {daysArray.map(day => (
                      <tr key={day} className="border-b border-gray-300">
                        <td className="border border-gray-400 p-1.5 font-bold capitalize bg-gray-50/50">{day}</td>
                        {periodsArray.map(p => {
                          const slot = timetable[c.id]?.[day]?.find(s => s.period === p);
                          return (
                            <td key={p} className="border border-gray-400 p-1 text-center h-10 min-w-[70px]">
                              {slot ? (
                                <div>
                                  <div className="font-bold text-gray-900">{slot.subject}</div>
                                  <div className="text-[8px] font-semibold text-gray-600">{teachers.find(t => t.id === slot.teacherId)?.name.split(' ')[0]}</div>
                                </div>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 flex justify-end text-[9px] font-bold text-gray-600 print:text-black whitespace-pre-line text-right">
                  <div>{principalTitle}<br/><br/>İmza - Mühür</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {printMode === 'general' && (
          <div className="overflow-x-auto space-y-4">
            <table className="w-full border-collapse border border-gray-500 text-[9px]">
              <thead>
                <tr className="bg-gray-800 text-white font-bold">
                  <th className="border border-gray-500 p-2 text-left">Sınıf / Gün</th>
                  {periodsArray.map(p => <th key={p} className="border border-gray-500 p-2 text-center">{p}. Ders</th>)}
                </tr>
              </thead>
              <tbody>
                {classrooms.map(c => (
                  <React.Fragment key={c.id}>
                    {daysArray.map((day, dIdx) => (
                      <tr key={`${c.id}-${day}`} className="border-b border-gray-300 hover:bg-gray-50">
                        {dIdx === 0 ? <td rowSpan={daysArray.length} className="border border-gray-500 p-2 font-black text-center bg-gray-100 text-gray-900 w-16">{c.name}</td> : null}
                        <td className="border border-gray-400 p-1.5 font-bold capitalize text-gray-600 bg-gray-50/30 w-20">{day}</td>
                        {periodsArray.map(p => {
                          const slot = timetable[c.id]?.[day]?.find(s => s.period === p);
                          return (
                            <td key={p} className="border border-gray-400 p-1 text-center h-10 min-w-[75px]">
                              {slot ? (
                                <div>
                                  <div className="font-bold text-gray-900">{slot.subject}</div>
                                  <div className="text-[8px] opacity-75">{teachers.find(t => t.id === slot.teacherId)?.name}</div>
                                </div>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-gray-200 h-1"><td colSpan={numPeriods + 2} className="p-0 border border-gray-500"></td></tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex justify-end text-[9px] font-bold text-gray-600 print:text-black whitespace-pre-line text-right">
              <div>{principalTitle}<br/><br/>İmza - Mühür</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}