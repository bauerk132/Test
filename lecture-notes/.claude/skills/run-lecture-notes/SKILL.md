---
name: run-lecture-notes
description: Set up, run, and smoke-test the lecture-notes Python CLI, which turns a YouTube lecture link into notes. Use when asked to run lecture-notes or notes.py, test it, try it on a YouTube URL, or check that a change to it works.
---

`lecture-notes` is a small Python 3.11 command-line tool. Right now `notes.py <url>` only extracts the video ID from a YouTube link or bare ID (step 1 of the plan; transcript fetching comes next). Agents verify it with the smoke script `.claude/skills/run-lecture-notes/smoke.sh`, which runs the CLI on representative inputs, checks exit codes and output, then runs pytest.

All paths below are relative to `lecture-notes/`.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Call `.venv/bin/python` directly; there's no need to activate the venv in a non-interactive shell.

## Run (agent path)

```bash
.claude/skills/run-lecture-notes/smoke.sh
```

Expected: six `PASS` lines, `19 passed`, then `SMOKE OK`, exit code 0. A `FAIL` line prints the actual output under it, and the script exits 1. The script `cd`s to `lecture-notes/` itself, so it works from any directory. When you add a feature to the CLI, add a `check <exit-code> <expected-substring> <args...>` line for it.

One CLI call:

```bash
.venv/bin/python notes.py "https://youtu.be/abcDEF12345?si=xyz"
# -> Video ID: abcDEF12345   (exit 0)
```

Bad input prints `Error: Couldn't find a YouTube video ID in: ...` to stderr and exits 1. Missing argument: argparse usage message, exit 2.

Call a function directly, without the CLI:

```bash
.venv/bin/python -c "from notes import extract_video_id; print(extract_video_id('https://youtu.be/abcDEF12345'))"
```

## Test

```bash
.venv/bin/python -m pytest -v
```

19 tests: 12 supported URL formats and 7 rejected inputs (including look-alike hosts such as `www.youtube.com.evil.example`).

## Gotchas

- **YouTube is blocked in the cloud sandbox.** `curl https://www.youtube.com` fails with `CONNECT tunnel failed, response 403` because the environment's egress policy denies it. Anything that fetches real transcripts can't run live here: unit-test it with fixture data (a hand-written list of transcript segments) and run the real fetch on a machine with YouTube access, or ask the user to allow `www.youtube.com` in the environment's network settings.
- **The tests use made-up IDs** such as `abcDEF12345`. `extract_video_id` is pure string parsing and never touches the network, so any 11-character `[A-Za-z0-9_-]` string counts as an ID.
