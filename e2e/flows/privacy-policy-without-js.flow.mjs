// Store reviewers and crawlers may not run scripts: the store-submitted URLs must read without JS.
export const flow = {
  name: 'the store-submitted URLs read in full with JavaScript off',
  context: { javaScriptEnabled: false },
  async run({ page, go, expect, shot }) {
    await go('/plugins/alvaras/privacidade/');
    await page.getByRole('heading', { level: 1, name: 'Política de Privacidade — Alvarás (controle de vencimento)' }).waitFor();
    await page.getByText('Última atualização:').waitFor();
    const sections = await page.getByRole('heading', { level: 2 }).count();
    expect(sections >= 10, `the policy shows ${sections} sections without JS, expected its 10`);
    await shot('policy-no-js');

    await go('/plugins/alvaras/');
    await page.getByRole('heading', { level: 1, name: 'Alvarás — controle de vencimento' }).waitFor();

    await go('/plugins/');
    // Playwright's text and role matching skip <noscript> content: CSS locators reach it.
    await page.locator('p.notice').waitFor();
    await page.locator('a[href="alvaras/index.html"]').waitFor();
    await page.locator('a[href="alvaras/privacidade/index.html"]').waitFor();
  },
};
