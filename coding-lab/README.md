# Coding Lab: Option 2, started the Option 3 way

**Decisions you made:** Option 2 (Qwen writes code, Gemma reviews). Start with one small model to learn the pipeline (Option 3). Everything paid on SageMaker, no free Colab. No personal repos or data; Hugging Face datasets only. "Workforce" means your own coding workflows.

**What is ready now:** the whole rig loop (data, baseline eval, smoke test, pilot, tuned eval, statistics). **Not built yet, on purpose:** GRPO, the Gemma 4 reviewer + DPO, the router and the GGUF/Ollama export. They come after the pilot gate below, because their design depends on what the rig shows.

> **Nothing here has run on a GPU or against your AWS account.** I could not reach Hugging Face from my sandbox, and I did not touch your AWS account. What I did verify: all scripts compile; the data, prompt and statistics logic passes self-tests; the budget JSON validates against AWS's API schema; the SageMaker jobs build against the real SDK schema; the pinned packages resolve together. The smoke test exists to find whatever is left.

## Correction to my first report

The first report said Agent A would cost about $16.60. That assumed 900-token examples. Fixing a GitHub issue means reading whole source files, so examples are about 4,500 tokens. Redone with that (`python tools/estimate_cost.py`):

| | on-demand | with managed spot |
|---|---|---|
| **Rig** (Qwen3.5-4B: baseline, smoke, pilot, tuned eval) | about $5.75 | about $4.10 |
| **Agent A** (Qwen3.5-9B: baseline, pilot, full SFT, 3 evals, export; **no GRPO**) | about **$27.94** (over your $25 cap) | about **$15.31** |

So for the 9B, **spot is not optional** unless you shrink the full run. Two more changes: the 9B needs `ml.g6e.xlarge` (48 GB), because bf16 LoRA is about 22 GB before activations and would not fit the 24 GB `ml.g5.xlarge` at 8K tokens; and the 4B rig runs on `ml.g5.xlarge`. All rates and speeds are planning estimates. Your smoke test measures the real speed; re-run the calculator with `--tps-4b` set to it.

## What to train on, by workflow

| Your workflow | Train on | Evaluate on | Status |
|---|---|---|---|
| Python debugging, repo edits | SWE-bench **train** split (real issue-to-patch pairs; `inspect_hf.py` prints the true row count). Later: SWE-smith, SWE-Fixer-Train-110K, SWE-rebench | SWE-bench Verified (500 tasks) | rig uses this now |
| TypeScript / React / Node | Multi-SWE-RL (has TS/JS instances) | SWE-PolyBench (729 TS tasks) | after the rig |
| Algorithms, scientific Python | DeepCoder-Preview-Dataset (24k problems with tests), GRPO prompts | held-out slice of the same | Agent A, later |
| Code review, planning (Gemma) | CodeUltraFeedback_binarized (9.5k pairs), Nutanix/codereview-dataset | CodeReviewQA (900) | Agent B, later |
| AI/ML, data engineering | no dedicated dataset found; SWE-rebench (3,400 repos) probably covers many such libraries (unchecked) | | gap |

Licenses come from search-result snippets, not from opening the cards (Hugging Face is blocked from my sandbox): SWE-smith MIT; SWE-Fixer-Train-110K MIT; SWE-rebench CC-BY-4.0 with per-repo licenses; Multi-SWE-RL Apache-2.0; DeepCoder-Preview MIT; **KodCode-Light-RL-10K is CC BY-NC 4.0 (non-commercial)**; CodeUltraFeedback_binarized MIT; Nutanix/codereview-dataset Apache-2.0. `data/inspect_hf.py` prints each card's license, so confirm there before you rely on one.

## Day 0 (do in this order; steps 3 and 4 have waiting time)

1. **Lock the account.** Turn on MFA for the root user; do the rest as an admin user, not root.
2. **Budgets.** `EMAIL=you@example.com LIMIT=25 bash aws/01_budgets.sh`, then confirm the subscription email. Alerts email you; they cannot stop spending, and billing lags by hours. The real stop-loss is the hard time limit on every job.
3. **Quotas** (new accounts often have 0 GPU instances): `bash aws/02_quotas.sh request`. Approval can take hours to days. Do step 4 and Stage 1 while you wait.
4. **Workbench.** Console, SageMaker AI, Studio, create a domain (quick setup). Open Studio, JupyterLab, create a space: `ml.t3.medium`, 50 GB, **idle shutdown on (60 min)**. Region `us-east-1` unless you have a reason.
5. In the JupyterLab terminal:
   ```bash
   git clone -b claude/quirky-faraday-2uyvrc https://github.com/bauerk132/test.git
   cd test/coding-lab
   pip install -r requirements-data.txt
   pip show sagemaker | head -2        # must say Version: 3.x, not 2.x
   ```
   Your Surface only needs a browser. No Windows-on-ARM Python problems.

## Stage 1: data (free, about 10 minutes)

```bash
python data/inspect_hf.py
```
**Gate:** the source dataset must have `instance_id`, `repo`, `text`, `patch`, plus `train` and `test` splits, and a license you accept. If `princeton-nlp/SWE-bench_oracle` does not exist, use `princeton-nlp/SWE-bench_bm25_13K` and pass `--source` to both builders below. Then:

