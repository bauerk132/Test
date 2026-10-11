#!/usr/bin/env python3
"""Build the rig's SFT dataset from SWE-bench's TRAIN split.

THE SKILL BEING TAUGHT
    Input : a GitHub issue + the source files that need editing.
    Output: one patch in unified-diff format, wrapped in <patch> tags.
    This is exactly what the eval (SWE-bench Verified) asks for, so training and
    testing measure the same skill.

THE FIVE DATA-QUALITY RULES FROM YOUR HANDOFF, AND WHERE THEY LIVE HERE
    1. Repo-disjoint split   -> is_val_repo(): whole repos go to validation, never single rows.
    2. No eval leakage       -> blocked_repos + the assert on train/test repo overlap.
    3. Deduplication         -> norm_hash() on the patch and on the issue text.
    4. Bounded length        -> keep_row(): prompt+answer must fit max_seq_length tokens,
                               otherwise the answer gets cut off and the model learns broken patches.
    5. Reproducible          -> fixed seed + manifest.json listing every count and drop reason.

RUN (Studio terminal, from coding-lab/):
    python data/build_sft.py --selftest                       # 5-second logic test, no downloads
    python data/build_sft.py --n-train 200  --n-val 40 --out data_out/smoke
    python data/build_sft.py --n-train 3000 --n-val 100 --out data_out/pilot

WHAT THIS DOES NOT DO (yet)
    Dedup is exact-match after whitespace/case normalisation. Near-duplicate detection
    (MinHash) is a good upgrade before the full run.
"""
import argparse
import hashlib
import json
import random
import re
import statistics
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.prompts import to_messages  # noqa: E402

REQUIRED_COLUMNS = ("instance_id", "repo", "text", "patch")


def norm_hash(text: str) -> str:
    """Hash of text with whitespace removed and lowercased, so trivial edits don't defeat dedup."""
    return hashlib.sha256(re.sub(r"\s+", "", text).lower().encode()).hexdigest()


def is_val_repo(repo: str, pct: int) -> bool:
    """Deterministically send ~pct% of REPOS to validation. Same repo -> same answer, every run."""
    return int(hashlib.md5(repo.encode()).hexdigest(), 16) % 100 < pct


def patch_shape(patch: str):
    files = re.findall(r"^diff --git a/(\S+) b/", patch, re.MULTILINE)
    changed = sum(
        1 for line in patch.splitlines()
        if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
    )
    return files, changed


def keep_row(row: dict, count_tokens, a) -> tuple[bool, str]:
    """Return (keep?, reason-if-dropped). Cheap checks first so we tokenize as little as possible."""
    patch, text = row["patch"], row["text"]
    if not patch or not patch.lstrip().startswith("diff --git"):
        return False, "patch missing or not a diff"
    files, changed = patch_shape(patch)
    if not 1 <= len(files) <= a.max_files:
        return False, f"patch touches {len(files)} files (allowed 1-{a.max_files})"
    if changed > a.max_changed_lines:
        return False, f"patch changes >{a.max_changed_lines} lines"
    if len(text) > a.max_seq_length * 6:          # cheap pre-check: ~4 chars/token, 6 leaves slack
        return False, "prompt far too long (char pre-check)"
    prompt_tokens = count_tokens(text)
    answer_tokens = count_tokens(patch) + 12       # +12 for <patch> tags and end-of-turn tokens
    if prompt_tokens + answer_tokens + 40 > a.max_seq_length:   # +40 for system prompt and chat markers
        return False, "too long for max_seq_length"
    row["_prompt_tokens"], row["_total_tokens"] = prompt_tokens, prompt_tokens + answer_tokens
    return True, ""


def select(rows, count_tokens, a, blocked_repos=frozenset()):
    """Walk rows (already shuffled), keep good ones until both quotas are full."""
    train, val = [], []
    seen_patch, seen_issue = set(), set()
    dropped = Counter()
    for row in rows:
        if len(train) >= a.n_train and len(val) >= a.n_val:
            break
        to_val = is_val_repo(row["repo"], a.val_repo_pct)
        if (to_val and len(val) >= a.n_val) or (not to_val and len(train) >= a.n_train):
            dropped["quota already full"] += 1
            continue
        if row["repo"] in blocked_repos:
            dropped["repo is in the eval set"] += 1
            continue
        ok, why = keep_row(row, count_tokens, a)
        if not ok:
            dropped[why] += 1
            continue
        ph = norm_hash(row["patch"])
        ih = norm_hash(row.get("problem_statement") or row["text"][-2000:])
        if ph in seen_patch or ih in seen_issue:
            dropped["duplicate"] += 1
            continue
        seen_patch.add(ph)
        seen_issue.add(ih)
        (val if to_val else train).append(row)
    return train, val, dropped


def to_example(row: dict) -> dict:
    return {
        "instance_id": row["instance_id"],
        "repo": row["repo"],
        "messages": to_messages(row["text"], row["patch"]),
    }


def write_jsonl(path: Path, rows) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(to_example(r), ensure_ascii=False) + "\n")


