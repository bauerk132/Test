#!/usr/bin/env bash
# SessionStart(compact) hook: stdout is added to context right after compaction.
f="${CLAUDE_PROJECT_DIR:-.}/.claude/handoff.md"
[ -f "$f" ] || exit 0
echo "Handoff notes saved before compaction (verify live state before trusting values):"
head -c 8000 "$f"
