#!/usr/bin/env node
/**
 * Stages the site's own files into one folder, the one the deploy uploads to GitHub Pages.
 * Everything else in the repo (our docs, roadmap, QA, .jarvis/, package.json) stays out.
 *
 *   node .github/stage-site.mjs <out-dir>
 *
 * The site is every .html page at the repo root plus the folders in SITE_DIRS and the vendored
 * files in SITE_FILES (what the pages load from vendor/), copied at the same paths (the
 * store-submitted /plugins/alvaras/ URLs depend on it). Dotfiles never go.
 * A new top-level folder the pages use (an img/, a new section) goes in SITE_DIRS; the QA's
 * `published` step fails on any link the staged folder can't serve.
 * Zero dependencies: the deploy runs it with the runner's own Node.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_DIRS = ['css', 'js', 'fonts', 'img', 'plugins'];
/** Files the pages load from vendor/ (the rest of a vendored package, its README and CHANGELOG, stays). */
export const SITE_FILES = ['vendor/web/prices/prices.json', 'vendor/web/prices/quote.mjs'];

/** The paths (relative to the repo root) the site is made of. */
export function sitePaths(root = REPO) {
  const pages = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html') && !e.name.startsWith('.'))
    .map((e) => e.name);
  return [...pages.sort(), ...SITE_DIRS, ...SITE_FILES];
}

/** Copies the site into `out` (emptied first). Returns the staged paths. */
export function stage(out, root = REPO) {
  const target = resolve(out);
  if (target === resolve(root)) throw new Error('stage-site: the output folder cannot be the repo root');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const paths = sitePaths(root);
  for (const p of paths) {
    if (!existsSync(join(root, p))) throw new Error(`stage-site: ${p} is missing from the repo`);
    mkdirSync(dirname(join(target, p)), { recursive: true });
    cpSync(join(root, p), join(target, p), { recursive: true, filter: (src) => !basename(src).startsWith('.') });
  }
  return paths;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) {
    console.error('usage: node .github/stage-site.mjs <out-dir>');
    process.exit(2);
  }
  console.log(`staged into ${out}: ${stage(out).join(' ')}`);
}
