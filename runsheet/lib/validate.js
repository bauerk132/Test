'use strict';

// The page still renders other categories, so an unknown one is only a warning.
const KNOWN_CATS = ['precalc', 'coursera', 'comptia', 'job', 'walk', 'calls',
  'chores', 'transit', 'self', 'sleep', 'free', 'planning'];

const COMMON_KEYS = ['id', 't', 'cat', 'd', 'fixed', 'tagText'];
const FLUID_KEYS = [...COMMON_KEYS, 'dur', 'at', 's', 'e'];
const FIXED_KEYS = [...COMMON_KEYS, 's', 'e', 'dur'];

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const isMinute = (v) => Number.isInteger(v) && v >= 0 && v <= 1440;

function validatePlan(body) {
  const errors = [];
  const warnings = [];
  const finish = () => ({ ok: errors.length === 0, errors, warnings });

  if (!isPlainObject(body)) {
    errors.push('plan must be a JSON object');
    return finish();
  }
  if ('day' in body && !(typeof body.day === 'string' && /^\d{4}-\d\d-\d\d$/.test(body.day))) {
    errors.push('day must be a string like YYYY-MM-DD');
  }
  if ('fluid' in body && typeof body.fluid !== 'boolean') {
    errors.push('fluid must be a boolean');
  }
  if (!Array.isArray(body.items)) {
    errors.push('items must be an array');
    return finish();
  }

  const fluid = body.fluid === true;
  const seenIds = new Set();
  let taskCount = 0;

  body.items.forEach((item, i) => {
    if (!isPlainObject(item)) {
      errors.push(`items[${i}]: must be an object`);
      return;
    }

    if ('sec' in item) {
      const name = `items[${i}] (section)`;
      if (!isNonEmptyString(item.sec)) errors.push(`${name}: sec must be a non-empty string`);
      for (const key of Object.keys(item)) {
        if (key !== 'sec') warnings.push(`${name}: unknown key "${key}"`);
      }
      return;
    }

    taskCount++;
    const label = typeof item.id === 'string' ? `items[${i}] (id "${item.id}")` : `items[${i}]`;
    const err = (msg) => errors.push(`${label}: ${msg}`);
    const warn = (msg) => warnings.push(`${label}: ${msg}`);

    if (!isNonEmptyString(item.id) || !/^[A-Za-z0-9_-]+$/.test(item.id)) {
      err('id must be a non-empty string of letters, digits, "_" or "-"');
    } else if (seenIds.has(item.id)) {
      err('duplicate id');
    } else {
      seenIds.add(item.id);
    }

    if (!isNonEmptyString(item.t)) err('t must be a non-empty string');

    if (!isNonEmptyString(item.cat)) err('cat must be a non-empty string');
    else if (!KNOWN_CATS.includes(item.cat)) warn(`unknown cat "${item.cat}"`);

    if ('d' in item && typeof item.d !== 'string') err('d must be a string');
    if ('fixed' in item && typeof item.fixed !== 'boolean') err('fixed must be a boolean');
    if ('tagText' in item && typeof item.tagText !== 'string') err('tagText must be a string');

    if (fluid) {
      if (!(typeof item.dur === 'number' && item.dur > 0 && item.dur <= 1440)) {
        err('dur must be a positive number (at most 1440)');
      }
      if ('at' in item && !isMinute(item.at)) err('at must be an integer 0..1440');
      if ('s' in item || 'e' in item) warn('s/e are ignored in fluid plans');
    } else {
      if (!isMinute(item.s)) err('s must be an integer 0..1440');
      if (!isMinute(item.e)) err('e must be an integer 0..1440');
      if (isMinute(item.s) && isMinute(item.e) && item.e < item.s) err('e must be >= s');
      if ('dur' in item) warn('dur is ignored in non-fluid plans');
    }

    const allowed = fluid ? FLUID_KEYS : FIXED_KEYS;
    for (const key of Object.keys(item)) {
      if (!allowed.includes(key)) warn(`unknown key "${key}"`);
    }
  });

  if (taskCount === 0) warnings.push('plan has no tasks');
  return finish();
}

module.exports = { validatePlan, KNOWN_CATS };
