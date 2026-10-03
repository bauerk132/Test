'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createStore } = require('../lib/store');
const { importExport } = require('../scripts/import');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'import.js');

function makeDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'runsheet-import-'));
}

function syntheticPlan(day) {
  return { day, items: [{ id: 'a', t: 'Task A', cat: 'work', s: 540, e: 600 }] };
}

function syntheticExport() {
  return {
    exported: '2026-01-01T00:00:00.000Z',
    source: 'test',
    plans: { '2026-01-05': syntheticPlan('2026-01-05') },
    days: { '2026-01-05': { blocks: {}, day: '2026-01-05', updatedAt: '2026-01-05T10:00:00.000Z' } },
  };
}

test('fresh import writes plans and days at version 1', () => {
  const dataDir = makeDataDir();
  const result = importExport(syntheticExport(), { dataDir });
  assert.equal(result.imported, 2);
  assert.equal(result.overwrote, 0);
  assert.equal(result.skipped, 0);
  const store = createStore(dataDir);
  const plan = store.get('plans', '2026-01-05');
  assert.equal(plan.version, 1);
  assert.equal(plan.body.items[0].t, 'Task A');
  assert.equal(store.get('days', '2026-01-05').version, 1);
});

test('re-import without force skips existing docs and is not an error', () => {
  const dataDir = makeDataDir();
  importExport(syntheticExport(), { dataDir });
  const result = importExport(syntheticExport(), { dataDir });
  assert.equal(result.imported, 0);
  assert.equal(result.skipped, 2);
  assert.equal(result.invalid, 0);
  assert.match(result.messages[0], /already exists \(use --force to overwrite\)/);
  assert.equal(createStore(dataDir).get('plans', '2026-01-05').version, 1);
});

test('re-import with force bumps the version to 2', () => {
  const dataDir = makeDataDir();
  importExport(syntheticExport(), { dataDir });
  const result = importExport(syntheticExport(), { dataDir, force: true });
  assert.equal(result.overwrote, 2);
  assert.equal(result.skipped, 0);
  assert.equal(createStore(dataDir).get('plans', '2026-01-05').version, 2);
});

test('invalid plan is skipped and counted, valid ones still import', () => {
  const dataDir = makeDataDir();
  const exportObj = syntheticExport();
  exportObj.plans['2026-01-06'] = { day: '2026-01-06', items: 'not an array' };
  const result = importExport(exportObj, { dataDir });
  assert.equal(result.imported, 2);
  assert.equal(result.skipped, 1);
  assert.equal(result.invalid, 1);
  assert.match(result.messages.join('\n'), /skip plans\/2026-01-06: items must be an array/);
  assert.equal(createStore(dataDir).get('plans', '2026-01-06').exists, false);
});

test('bad id like "../x" is skipped and nothing is written outside the data dir', () => {
  const dataDir = makeDataDir();
  const exportObj = { plans: { '../x': syntheticPlan('2026-01-05') }, days: { '../x': {} } };
  const result = importExport(exportObj, { dataDir });
  assert.equal(result.imported, 0);
  assert.equal(result.skipped, 2);
  assert.equal(result.invalid, 2);
  assert.equal(fs.existsSync(path.join(dataDir, 'x.json')), false);
  assert.equal(fs.existsSync(path.join(dataDir, 'plans', '..', 'x.json')), false);
});

test('CLI exits 2 when the file argument is missing', () => {
  const run = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /Usage/);
});

test('CLI imports a file into --data and exits 0, then 1 when an entry is invalid', () => {
  const dataDir = makeDataDir();
  const file = path.join(makeDataDir(), 'export.json');
  fs.writeFileSync(file, JSON.stringify(syntheticExport()));
  const ok = spawnSync(process.execPath, [SCRIPT, file, '--data', dataDir], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /Imported 2, overwrote 0, skipped 0\./);

  const bad = syntheticExport();
  bad.plans['2026-01-07'] = { items: 5 };
  fs.writeFileSync(file, JSON.stringify(bad));
  const failed = spawnSync(process.execPath, [SCRIPT, file, '--data', dataDir], { encoding: 'utf8' });
  assert.equal(failed.status, 1);
});
