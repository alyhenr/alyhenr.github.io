/**
 * Jarvis's web QA kit (the `web` stack pack; Jarvis-owned: re-applying the pack rewrites this file).
 * A web project's `.jarvis/qa.mjs` builds on it: its steps (install, lint, typecheck, tests, build)
 * and its browser flows, Playwright scripts the build agent writes once per flow and the QA runs
 * headless with zero tokens, in Chromium and WebKit (Safari's engine), at desktop (1440×900) and
 * phone (390×844) sizes, against the production build and once against the dev server.
 *
 * A flow fails on anything the page reports even when its own checks pass: an uncaught error, a
 * console error, a hydration message, the framework's error overlay (Next.js, Vite, webpack), a
 * reload loop, or an image, script, stylesheet, font or media file that didn't load.
 *
 * A flow is `e2e/flows/<name>.flow.mjs`:
 *
 *   export const flow = {
 *     name: 'the home shows the hero',
 *     // optional: sizes: ['desktop'], engines: ['chromium'], dev: false (skip the dev pass),
 *     // context: { reducedMotion: 'reduce' }, init: [fn, arg] (an init script), allow: [/benign console/]
 *     async run({ page, go, expect, shot, size, engine, pass }) {
 *       await go('/');                                   // a page load the guards know the flow made
 *       await page.getByRole('heading', { name: 'Olá' }).waitFor();
 *       await shot('hero');                              // a still at a key moment (also in the demo)
 *     },
 *   };
 *
 * The api: `page` and `context` (Playwright's), `go(path)` and `reload()` (loads the guards expect),
 * `expect(cond, message)`, `shot(name)`, `step(label)` (names the step a failure reports), `url(path)`,
 * `base`, `engine`, `size`, `pass`. A flow that opens an error page on purpose lists its console
 * line in `allow`.
 *
 * A Next.js project's `.jarvis/qa.mjs` (next.config.ts sets `distDir` from NEXT_DIST_DIR when it's set,
 * so the dev pass builds into its own folder and never locks the owner's `next dev`):
 *
 *   import { dirname, join } from 'node:path';
 *   import { fileURLToPath } from 'node:url';
 *   import { webQa } from './web/kit.mjs';
 *   const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
 *   const bin = (b) => join(ROOT, 'node_modules/.bin', b);
 *   // Local values for every variable the app reads, set before Next loads any .env* file.
 *   Object.assign(process.env, { NEXT_TELEMETRY_DISABLED: '1' });
 *   process.exit(await webQa({
 *     root: ROOT,
 *     steps: [
 *       { name: 'install', run: ['npm', 'ci'] },
 *       { name: 'lint', run: [bin('eslint'), '.'], onPaths: (paths) => [bin('eslint'), ...paths] },
 *       { name: 'typecheck', run: [bin('tsc'), '--noEmit'], onPaths: true },
 *       { name: 'build', run: [bin('next'), 'build'] },
 *     ],
 *     build: { command: [bin('next'), 'start', '-p', '{port}', '-H', '127.0.0.1'] },
 *     dev: { command: [bin('next'), 'dev', '-p', '{port}', '-H', '127.0.0.1'], env: { NEXT_DIST_DIR: '.qa/next-dev' },
 *            fresh: '.qa/next-dev', restore: ['tsconfig.json', 'next-env.d.ts'], fatal: /FATAL|panic/i },
 *   }));
 *
 * Its arguments are the QA contract's (webQa says how each is read): none runs everything; step
 * names, flow names (`home` or `e2e/flows/home.flow.mjs`), `flows` (every flow) or paths run a subset.
 *
 * `--record [--label "…"] [flows…]` replays flows in Chromium at both sizes with video into
 * .qa/showcase/ and writes .qa/showcase.json (the build's demo; .qa/qa-report.json is untouched).
 * Videos are .mp4 when ffmpeg is on PATH (Telegram and phones play it), else Playwright's .webm.
 *
 * Playwright comes from the project: `playwright-core` pinned to PLAYWRIGHT_VERSION (its browsers:
 * `npx playwright-core@<version> install chromium webkit`). Everything else is Node's own.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PLAYWRIGHT_VERSION = '1.53.2';
export const ENGINES = ['chromium', 'webkit'];
export const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const ASSETS = new Set(['image', 'stylesheet', 'script', 'font', 'media']);
const HYDRATION = /hydrat|did not match|server rendered (html|text)|server-rendered/i;
// A load the browser itself called off (the page moved on) isn't a broken asset.
const ABORTED = /ERR_ABORTED|cancell?ed|NS_BINDING_ABORTED|Load request cancelled/i;

/** A free TCP port on 127.0.0.1. */
export function freePort() {
  return new Promise((done, fail) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', fail);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => done(port));
    });
  });
}

