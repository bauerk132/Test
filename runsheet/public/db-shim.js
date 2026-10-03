// db-shim.js: the Run Sheet page was built as a claude.ai artifact, where it saves through
// window.claude.use("db"). This file gives the page that same small API, backed by the laptop's
// server, so the page itself barely changes. Load it before the page's own script.
//
// What the page uses, and what it becomes here:
//   db.doc("days/2026-10-06").set(body)            -> PUT /api/doc/days/2026-10-06
//   db.doc("plans/2026-10-06").onSnapshot(fn, err) -> GET /api/doc/plans/2026-10-06 every 5 s
//   db.collection("days").onSnapshot(fn, err)      -> GET /api/col/days every 5 s
(function () {
  "use strict";
  if (window.claude && typeof window.claude.use === "function") return; // real artifact runtime: leave it alone

  var POLL_MS = 5000;
  var seen = {};    // "days/2026-10-06" -> { version, body } the page last received: the base for merges
  var writing = 0;  // writes in flight
  var writeSeq = 0; // bumps when a write starts or ends, so a poll that overlapped a write is thrown away
  var pollers = []; // so a finished write, or the phone waking up, can refresh right away

  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  function request(method, url, payload) {
    return fetch(url, {
      method: method,
      cache: "no-store", // phones love to cache GETs; we always want the live file
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok) return data;
        var err = new Error(data.error || "HTTP " + res.status);
        err.status = res.status;
        throw err;
      });
    });
  }

  function docUrl(col, id) { return "/api/doc/" + encodeURIComponent(col) + "/" + encodeURIComponent(id); }
  function remember(col, doc) { seen[col + "/" + doc.id] = { version: doc.version, body: doc.body }; }
  function refreshAll() { pollers.slice().forEach(function (tick) { tick(); }); }

  // Three-way merge of a day's blocks, for when the phone and the laptop save at nearly the same time.
  // Keep each block this device changed since it last heard from the server; take every other block
  // from the server (the other device's taps). If both changed the same block, this device wins.
  function merge(base, mine, theirs) {
    if (!isObj(mine) || !isObj(mine.blocks) || !isObj(theirs) || !isObj(theirs.blocks)) return mine;
    var was = isObj(base) && isObj(base.blocks) ? base.blocks : {};
    var ids = {};
    [was, mine.blocks, theirs.blocks].forEach(function (o) { Object.keys(o).forEach(function (k) { ids[k] = true; }); });
    var blocks = {};
    Object.keys(ids).forEach(function (k) {
      var changedHere = JSON.stringify(mine.blocks[k]) !== JSON.stringify(was[k]);
      var pick = changedHere ? mine.blocks[k] : theirs.blocks[k];
      if (pick !== undefined) blocks[k] = pick;
    });
    var out = {};
    Object.keys(mine).forEach(function (p) { out[p] = mine[p]; });
    out.blocks = blocks;
    return out;
  }

  function save(col, id, body) {
    var key = col + "/" + id;
    var base = seen[key]; // what the page's copy was built from
    var merged = false;
    writing++; writeSeq++;

    function put(payload, version, triesLeft) {
      return request("PUT", docUrl(col, id), { ifVersion: version, body: payload }).catch(function (err) {
        if (err.status !== 409 || !triesLeft) throw err;
        // 409: the other device saved first. Re-read, keep both devices' changes, try again.
        return request("GET", docUrl(col, id)).then(function (cur) {
          merged = true;
          return put(merge(base && base.body, body, cur.body), cur.version, triesLeft - 1);
        });
      });
    }
    function finish() { writing--; writeSeq++; refreshAll(); }

    return put(body, base ? base.version : 0, 3).then(function (doc) {
      // After a merge the page doesn't have the other device's taps yet, so keep the old base
      // until the refresh below delivers the merged day. Otherwise the server now matches the page.
      if (!merged) remember(col, doc);
      finish();
    }, function (err) {
      finish();
      throw err; // the page shows "Couldn't save online. Kept on this device"
    });
  }

  // Ask the server every POLL_MS and call deliver() only when the answer changed,
  // so the page doesn't redraw every 5 seconds for nothing.
  function poll(load, deliver, onError) {
    var lastKey = null, failed = false, busy = false, again = false, stopped = false, timer = null;
    function tick() {
      if (stopped) return;
      if (busy) { again = true; return; }
      busy = true;
      clearTimeout(timer);
      var seq = writeSeq;
      load().then(function (result) {
        // A write started or ended while we were asking, so this answer may be stale. Skip it:
        // the write refreshes every poller when it's done.
        if (stopped || writing || seq !== writeSeq) return;
        var key = JSON.stringify(result);
        if (key === lastKey && !failed) return;
        lastKey = key;
        failed = false; // also lets the page replace its "Offline" message once we're back
        deliver(result);
      }, function (err) {
        if (!failed && onError) onError(err);
        failed = true;
      }).catch(function (err) {
        console.error(err); // a bug in the page's callback; keep polling anyway
      }).then(function () {
        busy = false;
        if (stopped) return;
        if (again) { again = false; tick(); } else timer = setTimeout(tick, POLL_MS);
      });
    }
    pollers.push(tick);
    tick();
    return function unsubscribe() {
      stopped = true;
      clearTimeout(timer);
      pollers = pollers.filter(function (t) { return t !== tick; });
    };
  }

  var db = {
    doc: function (path) {
      var parts = String(path).split("/");
      var col = parts[0], id = parts[1];
      return {
        id: id,
        set: function (body) { return save(col, id, body); },
        onSnapshot: function (onNext, onError) {
          return poll(function () { return request("GET", docUrl(col, id)); }, function (doc) {
            remember(col, doc);
            onNext({ id: doc.id, exists: !!doc.exists, data: function () { return doc.body; } });
          }, onError);
        }
      };
    },
    collection: function (col) {
      return {
        onSnapshot: function (onNext, onError) {
          return poll(function () { return request("GET", "/api/col/" + encodeURIComponent(col)); }, function (res) {
            var docs = (res.docs || []).filter(function (d) { return d.exists; });
            docs.forEach(function (d) { remember(col, d); });
            onNext({
              docs: docs.map(function (d) { return { id: d.id, data: function () { return d.body; } }; }),
              metadata: { hasPendingWrites: false }
            });
          }, onError);
        }
      };
    }
  };

  // Phones pause background tabs. When the page comes back, catch up at once instead of in 5 s.
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") refreshAll();
    });
  }
  if (typeof window.addEventListener === "function") window.addEventListener("online", refreshAll);

  window.claude = window.claude || {};
  window.claude.use = function (name) { return Promise.resolve(name === "db" ? db : null); };
})();
