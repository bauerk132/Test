# Run Sheet: rules for every agent

Goal: run the Run Sheet page (`public/index.html`) from a small local Node server on Kyle's Windows laptop. His phone opens it over home Wi-Fi.

## Who does what
| Role | Who | Strength | Gets |
|---|---|---|---|
| Orchestrator | Claude (cloud session) | Plans the work, reviews diffs, owns design | Picks the next task, writes the spec or handoff, runs acceptance, commits |
| Hard parts | Claude (cloud session) | Concurrency, security, browser glue | Tasks tagged `claude` |
| Cloud workhorse | Worker subagents (quick, helper) | Cheap and fast on fully specified 1–2 file jobs | Tasks tagged `worker` |
| Laptop runner and reviewer | Codex (GPT) on Kyle's laptop | Real Windows: runs commands, reads errors, reviews OpenCode's diffs | Tasks tagged `codex`; commits laptop work |
| Laptop workhorse | OpenCode (cheap cloud model) on Kyle's laptop | Small Windows-only edits (PowerShell) | Tasks tagged `opencode` |
| Human | Kyle | The real phone and Wi-Fi; the final say | Tasks tagged `kyle` |

## Handoffs (Codex and OpenCode)
Work for an agent outside the cloud session comes as one page in `agents/handoffs/NNN-slug.md`, copied from `TEMPLATE.md`.
Read that page and the files it lists, nothing else. Before you start and before you push: `git pull` on the branch the handoff names.

## Rules
1. The queue is `agents/tasks.md`. Work only on the task you were given.
2. Edit only the files your task names. Never edit `public/index.html` unless the task says so.
3. Done means the task's acceptance command passes. "Looks right" doesn't count.
4. Workers get 2 tries. After that, the task goes back to the orchestrator along with the error output.
5. No personal data in git: `data/` is gitignored, and fixtures are synthetic.
6. No secrets in the repo. No model names in commits or files.
7. Node built-ins plus `express` only. Tests use `node --test`.
8. Frugal: pin each tool's model, keep a spending cap on the API key, and never scan the whole repo.
