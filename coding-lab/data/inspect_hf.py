#!/usr/bin/env python3
"""Look at a Hugging Face dataset BEFORE you transform it.

WHY
    Every dataset has its own column names and its own license. Guessing either one
    is how people train on the wrong field or ship something they may not use.
    This prints, for each dataset: license (from the dataset card), splits, row
    counts, column names, and the first row cut down to 300 characters per field.

RUN (in your SageMaker Studio terminal, from coding-lab/):
    pip install -r requirements-data.txt
    python data/inspect_hf.py                        # the three the rig needs
    python data/inspect_hf.py nebius/SWE-rebench     # any other dataset id

WHAT TO CHECK IN THE OUTPUT
    1. Does the SOURCE dataset have columns: instance_id, repo, text, patch ?
    2. Does it have BOTH a "train" and a "test" split?
    3. Is the license one you accept? (SWE-bench data is derived from GitHub repos;
       treat it as research/personal use unless you have read the card.)
"""
import sys

DEFAULTS = [
    "princeton-nlp/SWE-bench_oracle",     # prompt = issue + the exact files that need editing
    "princeton-nlp/SWE-bench_bm25_13K",   # prompt = issue + retrieved files (harder, more realistic)
    "SWE-bench/SWE-bench_Verified",       # the 500 human-checked eval tasks
]


def short(value, n=300):
    text = repr(value) if not isinstance(value, str) else value
    return text if len(text) <= n else text[:n] + f"... [{len(text)} chars]"


def inspect(name: str) -> None:
    from datasets import get_dataset_config_names, get_dataset_split_names, load_dataset, load_dataset_builder
    from huggingface_hub import HfApi

    print("=" * 78)
    print(name)
    try:
        info = HfApi().dataset_info(name)
        card = info.card_data
        print("  license :", (card.get("license") if card else None) or "NOT STATED on the card")
        print("  gated   :", info.gated, "| last modified:", info.last_modified)
    except Exception as e:  # noqa: BLE001 - we want to keep going on any failure
        print("  card lookup failed:", type(e).__name__, str(e)[:120])
        return

    try:
        configs = get_dataset_config_names(name)
    except Exception as e:  # noqa: BLE001
        print("  could not list configs:", str(e)[:120])
        return
    print("  configs :", configs)
    config = configs[0] if configs else None

    try:
        splits = get_dataset_split_names(name, config)
        print("  splits  :", splits)
        sizes = load_dataset_builder(name, config).info.splits
        if sizes:
            print("  rows    :", {k: v.num_examples for k, v in sizes.items()})
    except Exception as e:  # noqa: BLE001
        print("  split info failed:", str(e)[:120])
        splits = ["train"]

    split = "train" if "train" in splits else splits[0]
    try:
        first = next(iter(load_dataset(name, config, split=split, streaming=True)))
    except Exception as e:  # noqa: BLE001
        print("  could not stream a row:", str(e)[:120])
        return
    print(f"  columns : {list(first.keys())}")
    print(f"  first row of '{split}':")
    for key, value in first.items():
        print(f"    {key:<22} {short(value)!s}")


if __name__ == "__main__":
    for ds in (sys.argv[1:] or DEFAULTS):
        try:
            inspect(ds)
        except Exception as e:  # noqa: BLE001
            print(f"{ds}: FAILED {type(e).__name__}: {e}")
