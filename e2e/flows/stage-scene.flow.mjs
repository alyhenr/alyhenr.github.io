import { scrollToBeat } from './_lib.mjs';

// The scene interface Studio's traco-wireframe drops into (design/scenes/traco-wireframe.md):
// mount(host, { progress, reducedMotion, palette }) → { set, destroy }, events ready and beat.
// A stand-in module plays the scene here; browsers in CI may lack WebGL, so the capability check
// is replaced for the test.
const SCENE = `
export function mount(host, opts) {
  const log = (window.__scene = { opts, sets: [], destroyed: false });
  requestAnimationFrame(() => {
    host.dispatchEvent(new CustomEvent('ready'));
    host.dispatchEvent(new CustomEvent('beat', { detail: 1 }));
  });
  return {
    set(p) { log.sets.push(p); if (p.progress > 0.5) host.dispatchEvent(new CustomEvent('beat', { detail: 3 })); },
    destroy() { log.destroyed = true; },
  };
}`;

// A scene whose frames take ~120 ms each: a weak device.
const SLOW_SCENE = `
export function mount(host) {
  const log = (window.__slow = { destroyed: false });
  let on = true;
  const burn = () => { if (!on) return; const t = performance.now(); while (performance.now() - t < 120); requestAnimationFrame(burn); };
  requestAnimationFrame(() => { host.dispatchEvent(new CustomEvent('ready')); burn(); });
  return { set() {}, destroy() { on = false; log.destroyed = true; } };
}`;

export const flow = {
  name: "the stage mounts a scene through Studio's interface and hands it the scroll",
  async run({ page, go, expect, shot, step }) {
    await page.route('**/__qa/scene.mjs', (route) => route.fulfill({ contentType: 'text/javascript', body: SCENE }));
    await page.route('**/__qa/slow-scene.mjs', (route) => route.fulfill({ contentType: 'text/javascript', body: SLOW_SCENE }));
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect((await page.locator('.stage').getAttribute('data-scene-src')) !== null, 'the stage has no data-scene-src for the package');
    expect((await page.locator('.stage [data-scene-host]').count()) === 1, 'the stage has no scene host');

    step('mount');
    const live = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/scene.mjs'), { check: () => true, slowFrameMs: 1000 }));
    expect(live === true, 'the stand-in scene did not go live');
    // (The slow-device check is below, once this scene is gone.)
    const opts = await page.evaluate(() => window.__scene.opts);
    expect(typeof opts.progress === 'number' && opts.progress >= 0 && opts.progress <= 0.15, `mount got progress ${opts.progress} on the hero`);
    expect(opts.reducedMotion === false, 'mount got reducedMotion true');
    for (const k of ['background', 'chalk', 'dim', 'grid', 'amber']) expect(/^#[0-9a-f]{6}$/i.test(opts.palette[k]), `palette.${k} is "${opts.palette[k]}"`);
    expect(opts.palette.amber.toUpperCase() === '#F2A93B', `palette.amber is ${opts.palette.amber}`);
    await page.waitForFunction(() => document.querySelector('.stage').classList.contains('is-live'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '0'); // the plates fade out
    await page.waitForFunction(() => document.querySelector('.stage').getAttribute('data-scene-beat') === '1');

    step('scroll drives progress');
    await scrollToBeat(page, 3);
    await page.waitForFunction(() => window.__scene.sets.some((s) => s.progress >= 0.5 && s.progress <= 0.72));
    await page.waitForFunction(() => document.querySelector('.stage').getAttribute('data-scene-beat') === '3');
    await scrollToBeat(page, 1);
    await page.waitForFunction(() => { const s = window.__scene.sets; return s[s.length - 1].progress < 0.3; });
    await shot('cena');

    step('reduced motion turning on puts the plates back');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__scene.destroyed && !document.querySelector('.stage').classList.contains('is-live'));
    expect(await page.evaluate(() => window.__scene.sets.some((s) => s.reducedMotion === true)), 'the scene was not told reducedMotion');

    step('a weak device keeps the plates');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const slow = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/slow-scene.mjs'), { check: () => true }));
    expect(slow === false, 'a scene with 120 ms frames went live');
    expect(await page.evaluate(() => window.__slow.destroyed), 'the slow scene was not destroyed');
    expect(!(await page.locator('.stage').evaluate((el) => el.classList.contains('is-live'))), 'the stage stayed live with a slow scene');
  },
};
