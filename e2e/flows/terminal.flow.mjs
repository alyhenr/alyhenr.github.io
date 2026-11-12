export const flow = {
  name: 'the hidden terminal opens, answers commands and navigates',
  async run({ page, go, size, shot }) {
    await go('/');
    const dialog = page.getByRole('dialog', { name: 'Terminal' });
    await page.getByRole('button', { name: 'Open terminal' }).click();
    await dialog.waitFor();
    const input = page.locator('#terminal-input');
    const output = page.locator('#terminal-output');

    await input.fill('cat status.txt');
    await input.press('Enter');
    await output.getByText('Open to interesting projects').waitFor();
    await input.fill('ls');
    await input.press('Enter');
    await output.getByText('plugins').first().waitFor();
    await shot('terminal');

    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    if (size === 'desktop') {
      // The `~` shortcut, away from any input.
      await page.locator('h1').click();
      await page.keyboard.press('~');
      await dialog.waitFor();
    } else {
      await page.getByRole('button', { name: 'Open terminal' }).click();
      await dialog.waitFor();
    }
    await input.fill('go plugins');
    await input.press('Enter');
    await page.waitForURL('**/plugins/index.html');
    await page.getByRole('heading', { level: 1, name: "What I've published" }).waitFor();
  },
};
