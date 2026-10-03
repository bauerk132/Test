# Task board

Status: `todo` → `doing` → `done` (acceptance passed) · `blocked` (reason given)

| # | Task | Owner | Files | Acceptance | Status |
|---|---|---|---|---|---|
| M0 | Save page source and synthetic fixture | claude | public/index.html, test/fixtures/ | scrub grep clean, page renders | done |
| M1 | Rules and this board | claude | AGENTS.md, agents/tasks.md | board exists | done |
| M2 | Server skeleton: static `public/` and `GET /api/health` | worker (quick) | package.json, server.js | `npm start` → `/api/health` returns `{"ok":true}` | done |
| M3 | Versioned JSON store: atomic writes, 409 on stale version, date-only ids | claude | lib/store.js, test/store.test.js | `npm test` | done |
| M4 | Plan validator and `npm run plan:check <file>` | worker (helper) | lib/validate.js, scripts/plan-check.js, test/validate.test.js | `npm test` | done |
| M5 | API routes plus `db-shim.js` (the page's `window.claude.use("db")`); 2-line page edit | claude | server.js, public/db-shim.js, public/index.html | tap persists after refresh (headless test) | todo |
| M6 | `scripts/start.ps1` prints the phone URL; README firewall note (Private only) | worker (quick) | scripts/start.ps1, README.md | script prints a LAN URL | todo |
| M7 | Import the Oct 3 export into `data/` | worker (quick) | scripts/import.js | history shows old days | todo |
| M8 | Security pass and README walkthrough | claude | README.md | all checks pass | todo |
| K1 | On the laptop: `npm install`, run start.ps1, open on phone, tap Started | kyle | none | phone tap shows on laptop | todo, after Oct 5 |
