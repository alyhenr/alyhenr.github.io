// Store reviewers and crawlers may not run scripts: the store-submitted URLs must read without JS.
export const flow = {
  name: 'the store-submitted URLs read in full with JavaScript off',
  context: { javaScriptEnabled: false },
  async run({ page, go, expect, shot }) {
    await go('/plugins/alvaras/privacidade/');
    await page.getByRole('heading', { level: 1, name: 'Política de Privacidade — Alvarás (controle de vencimento)' }).waitFor();
    await page.getByText('Última atualização:').waitFor();
    const sections = await page.locator('.doc').getByRole('heading', { level: 2 }).count();
    expect(sections >= 10, `the policy shows ${sections} sections without JS, expected its 10`);
    await shot('politica-sem-js');

    await go('/plugins/alvaras/');
    await page.getByRole('heading', { level: 1, name: 'Alvarás' }).waitFor();
    await page.getByRole('link', { name: 'Instalar no Chrome' }).waitFor();

    await go('/plugins/');
    await page.locator('a[href="alvaras/"]').first().waitFor();
    await page.locator('a[href="alvaras/privacidade/"]').waitFor();
  },
};
