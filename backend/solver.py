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
from ortools.sat.python import cp_model
from models import SolveRequest

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
    o = {
        "enforce_max_gaps": bool(get_val(hc, "enforceMaxGaps", True)),
        "max_gaps_per_day": int(get_val(hc, "maxGapsPerDay", 2)),
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

        # Öncelikli tam doldurulacak gün ve son saatler tercihi
        priority_full_day = get_val(t, "priorityFullDay", None)
        if priority_full_day and priority_full_day not in days:
            priority_full_day = None
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

        profiles[t.id] = {
            "weekly": weekly, "exempt": exempt, "closed": closed,
            "hard_cap": hard_cap, "rule_cap": rule_cap,
            "is_part_time": is_part_time,
            "is_admin": is_admin,
            "num_avail_days": num_avail_days,
            "open_days": open_days,
            "priority_full_day": priority_full_day,
            "fill_late_hours": fill_late_hours,
            "free_day_pref": free_day_pref,
            "free_half_pref": free_half_pref,
        }
    return profiles, notes


def detect_workers():
    """CP-SAT işçi sayısı: gerçek CPU kotası (konteyner/cgroup dahil). SOLVER_WORKERS ile ezilebilir."""
    env = os.environ.get("SOLVER_WORKERS")
    if env:
        try:
            return max(1, int(env))
        except ValueError:
            pass
    try:
        n = len(os.sched_getaffinity(0))
    except (AttributeError, OSError):
        n = os.cpu_count() or 1
    try:  # Linux cgroup v2 CPU kotası (Render, Docker vb.)
        with open("/sys/fs/cgroup/cpu.max") as f:
            quota, period = f.read().split()[:2]
        if quota != "max":
            n = min(n, max(1, int(float(quota) / float(period))))
    except (OSError, ValueError):
        pass
    return max(1, min(n, 16))


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------
def build_model(use_consecutive, activities, classrooms, teachers, days, P, profiles, o, pinned_slots=None, allow_soft_floating=False, lunch_after=None):
    """
    Tek model kurar. Dönüş: (model, x, terms, warnings)
      x[a_id, gün, saat]  : aktivitenin o gün o saatte BAŞLAMASI
      terms[kademe]       : ilgili kademenin amaç terimleri (rules / gaps / prefs)
    """
    model = cp_model.CpModel()
    num_days = len(days)
    terms = {"rules": [], "gaps": [], "prefs": []}
    warnings = []

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

    # ---- Kilitli hücreler
    for pin in (pinned_slots or []):
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

    # ---- C kademesi: fen/matematik derslerinin son iki saate kalmaması
    if o["avoid_stem_late"]:
        late_from = max(2, P - 1)
        for a in activities:
            if is_stem(a["subject"]):
                for d, p in opts[a["id"]]:
                    if p + a["duration"] - 1 >= late_from:
                        terms["prefs"].append(o["stem_late_penalty"] * x[a["id"], d, p])

    # ---- Öğretmen kuralları
    for t in teachers:
        t_acts = by_teacher.get(t.id, [])
        if not t_acts:
            continue
        prof = profiles[t.id]
        soft_rules = not prof["exempt"]
        need_gaps = (prof["is_part_time"] or o["minimize_gaps"] or (soft_rules and o["enforce_max_gaps"]))

        has_by_day, hours_by_day = {}, {}
        busy_cells = {}
        for d in days:
            busy = {}
            for p in range(1, P + 1):
                cov = cover(t_acts, d, p)
                if not cov:
                    busy[p] = 0
                elif len(cov) == 1:
                    busy[p] = cov[0]
                else:
                    b = model.NewBoolVar(f"b_{t.id}_{d}_{p}")
                    model.Add(sum(cov) == b)  # aynı saatte en fazla bir ders
                    busy[p] = b
                busy_cells[d, p] = busy[p]
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

            # 📌 ÖNCELİKLİ TAM DOLDURULACAK GÜN & SON SAATLER
            if prof.get("priority_full_day") == d:
                # O gün olabildiğince çok ders koyulması için güçlü negatif ceza (maksimize et)
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
                    model.AddImplication(sv, h)
                    s[p] = sv
                for p in range(P - 1, 0, -1):
                    ev = model.NewBoolVar(f"e_{t.id}_{d}_{p}")
                    model.Add(ev >= e[p + 1])
                    model.Add(ev >= busy[p])
                    model.AddImplication(ev, h)
                    e[p] = ev
                day_gaps = sum(s.values()) + sum(e.values()) - P * h - hours

                if prof["is_part_time"]:
                    terms["rules"].append(2 * day_gaps)  # 1-2 gün gelenler penceresiz olmalı
                elif o["minimize_gaps"]:
                    terms["gaps"].append(day_gaps)
                    extra = model.NewIntVar(0, P, f"gx_{t.id}_{d}")
                    model.Add(extra >= day_gaps - 1)
                    terms["gaps"].append(2 * extra)
                if soft_rules and o["enforce_max_gaps"]:
                    gx = model.NewIntVar(0, P, f"gex_{t.id}_{d}")
                    model.Add(gx >= day_gaps - o["max_gaps_per_day"])
                    terms["rules"].append(gx)

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

        # 1-2 gün gelen istisna öğretmenler: asgari gün
        if prof["is_part_time"] and prof["weekly"] > 0:
            min_days_needed = max(1, math.ceil(prof["weekly"] / prof["hard_cap"]))
            extra_days = model.NewIntVar(0, num_days, f"edays_{t.id}")
            model.Add(extra_days >= sum(has_by_day[d] for d in days) - min_days_needed)
            terms["rules"].append(extra_days)

        # Standart öğretmenler: boş gün teşviki (B kademesi)
        if soft_rules and prof["weekly"] > 0:
            min_days_std = min(num_days, max(1, math.ceil(prof["weekly"] / prof["rule_cap"])))
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

    # ---- Öğretmen-sınıf bitişiklik / günlük yoğunluk kuralı
    if use_consecutive:
        for (t_id, c_id), pair_acts in by_pair.items():
            if len(pair_acts) < 2:
                continue  # tek blok zaten bitişik ve ≤ 2 saat
            # 🌟 İstisna öğretmenler (1-2 gün gelen / <17 saat dersi olanlar): sert kısıtlardan (aynı sınıfa 3 saat girememe vb.) MUAFTIR!
            if profiles.get(t_id, {}).get("is_part_time", False) or profiles.get(t_id, {}).get("exempt", False):
                continue  
            weekly = sum(a["duration"] for a in pair_acts)
            has_single = any(a["duration"] == 1 for a in pair_acts)
            for d in days:
                day_sum = sum(a["duration"] * v for a in pair_acts for v in starts_on(a, d))
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

    # ---- Aynı sınıfta aynı ders günde en fazla 1-2 kez başlar (istisna öğretmenler muaf)
    for c in classrooms:
        by_course = {}
        for a in by_class.get(c.id, []):
            by_course.setdefault(a["course_key"], []).append(a)
        for sub_acts in by_course.values():
            t_prof = profiles.get(sub_acts[0]["teacher_id"], {})
            if t_prof.get("is_part_time", False) or t_prof.get("exempt", False):
                continue  # İstisna öğretmenlerde aynı sınıfa aynı gün serbestçe girebilme esnekliği
            avail_days = t_prof.get("num_avail_days", num_days)
            limit = 1 if len(sub_acts) <= num_days else 2
            if limit >= len(sub_acts):
                continue
            for d in days:
                model.Add(sum(v for a in sub_acts for v in starts_on(a, d)) <= limit)

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

    return model, x, terms, warnings


# --------------------------------------------------------------------------
# Çözücü çalıştırma
# --------------------------------------------------------------------------
class _Progress(cp_model.CpSolverSolutionCallback):
    """Son iyileşme zamanını izler (durgunlukta erken durdurma için)."""

    def __init__(self):
        super().__init__()
        self.best = None
        self.last_improve = time.time()
        self.solutions = 0

    def on_solution_callback(self):
        self.solutions += 1
        try:
            obj = self.ObjectiveValue()
            if self.best is None or obj < self.best - 1e-9:
                self.best = obj
                self.last_improve = time.time()
        except Exception:
            pass


def run_solver(model, time_limit, workers, patience=None):
    solver = cp_model.CpSolver()
    prm = solver.parameters
    prm.max_time_in_seconds = max(1.0, float(time_limit))
    prm.num_workers = workers
    prm.log_search_progress = os.environ.get("SOLVER_LOG") == "1"

    # 🚀 ADIM 2: CP-SAT LNS & Search Parameters Tuning
    # Linearization level 2: Boolean kısıtları doğrusallaştırıp LP relaksasyonlarını ve kesme düzlemlerini devreye sokar
    prm.linearization_level = 2
    # Probing level 2: Çıkarım grafikleri (implication graphs) ve kök düğüm indirgemeleri için derin tarama
    prm.cp_model_probing_level = 2
    cb = _Progress()
    done = threading.Event()
    if patience:
        def watch():
            while not done.wait(0.5):
                if cb.best is not None and time.time() - cb.last_improve > patience:
                    solver.stop_search()
                    return
        threading.Thread(target=watch, daemon=True).start()
    try:
        status = solver.Solve(model, cb)
    finally:
        done.set()
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
        for i in range(n):
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
            a = activities[a_id]
            for off in range(a["duration"]):
                timetable[a["class_id"]][d].append(
                    {"period": p + off, "subject": a["subject"], "teacherId": a["teacher_id"]})
                if a["teacher_id"] in busy:
                    busy[a["teacher_id"]][d].add(p + off)
    for cid in timetable:
        for d in days:
            timetable[cid][d].sort(key=lambda it: it["period"])
    return timetable, busy


def audit(busy, teachers, profiles, days, o):
    """Çözüm üzerinden bağımsız denetim: kural ihlallerini sayar ve açıklar."""
    msgs = []
    gap_report, total_gaps = {}, 0
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
                if not prof["exempt"] and not prof.get("is_part_time", False) and o["enforce_max_gaps"] and g > o["max_gaps_per_day"]:
                    msgs.append(f"{t.name} – {d}: {g} boşluk (sınır {o['max_gaps_per_day']}).")
        gap_report[t.name] = t_gaps
        total_gaps += t_gaps
        if not prof["exempt"] and not prof.get("is_part_time", False) and o["enforce_daily_balance"] and prof["weekly"] > 0:
            active = [d for d in days if hours[d] > 0]
            adaptive_min = min(o["min_daily_hours"], prof["weekly"])
            for d in active:
                if hours[d] < adaptive_min:
                    msgs.append(f"{t.name} – {d}: {hours[d]} saat (asgari {adaptive_min}).")

        # Kayan gün tercihi denetimi
        f_day = prof.get("free_day_pref", "none")
        active_days = [d for d in days if hours[d] > 0]
        if f_day == "floating_1_day" and len(active_days) > len(days) - 1:
            msgs.append(f"{t.name}: 1 gün kayan boş gün tercihi yerine {len(active_days)} gün ders yerleşti.")
        elif f_day == "floating_2_days" and len(active_days) > len(days) - 2:
            msgs.append(f"{t.name}: 2 gün kayan boş gün tercihi yerine {len(active_days)} gün ders yerleşti.")
    return msgs, gap_report, total_gaps


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
    try:
        start = time.time()
        teachers, classrooms = request.teachers, request.classrooms
        days = list(request.settings.days)
        P = int(request.settings.periodsPerDay)
        o = read_options(request)
        total_budget = max(5.0, o["timeout"])
        pinned_slots = getattr(request, "pinnedSlots", None) or getattr(request, "pinned_slots", None) or []
        workers = detect_workers()

        def remaining():
            return total_budget - (time.time() - start)

        activities = build_activities(classrooms)
        profiles, notes = teacher_profiles(teachers, activities, days, P, o)
        warnings_extra = []

        # ---- Aşama 0: geçerli çözüm (idareciler dahil tek birleşik model)
        use_consec = o["enforce_consecutive"]
        allow_soft_float = False
        lunch_after = getattr(request.settings, "lunchBreakAfter", None)
        model, x, terms, build_warn = build_model(use_consec, activities, classrooms, teachers,
                                                  days, P, profiles, o, pinned_slots,
                                                  allow_soft_floating=allow_soft_float,
                                                  lunch_after=lunch_after)
        print(f"[solver] model kuruldu {time.time() - start:.1f}s, işçi={workers}, "
              f"değişken={len(model.Proto().variables)}", flush=True)
        phase0_time = remaining() if o["stop_at_first"] else min(12.0, max(3.0, remaining() * 0.15))
        solver, st, _ = run_solver(model, phase0_time, workers)
        print(f"[solver] temel (bitişiklik={'açık' if use_consec else 'kapalı'}, sert_kayan={'açık' if not allow_soft_float else 'kapalı'}): "
              f"{solver.StatusName(st)} {solver.WallTime():.1f}s", flush=True)

        if not ok(st) and (use_consec or not allow_soft_float) and st in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
            if use_consec:
                use_consec = False
                warnings_extra.append("Ders-sınıf bitişiklik kuralıyla çözüm bulunamadı; kural kapatılarak çözüldü.")
            else:
                allow_soft_float = True
                warnings_extra.append("Sert kayan boş gün kısıtlarıyla çözüm bulunamadı; kısıtlar yumuşatılarak çözüldü.")

            model, x, terms, build_warn = build_model(use_consec, activities, classrooms, teachers,
                                                      days, P, profiles, o, pinned_slots,
                                                      allow_soft_floating=allow_soft_float,
                                                      lunch_after=lunch_after)
            phase0_retry = remaining() if o["stop_at_first"] else min(15.0, max(4.0, remaining() * 0.25))
            solver, st, _ = run_solver(model, phase0_retry, workers)
            print(f"[solver] temel deneme 1 (bitişiklik={'açık' if use_consec else 'kapalı'}, sert_kayan={'açık' if not allow_soft_float else 'kapalı'}): "
                  f"{solver.StatusName(st)} {solver.WallTime():.1f}s", flush=True)

        if not ok(st) and not allow_soft_float and st in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
            allow_soft_float = True
            warnings_extra.append("Sert kayan boş gün kısıtlarıyla çözüm bulunamadı; kısıtlar yumuşatılarak çözüldü.")
            model, x, terms, build_warn = build_model(False, activities, classrooms, teachers,
                                                      days, P, profiles, o, pinned_slots,
                                                      allow_soft_floating=True,
                                                      lunch_after=lunch_after)
            phase0_retry2 = remaining() if o["stop_at_first"] else min(15.0, max(4.0, remaining() * 0.25))
            solver, st, _ = run_solver(model, phase0_retry2, workers)
            print(f"[solver] temel deneme 2 (bitişiklik=kapalı, sert_kayan=kapalı): "
                  f"{solver.StatusName(st)} {solver.WallTime():.1f}s", flush=True)

        if not ok(st):
            last_status = solver.StatusName(st)
            diag_issues = diagnose_infeasibility(teachers, classrooms, activities, days, P, profiles, pinned_slots=pinned_slots)
            if st == cp_model.INFEASIBLE:
                msg = "ÇÖZÜM YOK: Belirlenen kısıtlar ve kapalı saatler birbiriyle çelişiyor."
                tip = "Aşağıdaki kısıt ve çakışma nedenlerini kontrol edin:"
            else:
                msg = "ÇÖZÜM BULUNAMADI: Belirlenen süre içinde çözüm tamamlanamadı."
                tip = "Optimizasyon süresini artırın veya aşağıdaki kısıtları gözden geçirin:"
            warnings_list = [tip] + (diag_issues if diag_issues else ["Öğretmenlerin kapalı saatlerini ve haftalık ders yüklerini kontrol edin."]) + notes
            detail_msg = msg + (" Neden: " + "; ".join(diag_issues[:2]) if diag_issues else "")
            return {
                "status": "error",
                "message": msg,
                "detail": detail_msg,
                "metrics": {"warnings": warnings_list + [f"Çözücü durumu: {last_status}"]}
            }

        best_solver = solver
        stage = "temel"
        stage_details = []

        # ⚡ İLK GEÇERLİ ÇÖZÜMDE DUR: İyileştirme kademeleri atlanır, saniyeler içinde dönülür
        if o["stop_at_first"]:
            print(f"[solver] 'İlk geçerli çözümde dur' devrede. İyileştirme kademeleri atlandı. Geçen süre: {time.time() - start:.2f}s", flush=True)
            stage = "ilk_gecerli"
        else:
            # 🚀 ADIM 1: Tek Geçişli Ağırlıklandırılmış Çok Amaçlı LNS Optimizasyonu
            rem = remaining()
            if rem >= 2.0:
                weighted_terms = []
                if terms["rules"]:
                    weighted_terms.extend(WEIGHT_RULES * r for r in terms["rules"])
                if terms["gaps"]:
                    weighted_terms.extend(WEIGHT_GAPS * g for g in terms["gaps"])
                if terms["prefs"]:
                    weighted_terms.extend(WEIGHT_PREFS * p for p in terms["prefs"])

                if weighted_terms:
                    combined_obj = sum(weighted_terms)
                    model.Minimize(combined_obj)
                    hint_from(model, best_solver)

                    patience = min(45.0, max(15.0, rem * 0.6))
                    opt_solver, opt_st, cb = run_solver(model, rem, workers, patience)
                    if ok(opt_st):
                        best_solver = opt_solver
                        stage = "iyileştirilmiş"
                        final_val = int(round(opt_solver.ObjectiveValue()))
                        print(f"[solver] çok amaçlı LNS optimizasyonu tamamlandı: {opt_solver.StatusName(opt_st)} "
                              f"{opt_solver.WallTime():.1f}s değer={final_val}", flush=True)
                        stage_details.append({
                            "tier": "Çok Amaçlı LNS (Boşluk & Kural)",
                            "value": final_val,
                            "status": opt_solver.StatusName(opt_st),
                            "seconds": round(opt_solver.WallTime(), 1)
                        })
                    else:
                        print(f"[solver] optimizasyonda yeni çözüm bulunamadı, temel çözüm korundu: "
                              f"{opt_solver.StatusName(opt_st)}", flush=True)
                    model.ClearObjective()

        timetable, busy = extract(best_solver, x, activities, classrooms, teachers, days, P)
        rule_msgs, gap_report, total_gaps = audit(busy, teachers, profiles, days, o)

        # Adalet Skalası: Haftalık pencere (boşluk) sayısı 3 ve üzeri olan öğretmenler üzerinden değerlendirilir
        three_plus_teachers = [
            t for t in teachers
            if not profiles[t.id]["exempt"]
            and not profiles[t.id]["is_part_time"]
            and profiles[t.id]["weekly"] > 0
            and gap_report.get(t.name, 0) >= 3
        ]
        three_plus_count = len(three_plus_teachers)

        # Standard aktif öğretmenler (idareciler ve muaf olanlar hariç)
        standard_active_teachers = [
            t for t in teachers
            if not profiles[t.id]["exempt"]
            and not profiles[t.id].get("is_part_time", False)
            and profiles[t.id]["weekly"] > 0
        ]
        all_gaps = sorted([gap_report.get(t.name, 0) for t in standard_active_teachers])
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
            [{"id": t.id, "name": t.name, "gaps": gap_report.get(t.name, 0)}
             for t in standard_active_teachers
             if gap_report.get(t.name, 0) > median_gaps],
            key=lambda it: it["gaps"], reverse=True
        )

        above = sorted(
            [{"id": t.id, "name": t.name, "gaps": gap_report.get(t.name, 0)}
             for t in standard_active_teachers
             if gap_report.get(t.name, 0) >= 3 or gap_report.get(t.name, 0) > avg],
            key=lambda it: it["gaps"], reverse=True
        )

        # Öğretmenler Odası Adalet Skoru (Medyan, sağa çarpıklık ve uç değer cezaları)
        fairness_score = 100
        fairness_label = "Mükemmel Adalet"
        fairness_color = "emerald"

        if standard_count > 0:
            variance = sum((g - avg) ** 2 for g in all_gaps) / standard_count
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
        if rule_msgs:
            violations.append(f"Kural ihlali kalan {len(rule_msgs)} durum (süre/sıkışıklık nedeniyle gevşetildi):")
            violations.extend(rule_msgs[:30])

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
                "violations": violations,
                "ruleViolations": len(rule_msgs),
                "stage": stage,
                "stageDetails": stage_details,
                "workers": workers,
            },
        }
    except Exception as e:
        return {"status": "error", "message": "PYTHON KOD HATASI YAKALANDI",
                "detail": str(e),
                "metrics": {"warnings": [f"Hata Mesajı: {e}", "Ayrıntı:", traceback.format_exc()]}}
