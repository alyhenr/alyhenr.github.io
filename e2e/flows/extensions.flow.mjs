export const flow = {
  name: 'a visitor goes from the extensions list to Alvarás, its store listing and its privacy policy',
  async run({ page, go, expect, shot }) {
    await go('/plugins/');
    const item = page.locator('[data-extension="alvaras"]');
    await item.getByRole('heading', { name: 'Alvarás: controle de vencimento' }).waitFor();
    await shot('extensoes');
    await item.getByRole('link', { name: 'Ver a extensão' }).click();
    await page.waitForURL('**/plugins/alvaras/');
    await page.getByRole('heading', { level: 1, name: 'Alvarás' }).waitFor();
    const store = page.getByRole('link', { name: 'Instalar no Chrome' });
    const href = await store.getAttribute('href');
    expect(href === 'https://chromewebstore.google.com/detail/nbfalncbmoaalmoiboakhgkfpoglceci', `the Chrome button links ${href}`);
    expect(!/authuser|pli=/.test(await page.content()), 'a store link still carries signed-in account parameters');
    const shots = page.locator('.shots img');
    await shots.first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.shots img')].every((i) => i.complete && i.naturalWidth > 0));
    await shot('alvaras');
    await page.locator('main').getByRole('link', { name: 'Política de privacidade' }).first().click();
    await page.waitForURL('**/plugins/alvaras/privacidade/');
    await page.getByRole('heading', { level: 1, name: /Política de Privacidade/ }).waitFor();
  },
};
