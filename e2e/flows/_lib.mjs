// Shared helpers for the flows (not a flow: the QA runs only *.flow.mjs).

/** Scrolls so a beat section's top sits at the viewport's top, then waits two frames. */
export async function scrollToBeat(page, n) {
  await page.evaluate((n) => {
    const el = document.querySelector(`[data-beat="${n}"]`);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64);
  }, n);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** The plate shown on the stage (the one with .is-on), 1–5. */
export const plateOn = (page) => page.evaluate(() => Number(document.querySelector('[data-plate].is-on')?.getAttribute('data-plate')));

/** A phone number, an e-mail or a WhatsApp link: what the brief keeps off every page. */
export const CONTACT = /mailto:|tel:|wa\.me|whatsapp\.com|[\w.+-]+@[\w-]+\.[a-z]{2,}|\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/i;

/** Studio's scene bundle, the one file the stage loads for it. */
export const SCENE_SRC = /\/js\/scene\/traco-wireframe\.js$/;

/**
 * Records every request for the scene's bundle from now on; `.count()` says how many there were.
 * The plates-only cases (reduced motion, no WebGL, a weak phone) must never start the scene.
 */
export function watchScene(page) {
  const hits = [];
  page.on('request', (r) => { if (SCENE_SRC.test(new URL(r.url()).pathname)) hits.push(r.url()); });
  return { count: () => hits.length };
}

/** Waits for the page's own scene mount (after `load`) to settle; true when it went live. */
export async function autoMount(page) {
  await page.waitForFunction(() => window.TracoStage && window.TracoStage.auto);
  return page.evaluate(() => window.TracoStage.auto);
}

/** The plates-only stage: plate n on, no scene, no canvas, the reason the scene was refused. */
export async function expectPlatesOnly(page, expect, reason, scene) {
  const state = await page.evaluate(() => ({ live: window.TracoStage.state.live, reason: window.TracoStage.state.reason, loads: window.TracoStage.state.loads }));
  expect(state.reason === reason, `the scene was refused for "${state.reason}", expected "${reason}"`);
  expect(!state.live && state.loads === 0, `the scene started (live ${state.live}, mounted ${state.loads} times)`);
  expect(scene.count() === 0, `the scene's script was requested ${scene.count()} time(s)`);
  expect((await page.locator('[data-scene-host] canvas').count()) === 0, 'the stage holds a canvas');
  expect(!(await page.locator('.stage').evaluate((el) => el.classList.contains('is-live'))), 'the stage went live');
}

/** Walks the beats with the plates: beat n's section shows plate max(1, n), crossfading. */
export async function walkPlates(page) {
  for (const [beat, plate] of [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [3, 3], [1, 1]]) {
    await scrollToBeat(page, beat);
    await page.waitForFunction((p) => document.querySelector('[data-plate].is-on')?.getAttribute('data-plate') === String(p), plate);
    await page.waitForFunction((p) => getComputedStyle(document.querySelector(`[data-plate="${p}"]`)).opacity === '1', plate);
  }
}