const lastLines = (s, n = 15) => String(s).trim().split('\n').slice(-n).join('\n');
const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `--record`, `--label <text>`, `--prepare`; the rest are names (steps, flows, paths). */
export function parseArgs(argv) {
  const label = argv.includes('--label') ? argv[argv.indexOf('--label') + 1] ?? null : null;
  const rest = argv.filter((a, i) => a !== '--label' && argv[i - 1] !== '--label');
  return { record: rest.includes('--record'), prepare: rest.includes('--prepare'), label, names: rest.filter((a) => !a.startsWith('--')) };
}

/**
 * One QA run: flows recorded into .qa/qa-report.json (or, recording, .qa/showcase.json).
 * `root` is the project (default: the working directory).
 */
export function createQa({ root = process.cwd(), argv = process.argv.slice(2), platform = 'web' } = {}) {
  const args = parseArgs(argv);
  const QA = join(root, '.qa');
  const start = Date.now();
  const runId = new Date().toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
  const flows = [];
  const failures = [];
  const recordings = [];
  const qa = {
    root,
    args,
    record: args.record,
    scope: args.names.length ? 'subset' : 'all',
    runId,
    flows,
    failures,
    error: null,
    rel: (p) => relative(root, p).split(sep).join('/'),
    /** An infrastructure problem (a browser that won't start, Docker down): the run is an error, not a fail. */
    fail(message) {
      qa.error ??= message;
    },
    progress(current) {
      try {
        mkdirSync(QA, { recursive: true });
        const passed = flows.filter((f) => f.status === 'pass').length;
        writeFileSync(join(QA, 'progress.json'), JSON.stringify({ phase: args.record ? 'showcase' : 'qa', current, flows_passed: passed, flows_failed: flows.length - passed, updated_at: new Date().toISOString() }) + '\n');
      } catch {}
    },
    /** Records one flow; `fn` throws (or returns a message) to fail it. A thrown error may carry `.screenshot`. */
    async flow(test, step, fn, extra = {}) {
      qa.progress(test);
      const t0 = Date.now();
      let message = null;
      let screenshot = null;
      let out = {};
      try {
        const r = await fn();
        if (typeof r === 'string' && r) message = r;
        else if (r && typeof r === 'object') out = r;
      } catch (e) {
        message = e?.message ?? String(e);
        screenshot = e?.screenshot ?? null;
        out = e?.out ?? {};
      }
      const duration_s = +((Date.now() - t0) / 1000).toFixed(1);
      const status = message ? 'fail' : 'pass';
      flows.push({ test, ac: [], status, duration_s, screenshots: out.screenshots ?? [], recording: out.recording ?? null, ...extra });
      if (message) failures.push({ test, ac: [], step: out.step ?? step, message, screenshot });
      console.log(`${message ? '✗' : '✓'} ${test} (${duration_s}s)${message ? `\n  ${message.split('\n').join('\n  ')}` : ''}`);
      return !message;
    },
    /** Runs a command, streaming its output; resolves { code, tail }. */
    run(cmd, cmdArgs = [], opts = {}) {
      return new Promise((done) => {
        console.log(`\n$ ${cmd} ${cmdArgs.join(' ')}`);
        const child = spawn(cmd, cmdArgs, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], ...opts, env: { ...process.env, ...opts.env } });
        let out = '';
        const keep = (c) => {
          process.stdout.write(c);
          out = (out + c).slice(-8000);
        };
        child.stdout.on('data', keep);
        child.stderr.on('data', keep);
        child.on('error', (e) => done({ code: 127, tail: String(e) }));
        child.on('close', (code) => done({ code: code ?? 1, tail: out }));
      });
    },
    /** A command as a flow: it fails on a non-zero exit, with the output's last lines. */
    cmd(test, cmd, cmdArgs = [], opts = {}) {
      return qa.flow(test, test, async () => {
        const { code, tail } = await qa.run(cmd, cmdArgs, opts);
        if (code !== 0) return `\`${cmd} ${cmdArgs.join(' ')}\` exited ${code}:\n${lastLines(tail)}`;
      });
    },
    /** Empties a folder under .qa/ (a dev server's own build folder): never anything outside it. */
    freshDir(rel) {
      const dir = resolve(root, rel);
      if (!dir.startsWith(QA + sep)) throw new Error(`freshDir: ${rel} is not under .qa/`);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    serve: (opts) => serve(qa, opts),
    browse: (opts) => browse(qa, opts, recordings),
    /** Writes the report (or the showcase when recording) and exits 0 pass · 1 fail · 2 error. */
    finish() {
      const passed = flows.filter((f) => f.status === 'pass').length;
      const failed = flows.length - passed;
      const status = qa.error ? 'error' : failed ? 'fail' : flows.length ? 'pass' : 'error';
      if (!qa.error && !flows.length) qa.error = 'no flows ran';
      const duration_s = +((Date.now() - start) / 1000).toFixed(1);
      mkdirSync(QA, { recursive: true });
      if (args.record) {
        const showcase = { run_id: runId, label: args.label, duration_s, status, flows: recordings, error: qa.error };
        writeFileSync(join(QA, 'showcase.json'), JSON.stringify(showcase, null, 2) + '\n');
        console.log(`\nSHOWCASE ${status}: ${recordings.filter((r) => r.recording).length} recording(s) of ${recordings.length} → .qa/showcase.json${qa.error ? ` · ${qa.error}` : ''}`);
      } else {
        const report = { status, scope: qa.scope, platform, run_id: runId, duration_s, passed, failed, flows, failures, error: qa.error };
        writeFileSync(join(QA, 'qa-report.json'), JSON.stringify(report, null, 2) + '\n');
        console.log(`\nQA ${status}: ${passed} passed, ${failed} failed${qa.error ? ` · ${qa.error}` : ''} → .qa/qa-report.json`);
      }
      qa.progress(null);
      return status === 'pass' ? 0 : status === 'fail' ? 1 : 2;
    },
  };
  return qa;
}

