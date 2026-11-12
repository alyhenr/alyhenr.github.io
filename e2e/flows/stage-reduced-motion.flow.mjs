import { scrollToBeat, plateOn, watchScene, autoMount, expectPlatesOnly } from './_lib.mjs';

// prefers-reduced-motion: the scene never starts (its script isn't even fetched); the five plates
// crossfade at each beat's threshold instead.
export const flow = {
  name: 'with reduced motion the stage crossfades its plates per beat and never starts the scene',
  context: { reducedMotion: 'reduce' },
  async run({ page, go, expect, shot, step }) {
    const scene = watchScene(page);
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect((await autoMount(page)) === false, 'the scene went live under reduced motion');
    await expectPlatesOnly(page, expect, 'reduced-motion', scene);

    step('plates per beat');
    const fade = await page.locator('[data-plate="2"]').evaluate((img) => getComputedStyle(img).transitionDuration);
    expect(fade === '0.4s', `the plates' crossfade is ${fade}, expected 0.4s`);
    for (const [beat, plate] of [[2, 2], [3, 3], [4, 4], [5, 5]]) {
      await scrollToBeat(page, beat);
      await page.waitForFunction((p) => document.querySelector('[data-plate].is-on')?.getAttribute('data-plate') === String(p), plate);
      expect((await plateOn(page)) === plate, `beat ${beat} shows plate ${await plateOn(page)}`);
    }
    await scrollToBeat(page, 4);
    await shot('entrega');

    step('a scene offered by hand is refused');
    const mount = await page.evaluate(async () => {
      let called = false;
      const live = await window.TracoStage.mountScene(() => { called = true; return { mount: () => ({ update() {}, destroy() {} }) }; });
      return { live, called };
    });
    expect(mount.live === false && !mount.called, 'a scene was loaded under reduced motion');
    await expectPlatesOnly(page, expect, 'reduced-motion', scene);
  },
};
