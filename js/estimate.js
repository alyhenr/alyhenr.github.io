/*
 * estimate.js (module): what the calculator and the packages hand the contact form, on the web
 * agency's catalogue (vendor/web/prices: prices.json and quote.mjs). The math is quote()'s, never
 * this file's: it only turns the calculator's choice into quote()'s arguments and writes the lines.
 * Pure (no DOM): the QA's `estimate` step imports it in Node.
 */
import { quote, formatBRL } from '../vendor/web/prices/quote.mjs';

export { formatBRL };

/** The most extra pages the calculator offers. */
export const MAX_EXTRA_PAGES = 10;

/** The add-on charged per page (the calculator's stepper), and the ones shown as checkboxes. */
export const extraPageAddon = (prices) => prices.addons.find((a) => a.per_unit);
export const plainAddons = (prices) => prices.addons.filter((a) => !a.per_unit);

/**
 * The calculator's choice → the agency's quote.
 * choice: { tier: id, extraPages: 0..MAX_EXTRA_PAGES, addons: [ids], urgent: boolean }
 */
export function quoteFor(prices, { tier, extraPages = 0, addons = [], urgent = false }) {
  const extra = Math.max(0, Math.min(MAX_EXTRA_PAGES, Math.round(Number(extraPages) || 0)));
  const picked = addons.filter((id) => plainAddons(prices).some((a) => a.id === id));
  if (extra > 0) picked.unshift({ id: extraPageAddon(prices).id, qty: extra });
  return quote(prices, { tier, addons: picked, urgent: !!urgent });
}

/** "a partir de R$ 5.000" for a tier quoted by scope, else "R$ 1.200". */
export const tierPrice = (t) => `${t.quoted_by_scope ? 'a partir de ' : ''}${formatBRL(t.from)}`;

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
  if (!t) return '';
  const launch = prices.launch.active ? ` (${prices.launch.label})` : '';
  return `Pacote ${t.name}: ${tierPrice(t)}${launch}, ${t.timeline}.${t.quoted_by_scope ? ' Preço e prazo definidos pelo escopo.' : ''}`;
}

/** The short line for the Gateway's estimate field (120 characters at most): tier, total, timeline. */
export function calcShort(q) {
  return `Calculadora: ${q.tier.name}, ${q.quoted_by_scope ? 'a partir de' : 'total'} ${q.total_text}, ${q.timeline}`;
}

/** The short line for a ready package. */
export function packageShort(prices, id) {
  const t = prices.tiers.find((x) => x.id === id);
  return t ? `Pacote ${t.name}: ${tierPrice(t)}, ${t.timeline}` : '';
}

/** An e-mail, or a phone number with DDD (10 or 11 digits, +55 allowed). */
export function validContact(v) {
  v = String(v || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
  const digits = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return /^[\d\s()+.-]+$/.test(v) && digits.length >= 10 && digits.length <= 11;
}
