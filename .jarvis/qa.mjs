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
 *   published    stages the site into .qa/site with the deploy's own script (.github/stage-site.mjs),
 *                checks deploy.yml uploads that folder, and that it holds every page, asset and
 *                frozen URL the site links to and none of our files (docs, roadmap, QA, tooling).
 *                The HTTP checks and the flows then run against that folder: what goes live.
 * There is no lint, typecheck, build or unit test in this codebase: those steps don't exist here.
 * Nothing runs against a live service: the contact form's Formspree endpoint is blocked in the flows.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webQa } from './web/kit.mjs';
import { stage } from '../.github/stage-site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', '.github', '.jarvis', '.qa', 'node_modules', 'e2e', 'docs']);
/** Where the `published` step stages the site, and what the flows are served from. */
const SITE = join(ROOT, '.qa/site');

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
const rel = (p, root = ROOT) => relative(root, p).split(sep).join('/');
const pages = (root = ROOT) => walk(root).filter((p) => p.endsWith('.html'));
const scripts = () => walk(join(ROOT, 'js')).filter((p) => p.endsWith('.js'));

/** True when a local URL (relative to `fromDir`, or root-absolute) maps to a file served from `root`. */
function resolves(url, fromDir, root = ROOT) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return true;
  let abs = clean.startsWith('/') ? join(root, decodeURIComponent(clean)) : resolve(fromDir, decodeURIComponent(clean));
  if (abs !== root && !abs.startsWith(root + sep)) return false;
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

/** Every local link in the pages under `root` and in its JS registries; the broken ones. */
function brokenLinks(root = ROOT) {
  const broken = [];
  for (const page of pages(root)) {
    for (const u of attrs(readFileSync(page, 'utf8'))) {
      if (isLocal(u) && !resolves(u, dirname(page), root)) broken.push(`${rel(page, root)} → ${u}`);
    }
  }
  // The JS registries hold page paths too: the nav and the terminal's filesystem (relative to the
  // site root, since chrome.js and terminal.js prefix basePath) and the extension registry
  // (relative to plugins/, where its index renders it).
  const registries = [
    ['js/chrome.js', /\bhref:\s*'([^']+)'/g, root],
    ['js/filesystem.js', /\bhref:\s*'([^']+)'/g, root],
    ['js/plugins.js', /\b(?:href|privacy):\s*'([^']+)'/g, join(root, 'plugins')],
  ];
  for (const [file, re, base] of registries) {
    if (!existsSync(join(root, file))) {
      broken.push(`${file} is missing`);
      continue;
    }
    const src = readFileSync(join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of src.matchAll(re)) if (isLocal(m[1]) && !resolves(m[1], base, root)) broken.push(`${file} → ${m[1]}`);
  }
  return broken;
}

function links() {
  const broken = brokenLinks();
  return broken.length ? `${broken.length} local link(s) point at nothing:\n${broken.join('\n')}` : undefined;
}

/** Ours, never the site's: none of it may reach the published folder. */
const NOT_PUBLISHED = new Set([
  'PRODUCT.md', 'ROADMAP.md', 'AGENTS.md', 'ARCHITECTURE.md', 'DESIGN.md', 'README.md', 'CLAUDE.md',
  'docs', 'e2e', 'design', '.jarvis', '.qa', '.github', '.git', 'node_modules',
  'package.json', 'package-lock.json', 'jarvis.json',
]);

/** Every file under `dir`, dotfiles included (the staged folder must have none). */
function walkAll(dir, out = []) {
  for (const e of readdirSync(dir).sort()) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkAll(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * The folder the deploy uploads: staged by the deploy's own script, then checked for what the
 * site needs (pages, assets, frozen URLs) and for what must stay in the repo.
 */
function published() {
  const out = [];
  const workflow = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
  const staged = workflow.match(/run:\s*node \.github\/stage-site\.mjs\s+(\S+)/)?.[1];
  const uploaded = workflow.match(/upload-pages-artifact@[^\n]*\n\s*with:\s*\n\s*path:\s*['"]?([^'"\s]+)/)?.[1];
  if (!staged) out.push('deploy.yml no longer stages the site with node .github/stage-site.mjs <dir>');
  if (!uploaded) out.push('deploy.yml no longer uploads a path with upload-pages-artifact');
  if (staged && uploaded && staged.replace(/\/$/, '') !== uploaded.replace(/\/$/, '')) {
    out.push(`deploy.yml stages into ${staged} but uploads ${uploaded}: the live site would not be the staged folder`);
  }
  if (uploaded && ['.', './'].includes(uploaded)) out.push('deploy.yml uploads the repo root: our docs, roadmap and QA would go public');

  stage(SITE, ROOT);
  const files = walkAll(SITE).map((f) => rel(f, SITE));
  const ours = files.filter((f) => {
    const parts = f.split('/');
    return parts.some((p) => NOT_PUBLISHED.has(p) || p.startsWith('.')) || /\.(md|mjs)$/.test(f);
  });
  if (ours.length) out.push(`the staged site holds files of ours that would go public:\n${ours.join('\n')}`);
  for (const f of FROZEN) if (!files.includes(f)) out.push(`${f} is not in the staged site: it was submitted to the browser stores`);
  if (!files.includes('index.html')) out.push('the staged site has no index.html');
  if (!files.includes('404.html')) out.push('the staged site has no 404.html');
  const broken = brokenLinks(SITE);
  if (broken.length) out.push(`${broken.length} link(s) in the staged site point at files it doesn't hold:\n${broken.join('\n')}`);
  return out.length ? out.join('\n') : undefined;
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
  await qa.flow('http: our docs, QA and tooling are not served', 'http', async () => {
    const bad = [];
    for (const p of ['/PRODUCT.md', '/ROADMAP.md', '/AGENTS.md', '/README.md', '/docs/MAP.md', '/e2e/flows/home.flow.mjs', '/package.json', '/jarvis.json']) {
      const r = await fetch(base + p, { redirect: 'manual' });
      if (r.status !== 404) bad.push(`${p} → ${r.status}`);
    }
    return bad.length ? `served, but they must stay in the repo:\n${bad.join('\n')}` : undefined;
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
  { name: 'published', run: async () => published(), onPaths: true },
];

process.exit(
  await webQa({
    root: ROOT,
    steps,
    need: ['install', 'published'],
    build: { command: ['node', join(ROOT, '.jarvis/serve.mjs'), '{port}', SITE] },
    checks,
  }),
);
