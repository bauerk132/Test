const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { createApp } = require("../server");
const { isLocalHost, hostname } = require("../lib/guard");

test("hostname strips the port and the trailing dot", () => {
  assert.equal(hostname("192.168.1.5:4000"), "192.168.1.5");
  assert.equal(hostname("[::1]:4000"), "::1");
  assert.equal(hostname("Laptop.Local."), "laptop.local");
  assert.equal(hostname(undefined), "");
});

test("local addresses and names are allowed", () => {
  for (const h of ["localhost:4000", "127.0.0.1:4000", "192.168.1.23:4000", "[::1]:4000",
    "KYLE-LAPTOP:4000", "kyle-laptop.local:4000", "laptop.home.arpa"]) {
    assert.equal(isLocalHost(h), true, h);
  }
});

test("internet names are refused, even ones that look local", () => {
  for (const h of ["evil.example:4000", "127.0.0.1.nip.io", "localhost.evil.com", "", undefined]) {
    assert.equal(isLocalHost(h), false, String(h));
  }
});

test("extra allowed hosts are accepted", () => {
  assert.equal(isLocalHost("laptop.tailnet.ts.net:4000"), false);
  assert.equal(isLocalHost("laptop.tailnet.ts.net:4000", ["laptop.tailnet.ts.net"]), true);
});

// fetch() won't let us set Host, so use node:http to send exactly the headers an attacker would.
function send(port, { method = "GET", url = "/api/health", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method, path: url, headers }, (res) => {
      let text = "";
      res.on("data", (c) => (text += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

async function start(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "runsheet-guard-"));
  const server = createApp(dir).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return server.address().port;
}

test("a request under someone else's domain gets 403 (DNS rebinding)", async (t) => {
  const port = await start(t);
  const res = await send(port, { headers: { Host: `evil.example:${port}` } });
  assert.equal(res.status, 403);
  assert.match(res.text, /own addresses/);
});

test("a write from another site gets 403; from the page itself it works", async (t) => {
  const port = await start(t);
  const host = `127.0.0.1:${port}`;
  const body = JSON.stringify({ ifVersion: 0, body: { blocks: {} } });
  const json = { "Content-Type": "application/json", Host: host };
  const url = "/api/doc/days/2026-10-06";

  const evil = await send(port, { method: "PUT", url, body, headers: { ...json, Origin: "http://evil.example" } });
  assert.equal(evil.status, 403);
  assert.match(evil.text, /Run Sheet page/);
  const sandboxed = await send(port, { method: "PUT", url, body, headers: { ...json, Origin: "null" } });
  assert.equal(sandboxed.status, 403);

  const ok = await send(port, { method: "PUT", url, body, headers: { ...json, Origin: `http://${host}` } });
  assert.equal(ok.status, 200);
  assert.equal(JSON.parse(ok.text).version, 1);
});

test("responses carry the hardening headers and don't name Express", async (t) => {
  const port = await start(t);
  const res = await send(port, { headers: { Host: `localhost:${port}` } });
  assert.equal(res.status, 200);
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.equal(res.headers["x-frame-options"], "DENY");
  assert.equal(res.headers["referrer-policy"], "no-referrer");
  assert.equal(res.headers["x-powered-by"], undefined);
});
