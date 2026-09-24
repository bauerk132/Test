---
name: run-lecture-notes
description: Set up, run, and smoke-test the lecture-notes Python CLI, which turns a YouTube lecture transcript into Markdown notes. Use when asked to run lecture-notes or notes.py, test it, try it on a pasted transcript or a YouTube URL, or check that a change to it works.
---

`lecture-notes` is a small Python 3.11 command-line tool. `notes.py --transcript-file <paste.txt>` reads a transcript copied from YouTube's "Show transcript" panel (page clutter and all), keeps only the timestamped captions, and writes `<name>-notes.md` with timestamped paragraphs. Adding a YouTube URL makes the timestamps clickable links. Agents verify it with `.claude/skills/run-lecture-notes/smoke.sh`, which runs the CLI on representative inputs, checks exit codes, output, and the written files, then runs pytest.

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

Expected: nine `PASS` lines, the pytest summary, then `SMOKE OK`, exit code 0. A `FAIL` line prints the actual output under it, and the script exits 1. The script `cd`s to `lecture-notes/` itself and writes its output files to a temp dir that it deletes afterwards. When you add a feature to the CLI, add a `check <exit-code> <expected-substring> <args...>` line (and a `check_file` line if it writes a file).

One CLI call on the sample paste (an invented binary-numbers lecture with realistic YouTube page clutter):

```bash
.venv/bin/python notes.py "https://youtu.be/abcDEF12345" --transcript-file fixtures/sample_paste.txt -o /tmp/notes.md --force
# -> Saved 36 caption lines to /tmp/notes.md   (exit 0)
```

Errors print `Error: ...` to stderr and exit 1 (missing file, no timestamped captions in the file, bad URL, output file already exists without `--force`). Missing arguments: argparse usage message, exit 2.

Call the pieces directly, without the CLI:

```bash
.venv/bin/python -c "from transcript_file import read_transcript_file; s = read_transcript_file('fixtures/sample_paste.txt'); print(len(s), s[0])"
```

| module | job |
|---|---|
| `notes.py` | command line: arguments, errors, choosing the output file |
| `segments.py` | `Segment(start, text)` plus `parse_timestamp` / `format_timestamp` |
| `transcript_file.py` | find the captions inside a pasted YouTube page |
| `markdown_notes.py` | group captions into ~1-2 minute paragraphs and write the Markdown |

## Test

```bash
.venv/bin/python -m pytest -q
```

No test uses the network.

## Gotchas

- **YouTube is blocked in the cloud sandbox.** `curl https://www.youtube.com` fails with `CONNECT tunnel failed, response 403` because the environment's egress policy denies it. Test anything that downloads from YouTube with fake data and run the real download on a machine with YouTube access, or ask the user to allow `www.youtube.com` in the environment's network settings.
- **How the paste parser tells captions from page clutter:** a caption is a timestamp line followed by exactly one text line and then another timestamp (or the end). A timestamp followed by two or more text lines (the AI panel, a related-videos entry) ends a run, and the parser keeps the longest run. So a paste where captions span several lines per timestamp won't parse; that's not how YouTube's panel copies today.
- **Test fixtures must be invented text.** `fixtures/sample_paste.txt` is an original made-up lecture; don't replace it with a real video's transcript.
