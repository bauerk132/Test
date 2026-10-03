const express = require("express");
const path = require("path");
const { createStore } = require("./lib/store");
const { validatePlan } = require("./lib/validate");
const { lanOnly } = require("./lib/guard");

// Same rule as scripts/import.js, so both read and write the same folder.
const DEFAULT_DATA = process.env.RUNSHEET_DATA || path.join(__dirname, "data");

function createApp(dataDir = DEFAULT_DATA) {
  const store = createStore(dataDir);
  const app = express();
  app.disable("x-powered-by"); // don't advertise "Express" to whoever asks

  // First, before anything else runs: only answer on this laptop's own addresses (lib/guard.js).
  // RUNSHEET_ALLOWED_HOSTS adds names, comma-separated, e.g. a VPN name for the laptop.
  app.use(lanOnly({ allowedHosts: (process.env.RUNSHEET_ALLOWED_HOSTS || "").split(",") }));

  // Cap JSON bodies so a stray client can't send huge payloads.
  app.use(express.json({ limit: "256kb" }));

  // Simple liveness check for the phone/laptop to verify the server is up.
  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // One document, e.g. /api/doc/days/2026-10-06. Missing docs come back as { exists: false, version: 0 }.
  app.get("/api/doc/:col/:id", (req, res) => {
    res.json(store.get(req.params.col, req.params.id));
  });

  // Write a document. Send { ifVersion, body }: ifVersion is the version you last saw (0 for new).
  // If someone else wrote first you get 409 with the current version, so you can re-read and retry.
  app.put("/api/doc/:col/:id", (req, res) => {
    const { ifVersion, body } = req.body || {};
    if (req.params.col === "plans") {
      const check = validatePlan(body);
      if (!check.ok) return res.status(400).json({ error: "invalid plan", errors: check.errors });
    }
    res.json(store.put(req.params.col, req.params.id, body, Number(ifVersion) || 0));
  });

  // Every document in a collection, sorted by date.
  app.get("/api/col/:col", (req, res) => {
    res.json({ docs: store.list(req.params.col) });
  });

  // Serve the Run Sheet page and its assets.
  app.use(express.static(path.join(__dirname, "public")));

  // Store errors carry an HTTP status (400 bad id, 409 conflict). Anything else is a 500.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const out = { error: status >= 500 && !err.status ? "server error" : err.message };
    if (err.current !== undefined) out.current = err.current;
    res.status(status).json(out);
  });

  return app;
}

module.exports = { createApp };

// Only listen when run directly, so tests can require the app without binding a port.
if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  // 0.0.0.0 so the phone can reach it over home Wi-Fi.
  const host = process.env.HOST || "0.0.0.0";
  createApp().listen(port, host, () => console.log(`Run Sheet on http://localhost:${port}`));
}
