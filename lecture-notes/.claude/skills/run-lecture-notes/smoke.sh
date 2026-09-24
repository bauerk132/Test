#!/usr/bin/env bash
# Smoke test for the lecture-notes CLI: representative inputs, exit codes, output files, then the unit tests.
set -u
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python
SAMPLE=fixtures/sample_paste.txt
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
fail=0

# check <expected-exit-code> <expected-output-substring> <args...>
check() {
  local want_code=$1 want_out=$2
  shift 2
  local out code
  out=$("$PY" notes.py "$@" 2>&1)
  code=$?
  if [[ $code -eq $want_code && $out == *"$want_out"* ]]; then
    echo "PASS  exit $code  notes.py $*"
  else
    echo "FAIL  exit $code (want $want_code)  notes.py $*"
    echo "      output: $out"
    fail=1
  fi
}

# check_file <file> <expected-substring>
check_file() {
  if grep -qF -- "$2" "$1" 2>/dev/null; then
    echo "PASS  $(basename "$1") contains $2"
  else
    echo "FAIL  $(basename "$1") is missing $2"
    fail=1
  fi
}

check 0 "Saved" --transcript-file "$SAMPLE" -o "$OUT/notes.md"
check_file "$OUT/notes.md" "## Transcript"
check 0 "Saved" "https://youtu.be/abcDEF12345?si=xyz" --transcript-file "$SAMPLE" -o "$OUT/linked.md"
check_file "$OUT/linked.md" "https://youtu.be/abcDEF12345?t="
check 1 "already exists" --transcript-file "$SAMPLE" -o "$OUT/notes.md"
check 0 "Saved" --transcript-file "$SAMPLE" -o "$OUT/notes.md" --force
check 1 "file not found" --transcript-file "$OUT/missing.txt"
check 1 "Couldn't find a YouTube video ID" "https://example.com/video" --transcript-file "$SAMPLE"
# Link mode with a made-up ID fails either way: "Couldn't reach YouTube" where it's blocked,
# "Couldn't find that video" / "no captions" where it isn't.
check 1 "Error:" abcDEF12345 -o "$OUT/download.md"
check 2 "usage:"

"$PY" -m pytest -q || fail=1

[[ $fail -eq 0 ]] && echo "SMOKE OK" || echo "SMOKE FAILED"
exit $fail
