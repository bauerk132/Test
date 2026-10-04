#!/usr/bin/env python3
"""SageMaker training entry point: LoRA supervised fine-tuning with Unsloth.

HOW SAGEMAKER RUNS THIS
    launch/launch_job.py uploads the coding-lab folder, installs requirements-train.txt,
    then runs:  python train/train_sft.py --model ... --max-steps ...   (hyperparameters
    become --flags). Data arrives in /opt/ml/input/data/data/. Anything written to
    /opt/ml/model is packed into model.tar.gz on S3 when the job ends. Anything in
    /opt/ml/checkpoints is synced to S3 continuously (that is what makes spot safe).

WHAT TO READ IN THE LOG (CloudWatch) AFTER A SMOKE TEST, IN THIS ORDER
    1. "=== MASK CHECK ==="  the trained-on text must be ONLY the <patch>...</patch> answer.
    2. "=== TOKENS ==="      lengths; nothing should be near the max_seq_length ceiling.
    3. loss lines            train loss should fall; with 200 examples for ~5 passes it may
                             fall a lot. That proves the pipeline learns, not that it is good.
    4. "=== THROUGHPUT ==="  measured tokens/sec. Put it into tools/estimate_cost.py --tps-4b/--tps-9b.

WHY bf16 LoRA AND NOT 4-bit QLoRA
    Unsloth's Qwen3.5 guide says 4-bit QLoRA is not recommended for Qwen3.5 because of
    larger-than-normal quantization error. So we load the model in 16-bit and train small
    LoRA adapter matrices on top. That costs more GPU memory (about 10 GB for the 4B,
    about 22 GB for the 9B) but keeps quality.
"""
# unsloth must be imported BEFORE transformers/trl/peft so its patches apply
from unsloth import FastLanguageModel  # isort: skip
from unsloth.chat_templates import train_on_responses_only  # isort: skip

import argparse
import dataclasses
import glob
import json
import os
import time
from pathlib import Path

import torch
from datasets import load_dataset
from trl import SFTConfig, SFTTrainer


def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen3.5-4B")
    ap.add_argument("--data-dir", default=os.environ.get("SM_CHANNEL_DATA", "/opt/ml/input/data/data"))
    ap.add_argument("--max-seq-length", type=int, default=8192)
    ap.add_argument("--epochs", type=float, default=1.0)
    ap.add_argument("--max-steps", type=int, default=-1, help="smoke test: 60. -1 means 'use epochs'")
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--lora-r", type=int, default=16)
    ap.add_argument("--lora-alpha", type=int, default=32)
    ap.add_argument("--lora-dropout", type=float, default=0.0)
    ap.add_argument("--per-device-batch", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=16, help="effective batch = per-device x this")
    ap.add_argument("--warmup-ratio", type=float, default=0.03)
    ap.add_argument("--save-steps", type=int, default=25)
    ap.add_argument("--max-val", type=int, default=60)
    ap.add_argument("--save-merged", type=int, default=1, help="1 = also save merged 16-bit weights (for eval/GGUF)")
    ap.add_argument("--seed", type=int, default=3407)
    return ap.parse_args()


def sft_config(**wanted):
    """Build SFTConfig with only the arguments THIS trl version knows (names drift between releases)."""
    known = {f.name for f in dataclasses.fields(SFTConfig)}
    if "max_length" in known:
        wanted["max_length"] = wanted.pop("max_seq_length")
    elif "max_seq_length" not in known:
        wanted.pop("max_seq_length")
    if "eval_strategy" not in known and "evaluation_strategy" in known:
        wanted["evaluation_strategy"] = wanted.pop("eval_strategy")
    dropped = sorted(k for k in wanted if k not in known)
    if dropped:
        print("NOTE: this trl version ignores:", dropped)
    return SFTConfig(**{k: v for k, v in wanted.items() if k in known})


