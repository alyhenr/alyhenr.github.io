// Section shots of the final mockups (design/final/), phone and desktop, as PNGs in design/final/shots/.
// Serves the folder over HTTP (site.js is a module that imports prices/quote.mjs), shoots every
// [data-shot] in page order, and puts the calculator and the form in their most telling state.
//   node design/tools/shots-final.mjs [page.html …]
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname, extname } from 'node:path';
import { readFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FINAL = join(REPO, 'design/final');
const OUT = join(FINAL, 'shots');
const { chromium } = createRequire(join(REPO, 'package.json'))('playwright-core');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'index-dark.html', 'projetos.html', 'projetos-dark.html', 'alvaras.html', 'privacidade.html'];
const sizes = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' };

const server = createServer((req, res) => {
  const path = join(FINAL, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(FINAL) || !existsSync(path)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

mkdirSync(OUT, { recursive: true });
const all = !process.argv.slice(2).length;
for (const f of readdirSync(OUT)) if (all || PAGES.some((p) => f.includes('-' + p.replace('.html', '') + '-'))) unlinkSync(join(OUT, f));

const browser = await chromium.launch();
const written = [];
for (const [size, opts] of Object.entries(sizes)) {
  let n = 0;
  for (const file of PAGES) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(base + file, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const slug = file.replace('.html', '');
    const shots = await page.$$eval('[data-shot]', (els) => els.map((e) => ({ name: e.dataset.shot, beat: !!e.closest('[data-spine]') })));
    let first = true;
    for (const { name, beat } of shots) {
      if (beat && file.includes('dark')) { first = false; continue; } // the stage is the same in both modes
      const el = page.locator(`[data-shot="${name}"]`);
      const shot = join(OUT, `${size}-${String(++n).padStart(2, '0')}-${slug}-${name}.jpg`);
      if (name === 'calculadora' && file.startsWith('index') && !file.includes('dark')) {
        await page.locator('input[value="agendamento-online"]').check();
        await page.locator('[data-step="1"]').click();
      }
      if (name === 'contato' && file === 'index.html') {
        await page.locator('[data-use-estimate]').click();
        await page.waitForTimeout(700);
        await page.fill('#c-nome', 'Marina Duarte');
        await page.fill('#c-contato', 'marina@clinicaduarte.com.br');
        await page.fill('#c-msg', 'Tenho uma clínica de estética em Belo Horizonte e quero que as clientes marquem horário pelo site.');
        await page.locator('#c-nome').blur();
      }
      if (name === 'contato' && file === 'index-dark.html') {
        await page.locator('.contact-form button[type="submit"]').click();
        await page.locator('#c-nome').blur();
      }
      if (beat || first) {
        // what the visitor sees: the viewport with the header, the beat's text over its plate
        await page.evaluate((s) => {
          const e = document.querySelector(`[data-shot="${s}"]`);
          const head = document.querySelector('.site-head').offsetHeight;
          window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - (e.closest('[data-spine]') ? head : 0) - (e.dataset.beat === undefined ? 0 : 0));
        }, name);
        if (first && !beat) await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(900);
        const tall = await el.evaluate((e) => e.offsetHeight > window.innerHeight);
        if (tall && !beat) await el.screenshot({ path: shot, type: "jpeg", quality: 80 });
        else await page.screenshot({ path: shot, type: "jpeg", quality: 80 });
      } else {
        await page.addStyleTag({ content: '.site-head{position:static!important}' });
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(/jarvis|lab/.test(name) ? 3200 : 500);
        await el.screenshot({ path: shot, type: "jpeg", quality: 80 });
      }
      first = false;
      written.push(shot.replace(REPO + '/', ''));
      console.log('✓', shot.replace(REPO + '/', ''));
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
