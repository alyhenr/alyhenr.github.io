import { watchScene, autoMount, expectPlatesOnly, walkPlates } from './_lib.mjs';

// A weak phone (navigator.deviceMemory ≤ 2) or a visitor saving data: the plates, and the scene's
// script never fetched. (The third signal, a first frame over 50 ms, is in stage-scene.)
export const flow = {
  name: 'on a weak phone or with Save-Data the stage shows its plates and never starts the scene',
  sizes: ['phone'],
  init: [() => { Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 2 }); }],
  async run({ page, go, expect, shot, step }) {
    const scene = watchScene(page);
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect((await autoMount(page)) === false, 'the scene went live with deviceMemory 2');
    await expectPlatesOnly(page, expect, 'weak-device', scene);
    await walkPlates(page);
    await shot('celular-fraco');

    step('Save-Data');
    const saveData = await page.evaluate(async () => {
      Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 8 });
      Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g' }) });
      let called = false;
      const live = await window.TracoStage.mountScene(() => { called = true; return import('/js/scene/traco-wireframe.js'); });
      return { live, called };
    });
    expect(saveData.live === false && !saveData.called, 'the scene loaded with Save-Data on');
    await expectPlatesOnly(page, expect, 'save-data', scene);
  },
};
