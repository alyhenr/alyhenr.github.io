# Roadmap — Portfolio

## Now

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
- 2026-11-15: Connect the contact form
- 2026-11-15: Scene 1.0.1: the iPhone plays it
- 2026-11-15: Mount the Traço scene
- 2026-11-12: Build the site: Traço
- 2026-11-12: Design directions, round 2
- 2026-11-12: Design directions
- 2026-11-12: Publish only the site
- 2026-11-12: Adopt into our standard
