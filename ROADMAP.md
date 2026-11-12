# Roadmap — Portfolio

## Now
- **Adopt into our standard** (ready) — Portfolio came in with its history; our docs, rules and QA come from what its code really is.
  Goal: our docs, rules and a real QA, written from what the code really is (the work skill's adopt mode); no product code changes.
  In:
  - PRODUCT.md, ARCHITECTURE.md, AGENTS.md, ROADMAP.md and docs/IDEAS.md from the code; each existing doc (README, AGENTS.md, CLAUDE.md, docs/) folded in, kept or removed, every choice listed.
  - `.jarvis/qa.mjs`: the stack's real checks (install, lint, typecheck, build, the tests it has), writing .qa/qa-report.json; jarvis.json's stack, commands and personal_data (the paths that touch personal data, for the ship's LGPD check) set.
  - A database: a local stack from the repo's schema with seed data, or what's missing said.
  Out: product code changes, deploy integrations, moving secrets; env files are never read and nothing runs against a live service.
  Done when:
  - The docs and the QA describe the real project, and the full QA runs (its failures, if any, listed in Fixes and chores).
  - The summary lists every doc choice and flags the production risks found (live keys in config, a deploy that runs on push to main).
- **Publish only the site** (ready) — The deploy uploads the whole repo root on every push to main, so our docs, roadmap, QA and .jarvis/ would go public on alyhenr.github.io with the next push.
  Goal: the live site serves only the site's own files; everything of ours stays in the repo.
  In: deploy.yml stages the site's files (the pages, css/, js/, plugins/, blog/, 404.html and any asset folder they use) into a folder and uploads that one; the QA checks the staged folder holds what the pages link to and none of our files.
  Out: redesigning anything; the contact form; a custom domain.
  Done when:
  - The staged folder has every page and asset the site links to, and no PRODUCT.md, ROADMAP.md, AGENTS.md, docs/, e2e/, .jarvis/, .qa/ or package.json.
  - /plugins/alvaras/ and /plugins/alvaras/privacidade/ are in it at the same paths (the published plugin's listing links them).
  - The QA covers both lines.
- **Design directions** (ready) — Before any site code, the owner picks a look from live demos: the portfolio becomes his storefront for paid sites for Brazilian small businesses and the home of our products, and the site itself is the proof of craft.
  Goal: the designer draws 3 distinct directions for the new portfolio as live phone-first HTML mockups, so the owner can compare looks and abilities on his iPhone before anything is built. Mockups only, no site code.
  Who it's for and what it does (every direction):
  - pt-BR first, for small-business owners arriving from WhatsApp or Instagram: what he makes, how it works in 4 steps (conversa, proposta, sinal de 50%, entrega), prices shown ("a partir de R$…"), and every call to action a pre-filled WhatsApp message (the web agency's discovery step).
  - "Quanto custa seu site?": a live calculator (pages and features: agendamento, galeria, WhatsApp, domínio…) whose quote card recomputes as you tick, with the timeline; working in the mock, on the web agency's services guide figures if it has them, otherwise placeholder prices clearly marked for the owner to set.
  - A hero slot for a 20-second "como funciona" motion loop (Studio's Remotion promo kit makes it later): in the mock, a storyboard of its key frames or a stand-in, with a still for reduced motion.
  - A space for our products (Pipa first: a page with store links and its privacy policy) and a short secondary English "engineer" page for products and recruiters.
  - No client case studies yet: the slot exists and stays empty until a job is delivered.
  Each direction: a different look named from visual-vocabulary and a different set of techniques from the shelf (web-craft's cinematic landing page, live calculator hero, animated component kits; at most one Studio piece directed as a scene), and says which it used. All light on a budget Android phone over 4G.
  Rules: the published Alvarás plugin's URLs (/plugins/alvaras/ and /plugins/alvaras/privacidade/) stay live in any redesign; the site stays static (GitHub Pages at alyhenr.github.io).
  Out: building the site, the real video, a domain, the contact form, client work.
  Done when:
  - design/directions/ holds 3 directions in the showcase layout (live page, shots, pitch), each naming its look and techniques.
  - Each has the working calculator, the WhatsApp calls to action, the 4 steps, the hero video's storyboard and the products space, in pt-BR.
  - The preview and send pages serve them to the owner's phone.
- **Design directions, round 2** (ready) — Round 1 (Planta, Feira, Cena) read as flat one-prompt pages differing only in style; the owner wants immersive, senior, professional work, with a clear view of where each Studio piece would sit and what it would be, before anything is made.
  Goal: 3 new directions, each built a truly different way, mockups only, so the owner can see the whole site and where its signature pieces go. No Studio requests and no rendered video in this round: each piece is directed, not made.
  The three ways:
  - Cinematic: a scroll-driven WebGL scene is the spine (e.g. lines assembling into a site's wireframe as the 4 steps pass).
  - Film: a 20–30 s motion film (Studio's Remotion promo kit) carries the story; the page's sections are its chapters.
  - System: precise editorial type and live architecture diagrams (web-craft's live data-pipeline dashboard), immersive through interaction, no video; the senior engineer's voice.
  Each Studio piece: a scene direction in design/scenes/<name>.md with its key frames, and in the mock a clearly marked slot at its real size showing a key frame, what it will be, how it moves, its budget and its reduced-motion still. Pieces made with plain page work (CSS, SVG, small scripts) are built for real.
  Content, every direction, pt-BR, for small-business owners:
  - What we make and the 4 steps (conversa, proposta, sinal de 50%, entrega); "O site é seu. Tudo dele é seu."
  - Pacotes prontos (the web agency's catalogue: four tiers, launch-price label "preço de lançamento").
  - The calculator, labelled as an estimate: "É uma estimativa. Conte seu objetivo e fechamos o valor juntos." Its result goes into the contact form.
  - Contact only through a form (name, e-mail or phone, message, the estimate), with a short LGPD note; no WhatsApp number or e-mail shown anywhere.
  - No projects on the home page: a short section linking to a separate Projetos page. The Projetos page is mocked too, with two entries: Jarvis (an engineering company of AI agents on one Mac mini, told through an animated architecture diagram, no code or private details) and the published Alvarás plugin; plus his GitHub and a small "Lab" for deeper engineering topics. No Pipa, Racha, Garantia or other apps.
  - A personal touch: who he is, a senior engineer, in a few honest lines.
  Avoid the one-prompt look: each direction names its look from visual-vocabulary and its techniques from web-craft, and says why it suits a senior engineer selling sites. Light on a budget Android phone over 4G.
  Rules: /plugins/alvaras/ and /plugins/alvaras/privacidade/ stay live; static site on GitHub Pages; round 1 stays in design/directions as history (or is moved aside), round 2 is what the preview shows.
  Out: Studio requests, rendered video, the contact endpoint, a domain, real client work.
  Done when:
  - 3 directions in the showcase layout, each with its home and its Projetos page, naming its look, techniques and why.
  - Each Studio piece has a scene direction with key frames and a marked slot in the mock.
  - The calculator, packages, form and LGPD note work in every direction, with no phone number or e-mail exposed.
  - The preview and send pages serve them.
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
