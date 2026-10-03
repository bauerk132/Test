# Task board

Status: `todo` → `doing` → `done` (acceptance passed) · `blocked` (reason given)

| # | Task | Owner | Files | Acceptance | Status |
|---|---|---|---|---|---|
| M0 | Save page source and synthetic fixture | claude | public/index.html, test/fixtures/ | scrub grep clean, page renders | done |
| M1 | Rules and this board | claude | AGENTS.md, agents/tasks.md | board exists | done |
| M2 | Server skeleton: static `public/` and `GET /api/health` | worker (quick) | package.json, server.js | `npm start` → `/api/health` returns `{"ok":true}` | done |
| M3 | Versioned JSON store: atomic writes, 409 on stale version, date-only ids | claude | lib/store.js, test/store.test.js | `npm test` | done |
| M4 | Plan validator and `npm run plan:check <file>` | worker (helper) | lib/validate.js, scripts/plan-check.js, test/validate.test.js | `npm test` | done |
| M5 | API routes plus `db-shim.js` (the page's `window.claude.use("db")`); 2-line page edit; offline taps wait on the phone | claude | server.js, public/db-shim.js, public/index.html, test/api.test.js, test/shim.test.js | tap persists after refresh (headless test) | done (2-browser test: phone tap on laptop in ~5 s; tap made while server was down arrives ~4 s after it's back) |
| M6 | `scripts/start.ps1` prints the phone URL; README firewall note (Private only) | worker (quick) | scripts/start.ps1, README.md | script prints a LAN URL | doing (needs real Windows: 001 step 3) |
| M7 | Import the Oct 3 export into `data/` | worker (quick) | scripts/import.js | history shows old days | done (trial import: 6 days fill 10 rows of "Your real running times") |
| M8 | Security pass and README walkthrough | claude | lib/guard.js, server.js, test/guard.test.js, README.md | all checks pass | done (`npm test` 44/44: Host allowlist, cross-site writes blocked, hardening headers) |
| 001 | Prove it on the laptop and phone | codex + kyle | agents/handoffs/001-codex-laptop.md | handoff acceptance | todo, now (code is on `main`: PR #47 merged) |
| 002 | start.ps1: gateway-based address, busy-port message | opencode (review: codex) | agents/handoffs/002-opencode-startps1.md | handoff acceptance | todo, after 001 step 3 |