/**
 * Starts a server for a pass and waits until it answers. `command` is [cmd, ...args] with `{port}`
 * filled in (PORT is set too). `fatal`: a pattern that, showing in its log while a flow runs,
 * fails that flow (a dev server's panic). `restore` lists files the server rewrites (next dev reformats
 * tsconfig.json): they're put back when it stops. `fresh` is a folder under .qa/ emptied first (a dev
 * server's own build folder, so the QA never shares or locks the owner's). Resolves { base, port, log(), stop() }, or null
 * when it never answered (that failure is recorded as a flow).
 */
async function serve(qa, { name, command, env = {}, port, ready = '/', timeout_s = 120, restore = [], fresh = null, fatal = null }) {
  port ??= await freePort();
  if (fresh) qa.freshDir(fresh);
  const base = `http://127.0.0.1:${port}`;
  const kept = new Map(restore.map((f) => [f, existsSync(join(qa.root, f)) ? readFileSync(join(qa.root, f), 'utf8') : null]));
  const [cmd, ...cmdArgs] = command.map((a) => String(a).replaceAll('{port}', String(port)));
  console.log(`\n$ ${cmd} ${cmdArgs.join(' ')}   (${name}, ${base})`);
  const child = spawn(cmd, cmdArgs, { cwd: qa.root, env: { ...process.env, PORT: String(port), ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let log = '';
  let total = 0; // characters ever logged, so a flow can read just what came during it
  let exited = null;
  const keep = (c) => {
    total += String(c).length;
    log = (log + c).slice(-8000);
  };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);
  child.on('error', (e) => (exited = String(e)));
  child.on('exit', (code) => (exited ??= `exited ${code}`));
  const stop = async () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {}
    for (let i = 0; i < 50 && exited === null; i++) await sleep(100);
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {}
    for (const [f, text] of kept) {
      const p = join(qa.root, f);
      const now = existsSync(p) ? readFileSync(p, 'utf8') : null;
      if (now === text) continue;
      if (text === null) rmSync(p, { force: true });
      else writeFileSync(p, text);
    }
  };
  const deadline = Date.now() + timeout_s * 1000;
  while (Date.now() < deadline && exited === null) {
    try {
      await fetch(base + ready, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
      const since = (mark) => log.slice(Math.max(0, log.length - (total - mark)));
      return { name, base, port, log: () => log, mark: () => total, since, fatal, stop };
    } catch {
      await sleep(300);
    }
  }
  await stop();
  await qa.flow(`${name}: the server starts`, `start ${name}`, () => `${cmd} ${cmdArgs.join(' ')} never answered on ${base}${exited ? ` (${exited})` : ''}:\n${lastLines(log)}`);
  return null;
}

/** playwright-core from the project's own node_modules (else `playwright`), or null. */
async function loadPlaywright(root) {
  const req = createRequire(join(root, 'package.json'));
  for (const name of ['playwright-core', 'playwright']) {
    try {
      const mod = await import(pathToFileURL(req.resolve(name)).href);
      return mod.chromium ? mod : mod.default; // CommonJS: its exports may sit on the default
    } catch {}
  }
  return null;
}

/** The flow files under `dir` (`*.flow.mjs`), each with its id: the path under `dir` without `.flow.mjs`. */
export function flowFiles(root, dir) {
  const base = resolve(root, dir);
  const out = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d).sort()) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith('.flow.mjs')) out.push({ file: p, id: relative(base, p).split(sep).join('/').replace(/\.flow\.mjs$/, '') });
    }
  };
  walk(base);
  return out;
}

