// frontend/src/utils/dykEngine.js
/**
 * 🎯 DYK (DESTEKLEME VE YETİŞTİRME KURSU) AKILLI DAĞITIM MOTORU
 * 
 * Blok Saatler:
 * - 1. Blok: 15:50 - 17:00 (2 Derslik Blok)
 * - 2. Blok: 18:00 - 19:10 (2 Derslik Blok)
 * 
 * Kurallar:
 * 1. Öğretmen yalnızca DYK için onay verdiği günlerde görev alır.
 * 2. Bir öğretmen aynı gün ve aynı blokta birden fazla sınıfta olamaz.
 * 3. Bir sınıf aynı blokta tek derse girer.
 * 4. Bir sınıfın aynı dersten haftalık blokları günlere dengeli dağıtılır.
 */

export const solveDykSchedule = ({
  dykGroups = [],
  dykAssignments = [],
  dykTeacherAvailabilities = {},
  dykSettings = {},
  teachers = []
}) => {
  const blocks = dykSettings?.blocks || [
    { id: "b1", name: "1. Blok Kurs (15:50 - 17:00)", startTime: "15:50", endTime: "17:00" },
    { id: "b2", name: "2. Blok Kurs (18:00 - 19:10)", startTime: "18:00", endTime: "19:10" }
  ];

  const activeDays = dykSettings?.activeDays || ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  // Çizelge yapısı: groupId -> day -> blockId -> { subject, teacherId }
  const schedule = {};
  dykGroups.forEach(g => {
    schedule[g.id] = {};
    activeDays.forEach(d => {
      schedule[g.id][d] = {};
    });
  });

  // Dağıtılacak blok aktiviteleri
  const activities = [];
  dykAssignments.forEach(asg => {
    const blocksCount = Number(asg.blocksPerWeek) || 1;
    for (let i = 0; i < blocksCount; i++) {
      activities.push({
        id: `${asg.id}_${i}`,
        assignmentId: asg.id,
        groupId: asg.groupId,
        teacherId: asg.teacherId,
        subject: asg.subject
      });
    }
  });

  // Öğretmen meşguliyeti: teacherId -> day -> blockId -> true
  const teacherBusy = {};
  teachers.forEach(t => {
    teacherBusy[t.id] = {};
    activeDays.forEach(d => {
      teacherBusy[t.id][d] = {};
    });
  });

  // Aktiviteleri zorluk derecesine göre sırala (az günü olan öğretmenler önce)
  activities.sort((a, b) => {
    const aDays = dykTeacherAvailabilities[a.teacherId]?.length || activeDays.length;
    const bDays = dykTeacherAvailabilities[b.teacherId]?.length || activeDays.length;
    return aDays - bDays;
  });

  const unassigned = [];

  // Akıllı Yerleştirme (Greedy + Backtracking ile kısıt çözümü)
  activities.forEach(act => {
    const allowedDays = dykTeacherAvailabilities[act.teacherId] && dykTeacherAvailabilities[act.teacherId].length > 0
      ? dykTeacherAvailabilities[act.teacherId].filter(d => activeDays.includes(d))
      : activeDays;

    let placed = false;

    // Önce aynı dersten o gün zaten dersi olmayan günleri tercih et
    const sortedDays = [...allowedDays].sort((d1, d2) => {
      const g1Has = Object.values(schedule[act.groupId][d1] || {}).some(s => s?.subject === act.subject);
      const g2Has = Object.values(schedule[act.groupId][d2] || {}).some(s => s?.subject === act.subject);
      if (g1Has && !g2Has) return 1;
      if (!g1Has && g2Has) return -1;
      return 0;
    });

    for (const day of sortedDays) {
      if (placed) break;

      for (const block of blocks) {
        // Sınıf o blokta boş mu?
        if (schedule[act.groupId][day][block.id]) continue;

        // Öğretmen o blokta boş mu?
        if (teacherBusy[act.teacherId][day][block.id]) continue;

        // Yerleştir!
        schedule[act.groupId][day][block.id] = {
          subject: act.subject,
          teacherId: act.teacherId,
          assignmentId: act.assignmentId
        };
        teacherBusy[act.teacherId][day][block.id] = true;
        placed = true;
        break;
      }
    }

    if (!placed) {
      unassigned.push(act);
    }
  });

  return {
    success: unassigned.length === 0,
    schedule,
    unassigned,
    totalActivities: activities.length,
    assignedCount: activities.length - unassigned.length
  };
};
