# Portfolio — architecture

## Stack
Hand-written HTML, CSS and vanilla JavaScript. No framework, no build step at deploy, no runtime dependencies: the committed files are the site. `package.json` holds tooling only: `playwright-core` for the QA, and `three` and `esbuild` (pinned) for the one generated file, the scene's bundle (`js/scene/traco-wireframe.js`), which `tools/bundle-scene.mjs` makes by hand and which is committed.

## Where it runs
GitHub Pages, as a user page (repo `alyhenr/alyhenr.github.io`, served at the domain root).
- `.github/workflows/deploy.yml` runs on **every push to `main`** (and by hand), so a push to main is a production deploy.
- It stages the site with `.github/stage-site.mjs` into `_site/` and uploads only that folder as the Pages artifact. The staged site is every root `*.html` page, `css/`, `js/` (with the scene's bundle), `fonts/`, `img/`, `plugins/`, and the two vendored files the calculator loads (`SITE_FILES`: `vendor/web/prices/prices.json` and `quote.mjs`), all at the same paths, with dotfiles left out.
- Our docs, design mockups, roadmap, QA and tooling stay in the (public) repo and are never served.
- Pages serves `404.html` for any missing path, at any depth, and keeps that path in the address bar.

There is no backend, no database, no API keys and no environment variables. The contact form doesn't send yet: it validates and waits for the "Connect the contact form" item.

## Parts
- **Pages**: one HTML file per page: `index.html` (Início), `projetos.html`, `plugins/index.html`, `plugins/<slug>/index.html`, `plugins/<slug>/privacidade/index.html` and `404.html`.
  - Each page writes out the shared header (nav: Início, Projetos, Extensões) and footer. There is no script-injected chrome, so every page reads without JavaScript.
  - The store pages (the three `plugins/` pages) carry no script at all.
- **Styles**:
  - `css/tokens.css` holds the `@font-face` rules and every colour, type size, space and motion token, light and dark (`prefers-color-scheme`). The stage set is dark in both modes.
  - `css/site.css` holds the components (header, footer, stage, beats, packages, calculator, quote card, form, diagrams, facts, doc).
  - The fonts are self-hosted in `fonts/` (Anybody variable, and Hanken Grotesk variable 400–600, both latin subset, `font-display: swap`). Only Anybody is preloaded.
- **The stage** (`js/stage.js`, a classic script, home only):
  - It turns the scroll through `.spine` into `progress` 0–1, piecewise per beat section. The hero is 0–.15, Conversa .15–.30, Proposta .30–.50, Sinal .50–.72, Entrega .72–.90 and O site é seu .90–1 (the scene's beats start at 0, .30, .50, .72, .90).
  - It swaps the five plates (`img/plates/`, WebP + JPEG, phone and 1280/1920 desktop) at .30/.50/.72/.90 with a 400 ms crossfade, which is also the reduced-motion version, and drives the "Passo N de 4" counter.
  - The plates are Studio's renders of the scene at each beat's still (`vendor/studio/traco-wireframe/plates/`, resized by `tools/plates.sh`), cropped around the scene's own centre so plate and scene line up when they crossfade.
  - Without JS, plate 1 stays and every beat reads.
  - **Studio's scene** (traco-wireframe 1.0.0, `vendor/studio/traco-wireframe/`, directed in `design/scenes/traco-wireframe.md`):
    - It imports `three` by name, so `tools/bundle-scene.mjs` bundles it with three 0.187.0 into `js/scene/traco-wireframe.js` (138 KB gzip; the budget is 140), the module the stage's `data-scene-src` names.
    - Its interface (its README): `mount(host, { progress, reducedMotion, palette, onReady({ firstFrameMs }), onBeat(n), onError(reason) }) → { update(partial), destroy() }`. `palette` is `{ background, vignette, chalk, dim, grid, amber }`, taken from the tokens.
    - The page imports it after `load` and the first contentful paint, when idle, and only with WebGL 2, no reduced motion, no Save-Data and `deviceMemory > 2`; otherwise the script is never fetched.
    - `onReady` fades the plates out (`.stage.is-live`), unless `firstFrameMs` is over 50 ms (destroyed, plates kept). `onBeat` (1–5) drives the counter while the scene is live. `onError`, a failed load, or reduced motion turning on puts the plates back.
    - The scene pauses itself when the tab is hidden or the stage is off screen.
    - `window.TracoStage` exposes `mountScene()`, `refusal()`, `auto` (the page's own mount) and the state (`reason` says why the scene isn't live) for the QA.
- **The calculator and form** (`js/site.js`, a module, home only):
  - It fetches `vendor/web/prices/prices.json` and builds the tier and add-on rows from it.
  - It quotes through `js/estimate.js` (pure; the QA imports it in Node), which calls the agency's `quote()` from `vendor/web/prices/quote.mjs`. The math is the agency's, never ours.
  - "Levar para o contato" and each package's "Quero este" write the estimate line into the form, which validates (`validContact`: an e-mail or a phone with DDD) and stops.
  - Pacotes prontos is static HTML (crawlers, no JS), and the QA compares it with `prices.json`.
- **Diagrams** (`js/flow.js`, Projetos): live SVG architecture diagrams (`[data-flow]`, packets along `path[data-wire]`, a log). They idle off screen, and reduced motion shows a still.
- **Vendored packages** (`vendor/`): `vendor/web/prices/` is the web agency's catalogue (prices 1.1.0); `vendor/studio/traco-wireframe/` is Studio's scene (1.0.0), published only through its bundle and the plates made from it. Neither is edited here: ask the agency or Studio for a change and take the next version.

## Paths
- Links are document-relative: nested pages prefix `../`, `../../`, `../../../`.
- `404.html` is the exception: it uses root-absolute paths only (`/css/…`), because Pages serves it at whatever depth was mistyped. A move to a project page (a path prefix) would break it.
- Module scripts resolve their files from `import.meta.url`.

## Data
- None is stored.
- The content lives in the HTML; the prices live in `vendor/web/prices/prices.json`.
- The privacy policy page is a verbatim copy of `PRIVACY.md` in the extension's own repo (alvaras-pg).

## QA
`node .jarvis/qa.mjs` runs Jarvis's web kit (`.jarvis/web/kit.mjs`). Its steps:
- `npm ci`.
- JS syntax.
- `scene`: the committed bundle is what `tools/bundle-scene.mjs` makes now, and within 140 KB gzip.
- A local link checker over the pages and the scripts' module imports and `new URL(…, import.meta.url)`.
- `tokens`: no colour outside `css/tokens.css`.
- The frozen-URL checks: the store pages exist, have no script, and every page's nav links `/plugins/`.
- `estimate`: the calculator's quotes against the agency's rules for the four tiers and every add-on, and Pacotes prontos against `prices.json`.
- `directions`: the round-2 design mocks' rules. `design/` is never published.
- `published`:
  - It stages the site into `.qa/site` with the deploy's own script and checks that deploy.yml uploads what it staged.
  - It checks the staged folder holds every linked page, asset and frozen URL, and none of our files.
  - It checks that no staged page shows a phone, an e-mail, "sênior" or an app kept off the site. The verbatim policy's own contact line is the one exception.
- Then the HTTP checks (our files 404) and the Playwright flows in `e2e/flows/`, run against `.jarvis/serve.mjs` serving `.qa/site`.
  - `serve.mjs` is a zero-dependency stand-in for GitHub Pages: directory index, `.html` fallback, `404.html` with status 404.
  - The flows run in Chromium and WebKit, at desktop and phone sizes.
  - The production site has no separate dev server, so there is no dev pass.
