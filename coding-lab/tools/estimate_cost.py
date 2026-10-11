#!/usr/bin/env python3
"""Cost calculator for the coding-lab training plan.

WHY THIS EXISTS
    Every number below is an ESTIMATE until your smoke test gives you a measured
    tokens/second. Run the smoke test, read "train_tokens_per_second" (or compute
    tokens / seconds from the log), then re-run this script with --tps and --rate
    set to real values. That is how you turn a guess into a budget.

USAGE
    python tools/estimate_cost.py                       # print the default plan
    python tools/estimate_cost.py --avg-tokens 3000     # shorter examples
    python tools/estimate_cost.py --spot-discount 0     # pretend spot is unavailable

WHAT YOU MUST VERIFY YOURSELF
    RATE_* are planning rates, not quotes. Prices differ by region and change.
    Check ml.g5.xlarge and ml.g6e.xlarge "Training" prices in the AWS Pricing
    Calculator for YOUR region and edit the two constants (or pass --g5-rate /
    --g6e-rate).
"""
import argparse
from dataclasses import dataclass

ALARMS = (15, 22, 25)  # dollars, from your handoff


@dataclass
class Phase:
    name: str
    hours: float
    rate: float          # $/hour on-demand
    spot_ok: bool        # can this phase use managed spot (resumable from checkpoints)?

    def usd(self, spot_discount: float) -> float:
        cost = self.hours * self.rate
        return cost * (1 - spot_discount) if self.spot_ok else cost


def train_hours(examples: int, avg_tokens: int, tps: float, overhead_h: float) -> float:
    """Hours to train `examples` examples for one epoch.

    tokens = examples * avg_tokens; seconds = tokens / tokens-per-second.
    Overhead covers container start, model download, and saving the adapter.
    """
    return examples * avg_tokens / tps / 3600 + overhead_h


def build_plan(a):
    g5, g6e = a.g5_rate, a.g6e_rate
    ov = a.overhead
    rig, agent_a = [], []

    # ---- Rig: Qwen3.5-4B on ml.g5.xlarge (24 GB A10G). bf16 LoRA needs ~10 GB. ----
    rig += [
        Phase("R1 baseline eval (500 tasks)", a.eval_h_4b, g5, False),
        Phase("R2 smoke test (60 steps)", train_hours(60 * 16, a.avg_tokens, a.tps_4b, ov), g5, False),
        Phase("R3 pilot SFT (3,000 ex)", train_hours(3000, a.avg_tokens, a.tps_4b, ov), g5, True),
        Phase("R4 post-pilot eval", a.eval_h_4b, g5, False),
    ]

    # ---- Agent A: Qwen3.5-9B on ml.g6e.xlarge (48 GB L40S). bf16 LoRA is ~22 GB by
    # Unsloth's own figure, which is too tight on a 24 GB A10G once you add 8K-token
    # sequences, so the 9B uses the bigger GPU. QLoRA 4-bit is discouraged for Qwen3.5. ----
    agent_a += [
        Phase("A1 baseline eval (500 tasks)", a.eval_h_9b, g6e, False),
        Phase("A2 pilot SFT (3,000 ex)", train_hours(3000, a.avg_tokens, a.tps_9b, ov), g6e, True),
        Phase("A3 eval after pilot", a.eval_h_9b, g6e, False),
        Phase(f"A4 full SFT ({a.full_examples:,} ex, fresh from base)",
              train_hours(a.full_examples, a.avg_tokens, a.tps_9b, ov), g6e, True),
        Phase("A5 eval after full SFT", a.eval_h_9b, g6e, False),
        Phase("A6 merge + GGUF export", 0.5, g5, False),
    ]
    return rig, agent_a


def show(title, phases, spot_discount):
    print(f"\n{title}")
    print(f"{'phase':<46}{'hours':>7}{'on-demand':>11}{'with spot':>11}")
    tot_od = tot_sp = 0.0
    for p in phases:
        od, sp = p.usd(0), p.usd(spot_discount)
        tot_od += od
        tot_sp += sp
        tag = "" if p.spot_ok else "  (no spot)"
        print(f"{p.name:<46}{p.hours:>7.2f}{od:>11.2f}{sp:>11.2f}{tag}")
    print(f"{'TOTAL':<46}{'':>7}{tot_od:>11.2f}{tot_sp:>11.2f}")
    for label, total in (("on-demand", tot_od), ("with spot", tot_sp)):
        crossed = [f"${x}" for x in ALARMS if total > x]
        print(f"  {label}: alarms crossed = {crossed or 'none'}; headroom under $25 = ${25 - total:.2f}")
    return tot_od, tot_sp


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--g5-rate", type=float, default=1.41, help="$/h ml.g5.xlarge training (planning value; verify)")
    ap.add_argument("--g6e-rate", type=float, default=2.60, help="$/h ml.g6e.xlarge training (planning value; verify)")
    ap.add_argument("--avg-tokens", type=int, default=4500, help="avg tokens per training example after filtering")
    ap.add_argument("--tps-4b", type=float, default=2500, help="training tokens/s for the 4B on A10G (ESTIMATE)")
    ap.add_argument("--tps-9b", type=float, default=2000, help="training tokens/s for the 9B on L40S (ESTIMATE)")
    ap.add_argument("--overhead", type=float, default=0.3, help="fixed hours per training job")
    ap.add_argument("--eval-h-4b", type=float, default=0.75, help="hours per 500-task eval job, 4B")
    ap.add_argument("--eval-h-9b", type=float, default=1.0, help="hours per 500-task eval job, 9B")
    ap.add_argument("--full-examples", type=int, default=8000, help="examples in the full SFT run")
    ap.add_argument("--spot-discount", type=float, default=0.65, help="managed spot discount (0 disables)")
    a = ap.parse_args()

    rig, agent_a = build_plan(a)
    print(f"Assumptions: {a.avg_tokens} tokens/example, {a.tps_4b:.0f} tok/s (4B), {a.tps_9b:.0f} tok/s (9B), "
          f"g5 ${a.g5_rate}/h, g6e ${a.g6e_rate}/h, spot discount {a.spot_discount:.0%}")
    show("RIG  Qwen3.5-4B  (learn the pipeline once)", rig, a.spot_discount)
    show("AGENT A  Qwen3.5-9B  (no GRPO yet)", agent_a, a.spot_discount)

    # Two costs that are NOT training and are the real way to blow a budget:
    print("\nNot in the totals (avoid them):")
    print(f"  one ml.g5.xlarge endpoint left up for a 730 h month  = ${a.g5_rate * 730:,.0f}")
    print(f"  a Studio JupyterLab space on ml.t3.medium, 24/7      ~ $36/month (set idle shutdown)")


if __name__ == "__main__":
    main()
