# Portfolio — agent rules

Alysson's site on GitHub Pages, in pt-BR, in the Traço look (DESIGN.md): static HTML, CSS and vanilla JS, no build. PRODUCT.md says what it is, ARCHITECTURE.md how it's built, docs/MAP.md where things are, README.md is the public repo readme (kept, accurate).

## Commands
- `node .jarvis/qa.mjs`: the full QA (install, syntax, links, tokens, frozen-urls, published, directions, estimate, HTTP checks, Playwright flows in Chromium and WebKit, desktop and phone). Writes `.qa/qa-report.json`.
- `node .jarvis/qa.mjs syntax links tokens frozen-urls published`: the quick static checks (the project's lint); `published` stages the site into `.qa/site` the way the deploy does and checks it (and that it shows no phone, e-mail or "sênior").
- `node .jarvis/qa.mjs estimate`: the calculator's unit tests against the agency's quote rules. `directions`: the round-2 design mocks' rules.
- `node .jarvis/qa.mjs flows` or `node .jarvis/qa.mjs <flow>` (e.g. `contact`): browser flows only.
- `node .jarvis/serve.mjs 8000`: the site locally the way Pages serves it (the README's `python3 -m http.server` also works, but has no 404 page).
- First run on a machine: `npx playwright-core@1.53.2 install chromium webkit`.

## Rules
- **Every push to `main` deploys to production** (`.github/workflows/deploy.yml`), and publishes only what `.github/stage-site.mjs` stages: every root `*.html` page plus `css/`, `js/`, `fonts/`, `img/`, `plugins/` and the vendored files in `SITE_FILES`. Our files stay out, and the QA's `published` step checks it. The repo itself is public, so nothing secret or private goes in it, ever.
- **Frozen URLs**: `/plugins/`, `/plugins/alvaras/` and `/plugins/alvaras/privacidade/` are submitted to the Chrome Web Store and Firefox Add-ons. Never move or delete them, and every page's header nav keeps its link to `/plugins/`. The `frozen-urls` check guards this.
- **Privacy policies are verbatim**: `plugins/<slug>/privacidade/index.html` copies `PRIVACY.md` from the extension's repo word for word. Restyle freely; never reword. A change goes in both files together, with the "Última atualização" date updated in both. Each extension has its own policy (a shared generic one is a rejection reason).
- **Policies and extension pages work without JavaScript**: the three `plugins/` pages carry no `<script>` at all (reviewers and crawlers may not run JS). `frozen-urls` and the `privacy-policy-without-js` flow check it.
- **Contact is the form only**: no phone number, e-mail or WhatsApp link on any page, and never the word "sênior" (he is "engenheiro de software"). The one exception is the verbatim policy's own Contato line. `published` checks it.
- **Prices come from the agency**: `vendor/web/prices/` is never edited here. The calculator's math is its `quote()`, and Pacotes prontos in `index.html` must match `prices.json` (`estimate` checks it). A new catalogue version is taken from the delivery hub and replaces the folder.
- **Studio pieces are Studio's** (DESIGN.md, "Studio pieces"): never build, imitate or edit the traco-wireframe scene (`vendor/studio/traco-wireframe/`, as delivered); a change goes back to Studio as a new version. A new version replaces the folder, then `node tools/bundle-scene.mjs` rebuilds `js/scene/traco-wireframe.js` (never edited by hand) and `sh tools/plates.sh` remakes `img/plates/` from its plates.
- **Colours and sizes only from `css/tokens.css`**; nothing else hardcodes a colour (`tokens` checks stylesheets and style attributes).
- **`404.html` uses root-absolute paths only**; every other page uses relative paths for its depth.
- **No dependencies in the site**: `package.json` is tooling only (playwright-core for the QA; three and esbuild, pinned, for the scene's committed bundle). Don't add a framework or build step without a roadmap item.
- **Never let a test send the contact form anywhere**: the `contact` flow aborts every request off the local server.
- The site is in pt-BR.

## Adding things
- **An extension**: `plugins/<slug>/index.html` and `plugins/<slug>/privacidade/index.html` (no scripts), an item in the list in `plugins/index.html`, and both paths in the `FROZEN` list of `.jarvis/qa.mjs` once submitted to a store.
- **A project**: a `<section class="section">` in `projetos.html` (a live diagram is a `[data-flow]` block; see `js/flow.js`).
- **A page**: copy the header and footer from a page at the same depth, and add it to the `PAGES` list in `e2e/flows/pages.flow.mjs`. A page at the root is published by itself; a new top-level folder the site uses goes in `SITE_DIRS` in `.github/stage-site.mjs` (and a single vendored file in `SITE_FILES`), or it never goes live (`published` fails on its links).

## Gotchas
- The HTTP checks and flows run against `.qa/site` (the staged site), not the repo root: a file the staging leaves out 404s there, as it would live.
- Playwright's text and role locators skip `<noscript>` content: use CSS locators there.
- The `links` check reads the pages' `href`/`src` and the scripts' `import`s and `new URL('…', import.meta.url)`, relative to each file.
- The header and footer are written out in each of the six pages (no injected chrome): a nav change is six edits.
- The stage drops the scene when its `firstFrameMs` is over 50 ms; a fresh headless browser often is (a cold GPU process), so `stage-live` re-mounts with `slowFrameMs` when the page's own mount fell back for that reason. Any other reason fails it.
- The QA allows one console line from the scene 1.0.0 (`SCENE_NAN` in `.jarvis/qa.mjs`, three's computeBoundingSphere NaN); drop it when Studio's 1.0.1 is taken. `published` doesn't scan the minified bundle for phone numbers (three's constants match).
- `scene` (QA step) fails when `js/scene/traco-wireframe.js` isn't what `tools/bundle-scene.mjs` makes, or is over 140 KB gzip: rebundle after `npm ci` (three or the package changed).
- The design mocks' `site.js` and `flow.js` are one file copied into each `design/directions/NN-*/`: change one, copy it to all (the `directions` step fails otherwise). Their shots: `shots.mjs --sections design/directions` for the homes, which deletes the Projetos pages' `-p-` shots, so remake those after it with `node design/tools/shots-projetos.mjs <dirs>`.
- Commit format: a short subject, a blank line, the why.
