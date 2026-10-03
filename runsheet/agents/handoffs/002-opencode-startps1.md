# 002: start.ps1 picks the right Wi-Fi address and explains a busy port

Owner: `opencode` (cheap cloud model, on Kyle's laptop) · Reviewer: `codex` · Tries: 2, then back to Claude with the error output

## Goal
`scripts\start.ps1` prints the address the phone can actually reach, even with a VPN or a VM installed, and says clearly when the port is taken.

## Files to read
- `runsheet/scripts/start.ps1`, `runsheet/README.md` (the Troubleshooting section only)

## Files to change
- `runsheet/scripts/start.ps1` only

## Spec
1. **Address:** use the adapter that has an IPv4 default gateway, because that's the one on the home network:
   `Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' }`, then its `.IPv4Address.IPAddress`.
   Keep the current `$candidates` logic as the fallback when nothing has a gateway. Also add `Tailscale|ZeroTier|NordLynx|TAP|Hyper-V` to the `-notmatch` list.
2. **Busy port:** before `node server.js`, and also in `-DryRun`, check
   `Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue`.
   If it finds something, print `Port $Port is already in use (maybe Run Sheet is already running). Try: -Port 4001`, then `exit 1`.
3. Keep the existing style: a short comment above each block that says **why**, and plain `Write-Host` messages.
   It must stay compatible with Windows PowerShell 5.1, so no `??` and no `?.`.
4. Don't touch any other file. Don't change the printed format of the three address lines.

## Acceptance
Run these in PowerShell from `runsheet\`:
1. `powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -DryRun` prints the same IPv4 that `ipconfig` shows under the adapter with a Default Gateway.
2. Window A: `node -e "require('http').createServer().listen(4000)"`.
   Window B: `powershell -ExecutionPolicy Bypass -File scripts\start.ps1`, which prints the busy-port line and exits.
   `echo $LASTEXITCODE` prints `1`.
3. Close window A. Run step 2's command again, and the server starts normally.

## Done = report back
Paste the output of acceptance 1 and 2, plus `git diff --stat` (it should list one file).
Codex reviews the diff, then commits to `claude/festive-ramanujan-a33mdv` (`git pull` first) and pushes.
