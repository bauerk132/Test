const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createStore } = require("../lib/store");

function freshStore() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "runsheet-store-"));
  return { root, store: createStore(root) };
}

test("missing doc reads as version 0", () => {
  const { store } = freshStore();
  assert.deepEqual(store.get("days", "2026-10-06"), { id: "2026-10-06", exists: false, version: 0, body: null });
});

test("create, then update with the right version", () => {
  const { store } = freshStore();
  const a = store.put("days", "2026-10-06", { blocks: {} }, 0);
  assert.equal(a.version, 1);
  const b = store.put("days", "2026-10-06", { blocks: { x: 1 } }, 1);
  assert.equal(b.version, 2);
  assert.deepEqual(store.get("days", "2026-10-06").body, { blocks: { x: 1 } });
});

test("stale version is a 409 and does not overwrite", () => {
  const { store } = freshStore();
  store.put("days", "2026-10-06", { n: 1 }, 0);
  store.put("days", "2026-10-06", { n: 2 }, 1);
  assert.throws(() => store.put("days", "2026-10-06", { n: 99 }, 1), (e) => e.status === 409 && e.current === 2);
  assert.throws(() => store.put("days", "2026-10-06", { n: 99 }), (e) => e.status === 409);
  assert.equal(store.get("days", "2026-10-06").body.n, 2);
});

test("bad collection or id is a 400 (blocks path traversal)", () => {
  const { store } = freshStore();
  for (const [col, id] of [["secrets", "2026-10-06"], ["days", "../../etc"], ["days", "2026-10-06.json"], ["days", ""]]) {
    assert.throws(() => store.put(col, id, {}, 0), (e) => e.status === 400, `${col}/${id}`);
  }
  assert.throws(() => store.put("days", "2026-10-06", [], 0), (e) => e.status === 400);
});

test("list returns docs sorted and ignores stray files", () => {
  const { root, store } = freshStore();
  store.put("plans", "2026-10-07", { items: [] }, 0);
  store.put("plans", "2026-10-06", { items: [] }, 0);
  fs.writeFileSync(path.join(root, "plans", "notes.txt"), "hi");
  fs.writeFileSync(path.join(root, "plans", ".2026-10-08.1.2.tmp"), "{");
  assert.deepEqual(store.list("plans").map((d) => d.id), ["2026-10-06", "2026-10-07"]);
  assert.deepEqual(store.list("days"), []);
});

test("writes leave no temp files and corrupt files fail loudly", () => {
  const { root, store } = freshStore();
  store.put("days", "2026-10-06", { a: 1 }, 0);
  assert.deepEqual(fs.readdirSync(path.join(root, "days")), ["2026-10-06.json"]);
  fs.writeFileSync(path.join(root, "days", "2026-10-06.json"), "{oops");
  assert.throws(() => store.get("days", "2026-10-06"), (e) => e.status === 500);
});
