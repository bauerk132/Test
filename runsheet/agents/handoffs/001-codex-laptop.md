# 001: Prove it works on the real laptop and phone

Owner: `codex` (on Kyle's Windows laptop, Kyle holds the phone) · Tries: 2 per step, then stop and report

## Goal
The Run Sheet runs on Kyle's laptop, his phone opens it over home Wi-Fi, and a tap on the phone shows on the laptop.

## Files to read
- `runsheet/AGENTS.md`, `runsheet/README.md`. Nothing else.

## Files to change
- None. **This handoff runs things and reports. It doesn't edit code.** A fix goes to handoff 002 or back to Claude.

## Spec
Run each step in PowerShell, in the order given. Paste the output of each one.
1. Get the code. If there's no clone on the laptop yet: `git clone https://github.com/bauerk132/Test.git`, then `cd Test`. Then:
   `git fetch origin claude/festive-ramanujan-a33mdv` · `git checkout claude/festive-ramanujan-a33mdv` · `git pull`
2. `cd runsheet` · `npm install` · `npm test`. Expect `# fail 0`; the pass count is 44 or more.
3. `powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -DryRun`. Expect an `On your phone: http://192.168.x.x:4000` line, or 10.x.x.x on some routers.
   Compare it with `ipconfig`: it should be the IPv4 address of the adapter that **has a Default Gateway**.
4. The same command without `-DryRun`. Leave that window open, since closing it stops the server.
5. Windows Firewall prompt: tick **Private networks only**. Check that the Wi-Fi profile is Private (README → "Phone access and Windows Firewall").
6. Kyle: open the phone URL on the phone and `http://localhost:4000` on the laptop. Tap **Started** on any item on the phone.
   The laptop shows it as pressed within about 5 s. Reload the phone page, and the tap is still there.
7. Kyle has the export file (`runsheet-export-2026-10-03.json`, from the claude.ai session). Run:
   `npm run import -- "C:\path\to\runsheet-export-2026-10-03.json"`. Expect `Imported 14, overwrote 0, skipped 0.`
   **Never copy that file into the repo, and never commit it.** It holds personal data.
8. `git status` must show no changes. If `data/` or the export shows up, stop and report it.

## Acceptance
Steps 2, 3 and 6 pass, and step 7 prints `Imported …`.

## Done = report back
Paste the output of steps 2, 3, 7 and 8, and say yes or no for step 6 (tap shows on the laptop, and survives a reload).
If a step fails twice, stop there and paste the exact error. Don't try to fix it.
