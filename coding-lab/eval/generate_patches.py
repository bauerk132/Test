#!/usr/bin/env python3
"""SageMaker job: generate one patch per eval task with vLLM, write preds.json for sb-cli.

WHAT RUNS WHERE
    This job only GENERATES patches (needs a GPU). Scoring is done separately, free, by
    SWE-bench's cloud service (`sb-cli`), which applies each patch to the real repository
    and runs the real tests. Generation and scoring are split on purpose: scoring needs
    Docker images of 12 repositories, which a training-job container cannot run.

INPUT CHANNELS (created by launch/launch_job.py)
    prompts : eval_verified.jsonl from data/build_eval_prompts.py
    model   : (optional) model.tar.gz from a training job. Omit to evaluate the base model.
OUTPUT (/opt/ml/model -> model.tar.gz on S3)
    preds.json        {instance_id: {"model_patch": ..., "model_name_or_path": ...}}  <- sb-cli format
    raw_outputs.jsonl full model text per task, for reading failures by eye
    eval_summary.json counts: empty patches, prompts too long, mean output length
"""
import argparse
import json
import os
import sys
import tarfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.prompts import extract_patch  # noqa: E402


def resolve_model(model_id: str, channel_dir: Path) -> str:
    """Tuned model: untar the training job's model.tar.gz and use its merged/ folder. Else use the hub id."""
    tars = sorted(channel_dir.glob("*.tar.gz")) if channel_dir.exists() else []
    if not tars:
        print("no model channel: evaluating the base model", model_id)
        return model_id
    dest = Path("/tmp/tuned_model")
    dest.mkdir(exist_ok=True)
    print("extracting", tars[0])
    with tarfile.open(tars[0]) as tf:
        tf.extractall(dest)
    merged = dest / "merged"
    if not merged.exists():
        sys.exit(f"STOP: {tars[0].name} has no merged/ folder (train with --save-merged 1). Found: {[p.name for p in dest.iterdir()]}")
    return str(merged)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen3.5-4B", help="hub id for a base-model eval")
    ap.add_argument("--label", default="base", help="name recorded in preds.json")
    ap.add_argument("--prompts-dir", default="/opt/ml/input/data/prompts")
    ap.add_argument("--model-dir", default="/opt/ml/input/data/model")
    ap.add_argument("--max-model-len", type=int, default=24576)
    ap.add_argument("--max-new-tokens", type=int, default=3072)
    ap.add_argument("--limit", type=int, default=0, help="0 = all tasks; 20 for a quick plumbing test")
    a = ap.parse_args()

    from vllm import LLM, SamplingParams

    out_dir = Path(os.environ.get("SM_MODEL_DIR", "./out/eval"))
    out_dir.mkdir(parents=True, exist_ok=True)
    tasks = [json.loads(l) for l in (Path(a.prompts_dir) / "eval_verified.jsonl").read_text().splitlines() if l.strip()]
    if a.limit:
        tasks = tasks[: a.limit]
    print(f"{len(tasks)} tasks; model={a.model}")

    llm = LLM(
        model=resolve_model(a.model, Path(a.model_dir)),
        dtype="bfloat16",
        max_model_len=a.max_model_len,
        gpu_memory_utilization=0.92,
        limit_mm_per_prompt={"image": 0, "video": 0},   # text-only: don't reserve memory for vision inputs
    )
    tok = llm.get_tokenizer()
    budget = a.max_model_len - a.max_new_tokens

    prompts, runnable, too_long = [], [], []
    for t in tasks:
        text = tok.apply_chat_template(t["messages"], tokenize=False, add_generation_prompt=True, enable_thinking=False)
        if len(tok(text, add_special_tokens=False)["input_ids"]) > budget:
            too_long.append(t["instance_id"])           # scored as a failure: the model never saw the whole task
            continue
        prompts.append(text)
        runnable.append(t)
    print(f"{len(runnable)} runnable, {len(too_long)} too long for max_model_len={a.max_model_len}")

    outputs = llm.generate(prompts, SamplingParams(temperature=0.0, max_tokens=a.max_new_tokens))

    preds, raw, empty = {}, [], 0
    for t, o in zip(runnable, outputs):
        text = o.outputs[0].text
        patch = extract_patch(text)
        empty += not patch
        preds[t["instance_id"]] = {"model_patch": patch, "model_name_or_path": a.label}
        raw.append({"instance_id": t["instance_id"], "finish_reason": o.outputs[0].finish_reason, "text": text})
    for iid in too_long:
        preds[iid] = {"model_patch": "", "model_name_or_path": a.label}

    (out_dir / "preds.json").write_text(json.dumps(preds))
    (out_dir / "raw_outputs.jsonl").write_text("\n".join(json.dumps(r) for r in raw))
    summary = {"label": a.label, "model": a.model, "tasks": len(tasks), "empty_patches": empty + len(too_long),
               "too_long": len(too_long), "truncated_outputs": sum(r["finish_reason"] == "length" for r in raw)}
    (out_dir / "eval_summary.json").write_text(json.dumps(summary, indent=2))
    print("=== EVAL SUMMARY ===", json.dumps(summary))


if __name__ == "__main__":
    main()
