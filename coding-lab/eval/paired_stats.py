#!/usr/bin/env python3
"""Did the tuned model really beat the base model? Paired comparison of two sb-cli reports.

WHY "PAIRED"
    Both models attempted the SAME tasks. A task both solve (or both fail) tells you
    nothing about the difference. Only tasks where the two DISAGREE carry information,
    so we count those and ask: if the models were equally good, how likely is a split
    this lopsided? (That is McNemar's exact test.)

USAGE
    python eval/paired_stats.py base_report.json tuned_report.json
    python eval/paired_stats.py --selftest

INPUT: the report JSON that `sb-cli get-report` downloads. It must contain a list under
"resolved_ids" (tasks whose tests passed). The task universe is every id found in the
report's *_ids lists; use --n 500 to force the size if your report omits unresolved ids.
"""
import argparse
import json
import math
import random
import sys


def load(path: str, n_override: int):
    rep = json.load(open(path))
    if "resolved_ids" not in rep:
        sys.exit(f"{path}: no 'resolved_ids'. Keys found: {sorted(rep)[:15]}")
    solved = set(rep["resolved_ids"])
    universe = set(solved)
    for key, val in rep.items():
        if key.endswith("_ids") and isinstance(val, list):
            universe |= set(val)
    if n_override and len(universe) < n_override:
        print(f"note: report lists {len(universe)} ids; treating the other {n_override - len(universe)} as unsolved")
    return solved, universe


def mcnemar_exact(gains: int, losses: int) -> float:
    """Two-sided exact p-value: P(split at least this lopsided | coin flip on each disagreement)."""
    n = gains + losses
    if n == 0:
        return 1.0
    k = min(gains, losses)
    tail = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def bootstrap_ci(pairs, iters=10000, seed=1):
    """95% CI for (tuned pass rate - base pass rate) by resampling tasks with replacement."""
    rnd = random.Random(seed)
    n = len(pairs)
    diffs = []
    for _ in range(iters):
        s = 0
        for _ in range(n):
            b, t = pairs[rnd.randrange(n)]
            s += t - b
        diffs.append(100.0 * s / n)
    diffs.sort()
    return diffs[int(0.025 * iters)], diffs[int(0.975 * iters)]


def compare(base_solved, tuned_solved, universe, n_total=0):
    ids = sorted(universe)
    pairs = [(int(i in base_solved), int(i in tuned_solved)) for i in ids]
    pairs += [(0, 0)] * max(0, n_total - len(ids))
    n = len(pairs)
    gains = sum(1 for b, t in pairs if t and not b)
    losses = sum(1 for b, t in pairs if b and not t)
    base_rate, tuned_rate = 100.0 * sum(b for b, _ in pairs) / n, 100.0 * sum(t for _, t in pairs) / n
    lo, hi = bootstrap_ci(pairs)
    return {"n": n, "base_pct": round(base_rate, 1), "tuned_pct": round(tuned_rate, 1),
            "delta_points": round(tuned_rate - base_rate, 1), "ci95_points": (round(lo, 1), round(hi, 1)),
            "tuned_only_solved": gains, "base_only_solved": losses, "p_value": round(mcnemar_exact(gains, losses), 4)}


def verdict(r) -> str:
    lo, hi = r["ci95_points"]
    if r["delta_points"] >= 5 and lo > 0:
        return "PASS: gain is at least 5 points AND the 95% interval excludes zero."
    if lo > 0:
        return "REAL BUT SMALL: the tuned model is better, but the gain is under 5 points."
    if hi < 0:
        return "WORSE: the tuned model is reliably worse. Do not proceed; inspect the data."
    return "NOT PROVEN: the interval includes zero. More tasks or more/better data would be needed."


def selftest():
    universe = {f"t{i}" for i in range(500)}
    base = {f"t{i}" for i in range(50)}                      # 10% solved
    tuned = base | {f"t{i}" for i in range(50, 90)}          # +40 gained, 0 lost
    r = compare(base, tuned, universe)
    assert r["delta_points"] == 8.0 and r["tuned_only_solved"] == 40 and r["p_value"] < 0.001, r
    assert verdict(r).startswith("PASS")
    same = compare(base, base, universe)
    assert same["delta_points"] == 0 and same["p_value"] == 1.0 and verdict(same).startswith("NOT PROVEN")
    assert abs(mcnemar_exact(10, 0) - 2 / 1024) < 1e-12
    print("paired_stats.py self-test OK:", r)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("reports", nargs="*", help="base_report.json tuned_report.json")
    ap.add_argument("--n", type=int, default=500, help="total tasks in the eval (Verified = 500)")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if len(a.reports) != 2:
        ap.error("give exactly two report files: base first, tuned second")
    (b_solved, b_all), (t_solved, t_all) = (load(p, a.n) for p in a.reports)
    r = compare(b_solved, t_solved, b_all | t_all, a.n)
    print(json.dumps(r, indent=2))
    print(verdict(r))


if __name__ == "__main__":
    main()
