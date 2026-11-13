// The contact form talking to the Gateway, with the Gateway and Cloudflare's Turnstile both mocked
// here: the config module is swapped for one with an endpoint, every Gateway answer is scripted, and
// every other request off the local server is aborted. Nothing leaves the machine.
const GATEWAY = 'https://gateway.test';
const SUBMIT = `${GATEWAY}/v1/submit/pk_portfolio_LAEYLkgWxfNmgOQbevE3`;

const CONFIG = `export const GATEWAY_URL = '${GATEWAY}';
export const FORM_KEY = 'pk_portfolio_LAEYLkgWxfNmgOQbevE3';
export const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';`;

// Turnstile's explicit-render API: render() and reset() hand out a fresh token a moment later.
const TURNSTILE = `(() => {
  const opts = {};
  const ts = (window.__ts = { renders: 0, resets: 0, issued: 0, sitekey: '' });
  const issue = (id) => setTimeout(() => { ts.issued++; opts[id].callback('tok-' + ts.issued); }, 30);
  window.turnstile = {
    render(el, o) { const id = 'w' + ++ts.renders; opts[id] = o; ts.sitekey = o.sitekey; el.textContent = 'Verificação anti-robô (teste): você é humano.'; issue(id); return id; },
    reset(id) { ts.resets++; issue(id); },
    getResponse() { return ''; },
    remove() {},
  };
  const cb = new URL(document.currentScript.src).searchParams.get('onload');
  if (cb && typeof window[cb] === 'function') window[cb]();
})();`;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, accept', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Expose-Headers': 'Retry-After' };