/** Whether a name given on the command line picks this flow: its id, its file (project-relative or not), or its file name. */
export const picks = (root, f, name) =>
  name === f.id || resolve(root, name) === f.file || name === basename(f.file) || name === `${f.id}.flow.mjs`;

/**
 * The page guards: everything a page reports while a flow runs, and what it does after.
 * `expectLoad()` marks a load the flow itself asked for (go, reload).
 */
function guard(page, { allow, warnings }) {
  const problems = [];
  const loads = [];
  let asked = 0;
  const benign = (text) => allow.some((re) => re.test(text));
  page.on('pageerror', (e) => problems.push(`uncaught: ${String(e?.message ?? e).split('\n')[0]}`));
  page.on('console', (m) => {
    const text = m.text();
    const level = m.type();
    if (benign(text)) return;
    const line = text.split('\n')[0].slice(0, 300);
    if (HYDRATION.test(text)) problems.push(`hydration: ${line}`);
    else if (level === 'error') problems.push(`console.error: ${line}`);
    else if (warnings && level === 'warning') problems.push(`console.warn: ${line}`);
  });
  page.on('response', (r) => {
    const req = r.request();
    if (r.status() >= 400 && ASSETS.has(req.resourceType())) problems.push(`failed to load ${req.resourceType()} ${r.status()} ${shortUrl(r.url())}`);
  });
  page.on('requestfailed', (req) => {
    const why = req.failure()?.errorText ?? '';
    if (ASSETS.has(req.resourceType()) && !ABORTED.test(why)) problems.push(`failed to load ${req.resourceType()} ${shortUrl(req.url())}: ${why}`);
  });
  // Document loads of the main frame (a redirect's hops are one load; history updates aren't loads).
  page.on('request', (req) => {
    if (req.isNavigationRequest() && req.frame() === page.mainFrame() && !req.redirectedFrom()) loads.push({ url: req.url().split('#')[0], at: Date.now() });
  });
  return {
    problems,
    expectLoad: () => asked++,
    /** Loads of one URL the flow didn't ask for, three or more times: the page keeps reloading itself. */
    loopDuringFlow() {
      const counts = new Map();
      for (const l of loads) counts.set(l.url, (counts.get(l.url) ?? 0) + 1);
      const [url, n] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
      return n >= 3 && loads.length - asked >= 2 ? `the page loaded ${shortUrl(url)} ${n} times (a reload loop)` : null;
    },
    /** After the flow the page must stay put: a load in the quiet window is a reload loop (or a redirect nobody waited for). */
    async settle(ms) {
      const before = loads.length;
      await sleep(ms);
      const extra = loads.slice(before);
      return extra.length ? `the page loaded again by itself ${extra.length} time(s) within ${ms} ms after the flow (a reload loop): ${shortUrl(extra.at(-1).url)}` : null;
    },
  };
}