def main():
    a = parse_args()
    model_dir = Path(os.environ.get("SM_MODEL_DIR", "./out/model"))
    ckpt_dir = Path("/opt/ml/checkpoints") if Path("/opt/ml/checkpoints").exists() else Path("./out/checkpoints")
    model_dir.mkdir(parents=True, exist_ok=True)
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    print("args:", json.dumps(vars(a)))
    print("gpu:", torch.cuda.get_device_name(0), "| bf16 ok:", torch.cuda.is_bf16_supported())

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=a.model,
        max_seq_length=a.max_seq_length,
        load_in_4bit=False,       # see docstring: QLoRA is discouraged for Qwen3.5
        load_in_16bit=True,
    )
    # Qwen3.5 is a vision+text model, so `tokenizer` may be a "processor". Text work needs the inner tokenizer.
    text_tok = getattr(tokenizer, "tokenizer", tokenizer)
    model = FastLanguageModel.get_peft_model(
        model,
        r=a.lora_r,
        lora_alpha=a.lora_alpha,
        lora_dropout=a.lora_dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
        use_gradient_checkpointing="unsloth",   # trades ~20% speed for much lower memory: needed at 8K tokens
        random_state=a.seed,
    )

    data = Path(a.data_dir)
    ds = load_dataset("json", data_files={"train": str(data / "train.jsonl"),
                                          "validation": str(data / "validation.jsonl")})
    ds["validation"] = ds["validation"].select(range(min(a.max_val, len(ds["validation"]))))

    def render(example):
        # enable_thinking=False: we train (and later evaluate) in non-thinking mode, so the
        # template must not ask for a reasoning block the data does not contain.
        text = text_tok.apply_chat_template(example["messages"], tokenize=False,
                                            add_generation_prompt=False, enable_thinking=False)
        return {"text": text}

    ds = ds.map(render, remove_columns=[c for c in ds["train"].column_names if c != "text"])
    print("=== RENDERED EXAMPLE (last 700 chars) ===\n", ds["train"][0]["text"][-700:], "\n=== END ===")

    trainer = SFTTrainer(
        model=model,
        processing_class=text_tok,
        train_dataset=ds["train"],
        eval_dataset=ds["validation"],
        args=sft_config(
            output_dir=str(ckpt_dir),
            per_device_train_batch_size=a.per_device_batch,
            per_device_eval_batch_size=1,
            gradient_accumulation_steps=a.grad_accum,
            num_train_epochs=a.epochs,
            max_steps=a.max_steps,
            learning_rate=a.lr,
            warmup_ratio=a.warmup_ratio,
            lr_scheduler_type="linear",
            optim="adamw_8bit",
            weight_decay=0.01,
            logging_steps=1,
            save_strategy="steps",
            save_steps=a.save_steps,
            save_total_limit=2,
            eval_strategy="steps",
            eval_steps=a.save_steps,
            bf16=torch.cuda.is_bf16_supported(),
            fp16=not torch.cuda.is_bf16_supported(),
            dataset_text_field="text",
            max_seq_length=a.max_seq_length,
            packing=False,
            report_to="none",
            seed=a.seed,
        ),
    )
    # Only learn from the assistant's answer. Without this the model also "learns" to write the
    # issue and the source code, which wastes most of the gradient (the prompt is ~95% of tokens).
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|im_start|>user\n",
        response_part="<|im_start|>assistant\n",
    )

    # ---- MASK CHECK: fail fast if masking is wrong, before spending an hour of GPU ----
    first = trainer.train_dataset[0]
    trained_ids = [t for t, l in zip(first["input_ids"], first["labels"]) if l != -100]
    trained_text = text_tok.decode(trained_ids)
    print("=== MASK CHECK ===")
    print(f"tokens total={len(first['input_ids'])} trained_on={len(trained_ids)}")
    print("trained-on text starts:", repr(trained_text[:160]))
    print("trained-on text ends  :", repr(trained_text[-80:]))
    if "<patch>" not in trained_text or "</patch>" not in trained_text:
        raise SystemExit("MASK CHECK FAILED: trained-on text is not the <patch> answer. Fix response_part before training.")

    lens = [len(x) for x in trainer.train_dataset["input_ids"]]
    print(f"=== TOKENS === n={len(lens)} mean={sum(lens)/len(lens):.0f} max={max(lens)} ceiling={a.max_seq_length}")
    if max(lens) >= a.max_seq_length:
        print("WARNING: some examples hit the ceiling, so their patches may be cut off. Lower --max-seq-length in build_sft.py.")

    resume = None
    checkpoints = sorted(glob.glob(str(ckpt_dir / "checkpoint-*")), key=lambda p: int(p.rsplit("-", 1)[1]))
    if checkpoints:
        resume = checkpoints[-1]
        print("RESUMING from", resume, "(spot instance was interrupted earlier)")

    t0 = time.time()
    result = trainer.train(resume_from_checkpoint=resume)
    wall = time.time() - t0
    steps = trainer.state.global_step
    eff_batch = a.per_device_batch * a.grad_accum
    tokens_seen = steps * eff_batch * (sum(lens) / len(lens))
    print("=== THROUGHPUT ===")
    print(f"steps={steps} wall_s={wall:.0f} approx_tokens={tokens_seen:.0f} tokens_per_s={tokens_seen / wall:.0f}")

    final_eval = trainer.evaluate()
    print("final eval:", final_eval)

    adapter = model_dir / "adapter"
    model.save_pretrained(str(adapter))
    tokenizer.save_pretrained(str(adapter))
    if a.save_merged:
        # Documented Unsloth path: writes full 16-bit weights that vLLM and llama.cpp can load.
        model.save_pretrained_merged(str(model_dir / "merged"), tokenizer, save_method="merged_16bit")
    summary = {
        "model": a.model, "steps": steps, "wall_seconds": round(wall), "tokens_per_second": round(tokens_seen / wall),
        "train_loss": result.metrics.get("train_loss"), "final_eval": final_eval, "args": vars(a),
    }
    (model_dir / "train_summary.json").write_text(json.dumps(summary, indent=2, default=str))
    print("saved to", model_dir)


if __name__ == "__main__":
    main()