export const flow = {
  name: 'the contact form sends to the Gateway and shows each of its answers',
  // The browser logs each non-2xx answer and the cut connection as a failed resource load.
  allow: [/Failed to load resource: the server responded with a status of (?:400|422|429|503)\b/, /Failed to load resource: net::ERR_FAILED/],
  async run({ page, go, expect, shot, step }) {
    const off = [];
    const posts = [];
    let answer = null; // the scripted answer for the next POST: { status, body, headers } | 'network'
    let hold = null; // a promise the next answer waits on (the sending state)
    await page.route((url) => !['127.0.0.1', 'localhost'].includes(url.hostname), (route) => { off.push(route.request().url()); return route.abort(); });
    await page.route('**/js/contact-config.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: CONFIG }));
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: TURNSTILE }));
    await page.route(`${GATEWAY}/**`, async (route) => {
      const r = route.request();
      if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      posts.push({ url: r.url(), body: r.postDataJSON() });
      if (hold) await hold;
      const a = answer;
      if (a === 'network') return route.abort('failed');
      return route.fulfill({ status: a.status, contentType: 'application/json', headers: { ...CORS, ...(a.headers || {}) }, body: JSON.stringify(a.body) });
    });

    await go('/#contato');
    const form = page.locator('[data-contact]');
    const status = form.locator('[data-form-status]');
    const button = form.getByRole('button', { name: /Enviar pedido|Enviando/ });
    const tokenReady = () => page.waitForFunction(() => window.__ts && window.__ts.issued === window.__ts.renders + window.__ts.resets);
    const fill = async () => {
      await form.getByLabel('Nome').fill('Marina Duarte');
      await form.getByLabel('E-mail ou telefone').fill('marina@exemplo.com.br');
      await form.getByLabel('Mensagem').fill('Quero que as clientes marquem horário pelo site.');
    };
    const submit = async (a) => {
      answer = a;
      await tokenReady();
      await button.click();
    };

    step('the Turnstile widget loads when the form comes near, with the test key');
    // WebKit can jump to #contato before the calculator above it has grown: scroll to the form.
    await form.scrollIntoViewIfNeeded();
    await form.getByText('Verificação anti-robô (teste)').waitFor();
    expect((await page.evaluate(() => window.__ts.sitekey)) === '1x00000000000000000000AA', 'the widget did not get the site key from the config');
    await page.locator('[data-pick="site-institucional"]').click();
    await page.waitForFunction(() => document.querySelector('[name="estimativa"]').value.startsWith('Pacote Site institucional'));
    await fill();

    step('422: each field shows the Gateway\'s message');
    await submit({ status: 422, body: { ok: false, error: 'invalid_fields', message: 'Confira os campos marcados.', fields: { name: 'Escreva o nome completo.', email: 'Esse e-mail não parece certo.' } } });
    await status.getByText('Confira os campos marcados.').waitFor();
    await form.locator('[data-error-for="nome"]').getByText('Escreva o nome completo.').waitFor();
    await form.locator('[data-error-for="contato"]').getByText('Esse e-mail não parece certo.').waitFor();
    expect((await form.getByLabel('Nome').getAttribute('aria-invalid')) === 'true', 'Nome is not marked wrong');
    expect((await page.evaluate(() => document.activeElement?.getAttribute('name'))) === 'nome', 'the first wrong field is not focused');
    expect((await form.getByLabel('Mensagem').inputValue()).length > 0, 'a field error cleared the message');
    await shot('contato-campos');

    step('turnstile_failed: the widget resets for a fresh token');
    const resets = await page.evaluate(() => window.__ts.resets);
    await submit({ status: 400, body: { ok: false, error: 'turnstile_failed', message: 'Não deu para confirmar que você não é um robô. Tente de novo.' } });
    await status.getByText('Não deu para confirmar que você não é um robô. Tente de novo.').waitFor();
    expect((await page.evaluate(() => window.__ts.resets)) > resets, 'the widget was not reset after turnstile_failed');

    step('429: the Gateway\'s message, and the button waits out Retry-After');
    await submit({ status: 429, headers: { 'Retry-After': '2' }, body: { ok: false, error: 'rate_limited', message: 'Muitos envios seguidos. Tente de novo em instantes.' } });
    await status.getByText('Muitos envios seguidos. Tente de novo em instantes.').waitFor();
    expect(await button.isDisabled(), 'the button is not waiting out Retry-After');
    await page.waitForFunction(() => !document.querySelector('[data-contact] button[type="submit"]').disabled, null, { timeout: 5000 });
    await shot('contato-espera');

    step('503: the Gateway\'s message to try again');
    await submit({ status: 503, body: { ok: false, error: 'unavailable', message: 'O envio está fora do ar agora. Tente de novo em alguns minutos.' } });
    await status.getByText('O envio está fora do ar agora. Tente de novo em alguns minutos.').waitFor();

    step('a cut connection: our message to try again, the text kept');
    await submit('network');
    await status.getByText(/parece que a conexão caiu/).waitFor();
    expect((await form.getByLabel('Nome').inputValue()) === 'Marina Duarte', 'the network error cleared the form');
    await shot('contato-sem-rede');

    step('sending: the button is disabled and a second submit sends nothing');
    let release;
    hold = new Promise((r) => { release = r; });
    const before = posts.length;
    await submit({ status: 201, body: { ok: true, id: 'msg_01', message: 'Recebido! O Alysson responde em até 1 dia útil.' } });
    await form.getByRole('button', { name: 'Enviando…' }).waitFor();
    expect(await button.isDisabled(), 'the button is not disabled while sending');
    await status.getByText('Enviando seu pedido…').waitFor();
    await shot('contato-enviando');
    await form.evaluate((f) => { f.requestSubmit(); f.requestSubmit(); });
    await page.waitForTimeout(150);
    expect(posts.length === before + 1, `a second submit while sending posted again (${posts.length - before} posts)`);
    release();
    hold = null;

    step('201: the Gateway\'s message, the form cleared');
    await status.getByText('Recebido! O Alysson responde em até 1 dia útil.').waitFor();
    expect(await status.evaluate((el) => el.classList.contains('is-done')), 'the success message is not in the done style');
    for (const label of ['Nome', 'E-mail ou telefone', 'Mensagem', 'Estimativa']) {
      expect((await form.getByLabel(label).inputValue()) === '', `${label} was not cleared`);
    }
    expect(await form.locator('[data-clear-estimate]').isHidden(), 'the estimate\'s clear button still shows');
    expect(await button.isEnabled(), 'the button stayed disabled after the send');
    await shot('contato-enviado');

    step('what went to the Gateway');
    const last = posts.at(-1);
    expect(last.url === SUBMIT, `posted to ${last.url}`);
    const b = last.body;
    expect(b.locale === 'pt-BR', `locale ${b.locale}`);
    expect(b.fields.name === 'Marina Duarte' && b.fields.email === 'marina@exemplo.com.br' && !('phone' in b.fields), `fields ${JSON.stringify(b.fields)}`);
    expect(b.fields.message.startsWith('Quero que as clientes marquem horário pelo site.\n\nEstimativa: Pacote Site institucional'), `message ${JSON.stringify(b.fields.message)}`);
    expect(b.fields.estimate === 'Pacote Site institucional: R$ 1.200, cerca de 10 dias úteis', `estimate ${JSON.stringify(b.fields.estimate)}`);
    const tokens = posts.map((p) => p.body.turnstile_token);
    expect(tokens.every(Boolean) && new Set(tokens).size === tokens.length, `each send needs a fresh token: ${tokens.join(', ')}`);
    expect(off.length === 0, `the page sent requests out: ${off.join(', ')}`);
  },
};
