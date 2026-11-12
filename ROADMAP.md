# Roadmap — Portfolio

## Now
- **Build the site: Traço** (ready) — The owner picked Traço from round 2 (12/11): the new portfolio becomes his storefront for small-business sites and the home of his projects, with Studio's line scene as the proof of craft.
  Goal: the real static site in the Traço direction, replacing the old template, live-ready on GitHub Pages, with the stage working on its plates until Studio's scene is mounted.
  In:
  - Finalize first: the designer (finalize mode) turns 01-traco into DESIGN.md and final mockups, with the owner's changes below.
  - Owner's changes: the Projetos page uses Esquema's live architecture diagrams (from 03-esquema) for Jarvis and the Lab; the home stays Traço's. The lines about him keep "sistemas que não podem parar" and "até 1 dia útil" but never "sênior": he is "engenheiro de software", with an AI line (wording below, the owner confirms in the demo).
  - Home: the sticky stage with the plates swapped per beat and the step progress, "O site é seu. Tudo dele é seu.", Pacotes prontos with "preço de lançamento", the calculator (labelled as an estimate) feeding the form, who he is, contact by form only with the short LGPD note; no phone number or e-mail anywhere.
  - Prices from the web agency's catalogue prices 1.1.0 (delivery d-82f2f6ac into vendor/web/prices; ignore 1.0.0, c7dfffce5858, the old rule): the form is a plain add-on.
  - Projetos page: Jarvis (Esquema-style live diagram, no code or private details) and the Alvarás plugin, his GitHub, a small Lab. No Pipa, Racha, Garantia or other apps.
  - The stage's mount point and interface exactly as design/scenes/traco-wireframe.md says (progress, reducedMotion, palette; ready and beat events), so Studio's package (requested 12/11, run 6705) drops in; if it has arrived, mount it.
  - The old template pages (projects.html, blog placeholders, js/filesystem.js) removed or replaced; /plugins/alvaras/ and /plugins/alvaras/privacidade/ stay live at the same paths; deploy still publishes only the site.
  Out: sending the form (it validates and waits for the Gateway: \"Connect the contact form\"), a domain, the showcase-cards feed (Projetos is hand-written until Jarvis's item lands), client case studies.
  Done when:
  - Every page in the Traço look on a 390 px phone and desktop, light on a budget Android over 4G (Lighthouse mobile performance ≥ 90 with the plates).
  - The calculator's quotes match the agency's quote rules for the four tiers and the add-ons (tests).
  - No phone number or e-mail in the built site; the Alvarás URLs and the staged-folder checks still pass (QA).
  - The stage works with plates, with reduced motion and without JS, and exposes the scene interface for Studio's package.
  - A demo (stills and a short scroll video) for the owner's phone.
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

## Next
- **Connect the contact form** (idea) — the home's form (name, e-mail or phone, message, estimate) validates and stops; connecting it through the Gateway sends a visitor's data to us (its LGPD note is already on the form). Until then its done message says the request was not sent.
  Owner's decisions (12/11, via Jarvis) for its privacy page: the Gateway allows https://alyhenr.github.io as the portfolio's origin; the page fills the Gateway's docs/PRIVACY.md blanks with retention "while the lead's agency job is open, deleted at its close; a message that never became a job, or a lead that went nowhere, deleted after 90 days", and the contact e-mail for data requests alyhenr.io@gmail.com, shown on the privacy page only and nowhere else on the site (the `published` check needs that exception).

## Later

## Fixes and chores
- traco-wireframe 1.0.1 (asked of Studio 12/11): no console error on mount (three's computeBoundingSphere NaN); when taken, rebundle, remake the plates, and drop `SCENE_NAN` from `.jarvis/qa.mjs`. Measure `firstFrameMs` on a real mid-range and budget Android: the 50 ms gate may send many phones to the plates.
- Firefox Add-ons: the Alvarás page shows "Firefox Add-ons: em revisão" (disabled) and no store link; fill the button when the listing is approved.
- The Alvarás policy's Contato line shows an e-mail (verbatim from alvaras-pg's PRIVACY.md), the one contact left on the site; changing it means editing PRIVACY.md in the extension's repo first, then this copy, with the date in both.

## History
- 2026-11-12: Design directions, round 2
- 2026-11-12: Design directions
- 2026-11-12: Publish only the site
- 2026-11-12: Adopt into our standard
