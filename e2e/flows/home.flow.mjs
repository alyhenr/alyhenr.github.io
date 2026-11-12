export const flow = {
  name: 'the home introduces Alysson and leads to the extensions',
  async run({ page, go, shot }) {
    await go('/');
    await page.getByRole('heading', { level: 1, name: 'Alysson Almeida' }).waitFor();
    // The menu bar is injected by js/chrome.js, not written in the page.
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const label of ['Home', 'Work', 'Extensions', 'Writing', 'Contact']) {
      await nav.getByRole('link', { name: label, exact: true }).waitFor();
    }
    await page.getByRole('link', { name: 'About this extension' }).waitFor();
    await shot('home');
    await page.getByRole('link', { name: "See what I've built" }).click();
    await page.waitForURL('**/plugins/index.html');
    await page.getByRole('heading', { level: 1, name: "What I've published" }).waitFor();
  },
};
