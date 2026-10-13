# backend/bench/benchmark.py
"""
Çözücü kıyaslama betiği.

Kullanım (backend klasöründen):
    python bench/benchmark.py --data bench/sample_school.json --timeout 60
    python bench/benchmark.py --solver /yol/solver_eski.py --timeout 60   # başka bir solver sürümüyle karşılaştır

Çözümün kalitesi, çözücünün kendi raporundan BAĞIMSIZ olarak burada yeniden ölçülür;
böylece farklı sürümler aynı ölçütlerle karşılaştırılabilir.
"""
import argparse
import importlib.util
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
sys.path.insert(0, BACKEND)

from models import SolveRequest  # noqa: E402


def load_solver(path):
    if not path:
        import solver  # noqa: WPS433
        return solver
    spec = importlib.util.spec_from_file_location("solver_under_test", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def evaluate(req, timetable):
    days = list(req.settings.days)
    P = int(req.settings.periodsPerDay)
    hc = req.hardConstraints
    max_gaps = hc.maxGapsPerDay if hc else 2
    t_busy = {t.id: {d: [] for d in days} for t in req.teachers}
    hard_errors = []

    # Sınıf: her ders tam saat, çakışma yok
    for c in req.classrooms:
        need = {}
        for co in c.courses:
            need[(co.subject, co.teacherId)] = need.get((co.subject, co.teacherId), 0) + co.hoursPerWeek
        got = {}
        for d in days:
            seen = set()
            for it in timetable.get(c.id, {}).get(d, []):
                if it["period"] in seen:
                    hard_errors.append(f"sınıf çakışması {c.name} {d} {it['period']}")
                seen.add(it["period"])
                key = (it["subject"], it["teacherId"])
                got[key] = got.get(key, 0) + 1
                t_busy[it["teacherId"]][d].append(it["period"])
        if got != need:
            hard_errors.append(f"eksik/fazla ders {c.name}")

    total_gaps = one_hour_days = two_hour_days = gap_viol = teaching_days = 0
    balance_viol = closed_viol = 0
    for t in req.teachers:
        closed = t.unavailable or {}
        hours = []
        for d in days:
            b = t_busy[t.id][d]
            if len(b) != len(set(b)):
                hard_errors.append(f"öğretmen çakışması {t.name} {d}")
            if any(p in closed.get(d, []) for p in b):
                closed_viol += 1
            if not b:
                continue
            teaching_days += 1
            g = (max(b) - min(b) + 1) - len(set(b))
            total_gaps += g
            gap_viol += max(0, g - max_gaps)
            one_hour_days += len(b) == 1
            two_hour_days += len(b) == 2
            hours.append(len(b))
        if hours and not t.isExempt and max(hours) - min(hours) > (hc.maxDailyHourDiff if hc else 2):
            balance_viol += 1
    return {
        "hard_errors": len(hard_errors) + closed_viol,
        "total_teacher_gaps": total_gaps,
        "gap_limit_violations": gap_viol,
        "one_hour_days": one_hour_days,
        "two_hour_days": two_hour_days,
        "balance_violations": balance_viol,
        "teaching_days": teaching_days,
        "examples": hard_errors[:5],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(HERE, "sample_school.json"))
    ap.add_argument("--solver", default=None, help="Karşılaştırılacak solver.py yolu (varsayılan: backend/solver.py)")
    ap.add_argument("--timeout", type=int, default=60)
    ap.add_argument("--out", default=None, help="Sonucu JSON olarak kaydet")
    args = ap.parse_args()

    with open(args.data, encoding="utf-8") as f:
        raw = json.load(f)
    raw.setdefault("hardConstraints", {})["solverTimeout"] = args.timeout
    req = SolveRequest(**raw)

    mod = load_solver(args.solver)
    t0 = time.time()
    res = mod.solve(req)
    wall = time.time() - t0

    report = {"solver": args.solver or "backend/solver.py", "timeout": args.timeout,
              "wall_seconds": round(wall, 1), "status": res.get("status")}
    if res.get("status") == "ok":
        report["stage"] = res["metrics"].get("stage")
        report["solver_rule_violations"] = res["metrics"].get("ruleViolations")
        report.update(evaluate(req, res["timetable"]))
    else:
        report["message"] = res.get("message")
        report["detail"] = res.get("detail")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump({"report": report, "result": res}, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
