# backend/solver.py
"""
Ders programı çözücüsü (OR-Tools CP-SAT).

Akış (tek model, bir kez kurulur):
  0) GEÇERLİ ÇÖZÜM: yalnızca zorunlu kurallarla (çakışma yok, kapalı saatler, günlük üst sınır,
     günde en az 2 saat, ders-sınıf bitişiklik, günde tekrar sınırı, özel/VIP kısıtlar) ilk geçerli
     program bulunur. Zorunlu kurallar iyileştirme kademeleriyle BİREBİR aynıdır; bu sayede
     bulunan çözüm sonraki kademelere eksiksiz ve geçerli bir ipucu (hint) olarak verilir.
  1) HİYERARŞİK (lexicographic) İYİLEŞTİRME – aynı model üzerinde sırayla:
       A) Kural ihlalleri  (boşluk üst sınırı, günlük denge, asgari/azami saat, günde 2 saat)
       B) Öğretmen boşlukları ve boş gün
       C) Tercihler        (erken başlama, fen/matematik geç saat)
     Her kademenin ulaştığı değer bir sonraki kademede üst sınır olarak sabitlenir. Her kademe,
     iyileşme durduğunda (durgunluk) erken biter; kalan süre sonraki kademeye devreder.

Performans notları:
  - Öğretmenin kapalı saatlerine denk gelen yerleşim değişkenleri hiç oluşturulmaz.
  - Aynı dersin özdeş blokları (ör. MAT 2+2+2) için simetri kırma uygulanır.
  - Haftalık saati tam kapasite olan sınıflarda her hücre için "tam olarak bir ders" kısıtı kullanılır.
  - Boşluk sayısı ek değişken olmadan doğrusal olarak hesaplanır: boşluk = Σs + Σe − P·h − saat.
  - İşçi (thread) sayısı makinenin gerçek CPU kotasından belirlenir (SOLVER_WORKERS ile ezilebilir).
"""
import os
import re
import math
import time
import threading
import traceback
import logging
from ortools.sat.python import cp_model
from models import SolveRequest

logger = logging.getLogger(__name__)

def safe_print(msg: str, flush: bool = True):
    """
    I/O hatası (Errno 5 / stdout akış kopması / disk doluluğu) durumunda
    çözücünün çökmesini önleyen dayanıklı loglama fonksiyonu.
    """
    try:
        logger.info(msg)
    except Exception:
        pass
    try:
        print(msg, flush=flush)
    except (OSError, IOError, BrokenPipeError):
        pass

FREE_DAY_W = 4  # B kademesi: fazladan gelinen her gün, yaklaşık 4 boşluk saatine denk ceza

STEM_PATTERNS = [
    r"^mat(\d+|ematik)?.*$",
    r"^fiz(ik|k)?\d*$",
    r"^kim(ya|\d+)?$",
    r"^biy(oloji)?\d*$",
    r"^fen(\d+|bilim.*|tek.*)?$",
    r"^geo(metri)?\d*$"
]

# Amaç fonksiyonu ağırlıkları (Tek geçişli çok amaçlı LNS optimizasyonu)
# Kural ihlalleri >> Boşluk ve boş gün >> Tercihler
WEIGHT_RULES = 1000
WEIGHT_GAPS = 25
WEIGHT_PREFS = 1

TIERS = [
    ("rules", "kural ihlalleri", 0.5),
    ("gaps", "boşluk ve boş gün", 0.65),
    ("prefs", "tercihler", 1.0),
]

# 📡 Canlı İlerleme (Live Progress Feedback) Durumu
_progress_lock = threading.Lock()
_live_progress = {
    "active": False,
    "stageIndex": 0,
    "stageTitle": "Hazır",
    "stageDesc": "",
    "elapsedSeconds": 0.0,
    "totalActivities": 0,
    "totalHours": 0,
    "numVariables": 0,
    "workers": 1,
    "solutionsFound": 0,
    "initialGaps": None,
    "currentGaps": None,
    "hardestTeachers": [],
    "feed": [],
}

# 🛑 Erken Sonlandırma (Kullanıcı İsteğiyle Durdurup Son Çözümü Koruma) Durumu
_stop_event = threading.Event()
_current_solver_lock = threading.Lock()
_current_solver = None


def reset_live_progress():
    global _current_solver
    _stop_event.clear()
    with _current_solver_lock:
        _current_solver = None
    with _progress_lock:
        _live_progress.update({
            "active": True,
            "startTime": time.time(),
            "stageIndex": 0,
            "stageTitle": "Ön Kontroller & Matematiksel Model Kurulumu",
            "stageDesc": "Ders blokları, öğretmen kısıtları ve sınıf matrisi oluşturuluyor...",
            "elapsedSeconds": 0.0,
            "totalActivities": 0,
            "totalHours": 0,
            "numVariables": 0,
            "workers": 1,
            "solutionsFound": 0,
            "initialGaps": None,
            "currentGaps": None,
            "hardestTeachers": [],
            "feed": [],
        })


def request_stop_solver() -> bool:
    """Kullanıcının devam eden optimizasyonu sonlandırıp son geçerli çözümü almasını sağlar."""
    with _progress_lock:
        is_active = _live_progress.get("active", False)
        sols = _live_progress.get("solutionsFound", 0)
        gaps = _live_progress.get("currentGaps")

    _stop_event.set()

    with _current_solver_lock:
        active_s = _current_solver
        if active_s is not None:
            try:
                if hasattr(active_s, "stop_search"):
                    active_s.stop_search()
                elif hasattr(active_s, "StopSearch"):
                    active_s.StopSearch()
            except Exception as e:
                safe_print(f"[solver] stop_search istisnası: {e}")

    if is_active:
        if sols > 0:
            add_live_feed(
                f"⏹️ Kullanıcı motoru sonlandırdı. Şimdiye kadarki en iyi çözüm (#{sols}, {gaps if gaps is not None else 'geçerli'} saat pencere) mühürleniyor...",
                "warn"
            )
            update_live_progress(
                stageTitle="Motor Sonlandırılıyor: En İyi Çözüm Mühürleniyor...",
                stageDesc="Kullanıcı isteğiyle arama durduruldu; son geçerli ders programı alınıyor."
            )
        else:
            add_live_feed(
                "⏹️ Kullanıcı arama sürecini ilk geçerli çözüm bulunmadan önce iptal etti.",
                "warn"
            )
            update_live_progress(
                stageTitle="Arama İptal Edildi",
                stageDesc="Kullanıcı isteğiyle arama durduruldu."
            )
        return True
    return False


def update_live_progress(**kwargs):
    with _progress_lock:
        if "startTime" in _live_progress:
            _live_progress["elapsedSeconds"] = round(time.time() - _live_progress["startTime"], 1)
        _live_progress.update(kwargs)


def add_live_feed(text, msg_type="info"):
    with _progress_lock:
        elapsed = round(time.time() - _live_progress.get("startTime", time.time()), 1)
        _live_progress["elapsedSeconds"] = elapsed
        feed = list(_live_progress.get("feed", []))
        feed.append({"time": f"{elapsed:.1f}s", "type": msg_type, "text": text})
        _live_progress["feed"] = feed[-25:]


def get_live_progress():
    with _progress_lock:
        if _live_progress.get("active") and "startTime" in _live_progress:
            _live_progress["elapsedSeconds"] = round(time.time() - _live_progress["startTime"], 1)
        out = dict(_live_progress)
        out.pop("startTime", None)
        return out



def get_val(obj, key, default):
    """Hem Pydantic nesnelerinden hem de sözlüklerden (dict) güvenle veri okur."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        val = obj.get(key)
        return val if val is not None else default
    val = getattr(obj, key, None)
    return val if val is not None else default


def is_stem(subject):
    """Türkçe harfleri doğru işleyerek yalnızca gerçek fen/matematik derslerini tanır. Hafızlık vb. dersleri korur."""
    if not subject:
        return False
    s = (subject or "").replace("İ", "i").replace("I", "i").replace("ı", "i").lower()
    words = re.findall(r"[a-z0-9çğıöşü]+", s)
    for w in words:
        if any(ex in w for ex in ("hafiz", "format", "otomasyon", "matbaa")):
            continue
        for pat in STEM_PATTERNS:
            if re.match(pat, w):
                return True
    return False


def pin_field(pin, key):
    """Kilitli hücre alanını hem Pydantic nesnesinden hem dict'ten okur (0 değerlerini de korur)."""
    if isinstance(pin, dict):
        return pin.get(key)
    return getattr(pin, key, None)


# --------------------------------------------------------------------------
# Hazırlık
# --------------------------------------------------------------------------
def read_options(request):
    sc = getattr(request, "softConstraints", None)
    hc = getattr(request, "hardConstraints", None)
    
    max_total_level = get_val(hc, "maxTotalGapsLevel", None) or get_val(sc, "maxTotalGapsLevel", None) or get_val(hc, "maxGapsLevel", "medium")
    max_total_penalty = int(get_val(hc, "maxTotalGapsPenalty", None) or get_val(sc, "maxTotalGapsPenalty", None) or get_val(hc, "maxGapsPenalty", 60))
    max_total_gaps = int(get_val(hc, "maxTotalGaps", None) or (int(get_val(hc, "maxGapsPerDay", 2)) * 2 if get_val(hc, "maxGapsPerDay", None) is not None else 4))
    enforce_max_total_gaps = bool(get_val(hc, "enforceMaxTotalGaps", True)) and max_total_level != "off"
    
    min_total_gaps = int(get_val(hc, "minTotalGaps", None) or get_val(hc, "minGapsPerDay", 0))
    min_total_level = get_val(hc, "minTotalGapsLevel", None) or get_val(sc, "minTotalGapsLevel", None) or get_val(hc, "minGapsLevel", "off")
    min_total_penalty = int(get_val(hc, "minTotalGapsPenalty", None) or get_val(sc, "minTotalGapsPenalty", None) or get_val(hc, "minGapsPenalty", 60))
    enforce_min_total_gaps = min_total_level != "off" and min_total_gaps > 0
    gap_exempt_ids = set(get_val(hc, "gapExemptTeacherIds", None) or get_val(sc, "gapExemptTeacherIds", None) or [])

    min_hourly_reserve = int(get_val(hc, "minHourlyReserveTeachers", 1) or 0)
    hourly_reserve_level = get_val(hc, "hourlyReserveLevel", None) or get_val(sc, "hourlyReserveLevel", "off")
    hourly_reserve_penalty = int(get_val(hc, "hourlyReservePenalty", None) or get_val(sc, "hourlyReservePenalty", 60))
    enforce_hourly_reserve = bool(get_val(hc, "enforceHourlyReserve", False)) and hourly_reserve_level != "off" and min_hourly_reserve > 0
    enforce_categorical_fairness = bool(get_val(hc, "enforceCategoricalFairness", True))

    min_active_days = int(get_val(hc, "minActiveDays", 4) or 0)
    min_active_days_level = get_val(hc, "minActiveDaysLevel", None) or get_val(sc, "minActiveDaysLevel", "high")
    min_active_days_penalty = int(get_val(hc, "minActiveDaysPenalty", None) or get_val(sc, "minActiveDaysPenalty", 100))
    enforce_min_active_days = bool(get_val(hc, "enforceMinActiveDays", True)) and min_active_days_level != "off" and min_active_days > 0
    min_days_exempt_ids = set(get_val(hc, "minDaysExemptTeacherIds", None) or get_val(sc, "minDaysExemptTeacherIds", None) or [])

    o = {
        "enforce_max_total_gaps": enforce_max_total_gaps,
        "max_total_gaps": max_total_gaps,
        "max_total_gaps_level": max_total_level,
        "max_total_gaps_penalty": max_total_penalty,
        "enforce_min_total_gaps": enforce_min_total_gaps,
        "min_total_gaps": min_total_gaps,
        "min_total_gaps_level": min_total_level,
        "min_total_gaps_penalty": min_total_penalty,
        "gap_exempt_ids": gap_exempt_ids,
        "enforce_hourly_reserve": enforce_hourly_reserve,
        "min_hourly_reserve": min_hourly_reserve,
        "hourly_reserve_level": hourly_reserve_level,
        "hourly_reserve_penalty": hourly_reserve_penalty,
        "enforce_categorical_fairness": enforce_categorical_fairness,
        "enforce_min_active_days": enforce_min_active_days,
        "min_active_days": min_active_days,
        "min_active_days_level": min_active_days_level,
        "min_active_days_penalty": min_active_days_penalty,
        "min_days_exempt_ids": min_days_exempt_ids,
        "enforce_daily_balance": bool(get_val(hc, "enforceDailyBalance", True)),
        "min_daily_hours": int(get_val(hc, "minDailyHours", 3)),
        "enforce_consecutive": bool(get_val(hc, "enforceConsecutiveClassRules", True)),
        "enforce_intensive": bool(get_val(hc, "enforceIntensiveRules", True)),
        "max_intensive_hours": int(get_val(hc, "maxHoursPerIntensiveCourse", 4)),
        "timeout": float(get_val(hc, "solverTimeout", 60.0)),
        "stop_at_first": bool(get_val(hc, "stopAtFirstSolution", False) or float(get_val(hc, "solverTimeout", 60.0)) <= 0),
        "minimize_gaps": bool(get_val(sc, "minimizeGaps", True)),
        "gap_penalty": int(get_val(sc, "gapPenalty", 40)),
        "early_start": bool(get_val(sc, "earlyStart", True)),
        "early_start_penalty": int(get_val(sc, "earlyStartPenalty", 20)),
        "avoid_stem_late": bool(get_val(sc, "avoidStemLate", True)),
        "stem_late_penalty": int(get_val(sc, "stemLatePenalty", 35)),
    }
    return o


def build_activities(classrooms):
    """
    Her ders pedagojik bloklara bölünür:
    - 2 saat: 2 saatlik blok (1-1 bölünmez, blok korunur).
    - 3 saat: 2 + 1 saat.
    - 4 saat: 2 + 2 saat.
    - 5 saat: 2 + 2 + 1 saat.
    - 6 saat: 2 + 2 + 2 saat.
    - Tek kalan 1 saatlik dersler tek saat olarak atanır.
    """
    activities, act_id = [], 0
    for c in classrooms:
        for course in c.courses:
            rem = int(course.hoursPerWeek)
            course_key = getattr(course, "id", None) or f"{course.subject}_{course.teacherId}"
            while rem > 0:
                dur = 2 if rem >= 2 else 1
                activities.append({"id": act_id, "class_id": c.id, "class_name": c.name,
                                   "subject": course.subject, "course_key": course_key,
                                   "teacher_id": course.teacherId, "duration": dur})
                act_id += 1
                rem -= dur
    return activities


