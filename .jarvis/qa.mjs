#!/usr/bin/env node
/**
 * The portfolio's QA: a static site (hand-written HTML, CSS, vanilla JS; no build step), so its
 * real checks are these, then the browser flows (e2e/flows/) on a local stand-in for GitHub Pages
 * (.jarvis/serve.mjs), in Chromium and WebKit at desktop and phone sizes.
 *
 *   node .jarvis/qa.mjs                  everything (scope all)
 *   node .jarvis/qa.mjs syntax links     just those steps
 *   node .jarvis/qa.mjs flows | <flow>   the browser flows (all, or by name)
 *
 * Steps:
 *   install      npm ci (playwright-core only: QA tooling; the site itself has no dependencies)
 *   syntax       node --check on every script in js/
 *   links        every local href/src in every page, and every page path in the JS registries
 *                (js/chrome.js nav, js/filesystem.js, js/plugins.js), points at a file that exists
 *   frozen-urls  the URLs submitted to the browser stores still exist, the policy reads without JS,
 *                and 404.html only uses root-absolute paths
 * There is no lint, typecheck, build or unit test in this codebase: those steps don't exist here.
 * Nothing runs against a live service: the contact form's Formspree endpoint is blocked in the flows.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webQa } from './web/kit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', '.github', '.jarvis', '.qa', 'node_modules', 'e2e', 'docs']);

/** The store-submitted URLs: moving or deleting these fails every future store review. */
const FROZEN = ['plugins/index.html', 'plugins/alvaras/index.html', 'plugins/alvaras/privacidade/index.html'];

function walk(dir, out = []) {
  for (const e of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p).split(sep).join('/');
const pages = () => walk(ROOT).filter((p) => p.endsWith('.html'));
const scripts = () => walk(join(ROOT, 'js')).filter((p) => p.endsWith('.js'));

/** True when a local URL (relative to `fromDir`, or root-absolute) maps to a served file. */
function resolves(url, fromDir) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return true;
  let abs = clean.startsWith('/') ? join(ROOT, decodeURIComponent(clean)) : resolve(fromDir, decodeURIComponent(clean));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return false;
  if (existsSync(abs) && statSync(abs).isDirectory()) abs = join(abs, 'index.html');
  return existsSync(abs) && statSync(abs).isFile();
}
const isLocal = (u) => u && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
/** The page's markup without comments and inline scripts (their strings aren't links). */
const markup = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (s) => s.match(/^<script\b[^>]*>/i)[0]);
const attrs = (html) => [...markup(html).matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);

function syntax() {
  const bad = [];
  for (const f of scripts()) {
    const r = spawnSync(process.execPath, ['--check', f], { cwd: ROOT, encoding: 'utf8' });
    if (r.status !== 0) bad.push(`${rel(f)}: ${String(r.stderr).trim().split('\n').slice(0, 4).join(' | ')}`);
  }
  return bad.length ? `syntax errors:\n${bad.join('\n')}` : undefined;
}

function links() {
  const broken = [];
  for (const page of pages()) {
    for (const u of attrs(readFileSync(page, 'utf8'))) {
      if (isLocal(u) && !resolves(u, dirname(page))) broken.push(`${rel(page)} → ${u}`);
    }
  }
  // The JS registries hold page paths too: the nav and the terminal's filesystem (relative to the
  // site root, since chrome.js and terminal.js prefix basePath) and the extension registry
  // (relative to plugins/, where its index renders it).
  const registries = [
    ['js/chrome.js', /\bhref:\s*'([^']+)'/g, ROOT],
    ['js/filesystem.js', /\bhref:\s*'([^']+)'/g, ROOT],
    ['js/plugins.js', /\b(?:href|privacy):\s*'([^']+)'/g, join(ROOT, 'plugins')],
  ];
  for (const [file, re, base] of registries) {
    const src = readFileSync(join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of src.matchAll(re)) if (isLocal(m[1]) && !resolves(m[1], base)) broken.push(`${file} → ${m[1]}`);
  }
  return broken.length ? `${broken.length} local link(s) point at nothing:\n${broken.join('\n')}` : undefined;
}

function frozenUrls() {
  const out = [];
  for (const f of FROZEN) if (!existsSync(join(ROOT, f))) out.push(`${f} is gone: it was submitted to the browser stores`);
  const nav = readFileSync(join(ROOT, 'js/chrome.js'), 'utf8');
  if (!nav.includes("href: 'plugins/index.html'")) out.push("js/chrome.js's nav no longer links plugins/index.html (a frozen URL)");
  const policy = join(ROOT, 'plugins/alvaras/privacidade/index.html');
  if (existsSync(policy)) {
    const html = readFileSync(policy, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    if (!/<h1[^>]*>\s*Política de Privacidade/.test(html)) out.push('the Alvarás policy has no "Política de Privacidade" heading in its static HTML');
    if (!/Última atualização/.test(html)) out.push('the Alvarás policy lost its "Última atualização" date');
  }
  const notFound = readFileSync(join(ROOT, '404.html'), 'utf8');
  for (const u of attrs(notFound)) if (isLocal(u) && !u.startsWith('/')) out.push(`404.html uses a relative path (${u}): Pages serves it at any depth, so only root-absolute paths work`);
  return out.length ? out.join('\n') : undefined;
}

/** Plain HTTP checks against the local Pages stand-in, before the browser flows. */
async function checks(qa, base) {
  await qa.flow('http: the store URLs answer 200 as directories', 'http', async () => {
    const bad = [];
    for (const p of ['/plugins/', '/plugins/alvaras/', '/plugins/alvaras/privacidade/']) {
      const r = await fetch(base + p, { redirect: 'manual' });
      if (r.status !== 200) bad.push(`${p} → ${r.status}`);
    }
    return bad.length ? bad.join('\n') : undefined;
  });
  await qa.flow('http: a missing page gets the custom 404', 'http', async () => {
    const r = await fetch(base + '/no/such/page');
    const body = await r.text();
    if (r.status !== 404) return `/no/such/page → ${r.status}, expected 404`;
    if (!body.includes('Page not found')) return '/no/such/page did not serve 404.html';
  });
}

const steps = [
  { name: 'install', run: ['npm', 'ci', '--no-audit', '--no-fund'] },
  { name: 'syntax', run: async () => syntax(), onPaths: true },
  { name: 'links', run: async () => links(), onPaths: true },
  { name: 'frozen-urls', run: async () => frozenUrls(), onPaths: true },
];

process.exit(
  await webQa({
    root: ROOT,
    steps,
    need: ['install'],
    build: { command: ['node', join(ROOT, '.jarvis/serve.mjs'), '{port}'] },
    checks,
  }),
);
