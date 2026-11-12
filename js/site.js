/*
 * site.js (module): the home's calculator and contact form, on the web agency's catalogue
 * (vendor/web/prices 1.1.0: prices.json, fetched, and quote.mjs, through estimate.js).
 * Names and amounts come from prices.json; only the helper line under each option is copy here.
 *
 * The form validates and stops: sending it waits for the Gateway ("Connect the contact form").
 * No phone number or e-mail anywhere.
 */
import { quoteFor, calcSummary, packageSummary, validContact, formatBRL, tierPrice, plainAddons, extraPageAddon, MAX_EXTRA_PAGES } from './estimate.js';

const PRICES_URL = new URL('../vendor/web/prices/prices.json', import.meta.url);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const TIER_HINT = {
  'pagina-unica': '1 página',
  'site-institucional': 'Até 5 páginas, galeria, SEO básico',
  'site-com-recursos': 'Tudo do institucional e um recurso com servidor',
  'sistema-sob-medida': 'Login, painel, pagamentos, integrações',
};
const ADDON_HINT = {
  'galeria-gerenciavel': 'Fotos que você mesmo troca',
  'formulario-email': 'Os pedidos chegam no seu e-mail',
  'agendamento-online': 'O cliente marca o horário sozinho. Leva para Site com recursos.',
  'blog-conteudo-editavel': 'Novidades e textos que você edita. Leva para Site com recursos.',
  'pagamento-pix-cartao': 'Cobrar pelo próprio site',
  'area-login': 'Uma área só para os seus clientes',
  'versao-ingles': 'O site inteiro também em inglês',
  'video-animado': 'Um filme curto de apresentação',
  'configuracao-dominio': 'seunegocio.com.br apontando para o site',
  textos: 'Os textos das páginas, escritos para você',
};
const DEFAULT = { tier: 'site-institucional', addons: ['galeria-gerenciavel', 'formulario-email', 'configuracao-dominio'] };

function row({ type, name, value, checked, title, hint, price }) {
  const label = document.createElement('label');
  label.className = 'row';
  const input = document.createElement('input');
  Object.assign(input, { type, name, value, checked: !!checked });
  const text = document.createElement('span');
  text.textContent = title;
  if (hint) {
    const s = document.createElement('small');
    s.textContent = hint;
    text.appendChild(s);
  }
  const p = document.createElement('span');
  p.className = 'p';
  p.textContent = price;
  label.append(input, text, p);
  return label;
}

function setEstimate(text) {
  const form = $('[data-contact]');
  if (!form) return;
  form.querySelector('[name="estimativa"]').value = text;
  form.querySelector('[data-clear-estimate]').hidden = !text;
  form.querySelector('[data-estimate-field]').classList.toggle('has-estimate', !!text);
}

function goToForm() {
  const form = $('[data-contact]');
  if (!form) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  form.closest('section').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const first = $$('input, textarea', form).find((i) => !i.readOnly && !i.value);
  if (first) setTimeout(() => first.focus({ preventScroll: true }), reduce ? 0 : 450);
}

