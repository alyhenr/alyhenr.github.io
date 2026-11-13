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
- **Scene 1.0.1: the iPhone plays it** (agreed) — The owner saw the Traço scene on his Mac but only the plates on his iPhone 14 Plus: the weak-phone check is too strict, and Studio's 1.0.1 console-error fix waits on a request that carries the vendored copy.
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

## Next
- **Connect the contact form** (idea) — the home's form (name, e-mail or phone, message, estimate) validates and stops; connecting it through the Gateway sends a visitor's data to us (its LGPD note is already on the form). Until then its done message says the request was not sent.
  Owner's decisions (12/11, via Jarvis) for its privacy page: the Gateway allows https://alyhenr.github.io as the portfolio's origin; the page fills the Gateway's docs/PRIVACY.md blanks with retention "while the lead's agency job is open, deleted at its close; a message that never became a job, or a lead that went nowhere, deleted after 90 days", and the contact e-mail for data requests alyhenr.io@gmail.com, shown on the privacy page only and nowhere else on the site (the `published` check needs that exception).

## Later

## Fixes and chores
- traco-wireframe 1.0.1 (asked of Studio 12/11): no console error on mount (three's computeBoundingSphere NaN); when taken, rebundle, remake the plates, and drop `SCENE_NAN` from `.jarvis/qa.mjs`. Measure `firstFrameMs` on a real mid-range and budget Android: the 50 ms gate may send many phones to the plates.
- Firefox Add-ons: the Alvarás page shows "Firefox Add-ons: em revisão" (disabled) and no store link; fill the button when the listing is approved.
- The Alvarás policy's Contato line shows an e-mail (verbatim from alvaras-pg's PRIVACY.md), the one contact left on the site; changing it means editing PRIVACY.md in the extension's repo first, then this copy, with the date in both.

## History
- 2026-11-12: Build the site: Traço
- 2026-11-12: Design directions, round 2
- 2026-11-12: Design directions
- 2026-11-12: Publish only the site
- 2026-11-12: Adopt into our standard
