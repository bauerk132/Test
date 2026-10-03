// Versioned JSON-file store: one file per document, data/<col>/<id>.json = { version, updatedAt, body }.
// Plain files (not a database) so Kyle can open them in Notepad and there are no native modules to build on Windows.
const fs = require("fs");
const path = require("path");

const COLS = new Set(["plans", "days"]);
const ID_RE = /^\d{4}-\d\d-\d\d$/; // date ids only: this also blocks path tricks like "../../secret"

function httpError(status, message, extra) {
  const err = new Error(message);
  err.status = status;
  return Object.assign(err, extra);
}

function checkPath(col, id) {
  if (!COLS.has(col)) throw httpError(400, `unknown collection "${col}"`);
  if (id !== undefined && !ID_RE.test(id)) throw httpError(400, `id must look like 2026-10-06`);
}

function createStore(root) {
  const fileFor = (col, id) => path.join(root, col, id + ".json");

  function readDoc(col, id) {
    let raw;
    try {
      raw = fs.readFileSync(fileFor(col, id), "utf8");
    } catch (err) {
      if (err.code === "ENOENT") return { id, exists: false, version: 0, body: null };
      throw err;
    }
    // A hand-edited file with a typo should fail loudly, not be silently overwritten.
    let doc;
    try { doc = JSON.parse(raw); } catch (err) {
      throw httpError(500, `${col}/${id}.json is not valid JSON: ${err.message}`);
    }
    return { id, exists: true, version: doc.version || 0, updatedAt: doc.updatedAt, body: doc.body };
  }

  // Windows can briefly lock a file (antivirus, an open editor), so retry the rename a few times.
  function renameWithRetry(from, to) {
    for (let i = 0; ; i++) {
      try { return fs.renameSync(from, to); } catch (err) {
        if (i >= 4 || !["EPERM", "EBUSY", "EACCES"].includes(err.code)) throw err;
        const until = Date.now() + 20 * (i + 1);
        while (Date.now() < until) { /* short wait */ }
      }
    }
  }

  return {
    get(col, id) {
      checkPath(col, id);
      return readDoc(col, id);
    },

    // ifVersion must equal the stored version (0 = "I expect it not to exist yet").
    // A mismatch means someone else wrote first, so it's a 409, the same rule the artifact db uses.
    // Everything here is synchronous, so two requests can't interleave between the check and the write.
    put(col, id, body, ifVersion) {
      checkPath(col, id);
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw httpError(400, "body must be a JSON object");
      }
      const current = readDoc(col, id);
      if ((ifVersion || 0) !== current.version) {
        throw httpError(409, "version conflict", { current: current.version });
      }
      const doc = { version: current.version + 1, updatedAt: new Date().toISOString(), body };
      const dir = path.join(root, col);
      fs.mkdirSync(dir, { recursive: true });
      // Write to a temp file and then rename: a crash mid-write leaves the old file intact, never half a file.
      const tmp = path.join(dir, `.${id}.${process.pid}.${Date.now()}.tmp`);
      fs.writeFileSync(tmp, JSON.stringify(doc, null, 1));
      renameWithRetry(tmp, fileFor(col, id));
      return { id, exists: true, version: doc.version, updatedAt: doc.updatedAt, body };
    },

    list(col) {
      checkPath(col);
      let names;
      try { names = fs.readdirSync(path.join(root, col)); } catch (err) {
        if (err.code === "ENOENT") return [];
        throw err;
      }
      return names
        .filter((n) => n.endsWith(".json") && ID_RE.test(n.slice(0, -5)))
        .sort()
        .map((n) => readDoc(col, n.slice(0, -5)));
    },
  };
}

module.exports = { createStore, COLS, ID_RE };