```bash
python data/build_sft.py --n-train 200  --n-val 40  --out data_out/smoke
python data/build_sft.py --n-train 3000 --n-val 100 --out data_out/pilot
python data/build_eval_prompts.py --out data_out/eval_verified.jsonl
```
**Gate:** in `manifest.json`, `repos_shared_between_train_and_val` is `[]`, and `token_stats_train.p90` is under about 7000. If the mean is far above 4,500, re-run `tools/estimate_cost.py --avg-tokens <mean>` before spending.

## Stage 2: baseline (about $1)

```bash
python launch/launch_job.py eval --label base-4b --model Qwen/Qwen3.5-4B --prompts data_out/eval_verified.jsonl --limit 20
```
The 20-task run is a plumbing test: read `eval_summary.json` in the output and open `raw_outputs.jsonl` to see what the model writes. Then run it again without `--limit`.

Score it with SWE-bench's free cloud service. I could not open the `sb-cli` docs, so confirm flags with `sb-cli --help`:
```bash
pip install sb-cli && sb-cli gen-api-key you@example.com     # verify the emailed key, then: export SWEBENCH_API_KEY=...
aws s3 cp s3://<bucket>/coding-lab/outputs/<eval-job>/output/model.tar.gz . && tar -xzf model.tar.gz preds.json
sb-cli submit swe-bench_verified test --predictions_path preds.json --run_id base-4b
```
Download the report JSON for the run (`sb-cli get-report ...`). It must contain `resolved_ids`.

## Stage 3: smoke test (about $1)

```bash
python launch/launch_job.py train --stage smoke --model Qwen/Qwen3.5-4B --data data_out/smoke
```
It asks you to type `yes` and shows the worst-case cost first. Read the log for, in this order:

1. `=== MASK CHECK ===`: trained-on text must be only the `<patch>...</patch>` answer. The script stops itself if not.
2. `=== TOKENS ===`: nothing near the ceiling.
3. Loss falls. (60 steps over 200 examples is about 5 passes; it should fall a lot. That proves the pipeline can learn, not that it is good.)
4. `=== THROUGHPUT ===`: tokens per second. Feed it to `tools/estimate_cost.py --tps-4b`. If it is far below 2,500, the first suspect is Qwen3.5's slow fallback path (missing fast kernels).

**Gate:** job finishes, adapter saved, no out-of-memory. If it runs out of memory, rebuild data with `--max-seq-length 6144` and pass the same to the launcher.

## Stage 4: pilot and verdict (about $2 with spot, $3.60 without)

```bash
python launch/launch_job.py train --stage pilot --model Qwen/Qwen3.5-4B --data data_out/pilot --spot
python launch/launch_job.py eval --label tuned-4b --model Qwen/Qwen3.5-4B --prompts data_out/eval_verified.jsonl \
    --model-s3 s3://<bucket>/coding-lab/outputs/<pilot-job>/output/model.tar.gz
# score it with sb-cli as above, then:
python eval/paired_stats.py base_report.json tuned_report.json
```
It prints the gain in points, a 95% interval, and a plain-English verdict against your +5-point target. **Gate to go on to the 9B:** PASS, or REAL BUT SMALL with a clear reason to expect more data to help. If the baseline solves under about 5% of tasks, +5 points is not reachable in one pilot; judge instead by validation loss, the empty-patch and truncation counts in `eval_summary.json`, and the raw `resolved` count.

## Stage 5: Agent A (Qwen3.5-9B)

Same commands with `--model Qwen/Qwen3.5-9B` (the launcher picks `ml.g6e.xlarge` and refuses `ml.g5.xlarge`). Use `--spot` for pilot and full. Build a bigger set first (`--n-train 8000`, after adding a source like SWE-Fixer once `inspect_hf.py` shows its columns). Train the full run **fresh from base**, not from the pilot.

## Not built yet

- **GRPO** for Agent A. Known risk: Unsloth's vLLM path pinned `transformers<5` while Qwen3.5 needs `>=5` (Unsloth issue #4920 at time of writing). Check its status first. Needs a sandbox with no network and strict time limits, and the reward-hacking guards from your handoff.
- **Gemma 4 E4B reviewer + DPO**, the **router**, and **GGUF/Ollama export** (Ollama on your Surface runs on the CPU only).
- A near-duplicate (MinHash) pass and an eval-leakage check beyond exact matches.

## Things I could not verify

1. Dataset column names and split names (`inspect_hf.py` checks them).
2. That `train_sft.py` and `generate_patches.py` run on real Qwen3.5 weights: the chat-template markers (`<|im_start|>`), the Unsloth merge, vLLM loading a merged Qwen3.5.
3. That the PyPI `torch` the pins pull in matches the instance's GPU driver (see `requirements-train.txt` for the fix).
4. All prices, and the `ml.g6e.xlarge` price in particular. Check the AWS Pricing Calculator.
5. The exact `sb-cli` flags.

## Every time you stop working

```bash
aws sagemaker list-training-jobs --status-equals InProgress
aws sagemaker list-endpoints        # must be empty: one endpoint is about $1,000/month
aws sagemaker list-apps             # stop running Studio apps
```
