# Run Sheet

## What it is

A tiny local web app. A Node server on your Windows laptop serves the Run Sheet
page, and you open that page from your phone over your home Wi-Fi. Everything
stays on your own network; nothing is sent to the internet.

## Setup

1. Install the **LTS** version of Node.js from https://nodejs.org (accept the defaults).
2. Open PowerShell and go to the project folder:

   ```powershell
   cd runsheet
   ```

3. Install the libraries (once):

   ```powershell
   npm install
   ```

## Run

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1
```

Windows normally blocks PowerShell scripts. `-ExecutionPolicy Bypass` lifts that
block for this one run only. It does not change any setting on your computer.

The script prints two addresses:

```
Run Sheet
  On this laptop:  http://localhost:4000
  On your phone:   http://192.168.x.x:4000   (same Wi-Fi)
  Stop: press Ctrl+C
```

To just see the addresses without starting the server, add `-DryRun`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -DryRun
```

## Phone access and Windows Firewall

The first time you run it, Windows Firewall asks whether to let Node.js talk on
the network. Tick **Private networks only**. Never allow **Public networks**.

Make sure your home Wi-Fi is set to Private:
Settings -> Network & internet -> Wi-Fi -> (your network) -> Network profile -> **Private**.

If you missed the prompt or clicked the wrong box, add a rule by hand. Open
PowerShell **as Administrator** and run:

```powershell
New-NetFirewallRule -DisplayName "Run Sheet 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Profile Private -Action Allow
```

## Safety

- There is **no login**. Anyone on the same Wi-Fi can open the page and see your data.
- Do not run it on public Wi-Fi (library, cafe, school).
- Your data lives in `runsheet/data/`. That folder is gitignored and is never committed.

## Plans

Check a plan file for mistakes:

```powershell
npm run plan:check <file>
```

## Import old data

Bring in an earlier export (existing days are skipped unless you add `--force`):

```powershell
npm run import -- <export.json>
```

## Tests

```powershell
npm test
```

## Troubleshooting

**My phone can't connect**
- Are the phone and laptop on the same Wi-Fi (not guest Wi-Fi or mobile data)?
- Is the laptop's network set to Private?
- Is there a firewall rule for the port (see above)?
- Use `http://`, not `https://`. The server has no certificate.
- Re-run with `-DryRun` and check the IP address is the one you typed.

**"Port in use" / EADDRINUSE**
Another program (or an old copy of Run Sheet) is using port 4000. Pick another:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -Port 4001
```

If you change the port, the firewall rule needs the new port number too.

**"Node.js not found"**
Install Node LTS from https://nodejs.org, then close and reopen PowerShell.
