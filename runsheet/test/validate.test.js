'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validatePlan } = require('../lib/validate');

const fixturePath = path.join(__dirname, 'fixtures', 'plan-sample.json');
const script = path.join(__dirname, '..', 'scripts', 'plan-check.js');

const task = (extra) => ({ id: 'a', t: 'Task', cat: 'free', ...extra });

test('sample fixture is ok with no errors or warnings', () => {
  const plan = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const result = validatePlan(plan);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.ok, true);
});

test('minimal non-fluid plan with s/e is ok', () => {
  const result = validatePlan({ items: [task({ s: 60, e: 120 })] });
  assert.equal(result.ok, true);
});

test('fluid task without dur is an error', () => {
  const result = validatePlan({ fluid: true, items: [task()] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((m) => m.includes('dur')));
});

test('duplicate id is an error', () => {
  const result = validatePlan({ items: [task({ s: 0, e: 1 }), task({ s: 1, e: 2 })] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((m) => m.includes('duplicate id')));
});

test('unknown cat is ok but warns', () => {
  const result = validatePlan({ items: [task({ cat: 'gym', s: 0, e: 1 })] });
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((m) => m.includes('gym')));
});

test('non-fluid with e < s is an error', () => {
  const result = validatePlan({ items: [task({ s: 100, e: 50 })] });
  assert.equal(result.ok, false);
});

test('items not an array is an error', () => {
  const result = validatePlan({ items: 'nope' });
  assert.equal(result.ok, false);
});

test('CLI exits 0 for the fixture and 1 for a bad plan', () => {
  const good = spawnSync(process.execPath, [script, fixturePath]);
  assert.equal(good.status, 0);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-check-'));
  const badFile = path.join(dir, 'bad.json');
  try {
    fs.writeFileSync(badFile, JSON.stringify({ items: 'nope' }));
    const bad = spawnSync(process.execPath, [script, badFile]);
    assert.equal(bad.status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
