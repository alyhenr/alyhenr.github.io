// Every page, at every depth, loads its styles and fonts and has the shared header and footer
// (the paths are relative, so a wrong ../ shows up as a failed asset or an unstyled header).
const PAGES = [
  ['/', 'Seu site, traço a traço.'],
  ['/projetos.html', 'Projetos'],
  ['/plugins/', 'Extensões'],
  ['/plugins/alvaras/', 'Alvarás'],
  ['/plugins/alvaras/privacidade/', /Política de Privacidade/],
  ['/privacidade.html', 'Política de Privacidade'],
];

export const flow = {
  name: 'every page has the Traço header and footer, and the nav works from a nested page',
  async run({ page, go, expect, step }) {
    for (const [path, title] of PAGES) {
      await go(path);
      step(`${path}: heading`);
      await page.getByRole('heading', { level: 1, name: title }).waitFor();
      step(`${path}: header and footer`);
      const nav = page.getByRole('navigation', { name: 'Site' });
      for (const label of ['Início', 'Projetos', 'Extensões']) await nav.getByRole('link', { name: label, exact: true }).waitFor();
      await page.locator('.site-foot').getByText('Engenheiro de software. Construo sistemas com agentes de IA.').waitFor();
      const styled = await page.locator('.site-head').evaluate((el) => getComputedStyle(el).position === 'sticky');
      expect(styled, `${path}: the header is unstyled (css/site.css did not load)`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.fonts.check('800 20px Anybody')), `${path}: the Anybody font did not load`);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang === 'pt-BR', `${path}: lang is ${lang}`);
      const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(hscroll <= 0, `${path}: the page scrolls sideways by ${hscroll}px`);
    }
    // From two levels down, the nav's relative links still reach the root pages.
    await go('/plugins/alvaras/privacidade/');
    step('nav from /plugins/alvaras/privacidade/');
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Projetos', exact: true }).click();
    await page.waitForURL('**/projetos.html');
    await page.getByRole('heading', { level: 1, name: 'Projetos' }).waitFor();
  },
};
