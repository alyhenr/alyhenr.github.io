import { scrollToBeat, plateOn } from './_lib.mjs';

// The home: the sticky stage swaps its five plates (one per beat of Studio's scene) while the step
// counter follows the four steps, ending on "O site é seu. Tudo dele é seu."; then the packages with their launch price.
export const flow = {
  name: 'the home walks through the four steps on the stage and shows the ready packages',
  async run({ page, go, expect, shot, step }) {
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    const nav = page.getByRole('navigation', { name: 'Site' });
    for (const label of ['Início', 'Projetos', 'Extensões']) await nav.getByRole('link', { name: label, exact: true }).waitFor();
    const counter = page.locator('[data-progress-label]');
    expect(await page.locator('[data-progress]').isVisible(), 'the step counter is hidden with JS on');
    expect((await counter.textContent()) === 'Como funciona', `the hero's counter reads "${await counter.textContent()}"`);
    expect((await plateOn(page)) === 1, 'the hero does not show plate 1');
    expect(await page.locator('[data-plate="1"]').evaluate((img) => img.complete && img.naturalWidth > 0), 'plate 1 did not load');
    await shot('hero');

    // beat → [counter, plate]
    const expected = { 1: ['Passo 1 de 4', 1], 2: ['Passo 2 de 4', 2], 3: ['Passo 3 de 4', 3], 4: ['Passo 4 de 4', 4], 5: ['Passo 4 de 4', 5] };
    for (const [beat, [label, plate]] of Object.entries(expected)) {
      step(`beat ${beat}`);
      await scrollToBeat(page, Number(beat));
      await page.waitForFunction((l) => document.querySelector('[data-progress-label]').textContent === l, label);
      const on = await plateOn(page);
      expect(on === plate, `beat ${beat} shows plate ${on}, expected ${plate}`);
      const bars = await page.locator('[data-progress] .bars span.is-on').count();
      expect(bars === Math.min(Number(beat), 4), `beat ${beat} lights ${bars} progress bars`);
      if (beat === '3') await shot('sinal');
    }
    await page.getByRole('heading', { name: 'O site é seu. Tudo dele é seu.' }).waitFor();
    await shot('o-site-e-seu');
    // Scrolling back un-builds it.
    await scrollToBeat(page, 1);
    await page.waitForFunction(() => document.querySelector('[data-progress-label]').textContent === 'Passo 1 de 4');
    expect((await plateOn(page)) === 1, 'scrolling back to Conversa does not bring plate 1 back');

    step('packages');
    const packages = page.locator('#pacotes');
    await packages.scrollIntoViewIfNeeded();
    await packages.getByRole('heading', { name: 'Pacotes prontos' }).waitFor();
    for (const name of ['Página única', 'Site institucional', 'Site com recursos', 'Sistema sob medida']) await packages.getByRole('heading', { level: 3, name }).waitFor();
    const launch = await packages.getByText('preço de lançamento').count();
    expect(launch === 4, `"preço de lançamento" shows ${launch} times on the packages, expected on each of the 4`);
    await shot('pacotes');

    step('who and projects');
    await page.getByText('Engenheiro de software. Construo sistemas com agentes de IA.').first().waitFor();
    await page.getByText(/sistemas que não podem parar/).waitFor();
    await page.locator('#sobre').scrollIntoViewIfNeeded();
    await shot('sobre');
    await page.locator('a.teaser[href="projetos.html"]').click();
    await page.waitForURL('**/projetos.html');
    await page.getByRole('heading', { level: 1, name: 'Projetos' }).waitFor();
  },
};
