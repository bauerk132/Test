// REPL driver for the Precalculus web app: stdin commands -> headless Chromium via Playwright.
// Pipe a heredoc for one-shot runs, or run under tmux and send-keys one command at a time.
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as readline from 'node:readline';

const APP_URL = process.env.APP_URL_OVERRIDE || 'http://localhost:3000';
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

// Playwright is not a project dependency; use the container's global install
// (its version matches the pre-downloaded Chromium in /opt/pw-browsers).
async function loadChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    const require = createRequire(import.meta.url);
    return require(require.resolve('playwright', { paths: [globalRoot] })).chromium;
  }
}

let browser = null;
let page = null;
const errors = [];

function needPage() {
  if (!page) throw new Error('no page - run "open" first');
  return page;
}

// The app smooth-scrolls to top on every view change; screenshots taken
// mid-animation show the wrong section with an unpainted strip at the bottom.
async function settle() {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 60 && stable < 3; i++) {
    const y = await needPage().evaluate(() => window.scrollY);
    stable = y === last ? stable + 1 : 0;
    last = y;
    await needPage().waitForTimeout(100);
  }
}

const COMMANDS = {
  async open(url) {
    if (page) return console.log('already open:', page.url());
    const chromium = await loadChromium();
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} (${r.failure()?.errorText})`));
    try {
      await page.goto(url || APP_URL, { waitUntil: 'domcontentloaded' });
      await page.getByText('Begin Practice Session').waitFor({ timeout: 30_000 });
    } catch (e) {
      await COMMANDS.quit();
      throw e;
    }
    console.log('opened', page.url());
  },

  async goto(url) {
    await needPage().goto(url || APP_URL, { waitUntil: 'domcontentloaded' });
    console.log('at', page.url());
  },

  // "ss name" = viewport, "ss name full" = whole scrollable page.
  async ss(args) {
    const [name, mode] = args.split(/\s+/);
    const file = path.join(SHOT_DIR, `${name || `ss-${Date.now()}`}.png`);
    await needPage().screenshot({ path: file, fullPage: mode === 'full' });
    console.log('screenshot:', file);
  },

  async 'click-text'(text) {
    const button = needPage().locator('button', { hasText: text }).first();
    await button.click({ timeout: 10_000 });
    console.log('clicked button containing', JSON.stringify(text));
  },

  async click(selector) {
    await needPage().locator(selector).first().click({ timeout: 10_000 });
    console.log('clicked', selector);
  },

  // fill <css-selector-without-spaces> <text...>
  async fill(args) {
    const [selector, ...words] = args.split(' ');
    await needPage().locator(selector).first().fill(words.join(' '), { timeout: 10_000 });
    console.log('filled', selector);
  },

  async press(key) {
    await needPage().keyboard.press(key);
    console.log('pressed', key);
  },

  async 'wait-text'(text) {
    await needPage().getByText(text).first().waitFor({ timeout: 15_000 });
    console.log('found text', JSON.stringify(text));
  },

  async text(selector) {
    const body = await needPage().locator(selector || 'body').first().innerText();
    console.log(body.length > 3000 ? `${body.slice(0, 3000)}\n...(${body.length} chars, truncated)` : body);
  },

  async eval(expr) {
    console.log(JSON.stringify(await needPage().evaluate(expr)));
  },

  errors() {
    console.log(errors.length ? errors.join('\n') : 'no console errors');
  },

  // --- app-specific shortcuts ---

  async start() {
    await COMMANDS['click-text']('Begin Practice Session');
    await COMMANDS['wait-text']('Submit & View Diagnostic Grade Breakdown');
    await settle();
    await COMMANDS.progress();
  },

  // answer <n> <text>: type into the n-th (1-based) exam question's final-answer box.
  async answer(args) {
    const [n, ...words] = args.split(' ');
    const input = needPage().locator('input[placeholder^="Enter exact formula"]').nth(Number(n) - 1);
    await input.scrollIntoViewIfNeeded();
    await input.fill(words.join(' '));
    console.log(`answered question ${n}`);
  },

  async progress() {
    console.log('progress:', await needPage().getByText(/\d+ \/ \d+ Completed/).first().innerText());
  },

  async submit() {
    await COMMANDS['click-text']('Submit & View Diagnostic Grade Breakdown');
    await COMMANDS['wait-text']('Diagnostic Gap Engine');
    await settle();
    // canvas-confetti draws on a <canvas> appended to <body> and removes it when done (~5s).
    await needPage().waitForFunction(() => !document.querySelector('body > canvas'), null, { timeout: 10_000 });
  },

  async settle() {
    await settle();
    console.log('settled at scrollY', await needPage().evaluate(() => window.scrollY));
  },

  async quit() {
    if (browser) await browser.close();
    browser = null;
    page = null;
  },

  help() {
    console.log('commands:', Object.keys(COMMANDS).join(', '));
  },
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'driver> ' });
console.log('precalc driver - "help" for commands, "open" to start');
rl.prompt();

// for-await runs commands one at a time, so piped scripts don't race.
for await (const line of rl) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd && !cmd.startsWith('#')) {
    const fn = COMMANDS[cmd];
    if (!fn) console.log('unknown:', cmd, '- try: help');
    else {
      try {
        await fn(line.trim().slice(cmd.length).trim());
      } catch (e) {
        console.log('ERROR:', e.message.split('\n')[0]);
      }
    }
    if (cmd === 'quit') break;
  }
  rl.prompt();
}
await COMMANDS.quit();
process.exit(0);