function wireCalc(prices) {
  const form = $('[data-calc]');
  if (!form) return;
  const tiersEl = $('[data-tiers]', form);
  for (const t of prices.tiers) {
    tiersEl.appendChild(row({ type: 'radio', name: 'tier', value: t.id, checked: t.id === DEFAULT.tier, title: t.name, hint: TIER_HINT[t.id], price: tierPrice(t) }));
  }
  const addonsEl = $('[data-addons]', form);
  for (const a of plainAddons(prices)) {
    addonsEl.appendChild(row({ type: 'checkbox', name: 'addon', value: a.id, checked: DEFAULT.addons.includes(a.id), title: a.name, hint: ADDON_HINT[a.id], price: 'percent' in a ? `+${a.percent}%` : formatBRL(a.price) }));
  }
  $$('[data-out="extra-price"]').forEach((el) => { el.textContent = formatBRL(extraPageAddon(prices).price); });
  $$('[data-out="urgency"]').forEach((el) => { el.textContent = `Na metade do prazo: mais ${prices.rules.urgency_percent}%.`; });
  $$('[data-out="urgency-pct"]').forEach((el) => { el.textContent = `+${prices.rules.urgency_percent}%`; });
  let extra = 0;
  let current = null;

  const render = () => {
    const addons = $$('[name="addon"]:checked', form).map((i) => i.value);
    const q = quoteFor(prices, { tier: $('[name="tier"]:checked', form).value, extraPages: extra, addons, urgent: $('[name="urgent"]', form).checked });
    current = q;
    const out = (k) => $$(`[data-out="${k}"]`);
    out('total').forEach((el) => { el.textContent = q.total_text; });
    out('from').forEach((el) => { el.hidden = !q.quoted_by_scope; });
    out('label').forEach((el) => { el.hidden = !q.label; el.textContent = q.label || ''; });
    out('tier').forEach((el) => { el.textContent = `${q.tier.name}, ${q.timeline}${q.quoted_by_scope ? '. Preço e prazo definidos pelo escopo.' : ''}`; });
    out('extra').forEach((el) => { el.textContent = extra; });
    out('moved').forEach((el) => {
      const mover = prices.addons.find((a) => a.moves_to === q.tier.id && addons.includes(a.id));
      el.hidden = !q.moved_from;
      el.textContent = q.moved_from && mover ? `${mover.name} leva o site para ${q.tier.name}, que já inclui um recurso desses.` : '';
    });
    out('lines').forEach((ul) => {
      ul.replaceChildren(...q.lines.map((l) => {
        const li = document.createElement('li');
        const a = document.createElement('span');
        a.textContent = l.included ? l.name.replace(' (incluído)', '') : l.name;
        const b = document.createElement('span');
        b.textContent = l.included ? 'incluído' : formatBRL(l.amount);
        li.append(a, b);
        return li;
      }));
    });
    $$('[data-step]', form).forEach((b) => { b.disabled = Number(b.dataset.step) < 0 ? extra <= 0 : extra >= MAX_EXTRA_PAGES; });
  };

  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
    extra = Math.max(0, Math.min(MAX_EXTRA_PAGES, extra + Number(b.dataset.step)));
    render();
  }));
  $$('[data-use-estimate]').forEach((b) => b.addEventListener('click', () => { setEstimate(calcSummary(prices, current)); goToForm(); }));
  $$('[data-pick]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); setEstimate(packageSummary(prices, b.dataset.pick)); goToForm(); }));
  form.classList.add('is-ready');
  render();
}

function wireForm() {
  const form = $('[data-contact]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  form.querySelector('[data-clear-estimate]').addEventListener('click', () => setEstimate(''));
  const v = (n) => String(form.querySelector(`[name="${n}"]`).value || '').trim();
  const err = (name, msg) => {
    const p = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.querySelector(`[name="${name}"]`);
    p.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !msg;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = [
      err('nome', v('nome') ? '' : 'Escreva seu nome.'),
      err('contato', validContact(v('contato')) ? '' : 'Escreva um e-mail ou um telefone com DDD.'),
      err('mensagem', v('mensagem') || v('estimativa') ? '' : 'Conte em uma frase o que o site precisa fazer.'),
    ].every(Boolean);
    if (!ok) {
      status.textContent = 'Falta pouco: veja os campos marcados.';
      status.className = 'form-status is-error';
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    // Not sent yet: the form goes live with "Connect the contact form".
    status.textContent = `Obrigado, ${v('nome').split(' ')[0]}. O envio pelo site ainda está sendo ligado e o pedido não saiu daqui: volte em breve, ele fica pronto em poucos dias.`;
    status.className = 'form-status is-done';
  });
  $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => { if (i.getAttribute('aria-invalid')) err(i.name, ''); }));
}

wireForm();
fetch(PRICES_URL)
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`prices.json: ${r.status}`))))
  .then(wireCalc)
  .catch(() => { const c = $('[data-calc]'); if (c) c.hidden = true; });
