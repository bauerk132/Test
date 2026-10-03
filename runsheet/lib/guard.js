// Keeps the server for this laptop and the phone on the same Wi-Fi. Two checks on every request:
// 1. Host: answer only when the browser reached us by an IP address or a local name. Otherwise a
//    web page could point its own domain at this laptop ("DNS rebinding") and read your data.
// 2. Origin: a write (PUT) must come from the Run Sheet page itself, never from another site.
const net = require("net");

// Names only a home network can hand out; nobody on the internet can register them.
const LOCAL_SUFFIXES = [".localhost", ".local", ".lan", ".home", ".home.arpa", ".internal"];

// "192.168.1.5:4000" -> "192.168.1.5", "[::1]:4000" -> "::1", "Laptop.local." -> "laptop.local"
function hostname(hostHeader) {
  const h = String(hostHeader || "").trim().toLowerCase();
  const v6 = /^\[([0-9a-f:.]+)\](?::\d+)?$/.exec(h);
  if (v6) return v6[1];
  return h.replace(/:\d+$/, "").replace(/\.$/, "");
}

function isLocalHost(hostHeader, extra = []) {
  const name = hostname(hostHeader);
  if (!name) return false;
  if (net.isIP(name)) return true; // typed as an address, so it isn't someone else's domain
  if (name === "localhost" || !name.includes(".")) return true; // the laptop's own name, e.g. kyle-laptop
  if (extra.includes(name)) return true;
  return LOCAL_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

// allowedHosts: extra names to accept, e.g. from RUNSHEET_ALLOWED_HOSTS="laptop.example-tailnet.ts.net"
function lanOnly({ allowedHosts = [] } = {}) {
  const extra = allowedHosts.map((h) => hostname(h)).filter(Boolean);
  return function lanOnlyMiddleware(req, res, next) {
    if (!isLocalHost(req.headers.host, extra)) {
      return res.status(403).json({ error: "Run Sheet only answers on this laptop's own addresses" });
    }
    const origin = req.headers.origin;
    if (origin && req.method !== "GET" && req.method !== "HEAD") {
      let from = null;
      try { from = new URL(origin).host.toLowerCase(); } catch (err) { /* "null" or junk: not our page */ }
      if (from !== String(req.headers.host).toLowerCase()) {
        return res.status(403).json({ error: "writes must come from the Run Sheet page" });
      }
    }
    // Small, free hardening: no MIME guessing, no framing by other sites, no referrer leaks.
    res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" });
    next();
  };
}

module.exports = { lanOnly, isLocalHost, hostname };
