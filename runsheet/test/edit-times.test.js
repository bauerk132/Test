// Edit times (manual Started/Done) is a required feature. These tests fail
// if a rewrite of public/index.html drops it.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const PAGE = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");

// Pull one top-level function out of the page so we can run it here.
function grab(name) {
  const start = PAGE.indexOf("function " + name + "(");
  assert.notEqual(start, -1, name + " is missing from index.html");
  const end = PAGE.indexOf("\n  }\n", start);
  return PAGE.slice(start, end + 4);
}

test("every card has an Edit times button and editor", () => {
  assert.match(PAGE, /"Edit times"/);
  assert.match(PAGE, /function setTimes\(b, startMin, doneMin\)/);
  assert.match(PAGE, /inp\.type = "time"/);
  assert.match(PAGE, /className = "time-in"/);
  assert.match(PAGE, /Done can't be before Started/);
});

test("re-render waits while a time box is focused", () => {
  assert.match(PAGE, /classList\.contains\("time-in"\)/);
});

test("time strings convert to minutes since midnight and back", () => {
  const toHHMM = new Function(grab("toHHMM") + "; return toHHMM;")();
  const fromHHMM = new Function(grab("fromHHMM") + "; return fromHHMM;")();
  assert.equal(fromHHMM("08:45"), 525);
  assert.equal(fromHHMM("00:00"), 0);
  assert.equal(fromHHMM("23:59"), 1439);
  assert.equal(fromHHMM(""), null);
  assert.equal(fromHHMM("25:00"), null);
  assert.equal(toHHMM(525), "08:45");
  assert.equal(toHHMM(0), "00:00");
  assert.equal(toHHMM(undefined), "");
  for (const m of [0, 61, 525, 1439]) assert.equal(fromHHMM(toHHMM(m)), m);
});
