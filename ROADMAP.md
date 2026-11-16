# Roadmap — Portfolio

## Now
- **Connect the contact form** (ready) — The home's form validates and stops; through the Gateway a visitor's request reaches the owner (and becomes an agency lead).
  Goal: the home's form sends to the Gateway, ready for deploy day, where only the endpoint URL and the real Turnstile site key change. Replaces the "Connect the contact form" idea in Next.
  In:
  - The Gateway's contract (its README, "Sending a message"): POST JSON to `<gateway>/v1/submit/pk_portfolio_LAEYLkgWxfNmgOQbevE3` with `{ turnstile_token, locale: "pt-BR", fields: { name, email, phone, message, estimate } }`; name and message required, e-mail or phone (at least one), lengths 120 / 254 / 32 / 4000 / 120. Answers: 201 `{ ok, id, message }`; errors `{ ok:false, error, message }` (422 `invalid_fields` adds per-field messages; after `turnstile_failed` call `turnstile.reset()`; 429 has Retry-After). Show the Gateway's pt-BR message as it comes.
  - Cloudflare Turnstile widget on the form, with Cloudflare's always-pass test site key for now; endpoint URL and site key in one config place. While the endpoint is empty the form keeps today's behaviour ("not sent"), so a ship before deploy day breaks nothing.
  - Sending, success, field errors, rate limit, network/unavailable states, with pt-BR copy, a disabled button while sending, no double send.
  - Privacy page: fill the Gateway's docs/PRIVACY.md blanks (Turnstile under Cloudflare's policy; retention "while the lead's agency job is open, deleted at its close; a message that never became a job, or a lead that went nowhere, deleted after 90 days"); the contact e-mail for data requests alyhenr.io@gmail.com on the privacy page only (the `published` check gets that one exception, every other page stays e-mail free).
  Out: deploying the Gateway, the real keys, Core's pull, other pages.
  Done when:
  - Tests (the Gateway mocked): a valid send shows the success message and clears the form; 422 shows per-field messages; turnstile_failed resets the widget; 429, 503 and a network error show a retry message; an empty endpoint keeps the "not sent" behaviour.
  - The privacy page names the 90 days, Turnstile and the contact e-mail, and the e-mail appears on no other page (test).
  - Full QA green; Lighthouse mobile performance stays ≥ 90 with the widget.
  - A demo of the form's states on phone.

## Next

## Later

## Fixes and chores
- Deploy day for the form: set `GATEWAY_URL` and the real `TURNSTILE_SITE_KEY` in `js/contact-config.js` (nothing else changes), with alyhenr.github.io as the widget's hostname in Cloudflare and the Gateway's allowed origin. The Gateway must list `Retry-After` in `Access-Control-Expose-Headers` (else a 429 shows its message but the button doesn't wait).
- `privacidade.html` was written from the brief and the owner's decisions, without the Gateway's docs/PRIVACY.md text (not in this repo; asked of Jarvis 13/11): bring its wording in line when that text arrives, and confirm 422's per-field shape (the form reads `fields` as an object or a list of `{field, message}`).
- The privacy page is linked from the form's LGPD note only; a "Privacidade" link in every footer is six edits (the Alvarás pages too).
- Pre-existing: on a WebKit phone, `/#contato` (every page's "Pedir orçamento") can land about a screen above the form, because the calculator above it grows after the jump.
- traco-wireframe 1.0.1 (asked again of Studio 13/11, with the 1.0.0 folder attached): no console error on mount (three's computeBoundingSphere NaN), update() redrawing documented as the interface the frame test relies on. When it comes back: `jarvis deliveries take <id>`, rebundle, remake the plates, and drop `SCENE_NAN` from `.jarvis/qa.mjs`. Check the 33 ms warm-frame gate on a real budget Android when one is at hand.
- Firefox Add-ons: the Alvarás page shows "Firefox Add-ons: em revisão" (disabled) and no store link; fill the button when the listing is approved.
- The Alvarás policy's Contato line shows an e-mail (verbatim from alvaras-pg's PRIVACY.md), the one contact left on the site; changing it means editing PRIVACY.md in the extension's repo first, then this copy, with the date in both.

## History
- 2026-11-15: Scene 1.0.1: the iPhone plays it
- 2026-11-15: Mount the Traço scene
- 2026-11-12: Build the site: Traço
- 2026-11-12: Design directions, round 2
- 2026-11-12: Design directions
- 2026-11-12: Publish only the site
- 2026-11-12: Adopt into our standard
