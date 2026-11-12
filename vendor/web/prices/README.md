# prices

The web agency's catalogue for client sites: tiers (with `pages` and `includes`), add-ons, rules and the
`launch` flag ("preço de lançamento"), all labels in pt-BR, every amount in whole reais. The agency owns it;
don't edit it here, ask the agency (web) for a change and take the next version.

- `prices.json`: the catalogue.
- `quote.mjs`: the math. `quote(prices, { tier, addons, urgent })` returns the lines, total, timeline and label;
  `formatBRL(n)` writes "R$ 1.400". In a browser, fetch `prices.json` and pass it to `quote()`; in Node,
  `loadPrices()` reads the file next to it. CLI: `node quote.mjs <tier> [add-on[xN] …] [--urgent]`.

The rule: an add-on with `moves_to` (agendamento online, blog ou conteúdo editável) lifts a smaller site to
Site com recursos, whose price includes one of them (shown "incluído" at R$ 0); every other add-on adds its
price; the English version adds its percent; urgency adds 30% last and halves the timeline.
