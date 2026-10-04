#!/usr/bin/env python3
"""Launch a paid SageMaker job (training or evaluation). Run from a Studio JupyterLab terminal.

    pip install -r requirements-data.txt        # once; installs sagemaker SDK v3

    # 1) training stages (see README for the order and the gates between them)
    python launch/launch_job.py train --stage smoke --model Qwen/Qwen3.5-4B --data data_out/smoke
    python launch/launch_job.py train --stage pilot --model Qwen/Qwen3.5-4B --data data_out/pilot --spot

    # 2) evaluation: generate patches (scoring is done afterwards by sb-cli, free)
    python launch/launch_job.py eval --label base-4b  --model Qwen/Qwen3.5-4B --prompts data_out/eval_verified.jsonl
    python launch/launch_job.py eval --label tuned-4b --model Qwen/Qwen3.5-4B --prompts data_out/eval_verified.jsonl \
        --model-s3 s3://<bucket>/coding-lab/outputs/<job-name>/output/model.tar.gz

TWO SAFETY RAILS BUILT IN
    * every job has a hard time limit (--max-hours). SageMaker kills the job at the limit, so the
      worst case is max-hours x hourly rate, printed before you confirm.
    * nothing launches until you type "yes" (or pass --yes).
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT_TAG = ("project", "coding-lab")

# Planning rates in $/hour, same constants as tools/estimate_cost.py. VERIFY in the AWS Pricing Calculator.
RATES = {"ml.g5.xlarge": 1.41, "ml.g6e.xlarge": 2.60}

STAGES = {   # per-stage defaults: hard time cap and the hyperparameters that differ
    "smoke": {"max_hours": 1.5, "hp": {"max-steps": 60, "save-steps": 20, "save-merged": 0}},
    "pilot": {"max_hours": 4.0, "hp": {"epochs": 1, "save-steps": 25, "save-merged": 1}},
    "full": {"max_hours": 10.0, "hp": {"epochs": 1, "save-steps": 50, "save-merged": 1}},
}


def is_9b(model: str) -> bool:
    return "9b" in model.lower()


def stage_code_dir(requirements_file: str) -> Path:
    """Copy only the code SageMaker needs into a temp folder, so data_out/ never gets uploaded."""
    stage = Path(tempfile.mkdtemp(prefix="coding-lab-src-"))
    for name in ("common", "train", "eval"):
        shutil.copytree(ROOT / name, stage / name, ignore=shutil.ignore_patterns("__pycache__", "out"))
    shutil.copy(ROOT / requirements_file, stage / requirements_file)
    return stage


def build_trainer(*, kind, name, model, instance, hp, max_hours, spot, bucket, role, session, region):
    """Assemble the ModelTrainer. Kept separate from main() so it can be constructed offline for tests."""
    from sagemaker.core import image_uris
    from sagemaker.train.configs import CheckpointConfig, Compute, OutputDataConfig, SourceCode, StoppingCondition, Tag
    from sagemaker.train.model_trainer import ModelTrainer

    image = image_uris.retrieve(framework="pytorch", region=region, version="2.8.0", py_version="py312",
                                instance_type=instance, image_scope="training")
    entry, reqs = (("train/train_sft.py", "requirements-train.txt") if kind == "train"
                   else ("eval/generate_patches.py", "requirements-eval.txt"))
    seconds = int(max_hours * 3600)
    stopping = StoppingCondition(max_runtime_in_seconds=seconds,
                                 max_wait_time_in_seconds=(seconds * 2 if spot else None))
    return ModelTrainer(
        training_image=image,
        role=role,
        sagemaker_session=session,
        base_job_name=name,
        source_code=SourceCode(source_dir=str(stage_code_dir(reqs)), entry_script=entry, requirements=reqs),
        compute=Compute(instance_type=instance, instance_count=1,
                        volume_size_in_gb=250 if is_9b(model) else 120,
                        enable_managed_spot_training=True if spot else None),
        stopping_condition=stopping,
        checkpoint_config=(CheckpointConfig(s3_uri=f"s3://{bucket}/coding-lab/checkpoints/{name}",
                                            local_path="/opt/ml/checkpoints") if spot else None),
        output_data_config=OutputDataConfig(s3_output_path=f"s3://{bucket}/coding-lab/outputs"),
        hyperparameters=hp,
        tags=[Tag(key=PROJECT_TAG[0], value=PROJECT_TAG[1])],
    )


def upload(local: Path, bucket: str, prefix: str, boto_session) -> str:
    """Upload a file or folder to s3://bucket/prefix/ and return the folder URI."""
    s3 = boto_session.client("s3")
    files = [local] if local.is_file() else sorted(p for p in local.rglob("*") if p.is_file())
    for f in files:
        key = f"{prefix}/{f.name if local.is_file() else f.relative_to(local)}"
        print(f"  uploading {f} -> s3://{bucket}/{key}")
        s3.upload_file(str(f), bucket, key)
    return f"s3://{bucket}/{prefix}/"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="kind", required=True)

    t = sub.add_parser("train")
    t.add_argument("--stage", choices=STAGES, required=True)
    t.add_argument("--model", default="Qwen/Qwen3.5-4B")
    t.add_argument("--data", required=True, help="folder holding train.jsonl + validation.jsonl")
    t.add_argument("--max-seq-length", type=int, default=8192)

    e = sub.add_parser("eval")
    e.add_argument("--label", required=True, help="e.g. base-4b or tuned-4b (used in the job name)")
    e.add_argument("--model", default="Qwen/Qwen3.5-4B")
    e.add_argument("--prompts", required=True)
    e.add_argument("--model-s3", help="model.tar.gz from a training job; omit to evaluate the base model")
    e.add_argument("--limit", type=int, default=0, help="20 = quick plumbing test before the full 500")

    for p in (t, e):
        p.add_argument("--instance", help="default: ml.g5.xlarge for 4B, ml.g6e.xlarge for 9B")
        p.add_argument("--spot", action="store_true", help="managed spot (about 60-70% cheaper; training only)")
        p.add_argument("--max-hours", type=float, help="hard stop; defaults per stage")
        p.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    a = ap.parse_args()

    instance = a.instance or ("ml.g6e.xlarge" if is_9b(a.model) else "ml.g5.xlarge")
    if is_9b(a.model) and instance == "ml.g5.xlarge" and a.kind == "train":
        sys.exit("STOP: 9B bf16 LoRA needs ~22 GB before activations; the 24 GB A10G in ml.g5.xlarge will run out "
                 "of memory at 8K tokens. Use ml.g6e.xlarge (48 GB).")
    if a.kind == "eval" and a.spot:
        sys.exit("STOP: spot is for training (it can resume from checkpoints). Eval jobs cannot resume.")

    max_hours = a.max_hours or (STAGES[a.stage]["max_hours"] if a.kind == "train" else 2.0)
    rate = RATES.get(instance)
    label = f"stage={a.stage}" if a.kind == "train" else f"label={a.label}"
    print(f"\nJOB    : {a.kind} {label} | model={a.model} | instance={instance} | spot={a.spot}")
    print(f"LIMIT  : {max_hours} h hard stop -> worst case ${max_hours * rate:.2f} on-demand "
          f"(planning rate ${rate}/h; verify your price)" if rate else f"LIMIT  : {max_hours} h hard stop")
    if not a.yes and input("Type 'yes' to launch and start paying: ").strip().lower() != "yes":
        sys.exit("cancelled - nothing was launched")

    from sagemaker.core.helper.session_helper import Session, get_execution_role
    from sagemaker.train.configs import InputData

    session = Session()
    region, bucket, role = session.boto_region_name, session.default_bucket(), get_execution_role()
    short = a.model.split("/")[-1].lower().replace(".", "-").replace("_", "-")

    if a.kind == "train":
        name = f"lab-{a.stage}-{short}"[:50]
        hp = {"model": a.model, "max-seq-length": a.max_seq_length, **STAGES[a.stage]["hp"]}
        data_uri = upload(Path(a.data), bucket, f"coding-lab/data/{Path(a.data).name}", session.boto_session)
        channels = [InputData(channel_name="data", data_source=data_uri)]
    else:
        name = f"lab-eval-{a.label}"[:50]
        hp = {"model": a.model, "label": a.label, **({"limit": a.limit} if a.limit else {})}
        prompts_uri = upload(Path(a.prompts), bucket, "coding-lab/eval-prompts", session.boto_session)
        channels = [InputData(channel_name="prompts", data_source=prompts_uri)]
        if a.model_s3:
            channels.append(InputData(channel_name="model", data_source=a.model_s3))

    trainer = build_trainer(kind=a.kind, name=name, model=a.model, instance=instance, hp=hp, max_hours=max_hours,
                            spot=a.spot, bucket=bucket, role=role, session=session, region=region)
    trainer.train(input_data_config=channels, wait=True, logs=True)   # streams the CloudWatch log to your terminal
    print(f"\nDONE. Results: s3://{bucket}/coding-lab/outputs/<job-name>/output/model.tar.gz")
    print("Job name: aws sagemaker list-training-jobs --sort-by CreationTime --sort-order Descending --max-results 1")


if __name__ == "__main__":
    main()