def teacher_profiles(teachers, activities, days, P, o):
    """Öğretmen başına haftalık yük, kapalı saatler, sınırlar ve muafiyet bilgisi."""
    profiles, notes = {}, []
    for t in teachers:
        weekly = sum(a["duration"] for a in activities if a["teacher_id"] == t.id)
        unavailable = getattr(t, "unavailable", None) or {}
        closed, open_cnt = {}, {}
        for d in days:
            raw = unavailable.get(d, []) if isinstance(unavailable, dict) else []
            closed[d] = {p for p in raw if 1 <= p <= P}
            open_cnt[d] = P - len(closed[d])

        open_days = [d for d in days if open_cnt[d] > 0]
        num_avail_days = len(open_days)

        # 🌟 İSTİSNA ÖĞRETMENLER: Okula 1-2 gün gelip <17 saat dersi olanlar, isExempt=True olanlar veya <=8 saati olanlar
        explicit_exempt = bool(get_val(t, "isExempt", False))
        is_part_time = (num_avail_days <= 2 and weekly < 17 and weekly > 0) or (explicit_exempt and weekly < 17)
        is_admin = bool(get_val(t, "isAdministrator", False))
        exempt = explicit_exempt or weekly <= 8 or is_part_time or is_admin

        # Öncelikli tam doldurulacak günler (1, 2 veya daha fazla gün) ve son saatler tercihi
        raw_p_days = get_val(t, "priorityFullDays", None)
        raw_p_day = get_val(t, "priorityFullDay", None)
        p_days_candidates = []
        if isinstance(raw_p_days, (list, tuple, set)):
            p_days_candidates.extend(str(x).strip() for x in raw_p_days if x)
        if isinstance(raw_p_day, (list, tuple, set)):
            p_days_candidates.extend(str(x).strip() for x in raw_p_day if x)
        elif isinstance(raw_p_day, str) and raw_p_day.strip():
            for part in raw_p_day.split(","):
                if part.strip():
                    p_days_candidates.append(part.strip())
        priority_full_days = []
        for pd in p_days_candidates:
            if pd in days and pd not in priority_full_days:
                priority_full_days.append(pd)
        priority_full_day = priority_full_days[0] if priority_full_days else None
        fill_late_hours = bool(get_val(t, "fillLateHours", False))

        # 🌊 ESNEK / KAYAN TERCİHLER ("Boş günüm ya da saatim fark etmez" diyen öğretmenler)
        floating = get_val(t, "floatingConstraints", {}) or {}
        free_day_pref = floating.get("freeDayPreference", "none") if isinstance(floating, dict) else "none"
        free_half_pref = floating.get("freeHalfDayPreference", "none") if isinstance(floating, dict) else "none"

        hard_cap = int(get_val(t, "maxPerDay", P))
        hard_cap = max(1, min(hard_cap, P))

        # Yüksek ders yükü (örn: 30+ saat) durumunda hard_cap okulun günlük periyodu P'ye kadar otomatik esnetilir
        while hard_cap < P and sum(min(open_cnt[d], hard_cap) for d in days) < weekly:
            hard_cap += 1

        rule_cap = hard_cap
        open_slots = sum(open_cnt[d] for d in days)
        free_slots = max(0, open_slots - weekly)

        if free_slots <= 2:
            cat_id = "cat1_tight"
            cat_label = "1. Dar Marj (0-2 Boş Slot)"
            cat_min_gaps, cat_max_gaps = 0, min(1, free_slots)
        elif weekly < 25 and 3 <= free_slots <= 5:
            cat_id = "cat2_limited"
            cat_label = "2. Sınırlı Marj (3-5 Boş Slot)"
            cat_min_gaps, cat_max_gaps = 1, 2
        elif weekly >= 25 and 3 <= free_slots <= 5:
            cat_id = "cat3a_heavy_lim"
            cat_label = "3A. Ağır Yük & Sınırlı Marj (25+ Ders, 3-5 Boş)"
            cat_min_gaps, cat_max_gaps = 1, 2
        elif weekly >= 25 and free_slots >= 6:
            cat_id = "cat3b_heavy_wide"
            cat_label = "3B. Ağır Yük & Geniş Marj (25+ Ders, 6+ Boş)"
            cat_min_gaps, cat_max_gaps = 1, 3
        else:
            cat_id = "cat4_wide"
            cat_label = "4. Geniş Marj / İyi Niyet Korumalı (6+ Boş Slot)"
            cat_min_gaps, cat_max_gaps = 1, 3

        # 🌟 Asgari Pencere Kuralı ile Kategorik Üst Sınır Uyumu:
        # Eğer kullanıcı "En az X saat boşluk ver" dediyse ve öğretmenin kapasitesi yetiyorsa,
        # kategorik adalet üst sınırı bu asgari değerin altına düşemez (kural çelişkisi önlenir).
        if o.get("enforce_min_total_gaps") and o.get("min_total_gaps", 0) > 0:
            req_min = o.get("min_total_gaps", 0)
            if free_slots >= req_min:
                cat_max_gaps = max(cat_max_gaps, req_min)

        profiles[t.id] = {
            "weekly": weekly, "exempt": exempt, "closed": closed,
            "hard_cap": hard_cap, "rule_cap": rule_cap,
            "is_part_time": is_part_time,
            "is_admin": is_admin,
            "num_avail_days": num_avail_days,
            "open_days": open_days,
            "open_slots": open_slots,
            "free_slots": free_slots,
            "cat_id": cat_id,
            "cat_label": cat_label,
            "cat_min_gaps": cat_min_gaps,
            "cat_max_gaps": cat_max_gaps,
            "priority_full_day": priority_full_day,
            "priority_full_days": priority_full_days,
            "fill_late_hours": fill_late_hours,
            "free_day_pref": free_day_pref,
            "free_half_pref": free_half_pref,
        }
    return profiles, notes