const shortUrl = (u) => {
  try {
    const x = new URL(u);
    return x.host.startsWith('127.0.0.1') || x.hostname === 'localhost' ? x.pathname + x.search : u.slice(0, 160);
  } catch {
    return String(u).slice(0, 160);
  }
};

/** What the page shows that a framework puts up for errors, and images that arrived broken. */
const pageState = () => {
  const out = [];
  const next = document.querySelector('nextjs-portal')?.shadowRoot;
  if (next) {
    const badge = next.querySelector('[data-next-badge]');
    const issues = next.querySelector('[data-issues]') || next.querySelector('[data-nextjs-dialog]') || next.querySelector('[data-nextjs-toast][data-error]');
    if (badge?.getAttribute('data-error') === 'true' || issues) out.push(`Next.js's error overlay reports ${next.querySelector('[data-issues-count]')?.textContent?.trim() || 'an'} issue(s)`);
  }
  const vite = document.querySelector('vite-error-overlay');
  if (vite) out.push(`Vite's error overlay is up: ${(vite.shadowRoot?.querySelector('.message')?.textContent ?? '').trim().slice(0, 200)}`);
  if (document.querySelector('#webpack-dev-server-client-overlay')) out.push("webpack's error overlay is up");
  for (const img of document.images) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) out.push(`broken image: ${img.currentSrc.replace(location.origin, '')}`);
  }
  return out;
};

/**
 * Runs browser flows against `base`. `pass` names the pass ('build' or 'dev'). Each flow runs in
 * every engine × size it allows (default: both engines, both sizes); `only` narrows engines and
 * sizes for the whole pass (the dev pass runs Chromium at desktop). `settle_ms` is the quiet time
 * after each flow; `warnings: true` also fails on console warnings. Recording (`qa.record`): Chromium,
 * both sizes, each with a video, into the showcase.
 */
