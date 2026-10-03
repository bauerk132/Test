const express = require("express");
const path = require("path");

const app = express();

// Cap JSON bodies so a stray client can't send huge payloads.
app.use(express.json({ limit: "256kb" }));

// Simple liveness check for the phone/laptop to verify the server is up.
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the Run Sheet page and its assets.
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;

// Only listen when run directly, so tests can require the app without binding a port.
if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  // 0.0.0.0 so the phone can reach it over home Wi-Fi.
  const host = process.env.HOST || "0.0.0.0";
  app.listen(port, host, () => console.log(`Run Sheet on http://localhost:${port}`));
}
