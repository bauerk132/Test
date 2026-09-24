---
name: run-precalc
description: Build, run, and drive the Precalculus MAT201 React/Vite web app at the repo root. Use when asked to start the precalc app or its dev server, build or type-check it, take a screenshot of its UI, click through a practice session, or confirm a UI change works in a real browser.
---

The Precalculus app is a React 19 + Vite single-page app at the repo root. Agents drive it with headless Chromium through the Playwright REPL at `.claude/skills/run-precalc/driver.mjs`, pointed at the Vite dev server on port 3000.

All paths below are relative to the repo root.

## Prerequisites

Node 22 + npm. Playwright 1.56 and its Chromium are preinstalled globally in the cloud sandbox (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); the driver loads the global `playwright` package, so the project does not need it as a dependency.

Cloud sandbox only (skip if `/root/.ccr/agent-proxy-ca.crt` doesn't exist): make Chromium trust the egress proxy's CA, otherwise Google Fonts fail with `ERR_CERT_AUTHORITY_INVALID` and screenshots render in fallback fonts.

```bash
apt-get update   # 403 warnings for the deadsnakes/ondrej PPAs are expected and harmless
apt-get install -y libnss3-tools
mkdir -p ~/.pki/nssdb
[ -f ~/.pki/nssdb/cert9.db ] || certutil -N --empty-password -d sql:$HOME/.pki/nssdb
awk '/BEGIN CERT/{n++} {print > ("/tmp/ccr-ca-" n ".pem")}' /root/.ccr/agent-proxy-ca.crt
for f in /tmp/ccr-ca-*.pem; do certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "$(basename "$f" .pem)" -i "$f"; done
```

## Setup

```bash
npm install --no-package-lock --legacy-peer-deps
```

## Build / check

```bash
npm run lint    # tsc --noEmit, ~1s, prints nothing on success
npm run build   # -> dist/
```

There is no test suite; `lint` + `build` are the checks.

## Run (agent path)

Start the dev server in the background and poll until it serves:

```bash
(nohup npm run dev > /tmp/precalc-dev.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 0.5; done' && echo READY
```

Drive it by piping commands to the driver (one command per line, run in order):

```bash
node .claude/skills/run-precalc/driver.mjs <<'EOF'
open
ss 01-select
start
ss 02-learning
answer 1 x = 30
progress
submit
ss 03-results
errors
quit
EOF
```

Expected: `progress: 0 / 87 Completed` after `start`, `1 / 87` after the answer, `no console errors` at the end. `x = 30` is the correct answer to question 1, so the results page shows 2 / 80 pts and Module 5 at 20%. Screenshots land in `/tmp/shots/` (override with `SCREENSHOT_DIR`); open them with the Read tool to check them.

For step-by-step exploration, run the same driver in tmux:

```bash
tmux new-session -d -s precalc -x 200 -y 50
tmux send-keys -t precalc 'node .claude/skills/run-precalc/driver.mjs' Enter
timeout 20 bash -c 'until tmux capture-pane -t precalc -p | grep -q "driver>"; do sleep 0.2; done'
tmux send-keys -t precalc 'open' Enter
timeout 60 bash -c 'until tmux capture-pane -t precalc -p | grep -q "opened"; do sleep 0.2; done'
tmux capture-pane -t precalc -p
```

Stop everything:

```bash
tmux kill-session -t precalc 2>/dev/null
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

| command | what it does |
|---|---|
| `open [url]` | launch headless Chromium (1280x900) and load the app (default `http://localhost:3000`); waits for the module-select screen |
| `ss [name] [full]` | screenshot to `/tmp/shots/<name>.png`; add `full` for the whole scrollable page |
| `start` | click "Begin Practice Session", wait for the learning view, print progress |
| `answer <n> <text>` | fill the n-th (1-based) exam question's final-answer box |
| `progress` | print the "X / Y Completed" counter |
| `submit` | submit, wait for the results view, the scroll, and the confetti to finish |
| `click-text <text>` | click the first `<button>` whose text contains `<text>` |
| `click <css>` / `fill <css> <text>` | generic click / fill (the selector must not contain spaces) |
| `press <key>` | keyboard key, e.g. `Escape` |
| `wait-text <text>` | wait up to 15s for text to appear |
| `text [css]` | print innerText (default `body`, truncated at 3000 chars) |
| `eval <js>` | evaluate in the page and print JSON (promises are awaited) |
| `settle` | wait for smooth scrolling to stop |
| `errors` | console errors, page errors, and failed requests since `open` |
| `quit` | close the browser and exit |

## Run (human path)

```bash
npm run dev   # -> http://localhost:3000, Ctrl-C to stop
```

## Gotchas

- **`bun install` fails** even though the repo has `bun.lock`: the lockfile is `lockfileVersion: 2`, which bun 1.3.11 can't parse. Use the npm command in Setup. `--no-package-lock` keeps npm from adding a second lockfile.
- **npm ERESOLVE on esbuild**: `package.json` pins `esbuild@^0.25` while Vite 8 declares an optional peer `esbuild@^0.27 || ^0.28`. Vite 8 doesn't need esbuild, so `--legacy-peer-deps` is safe here.
- **Screenshots taken right after a view change show the wrong part of the page** with an unpainted strip at the bottom: `handleStart` and `handleSubmit` in `src/App.tsx` call `window.scrollTo({behavior: 'smooth'})`. `start` and `submit` already wait for the scroll to stop; after your own clicks, run `settle` before `ss`.
- **Confetti in the results screenshot**: canvas-confetti adds a `<canvas>` to `<body>` for about 5 seconds after submit. `submit` waits for it to be removed.
- **The 87 "Completed" items** are 40 exam answers plus 47 guided-walkthrough steps. `answer <n>` counts only exam answer boxes, in page order across the selected modules (Module 5 first).
- **Vite warns about `__dirname` in `vite.config.ts`** (`configLoader: 'native'`). It's harmless and can be ignored.

## Troubleshooting

- **`ERROR: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/`**: the dev server isn't running. Start it (see Run), check `/tmp/precalc-dev.log`, then `open` again in the same driver session.
- **`errors` lists `requestfailed: https://fonts.googleapis.com/... (net::ERR_CERT_AUTHORITY_INVALID)`**: Chromium doesn't trust the sandbox proxy's CA. Run the Prerequisites block.
- **`E: Failed to fetch .../libnss3-tools_3.98-1ubuntu0.1_amd64.deb 404 Not Found`**: the image's apt index is stale. Run `apt-get update` first.