async function browse(qa, { base, server = null, pass = 'build', flows: dir = 'e2e/flows', names = [], only = {}, settle_ms = pass === 'dev' ? 4000 : 1500, warnings = false, allow = [] }, recordings) {
  let files = flowFiles(qa.root, dir);
  if (names.length) {
    const unknown = names.filter((n) => !files.some((f) => picks(qa.root, f, n)));
    if (unknown.length) return qa.flow(`${pass}: flows`, 'pick flows', () => `no flow ${unknown.join(', ')} under ${dir}`);
    // In the order given: a demo's first recording is the one Core sends.
    files = names.map((n) => files.find((f) => picks(qa.root, f, n))).filter((f, i, all) => all.indexOf(f) === i);
  }
  if (!files.length) return qa.flow(`${pass}: flows`, 'find flows', () => `no flows (*.flow.mjs) under ${dir}`);
  // A browse that runs no flow says why, as a failure, never by returning quietly: a caller reading the flows (or a
  // report with only an error) would otherwise see nothing to explain a QA that checked nothing.
  let ran = 0;
  const noneRan = (why) => qa.flow(`${pass}: flows`, 'run flows', () => `no flow ran: ${why}`);
  const pw = await loadPlaywright(qa.root);
  if (!pw) {
    const why = `playwright-core is missing from node_modules: add it pinned (playwright-core@${PLAYWRIGHT_VERSION}) as a dev dependency`;
    qa.fail(why);
    await noneRan(why);
    return false;
  }
  const loaded = [];
  let ok = true;
  for (const f of files) {
    try {
      const mod = await import(pathToFileURL(f.file).href);
      const flow = mod.flow ?? mod.default;
      if (!flow || typeof flow.run !== 'function') throw new Error('it exports no `flow` with a run()');
      loaded.push({ ...f, flow });
    } catch (e) {
      await qa.flow(`${pass}: ${f.id}`, 'load the flow', () => `${qa.rel(f.file)} doesn't load: ${e.message}`);
      ok = false;
    }
  }
  const engines = qa.record ? ['chromium'] : only.engines ?? ENGINES;
  const sizes = only.sizes ?? Object.keys(SIZES);
  const shots = join(qa.root, '.qa', qa.record ? 'showcase' : 'screens');
  if (qa.record) rmSync(shots, { recursive: true, force: true });
  mkdirSync(shots, { recursive: true });
  for (const engine of engines) {
    const runs = loaded.flatMap((l) =>
      (pass === 'dev' && l.flow.dev === false) || !(l.flow.engines ?? ENGINES).includes(engine) ? [] : sizes.filter((s) => (l.flow.sizes ?? Object.keys(SIZES)).includes(s)).map((size) => ({ ...l, size })),
    );
    if (!runs.length) continue;
    let browser;
    try {
      browser = await pw[engine].launch();
    } catch (e) {
      const why = `${engine} did not start (npx playwright-core@${PLAYWRIGHT_VERSION} install ${engine}): ${String(e.message).split('\n')[0]}`;
      qa.fail(why);
      if (!ran) await noneRan(why);
      return false;
    }
    try {
      for (const r of runs) {
        const test = `${pass}: ${r.flow.name ?? r.id} (${engine}, ${r.size})`;
        const where = { flow: r.id, engine, size: r.size, pass };
        const passed = await qa.flow(test, r.id, () => runFlow(qa, browser, r, { base, server, engine, pass, shots, settle_ms, warnings, allow }), where);
        ran++;
        ok &&= passed;
        if (qa.record) {
          const last = qa.flows.at(-1);
          recordings.push({ test: r.id, ac: [], status: last.status, recording: last.recording, size: r.size, engine, stills: last.screenshots });
        }
      }
    } finally {
      await browser.close().catch(() => {});
    }
  }
  if (!ran && loaded.length) {
    const which = loaded.map((l) => l.flow.name ?? l.id).join(', ');
    const why = `${which}: none runs in ${engines.join(' or ')} at ${sizes.join(' or ')} (each flow's engines and sizes${pass === 'dev' ? ', or `dev: false`' : ''})`;
    // The dev pass (Chromium at desktop) is a second look: flows may sit it out by their own say. Any other pass with
    // nothing run checked nothing.
    if (pass === 'dev') {
      console.log(`- ${pass}: no flow runs on the dev server: ${why}`);
      return ok;
    }
    await noneRan(why);
    return false;
  }
  return ok;
}

