// The form's action is still the Formspree placeholder: the page must block the send and point
// to the email instead. Formspree is a live service, so any request to it is cut here.
export const flow = {
  name: 'the contact page offers the email and holds the unconnected form',
  async run({ page, go, expect, shot }) {
    let posted = false;
    await page.route(/formspree\.io/, (route) => {
      posted = true;
      return route.abort();
    });
    await go('/contact.html');
    await page.getByRole('heading', { level: 1, name: 'Get in touch' }).waitFor();
    const mail = page.getByRole('link', { name: 'alyhenr.io@gmail.com' }).first();
    expect((await mail.getAttribute('href')) === 'mailto:alyhenr.io@gmail.com', 'the email button is not a mailto link');

    const notice = page.locator('#form-disabled-notice');
    await notice.waitFor();
    await page.getByLabel('Name').fill('QA');
    await page.getByLabel('Email').fill('qa@example.com');
    await page.getByLabel('Message').fill('A test message.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.waitForTimeout(500);
    expect(!posted, 'the unconnected form posted to Formspree');
    expect(new URL(page.url()).pathname === '/contact.html', `the send left the page for ${page.url()}`);
    await notice.waitFor();
    await shot('contact');
  },
};
