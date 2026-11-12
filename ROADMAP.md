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

## Next
- **Publish only the site** (idea) — the deploy uploads the whole repo root, so PRODUCT.md, ROADMAP.md, AGENTS.md, docs/, e2e/, .jarvis/ and package.json are public on the live site; stage only the site's files (pages, css/, js/, plugins/, blog/, 404.html) in deploy.yml.
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
