// The site's privacy policy (the form's data, through the Gateway) reads without JavaScript, is
// linked from the form, and is the one page with the e-mail for data requests (besides the Alvarás
// policy's verbatim Contato line): every other page stays e-mail free.
const EMAIL = 'alyhenr.io@gmail.com';
const OTHERS = ['/', '/projetos.html', '/plugins/', '/plugins/alvaras/'];

export const flow = {
  name: 'the privacy page names the retention, Turnstile and the data e-mail, which no other page shows',
  context: { javaScriptEnabled: false },
  async run({ page, go, expect, shot, step }) {
    step('the privacy page, without JavaScript');
    await go('/privacidade.html');
    const doc = page.locator('.doc');
    await doc.getByRole('heading', { level: 1, name: 'Política de Privacidade' }).waitFor();
    await doc.getByText('Última atualização:').waitFor();
    await doc.getByRole('heading', { level: 2, name: /Cloudflare Turnstile/ }).waitFor();
    await doc.getByRole('link', { name: 'política de privacidade da Cloudflare' }).waitFor();
    await doc.getByText('90 dias').waitFor();
    await doc.getByText(/enquanto esse trabalho estiver aberto na agência/).waitFor();
    const mail = doc.getByRole('link', { name: EMAIL });
    await mail.waitFor();
    expect((await mail.getAttribute('href')) === `mailto:${EMAIL}`, 'the data e-mail is not a mailto link');
    await shot('privacidade');

    step('the form links it');
    await go('/#contato');
    await page.locator('[data-contact] .lgpd a[href="privacidade.html"]').waitFor();

    for (const path of OTHERS) {
      step(`${path}: no e-mail`);
      await go(path);
      const html = await page.content();
      expect(!html.includes(EMAIL), `${path} shows the data e-mail, which only the privacy pages may`);
    }
  },
};
