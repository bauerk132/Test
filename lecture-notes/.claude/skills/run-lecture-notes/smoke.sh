#!/usr/bin/env bash
# Smoke test for the lecture-notes CLI: representative inputs, exit codes, output, then the unit tests.
set -u
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python
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

check 0 "Video ID: abcDEF12345" "https://www.youtube.com/watch?v=abcDEF12345&t=120s"
check 0 "Video ID: abcDEF12345" "https://youtu.be/abcDEF12345?si=xyz"
check 0 "Video ID: abcDEF12345" "abcDEF12345"
check 1 "Couldn't find a YouTube video ID" "https://example.com/video"
check 1 "Couldn't find a YouTube video ID" "https://www.youtube.com.evil.example/watch?v=abcDEF12345"
check 2 "the following arguments are required: url"

"$PY" -m pytest -q || fail=1

[[ $fail -eq 0 ]] && echo "SMOKE OK" || echo "SMOKE FAILED"
exit $fail