/** One flow at one engine and size, in a fresh context. Returns { screenshots, recording }; throws with them on a failure. */
async function runFlow(qa, browser, { id, flow, size }, { base, server, engine, pass, shots, settle_ms, warnings, allow }) {
  const videoDir = qa.record ? mkdtempSync(join(tmpdir(), 'web-qa-video-')) : null;
  const viewport = SIZES[size].viewport;
  const ctx = await browser.newContext({ ...SIZES[size], ...flow.context, ...(videoDir ? { recordVideo: { dir: videoDir, size: viewport } } : {}) });
  if (flow.init) await ctx.addInitScript(...(Array.isArray(flow.init) ? flow.init : [flow.init]));
  const page = await ctx.newPage();
  // A dev server compiles a page on its first request: its waits are longer.
  page.setDefaultTimeout(flow.timeout_ms ?? (pass === 'dev' ? 60_000 : 15_000));
  page.setDefaultNavigationTimeout(pass === 'dev' ? 120_000 : 30_000);
  const logMark = server?.mark();
  const watch = guard(page, { allow: [...allow, ...(flow.allow ?? [])], warnings });
  const out = { screenshots: [], recording: null, step: 'start' };
  const tag = qa.record ? `${slug(id)}-${size}` : `${slug(id)}-${engine}-${size}${pass === 'dev' ? '-dev' : ''}`;
  const url = (p = '/') => new URL(p, base).href;
  const api = {
    page,
    context: ctx,
    base,
    engine,
    size,
    pass,
    url,
    step: (label) => (out.step = label),
    async go(path = '/', opts = {}) {
      out.step = `open ${path}`;
      watch.expectLoad();
      return page.goto(url(path), { waitUntil: 'load', ...opts });
    },
    async reload(opts = {}) {
      watch.expectLoad();
      return page.reload({ waitUntil: 'load', ...opts });
    },
    expect(cond, message) {
      if (!cond) throw new Error(message);
    },
    async shot(name) {
      const file = join(shots, `${tag}-${slug(name)}.png`);
      await page.screenshot({ path: file });
      out.screenshots.push(qa.rel(file));
      return file;
    },
  };
  let error = null;
  try {
    await flow.run(api);
    out.step = 'after the flow';
    const loop = watch.loopDuringFlow() ?? (await watch.settle(settle_ms));
    const shown = loop ? [] : await page.evaluate(pageState).catch(() => []);
    const logged = server?.fatal ? server.since(logMark).split('\n').filter((l) => server.fatal.test(l)) : [];
    const problems = [...new Set([...watch.problems, ...shown, ...(loop ? [loop] : []), ...logged.slice(0, 3).map((l) => `the ${server.name} server failed: ${l.trim().slice(0, 300)}`)])];
    if (problems.length) throw new Error(`the page reported problems:\n${problems.join('\n')}`);
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
    const seen = [...new Set(watch.problems)].filter((p) => !error.message.includes(p));
    if (seen.length) error.message += `\nthe page also reported:\n${seen.join('\n')}`;
    try {
      const file = join(shots, `fail-${tag}.png`);
      await page.screenshot({ path: file });
      error.screenshot = qa.rel(file);
    } catch {}
  } finally {
    const video = page.video();
    await ctx.close().catch(() => {});
    if (video && videoDir) out.recording = await keepVideo(qa, await video.path().catch(() => null), join(shots, `${tag}.webm`));
    if (videoDir) rmSync(videoDir, { recursive: true, force: true });
  }
  if (error) {
    error.out = out;
    throw error;
  }
  return out;
}

/** Moves a recorded .webm into the showcase, as .mp4 when ffmpeg is on PATH; the project-relative path or null. */
async function keepVideo(qa, from, to) {
  if (!from || !existsSync(from)) return null;
  renameSync(from, to);
  const mp4 = to.replace(/\.webm$/, '.mp4');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', to, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-movflags', '+faststart', mp4], { stdio: 'ignore' });
  if (r.status === 0 && existsSync(mp4) && statSync(mp4).size > 0) {
    rmSync(to, { force: true });
    return qa.rel(mp4);
  }
  return qa.rel(to);
}

/**
 * The usual web QA in one call: the project's steps in order, then the browser flows on the
 * production build (`build`: how to serve it) and once on the dev server (`dev`, optional, served
 * from its own folder under .qa/, never the owner's). Arguments, as Core passes them:
 *   (none)                              every step, then both passes (scope all)
 *   <step…> | <flow…> | flows | <path…>  just those steps; those flows (or all: `flows`), after
 *                                        the steps the passes `need`; paths go to `onPaths` steps
 *   --record [--label "…"] [<flow…>]     the demo: those flows (or all) recorded, after `need`
 *   --prepare                           nothing to prepare on the web: exits 0
 * steps: [{ name, run: [cmd, ...args] | async (qa) => message?, onPaths?: (paths) => [cmd, ...args] | true }]
 * (`true`: the step runs as it is whenever paths are given, like a typecheck).
 * `need`: the steps the passes can't run without (default ['build']). `checks(qa, base)`: plain
 * HTTP checks against the build server before its browser flows. `browse`: options for both passes
 * (warnings, allow, settle_ms), `devBrowse` for the dev pass (default: Chromium at desktop).
 */
