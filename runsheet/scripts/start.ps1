# Starts the Run Sheet server and prints the addresses to open.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\start.ps1 [-DryRun] [-Port 4001]
param([switch]$DryRun, [int]$Port = 4000)

# If -Port was not typed but PORT is set in the environment, use that.
# (Older PowerShell lacks the null-coalescing operator, so we check by hand.)
if (-not $PSBoundParameters.ContainsKey('Port') -and $env:PORT) {
    $Port = [int]$env:PORT
}

# Run from the project folder no matter where the script was launched from,
# so "node server.js" and "npm install" find the right files.
Set-Location (Join-Path $PSScriptRoot '..')

# The server needs Node.js; give a friendly message instead of a red error.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Install the LTS version from https://nodejs.org, then reopen PowerShell."
    exit 1
}

# First run only: download the libraries the server depends on.
if (-not (Test-Path 'node_modules')) {
    Write-Host "Installing dependencies (first run only)..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed. Check your internet connection and try again."
        exit 1
    }
}

# Find the laptop's Wi-Fi address so the phone knows where to connect.
# Skip loopback, link-local (169.254), and virtual adapters (WSL, VMs, VPNs),
# because the phone cannot reach those.
$candidates = @(Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.InterfaceAlias -notmatch 'vEthernet|WSL|Loopback|VirtualBox|VMware|Tailscale|ZeroTier|NordLynx|TAP|Hyper-V'
    })

# Prefer the adapter that has an IPv4 default gateway: that is the one on the
# home network, even when a VPN or VM adds extra addresses. Fall back to the
# old DHCP-first logic when nothing has a gateway.
$gatewayed = @(Get-NetIPConfiguration |
    Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
    ForEach-Object { $_.IPv4Address.IPAddress })
$best = $null
foreach ($address in $gatewayed) {
    $match = $candidates | Where-Object { $_.IPAddress -eq $address } | Select-Object -First 1
    if ($match) {
        $best = $match
        break
    }
}
if (-not $best) {
    # No gateway adapter (or it was filtered above); prefer router-handed (DHCP) addresses.
    $best = $candidates | Where-Object { $_.PrefixOrigin -eq 'Dhcp' } | Select-Object -First 1
}
if (-not $best) {
    $best = $candidates | Select-Object -First 1
}

Write-Host ""
Write-Host "Run Sheet"
Write-Host "  On this laptop:  http://localhost:$Port"
if ($best) {
    Write-Host "  On your phone:   http://$($best.IPAddress):$Port   (same Wi-Fi)"
} else {
    Write-Host "  On your phone:   No Wi-Fi address found; is the laptop on Wi-Fi?"
}
Write-Host "  Stop: press Ctrl+C"
Write-Host ""

# A busy port gives a plain message instead of a Node crash dump, in both
# real and dry runs. Suggest the next port up from the one that is taken.
# NOTE: no "-State Listen" filter here. Node's listening sockets show up
# under Get-NetTCPConnection with state Bound (raw 0) on this machine, so
# filtering for Listen misses both the test listener and a real server.
# Any socket on the port means it is taken.
$listener = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "Port $Port is already in use (maybe Run Sheet is already running). Try: -Port $($Port + 1)"
    exit 1
}

# Dry run only shows the addresses; it does not start the server.
if ($DryRun) {
    exit 0
}

# server.js reads the port from the PORT environment variable.
$env:PORT = "$Port"
node server.js
