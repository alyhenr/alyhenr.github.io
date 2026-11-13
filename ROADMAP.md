# Roadmap — Portfolio

## Now
- **Mount the Traço scene** (ready) — Studio delivered traco-wireframe 1.0.0 (request 30ca11cc31cc) while the site was being built; the home's stage still shows only its plates.
  Goal: the home's stage plays Studio's live line scene, with plates that match it, and falls back cleanly where it should.
  In:
  - Take the delivery (`jarvis deliveries take 30ca11cc31cc`, into vendor/studio/traco-wireframe); add three@0.187.0; mount it with `mount(el, inputs) → { update, destroy }` as its README says: progress from the spine's scroll, reducedMotion, the palette; onReady fades the plate out, onBeat syncs the step counter, onError keeps the plates.
  - Replace the stage's plates with Studio's plates (desktop-01…05.jpg, phone-01…05.jpg, rendered from the scene), so plate and scene line up at the crossfade.
  - Load after the first paint; plates only without WebGL, under reduced motion (crossfade per beat), and on weak phones (deviceMemory ≤ 2, saveData, or onReady's firstFrameMs > 50).
  - Owner's decision (12/11): the Alvarás privacy policy keeps its e-mail as is (the stores want a contact); no change there.
  Out: changing the scene itself (a departure goes back to Studio as 1.0.1), the form sending, other pages.
  Done when:
  - The home on phone and desktop plays the scene across the five beats, both scroll directions, and the step counter follows onBeat.
  - Tests: reduced motion, no WebGL and a weak-phone signal each show the plates and never start the scene.
  - The page stays light: the scene's script loads after the first paint and is ≤ 140 KB gzip; Lighthouse mobile performance stays ≥ 90.
  - A demo (stills and a scroll video on phone and desktop) with the scene live.
- **Scene 1.0.1: the iPhone plays it** (ready) — The owner saw the Traço scene on his Mac but only the plates on his iPhone 14 Plus: the weak-phone check is too strict, and Studio's 1.0.1 console-error fix waits on a request that carries the vendored copy.
  Goal: a recent phone (the owner's iPhone 14 Plus) plays the live scene; only really weak phones fall back to the plates; Studio gets the 1.0.1 request with the copy it needs.
  In:
  - Loosen the weak-phone check: the first frame includes shader compile and is no fair test. Judge on the frames after warm-up (e.g. the median of a few frames after the first) against a frame budget that still catches a weak phone; keep deviceMemory ≤ 2 and saveData. Pick the numbers, say why in the summary.
  - Send Studio the 1.0.1 request from the build's outbox with `attach_folder: vendor/studio/traco-wireframe`: the harmless console error to clear (say exactly what it logs and when), and, if the first-frame measure lives in the scene (onReady's firstFrameMs), what the portfolio now needs from it.
  - When 1.0.1 comes back, a later run takes it (`jarvis deliveries take <id>`) and remounts; nothing else waits on it.
  Out: changing the scene's look, other pages, the form.
  Done when:
  - Tests: a slow first frame followed by fast frames plays the scene; consistently slow frames, deviceMemory ≤ 2, saveData, reduced motion and no WebGL each keep the plates.
  - The request to Studio is in the outbox with the folder attached and the error described.
  - Full QA stays green; Lighthouse mobile performance stays ≥ 90.
  - The summary tells the owner to check the scene on his iPhone through the preview link.
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
- 2026-11-12: Build the site: Traço
- 2026-11-12: Design directions, round 2
- 2026-11-12: Design directions
- 2026-11-12: Publish only the site
- 2026-11-12: Adopt into our standard
