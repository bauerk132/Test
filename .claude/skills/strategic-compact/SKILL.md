---
name: strategic-compact
description: Prepare a long conversation for /compact so the summary comes out as small as possible while the work can still resume without re-asking the user anything. Offloads durable state to a handoff file, then writes a ready-to-paste /compact command with tight custom instructions. Use this whenever the user mentions compacting, /compact, autocompact, the context window filling up, the conversation getting long or slow, "make the summary smaller", a handoff, or asks how to keep a session going cheaply — and offer it yourself when context is large and a task just finished.
---

# Strategic compact

A compaction summary is re-sent with every later turn, so each extra word costs on every request for the rest of the session. But a missing fact costs more: re-asking the user, redoing work, or breaking a promise. The goal is the **fewest tokens that still let the next turn act correctly.**

The biggest lever is not wording, it's **moving state out of the summary into a file** the summary points to. Files survive compaction, cost nothing until read, and don't get paraphrased into mush.

You cannot run `/compact` yourself (it's a built-in CLI command). Your job is to do the prep, then hand the user one line to paste.

## 1. Pick the moment

Compact at a seam: a task just finished, a commit just landed, a plan was just agreed. If you're mid-edit, finish the edit or write down the exact next action first. Compacting mid-debug loses the half-formed hypothesis that lived only in context.

## 2. Offload to `.claude/handoff.md`

Write (or overwrite) `.claude/handoff.md` in the project. Before the first write, make sure git ignores it: run `git check-ignore -q .claude/handoff.md || echo '.claude/handoff.md' >> .gitignore`. It can hold personal details and should never be committed.

Keep it under ~60 lines. Put in only what a fresh context can't cheaply get back:

```markdown
# Handoff — <date/time>
## Goal
<one line: what the user is ultimately trying to get done>
## Next action
<the single next thing to do, specific enough to start without asking>
## Standing instructions from the user
- <each still-active preference or correction, paraphrased in one line>
## Facts & IDs
- <exact values: file paths, URLs, event/task/doc IDs, versions, addresses, deadlines>
## Decisions (and why)
- <decision> — <reason, so it isn't re-litigated>
## Tried, didn't work
- <approach> — <why it failed>
## Waiting on the user
- <open questions you asked and haven't had answered>
## How to re-check live state
- <command/tool call that re-fetches things that change: git status, PR status, calendar, db doc>
```

Rules that keep it small and correct:
- **Values, not stories.** "Test 2 moved to 11:00 AM, event id 6fqv…" beats a paragraph on how it got there.
- **Point at data that lives elsewhere.** If it's in a commit, a file, a tracker, or a database, write where it is, not what it says.
- **For anything that changes on its own** (calendars, CI, inboxes), store how to re-fetch it, not the value. Old values in a summary are worse than none.
- **User corrections are the most expensive thing to lose.** Losing one means repeating a mistake the user already fixed. Keep every one that still applies.
- **Skip what's already loaded:** CLAUDE.md, skills, memory, the system prompt.
- **Never write secrets** (tokens, passwords, API keys), not even partially.

Other existing homes beat the handoff file when they fit: commit finished code, update the task tracker, save rows to the app's database. Offer to add a *permanent* user preference to CLAUDE.md, but only with the user's OK.

## 3. Triage what the summary itself keeps

| Keep in summary (terse) | Point to, don't copy | Drop |
|---|---|---|
| Goal + next action | Anything in handoff.md, files, commits, trackers | Narration of finished tasks |
| Still-active user instructions | Tool output you can re-run | Superseded plans and options not chosen |
| Commitments you made to the user | Code already on disk | Full error logs (keep only the lesson) |
| Unanswered questions to the user | Long docs/pages you read | Pleasantries, apologies, status chatter |
| The handoff path + "read it first" | | Verbatim lists of every user message |

The default compaction prompt tends to quote every user message and paste code snippets. That's the main source of bloat, so override it explicitly.

## 4. Give the user the command

Fill in the budget and paste-ready line. Budget by how much is in flight: **~150 words** for one focused coding task, **~300** for multi-task work, **~500** only for long-running ops with many open threads. With a good handoff file, the low end usually works.

```
/compact Budget: <N> words max, terse bullets, no prose. FIRST LINE: "Read .claude/handoff.md before acting." Keep: goal; exact next action; user instructions/corrections still in force (paraphrase, never quote whole messages); commitments made to the user; unanswered questions to the user; exact IDs/paths only if not in the handoff. Point, don't copy: anything in .claude/handoff.md, files, commits, or re-runnable tool output. Drop: finished-task narration, superseded plans, code, tool output, error logs, verbatim user-message lists.
```

Tell the user in one or two sentences what you offloaded and roughly how big the summary should be. Then stop. Anything you do after this adds to what gets summarized.

## 5. After compaction

Your first move in the new context: read `.claude/handoff.md`, then run its "re-check live state" steps before trusting any value from the summary. If a question from "Waiting on the user" is still open, ask it again. Don't guess.

## Make it automatic (optional, ask first)

These change project config, so offer them rather than applying them.

- **Auto-compaction uses the same rules** if CLAUDE.md has this section (Claude Code reads it when compacting):
  ```markdown
  # Compact instructions
  Terse bullets, ~300 words max. First line: "Read .claude/handoff.md before acting." Keep goal, next action, active user instructions, commitments, open questions. Drop narration, code, tool output, verbatim user messages.
  ```
- **Re-inject the handoff after every compaction** with a `SessionStart` hook using the `compact` matcher. It runs `scripts/print-handoff.sh`, which prints the handoff file (hook stdout is added to context) and prints nothing if the file is missing. Add to `.claude/settings.json`:
  ```json
  {"hooks":{"SessionStart":[{"matcher":"compact","hooks":[{"type":"command","command":"bash .claude/skills/strategic-compact/scripts/print-handoff.sh"}]}]}}
  ```
  With this in place, the summary never needs to restate the handoff.

`PreCompact` hooks can only block compaction; they can't shape the summary, so don't reach for them here.
