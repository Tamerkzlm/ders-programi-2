# backend/validators.py
from models import SolveRequest
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def pre_flight_check(request: SolveRequest):
    settings = request.settings
    teachers = request.teachers
    classrooms = request.classrooms

    num_days = len(settings.days)
    periods_per_day = settings.periodsPerDay
    total_slots_per_classroom = num_days * periods_per_day

    # 1. Okul Genel Kapasite Kontrolü
    total_requested_hours = 0
    for classroom in classrooms:
        # Yeni: sıfır veya negatif haftalık saat kontrolü
        for course in classroom.courses:
            if not isinstance(course.hoursPerWeek, int) or course.hoursPerWeek <= 0:
                error_msg = (
                    f"{classroom.name} sınıfındaki '{course.subject}' dersinin haftalık saati "
                    f"({course.hoursPerWeek}) geçersiz. Haftalık ders saati en az 1 olmalıdır."
                )
                logger.error(f"Validasyon Hatası (Geçersiz Ders Saati): {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)

        classroom_hours = sum(course.hoursPerWeek for course in classroom.courses)
        if classroom_hours > total_slots_per_classroom:
            error_msg = f"{classroom.name} sınıfının haftalık toplam ders saati ({classroom_hours} saat), okulun haftalık azami ders kapasitesini ({total_slots_per_classroom} saat) aşıyor! Lütfen bu sınıfın ders saatlerini azaltın."
            logger.error(f"Validasyon Hatası: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        total_requested_hours += classroom_hours

    # 2. Atanmamış Öğretmen Kontrolü
    teacher_dict = {t.id: t for t in teachers}
    for classroom in classrooms:
        for course in classroom.courses:
            if not course.teacherId:
                error_msg = f"{classroom.name} sınıfındaki '{course.subject}' dersine henüz öğretmen atanmamış! Lütfen 'Ders Atama' menüsünden öğretmen belirleyin."
                logger.error(f"Validasyon Hatası: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
            if course.teacherId not in teacher_dict:
                error_msg = f"{classroom.name} sınıfındaki '{course.subject}' dersine atanmış olan öğretmen (ID: {course.teacherId}) öğretmenler listesinde bulunamadı!"
                logger.error(f"Validasyon Hatası: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)

    # 3. Öğretmen Kapasite ve Müsaitlik Kontrolü
    teacher_lecture_hours = {t.id: 0 for t in teachers}

    for classroom in classrooms:
        for course in classroom.courses:
            if course.teacherId in teacher_lecture_hours:
                teacher_lecture_hours[course.teacherId] += course.hoursPerWeek

    for teacher in teachers:
        unavailable_slots_count = 0
        if teacher.unavailable:
            for day, periods in teacher.unavailable.items():
                if day in settings.days:
                    unavailable_slots_count += len([p for p in periods if 1 <= p <= periods_per_day])

        max_available_slots = (num_days * periods_per_day) - unavailable_slots_count
        assigned_hours = teacher_lecture_hours.get(teacher.id, 0)

        if assigned_hours > max_available_slots:
            error_msg = (f"Öğretmen: '{teacher.name}' -> Haftalık atanan toplam ders: {assigned_hours} saat. "
                         f"Ancak kapalı saatleri ({unavailable_slots_count} saat kapalı) nedeniyle okulda yalnızca "
                         f"{max_available_slots} saat boş vakti var! Atanan ders sayısı müsait saatleri aşıyor.")
            logger.error(f"Validasyon Hatası (Öğretmen Limit Aşımı): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # Günlük üst sınır ve kapalı günler birlikte haftalık yükü taşıyabilmeli
        custom = bool(getattr(teacher, "hasCustomConstraints", False))
        daily_cap = int(getattr(teacher, "customMaxHours", 8)) if custom else int(teacher.maxPerDay)
        daily_cap = max(1, min(daily_cap, periods_per_day))

        # 30+ saat gibi yüksek ders yükü olan öğretmenlerde günlük üst sınır ihtiyaç duyulan seviyeye otomatik esnetilir
        open_days_count = 0
        for day in settings.days:
            closed = {p for p in (teacher.unavailable or {}).get(day, []) if 1 <= p <= periods_per_day}
            if len(closed) < periods_per_day:
                open_days_count += 1

        reachable = sum(min(periods_per_day - len({p for p in (teacher.unavailable or {}).get(d, []) if 1 <= p <= periods_per_day}), daily_cap) for d in settings.days)

        while daily_cap < periods_per_day and reachable < assigned_hours:
            daily_cap += 1
            reachable = sum(min(periods_per_day - len({p for p in (teacher.unavailable or {}).get(d, []) if 1 <= p <= periods_per_day}), daily_cap) for d in settings.days)

        if assigned_hours > reachable:
            error_msg = (f"Öğretmen: '{teacher.name}' -> Atanan ders: {assigned_hours} saat. "
                         f"Öğretmenin açık olduğu {open_days_count} gün dikkate alındığında okulda "
                         f"en fazla {reachable} saat ders yerleştirilebilir! "
                         f"Lütfen öğretmenin kapalı gün/saatlerini açın.")
            logger.error(f"Validasyon Hatası (Günlük Sınır): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # VIP asgari ders saati kontrolü
        if custom and open_days_count > 2:
            min_hours = int(getattr(teacher, "customMinHours", 2))
            if assigned_hours > 0 and assigned_hours < min_hours:
                error_msg = (f"Öğretmen: '{teacher.name}' (VIP) -> Günlük asgari {min_hours} saat şartı belirlenmiş, "
                             f"fakat öğretmene verilen toplam haftalık ders yalnızca {assigned_hours} saat!")
                logger.error(f"Validasyon Hatası (VIP Taban Saat): {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)

    # 4. Kilitli Ders (Pinned Slots) Çakışma ve Müsaitlik Kontrolü
    pinned_slots = getattr(request, "pinnedSlots", None) or []
    if pinned_slots:
        # A) Aynı sınıfta aynı saatte çakışan kilitler
        class_slot_map = {}
        # B) Aynı öğretmende aynı saatte çakışan kilitler
        teacher_slot_map = {}

        for pin in pinned_slots:
            c_id = getattr(pin, "classId", None) or pin.get("classId")
            day = getattr(pin, "day", None) or pin.get("day")
            period = int(getattr(pin, "period", None) or pin.get("period"))
            subject = getattr(pin, "subject", None) or pin.get("subject")
            t_id = getattr(pin, "teacherId", None) or pin.get("teacherId")

            c_key = (c_id, day, period)
            if c_key in class_slot_map:
                c_name = next((c.name for c in classrooms if c.id == c_id), "Sınıf")
                error_msg = f"Kilit Çakışması: {c_name} sınıfında {day} günü {period}. saatte birden fazla ders ('{subject}' ve '{class_slot_map[c_key]}') kilitlenmiş!"
                logger.error(f"Validasyon Hatası (Kilit Çakışması): {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
            class_slot_map[c_key] = subject

            if t_id:
                t_key = (t_id, day, period)
                if t_key in teacher_slot_map:
                    t_name = teacher_dict.get(t_id, {}).name if t_id in teacher_dict else "Öğretmen"
                    error_msg = f"Kilit Çakışması: {t_name} öğretmenine {day} günü {period}. saatte iki farklı sınıfta kilit konulmuş!"
                    logger.error(f"Validasyon Hatası (Kilit Öğretmen Çakışması): {error_msg}")
                    raise HTTPException(status_code=400, detail=error_msg)
                teacher_slot_map[t_key] = c_id

                # Kilitli saatin öğretmenin kapalı saatine denk gelmesi
                t_obj = teacher_dict.get(t_id)
                if t_obj and t_obj.unavailable:
                    closed_periods = t_obj.unavailable.get(day, [])
                    if period in closed_periods:
                        error_msg = f"Kilit Uyuşmazlığı: {t_obj.name} {day} günü {period}. saatte KISITLI/KAPALI olmasına rağmen o saate ders kilitlenmiş!"
                        logger.error(f"Validasyon Hatası (Kapalı Saate Kilit): {error_msg}")
                        raise HTTPException(status_code=400, detail=error_msg)

    # 4b. Gruplu Kilit (Pinned Slots) Kontrolü - 2 saatlik bloklar için
    pins_by_group = {}
    for pin in pinned_slots:
        group_id = getattr(pin, "groupId", None) or (pin.get("groupId") if isinstance(pin, dict) else None)
        if group_id:
            pins_by_group.setdefault(group_id, []).append(pin)

    for gid, pins in pins_by_group.items():
        if len(pins) != 2:
            error_msg = f"Grup '{gid}' için beklenen 2 pin bulunamadı (bulunan: {len(pins)}). 2 saatlik bloklar için tam iki pin gerekir."
            logger.error(f"Validasyon Hatası (Grup Boyutu): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        class_ids = {getattr(p, "classId", None) or (p.get("classId") if isinstance(p, dict) else None) for p in pins}
        days = {getattr(p, "day", None) or (p.get("day") if isinstance(p, dict) else None) for p in pins}
        periods = sorted([int(getattr(p, "period", None) or (p.get("period") if isinstance(p, dict) else 0)) for p in pins])

        if len(class_ids) != 1 or len(days) != 1:
            error_msg = f"Grup '{gid}' içinde farklı sınıflar veya günler bulunuyor. Blok kilit aynı sınıf ve aynı günde olmalıdır."
            logger.error(f"Validasyon Hatası (Grup Tutarlılık): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        if periods[1] != periods[0] + 1:
            error_msg = f"Grup '{gid}' için pin saatleri bitişik değil ({periods[0]}. ve {periods[1]}. saat). 2 saatlik bloklar art arda olmalıdır."
            logger.error(f"Validasyon Hatası (Grup Bitişiklik): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        if periods[1] > periods_per_day or periods[0] < 1:
            error_msg = f"Grup '{gid}' için pin saatleri ({periods[0]}-{periods[1]}) okulun günlük ders saati sınırını (1-{periods_per_day}) aşıyor."
            logger.error(f"Validasyon Hatası (Grup Sınır): {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

    return True
