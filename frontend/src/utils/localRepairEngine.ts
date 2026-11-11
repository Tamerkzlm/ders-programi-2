// frontend/src/utils/localRepairEngine.ts
import type { Teacher, Classroom, Timetable, PinnedSlot } from '../types';

export interface ChangedSlotInfo {
  classId: string;
  className: string;
  day: string;
  period: number;
  oldSubject: string;
  oldTeacherId?: string;
  oldTeacherName?: string;
  newSubject: string;
  newTeacherId?: string;
  newTeacherName?: string;
}

export interface AffectedTeacherInfo {
  teacherId: string;
  teacherName: string;
  branch: string;
  movedHours: number;
  gapsBefore: number;
  gapsAfter: number;
}

export interface LocalRepairDiffResult {
  targetTeacherId: string;
  targetTeacherName: string;
  targetTeacherGapsBefore: number;
  targetTeacherGapsAfter: number;
  affectedClassIds: string[];
  affectedClassNames: string[];
  totalSchoolClassesCount: number;
  untouchedClassesCount: number;
  affectedTeachers: AffectedTeacherInfo[];
  changedSlotsCount: number;
  changedSlots: ChangedSlotInfo[];
}

/**
 * Belirli bir öğretmenin ders verdiği tüm sınıf ID'lerini tespit eder.
 * Hem mevcut dağıtılmış programdan (timetable) hem de sınıf müfredat tanımlarından (classrooms) tarar.
 */
export function getTeacherClassIds(
  teacherId: string,
  timetable: Timetable = {},
  classrooms: Classroom[] = []
): string[] {
  const classIdSet = new Set<string>();

  // 1. Mevcut programdan tara
  Object.keys(timetable || {}).forEach((cId) => {
    const daysMap = timetable[cId] || {};
    Object.keys(daysMap).forEach((day) => {
      const slots = daysMap[day] || [];
      slots.forEach((s) => {
        if (s.teacherId === teacherId) {
          classIdSet.add(cId);
        }
      });
    });
  });

  // 2. Müfredat tanımlarından tara (henüz dağıtılmamış veya boşta kalan dersler için)
  (classrooms || []).forEach((c) => {
    (c.courses || []).forEach((crs) => {
      if (crs.teacherId === teacherId) {
        classIdSet.add(c.id);
      }
    });
  });

  return Array.from(classIdSet);
}

/**
 * Neighborhood (Etki Alanı) Kilitlerini Üretir:
 * 1. targetClassIds DIŞINDA kalan tüm sınıfların mevcut programdaki her dersi KİLİTLENİR (Freeze).
 * 2. targetClassIds İÇİNDEKİ derslerin kilitleri açılır (Unpin).
 * 3. Ancak kullanıcının daha önceden hedef sınıflarda elle bilerek kilitlediği özel slotlar varsa (existingManualPins) korunur.
 */
export function buildNeighborhoodPins(
  targetClassIds: string[],
  timetable: Timetable = {},
  existingManualPins: PinnedSlot[] = []
): PinnedSlot[] {
  const generatedPins: PinnedSlot[] = [];
  const targetSet = new Set(targetClassIds);

  // 1. Hedef sınıflar DIŞINDAKİ tüm sınıfların derslerini kilit listesine ekle
  Object.keys(timetable || {}).forEach((cId) => {
    if (targetSet.has(cId)) {
      return; // Hedef sınıflar serbest kalacak
    }

    const daysMap = timetable[cId] || {};
    Object.keys(daysMap).forEach((day) => {
      const slots = daysMap[day] || [];
      slots.forEach((slot) => {
        const periodNum = Number(slot.period);
        if (!isNaN(periodNum) && periodNum > 0) {
          generatedPins.push({
            classId: cId,
            day,
            period: periodNum,
            subject: slot.subject,
            teacherId: slot.teacherId || null
          });
        }
      });
    });
  });

  // 2. Hedef sınıflarda KULLANICI TARAFINDAN daha önce elle kilitlenmiş özel dersler varsa koru
  (existingManualPins || []).forEach((pin) => {
    if (targetSet.has(pin.classId)) {
      // Hedef sınıfta da olsa kullanıcının önceden mühürlediği kilidi muhafaza et
      const alreadyAdded = generatedPins.some(
        (p) => p.classId === pin.classId && p.day === pin.day && Number(p.period) === Number(pin.period)
      );
      if (!alreadyAdded) {
        generatedPins.push({ ...pin });
      }
    }
  });

  return generatedPins;
}

/**
 * Tek bir öğretmenin belirli bir gündeki boşluk (gap/pencere) sayısını hesaplar.
 */
export function calculateTeacherDayGaps(
  teacherId: string,
  day: string,
  timetable: Timetable = {}
): number {
  const busyPeriods: number[] = [];

  Object.keys(timetable || {}).forEach((cId) => {
    (timetable[cId]?.[day] || []).forEach((s) => {
      if (s.teacherId === teacherId) {
        const p = Number(s.period);
        if (!isNaN(p) && !busyPeriods.includes(p)) {
          busyPeriods.push(p);
        }
      }
    });
  });

  if (busyPeriods.length <= 1) return 0;
  busyPeriods.sort((a, b) => a - b);
  const span = busyPeriods[busyPeriods.length - 1] - busyPeriods[0] + 1;
  return Math.max(0, span - busyPeriods.length);
}

/**
 * Tek bir öğretmenin tüm haftadaki toplam boşluk (gap) sayısını hesaplar.
 */
