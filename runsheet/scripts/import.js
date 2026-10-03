'use strict';
// Usage: node scripts/import.js <export.json> [--data <dir>] [--force]
// Exit codes: 0 = ok (already-exists skips are fine), 1 = some invalid entries were skipped,
// 2 = bad usage, unreadable or non-JSON file, or top-level value is not an object.
const fs = require('node:fs');
const path = require('node:path');
const { createStore, ID_RE } = require('../lib/store');
const { validatePlan } = require('../lib/validate');

const COLLECTIONS = ['plans', 'days'];

function defaultDataDir() {
  return process.env.RUNSHEET_DATA || path.join(__dirname, '..', 'data');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Returns { imported, overwrote, skipped, invalid, messages }.
// "skipped" counts every skip; "invalid" counts only the ones caused by bad data (these make the CLI exit 1).
// Messages only ever name col/id, never plan contents.
function importExport(exportObj, { dataDir = defaultDataDir(), force = false } = {}) {
  const store = createStore(dataDir);
  const result = { imported: 0, overwrote: 0, skipped: 0, invalid: 0, messages: [] };

  function skip(message, isInvalid) {
    result.skipped++;
    if (isInvalid) result.invalid++;
    result.messages.push(message);
  }

  for (const col of COLLECTIONS) {
    const entries = isPlainObject(exportObj[col]) ? exportObj[col] : {};
    for (const [id, body] of Object.entries(entries)) {
      const label = `${col}/${id}`;
      if (!ID_RE.test(id)) {
        skip(`skip ${label}: id must look like 2026-10-06`, true);
        continue;
      }
      if (!isPlainObject(body)) {
        skip(`skip ${label}: body must be a JSON object`, true);
        continue;
      }
      if (col === 'plans') {
        const check = validatePlan(body);
        if (!check.ok) {
          skip(`skip ${label}: ${check.errors[0]}`, true);
          continue;
        }
      }
      try {
        const existing = store.get(col, id);
        if (!existing.exists) {
          store.put(col, id, body, 0);
          result.imported++;
          result.messages.push(`imported ${label}`);
        } else if (force) {
          store.put(col, id, body, existing.version);
          result.overwrote++;
          result.messages.push(`overwrote ${label}`);
        } else {
          skip(`skip ${label}: already exists (use --force to overwrite)`, false);
        }
      } catch (err) {
        skip(`skip ${label}: ${err.message}`, true);
      }
    }
  }
  return result;
}

function main(argv) {
  const usage = 'Usage: node scripts/import.js <export.json> [--data <dir>] [--force]';
  let file = null;
  let dataDir = defaultDataDir();
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force') force = true;
    else if (arg === '--data') {
      if (i + 1 >= argv.length) { console.error(usage); return 2; }
      dataDir = path.resolve(argv[++i]);
    } else if (arg.startsWith('--') || file !== null) { console.error(usage); return 2; }
    else file = arg;
  }
  if (!file) { console.error(usage); return 2; }

  let exportObj;
  try {
    exportObj = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (err) {
    console.error(`Cannot read or parse ${file}: ${err.message}`);
    return 2;
  }
  if (!isPlainObject(exportObj)) {
    console.error('Export file must contain a JSON object at the top level');
    return 2;
  }

  const result = importExport(exportObj, { dataDir, force });
  result.messages.forEach((msg) => console.log(msg));
  console.log(`Imported ${result.imported}, overwrote ${result.overwrote}, skipped ${result.skipped}.`);
  return result.invalid > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { importExport };
