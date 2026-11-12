import { CONTACT } from './_lib.mjs';

// Contact is the form only: no phone number or e-mail on the page. The form validates and stops
// (sending it is "Connect the contact form"); nothing may leave the page.
export const flow = {
  name: 'the contact form validates, says it did not send, and the page shows no phone or e-mail',
  async run({ page, go, expect, shot, step }) {
    const sent = [];
    await page.route((url) => !['127.0.0.1', 'localhost'].includes(url.hostname), (route) => { sent.push(route.request().url()); return route.abort(); });
    page.on('request', (r) => { if (r.method() !== 'GET') sent.push(`${r.method()} ${r.url()}`); });
    await go('/#contato');
    const form = page.locator('[data-contact]');
    await page.getByRole('heading', { name: 'Conte o que você precisa' }).waitFor();
    await form.getByText('LGPD').waitFor();

    step('no contact outside the form');
    const shown = await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).join(' '));
    const hit = shown.match(CONTACT);
    expect(!hit, `the home shows a contact outside the form: "${hit && hit[0]}"`);

    step('empty submit');
    await form.getByRole('button', { name: 'Enviar pedido' }).click();
    await form.getByText('Escreva seu nome.').waitFor();
    await form.getByText('Escreva um e-mail ou um telefone com DDD.').waitFor();
    await form.getByText('Falta pouco: veja os campos marcados.').waitFor();
    expect((await page.evaluate(() => document.activeElement?.getAttribute('name'))) === 'nome', 'the first wrong field is not focused');

    step('a bad contact');
    await form.getByLabel('Nome').fill('Marina Duarte');
    await form.getByLabel('E-mail ou telefone').fill('12345');
    await form.getByLabel('Mensagem').fill('Quero que as clientes marquem horário pelo site.');
    await form.getByRole('button', { name: 'Enviar pedido' }).click();
    await form.getByText('Escreva um e-mail ou um telefone com DDD.').waitFor();
    await shot('contato-erros');

    step('a valid request');
    await form.getByLabel('E-mail ou telefone').fill('(31) 98765-4321');
    await form.getByRole('button', { name: 'Enviar pedido' }).click();
    await form.getByText(/^Obrigado, Marina\. O envio pelo site ainda está sendo ligado/).waitFor();
    expect((await form.locator('[aria-invalid="true"]').count()) === 0, 'a field is still marked wrong');
    await shot('contato');
    expect(sent.length === 0, `the page sent requests out: ${sent.join(', ')}`);
    expect(new URL(page.url()).pathname === '/', `the submit left the page for ${page.url()}`);
  },
};
