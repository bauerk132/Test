# Run Sheet: rules for every agent

Goal: run the Run Sheet page (`public/index.html`) from a small local Node server on Kyle's Windows laptop. His phone opens it over home Wi-Fi.

## Who does what
| Role | Who | Strength | Gets |
|---|---|---|---|
| Orchestrator | Claude (cloud session) | Plans the work, reviews diffs, owns design | Picks the next task, writes the spec, runs acceptance, commits |
| Hard parts | Claude (cloud session) | Concurrency, security, browser glue | Tasks tagged `claude` |
| Workhorse | Worker subagents (quick, helper) | Cheap and fast on fully specified 1–2 file jobs | Tasks tagged `worker` |
| Laptop-only | Kyle (optionally Codex or OpenCode) | Real Windows, real phone, real Wi-Fi | Tasks tagged `kyle` |

## Rules
1. The queue is `agents/tasks.md`. Work only on the task you were given.
2. Edit only the files your task names. Never edit `public/index.html` unless the task says so.
3. Done means the task's acceptance command passes. "Looks right" doesn't count.
4. Workers get 2 tries. After that, the task goes back to the orchestrator along with the error output.
5. No personal data in git: `data/` is gitignored, and fixtures are synthetic.
6. No secrets in the repo. No model names in commits or files.
7. Node built-ins plus `express` only. Tests use `node --test`.
