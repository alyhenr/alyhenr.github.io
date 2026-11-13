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

// A scene whose setup and first frame took 300 ms (the shaders compiling on a cold GPU process),
// then draws fast: a good phone's first visit.
const SLOW_START_SCENE = `
export function mount(host, inputs) {
  const log = (window.__slowStart = { destroyed: false });
  const t0 = performance.now();
  while (performance.now() - t0 < 300);
  requestAnimationFrame(() => inputs.onReady({ firstFrameMs: 300 }));
  return { update() {}, destroy() { log.destroyed = true; } };
}`;

// A scene whose every frame takes 80 ms, the first one included: a weak phone.
const SLOW_SCENE = `
export function mount(host, inputs) {
  const log = (window.__slow = { destroyed: false });
  let raf = 0;
  const draw = () => { raf = 0; const t0 = performance.now(); while (performance.now() - t0 < 80); };
  const schedule = () => { if (!raf && !log.destroyed) raf = requestAnimationFrame(draw); };
  requestAnimationFrame(() => { draw(); requestAnimationFrame(() => { draw(); inputs.onReady({ firstFrameMs: 120 }); }); });
  return { update() { schedule(); }, destroy() { log.destroyed = true; cancelAnimationFrame(raf); } };
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
    for (const [path, body] of [['scene', SCENE], ['slow-start-scene', SLOW_START_SCENE], ['slow-scene', SLOW_SCENE], ['failing-scene', FAILING_SCENE]]) {
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

    step('a slow first frame followed by fast frames plays the scene');
    const slowStart = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/slow-start-scene.mjs'), { check: () => true }));
    const started = await page.evaluate(() => window.TracoStage.state);
    expect(slowStart === true, `a scene with a 300 ms first frame and fast frames after it kept the plates (${started.reason}, frames ${started.frameMs} ms)`);
    expect(started.firstFrameMs === 300, `the stage recorded a first frame of ${started.firstFrameMs} ms`);
    expect(typeof started.frameMs === 'number' && started.frameMs <= 33, `the warm frames took ${started.frameMs} ms`);
    expect(await isLive(), 'the stage is not live with a scene that warmed up');

    step('consistently slow frames keep the plates');
    const slow = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/slow-scene.mjs'), { check: () => true }));
    const dropped = await page.evaluate(() => window.TracoStage.state);
    expect(slow === false, `a scene drawing 80 ms frames went live (frames ${dropped.frameMs} ms)`);
    expect(await page.evaluate(() => window.__slowStart.destroyed), 'the scene it replaced was not destroyed');
    expect(await page.evaluate(() => window.__slow.destroyed), 'the slow scene was not destroyed');
    expect(dropped.reason === 'slow-frames', `the slow scene was dropped for "${dropped.reason}", not its frames`);
    expect(dropped.frameMs >= 80, `the slow scene's frames measured ${dropped.frameMs} ms`);
    expect(!(await isLive()), 'the stage stayed live with a slow scene');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '1');

    step('onError keeps the plates');
    const failing = await page.evaluate(() => window.TracoStage.mountScene(() => import('/__qa/failing-scene.mjs'), { check: () => true }));
    expect(failing === false, 'a failing scene went live');
    expect(await page.evaluate(() => window.__failing.destroyed), 'the failing scene was not destroyed');
    expect((await page.evaluate(() => window.TracoStage.state.reason)) === 'error', 'the failing scene left no error reason');
    expect(!(await isLive()), 'the stage went live with a failing scene');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-plate="1"]')).opacity === '1');
  },
};
