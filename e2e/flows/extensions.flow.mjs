export const flow = {
  name: 'a visitor goes from the extensions list to Alvarás and its privacy policy',
  async run({ page, go, expect, shot }) {
    await go('/plugins/');
    // The cards are rendered from js/plugins.js.
    const card = page.locator('#plugins-grid .card').filter({ hasText: 'Alvarás — controle de vencimento' });
    await card.waitFor();
    await shot('extensions');
    await card.getByRole('link', { name: 'Details' }).click();
    await page.waitForURL('**/plugins/alvaras/index.html');
    await page.getByRole('heading', { level: 1, name: 'Alvarás — controle de vencimento' }).waitFor();
    const store = page.getByRole('link', { name: /Chrome Web Store/ });
    expect((await store.getAttribute('href'))?.startsWith('https://chromewebstore.google.com/'), 'the Chrome Web Store button does not link the store listing');
    await page.locator('img.shot__img').first().waitFor();
    await shot('alvaras');
    await page.getByRole('link', { name: 'Política de privacidade' }).click();
    await page.waitForURL('**/plugins/alvaras/privacidade/index.html');
    await page.getByRole('heading', { level: 1, name: /Política de Privacidade/ }).waitFor();
  },
};
