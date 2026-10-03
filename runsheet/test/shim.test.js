const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("node:vm");
const { createApp } = require("../server");

const SRC = fs.readFileSync(path.join(__dirname, "..", "public", "db-shim.js"), "utf8");
const DAY = "2026-10-06";

async function start(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "runsheet-shim-"));
  const server = createApp(dir).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => { server.closeAllConnections(); server.close(); });
  return base;
}

// One simulated phone or laptop: the shim runs in its own vm context.
// options.localStorage: a shared fake storage (share it between devices to simulate a page reload).
// Returns the db, plus control helpers on the second return value via deviceWith().
function device(base, options = {}) {
  return deviceWith(base, options).db;
}

function deviceWith(base, options = {}) {
  const listeners = {};
  const net = { offline: false };
  const win = {
    addEventListener(name, fn) { listeners[name] = fn; },
    localStorage: options.localStorage,
  };
  const ctx = vm.createContext({
    window: win,
    console,
    fetch: (url, opts) => (net.offline ? Promise.reject(new TypeError("fetch failed")) : fetch(base + url, opts)),
    setTimeout: () => 0, // no background polling: refreshes happen only after writes
    clearTimeout: () => {},
  });
  vm.runInContext(SRC, ctx);
  return { db: win.claude.use("db"), net, listeners };
}

function fakeLocalStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

async function until(fn, ms = 2000) {
  const deadline = Date.now() + ms;
  while (!fn()) {
    if (Date.now() > deadline) throw new Error("timed out waiting for condition");
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function seed(base, body) {
  const res = await fetch(`${base}/api/doc/days/${DAY}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ifVersion: 0, body }),
  });
  assert.equal(res.status, 200);
}

async function serverDoc(base) {
  return (await fetch(`${base}/api/doc/days/${DAY}`)).json();
}

// Subscribe to the days collection and wait until the shim has received the seeded day.
async function learnDay(db) {
  let got = false;
  const unsubscribe = db.collection("days").onSnapshot((snap) => {
    if (snap.docs.some((d) => d.id === DAY)) got = true;
  }, (err) => { throw err; });
  await until(() => got);
  return unsubscribe;
}

test("doc snapshot starts empty, and set() saves to the server", async (t) => {
  const base = await start(t);
  const db = await device(base);
  let first = null;
  const unsubscribe = db.doc(`plans/${DAY}`).onSnapshot((snap) => { first = snap; }, () => {});
  await until(() => first);
  assert.equal(first.exists, false);
  unsubscribe();

  const body = { day: DAY, blocks: { a: { status: "started" } } };
  await db.doc(`days/${DAY}`).set(body);
  const saved = await serverDoc(base);
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.body, body);
});

test("two devices tapping different blocks at once keep both taps", async (t) => {
  const base = await start(t);
  await seed(base, { day: DAY, blocks: {} });
  const A = await device(base);
  const B = await device(base);
  const stopA = await learnDay(A);
  const stopB = await learnDay(B);

  await Promise.all([
    A.doc(`days/${DAY}`).set({ day: DAY, blocks: { a: { status: "started" } } }),
    B.doc(`days/${DAY}`).set({ day: DAY, blocks: { b: { status: "started" } } }),
  ]);
  stopA(); stopB();

  const saved = await serverDoc(base);
  assert.equal(saved.version, 3);
  assert.deepEqual(saved.body.blocks, { a: { status: "started" }, b: { status: "started" } });
});

test("one device removing a block while another changes a different one", async (t) => {
  const base = await start(t);
  await seed(base, { day: DAY, blocks: { x: { status: "done" }, y: { status: "started" } } });
  const A = await device(base);
  const B = await device(base);
  const stopA = await learnDay(A);
  const stopB = await learnDay(B);

  await Promise.all([
    A.doc(`days/${DAY}`).set({ day: DAY, blocks: { y: { status: "started" } } }),
    B.doc(`days/${DAY}`).set({ day: DAY, blocks: { x: { status: "done" }, y: { status: "done" } } }),
  ]);
  stopA(); stopB();

  const saved = await serverDoc(base);
  assert.deepEqual(saved.body.blocks, { y: { status: "done" } });
});

test("server errors reach the page with their status", async (t) => {
  const base = await start(t);
  const db = await device(base);
  await assert.rejects(db.doc(`plans/${DAY}`).set({ items: "nope" }), (err) => err.status === 400);
});

const PENDING_KEY = "runsheet-pending";

test("laptop asleep, then wakes: the unsent tap is merged in", async (t) => {
  const base = await start(t);
  await seed(base, { day: DAY, blocks: { a: { status: "started" } } });
  const storage = fakeLocalStorage();
  const { db: dbPromise, net, listeners } = deviceWith(base, { localStorage: storage });
  const db = await dbPromise;
  let latest = null;
  const stop = db.collection("days").onSnapshot((snap) => { latest = snap; }, () => {});
  await until(() => latest);

  net.offline = true;
  await assert.rejects(
    db.doc(`days/${DAY}`).set({ day: DAY, blocks: { a: { status: "started" }, b: { status: "started" } } }),
    (err) => err.status === undefined,
  );
  // Meanwhile another client saves version 2.
  await fetch(`${base}/api/doc/days/${DAY}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ifVersion: 1, body: { day: DAY, blocks: { a: { status: "done" } } } }),
  });

  net.offline = false;
  listeners.online();
  const expected = { a: { status: "done" }, b: { status: "started" } };
  await until(() => latest.docs.some((d) => d.id === DAY && JSON.stringify(d.data().blocks) === JSON.stringify(expected)));
  stop();

  const saved = await serverDoc(base);
  assert.equal(saved.version, 3);
  assert.deepEqual(saved.body.blocks, expected);
  assert.deepEqual(JSON.parse(storage.getItem(PENDING_KEY)), {});
});

test("a pending save survives a reload", async (t) => {
  const base = await start(t);
  await seed(base, { day: DAY, blocks: { a: { status: "started" } } });
  const storage = fakeLocalStorage();

  const one = deviceWith(base, { localStorage: storage });
  const db1 = await one.db;
  const stop1 = await learnDay(db1);
  one.net.offline = true;
  await assert.rejects(db1.doc(`days/${DAY}`).set({ day: DAY, blocks: { a: { status: "started" }, b: { status: "started" } } }));
  stop1();

  // "Reload": a brand new device sharing the same storage, this time online.
  const db2 = await device(base, { localStorage: storage });
  let latest = null;
  const stop2 = db2.collection("days").onSnapshot((snap) => { latest = snap; }, () => {});
  await until(() => latest && latest.docs.some((d) => d.data().blocks.b));
  stop2();

  const saved = await serverDoc(base);
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.body.blocks.b, { status: "started" });
});

test("a permanent 4xx error is not kept as pending", async (t) => {
  const base = await start(t);
  const storage = fakeLocalStorage();
  const db = await device(base, { localStorage: storage });
  await assert.rejects(db.doc(`plans/${DAY}`).set({ items: "nope" }), (err) => err.status === 400);
  assert.equal(JSON.parse(storage.getItem(PENDING_KEY))[`plans/${DAY}`], undefined);
});
