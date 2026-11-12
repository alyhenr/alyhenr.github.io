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

## Next
- **Connect the contact form** (idea) — the form's action is still the Formspree placeholder (contact.html); connecting it sends visitors' name, email and message to a third party, which needs a short privacy note on the page (LGPD).
- **Real Work and Writing content** (idea) — projects.html (project-alpha, project-beta, "Replace this with your actual project description", `href="#"` buttons) and blog.html / blog/first-post.html ("Your First Blog Post") are template placeholders live on the site; js/filesystem.js mirrors them.

## Later

## Fixes and chores
- js/plugins.js: Alvarás has `status: 'published'`, which isn't a key of STATUS_LABELS (`live`, `review`, `unpublished`), so its card on /plugins/ shows an unstyled lowercase "published"; set it to `live`.
- js/plugins.js: `stores.chrome` is still `null` with a TODO though the Chrome Web Store listing is live; fill it with the listing's canonical URL.
- plugins/alvaras/index.html, Instalação: the notice still says the extension isn't published in the stores (with typos: "serao disponibilzados"), while the button says "Chrome Web Store — Publicado"; that button keeps `btn--pending` and `aria-disabled="true"` though it's a working link, and its URL carries account parameters (`authuser=2`, `pli=1`) from a signed-in session.
- Firefox Add-ons: the button and `stores.firefox` are pending; fill them when the listing is approved.
- js/chrome.js: comments still describe the removed game pages (`terminal: false`); `chrome.setCwd()` looks up `#chrome-cwd`, which no page has.

## History
