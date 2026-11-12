#!/usr/bin/env node
/**
 * The price catalogue (prices.json) and the quote math. Zero dependencies.
 *
 *   node quote.mjs                                   the catalogue, as JSON
 *   node quote.mjs <tier> [add-on[xN] …] [--urgent]  a quote, as JSON
 *     e.g. node quote.mjs site-institucional pagina-extrax2 galeria-gerenciavel versao-ingles --urgent
 *
 * The math: the tier's starting price, plus each add-on's price (per unit when it has `per_unit`);
 * an add-on with `moves_to` lifts a smaller site to that tier first, and the tier's price includes
 * one such feature (the priciest, so the listing order never matters): its line says "incluído"
 * at R$ 0, and each further one is charged at its add-on price;
 * a percentage add-on (the English version) applies to the site with its add-ons;
 * urgency applies last, to everything, and halves the timeline (days rounded up).
 * Each step rounds to whole reais. The total is a starting point: Jarvis can override it per job.
 *
 * It also loads in a browser (no static Node imports): fetch prices.json, then call quote(prices, …);
 * only loadPrices and the CLI need Node.
 */
const nodeModule = (name) => globalThis.process?.getBuiltinModule?.(name);

export function loadPrices(path = new URL('./prices.json', import.meta.url)) {
  const fs = nodeModule('node:fs');
  if (!fs) throw new Error('loadPrices needs Node: in a browser, fetch prices.json and pass it to quote()');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export const formatBRL = (n) => `R$ ${n.toLocaleString('pt-BR')}`;

const isMoney = (n) => Number.isInteger(n) && n >= 0;
const isText = (s) => typeof s === 'string' && s.trim().length > 0;

/** The problems with a catalogue's shape, as English lines; empty when it's sound. */
export function validatePrices(p) {
  const out = [];
  if (p?.currency !== 'BRL') out.push('currency must be BRL');
  if (typeof p?.launch?.active !== 'boolean' || !isText(p?.launch?.label)) out.push('launch needs active (boolean) and a label');
  const tiers = Array.isArray(p?.tiers) ? p.tiers : (out.push('tiers must be a list'), []);
  const addons = Array.isArray(p?.addons) ? p.addons : (out.push('addons must be a list'), []);
  const seen = new Set();
  for (const item of [...tiers, ...addons]) {
    if (!isText(item?.id)) out.push('an item has no id');
    else if (seen.has(item.id)) out.push(`duplicate id ${item.id}`);
    else seen.add(item.id);
    if (!isText(item?.name)) out.push(`${item?.id} has no name`);
  }
  for (const t of tiers) {
    if (!isMoney(t.from)) out.push(`tier ${t.id}: from must be whole reais`);
    if (!Number.isInteger(t.timeline_days) || t.timeline_days < 1) out.push(`tier ${t.id}: timeline_days must be a whole number of days`);
    if (!isText(t.description) || !isText(t.timeline)) out.push(`tier ${t.id}: needs a description and a timeline`);
    if ('pages' in t ? !(Number.isInteger(t.pages) && t.pages > 0) : !t.quoted_by_scope) out.push(`tier ${t.id}: pages must be a whole number of pages (only a tier quoted by scope may leave it out)`);
    if (!Array.isArray(t.includes) || !t.includes.length || !t.includes.every(isText)) out.push(`tier ${t.id}: includes must list what the tier comes with`);
  }
  for (let i = 1; i < tiers.length; i++) if (tiers[i].from < tiers[i - 1].from) out.push(`tier ${tiers[i].id} is cheaper than the one before it`);
  const tierIds = new Set(tiers.map((t) => t.id));
  for (const a of addons) {
    const hasPrice = 'price' in a, hasPercent = 'percent' in a;
    if (hasPrice === hasPercent) out.push(`add-on ${a.id}: needs either a price or a percent`);
    if (hasPrice && !isMoney(a.price)) out.push(`add-on ${a.id}: price must be whole reais`);
    if (hasPercent && !(Number.isInteger(a.percent) && a.percent > 0)) out.push(`add-on ${a.id}: percent must be a positive whole number`);
    if ('moves_to' in a && !tierIds.has(a.moves_to)) out.push(`add-on ${a.id}: moves_to ${a.moves_to} is not a tier`);
    if ('moves_to' in a && hasPercent) out.push(`add-on ${a.id}: a feature that moves the site needs a price, not a percent`);
  }
  const r = p?.rules ?? {};
  if (r.warranty_days !== 15) out.push('rules.warranty_days must be 15 (the agency rule)');
  if (r.monthly_fee !== false) out.push('rules.monthly_fee must be false (the client owns everything)');
  if (!isMoney(r.after_close_min)) out.push('rules.after_close_min must be whole reais');
  if (!(Number.isInteger(r.urgency_percent) && r.urgency_percent > 0)) out.push('rules.urgency_percent must be a positive whole number');
  return out;
}

/**
 * A quote: { tier, moved_from, lines: [{id, name, amount, included?}], total, timeline_days, timeline,
 * quoted_by_scope, label }. `addons` holds ids or { id, qty }.
 */
export function quote(prices, { tier, addons = [], urgent = false }) {
  const tierIndex = prices.tiers.findIndex((t) => t.id === tier);
  if (tierIndex < 0) throw new Error(`unknown tier ${tier} (one of ${prices.tiers.map((t) => t.id).join(', ')})`);
  const picked = addons.map((a) => {
    const { id, qty = 1 } = typeof a === 'string' ? { id: a } : a;
    const addon = prices.addons.find((x) => x.id === id);
    if (!addon) throw new Error(`unknown add-on ${id} (one of ${prices.addons.map((x) => x.id).join(', ')})`);
    if (!(Number.isInteger(qty) && qty > 0)) throw new Error(`add-on ${id}: qty must be a positive whole number`);
    return { addon, qty: addon.per_unit ? qty : 1 };
  });

  let index = tierIndex;
  for (const { addon } of picked) {
    const target = addon.moves_to ? prices.tiers.findIndex((t) => t.id === addon.moves_to) : -1;
    if (target > index) index = target;
  }
  const finalTier = prices.tiers[index];

  // The tier's price includes one of the features that move a site to it: the priciest.
  let included = picked
    .map((x) => x.addon)
    .filter((a) => a.moves_to === finalTier.id)
    .reduce((best, a) => (!best || a.price > best.price ? a : best), null);

  const lines = [{ id: finalTier.id, name: finalTier.name, amount: finalTier.from }];
  for (const { addon, qty } of picked.filter((x) => 'price' in x.addon)) {
    if (addon === included) {
      included = null; // only once, even if the same feature is listed twice
      lines.push({ id: addon.id, name: `${addon.name} (incluído)`, amount: 0, included: true });
      continue;
    }
    lines.push({ id: addon.id, name: qty > 1 ? `${addon.name} (${qty}x)` : addon.name, amount: addon.price * qty });
  }
  let total = sum(lines);
  for (const { addon } of picked.filter((x) => 'percent' in x.addon)) {
    const amount = Math.round((total * addon.percent) / 100);
    lines.push({ id: addon.id, name: `${addon.name} (+${addon.percent}%)`, amount });
  }
  total = sum(lines);
  let days = finalTier.timeline_days;
  let timeline = finalTier.timeline;
  if (urgent) {
    const pct = prices.rules.urgency_percent;
    lines.push({ id: 'urgencia', name: `Urgência, na metade do prazo (+${pct}%)`, amount: Math.round((total * pct) / 100) });
    total = sum(lines);
    days = Math.ceil(days / 2);
    timeline = `cerca de ${days} dias úteis`;
  }

  return {
    tier: { id: finalTier.id, name: finalTier.name },
    moved_from: index !== tierIndex ? tier : null,
    lines,
    total,
    total_text: formatBRL(total),
    timeline_days: days,
    timeline,
    quoted_by_scope: finalTier.quoted_by_scope === true,
    label: prices.launch.active ? prices.launch.label : null,
  };
}

const sum = (lines) => lines.reduce((s, l) => s + l.amount, 0);

const url = nodeModule('node:url');
if (url && process.argv[1] && url.fileURLToPath(import.meta.url) === process.argv[1]) {
  const prices = loadPrices();
  const args = process.argv.slice(2);
  try {
    if (!args.length) {
      console.log(JSON.stringify(prices, null, 2));
    } else {
      const [tier, ...rest] = args.filter((a) => !a.startsWith('--'));
      const addons = rest.map((a) => {
        const m = a.match(/^(.+?)x(\d+)$/);
        return m ? { id: m[1], qty: Number(m[2]) } : a;
      });
      console.log(JSON.stringify(quote(prices, { tier, addons, urgent: args.includes('--urgent') }), null, 2));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
