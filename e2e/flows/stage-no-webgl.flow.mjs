import { watchScene, autoMount, expectPlatesOnly, walkPlates } from './_lib.mjs';

// A browser without WebGL 2 (an old phone, WebGL turned off): the plates are the stage, swapped per
// beat, and the scene's script is never fetched.
export const flow = {
  name: 'without WebGL the stage shows its plates and never starts the scene',
  init: [() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/i.test(String(type)) ? null : get.call(this, type, ...rest);
    };
  }],
  async run({ page, go, expect, shot }) {
    const scene = watchScene(page);
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect((await autoMount(page)) === false, 'the scene went live without WebGL');
    await expectPlatesOnly(page, expect, 'no-webgl', scene);
    await walkPlates(page);
    await shot('sem-webgl');
    await expectPlatesOnly(page, expect, 'no-webgl', scene);
  },
};