export async function webQa({ root, argv, steps = [], need = ['build'], build, dev = null, flows = 'e2e/flows', checks = null, browse: browseOpts = {}, devBrowse = {} }) {
  const qa = createQa({ root, argv });
  if (qa.args.prepare) return 0;
  const runStep = async (s) => {
    if (Array.isArray(s.run)) return qa.cmd(s.name, s.run[0], s.run.slice(1), { env: s.env });
    return qa.flow(s.name, s.name, () => s.run(qa));
  };
  const byName = new Map(steps.map((s) => [s.name, s]));
  const files = flowFiles(qa.root, flows);
  const isFlow = (n) => files.some((f) => picks(qa.root, f, n));
  const names = qa.args.names;
  const wantSteps = names.filter((n) => byName.has(n));
  const wantFlows = names.filter((n) => !byName.has(n) && isFlow(n));
  const allFlows = qa.record ? !wantFlows.length : names.includes('flows') || names.includes('smoke');
  const paths = names.filter((n) => !byName.has(n) && !isFlow(n) && n !== 'flows' && n !== 'smoke');

  const passes = async (picked) => {
    for (const n of need) {
      if (qa.error) return;
      const s = byName.get(n);
      if (!s) continue;
      const done = qa.flows.find((f) => f.test === n);
      if (done ? done.status !== 'pass' : !(await runStep(s))) {
        if (!qa.error) await qa.flow('flows', 'start', () => `skipped: the ${n} step failed`);
        return;
      }
    }
    const server = await qa.serve({ name: 'build', ...build });
    if (!server) return;
    try {
      if (checks && !qa.record) await checks(qa, server.base);
      if (!qa.error) await qa.browse({ base: server.base, server, pass: 'build', flows, names: picked, ...browseOpts });
    } finally {
      await server.stop();
    }
    if (!dev || qa.record || qa.error) return;
    const devServer = await qa.serve({ name: 'dev', ...dev });
    if (!devServer) return;
    try {
      await qa.browse({ base: devServer.base, server: devServer, pass: 'dev', flows, names: picked, only: { engines: ['chromium'], sizes: ['desktop'] }, ...browseOpts, ...devBrowse });
    } finally {
      await devServer.stop();
    }
  };

  try {
    if (qa.record) await passes(wantFlows);
    else if (qa.scope === 'all') {
      for (const s of steps) {
        if (qa.error) break;
        await runStep(s);
      }
      if (!qa.error) await passes([]);
    } else {
      const unknown = paths.filter((p) => !existsSync(resolve(qa.root, p)));
      if (unknown.length) await qa.flow('arguments', 'arguments', () => `not a step, a flow or a path: ${unknown.join(', ')} (steps: ${[...byName.keys(), 'flows'].join(', ')})`);
      const known = paths.filter((p) => existsSync(resolve(qa.root, p)));
      for (const s of steps.filter((s) => s.onPaths && known.length)) {
        if (s.onPaths === true) {
          if (!wantSteps.includes(s.name)) await runStep(s);
          continue;
        }
        const [cmd, ...cmdArgs] = s.onPaths(known);
        await qa.cmd(`${s.name} ${known.join(' ')}`, cmd, cmdArgs, { env: s.env });
      }
      for (const s of steps.filter((s) => wantSteps.includes(s.name))) {
        if (qa.error) break;
        await runStep(s);
      }
      if (!qa.error && (allFlows || wantFlows.length)) await passes(allFlows ? [] : wantFlows);
    }
  } catch (e) {
    qa.fail(`qa crashed: ${e?.stack ?? e}`);
  }
  return qa.finish();
}
