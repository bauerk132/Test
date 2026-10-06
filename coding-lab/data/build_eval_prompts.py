#!/usr/bin/env python3
"""Build the eval prompt file: the 500 SWE-bench Verified tasks, in the SAME format as training.

WHY VERIFIED
    500 tasks is more than the ~310 paired tasks a 5-point gain needs to be trustworthy
    (see the eval-size chart in the report). Each task was checked by humans to be solvable.

IMPORTANT HONESTY NOTE
    With the "oracle" source, the prompt already contains the files that must be edited.
    That measures "can the model write the right patch" and hides "can it find the right
    file". Scores are therefore NOT comparable to public SWE-bench leaderboard numbers.
    That is fine: you compare base vs tuned on the same prompts, which is what the plan needs.

RUN:  python data/build_eval_prompts.py --out data_out/eval_verified.jsonl
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.prompts import to_messages  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="princeton-nlp/SWE-bench_oracle",
                    help="must be the SAME source you trained on, so prompts match")
    ap.add_argument("--verified", default="SWE-bench/SWE-bench_Verified")
    ap.add_argument("--out", default="data_out/eval_verified.jsonl")
    a = ap.parse_args()

    from datasets import load_dataset

    verified_ids = set(load_dataset(a.verified, split="test")["instance_id"])
    test = load_dataset(a.source, split="test")
    by_id = {r["instance_id"]: r for r in test if r["instance_id"] in verified_ids}
    missing = sorted(verified_ids - set(by_id))
    if missing:
        print(f"WARNING: {len(missing)} Verified tasks are not in {a.source}: {missing[:5]} ...")
    if len(by_id) < 400:
        sys.exit(f"STOP: only {len(by_id)} of {len(verified_ids)} tasks matched. Check --source / --verified.")

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for iid in sorted(by_id):
            f.write(json.dumps({"instance_id": iid, "repo": by_id[iid]["repo"],
                                "messages": to_messages(by_id[iid]["text"])}, ensure_ascii=False) + "\n")
    print(f"wrote {len(by_id)} eval prompts -> {out}")


if __name__ == "__main__":
    main()
