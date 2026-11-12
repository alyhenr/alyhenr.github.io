import { scrollToBeat, autoMount, SCENE_SRC } from './_lib.mjs';

// Studio's real scene on the home: it loads after the page, fades the plates out, plays the five
// beats both ways as the visitor scrolls, and the step counter follows its onBeat.
// The QA's headless browsers start cold (a fresh GPU process, no shader cache), so the page's own
// mount may take more than the 50 ms first frame and fall back, as a weak phone would: the flow
// then mounts the same bundle with a looser first-frame budget, to see the scene itself play.
const EXPECTED = [ // section → [scene beat, counter]
  [0, 1, 'Como funciona'], [1, 1, 'Passo 1 de 4'], [2, 2, 'Passo 2 de 4'], [3, 3, 'Passo 3 de 4'], [4, 4, 'Passo 4 de 4'], [5, 5, 'Passo 4 de 4'],
];

export const flow = {
  name: "the home plays Studio's line scene across the five beats, both ways, with the counter on its beat",
  async run({ page, go, expect, shot, step }) {
    let loaded = 0;
    page.on('request', (r) => { if (SCENE_SRC.test(new URL(r.url()).pathname)) loaded++; });
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    expect(await page.evaluate(() => document.querySelector('[data-plate="1"]').complete), 'plate 1 is not up before the scene');

    step('it loads after the page and goes live');
    const auto = await autoMount(page);
    expect(loaded === 1, `the scene's script was requested ${loaded} times`);
    const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0);
    const scriptStart = await page.evaluate(() => performance.getEntriesByType('resource').find((e) => /traco-wireframe\.js$/.test(e.name))?.startTime ?? -1);
    expect(scriptStart > fcp, `the scene's script started loading at ${Math.round(scriptStart)} ms, before the first paint (${Math.round(fcp)} ms)`);
    const loadEnd = await page.evaluate(() => performance.getEntriesByType('navigation')[0].loadEventEnd);
    expect(scriptStart >= loadEnd, `the scene's script started at ${Math.round(scriptStart)} ms, before the page's load (${Math.round(loadEnd)} ms)`);
    if (!auto) {
      const why = await page.evaluate(() => window.TracoStage.state);
      expect(why.reason === 'slow-first-frame', `the scene did not go live: ${why.reason}`);
      const live = await page.evaluate((src) => window.TracoStage.mountScene(() => import(src), { slowFrameMs: 1000 }), '/js/scene/traco-wireframe.js');
      expect(live === true, `the scene did not go live by hand either: ${await page.evaluate(() => window.TracoStage.state.reason)}`);
    }
    await page.waitForFunction(() => document.querySelector('.stage').classList.contains('is-live'));
    await page.locator('[data-scene-host] canvas').waitFor();
    const box = await page.locator('[data-scene-host] canvas').boundingBox();
    const stageBox = await page.locator('.stage').boundingBox();
    expect(box && Math.abs(box.width - stageBox.width) < 2 && Math.abs(box.height - stageBox.height) < 2, `the canvas is ${box?.width}×${box?.height}, the stage ${stageBox.width}×${stageBox.height}`);
    await page.waitForFunction(() => [...document.querySelectorAll('[data-plate]')].every((img) => getComputedStyle(img).opacity === '0')); // the plates faded out

    const at = async (section, beat, label, shotName) => {
      await scrollToBeat(page, section);
      await page.waitForFunction(([b, l]) => document.querySelector('.stage').getAttribute('data-scene-beat') === String(b) && document.querySelector('[data-progress-label]').textContent === l, [beat, label]);
      const bars = await page.locator('[data-progress] .bars span.is-on').count();
      expect(bars === Math.min(beat === 1 ? section : beat, 4), `section ${section} lights ${bars} progress bars`);
      if (shotName) { await page.waitForTimeout(700); await shot(shotName); } // the scene eases ~0.45 s into place
    };

    step('scrolling down builds it');
    for (const [section, beat, label] of EXPECTED) await at(section, beat, label, `cena-${section}`);
    expect(await page.evaluate(() => window.TracoStage.state.live), 'the scene dropped out while scrolling down');

    step('scrolling back un-builds it');
    for (const [section, beat, label] of [...EXPECTED].reverse().slice(1)) await at(section, beat, label);
    await page.waitForTimeout(700);
    await shot('cena-de-volta');
    expect(await page.evaluate(() => window.TracoStage.state.live), 'the scene dropped out while scrolling back');
  },
};
