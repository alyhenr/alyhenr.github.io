export const flow = {
  name: 'a mistyped address at any depth gets the styled 404 page, and old pages move to the new ones',
  // The browser logs the document's own 404 status; that is the point of this flow.
  allow: [/Failed to load resource: the server responded with a status of 404/],
  async run({ page, go, expect, shot, step }) {
    const res = await go('/plugins/nope/deeper');
    expect(res?.status() === 404, `expected a 404 status, got ${res?.status()}`);
    await page.getByRole('heading', { level: 1, name: 'Página não encontrada' }).waitFor();
    const shown = await page.locator('#not-found-path').textContent();
    expect(shown === '/plugins/nope/deeper', `the page shows "${shown}" as the requested path`);
    // Root-absolute assets: styled and with its nav even three levels down.
    await page.getByRole('navigation', { name: 'Site' }).waitFor();
    expect(await page.locator('.site-head').evaluate((el) => getComputedStyle(el).position === 'sticky'), 'the 404 is unstyled at depth');
    await shot('nao-encontrada');
    await page.getByRole('link', { name: 'Ir para o início' }).click();
    await page.getByRole('heading', { level: 1, name: 'Seu site, traço a traço.' }).waitFor();

    step('the old Work page moves to Projetos');
    await go('/projects.html');
    await page.waitForURL('**/projetos.html');
    await page.getByRole('heading', { level: 1, name: 'Projetos' }).waitFor();
  },
};
