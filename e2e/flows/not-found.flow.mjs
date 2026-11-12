export const flow = {
  name: 'a mistyped address at any depth gets the styled 404 page',
  // The browser logs the document's own 404 status; that is the point of this flow.
  allow: [/Failed to load resource: the server responded with a status of 404/],
  async run({ page, go, expect, shot }) {
    const res = await go('/plugins/nope/deeper');
    expect(res?.status() === 404, `expected a 404 status, got ${res?.status()}`);
    await page.getByRole('heading', { level: 1, name: 'Page not found' }).waitFor();
    const shown = await page.locator('#not-found-path').textContent();
    expect(shown === '/plugins/nope/deeper', `the page shows "${shown}" as the requested path`);
    // Root-absolute assets: the menu bar (js/chrome.js) is there even three levels down.
    await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
    await shot('not-found');
    await page.getByRole('link', { name: 'Go to the homepage' }).click();
    await page.getByRole('heading', { level: 1, name: 'Alysson Almeida' }).waitFor();
  },
};
