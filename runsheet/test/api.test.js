const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createApp } = require("../server");

const PLAN = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "plan-sample.json"), "utf8"));

// Each test gets its own server and temp folder.
async function start(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "runsheet-api-"));
  const server = createApp(dir).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const close = () => { server.closeAllConnections(); server.close(); };
  t.after(close);
  return { dir, base, close };
}

function put(base, url, body) {
  return fetch(base + url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("health check", async (t) => {
  const { base } = await start(t);
  const res = await fetch(base + "/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("missing doc reads as version 0", async (t) => {
  const { base } = await start(t);
  const res = await fetch(base + "/api/doc/days/2026-10-06");
  assert.deepEqual(await res.json(), { id: "2026-10-06", exists: false, version: 0, body: null });
});

test("PUT creates, a stale PUT is a 409 and changes nothing", async (t) => {
  const { base } = await start(t);
  const url = "/api/doc/days/2026-10-06";
  const first = await put(base, url, { ifVersion: 0, body: { blocks: {} } });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).version, 1);
  assert.deepEqual((await (await fetch(base + url)).json()).body, { blocks: {} });

  const stale = await put(base, url, { ifVersion: 0, body: { blocks: { x: 1 } } });
  assert.equal(stale.status, 409);
  assert.deepEqual(await stale.json(), { error: "version conflict", current: 1 });
  assert.deepEqual((await (await fetch(base + url)).json()).body, { blocks: {} });
});

test("invalid plan is a 400 and is not stored; the fixture plan is accepted", async (t) => {
  const { base } = await start(t);
  const url = "/api/doc/plans/2026-10-06";
  const bad = await put(base, url, { ifVersion: 0, body: { items: "nope" } });
  assert.equal(bad.status, 400);
  const out = await bad.json();
  assert.equal(out.error, "invalid plan");
  assert.ok(Array.isArray(out.errors) && out.errors.length > 0);
  assert.equal((await (await fetch(base + url)).json()).exists, false);

  const good = await put(base, url, { ifVersion: 0, body: PLAN });
  assert.equal(good.status, 200);
});

test("bad collection or id is a 400", async (t) => {
  const { base } = await start(t);
  assert.equal((await fetch(base + "/api/doc/secrets/2026-10-06")).status, 400);
  assert.equal((await fetch(base + "/api/doc/days/..%2F..%2Fetc")).status, 400);
  const res = await put(base, "/api/doc/days/2026-10-06.json", { ifVersion: 0, body: {} });
  assert.equal(res.status, 400);
});

test("collection lists docs sorted by id", async (t) => {
  const { base } = await start(t);
  await put(base, "/api/doc/days/2026-10-07", { ifVersion: 0, body: { n: 7 } });
  await put(base, "/api/doc/days/2026-10-06", { ifVersion: 0, body: { n: 6 } });
  const { docs } = await (await fetch(base + "/api/col/days")).json();
  assert.deepEqual(docs.map((d) => d.id), ["2026-10-06", "2026-10-07"]);
});

test("static files are served, and the shim loads before the page script", async (t) => {
  const { base } = await start(t);
  const shim = await fetch(base + "/db-shim.js");
  assert.equal(shim.status, 200);
  assert.match(shim.headers.get("content-type"), /javascript/);

  const page = await fetch(base + "/");
  assert.equal(page.status, 200);
  const html = await page.text();
  const shimTag = html.indexOf('<script src="db-shim.js"></script>');
  const firstInline = html.search(/<script>/);
  assert.ok(shimTag >= 0, "shim tag present");
  assert.ok(firstInline >= 0, "inline script present");
  assert.ok(shimTag < firstInline, "shim comes first");
});

test("malformed JSON is a 400 with a JSON error", async (t) => {
  const { base } = await start(t);
  const res = await fetch(base + "/api/doc/days/2026-10-06", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: "{oops",
  });
  assert.equal(res.status, 400);
  const out = await res.json();
  assert.equal(typeof out.error, "string");
});

test("body over 256kb is a 413", async (t) => {
  const { base } = await start(t);
  const res = await put(base, "/api/doc/days/2026-10-06", { ifVersion: 0, body: { big: "x".repeat(300 * 1024) } });
  assert.equal(res.status, 413);
});
