// Projetos: Jarvis and the Lab told through live architecture diagrams, the Alvarás extension
// with its page and policy, his GitHub; no other apps.
export const flow = {
  name: 'the Projetos page shows Jarvis, Alvarás and the Lab with live diagrams',
  async run({ page, go, expect, shot, step }) {
    await go('/projetos.html');
    await page.getByRole('heading', { level: 1, name: 'Projetos' }).waitFor();
    for (const h of ['Jarvis', 'Alvarás', 'Lab', 'GitHub']) await page.getByRole('heading', { level: 2, name: h }).waitFor();
    const text = await page.locator('main').innerText();
    expect(!/\b(Pipa|Racha|Garantia)\b/.test(text), 'Projetos names an app the brief keeps off it');
    expect((await page.locator('a[href="https://github.com/alyhenr"]').count()) >= 1, 'no link to his GitHub');

    step('the Jarvis diagram runs');
    const jarvis = page.locator('#jarvis [data-flow]');
    await jarvis.scrollIntoViewIfNeeded();
    await jarvis.locator('[data-flow-log] li').first().waitFor();
    await page.waitForFunction(() => document.querySelector('#jarvis .wire.is-live, #jarvis .flow-dot'));
    await shot('jarvis');
    step('the Lab diagram runs');
    const lab = page.locator('#lab [data-flow]');
    await lab.scrollIntoViewIfNeeded();
    await lab.locator('[data-flow-log] li').first().waitFor();
    await shot('lab');

    step('Alvarás leads to its page');
    await page.locator('#alvaras').getByRole('link', { name: 'Página da extensão' }).click();
    await page.waitForURL('**/plugins/alvaras/');
    await page.getByRole('heading', { level: 1, name: 'Alvarás' }).waitFor();
  },
};