export function calculateTeacherTotalGaps(
  teacherId: string,
  timetable: Timetable = {},
  days: string[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
): number {
  let total = 0;
  days.forEach((d) => {
    total += calculateTeacherDayGaps(teacherId, d, timetable);
  });
  return total;
}

/**
 * İki ders programı arasındaki farkı (diff) ve etki alanını detaylıca hesaplar.
 */
export function calculateTimetableDiff(
  targetTeacherId: string,
  oldTimetable: Timetable = {},
  newTimetable: Timetable = {},
  teachers: Teacher[] = [],
  classrooms: Classroom[] = [],
  days: string[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
): LocalRepairDiffResult {
  const teacherMap = new Map<string, Teacher>();
  teachers.forEach((t) => teacherMap.set(t.id, t));

  const classMap = new Map<string, Classroom>();
  classrooms.forEach((c) => classMap.set(c.id, c));

  const targetTeacher = teacherMap.get(targetTeacherId);
  const targetTeacherName = targetTeacher?.name || 'Seçilen Öğretmen';

  const changedSlots: ChangedSlotInfo[] = [];
  const affectedTeacherMovedCount = new Map<string, number>();
  const affectedClassIdSet = new Set<string>();

  const allClasses = Array.from(
    new Set([...Object.keys(oldTimetable || {}), ...Object.keys(newTimetable || {})])
  );

  allClasses.forEach((classId) => {
    const className = classMap.get(classId)?.name || classId;
    const oldDays = oldTimetable[classId] || {};
    const newDays = newTimetable[classId] || {};

    const allDays = Array.from(new Set([...Object.keys(oldDays), ...Object.keys(newDays)]));

    allDays.forEach((day) => {
      const oldSlots = oldDays[day] || [];
      const newSlots = newDays[day] || [];

      // Periyot numaralarına göre harita
      const oldPeriodMap = new Map<number, (typeof oldSlots)[0]>();
      oldSlots.forEach((s) => oldPeriodMap.set(Number(s.period), s));

      const newPeriodMap = new Map<number, (typeof newSlots)[0]>();
      newSlots.forEach((s) => newPeriodMap.set(Number(s.period), s));

      const allPeriods = Array.from(
        new Set([...Array.from(oldPeriodMap.keys()), ...Array.from(newPeriodMap.keys())])
      );

      allPeriods.forEach((period) => {
        const oldSlot = oldPeriodMap.get(period);
        const newSlot = newPeriodMap.get(period);

        const isDifferent =
          oldSlot?.subject !== newSlot?.subject ||
          oldSlot?.teacherId !== newSlot?.teacherId;

        if (isDifferent) {
          affectedClassIdSet.add(classId);

          const oldTName = oldSlot?.teacherId
            ? teacherMap.get(oldSlot.teacherId)?.name || oldSlot.teacherName || 'Bilinmiyor'
            : '-';
          const newTName = newSlot?.teacherId
            ? teacherMap.get(newSlot.teacherId)?.name || newSlot.teacherName || 'Bilinmiyor'
            : '-';

          changedSlots.push({
            classId,
            className,
            day,
            period,
            oldSubject: oldSlot?.subject || '(Boş)',
            oldTeacherId: oldSlot?.teacherId,
            oldTeacherName: oldTName,
            newSubject: newSlot?.subject || '(Boş)',
            newTeacherId: newSlot?.teacherId,
            newTeacherName: newTName
          });

          if (oldSlot?.teacherId) {
            affectedTeacherMovedCount.set(
              oldSlot.teacherId,
              (affectedTeacherMovedCount.get(oldSlot.teacherId) || 0) + 1
            );
          }
          if (newSlot?.teacherId && newSlot.teacherId !== oldSlot?.teacherId) {
            affectedTeacherMovedCount.set(
              newSlot.teacherId,
              (affectedTeacherMovedCount.get(newSlot.teacherId) || 0) + 1
            );
          }
        }
      });
    });
  });

  // Etkilenen öğretmenlerin boşluk analizi
  const affectedTeachers: AffectedTeacherInfo[] = [];
  affectedTeacherMovedCount.forEach((count, tId) => {
    const t = teacherMap.get(tId);
    const gapsBefore = calculateTeacherTotalGaps(tId, oldTimetable, days);
    const gapsAfter = calculateTeacherTotalGaps(tId, newTimetable, days);

    affectedTeachers.push({
      teacherId: tId,
      teacherName: t?.name || 'Bilinmeyen Öğretmen',
      branch: t?.branch || 'Genel',
      movedHours: count,
      gapsBefore,
      gapsAfter
    });
  });

  // Hedef öğretmeni en başa al, kalanları etkilenen saat sayısına göre sırala
  affectedTeachers.sort((a, b) => {
    if (a.teacherId === targetTeacherId) return -1;
    if (b.teacherId === targetTeacherId) return 1;
    return b.movedHours - a.movedHours;
  });

  const targetGapsBefore = calculateTeacherTotalGaps(targetTeacherId, oldTimetable, days);
  const targetGapsAfter = calculateTeacherTotalGaps(targetTeacherId, newTimetable, days);

  const affectedClassIds = Array.from(affectedClassIdSet);
  const affectedClassNames = affectedClassIds.map((id) => classMap.get(id)?.name || id);
  const totalSchoolClassesCount = classrooms.length > 0 ? classrooms.length : allClasses.length;
  const untouchedClassesCount = Math.max(0, totalSchoolClassesCount - affectedClassIds.length);

  return {
    targetTeacherId,
    targetTeacherName,
    targetTeacherGapsBefore: targetGapsBefore,
    targetTeacherGapsAfter: targetGapsAfter,
    affectedClassIds,
    affectedClassNames,
    totalSchoolClassesCount,
    untouchedClassesCount,
    affectedTeachers,
    changedSlotsCount: changedSlots.length,
    changedSlots
  };
}
