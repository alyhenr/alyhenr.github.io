/*
 * site.js (module): the calculator and the contact form, on the agency's catalogue.
 * prices/ is a copy of vendor/web/prices 1.1.0 (prices.json + quote.mjs): the math is quote()'s,
 * never this file's. The real site imports the same two files.
 *
 * No contact endpoint yet: the form validates and stops. No phone number or e-mail anywhere.
 */
import { quote, formatBRL } from './prices/quote.mjs';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Short helper lines under each option (copy only; names and amounts come from prices.json).
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
  'textos': 'Os textos das páginas, escritos para você',
};
const DEFAULT = { tier: 'site-institucional', addons: ['galeria-gerenciavel', 'formulario-email', 'configuracao-dominio'] };
const MAX_EXTRA = 10;

/** E-mail, or a phone number with DDD (10 or 11 digits, +55 allowed). */
export function validContact(v) {
  v = String(v || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
  const digits = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return /^[\d\s()+.-]+$/.test(v) && digits.length >= 10 && digits.length <= 11;
}

/** The line the form carries for a calculator quote. */
export function calcSummary(prices, q) {
  const from = q.moved_from ? ` (a partir de ${prices.tiers.find((t) => t.id === q.moved_from).name})` : '';
  const extras = q.lines.slice(1).map((l) => (l.included ? l.name : `${l.name} ${formatBRL(l.amount)}`));
  const total = `${q.quoted_by_scope ? 'A partir de ' : 'Total '}${q.total_text}, ${q.timeline}`;
  return `Calculadora: ${q.tier.name}${from}.${extras.length ? ' ' + extras.join(', ') + '.' : ''} ${total}${q.label ? ', ' + q.label : ''}. É uma estimativa.`;
}

/** The line the form carries for a ready package. */
export function packageSummary(prices, id) {
  const t = prices.tiers.find((x) => x.id === id);
  const price = `${t.quoted_by_scope ? 'a partir de ' : ''}${formatBRL(t.from)}`;
  return `Pacote ${t.name}: ${price}${prices.launch.active ? ' (' + prices.launch.label + ')' : ''}, ${t.timeline}.${t.quoted_by_scope ? ' Preço e prazo definidos pelo escopo.' : ''}`;
}

function row({ type, name, value, checked, title, hint, price }) {
  const label = document.createElement('label');
  label.className = 'row';
  label.innerHTML = `<input type="${type}" name="${name}" value="${value}"${checked ? ' checked' : ''}><span></span><span class="p"></span>`;
  const text = label.children[1];
  text.textContent = title;
  if (hint) { const s = document.createElement('small'); s.textContent = hint; text.appendChild(s); }
  label.children[2].textContent = price;
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
    tiersEl.appendChild(row({ type: 'radio', name: 'tier', value: t.id, checked: t.id === DEFAULT.tier, title: t.name, hint: TIER_HINT[t.id], price: (t.quoted_by_scope ? 'a partir de ' : '') + formatBRL(t.from) }));
  }
  const addonsEl = $('[data-addons]', form);
  for (const a of prices.addons.filter((x) => !x.per_unit)) {
    addonsEl.appendChild(row({ type: 'checkbox', name: 'addon', value: a.id, checked: DEFAULT.addons.includes(a.id), title: a.name, hint: ADDON_HINT[a.id], price: 'percent' in a ? `+${a.percent}%` : formatBRL(a.price) }));
  }
  const extraAddon = prices.addons.find((x) => x.per_unit);
  $$('[data-out="extra-price"]').forEach((el) => { el.textContent = formatBRL(extraAddon.price); });
  $$('[data-out="urgency"]').forEach((el) => { el.textContent = 'Na metade do prazo: mais ' + prices.rules.urgency_percent + '%.'; });
  let extra = 0;
  let current = null;

  const render = () => {
    const tier = $('[name="tier"]:checked', form).value;
    const addons = $$('[name="addon"]:checked', form).map((i) => i.value);
    if (extra > 0) addons.unshift({ id: extraAddon.id, qty: extra });
    const q = quote(prices, { tier, addons, urgent: $('[name="urgent"]', form).checked });
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
      ul.innerHTML = '';
      for (const l of q.lines) {
        const li = document.createElement('li');
        const a = document.createElement('span'); a.textContent = l.included ? l.name.replace(' (incluído)', '') : l.name;
        const b = document.createElement('span'); b.textContent = l.included ? 'incluído' : formatBRL(l.amount);
        li.append(a, b); ul.appendChild(li);
      }
    });
    $$('[data-step]', form).forEach((b) => { b.disabled = Number(b.dataset.step) < 0 ? extra <= 0 : extra >= MAX_EXTRA; });
  };

  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
    extra = Math.max(0, Math.min(MAX_EXTRA, extra + Number(b.dataset.step)));
    render();
  }));
  $$('[data-use-estimate]').forEach((b) => b.addEventListener('click', () => { setEstimate(calcSummary(prices, current)); goToForm(); }));
  $$('[data-pick]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); setEstimate(packageSummary(prices, b.dataset.pick)); goToForm(); }));
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
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
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
    status.textContent = `Pronto, ${v('nome').split(' ')[0]}. Recebi seu pedido e respondo em até 1 dia útil, pelo contato que você deixou. (Mockup: nada foi enviado.)`;
    status.className = 'form-status is-done';
  });
  $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => { if (i.getAttribute('aria-invalid')) err(i.name, ''); }));
}

wireForm();
fetch(new URL('./prices/prices.json', import.meta.url))
  .then((r) => r.json())
  .then(wireCalc)
  .catch(() => { const c = $('[data-calc]'); if (c) c.hidden = true; });
