'use strict';
// Usage: node scripts/plan-check.js <file.json>
// Exit codes: 0 = ok, 1 = plan has errors, 2 = bad usage or unreadable file.
const fs = require('node:fs');
const path = require('node:path');
const { validatePlan } = require('../lib/validate');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/plan-check.js <file.json>');
  process.exit(2);
}

const file = path.resolve(arg);
let plan;
try {
  plan = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`Cannot read or parse ${file}: ${err.message}`);
  process.exit(2);
}

const result = validatePlan(plan);
result.errors.forEach((msg) => console.log(`ERROR ${msg}`));
result.warnings.forEach((msg) => console.log(`warn  ${msg}`));

if (result.ok) {
  const items = plan.items;
  const sections = items.filter((it) => it && typeof it === 'object' && 'sec' in it).length;
  console.log(`OK: ${items.length - sections} tasks, ${sections} sections`);
}
process.exit(result.ok ? 0 : 1);