def token_stats(rows):
    if not rows:
        return {}
    t = sorted(r["_total_tokens"] for r in rows)
    return {"mean": round(statistics.mean(t)), "median": t[len(t) // 2], "p90": t[int(len(t) * 0.9)], "max": t[-1]}


def selftest() -> None:
    """Fake data, real logic: proves the rules work without downloading 1 GB."""
    rnd = random.Random(0)
    rows = []
    for i in range(600):
        repo = f"org{i % 40}/proj{i % 40}"
        patch = f"diff --git a/f{i}.py b/f{i}.py\n--- a/f{i}.py\n+++ b/f{i}.py\n@@ -1 +1 @@\n-a{i}\n+b{i}\n"
        rows.append({"instance_id": f"id{i}", "repo": repo, "text": "issue " + "x" * rnd.randint(100, 30000),
                     "patch": patch, "problem_statement": f"problem {i}"})
    rows.append(dict(rows[0], instance_id="dup"))                               # exact duplicate
    rows.append(dict(rows[1], instance_id="bad", patch="not a diff"))           # malformed patch
    a = argparse.Namespace(n_train=100, n_val=20, val_repo_pct=10, max_files=3,
                           max_changed_lines=200, max_seq_length=4096)
    rnd.shuffle(rows)
    train, val, dropped = select(rows, lambda s: len(s) // 4, a, blocked_repos={"org0/proj0"})
    tr, vr = {r["repo"] for r in train}, {r["repo"] for r in val}
    assert not (tr & vr), "train and validation share a repo"
    assert "org0/proj0" not in tr | vr, "blocked repo leaked in"
    assert len({norm_hash(r["patch"]) for r in train + val}) == len(train + val), "duplicate patch kept"
    assert all(r["_total_tokens"] <= 4096 for r in train + val), "over-length row kept"
    assert len(train) == 100 and len(val) > 0, (len(train), len(val))
    print("build_sft.py self-test OK ->", len(train), "train /", len(val), "val; dropped:", dict(dropped))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--source", default="princeton-nlp/SWE-bench_oracle", help="dataset with train+test splits")
    ap.add_argument("--tokenizer", default="Qwen/Qwen3.5-4B", help="same vocabulary as the model you will train")
    ap.add_argument("--out", default="data_out/pilot")
    ap.add_argument("--n-train", type=int, default=3000)
    ap.add_argument("--n-val", type=int, default=100)
    ap.add_argument("--val-repo-pct", type=int, default=8, help="percent of REPOS held out for validation")
    ap.add_argument("--max-seq-length", type=int, default=8192)
    ap.add_argument("--max-files", type=int, default=3)
    ap.add_argument("--max-changed-lines", type=int, default=150)
    ap.add_argument("--seed", type=int, default=3407)
    a = ap.parse_args()

    if a.selftest:
        selftest()
        return

    from datasets import load_dataset
    from transformers import AutoTokenizer

    print(f"loading {a.source} ...")
    train_ds = load_dataset(a.source, split="train")
    missing = [c for c in REQUIRED_COLUMNS if c not in train_ds.column_names]
    if missing:
        sys.exit(f"STOP: {a.source} has columns {train_ds.column_names}, missing {missing}.\n"
                 f"Run `python data/inspect_hf.py {a.source}` and pick a different --source.")

    test_repos = set(load_dataset(a.source, split="test")["repo"])
    train_repos = set(train_ds["repo"])
    overlap = train_repos & test_repos
    print(f"train repos: {len(train_repos)} | test repos: {len(test_repos)} | overlap: {len(overlap)}")
    # Leakage rule: if this ever prints a non-empty overlap we drop those repos instead of trusting the dataset card.
    tok = AutoTokenizer.from_pretrained(a.tokenizer)
    count = lambda s: len(tok(s, add_special_tokens=False)["input_ids"])  # noqa: E731

    order = list(range(len(train_ds)))
    random.Random(a.seed).shuffle(order)
    rows = (train_ds[i] for i in order)            # lazy: rows are only read (and tokenized) as needed
    train, val, dropped = select(rows, count, a, blocked_repos=frozenset(overlap))
    if len(val) < 30:
        sys.exit(f"STOP: only {len(val)} validation rows. Raise --val-repo-pct or lower filters.")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    write_jsonl(out / "train.jsonl", train)
    write_jsonl(out / "validation.jsonl", val)
    manifest = {
        "source": a.source, "tokenizer": a.tokenizer, "seed": a.seed,
        "args": {k: v for k, v in vars(a).items() if k != "selftest"},
        "counts": {"train": len(train), "validation": len(val)},
        "train_repos": sorted({r["repo"] for r in train}),
        "validation_repos": sorted({r["repo"] for r in val}),
        "repos_shared_between_train_and_val": sorted({r["repo"] for r in train} & {r["repo"] for r in val}),
        "token_stats_train": token_stats(train),
        "dropped_reasons": dict(dropped),
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps({k: manifest[k] for k in ("counts", "token_stats_train", "dropped_reasons")}, indent=2))
    print(f"wrote {out}/train.jsonl, validation.jsonl, manifest.json")


if __name__ == "__main__":
    main()
