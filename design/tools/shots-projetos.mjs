// Section shots of each direction's projetos.html (shots.mjs only shoots the homes), numbered after
// the home's shots, same sizes. Run after shots.mjs --sections design/directions, which deletes them:
//   node design/tools/shots-projetos.mjs 01-traco 02-roteiro 03-esquema
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readdirSync, unlinkSync } from 'node:fs';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { chromium } = createRequire(join(REPO, 'package.json'))('playwright-core');
const sizes = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 } } };
const browser = await chromium.launch();
for (const dir of process.argv.slice(2)) {
  const shots = join(REPO, 'design/directions', dir, 'shots');
  for (const f of readdirSync(shots)) if (/-p-/.test(f)) unlinkSync(join(shots, f));
  for (const [size, opts] of Object.entries(sizes)) {
    const n0 = readdirSync(shots).filter((f) => f.startsWith(size + '-')).length;
    const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(REPO, 'design/directions', dir, 'projetos.html')).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const els = await page.$$('[data-shot]');
    let i = n0;
    for (const el of els) {
      i++;
      const name = await el.getAttribute('data-shot');
      const file = `${size}-${String(i).padStart(2, '0')}-p-${name}.jpg`;
      await el.screenshot({ path: join(shots, file), type: 'jpeg', quality: 80 });
      console.log('✓', dir, file);
    }
    await ctx.close();
  }
}
await browser.close();
