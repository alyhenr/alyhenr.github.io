import { scrollToBeat, plateOn } from './_lib.mjs';

// prefers-reduced-motion: no scene, no camera: the four plates crossfade at each beat's threshold.
export const flow = {
  name: 'with reduced motion the stage crossfades its plates per beat and mounts no scene',
  context: { reducedMotion: 'reduce' },
  async run({ page, go, expect, shot }) {
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    const fade = await page.locator('[data-plate="2"]').evaluate((img) => getComputedStyle(img).transitionDuration);
    expect(fade === '0.4s', `the plates' crossfade is ${fade}, expected 0.4s`);
    for (const [beat, plate] of [[2, 2], [3, 3], [4, 4]]) {
      await scrollToBeat(page, beat);
      await page.waitForFunction((p) => document.querySelector('[data-plate].is-on')?.getAttribute('data-plate') === String(p), plate);
      expect((await plateOn(page)) === plate, `beat ${beat} shows plate ${await plateOn(page)}`);
    }
    await shot('entrega');
    // A scene offered under reduced motion is refused: the plates stay.
    const mounted = await page.evaluate(() => window.TracoStage.mountScene(() => ({ mount: () => ({ set() {}, destroy() {} }) })));
    expect(mounted === false, 'a scene mounted under reduced motion');
    expect(!(await page.locator('.stage').evaluate((el) => el.classList.contains('is-live'))), 'the stage went live under reduced motion');
  },
};