def detect_workers():
    """
    CP-SAT işçi sayısı:
    - Yerel geliştirme ortamında (Mac/PC): Bilgisayarın TÜM CPU çekirdekleri (os.cpu_count) tam güçle kullanılır (asla kısıtlanmaz).
    - Render / Bulut ortamında (RENDER=true): 0.1 vCPU paylaşımlı bulut çekirdeğinde thread çekişmesini (context-switch darboğazını)
      önlemek ve %100 CPU gücünü tek SAT arama ağacına odaklamak için 1 işçi kullanılır.
    """
    is_render = os.environ.get("RENDER") == "true" or os.environ.get("RENDER_SERVICE_ID") is not None

    # Render Bulut Ortamı (0.1 vCPU): Çoklu thread 0.1 vCPU'yu böldüğü için tek işçi 5x daha hızlıdır
    if is_render:
        return 1

    env = os.environ.get("SOLVER_WORKERS")
    if env:
        try:
            return max(1, int(env))
        except ValueError:
            pass

    # Yerel ortam: Tüm fiziksel ve sanal çekirdekler tam güçte çalışsın (kısıtlama yok)
    try:
        return max(1, os.cpu_count() or 8)
    except Exception:
        return 8


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------
def build_model(use_consecutive, activities, classrooms, teachers, days, P, profiles, o, pinned_slots=None, allow_soft_floating=False, lunch_after=None, allow_soft_consecutive=False, allow_soft_gaps=False):
    """
    Tek model kurar. Dönüş: (model, x, terms, warnings, busy_by_teacher)
      x[a_id, gün, saat]  : aktivitenin o gün o saatte BAŞLAMASI
      terms[kademe]       : ilgili kademenin amaç terimleri (rules / gaps / prefs / consec_slacks)
    """
    model = cp_model.CpModel()
    num_days = len(days)
    terms = {"rules": [], "gaps": [], "prefs": [], "consec_slacks": [], "min_gap_slacks": [], "reserve_slacks": []}
    warnings = []
    busy_by_teacher = {}

    # ---- Yerleşim değişkenleri (kapalı saatlere denk gelen başlangıçlar hiç oluşturulmaz)
    x, opts = {}, {}
    for a in activities:
        prof = profiles.get(a["teacher_id"])
        closed = prof["closed"] if prof else None
        lst = []
        for d in days:
            for p in range(1, P - a["duration"] + 2):
                if closed and any((p + k) in closed[d] for k in range(a["duration"])):
                    continue
                x[a["id"], d, p] = model.NewBoolVar(f"x_{a['id']}_{d}_{p}")
                lst.append((d, p))
        opts[a["id"]] = lst
        model.AddExactlyOne([x[a["id"], d, p] for d, p in lst])

    def starts_on(a, d):
        return [x[a["id"], d, p] for dd, p in opts[a["id"]] if dd == d]

    def cover(acts, d, p):
        out = []
        for a in acts:
            if (a["id"], d, p) in x:
                out.append(x[a["id"], d, p])
            if a["duration"] == 2 and p > 1 and (a["id"], d, p - 1) in x:
                out.append(x[a["id"], d, p - 1])
        return out

    by_class, by_teacher, by_pair = {}, {}, {}
    for a in activities:
        by_class.setdefault(a["class_id"], []).append(a)
        if a["teacher_id"]:
            by_teacher.setdefault(a["teacher_id"], []).append(a)
            by_pair.setdefault((a["teacher_id"], a["class_id"]), []).append(a)

    # ---- Sınıf çakışması (tam dolu sınıfta her hücre TAM OLARAK bir ders: çok daha güçlü yayılım)
    for c in classrooms:
        c_acts = by_class.get(c.id, [])
        full_class = sum(a["duration"] for a in c_acts) == num_days * P
        for d in days:
            for p in range(1, P + 1):
                cov = cover(c_acts, d, p)
                if full_class:
                    model.AddExactlyOne(cov)
                elif len(cov) > 1:
                    model.AddAtMostOne(cov)

    # ---- Simetri kırma: aynı sınıftaki aynı dersin özdeş blokları sabit sırayla yerleşir
    groups = {}
    for a in activities:
        groups.setdefault((a["class_id"], a["course_key"], a["duration"]), []).append(a)
    for g_acts in groups.values():
        if len(g_acts) < 2:
            continue
        slot_expr = [sum(((days.index(d)) * P + p) * x[a["id"], d, p] for d, p in opts[a["id"]])
                     for a in g_acts]
        for k in range(len(slot_expr) - 1):
            model.Add(slot_expr[k] + 1 <= slot_expr[k + 1])

    # ---- Kilitli hücreler (pinnedSlots) -------------------------------------
    # Single‑hour pins (legacy) are kept unchanged.  Pins that contain a `groupId`
    # represent a 2‑hour block and must appear as a pair (period p and p+1) on the
    # same day and class.  The solver forces a 2‑hour activity (duration == 2) to
    # start at the first period of the pair.
    pins_by_group: dict[str, list[dict]] = {}
    for pin in (pinned_slots or []):
        gid = pin_field(pin, "groupId")
        if gid:
            pins_by_group.setdefault(gid, []).append({
                "classId": pin_field(pin, "classId"),
                "day": pin_field(pin, "day"),
                "period": int(pin_field(pin, "period") or 0),
                "subject": pin_field(pin, "subject") or "",
                "teacherId": pin_field(pin, "teacherId"),
            })
            continue
        # ---- legacy single‑hour pin ------------------------------------------
        c_id, d = pin_field(pin, "classId"), pin_field(pin, "day")
        p, sub, t_id = int(pin_field(pin, "period") or 0), pin_field(pin, "subject") or "", pin_field(pin, "teacherId")
        matching = [a for a in by_class.get(c_id, [])
                    if a["subject"].strip().lower() == sub.strip().lower()
                    and (not t_id or a["teacher_id"] == t_id)]
        cov = cover(matching, d, p)
        if cov:
            model.Add(sum(cov) == 1)
        else:
            warnings.append(f"Kilitli hücre eşleşmedi ve yok sayıldı: {sub} ({d} {p}. saat).")

    # ---- 2‑hour block pins -------------------------------------------------
    for gid, pins in pins_by_group.items():
        if len(pins) != 2:
            warnings.append(f"Kilit grubu {gid} hatalı: beklenen 2 hücre, bulundu {len(pins)}.")
            continue
        # ensure same class, day and adjacent periods
        pins_sorted = sorted(pins, key=lambda x: x["period"])
        p1, p2 = pins_sorted[0]["period"], pins_sorted[1]["period"]
        if p2 != p1 + 1 or pins_sorted[0]["day"] != pins_sorted[1]["day"] or pins_sorted[0]["classId"] != pins_sorted[1]["classId"]:
            warnings.append(f"Kilit grubu {gid} ardışık değil veya aynı sınıf/gün içinde değil.")
            continue
        c_id = pins_sorted[0]["classId"]
        d = pins_sorted[0]["day"]
        sub = pins_sorted[0]["subject"]
        t_id = pins_sorted[0]["teacherId"]
        # find a 2‑hour activity that matches the subject (and teacher if given)
        matching = [a for a in by_class.get(c_id, [])
                    if a["subject"].strip().lower() == sub.strip().lower()
                    and (not t_id or a["teacher_id"] == t_id)
                    and a["duration"] == 2]
        if not matching:
            warnings.append(f"Kilit grubu {gid} için 2‑saatlik aktivite bulunamadı: {sub} ({d}).")
            continue
        # force exactly one 2-hour activity to start at the first period of the block
        valid_vars = [x[a["id"], d, p1] for a in matching if (d, p1) in opts[a["id"]]]
        if valid_vars:
            model.Add(sum(valid_vars) == 1)
        else:
            warnings.append(f"Kilit grubu {gid} için (gün: {d}, saat: {p1}) başlangıç seçeneği mevcut değil.")

    # ---- C kademesi: fen/matematik derslerinin son iki saate kalmaması
    if o["avoid_stem_late"]:
        late_from = max(2, P - 1)
        for a in activities:
            if is_stem(a["subject"]):
                for d, p in opts[a["id"]]:
                    if p + a["duration"] - 1 >= late_from:
                        terms["prefs"].append(o["stem_late_penalty"] * x[a["id"], d, p])

    # ---- Öğretmen kuralları
    hourly_reserve_exprs = {(d, p): [] for d in days for p in range(2, P)}
    for t in teachers:
        t_acts = by_teacher.get(t.id, [])
        if not t_acts:
            continue
        prof = profiles[t.id]
        soft_rules = not prof["exempt"]
        is_gap_exempt = (t.id in o.get("gap_exempt_ids", set()))
        eligible_for_reserve = (
            not prof.get("is_admin", False)
            and not prof["exempt"]
            and not prof.get("is_part_time", False)
            and not is_gap_exempt
            and prof["weekly"] > 0
        )
        need_gaps = (
            prof["is_part_time"]
            or o["minimize_gaps"]
            or (soft_rules and (o["enforce_max_total_gaps"] or o["enforce_min_total_gaps"]))
            or (o.get("enforce_hourly_reserve", False) and eligible_for_reserve)
        )
        t_day_gap_exprs = []

        has_by_day, hours_by_day = {}, {}
        busy_cells = {}
        busy_by_teacher[t.id] = {}
        for d in days:
            busy = {}
            day_p_vars = []
            for p in range(1, P + 1):
                cov = cover(t_acts, d, p)
                if not cov:
                    busy[p] = 0
                elif len(cov) == 1:
                    busy[p] = cov[0]
                    day_p_vars.append((p, busy[p]))
                else:
                    b = model.NewBoolVar(f"b_{t.id}_{d}_{p}")
                    model.Add(sum(cov) == b)  # aynı saatte en fazla bir ders
                    busy[p] = b
                    day_p_vars.append((p, b))
                busy_cells[d, p] = busy[p]
            busy_by_teacher[t.id][d] = day_p_vars
            lits = [busy[p] for p in range(1, P + 1) if not isinstance(busy[p], int)]
            if not lits:
                has_by_day[d], hours_by_day[d] = 0, 0
                continue

            hours = sum(lits)
            model.Add(hours <= prof["hard_cap"])  # günlük mutlak üst sınır
            h = model.NewBoolVar(f"has_{t.id}_{d}")
            for lit in lits:
                model.AddImplication(lit, h)
            has_by_day[d], hours_by_day[d] = h, hours

            # KURAL: öğretmene günde 1 saat ders verilmez (0 ya da en az 2)
            model.Add(hours >= (2 if prof["weekly"] >= 2 else 1)).OnlyEnforceIf(h)

            # 📌 ÖNCELİKLİ TAM DOLDURULACAK GÜN & SON SAATLER (Çoklu Gün Destekli)
            if d in prof.get("priority_full_days", ()):
                # Seçilen günlerde olabildiğince çok ders koyulması için güçlü negatif ceza (maksimize et)
                terms["rules"].append(-50 * hours)
                if prof.get("fill_late_hours") and P >= 2:
                    # Son saatler (P ve P-1) dolu olsun
                    for lp, w in [(P, 80), (P - 1, 50)]:
                        if lp not in prof["closed"].get(d, set()) and not isinstance(busy[lp], int):
                            terms["prefs"].append(-w * busy[lp])

            # Boşluk: s[p]=p'ye kadar ders başladı, e[p]=p ve sonrasında ders var.
            # Ders günü için Σs = P-ilk+1, Σe = son  ⇒  boşluk = Σs + Σe − P·h − saat (ek değişkensiz)
            if need_gaps and P >= 3:
                s, e = {1: busy[1]}, {P: busy[P]}
                for p in range(2, P + 1):
                    sv = model.NewBoolVar(f"s_{t.id}_{d}_{p}")
                    model.Add(sv >= s[p - 1])
                    model.Add(sv >= busy[p])
                    model.Add(sv <= s[p - 1] + busy[p])
                    model.AddImplication(sv, h)
                    s[p] = sv
                for p in range(P - 1, 0, -1):
                    ev = model.NewBoolVar(f"e_{t.id}_{d}_{p}")
                    model.Add(ev >= e[p + 1])
                    model.Add(ev >= busy[p])
                    model.Add(ev <= e[p + 1] + busy[p])
                    model.AddImplication(ev, h)
                    e[p] = ev
                day_gaps = sum(s.values()) + sum(e.values()) - P * h - hours
                t_day_gap_exprs.append(day_gaps)

                # 🛡️ Saatlik Yedek / Nöbetçi Öğretmen Güvencesi (İlk ve son saat hariç tüm ara saatler: 2 .. P-1)
                # in_gap[t, d, p] = s[p] + e[p] - h - busy[p]  ∈ {0, 1}
                # Yalnızca öğretmenin o gün ilk dersi başlamışsa (s[p]=1), son dersi henüz bitmemişse (e[p]=1)
                # ve tam p. saatte dersi boşsa (busy[p]=0) 1 değerini alır.
                if o.get("enforce_hourly_reserve", False) and eligible_for_reserve:
                    for p in range(2, P):
                        hourly_reserve_exprs[d, p].append(s[p] + e[p] - h - busy[p])

                if prof["is_part_time"]:
                    terms["rules"].append(4 * day_gaps)  # 1-2 gün gelenler penceresiz olmalı
                elif o["minimize_gaps"]:
                    # 📈 Kademeli & Konveks Pencere Cezası:
                    # Eğer asgari pencere kuralı (müdürün haftalık 3-4 saat proje/dinlenme hedefi) aktifse,
                    # meşru boşlukları cezalandırmamak için gündeki ilk boşluk cezasız tutulur.
                    # Yalnızca aynı gündeki 2 ve üzeri aşırı boşluklar kademeli cezalandırılarak boşlukların günlere adil yayılması sağlanır.
                    if o["enforce_min_total_gaps"] and o["min_total_gaps"] > 0:
                        extra1 = model.NewIntVar(0, P, f"gx1_{t.id}_{d}")
                        model.Add(extra1 >= day_gaps - 1)
                        terms["gaps"].append(2 * extra1)

                        extra2 = model.NewIntVar(0, P, f"gx2_{t.id}_{d}")
                        model.Add(extra2 >= day_gaps - 2)
                        terms["gaps"].append(4 * extra2)
                    else:
                        terms["gaps"].append(day_gaps)
                        extra1 = model.NewIntVar(0, P, f"gx1_{t.id}_{d}")
                        model.Add(extra1 >= day_gaps - 1)
                        terms["gaps"].append(2 * extra1)

                        extra2 = model.NewIntVar(0, P, f"gx2_{t.id}_{d}")
                        model.Add(extra2 >= day_gaps - 2)
                        terms["gaps"].append(4 * extra2)

            if o["early_start"] and soft_rules:
                open_slots = [p for p in range(1, P + 1) if p not in prof["closed"][d]]
                if open_slots:
                    late = model.NewBoolVar(f"late_{t.id}_{d}")
                    model.Add(late >= h - busy[min(open_slots)])
                    terms["prefs"].append(o["early_start_penalty"] * late)

            # ⚖️ GÜNLÜK ASGARİ DERS SAATİ: Sadece aktif gündeki minimum ders saati kuralı!
            # Max saat sınırı veya aktif günler arası fark KALDIRILDI (algoritmayı rahatlatmak için).
            if soft_rules and o["enforce_daily_balance"] and prof["weekly"] > 0:
                adaptive_min = min(o["min_daily_hours"], prof["weekly"])
                short = model.NewIntVar(0, adaptive_min, f"short_{t.id}_{d}")
                model.Add(short >= adaptive_min * h - hours)
                terms["rules"].append(short)

        # 📌 Öğretmen Haftalık Toplam Pencere (Boşluk) Kuralları
        if t_day_gap_exprs and soft_rules:
            week_gaps = sum(t_day_gap_exprs)
            is_gap_exempt = (t.id in o.get("gap_exempt_ids", set()))

            # A) Haftalık Toplam Maksimum Pencere Sınırı
            if o["enforce_max_total_gaps"]:
                max_tot = o["max_total_gaps"]
                if is_gap_exempt:
                    # Kullanıcı tanımlı istisna (süt izni, idareci vb.): sert kısıt uygulanmaz, hafif esnek ceza
                    gx_tot = model.NewIntVar(0, num_days * P, f"gex_tot_{t.id}")
                    model.Add(gx_tot >= week_gaps - max_tot)
                    terms["rules"].append(2 * gx_tot)
                elif o["max_total_gaps_level"] == "high" and not allow_soft_gaps:
                    model.Add(week_gaps <= max_tot)
                else:
                    gx_tot = model.NewIntVar(0, num_days * P, f"gex_tot_{t.id}")
                    model.Add(gx_tot >= week_gaps - max_tot)
                    p_tot_coef = 100 if o["max_total_gaps_level"] == "high" else max(1, o.get("max_total_gaps_penalty", 60) // 10)
                    if o.get("enforce_hourly_reserve", False) and o.get("enforce_categorical_fairness", True) and eligible_for_reserve:
                        p_tot_coef = max(p_tot_coef, 120)
                    terms["rules"].append(p_tot_coef * gx_tot)

            # B) Haftalık Toplam Asgari (Minimum) Pencere Sınırı (Dinlenme / Nöbet / Proje Güvencesi)
            if o["enforce_min_total_gaps"] and o["min_total_gaps"] > 0 and prof["weekly"] >= 10:
                min_tot = o["min_total_gaps"]
                # 🎯 Dinamik Kapasite Analizi:
                # Okulda açık saatler ile haftalık ders yükü arasındaki fark öğretmenin azami boşluk kapasitesidir.
                t_open_slots = sum(P - len(prof["closed"].get(d, set())) for d in days)
                t_free_capacity = max(0, t_open_slots - prof["weekly"])

                if is_gap_exempt:
                    # Kullanıcı tanımlı istisna (süt izni vb.): asgari boşluk zorunluluğu aranmaz!
                    pass
                elif t_free_capacity >= min_tot:
                    # Yeterli boşluğu olan öğretmen: Asgari pencere değişkeni (Aşama 1.5'te tavizsiz kilitlenir)
                    gmin_tot = model.NewIntVar(0, min_tot, f"gmin_tot_{t.id}")
                    model.Add(gmin_tot >= min_tot - week_gaps)
                    p_min_coef = 100 if o["min_total_gaps_level"] == "high" else max(1, o.get("min_total_gaps_penalty", 60) // 10)
                    terms["rules"].append(p_min_coef * gmin_tot)
                    terms.setdefault("min_gap_slacks", []).append(gmin_tot)
                elif t_free_capacity > 0:
                    # Kapasitesi sınırlı öğretmen: Kullanıcının belirttiği gibi makul esneme (taviz verilmesi makuldür)
                    # Fiziksel olarak alabileceği azami boşluğu (t_free_capacity) teşvik et
                    eff_min = t_free_capacity
                    gmin_tot = model.NewIntVar(0, eff_min, f"gmin_cap_{t.id}")
                    model.Add(gmin_tot >= eff_min - week_gaps)
                    terms["rules"].append(2 * gmin_tot)
                    terms.setdefault("min_gap_slacks", []).append(gmin_tot)
                # t_free_capacity == 0 ise: Tüm açık saatleri dersle dolu olan öğretmen (ör. 21 açık, 21 ders),
                # kilitlenmeyi önlemek için kuraldan otomatik muaf tutulur.

            # C) ⚖️ Kategorik Adil Pencere Dağılımı (Ders Yükü × Boş Slot Matrisi)
            if o.get("enforce_hourly_reserve", False) and o.get("enforce_categorical_fairness", True) and eligible_for_reserve:
                cat_min = prof.get("cat_min_gaps", 0)
                cat_max = prof.get("cat_max_gaps", 3)

                # 1. Kategorik Üst Sınır (Dar marj: 0-1s, Sınırlı marj: 1-2s, Geniş marj: 1-3s)
                cat_over = model.NewIntVar(0, num_days * P, f"cat_over_{t.id}")
                model.Add(cat_over >= week_gaps - cat_max)
                terms["rules"].append(80 * cat_over)

                # Geniş marjlı (cat_max=3) öğretmenlerde bile 2 saatin üzerindeki 3. pencereyi caydır (1-2 bandını teşvik et)
                if cat_max >= 3:
                    cat_over2 = model.NewIntVar(0, num_days * P, f"cat_over2_{t.id}")
                    model.Add(cat_over2 >= week_gaps - 2)
                    terms["gaps"].append(8 * cat_over2)

                # 2. Kategorik Alt Katkı (Boş slotu >= 3 olanlar 0 pencereyle sıyrılamaz, en az 1 saat yedek havuzuna katılır)
                if cat_min > 0:
                    cat_under = model.NewIntVar(0, cat_min, f"cat_under_{t.id}")
                    model.Add(cat_under >= cat_min - week_gaps)
                    terms["rules"].append(35 * cat_under)

        # 1-2 gün gelen istisna öğretmenler: asgari gün
        if prof["is_part_time"] and prof["weekly"] > 0:
            min_days_needed = max(1, math.ceil(prof["weekly"] / prof["hard_cap"]))
            extra_days = model.NewIntVar(0, num_days, f"edays_{t.id}")
            model.Add(extra_days >= sum(has_by_day[d] for d in days) - min_days_needed)
            terms["rules"].append(extra_days)

        # 📅 Haftalık Asgari Aktif Ders Günü Güvencesi (İstisna dışında 3 gün ve altında ders vermeme)
        is_min_days_exempt = (
            prof["exempt"]
            or prof.get("is_part_time", False)
            or (t.id in o.get("min_days_exempt_ids", set()))
            or prof.get("free_day_pref") == "floating_2_days"
        )
        eff_min_active_days = 0
        if o.get("enforce_min_active_days", True) and not is_min_days_exempt and prof["weekly"] > 0:
            max_possible_days = min(prof["num_avail_days"], max(1, prof["weekly"] // 2))
            eff_min_active_days = min(o["min_active_days"], max_possible_days)
            if eff_min_active_days > 0:
                active_days_expr = sum(has_by_day[d] for d in days)
                if o.get("min_active_days_level", "high") == "high" and not allow_soft_gaps:
                    model.Add(active_days_expr >= eff_min_active_days)
                else:
                    md_short = model.NewIntVar(0, eff_min_active_days, f"mdshort_{t.id}")
                    model.Add(md_short >= eff_min_active_days - active_days_expr)
                    p_md_coef = 120 if o.get("min_active_days_level") == "high" else max(1, int(o.get("min_active_days_penalty", 100)) // 10)
                    terms["rules"].append(p_md_coef * md_short)

        # Standart öğretmenler: boş gün teşviki (B kademesi)
        if soft_rules and prof["weekly"] > 0:
            min_days_std = min(num_days, max(1, math.ceil(prof["weekly"] / prof["rule_cap"])))
            if eff_min_active_days > 0:
                min_days_std = max(min_days_std, eff_min_active_days)
            if min_days_std < num_days:
                extra_std = model.NewIntVar(0, num_days, f"edays_std_{t.id}")
                model.Add(extra_std >= sum(has_by_day[d] for d in days) - min_days_std)
                terms["gaps"].append(FREE_DAY_W * extra_std)

        # 🌊 ESNEK / KAYAN TERCİHLER ("Boş günüm ya da saatim fark etmez" diyen öğretmenler)
        f_day = prof.get("free_day_pref", "none")
        if prof["weekly"] > 0:
            if f_day == "floating_1_day":
                target_days = max(1, num_days - 1)
                if not allow_soft_floating and prof["weekly"] <= target_days * prof["hard_cap"]:
                    # Sert Kısıt: Solver haftalık dersleri en fazla (num_days - 1) güne toplayıp 1 günü tamamen boş bırakır
                    model.Add(sum(has_by_day[d] for d in days) <= target_days)
                else:
                    # Yumuşak Kısıt / Ceza: Hedeflenen gün sayısının üzerindeki her gün için ceza
                    ex_f1 = model.NewIntVar(0, num_days, f"ex_f1_{t.id}")
                    model.Add(ex_f1 >= sum(has_by_day[d] for d in days) - target_days)
                    terms["rules"].append(150 * ex_f1)
            elif f_day == "floating_2_days":
                target_days = max(1, num_days - 2)
                if not allow_soft_floating and prof["weekly"] <= target_days * prof["hard_cap"]:
                    model.Add(sum(has_by_day[d] for d in days) <= target_days)
                else:
                    ex_f2 = model.NewIntVar(0, num_days, f"ex_f2_{t.id}")
                    model.Add(ex_f2 >= sum(has_by_day[d] for d in days) - target_days)
                    terms["rules"].append(150 * ex_f2)

        # ☀️ Kayan Yarım Gün Tercihleri (Öğleden sonra veya sabah boşluğu)
        f_half = prof.get("free_half_pref", "none")
        if prof["weekly"] > 0 and f_half in ("any_afternoon", "any_morning") and P >= 4:
            if f_half == "any_afternoon":
                aft_cutoff = lunch_after if (lunch_after and 1 <= lunch_after < P) else math.ceil(P / 2)
                aft_periods = [p for p in range(1, P + 1) if p > aft_cutoff]
                aft_free_vars = []
                for d in days:
                    aft_busy = [busy_cells[d, p] for p in aft_periods if (d, p) in busy_cells and not isinstance(busy_cells[d, p], int)]
                    if aft_busy:
                        af = model.NewBoolVar(f"af_{t.id}_{d}")
                        for b in aft_busy:
                            model.AddImplication(af, b.Not())
                        aft_free_vars.append(af)
                    else:
                        aft_free_vars.append(1)
                
                aft_sat = model.NewBoolVar(f"aft_sat_{t.id}")
                model.Add(sum(aft_free_vars) >= 1).OnlyEnforceIf(aft_sat)
                model.Add(sum(aft_free_vars) == 0).OnlyEnforceIf(aft_sat.Not())
                terms["rules"].append(120 * (1 - aft_sat))

            elif f_half == "any_morning":
                morn_cutoff = lunch_after if (lunch_after and 1 <= lunch_after < P) else math.floor(P / 2)
                morn_periods = [p for p in range(1, P + 1) if p <= morn_cutoff]
                morn_free_vars = []
                for d in days:
                    morn_busy = [busy_cells[d, p] for p in morn_periods if (d, p) in busy_cells and not isinstance(busy_cells[d, p], int)]
                    if morn_busy:
                        mf = model.NewBoolVar(f"mf_{t.id}_{d}")
                        for b in morn_busy:
                            model.AddImplication(mf, b.Not())
                        morn_free_vars.append(mf)
                    else:
                        morn_free_vars.append(1)
                
                morn_sat = model.NewBoolVar(f"morn_sat_{t.id}")
                model.Add(sum(morn_free_vars) >= 1).OnlyEnforceIf(morn_sat)
                model.Add(sum(morn_free_vars) == 0).OnlyEnforceIf(morn_sat.Not())
                terms["rules"].append(120 * (1 - morn_sat))

    # ---- 🛡️ Saatlik Yedek / Nöbetçi Öğretmen Güvencesi (İlk ve son saat hariç tüm ara saatler: 2 .. P-1)
    if o.get("enforce_hourly_reserve", False) and P >= 3:
        target_res = max(1, int(o.get("min_hourly_reserve", 1)))
        for d in days:
            for p in range(2, P):
                exprs = hourly_reserve_exprs.get((d, p), [])
                if not exprs:
                    continue
                eff_res = min(target_res, len(exprs))
                if o.get("hourly_reserve_level") == "high" and not allow_soft_gaps:
                    model.Add(sum(exprs) >= eff_res)
                else:
                    hres_short = model.NewIntVar(0, eff_res, f"hres_short_{d}_{p}")
                    model.Add(sum(exprs) + hres_short >= eff_res)
                    p_res_coef = 120 if o.get("hourly_reserve_level") == "high" else max(1, int(o.get("hourly_reserve_penalty", 60)) // 10)
                    terms["rules"].append(p_res_coef * hres_short)
                    terms.setdefault("reserve_slacks", []).append(hres_short)

    # ---- Öğretmen-sınıf bitişiklik / günlük yoğunluk kuralı (FET Tarzı Lokal Esnetme Destekli)
    if use_consecutive:
        for (t_id, c_id), pair_acts in by_pair.items():
            if len(pair_acts) < 2:
                continue  # tek blok zaten bitişik ve ≤ 2 saat
            # 🌟 İstisna öğretmenler (1-2 gün gelen / <17 saat dersi olanlar): sert kısıtlardan (aynı sınıfa 3 saat girememe vb.) MUAFTIR!
            if profiles.get(t_id, {}).get("is_part_time", False):
                continue
            weekly = sum(a["duration"] for a in pair_acts)
            has_single = any(a["duration"] == 1 for a in pair_acts)
            max_day_pair = 2 if weekly <= 10 else 4
            for d in days:
                day_sum = sum(a["duration"] * v for a in pair_acts for v in starts_on(a, d))
                if not allow_soft_consecutive:
                    if weekly <= 10:
                        model.Add(day_sum <= 2)
                        if has_single:
                            # İki tek saat aynı güne düşerse bitişik olmalı: en fazla bir "başlangıç"
                            tc = {p: sum(cover(pair_acts, d, p)) for p in range(1, P + 1)}
                            starts = []
                            for p in range(1, P + 1):
                                st = model.NewBoolVar(f"pst_{t_id}_{c_id}_{d}_{p}")
                                model.Add(st >= tc[p] - (tc[p - 1] if p > 1 else 0))
                                starts.append(st)
                            model.Add(sum(starts) <= 1)
                    else:
                        model.Add(day_sum <= 4)
                else:
                    # 💡 DERS 1 (FET Yaklaşımı): Aşım ihtimali olan çiftlerde kısıt
                    if weekly > max_day_pair:
                        over_h = model.NewIntVar(0, P, f"consec_over_{t_id}_{c_id}_{d}")
                        model.Add(day_sum - max_day_pair <= over_h)
                        terms["rules"].append(200 * over_h)
                        terms["consec_slacks"].append(over_h)

                    # Blok bitişikliği: Aynı sınıfa aynı gün giren dersler bitişik blok olmalı (araya başka ders giremez!)
                    tc = {p: sum(cover(pair_acts, d, p)) for p in range(1, P + 1)}
                    starts = []
                    for p in range(1, P + 1):
                        st = model.NewBoolVar(f"pst_{t_id}_{c_id}_{d}_{p}")
                        model.Add(st >= tc[p] - (tc[p - 1] if p > 1 else 0))
                        starts.append(st)
                    split_s = model.NewIntVar(0, P, f"consec_split_{t_id}_{c_id}_{d}")
                    model.Add(sum(starts) - 1 <= split_s)
                    terms["rules"].append(500 * split_s)
                    terms["consec_slacks"].append(split_s)

    # ---- Aynı sınıfta aynı ders günde en fazla 1-2 kez başlar (istisna öğretmenler muaf)
    for c in classrooms:
        by_course = {}
        for a in by_class.get(c.id, []):
            by_course.setdefault(a["course_key"], []).append(a)
        for sub_acts in by_course.values():
            t_prof = profiles.get(sub_acts[0]["teacher_id"], {})
            if t_prof.get("is_part_time", False):
                continue  # İstisna öğretmenlerde aynı sınıfa aynı gün serbestçe girebilme esnekliği
            limit = 1 if len(sub_acts) <= num_days else 2
            if limit >= len(sub_acts):
                continue
            avail_days = max(1, t_prof.get("num_avail_days", num_days))
            for d in days:
                day_starts = sum(v for a in sub_acts for v in starts_on(a, d))
                # Yalnızca öğretmenin açık gün sayısı dersin blok sayısından azsa lokal esnet
                if not allow_soft_consecutive or len(sub_acts) <= avail_days:
                    model.Add(day_starts <= limit)
                else:
                    c_dup = model.NewIntVar(0, len(sub_acts), f"cdup_{c.id}_{sub_acts[0]['id']}_{d}")
                    model.Add(day_starts - limit <= c_dup)
                    terms["rules"].append(200 * c_dup)
                    terms["consec_slacks"].append(c_dup)

    # ---- Yoğun ders kuralı (haftalık > 6 saat olan ders günde en çok N saat)
    if o["enforce_intensive"]:
        for c in classrooms:
            for course in c.courses:
                if course.hoursPerWeek > 6:
                    c_key = getattr(course, "id", None) or f"{course.subject}_{course.teacherId}"
                    sub_acts = [a for a in by_class.get(c.id, []) if a["course_key"] == c_key]
                    for d in days:
                        model.Add(sum(a["duration"] * v for a in sub_acts for v in starts_on(a, d))
                                  <= o["max_intensive_hours"])

    # 🎯 ADIM 3: Değişken Karar Stratejisi (Branching Priorities)
    # 2 saatlik bloklar ve en kısıtlı öğretmenler arama ağacının en başında dallandırılır.
    # Not: Aynı öğretmenin blokları bir arada tutulur ve saatler ardışık (1..P) sırayla denenir ki
    # başlangıç çözümünde ve LNS dallanmalarında ekstra pencere (boşluk) oluşmasın.
    def activity_priority(act):
        t_id = act.get("teacher_id")
        prof = profiles.get(t_id, {})
        # 1. Blok boyutu: 2 saatlik bloklar önce yerleşmeli (+1000 puan)
        score = 1000 if act.get("duration") == 2 else 0
        if prof:
            num_open = prof.get("num_avail_days", num_days)
            weekly = prof.get("weekly", 0)
            if num_open > 0:
                score += int((weekly / num_open) * 50)
            if prof.get("is_part_time"):
                score += 300
            closed = prof.get("closed", {})
            if closed:
                score += sum(len(slots) for slots in closed.values()) * 10
        return score

    sorted_acts = sorted(activities, key=activity_priority, reverse=True)
    decision_vars = []
    for act in sorted_acts:
        a_id = act["id"]
        for d, p in opts.get(a_id, []):
            if (a_id, d, p) in x:
                decision_vars.append(x[a_id, d, p])

    if decision_vars:
        model.AddDecisionStrategy(
            decision_vars,
            cp_model.CHOOSE_FIRST,
            cp_model.SELECT_MAX_VALUE
        )

    return model, x, terms, warnings, busy_by_teacher


# --------------------------------------------------------------------------
# Çözücü çalıştırma
# --------------------------------------------------------------------------
class _Progress(cp_model.CpSolverSolutionCallback):
    """Son iyileşme zamanını izler ve canlı ilerleme (live telemetry) akışını günceller."""

    def __init__(self, busy_by_teacher=None, phase_label="Optimizasyon"):
        super().__init__()
        self.best = None
        self.last_improve = time.time()
        self.last_telemetry = 0.0
        self.solutions = 0
        self.busy_by_teacher = busy_by_teacher or {}
        self.phase_label = phase_label

    def _compute_live_gaps(self):
        if not self.busy_by_teacher:
            return None
        total_gaps = 0
        for day_map in self.busy_by_teacher.values():
            for p_vars in day_map.values():
                active_ps = [p for p, v in p_vars if self.Value(v) == 1]
                if len(active_ps) > 1:
                    total_gaps += (active_ps[-1] - active_ps[0] + 1) - len(active_ps)
        return total_gaps

    def OnSolutionCallback(self):
        if _stop_event.is_set():
            try:
                self.StopSearch()
            except Exception:
                pass
            return

        now = time.time()
        self.solutions += 1
        try:
            obj = self.ObjectiveValue()
            if self.best is None or obj < self.best - 1e-9:
                self.best = obj
                self.last_improve = now
        except Exception:
            pass

        # C++/Python callback kilidini ve paralel LNS işçilerini yavaşlatmamak için
        # canlı pencere hesabını en fazla 0.5 saniyede bir (veya ilk çözümde) çalıştır.
        if self.solutions > 1 and (now - self.last_telemetry) < 0.5:
            return
        self.last_telemetry = now

        try:
            live_gaps = self._compute_live_gaps()
            prev_state = get_live_progress()
            total_sols = prev_state.get("solutionsFound", 0) + 1
            init_gaps = prev_state.get("initialGaps")
            prev_gaps = prev_state.get("currentGaps")

            if init_gaps is None and live_gaps is not None:
                init_gaps = live_gaps

            update_live_progress(
                solutionsFound=total_sols,
                initialGaps=init_gaps,
                currentGaps=live_gaps if live_gaps is not None else prev_gaps,
            )

            if total_sols == 1:
                gap_txt = f" (Başlangıç pencere sayısı: {live_gaps} saat)" if live_gaps is not None else ""
                msg = f"✓ İlk geçerli çakışmasız çözüm bulundu!{gap_txt}"
                add_live_feed(msg, "success")
                safe_print(f"[solver-callback] {msg}")
            elif live_gaps is not None and prev_gaps is not None and live_gaps < prev_gaps:
                msg = f"⚡ Çözüm #{total_sols} ({self.phase_label}): Okul toplam penceresi {prev_gaps} ➔ {live_gaps} saat seviyesine düşürüldü."
                add_live_feed(msg, "improve")
                safe_print(f"[solver-callback] {msg}")
            elif total_sols <= 6 or total_sols % 3 == 0:
                gap_txt = f" (Toplam pencere: {live_gaps} saat)" if live_gaps is not None else ""
                msg = f"🔄 Çözüm #{total_sols} ({self.phase_label}): Kural ve tercih puanı iyileştirildi{gap_txt}."
                add_live_feed(msg, "info")
                safe_print(f"[solver-callback] {msg}")
        except Exception:
            pass

    # Hem Google OR-Tools C++ SWIG arayüzü (OnSolutionCallback) hem de Pythonic isim (on_solution_callback) desteği
    on_solution_callback = OnSolutionCallback


def run_solver(model, time_limit, workers, patience=None, busy_by_teacher=None, phase_label="Optimizasyon"):
    global _current_solver
    if _stop_event.is_set():
        return None, cp_model.UNKNOWN, None

    solver = cp_model.CpSolver()
    prm = solver.parameters
    prm.max_time_in_seconds = max(1.0, float(time_limit))
    prm.num_workers = max(1, workers)
    prm.log_search_progress = os.environ.get("SOLVER_LOG") == "1"

    # 🚀 CP-SAT Arama Parametreleri Optimizasyonu:
    # Temel yerleşim (feasibility/SAT) aşamalarında: linearization_level=0, probing=1, symmetry=1.
    # Bu sayede deterministik çözüm yükü 0.85s seviyesine iner ve 0.1 vCPU bulut ortamında bile hızla çözülür.
    # Yerel LNS / Çok amaçlı optimizasyon aşamasında ise standart LP seviyesi (linearization_level=1) kullanılır.
    is_render = os.environ.get("RENDER") == "true" or os.environ.get("RENDER_SERVICE_ID") is not None
    is_feasibility = any(tag in phase_label for tag in ("Temel", "Yerleşim", "Lokal"))
    if is_feasibility:
        prm.linearization_level = 0
        prm.cp_model_probing_level = 1
        prm.symmetry_level = 1
    else:
        prm.linearization_level = 0 if is_render else 1
        prm.cp_model_probing_level = 1
    cb = _Progress(busy_by_teacher=busy_by_teacher, phase_label=phase_label)
    done = threading.Event()

    with _current_solver_lock:
        _current_solver = solver

    def watch():
        while not done.wait(0.2):
            if _stop_event.is_set():
                try:
                    if hasattr(solver, "stop_search"):
                        solver.stop_search()
                    elif hasattr(solver, "StopSearch"):
                        solver.StopSearch()
                except Exception:
                    pass
                return
            if patience and cb.best is not None and time.time() - cb.last_improve > patience:
                try:
                    if hasattr(solver, "stop_search"):
                        solver.stop_search()
                    elif hasattr(solver, "StopSearch"):
                        solver.StopSearch()
                except Exception:
                    pass
                return

    threading.Thread(target=watch, daemon=True).start()
    try:
        status = solver.Solve(model, cb)
    finally:
        done.set()
        with _current_solver_lock:
            if _current_solver is solver:
                _current_solver = None
    return solver, status, cb


def hint_from(model, solver):
    """Önceki çözümdeki TÜM değişken değerlerini eksiksiz ipucu olarak verir."""
    model.ClearHints()
    n = len(model.Proto().variables)
    values = list(solver.ResponseProto().solution)
    if len(values) == n:
        hint = model.Proto().solution_hint
        hint.vars.extend(range(n))
        hint.values.extend(values)
    else:  # güvenli yedek
        for i in range(min(n, len(values))):
            v = model.GetIntVarFromProtoIndex(i)
            model.AddHint(v, solver.Value(v))


def ok(status):
    return status in (cp_model.OPTIMAL, cp_model.FEASIBLE)


# --------------------------------------------------------------------------
# Sonuç ve denetim
# --------------------------------------------------------------------------
def extract(solver, x, activities, classrooms, teachers, days, P):
    timetable = {c.id: {d: [] for d in days} for c in classrooms}
    busy = {t.id: {d: set() for d in days} for t in teachers}
    for (a_id, d, p), var in x.items():
        if solver.Value(var) == 1:
            a = activities[a_id] if a_id < len(activities) and activities[a_id]["id"] == a_id \
                else next((act for act in activities if act["id"] == a_id), None)
            if a is None:
                logger.warning(f"[extract] a_id={a_id} için aktivite bulunamadı, atlanıyor.")
                continue
            for off in range(a["duration"]):
                timetable[a["class_id"]][d].append(
                    {"period": p + off, "subject": a["subject"], "teacherId": a["teacher_id"]})
                if a["teacher_id"] in busy:
                    busy[a["teacher_id"]][d].add(p + off)
    for cid in timetable:
        for d in days:
            timetable[cid][d].sort(key=lambda it: it["period"])
    return timetable, busy


def unify_blocks_post_solve(timetable, busy, classrooms, teachers, profiles, days, P, o):
    """
    Dağıtım sonrası deterministik yerel birleştirme geçidi:
    1. Aynı sınıfta ve aynı günde ayrık kalmış ders bloklarını (araya başka ders girmişse) güvenli yerel takaslarla birleştirir.
    2. Tek saatlik parçaları (örn. 1+1 saat ayrılmış bloklar) mümkünse birleştirir.
    3. Hiçbir öğretmen çakışması, kapalı saat veya kural bozulmasına izin vermez.
    """
    if not o.get("enforce_consecutive", True):
        return timetable, busy

    improved = True
    iterations = 0

    while improved and iterations < 20:
        improved = False
        iterations += 1

        for c in classrooms:
            c_days = timetable.get(c.id, {})
            for d in days:
                slots = c_days.get(d, [])
                if len(slots) < 3:
                    continue

                slot_by_p = {s["period"]: s for s in slots}
                periods = sorted(slot_by_p.keys())

                # A) Aynı gün içindeki ayrık blokları birleştirme denemesi (Intra-day swap)
                for i in range(len(periods)):
                    p1 = periods[i]
                    s1 = slot_by_p[p1]
                    t1_id = s1.get("teacherId")
                    subj1 = s1.get("subject")

                    for j in range(i + 1, len(periods)):
                        p2 = periods[j]
                        s2 = slot_by_p[p2]
                        t2_id = s2.get("teacherId")
                        subj2 = s2.get("subject")

                        if t1_id == t2_id and subj1 == subj2:
                            continue

                        # Mevcut komşular
                        curr_adj1 = (p1 - 1 in slot_by_p and slot_by_p[p1 - 1].get("teacherId") == t1_id and slot_by_p[p1 - 1].get("subject") == subj1) or \
                                    (p1 + 1 in slot_by_p and slot_by_p[p1 + 1].get("teacherId") == t1_id and slot_by_p[p1 + 1].get("subject") == subj1)
                        curr_adj2 = (p2 - 1 in slot_by_p and slot_by_p[p2 - 1].get("teacherId") == t2_id and slot_by_p[p2 - 1].get("subject") == subj2) or \
                                    (p2 + 1 in slot_by_p and slot_by_p[p2 + 1].get("teacherId") == t2_id and slot_by_p[p2 + 1].get("subject") == subj2)

                        # Takas sonrası komşular (s1 p2'ye, s2 p1'e)
                        new_adj1 = False
                        if p2 - 1 in slot_by_p and p2 - 1 != p1:
                            new_adj1 = new_adj1 or (slot_by_p[p2 - 1].get("teacherId") == t1_id and slot_by_p[p2 - 1].get("subject") == subj1)
                        if p2 + 1 in slot_by_p and p2 + 1 != p1:
                            new_adj1 = new_adj1 or (slot_by_p[p2 + 1].get("teacherId") == t1_id and slot_by_p[p2 + 1].get("subject") == subj1)

                        new_adj2 = False
                        if p1 - 1 in slot_by_p and p1 - 1 != p2:
                            new_adj2 = new_adj2 or (slot_by_p[p1 - 1].get("teacherId") == t2_id and slot_by_p[p1 - 1].get("subject") == subj2)
                        if p1 + 1 in slot_by_p and p1 + 1 != p2:
                            new_adj2 = new_adj2 or (slot_by_p[p1 + 1].get("teacherId") == t2_id and slot_by_p[p1 + 1].get("subject") == subj2)

                        gain = (int(new_adj1) + int(new_adj2)) - (int(curr_adj1) + int(curr_adj2))
                        if gain <= 0:
                            continue

                        # Çakışma ve Müsaitlik Kontrolleri
                        if t1_id and p2 in busy.get(t1_id, {}).get(d, set()):
                            continue
                        if t1_id and p2 in profiles.get(t1_id, {}).get("closed", {}).get(d, set()):
                            continue

                        if t2_id and p1 in busy.get(t2_id, {}).get(d, set()):
                            continue
                        if t2_id and p1 in profiles.get(t2_id, {}).get("closed", {}).get(d, set()):
                            continue

                        # GÜVENLİ TAKASI UYGULA
                        s1["period"] = p2
                        s2["period"] = p1
                        slot_by_p[p2] = s1
                        slot_by_p[p1] = s2

                        if t1_id:
                            busy[t1_id][d].discard(p1)
                            busy[t1_id][d].add(p2)
                        if t2_id:
                            busy[t2_id][d].discard(p2)
                            busy[t2_id][d].add(p1)

                        improved = True
                        break
                    if improved:
                        break

                if improved:
                    slots.sort(key=lambda it: it["period"])

    return timetable, busy


def audit(busy, teachers, profiles, days, o, timetable=None, classrooms=None, P=None):
    """
    Çözüm üzerinden bağımsız denetim: kural ihlallerini ve hangi öğretmende/sınıfta
    hangi kuralın esnetildiğini (relaxed_rules) detaylı olarak raporlar.
    """
    if P is None:
        # Fallback: gün içindeki maksimum periyot sayısı (veya varsayılan 8)
        max_p = 8
        if timetable:
            for c_days in timetable.values():
                for d_slots in c_days.values():
                    for s in d_slots:
                        max_p = max(max_p, int(s.get("period", 0)))
        if busy:
            for d_map in busy.values():
                for periods_set in d_map.values():
                    if periods_set:
                        max_p = max(max_p, max(periods_set))
        P = max_p
    else:
        P = int(P)

    msgs = []
    relaxed_rules = []
    gap_report, total_gaps = {}, 0
    teacher_map = {t.id: t for t in teachers}

    # 1. Öğretmen-Sınıf Bitişiklik ve Günlük Yoğunluk Esnetmeleri (Ders 1 Denetimi)
    if timetable and classrooms and o.get("enforce_consecutive", True):
        for c in classrooms:
            c_days = timetable.get(c.id, {})
            # Öğretmen başına bu sınıftaki haftalık toplam ders saati
            pair_weekly = {}
            for d in days:
                for slot in c_days.get(d, []):
                    t_id = slot.get("teacherId")
                    if t_id:
                        pair_weekly[t_id] = pair_weekly.get(t_id, 0) + 1

            for d in days:
                slots = c_days.get(d, [])
                by_t = {}
                for slot in slots:
                    t_id = slot.get("teacherId")
                    if t_id:
                        by_t.setdefault(t_id, []).append(slot)

                for t_id, t_slots in by_t.items():
                    prof = profiles.get(t_id, {})
                    if prof.get("is_part_time", False) or prof.get("exempt", False):
                        continue
                    t_obj = teacher_map.get(t_id)
                    t_name = t_obj.name if t_obj else "Öğretmen"
                    weekly_in_class = pair_weekly.get(t_id, 0)
                    max_allowed = 2 if weekly_in_class <= 10 else 4
                    periods = sorted(int(s["period"]) for s in t_slots)
                    subjects = sorted(list({s.get("subject", "Ders") for s in t_slots}))
                    subj_str = ", ".join(subjects)

                    # A) Günlük aynı sınıfa girme sınırı esnetmesi (örn: 2 yerine 3 veya 4 saat)
                    if len(periods) > max_allowed:
                        desc = (f"{t_name} ({c.name} – {subj_str}): {d} günü aynı sınıfa "
                                f"{len(periods)} saat ders yerleşti (normal sınır: en fazla {max_allowed} saat).")
                        msgs.append(f"🔧 Kural Esnetme: {desc}")
                        relaxed_rules.append({
                            "teacherId": t_id,
                            "teacherName": t_name,
                            "classId": c.id,
                            "className": c.name,
                            "subject": subj_str,
                            "day": d,
                            "ruleType": "Aynı Sınıfa Günlük Ders Yükü Esnetmesi",
                            "description": desc,
                        })

                    # B) Aynı gün aynı sınıftaki derslerin bölünmesi (araya başka ders girmesi - ESNETİLEMEZ İHLAL!)
                    if len(periods) >= 2:
                        blocks = 1
                        for i in range(1, len(periods)):
                            if periods[i] != periods[i - 1] + 1:
                                blocks += 1
                        if blocks > 1:
                            p_str = ", ".join(f"{p}." for p in periods)
                            desc = (f"{t_name} ({c.name} – {subj_str}): {d} günü dersler bitişik blok yerine "
                                    f"ayrık saatlere ({p_str} saatler) yerleşti.")
                            msgs.append(f"🚨 Kritik Blok Bölünmesi İhlali: {desc}")
                            relaxed_rules.append({
                                "teacherId": t_id,
                                "teacherName": t_name,
                                "classId": c.id,
                                "className": c.name,
                                "subject": subj_str,
                                "day": d,
                                "ruleType": "Kritik Blok Bölünmesi İhlali",
                                "description": desc,
                                "isCritical": True,
                            })

    # 1b. Yoğun Ders Günlük Tavan Sınırı Denetimi (Haftalık > 6 saat olan dersler)
    if o.get("enforce_intensive") and classrooms and timetable:
        for c in classrooms:
            c_days = timetable.get(c.id, {})
            intensive_courses = [co for co in c.courses if getattr(co, "hoursPerWeek", 0) > 6]
            for co in intensive_courses:
                for d in days:
                    slots = [s for s in c_days.get(d, []) if s.get("subject") == co.subject and (not co.teacherId or s.get("teacherId") == co.teacherId)]
                    if len(slots) > o["max_intensive_hours"]:
                        t_obj = next((tr for tr in teachers if tr.id == co.teacherId), None)
                        t_name = t_obj.name if t_obj else "Öğretmen"
                        desc = f"{c.name} – {co.subject} ({t_name}): {d} günü {len(slots)} saat ders yerleşti (azami sınır: {o['max_intensive_hours']} saat)."
                        msgs.append(f"🔧 Kural Esnetme: {desc}")
                        relaxed_rules.append({
                            "teacherId": co.teacherId,
                            "teacherName": t_name,
                            "classId": c.id,
                            "className": c.name,
                            "subject": co.subject,
                            "day": d,
                            "ruleType": "Yoğun Ders Günlük Tavan Esnetmesi",
                            "description": desc,
                        })

    # 2. Öğretmen Bazlı Pencere, Günlük Asgari Saat ve Boş Gün Esnetmeleri
    for t in teachers:
        prof = profiles[t.id]
        t_gaps = 0
        hours = {}
        for d in days:
            b = busy[t.id][d]
            hours[d] = len(b)
            if b:
                g = sum(1 for p in range(min(b), max(b) + 1) if p not in b)
                t_gaps += g
        # gap_report key olarak t.id kullan (isim çakışması güvenliği)
        gap_report[t.id] = t_gaps
        total_gaps += t_gaps

        # 📌 Öğretmen Haftalık Toplam Pencere Denetimi
        is_gap_exempt = (t.id in o.get("gap_exempt_ids", set()))
        if not prof["exempt"] and not prof.get("is_part_time", False) and not is_gap_exempt and prof["weekly"] > 0:
            if o["enforce_max_total_gaps"] and t_gaps > o["max_total_gaps"]:
                desc = f"{t.name}: Haftalık toplam {t_gaps} saat pencere oluştu (azami sınır: en fazla {o['max_total_gaps']} saat)."
                msgs.append(desc)
                relaxed_rules.append({
                    "teacherId": t.id,
                    "teacherName": t.name,
                    "classId": None,
                    "className": None,
                    "subject": t.branch,
                    "day": "Haftalık",
                    "ruleType": "Haftalık Toplam Azami Pencere Esnetmesi",
                    "description": desc,
                })
            if o["enforce_min_total_gaps"] and o["min_total_gaps"] > 0 and prof["weekly"] >= 10:
                t_open_slots = sum(P - len(prof["closed"].get(d, set())) for d in days)
                t_free_capacity = max(0, t_open_slots - prof["weekly"])
                if t_free_capacity >= o["min_total_gaps"] and t_gaps < o["min_total_gaps"]:
                    desc = f"{t.name}: Haftalık toplam {t_gaps} saat pencere oluştu (asgari şart: en az {o['min_total_gaps']} saat boşluk)."
                    msgs.append(desc)
                    relaxed_rules.append({
                        "teacherId": t.id,
                        "teacherName": t.name,
                        "classId": None,
                        "className": None,
                        "subject": t.branch,
                        "day": "Haftalık",
                        "ruleType": "Haftalık Toplam Asgari Pencere Esnetmesi",
                        "description": desc,
                    })
        if not prof["exempt"] and not prof.get("is_part_time", False) and o["enforce_daily_balance"] and prof["weekly"] > 0:
            active = [d for d in days if hours[d] > 0]
            adaptive_min = min(o["min_daily_hours"], prof["weekly"])
            rem = prof["weekly"] % adaptive_min
            days_below_min = [d for d in active if hours[d] < adaptive_min]
            has_single_rem_day = (rem > 0 and len(days_below_min) == 1)

            for d in active:
                if hours[d] < adaptive_min:
                    if has_single_rem_day and hours[d] == rem:
                        continue
                    desc = f"{t.name} – {d}: Günde {hours[d]} saat ders yerleşti (asgari {adaptive_min} saat kuralı esnetildi)."
                    msgs.append(desc)
                    relaxed_rules.append({
                        "teacherId": t.id,
                        "teacherName": t.name,
                        "classId": None,
                        "className": None,
                        "subject": t.branch,
                        "day": d,
                        "ruleType": "Günlük Asgari Ders Saati Esnetmesi",
                        "description": desc,
                    })

        # Kayan gün tercihi denetimi
        f_day = prof.get("free_day_pref", "none")
        active_days = [d for d in days if hours[d] > 0]
        is_min_days_exempt = (
            prof["exempt"]
            or prof.get("is_part_time", False)
            or (t.id in o.get("min_days_exempt_ids", set()))
            or f_day == "floating_2_days"
        )
        if o.get("enforce_min_active_days", True) and not is_min_days_exempt and prof["weekly"] > 0:
            max_possible_days = min(prof.get("num_avail_days", len(days)), max(1, prof["weekly"] // 2))
            eff_min_active_days = min(o.get("min_active_days", 4), max_possible_days)
            if len(active_days) < eff_min_active_days:
                desc = f"{t.name}: Haftada {len(active_days)} güne ders yerleşti (asgari {eff_min_active_days} aktif gün kuralı esnetildi)."
                msgs.append(desc)
                relaxed_rules.append({
                    "teacherId": t.id,
                    "teacherName": t.name,
                    "classId": None,
                    "className": None,
                    "subject": t.branch,
                    "day": "Haftalık",
                    "ruleType": "Haftalık Asgari Ders Günü Esnetmesi",
                    "description": desc,
                })
        if f_day == "floating_1_day" and len(active_days) > len(days) - 1:
            desc = f"{t.name}: 1 gün esnek boş gün tercihi esnetildi ({len(active_days)} güne ders yerleşti)."
            msgs.append(desc)
            relaxed_rules.append({
                "teacherId": t.id,
                "teacherName": t.name,
                "classId": None,
                "className": None,
                "subject": t.branch,
                "day": "Haftalık",
                "ruleType": "Esnek Boş Gün Esnetmesi",
                "description": desc,
            })
        elif f_day == "floating_2_days" and len(active_days) > len(days) - 2:
            desc = f"{t.name}: 2 gün esnek boş gün tercihi esnetildi ({len(active_days)} güne ders yerleşti)."
            msgs.append(desc)
            relaxed_rules.append({
                "teacherId": t.id,
                "teacherName": t.name,
                "classId": None,
                "className": None,
                "subject": t.branch,
                "day": "Haftalık",
                "ruleType": "Esnek Boş Gün Esnetmesi",
                "description": desc,
            })

    # 3. Saatlik Yedek / Nöbetçi Öğretmen Güvencesi Denetimi (İlk ve son saat hariç tüm ara saatler: 2 .. P-1)
    if o.get("enforce_hourly_reserve", False) and P >= 3:
        target_res = max(1, int(o.get("min_hourly_reserve", 1)))
        gap_exempt_set = o.get("gap_exempt_ids", set())
        elig_teachers = [
            t for t in teachers
            if not profiles[t.id].get("is_admin", False)
            and not profiles[t.id]["exempt"]
            and not profiles[t.id].get("is_part_time", False)
            and t.id not in gap_exempt_set
            and profiles[t.id]["weekly"] > 0
        ]
        for d in days:
            for p in range(2, P):
                in_gap_cnt = 0
                free_present_cnt = 0
                for t in elig_teachers:
                    b_set = busy[t.id][d]
                    closed_set = profiles[t.id]["closed"].get(d, set())
                    is_closed_at_p = p in closed_set
                    has_lesson_at_p = p in b_set

                    if b_set and min(b_set) < p < max(b_set) and not has_lesson_at_p:
                        in_gap_cnt += 1
                    if b_set and not is_closed_at_p and not has_lesson_at_p:
                        free_present_cnt += 1

                if in_gap_cnt < target_res and free_present_cnt < target_res:
                    desc = f"{d} günü {p}. ders saatinde okulda boşta (pencerede) {in_gap_cnt} öğretmen bulundu (hedef: en az {target_res} öğretmen)."
                    msgs.append(desc)
                    relaxed_rules.append({
                        "teacherId": None,
                        "teacherName": "Okul Geneli",
                        "classId": None,
                        "className": None,
                        "subject": f"{p}. Ders Saati",
                        "day": d,
                        "ruleType": "Saatlik Yedek Öğretmen Esnetmesi",
                        "description": desc,
                    })

    return msgs, gap_report, total_gaps, relaxed_rules


def diagnose_infeasibility(teachers, classrooms, activities, days, P, profiles, pinned_slots=None):
    """Çözüm bulunamadığında sorunun tam kaynağını (hangi öğretmen, hangi kısıt, hangi kilit) net bir şekilde teşhis eder."""
    issues = []
    num_days = len(days)
    pinned_slots = pinned_slots or []

    # 1. Kilitli derslerin analizi
    if pinned_slots:
        teacher_pins = {}
        class_pins = {}
        for pin in pinned_slots:
            c_id = pin_field(pin, "classId")
            d = pin_field(pin, "day")
            p = int(pin_field(pin, "period") or 0)
            t_id = pin_field(pin, "teacherId")
            sub = pin_field(pin, "subject")

            if t_id:
                teacher_pins.setdefault((t_id, d, p), []).append((c_id, sub))
            class_pins.setdefault((c_id, d, p), []).append((sub, t_id))

        for (t_id, d, p), pin_list in teacher_pins.items():
            if len(pin_list) > 1:
                t_name = next((t.name for t in teachers if t.id == t_id), "Öğretmen")
                issues.append(f"🚨 Kilit Çakışması: {t_name} öğretmeni {d} günü {p}. saatte birden fazla sınıfta ({len(pin_list)} sınıf) kilitlenmiş!")

        for (c_id, d, p), pin_list in class_pins.items():
            if len(pin_list) > 1:
                c_name = next((c.name for c in classrooms if c.id == c_id), "Sınıf")
                issues.append(f"🚨 Kilit Çakışması: {c_name} sınıfında {d} günü {p}. saatte birden fazla ders ({', '.join(s[0] for s in pin_list)}) kilitlenmiş!")

    # 2. Öğretmen kapasite ve kapalı saat darboğazı
    for t in teachers:
        prof = profiles.get(t.id, {})
        weekly = prof.get("weekly", 0)
        if weekly == 0:
            continue

        open_days = [d for d in days if len(prof["closed"][d]) < P]
        num_open = len(open_days)
        max_possible = sum(min(P - len(prof["closed"][d]), prof["hard_cap"]) for d in days)

        if weekly > max_possible:
            closed_total = sum(len(prof["closed"][d]) for d in days)
            issues.append(f"🚨 Öğretmen Kapasite Yetersizliği: '{t.name}' öğretmeninin haftalık {weekly} saat dersi var. Ancak toplam {closed_total} saati kapalı olduğu için okulda en fazla {max_possible} saat derse girebiliyor!")
        elif num_open > 0 and (weekly / num_open) > prof["hard_cap"]:
            issues.append(f"🚨 Günlük Sınır Darboğazı: '{t.name}' öğretmeninin açık olduğu {num_open} gün var. Günlük azami {prof['hard_cap']} saat sınırı ile haftalık {weekly} saat dersi tamamlayamaz!")

        # 2 saatlik blok sığacak art arda iki açık saat hiç yoksa
        t_acts = [a for a in activities if a["teacher_id"] == t.id]
        if any(a["duration"] == 2 for a in t_acts):
            has_pair_slot = any(p not in prof["closed"][d] and p + 1 not in prof["closed"][d]
                                for d in days for p in range(1, P))
            if not has_pair_slot:
                issues.append(f"🚨 Blok Yerleşim Çıkmazı: '{t.name}' öğretmeninin 2 saatlik dersleri var ancak hiçbir gün art arda iki açık saati yok!")

        class_loads = {}
        for a in t_acts:
            class_loads[a["class_name"]] = class_loads.get(a["class_name"], 0) + a["duration"]

        for c_name, load in class_loads.items():
            if not prof.get("is_part_time") and num_open <= 2 and load > (2 * num_open):
                issues.append(f"🚨 Blok Dağılım Çıkmazı: '{t.name}' öğretmeninin '{c_name}' sınıfına {load} saat dersi var ancak öğretmen sadece {num_open} gün açık!")

    # 3. Sınıf kapasite kontrolü
    for c in classrooms:
        total_c = sum(course.hoursPerWeek for course in c.courses)
        if total_c > (num_days * P):
            issues.append(f"🚨 Sınıf Kapasite Aşımı: '{c.name}' sınıfının haftalık toplam {total_c} saat dersi var; okulun haftalık azami ders kapasitesi ise {num_days * P} saat!")

    return issues


def solve(request: SolveRequest):
    reset_live_progress()
    try:
        start = time.time()
        teachers, classrooms = request.teachers, request.classrooms
        days = list(request.settings.days)
        P = int(request.settings.periodsPerDay)
        o = read_options(request)
        is_render = os.environ.get("RENDER") == "true" or os.environ.get("RENDER_SERVICE_ID") is not None
        raw_timeout = float(o["timeout"])
        if o["stop_at_first"]:
            total_budget = max(85.0, raw_timeout)
        else:
            total_budget = max(15.0, raw_timeout)
        # Render bulut proxy (100s) zaman aşımını ve erken kesilmeyi önlemek için bulutta güvenli 80-88sn bütçesi
        if is_render:
            total_budget = min(88.0, max(80.0, total_budget))
        pinned_slots = getattr(request, "pinnedSlots", None) or getattr(request, "pinned_slots", None) or []
        workers = detect_workers()

        def remaining():
            return total_budget - (time.time() - start)

        activities = build_activities(classrooms)
        # Hızlı ID → aktivite arama sözlüğü (extract() için kırılganlık önlemi)
        _activities_by_id: dict[int, dict] = {a["id"]: a for a in activities}
        profiles, notes = teacher_profiles(teachers, activities, days, P, o)
        warnings_extra = []

        total_required = sum(c.hoursPerWeek for cl in classrooms for c in cl.courses)

        # En kısıtlı 5 öğretmeni belirle (Canlı telemetri ekranı ve FET zorluk analizi için)
        total_week_slots = len(days) * P
        teacher_difficulty = []
        for t in teachers:
            prof = profiles.get(t.id, {})
            w_load = prof.get("weekly", 0)
            if w_load <= 0:
                continue
            closed_cnt = sum(len(s) for s in prof.get("closed", {}).values())
            open_slots = max(1, total_week_slots - closed_cnt)
            density = min(100, round((w_load / open_slots) * 100))
            open_d = max(1, prof.get("num_avail_days", len(days)))
            diff_score = (w_load / open_slots) * 100 + (w_load / open_d) * 5 + closed_cnt * 1.5
            teacher_difficulty.append({
                "name": t.name,
                "branch": t.branch,
                "load": w_load,
                "openSlots": open_slots,
                "closedSlots": closed_cnt,
                "density": density,
                "score": round(diff_score, 1)
            })
        teacher_difficulty.sort(key=lambda it: it["score"], reverse=True)
        top_hardest = teacher_difficulty[:5]

        update_live_progress(
            totalActivities=len(activities),
            totalHours=total_required,
            workers=workers,
            hardestTeachers=top_hardest,
            stageIndex=0,
            stageTitle="Matematiksel Model & Zorluk Sıralaması Kuruluyor",
            stageDesc=f"{len(activities)} ders bloğu ({total_required} saat) zorluk puanına göre sıralanıyor..."
        )

        # ---- Aşama 0: geçerli çözüm (idareciler dahil tek birleşik model)
        use_consec = o["enforce_consecutive"]
        allow_soft_consec = False
        allow_soft_float = False
        allow_soft_gaps = bool(o.get("enforce_min_total_gaps") or o.get("enforce_hourly_reserve"))
        lunch_after = getattr(request.settings, "lunchBreakAfter", None)
        model, x, terms, build_warn, busy_by_teacher = build_model(
            use_consec, activities, classrooms, teachers,
            days, P, profiles, o, pinned_slots,
            allow_soft_floating=allow_soft_float,
            lunch_after=lunch_after,
            allow_soft_consecutive=allow_soft_consec,
            allow_soft_gaps=allow_soft_gaps
        )
        num_vars = len(model.Proto().variables)
        safe_print(f"[solver] model kuruldu {time.time() - start:.1f}s, işçi={workers}, "
                   f"değişken={num_vars}")

        update_live_progress(
            numVariables=num_vars,
            stageIndex=1,
            stageTitle="Aşama 1: İlk Geçerli Çakışmasız Çözüm Aranıyor",
            stageDesc="Zorluk puanı en yüksek öğretmenlerden başlanarak temel yerleşim hesaplanıyor..."
        )
        add_live_feed(
            f"Matematiksel model kuruldu: {len(activities)} ders bloğu ({total_required} saat), {num_vars} karar değişkeni, {workers} paralel CPU çekirdeği.",
            "info"
        )
        if top_hardest:
            hard_names = ", ".join(f"{ht['name']} (%{ht['density']} yoğunluk)" for ht in top_hardest[:3])
            add_live_feed(f"🎯 Zorluk sırasına göre ilk yerleştirilecek düğümler: {hard_names}", "info")

        # Aşama 0: Modelde kuralların gevşetilmesini ve blokların bölünmesini önlemek için
        # varsa slack ve kural değişkenleri aktif olarak minimize edilir.
        obj_parts0 = []
        if terms.get("consec_slacks"):
            obj_parts0.append(sum(500 * s for s in terms["consec_slacks"]))
        if terms.get("rules"):
            obj_parts0.append(sum(terms["rules"]))
        if obj_parts0:
            model.Minimize(sum(obj_parts0))

        phase0_time = remaining() if o["stop_at_first"] else max(45.0, remaining() * 0.70)
        patience0 = 1.5 if o["stop_at_first"] else (min(10.0, max(4.0, phase0_time * 0.2)) if obj_parts0 else None)
        solver, st, _ = run_solver(model, phase0_time, workers, patience=patience0, busy_by_teacher=busy_by_teacher, phase_label="Temel Yerleşim")
        model.ClearObjective()
        safe_print(f"[solver] temel (bitişiklik={'sert' if not allow_soft_consec else 'esnek'}, sert_kayan={'açık' if not allow_soft_float else 'kapalı'}, tavizsiz_pencere={'sert' if not allow_soft_gaps else 'esnek'}): "
                   f"{solver.StatusName(st)} {solver.WallTime():.1f}s")

        if not ok(st) and (use_consec and not allow_soft_consec) and st in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
            # 💡 DERS 1: Bitişikliği tüm okul için kapatmak yerine lokal esnek (soft) moda geçir!
            allow_soft_consec = True
            update_live_progress(
                stageTitle="Aşama 1: Lokal Esnek Yerleşim Aranıyor",
                stageDesc="Sıkışan öğretmen kısıtları esnetilerek temel yerleşim aranıyor..."
            )
            add_live_feed(
                "Sert bitişiklik kısıtlarıyla bazı öğretmenler sıkıştı; kural tüm okulda kapatılmadan yalnızca gereken öğretmende lokal esnetiliyor...",
                "warn"
            )
            warnings_extra.append(
                "Bazı öğretmenlerin kapalı saat/kilit yoğunluğu nedeniyle ders-sınıf bitişiklik kuralı tüm okulda kapatılmak yerine yalnızca sıkışan öğretmenlerde lokal olarak esnetildi."
            )
            model, x, terms, build_warn, busy_by_teacher = build_model(
                use_consec, activities, classrooms, teachers,
                days, P, profiles, o, pinned_slots,
                allow_soft_floating=allow_soft_float,
                lunch_after=lunch_after,
                allow_soft_consecutive=True,
                allow_soft_gaps=allow_soft_gaps
            )
            # Blok bölünmelerini ve kural esnetmelerini aktif minimize et
            obj_parts1 = []
            if terms.get("consec_slacks"):
                obj_parts1.append(sum(500 * s for s in terms["consec_slacks"]))
            if terms.get("rules"):
                obj_parts1.append(sum(terms["rules"]))
            if obj_parts1:
                model.Minimize(sum(obj_parts1))
            retry_patience = 1.5 if o["stop_at_first"] else min(10.0, max(3.0, remaining() * 0.25))
            phase0_retry = remaining() if o["stop_at_first"] else max(15.0, remaining() * 0.65)
            solver, st, _ = run_solver(
                model, phase0_retry, workers,
                patience=retry_patience,
                busy_by_teacher=busy_by_teacher,
                phase_label="Lokal Esnek Yerleşim"
            )
            model.ClearObjective()
            safe_print(f"[solver] temel deneme 1 (bitişiklik=lokal_esnek, sert_kayan={'açık' if not allow_soft_float else 'kapalı'}): "
                       f"{solver.StatusName(st)} {solver.WallTime():.1f}s")

        if not ok(st) and not allow_soft_float and st in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
            allow_soft_float = True
            allow_soft_consec = True
            update_live_progress(
                stageTitle="Aşama 1: Kayan Boş Günler Esnetiliyor",
                stageDesc="Kayan boş gün kısıtları yumuşatılarak geçerli çözüm aranıyor..."
            )
            add_live_feed(
                "Kayan boş gün kısıtları yumuşatılarak yeniden çözüm aranıyor...",
                "warn"
            )
            warnings_extra.append("Sert kayan boş gün kısıtlarıyla çözüm bulunamadı; kısıtlar yumuşatılarak çözüldü.")
            model, x, terms, build_warn, busy_by_teacher = build_model(
                use_consec, activities, classrooms, teachers,
                days, P, profiles, o, pinned_slots,
                allow_soft_floating=True,
                lunch_after=lunch_after,
                allow_soft_consecutive=True,
                allow_soft_gaps=allow_soft_gaps
            )
            obj_parts2 = []
            if terms.get("consec_slacks"):
                obj_parts2.append(sum(500 * s for s in terms["consec_slacks"]))
            if terms.get("rules"):
                obj_parts2.append(sum(terms["rules"]))
            if obj_parts2:
                model.Minimize(sum(obj_parts2))
            retry2_patience = 1.5 if o["stop_at_first"] else min(10.0, max(3.0, remaining() * 0.25))
            phase0_retry2 = max(6.0, remaining())
            solver, st, _ = run_solver(
                model, phase0_retry2, workers,
                patience=retry2_patience,
                busy_by_teacher=busy_by_teacher,
                phase_label="Esnek Yerleşim"
            )
            model.ClearObjective()
            safe_print(f"[solver] temel deneme 2 (bitişiklik=lokal_esnek, sert_kayan=kapalı): "
                       f"{solver.StatusName(st)} {solver.WallTime():.1f}s")

        if not ok(st) and not allow_soft_gaps and (o.get("max_total_gaps_level") == "high" or o.get("min_total_gaps_level") == "high" or o.get("hourly_reserve_level") == "high") and st in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
            allow_soft_gaps = True
            allow_soft_float = True
            allow_soft_consec = True
            update_live_progress(
                stageTitle="Aşama 1: Tavizsiz Pencere Kısıtları Esnetiliyor",
                stageDesc="Tavizsiz pencere sınırları hafif esnetilerek geçerli çözüm aranıyor..."
            )
            add_live_feed(
                "Tavizsiz pencere kısıtlarıyla çözüm bulunamadı; pencereler hafif esnetilerek yeniden aranıyor...",
                "warn"
            )
            warnings_extra.append("Tavizsiz pencere kısıtlarıyla çözüm bulunamadı; pencere sınırları yumuşatılarak çözüldü.")
            model, x, terms, build_warn, busy_by_teacher = build_model(
                use_consec, activities, classrooms, teachers,
                days, P, profiles, o, pinned_slots,
                allow_soft_floating=True,
                lunch_after=lunch_after,
                allow_soft_consecutive=True,
                allow_soft_gaps=True
            )
            obj_parts3 = []
            if terms.get("consec_slacks"):
                obj_parts3.append(sum(500 * s for s in terms["consec_slacks"]))
            if terms.get("rules"):
                obj_parts3.append(sum(terms["rules"]))
            if obj_parts3:
                model.Minimize(sum(obj_parts3))
            retry3_patience = 1.5 if o["stop_at_first"] else min(10.0, max(3.0, remaining() * 0.25))
            phase0_retry3 = max(6.0, remaining())
            solver, st, _ = run_solver(
                model, phase0_retry3, workers,
                patience=retry3_patience,
                busy_by_teacher=busy_by_teacher,
                phase_label="Pencere Esnek Yerleşim"
            )
            model.ClearObjective()
            safe_print(f"[solver] temel deneme 3 (bitişiklik=lokal_esnek, sert_kayan=kapalı, pencere=esnek): "
                       f"{solver.StatusName(st)} {solver.WallTime():.1f}s")

        if not ok(st):
            if _stop_event.is_set():
                msg = "Arama Kullanıcı Tarafından İptal Edildi."
                add_live_feed("⏹️ Motor henüz ilk geçerli çözümü bulamadan kullanıcı tarafından durduruldu.", "warn")
                update_live_progress(active=False, stageTitle="Arama İptal Edildi")
                return {
                    "status": "error",
                    "message": msg,
                    "detail": "İlk geçerli çözüm aranırken işlem kullanıcı isteğiyle durduruldu.",
                    "metrics": {
                        "stoppedEarlyByUser": True,
                        "warnings": ["İlk geçerli çözüm bulunmadan önce arama kullanıcı tarafından durduruldu. Dilediğiniz zaman yeniden dağıtım başlatabilirsiniz."]
                    }
                }
            last_status = solver.StatusName(st) if solver else "UNKNOWN"
            diag_issues = diagnose_infeasibility(teachers, classrooms, activities, days, P, profiles, pinned_slots=pinned_slots)
            if st == cp_model.INFEASIBLE:
                msg = "ÇÖZÜM YOK: Belirlenen kısıtlar ve kapalı saatler birbiriyle çelişiyor."
                tip = "Aşağıdaki kısıt ve çakışma nedenlerini kontrol edin:"
            else:
                msg = "ÇÖZÜM BULUNAMADI: Belirlenen süre içinde çözüm tamamlanamadı."
                tip = "Optimizasyon süresini artırın veya aşağıdaki kısıtları gözden geçirin:"
            warnings_list = [tip] + (diag_issues if diag_issues else ["Öğretmenlerin kapalı saatlerini ve haftalık ders yüklerini kontrol edin."]) + notes
            detail_msg = msg + (" Neden: " + "; ".join(diag_issues[:2]) if diag_issues else "")
            add_live_feed(f"Çözüm bulunamadı: {msg}", "error")
            update_live_progress(active=False, stageTitle="Çözüm Bulunamadı")
            return {
                "status": "error",
                "message": msg,
                "detail": detail_msg,
                "metrics": {"warnings": warnings_list + [f"Çözücü durumu: {last_status}"]}
            }

        best_solver = solver
        stage = "temel"
        stage_details = []

        # 🔒 AŞAMA 1.5: Asgari Pencere (Tavizsiz Boşluk), Blok Bütünlüğü ve Saatlik Yedek Sıkılaştırma & Kilitleme
        tighten_slacks = []
        if o.get("enforce_min_total_gaps") and terms.get("min_gap_slacks"):
            tighten_slacks.extend(terms["min_gap_slacks"])
        if o.get("enforce_hourly_reserve") and terms.get("reserve_slacks"):
            tighten_slacks.extend(terms["reserve_slacks"])
        if o.get("enforce_consecutive") and terms.get("consec_slacks"):
            tighten_slacks.extend(terms["consec_slacks"])

        if tighten_slacks and not _stop_event.is_set():
            rem_tight = remaining()
            if rem_tight >= 2.0:
                update_live_progress(
                    stageTitle="Aşama 1.5: Asgari Boşluk & Blok Güvencesi Kilitleniyor",
                    stageDesc="Öğretmenlerin asgari boşluk, blok bütünlüğü ve saatlik nöbetçi şartı tavizsiz güvenceye alınıyor..."
                )
                add_live_feed(
                    "🔒 Asgari boşluk, blok bütünlüğü ve saatlik nöbetçi güvencesi sıkılaştırılıyor...",
                    "info"
                )
                tighten_time = min(10.0, max(3.0, rem_tight * 0.30))
                tighten_expr = sum(tighten_slacks)
                model.Minimize(tighten_expr)
                hint_from(model, best_solver)
                tight_solver, tight_st, _ = run_solver(
                    model, tighten_time, workers, patience=min(7.0, tighten_time),
                    busy_by_teacher=busy_by_teacher,
                    phase_label="Asgari Boşluk ve Blok Kilitleme"
                )
                if tight_solver is not None and ok(tight_st):
                    best_solver = tight_solver
                    best_slack = int(round(tight_solver.ObjectiveValue()))
                    safe_print(f"[solver] asgari boşluk, blok ve yedek sıkılaştırma: {tight_solver.StatusName(tight_st)} "
                               f"{tight_solver.WallTime():.1f}s, toplam açık={best_slack}")
                    if o.get("min_total_gaps_level") == "high" or o.get("hourly_reserve_level") == "high" or o.get("enforce_consecutive"):
                        if best_slack == 0:
                            model.Add(tighten_expr == 0)
                            add_live_feed("✅ Asgari boşluk, blok bütünlüğü ve nöbetçi şartları tüm okulda sıfır tavizle (%100) kilitlendi.", "success")
                        else:
                            # best_slack > 0 durumunda kalıcı sert kısıt eklenmez; Aşama 2 LNS optimizasyonunun
                            # bu açık veya bölünmüşlüğü sıfırlamasına izin verilir!
                            add_live_feed(f"🔒 Asgari boşluk ve bloklar sıkılaştırıldı ({best_slack} açık, Aşama 2'de sıfırlanmaya çalışılacak).", "info")
                model.ClearObjective()

        # ⚡ İLK GEÇERLİ ÇÖZÜMDE DUR: İyileştirme kademeleri atlanır, saniyeler içinde dönülür
        if o["stop_at_first"]:
            safe_print(f"[solver] 'İlk geçerli çözümde dur' devrede. İyileştirme kademeleri atlandı. Geçen süre: {time.time() - start:.2f}s")
            stage = "ilk_gecerli"
            add_live_feed("⚡ Yıldırım Modu: İlk geçerli çözüm kabul edildi, tablo hazırlanıyor.", "success")
        elif _stop_event.is_set():
            stage = "kullanici_durdurdu"
            safe_print(f"[solver] Kullanıcı durdurma talebi devrede. Aşama 2 atlandı. Temel çözüm kabul edildi.")
            add_live_feed("⏹️ Kullanıcı durdurma komutu: Aşama 2 atlandı, temel geçerli çözüm alınıyor.", "warn")
        else:
            # 🚀 ADIM 1: Tek Geçişli Ağırlıklandırılmış Çok Amaçlı LNS Optimizasyonu
            lns_budget = min(total_budget, max(25.0, raw_timeout)) - (time.time() - start)
            rem = min(remaining(), lns_budget)
            if rem >= 2.0:
                update_live_progress(
                    stageIndex=2,
                    stageTitle="Aşama 2: Çok Amaçlı LNS Optimizasyonu (Pencere & Kural İyileştirme)",
                    stageDesc="Öğretmen pencereleri, boş gün istekleri ve ders dağılım dengesi iyileştiriliyor..."
                )
                add_live_feed(
                    f"Aşama 2 başlatıldı: Kalan {rem:.0f}sn boyunca öğretmen pencereleri ve kurallar optimize ediliyor...",
                    "info"
                )
                weighted_terms = []
                gap_weight = max(10, int(o.get("gap_penalty", 40)))
                # 1. Blok Bütünlüğü ve Sert Kural Koruması (En tepe öncelik: hiçbir pencere cezası bloğu bölemez!)
                if terms.get("consec_slacks"):
                    weighted_terms.extend(500000 * s for s in terms["consec_slacks"])
                if terms.get("reserve_slacks"):
                    weighted_terms.extend(100000 * s for s in terms["reserve_slacks"])
                if terms["rules"]:
                    weighted_terms.extend(WEIGHT_RULES * r for r in terms["rules"])
                # 2. Öğretmen pencereleri / boşlukları
                if terms["gaps"]:
                    weighted_terms.extend(gap_weight * g for g in terms["gaps"])
                # 3. Tercihler
                if terms["prefs"]:
                    weighted_terms.extend(WEIGHT_PREFS * p for p in terms["prefs"])

                if weighted_terms:
                    combined_obj = sum(weighted_terms)
                    model.Minimize(combined_obj)
                    hint_from(model, best_solver)

                    patience = min(20.0, max(10.0, rem * 0.45)) if is_render else min(45.0, max(15.0, rem * 0.6))
                    opt_solver, opt_st, cb = run_solver(
                        model, rem, workers, patience,
                        busy_by_teacher=busy_by_teacher,
                        phase_label="LNS İyileştirme"
                    )
                    if opt_solver is not None and ok(opt_st):
                        best_solver = opt_solver
                        stage = "kullanici_durdurdu" if _stop_event.is_set() else "iyileştirilmiş"
                        final_val = int(round(opt_solver.ObjectiveValue()))
                        safe_print(f"[solver] çok amaçlı LNS optimizasyonu tamamlandı: {opt_solver.StatusName(opt_st)} "
                                   f"{opt_solver.WallTime():.1f}s değer={final_val}")
                        stage_details.append({
                            "tier": "Çok Amaçlı LNS (Boşluk & Kural)",
                            "value": final_val,
                            "status": opt_solver.StatusName(opt_st),
                            "seconds": round(opt_solver.WallTime(), 1)
                        })
                    else:
                        safe_print(f"[solver] optimizasyonda yeni çözüm bulunamadı veya durduruldu, temel çözüm korundu: "
                                   f"{opt_solver.StatusName(opt_st) if opt_solver else 'YOK'}")
                    model.ClearObjective()

        update_live_progress(
            stageIndex=3,
            stageTitle="Aşama 3: Sonuç Denetimi & Adalet Analizi",
            stageDesc="Öğretmen bazlı kural esnetmeleri ve adalet skoru raporlanıyor..."
        )
        timetable, busy = extract(best_solver, x, activities, classrooms, teachers, days, P)
        # 🧩 Aşama 2.5: Deterministik Post-Solve Blok Birleştirme ve Yerel Temizlik Geçidi
        timetable, busy = unify_blocks_post_solve(timetable, busy, classrooms, teachers, profiles, days, P, o)
        rule_msgs, gap_report, total_gaps, relaxed_rules = audit(
            busy, teachers, profiles, days, o,
            timetable=timetable, classrooms=classrooms, P=P
        )
        stopped_early = _stop_event.is_set()
        if stopped_early:
            add_live_feed(
                f"✓ Motor kullanıcı isteğiyle sonlandırıldı! Son geçerli çözüm ({total_gaps} saat pencere) mühürlendi.",
                "success"
            )
        else:
            add_live_feed(
                f"✓ Dağıtım tamamlandı! Sonuç toplam pencere: {total_gaps} saat, esnetilen kural sayısı: {len(relaxed_rules)}.",
                "success"
            )
        update_live_progress(active=False, currentGaps=total_gaps)

        # Adalet Skalası: Haftalık pencere (boşluk) sayısı 3 ve üzeri olan öğretmenler üzerinden değerlendirilir
        three_plus_teachers = [
            t for t in teachers
            if not profiles[t.id]["exempt"]
            and not profiles[t.id]["is_part_time"]
            and profiles[t.id]["weekly"] > 0
            and gap_report.get(t.id, 0) >= 3
        ]
        three_plus_count = len(three_plus_teachers)

        # Standard aktif öğretmenler (idareciler ve muaf olanlar hariç)
        standard_active_teachers = [
            t for t in teachers
            if not profiles[t.id]["exempt"]
            and not profiles[t.id].get("is_part_time", False)
            and profiles[t.id]["weekly"] > 0
        ]
        all_gaps = sorted([gap_report.get(t.id, 0) for t in standard_active_teachers])
        standard_count = len(standard_active_teachers)

        # Medyan Hesabı (İdareciler hariç veri grubu)
        median_gaps = 0
        if standard_count > 0:
            mid = standard_count // 2
            if standard_count % 2 != 0:
                median_gaps = all_gaps[mid]
            else:
                median_gaps = round((all_gaps[mid - 1] + all_gaps[mid]) / 2, 1)

        standard_gaps = sum(all_gaps)
        avg = round(standard_gaps / standard_count, 2) if standard_count > 0 else 0

        # Okul medyanının üzerinde boşluğu olan öğretmenler (tıklanabilir yönlendirme için id ile birlikte)
        teachers_above_median = sorted(
            [{"id": t.id, "name": t.name, "gaps": gap_report.get(t.id, 0)}
             for t in standard_active_teachers
             if gap_report.get(t.id, 0) > median_gaps],
            key=lambda it: it["gaps"], reverse=True
        )

        above = sorted(
            [{"id": t.id, "name": t.name, "gaps": gap_report.get(t.id, 0)}
             for t in standard_active_teachers
             if gap_report.get(t.id, 0) >= 3 or gap_report.get(t.id, 0) > avg],
            key=lambda it: it["gaps"], reverse=True
        )

        # Öğretmenler Odası Adalet Skoru (Medyan, sağa çarpıklık ve uç değer cezaları)
        fairness_score = 100
        fairness_label = "Mükemmel Adalet"
        fairness_color = "emerald"

        if standard_count > 0:
            # Örneklem varyansı (Bessel düzeltmesi: N yerine N-1)
            # Küçük okullarda (< 15 öğretmen) popülasyon varyansı skoru şişirir.
            denom = standard_count - 1 if standard_count > 1 else 1
            variance = sum((g - avg) ** 2 for g in all_gaps) / denom
            std_dev = math.sqrt(variance)
            max_gap = all_gaps[-1] if all_gaps else 0

            penalty = 0.0
            for g in all_gaps:
                if g == 3:
                    penalty += 3.5
                elif g == 4:
                    penalty += 7.0
                elif g >= 5:
                    penalty += 12.0 + (g - 5) * 5.0

            if max_gap > 2:
                penalty += (max_gap - 2) * 5.0

            penalty += std_dev * 8.0

            # Medyan ve sağa çarpıklık etkisi
            if median_gaps == 0:
                penalty -= 6.0  # Tabanın %50+'si sıfır boşluklu
            elif median_gaps <= 1 and median_gaps <= avg:
                penalty -= 3.0  # Sağa çarpık, taban rahat
            elif median_gaps >= 2:
                penalty += (median_gaps - 1) * 8.0

            fairness_score = max(15, min(100, round(100 - penalty)))

            if fairness_score >= 90:
                fairness_label = "Mükemmel Adalet (Taban Boşluksuz)"
                fairness_color = "emerald"
            elif fairness_score >= 78:
                fairness_label = "Yüksek Adalet (Dengeli Dağılım)"
                fairness_color = "blue"
            elif fairness_score >= 60:
                fairness_label = "Orta Adalet (Yüksek Boşluklu Öğretmenler Var)"
                fairness_color = "amber"
            else:
                fairness_label = "Düşük Adalet (Pencere Dağılımı Dengesiz)"
                fairness_color = "red"

        violations = list(notes) + warnings_extra + build_warn
        if stopped_early:
            violations.insert(0, f"ℹ️ Optimizasyon kullanıcı tarafından sonlandırıldı: En son bulunan geçerli çözüm ({total_gaps} saat pencere) korundu ve mühürlendi.")
        if rule_msgs:
            violations.append(f"Kural ihlali kalan {len(rule_msgs)} durum (süre/sıkışıklık nedeniyle gevşetildi):")
            violations.extend(rule_msgs[:30])

        # 📊 BOŞ GÜN & YARIM GÜN BOŞLUK ANALİZİ (Nihai Rapor İstatistiği)
        lunch_break = getattr(request.settings, "lunchBreakAfter", None)
        cutoff = lunch_break if (lunch_break and 1 <= lunch_break < P) else math.ceil(P / 2)

        requested_free_day_count = 0
        teachers_without_free_day = []
        requested_half_day_count = 0
        teachers_without_half_day = []
        floating_day_failed = []
        floating_half_failed = []
        floating_day_req_count = 0
        floating_half_req_count = 0

        for t in teachers:
            prof = profiles.get(t.id, {})
            load = prof.get("weekly", 0)
            if load <= 0:
                continue

            t_busy = busy.get(t.id, {})
            active_days = [d for d in days if len(t_busy.get(d, set())) > 0]
            free_days = [d for d in days if len(t_busy.get(d, set())) == 0]

            # 1. BOŞ GÜN İSTEĞİ KONTROLÜ
            # Yalnızca:
            # - Kayan boş gün seçenler (floating_1_day veya floating_2_days)
            # - VEYA bir günün tüm saatlerini kapatarak sabit boş gün isteyenler
            # boş gün talep etmiş sayılır.
            f_day = prof.get("free_day_pref", "none")
            fixed_full_closed_days = [d for d in days if len(prof.get("closed", {}).get(d, set())) >= P]
            requested_free_day = (f_day in ("floating_1_day", "floating_2_days")) or (len(fixed_full_closed_days) > 0)

            if requested_free_day:
                requested_free_day_count += 1
                free_day_violated = False
                reason_parts = []
                requested_labels = []

                if f_day == "floating_1_day":
                    floating_day_req_count += 1
                    requested_labels.append("1 Gün Boş (Esnek)")
                    if len(free_days) < 1:
                        free_day_violated = True
                        r_msg = f"1 gün boş talep etti ancak haftanın {len(active_days)} gününe ders yerleşti"
                        reason_parts.append(r_msg)
                        floating_day_failed.append({
                            "id": t.id, "name": t.name, "load": load,
                            "activeDays": len(active_days), "reason": r_msg
                        })
                elif f_day == "floating_2_days":
                    floating_day_req_count += 1
                    requested_labels.append("2 Gün Boş (Esnek)")
                    if len(free_days) < 2:
                        free_day_violated = True
                        r_msg = f"2 gün boş talep etti ancak {len(free_days)} gün boş kalabildi"
                        reason_parts.append(r_msg)
                        floating_day_failed.append({
                            "id": t.id, "name": t.name, "load": load,
                            "activeDays": len(active_days), "reason": r_msg
                        })

                for cd in fixed_full_closed_days:
                    requested_labels.append(f"{cd} Kapalı")
                    if len(t_busy.get(cd, set())) > 0:
                        free_day_violated = True
                        reason_parts.append(f"{cd} gününü tamamen kapattı ancak o güne ders yerleşti")

                if free_day_violated:
                    teachers_without_free_day.append({
                        "id": t.id,
                        "name": t.name,
                        "load": load,
                        "activeDays": len(active_days),
                        "requested": ", ".join(requested_labels),
                        "reason": "; ".join(reason_parts)
                    })

            # 2. YARIM GÜN BOŞLUK İSTEĞİ KONTROLÜ
            # Yalnızca:
            # - Kayan yarım gün seçenler (any_afternoon veya any_morning)
            # - VEYA bir günün sabahını (1..cutoff) ya da öğleden sonrasını (cutoff+1..P) tamamen kapatanlar
            # yarım gün talep etmiş sayılır.
            f_half = prof.get("free_half_pref", "none")
            closed_dict = prof.get("closed", {})
            fixed_morning_closed = [d for d in days if len(closed_dict.get(d, set())) < P and all(p in closed_dict.get(d, set()) for p in range(1, cutoff + 1))]
            fixed_afternoon_closed = [d for d in days if len(closed_dict.get(d, set())) < P and all(p in closed_dict.get(d, set()) for p in range(cutoff + 1, P + 1))]
            requested_half_day = (f_half in ("any_afternoon", "any_morning")) or (len(fixed_morning_closed) > 0) or (len(fixed_afternoon_closed) > 0)

            # Çizelgede yarım gün durumu
            has_free_afternoon = False
            has_free_morning = False

            if len(free_days) > 0:
                has_free_afternoon = True
                has_free_morning = True
            else:
                for d in active_days:
                    slots = t_busy.get(d, set())
                    morn = any(p <= cutoff for p in slots)
                    aft = any(p > cutoff for p in slots)
                    if not aft and morn:
                        has_free_afternoon = True
                    if not morn and aft:
                        has_free_morning = True

            if requested_half_day:
                requested_half_day_count += 1
                half_day_violated = False
                half_reasons = []
                half_labels = []

                if f_half == "any_afternoon":
                    floating_half_req_count += 1
                    half_labels.append("Öğleden Sonra Boş (Esnek)")
                    if not has_free_afternoon and len(free_days) == 0:
                        half_day_violated = True
                        h_msg = "Öğleden sonra boşluk talep etti, her gün öğleden sonra dersi var"
                        half_reasons.append(h_msg)
                        floating_half_failed.append({
                            "id": t.id, "name": t.name, "load": load, "reason": h_msg
                        })
                elif f_half == "any_morning":
                    floating_half_req_count += 1
                    half_labels.append("Sabah Boş (Esnek)")
                    if not has_free_morning and len(free_days) == 0:
                        half_day_violated = True
                        h_msg = "Sabah boşluk talep etti, her gün ilk saatlerde dersi var"
                        half_reasons.append(h_msg)
                        floating_half_failed.append({
                            "id": t.id, "name": t.name, "load": load, "reason": h_msg
                        })

                for md in fixed_morning_closed:
                    half_labels.append(f"{md} Sabah Kapalı")
                    if any(p <= cutoff for p in t_busy.get(md, set())):
                        half_day_violated = True
                        half_reasons.append(f"{md} sabahını kapattı ancak ders yerleşti")

                for ad in fixed_afternoon_closed:
                    half_labels.append(f"{ad} Öğleden Sonra Kapalı")
                    if any(p > cutoff for p in t_busy.get(ad, set())):
                        half_day_violated = True
                        half_reasons.append(f"{ad} öğleden sonrasını kapattı ancak ders yerleşti")

                if half_day_violated:
                    teachers_without_half_day.append({
                        "id": t.id,
                        "name": t.name,
                        "load": load,
                        "requested": ", ".join(half_labels),
                        "reason": "; ".join(half_reasons)
                    })

        # 🛡️ Saatlik Yedek / Nöbetçi Öğretmen Raporu (İlk ve son saat hariç tüm ara saatler: 2 .. P-1)
        gap_exempt_set = o.get("gap_exempt_ids", set())
        elig_reserve_teachers = [
            t for t in teachers
            if not profiles[t.id].get("is_admin", False)
            and not profiles[t.id]["exempt"]
            and not profiles[t.id].get("is_part_time", False)
            and t.id not in gap_exempt_set
            and profiles[t.id]["weekly"] > 0
        ]
        hourly_reserve_report = {}
        for d in days:
            hourly_reserve_report[d] = {}
            for p in range(2, P):
                avail_names = []
                for t in elig_reserve_teachers:
                    b_set = busy.get(t.id, {}).get(d, set())
                    if b_set and min(b_set) < p < max(b_set) and p not in b_set:
                        avail_names.append({"id": t.id, "name": t.name, "branch": t.branch})
                hourly_reserve_report[d][p] = avail_names

        categorical_fairness_report = []
        for t in elig_reserve_teachers:
            prof = profiles[t.id]
            t_g = gap_report.get(t.id, 0)
            c_min = prof.get("cat_min_gaps", 0)
            c_max = prof.get("cat_max_gaps", 3)
            categorical_fairness_report.append({
                "id": t.id,
                "name": t.name,
                "branch": t.branch,
                "load": prof.get("weekly", 0),
                "openSlots": prof.get("open_slots", 0),
                "freeSlots": prof.get("free_slots", 0),
                "openDays": prof.get("num_avail_days", len(days)),
                "activeDays": sum(1 for d in days if busy.get(t.id, {}).get(d)),
                "categoryId": prof.get("cat_id", ""),
                "categoryLabel": prof.get("cat_label", ""),
                "targetMinGaps": c_min,
                "targetMaxGaps": c_max,
                "actualGaps": t_g,
                "withinTarget": c_min <= t_g <= c_max,
            })

        total_required = sum(c.hoursPerWeek for cl in classrooms for c in cl.courses)
        return {
            "status": "ok",
            "timetable": timetable,
            "metrics": {
                "totalRequired": total_required,
                "totalAssigned": total_required,
                "unassigned": 0,
                "solveTimeSeconds": round(time.time() - start, 2),
                "totalSchoolGaps": total_gaps,
                "averageSchoolGaps": avg,
                "medianSchoolGaps": median_gaps,
                "teachersAboveMedian": teachers_above_median,
                "teachersAboveAverage": above,
                "fairnessScore": fairness_score,
                "fairnessLabel": fairness_label,
                "fairnessColor": fairness_color,
                "countWithoutFreeDay": len(teachers_without_free_day),
                "teachersWithoutFreeDay": teachers_without_free_day,
                "requestedFreeDayCount": requested_free_day_count,
                "countWithoutHalfDay": len(teachers_without_half_day),
                "teachersWithoutHalfDay": teachers_without_half_day,
                "requestedHalfDayCount": requested_half_day_count,
                "floatingDayRequested": floating_day_req_count,
                "floatingDayFailed": len(floating_day_failed),
                "floatingDayFailedTeachers": floating_day_failed,
                "floatingHalfRequested": floating_half_req_count,
                "floatingHalfFailed": len(floating_half_failed),
                "floatingHalfFailedTeachers": floating_half_failed,
                "hourlyReserveReport": hourly_reserve_report,
                "categoricalFairnessReport": categorical_fairness_report,
                "relaxedRules": relaxed_rules,
                "relaxedRulesCount": len(relaxed_rules),
                "violations": violations,
                "ruleViolations": len(rule_msgs),
                "stage": stage,
                "stageDetails": stage_details,
                "workers": workers,
                "stoppedEarlyByUser": stopped_early,
            },
        }
    except Exception as e:
        update_live_progress(active=False, stageTitle="Hata Oluştu")
        return {"status": "error", "message": "PYTHON KOD HATASI YAKALANDI",
                "detail": str(e),
                "metrics": {"warnings": [f"Hata Mesajı: {e}", "Ayrıntı:", traceback.format_exc()]}}
