import { scrollToBeat, autoMount } from './_lib.mjs';

// The stage's side of Studio's interface (vendor/studio/traco-wireframe/README.md), with stand-in
// scenes so each callback can be driven: mount(el, { progress, reducedMotion, palette, onReady,
// onBeat, onError }) → { update, destroy }. The real scene plays in stage-live.
const SCENE = `
export function mount(host, inputs) {
  const log = (window.__scene = { inputs, updates: [], destroyed: false });
  requestAnimationFrame(() => { inputs.onBeat(1); inputs.onReady({ firstFrameMs: 5 }); });
  return {
    update(p) { log.updates.push(p); if (p.progress >= 0.5) inputs.onBeat(3); else if (p.progress < 0.3) inputs.onBeat(1); },
    destroy() { log.destroyed = true; },
  };
}`;

// A scene whose setup and first frame took 120 ms: a weak device.
const SLOW_SCENE = `
export function mount(host, inputs) {
  const log = (window.__slow = { destroyed: false });
  requestAnimationFrame(() => inputs.onReady({ firstFrameMs: 120 }));
  return { update() {}, destroy() { log.destroyed = true; } };
}`;

// A scene that can't run (no WebGL 2 context, say).
const FAILING_SCENE = `
export function mount(host, inputs) {
  const log = (window.__failing = { destroyed: false });
  queueMicrotask(() => inputs.onError('WebGL 2 is not available'));
  return { update() {}, destroy() { log.destroyed = true; } };
}`;

export const flow = {
  name: "the stage drives a scene through Studio's interface and falls back to its plates",
  async run({ page, go, expect, step }) {
    for (const [path, body] of [['scene', SCENE], ['slow-scene', SLOW_SCENE], ['failing-scene', FAILING_SCENE]]) {
      await page.route(`**/__qa/${path}.mjs`, (route) => route.fulfill({ contentType: 'text/javascript', body }));
    }
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect((await page.locator('.stage').getAttribute('data-scene-src')) === 'js/scene/traco-wireframe.js', "the stage's data-scene-src is not the scene's bundle");
    await autoMount(page); // the page's own mount settles first; the stand-ins replace it
    const isLive = () => page.locator('.stage').evaluate((el) => el.classList.contains('is-live'));

    step('mount');
    const live = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/scene.mjs'), { check: () => true }));
    expect(live === true, 'the stand-in scene did not go live');
    const inputs = await page.evaluate(() => { const i = window.__scene.inputs; return { ...i, onReady: typeof i.onReady, onBeat: typeof i.onBeat, onError: typeof i.onError }; });
    expect(typeof inputs.progress === 'number' && inputs.progress >= 0 && inputs.progress <= 0.15, `mount got progress ${inputs.progress} on the hero`);
    expect(inputs.reducedMotion === false, 'mount got reducedMotion true');
    expect(inputs.onReady === 'function' && inputs.onBeat === 'function' && inputs.onError === 'function', 'mount got no onReady, onBeat or onError');
    for (const k of ['background', 'vignette', 'chalk', 'dim', 'grid', 'amber']) expect(/^#[0-9a-f]{6}$/i.test(inputs.palette[k]), `palette.${k} is "${inputs.palette[k]}"`);
    expect(inputs.palette.amber.toUpperCase() === '#F2A93B', `palette.amber is ${inputs.palette.amber}`);
    await page.waitForFunction(() => document.querySelector('.stage').classList.contains('is-live'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '0'); // the plates fade out
    await page.waitForFunction(() => document.querySelector('.stage').getAttribute('data-scene-beat') === '1');

    step('the scroll drives progress, onBeat drives the counter');
    await scrollToBeat(page, 3);
    await page.waitForFunction(() => window.__scene.updates.some((u) => u.progress >= 0.5 && u.progress <= 0.72));
    await page.waitForFunction(() => document.querySelector('.stage').getAttribute('data-scene-beat') === '3');
    await page.waitForFunction(() => document.querySelector('[data-progress-label]').textContent === 'Passo 3 de 4');
    await scrollToBeat(page, 1);
    await page.waitForFunction(() => { const u = window.__scene.updates; return u[u.length - 1].progress < 0.3; });
    await page.waitForFunction(() => document.querySelector('[data-progress-label]').textContent === 'Passo 1 de 4');

    step('reduced motion turning on puts the plates back');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__scene.destroyed && !document.querySelector('.stage').classList.contains('is-live'));
    expect(await page.evaluate(() => window.__scene.updates.some((u) => u.reducedMotion === true)), 'the scene was not told reducedMotion');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    step('a first frame over 50 ms keeps the plates');
    const slow = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/slow-scene.mjs'), { check: () => true }));
    expect(slow === false, 'a scene with a 120 ms first frame went live');
    expect(await page.evaluate(() => window.__slow.destroyed), 'the slow scene was not destroyed');
    expect((await page.evaluate(() => window.TracoStage.state.reason)) === 'slow-first-frame', 'the slow scene was not dropped for its first frame');
    expect(!(await isLive()), 'the stage stayed live with a slow scene');

    step('onError keeps the plates');
    const failing = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/failing-scene.mjs'), { check: () => true }));
    expect(failing === false, 'a failing scene went live');
    expect(await page.evaluate(() => window.__failing.destroyed), 'the failing scene was not destroyed');
    expect((await page.evaluate(() => window.TracoStage.state.reason)) === 'error', 'the failing scene left no error reason');
    expect(!(await isLive()), 'the stage went live with a failing scene');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '1');
  },
};
