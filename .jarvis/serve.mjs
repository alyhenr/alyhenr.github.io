#!/usr/bin/env node
/**
 * A local stand-in for GitHub Pages. Zero dependencies.
 *
 *   node .jarvis/serve.mjs [port] [root]     (PORT env also works; default 8000)
 *
 * `root` defaults to the repo root (handy while editing); the QA passes the staged folder
 * (.qa/site, made by .github/stage-site.mjs), so its flows see exactly what the deploy publishes.
 *
 * What it mimics from Pages:
 *   /dir/          → /dir/index.html
 *   /dir           → 301 to /dir/ (when dir/index.html exists)
 *   /contact       → /contact.html (when it exists)
 *   anything else  → /404.html with status 404 (Pages' custom not-found page)
 * Dotfiles and dot-folders (.git, .jarvis, .qa) and node_modules are never served.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[3] ? resolve(process.argv[3]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const hidden = (rel) => rel.split('/').some((s) => s.startsWith('.') || s === 'node_modules');

/** The file a request path maps to: { file, status } or { redirect }. */
export function resolvePath(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    rel = '/';
  }
  const abs = normalize(join(ROOT, rel));
  const notFound = { file: join(ROOT, '404.html'), status: 404 };
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return notFound;
  if (hidden(rel.replace(/^\/+/, ''))) return notFound;
  if (rel.endsWith('/')) return isFile(join(abs, 'index.html')) ? { file: join(abs, 'index.html'), status: 200 } : notFound;
  if (isFile(abs)) return { file: abs, status: 200 };
  if (isFile(join(abs, 'index.html'))) return { redirect: rel + '/' };
  if (isFile(abs + '.html')) return { file: abs + '.html', status: 200 };
  return notFound;
}

const server = createServer((req, res) => {
  const hit = resolvePath(req.url || '/');
  if (hit.redirect) {
    res.writeHead(301, { Location: hit.redirect });
    return res.end();
  }
  const body = readFileSync(hit.file);
  res.writeHead(hit.status, { 'Content-Type': TYPES[extname(hit.file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : body);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
}
