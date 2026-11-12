// Every page, at every depth, loads its styles and scripts and gets the shared chrome
// (the paths are relative, so a wrong ../ shows up as a failed asset or a missing menu bar).
const PAGES = [
  ['/', 'Alysson Almeida'],
  ['/projects.html', 'Projects'],
  ['/blog.html', 'Writing'],
  ['/blog/first-post.html', 'Your First Blog Post'],
  ['/contact.html', 'Get in touch'],
  ['/plugins/', "What I've published"],
  ['/plugins/alvaras/', 'Alvarás — controle de vencimento'],
  ['/plugins/alvaras/privacidade/', /Política de Privacidade/],
];

export const flow = {
  name: 'every page loads with the site chrome, and the nav works from a nested page',
  async run({ page, go, step }) {
    for (const [path, title] of PAGES) {
      await go(path);
      step(`${path}: heading`);
      await page.getByRole('heading', { level: 1, name: title }).waitFor();
      step(`${path}: menu bar`);
      await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
      await page.locator('.statusbar').waitFor();
    }
    // From two levels down, the nav's basePath must still reach the root pages.
    await go('/plugins/alvaras/');
    step('nav from /plugins/alvaras/');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Writing', exact: true }).click();
    await page.waitForURL('**/blog.html');
    await page.getByRole('heading', { level: 1, name: 'Writing' }).waitFor();
  },
};
