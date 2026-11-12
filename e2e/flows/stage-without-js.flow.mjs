// Without JavaScript the stage holds plate 1 and every beat reads on its own; the counter (which
// needs the scroll) stays hidden, and the packages still show their prices.
export const flow = {
  name: 'without JavaScript the stage shows its first plate and every step reads',
  context: { javaScriptEnabled: false },
  async run({ page, go, expect, shot }) {
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();
    const plate = page.locator('[data-plate="1"]');
    expect(await plate.evaluate((img) => img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity === '1'), 'plate 1 is not showing');
    expect(!(await page.locator('[data-progress]').isVisible()), 'the step counter shows without JS');
    for (const h of ['Conversa', 'Proposta', 'Sinal de 50%', 'Entrega', 'O site é seu. Tudo dele é seu.']) await page.getByRole('heading', { level: 2, name: h }).waitFor();
    await page.locator('#pacotes').getByText('R$ 1.200').waitFor();
    // Playwright's text matching skips <noscript>: a CSS locator reaches it.
    await page.locator('.calc-nojs').waitFor();
    await shot('sem-js');
  },
};
