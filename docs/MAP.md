# Map — where things are

## Pages (published by `.github/stage-site.mjs`: root `*.html`, `css/`, `js/`, `fonts/`, `img/`, `plugins/`, and `SITE_FILES` from `vendor/`)
| Path | Page |
|---|---|
| `index.html` | Início: the spine (sticky `.stage` with plates, `data-scene-src`, `data-beat` 0–5 sections), Pacotes prontos (static, matches prices.json), calculator (`[data-calc]`), Quem faz, Projetos teaser, contact form (`[data-contact]`) |
| `projetos.html` | Projetos: Jarvis and Lab (live diagrams), Alvarás, GitHub |
| `plugins/index.html` | Extensões: the static extension list, frozen URL |
| `plugins/alvaras/index.html` | Alvarás landing page, screenshots in `plugins/alvaras/img/` (WebP), frozen URL |
| `plugins/alvaras/privacidade/index.html` | Alvarás privacy policy (verbatim from alvaras-pg's PRIVACY.md, inside `article.doc`), frozen URL |
| `404.html` | Not-found page, root-absolute paths; its inline script shows the path and moves the old template URLs |

Every page writes out the same header (`.site-head`, nav `aria-label="Site"`) and footer (`.site-foot`); change one, change all six.

## Styles, fonts, images
- `css/tokens.css`: `@font-face` and every colour, type, space and motion token (light, dark, the stage set).
- `css/site.css`: the components (DESIGN.md lists them).
- `fonts/`: Anybody and Hanken Grotesk, latin woff2.
- `img/plates/`: the stage's four plates (`phone-0N`, `desktop-0N-1280`, `-1920`; WebP and JPEG). `img/favicon.svg`.

## Scripts
- `js/stage.js`: the stage (progress, plates, counter) and the Studio scene mount (`window.TracoStage`); the contract is in its header.
- `js/site.js` (module): calculator rows from prices.json, the quote card, estimate → form, form validation.
- `js/estimate.js` (module, pure): `quoteFor`, `calcSummary`, `packageSummary`, `validContact`, over the agency's `quote()`.
- `js/flow.js`: the live diagrams on Projetos.

## Vendored (`vendor/`, never edited here)
- `vendor/web/prices/`: the web agency's catalogue, prices 1.1.0 (`prices.json`, `quote.mjs`, README, CHANGELOG). Only `prices.json` and `quote.mjs` are published.
- Studio's traco-wireframe will land in `vendor/studio/…`: set the stage's `data-scene-src` to its module and add its files to `SITE_FILES`.

## Deploy
- `.github/workflows/deploy.yml`: GitHub Pages, on push to `main` and by hand; stages the site into `_site/` and uploads that.
- `.github/stage-site.mjs`: what the site is (root `*.html` pages, `SITE_DIRS`, `SITE_FILES`); copies it, dotfiles left out. The QA imports it too.

## Design (ours, never published)
- `DESIGN.md` (root): the Traço design system, page by page; `design/final/`: its final mockups (`index.html`, `projetos.html`, `alvaras.html`, `privacidade.html`, dark variants, `style.css`, `stage.js`, `shots/`; remake the shots with `node design/tools/shots-final.mjs`).
- `design/directions/NN-<slug>/`: round 2 of the look options (`01-traco` cinematic, `02-roteiro` film, `03-esquema` system), in the showcase layout Core serves to the owner's phone: `index.html` (the home, `data-shot` sections), `projetos.html` (the Projetos page), `style.css` (tokens light/dark), `pitch.md` (pt-BR pitch, then look, techniques, pieces and notes), `shots/` (`shots.mjs --sections design/directions` makes the home's; the `-p-` ones are the Projetos page's, numbered after them), `scene/` (the Studio slot's key frames as JPEGs).
  - `site.js` and `flow.js` are one file copied into each direction (the QA's `directions` step checks they match): `site.js` holds the provisional `CATALOGUE` (packages, per-page and per-feature figures, the "preço de lançamento" flag), the estimate, the calculator → contact form wiring and the form's validation (it never sends); `flow.js` animates the live SVG diagrams (`[data-flow]`, packets along `path[data-wire]`). The Jarvis diagram is the same SVG in the three Projetos pages.
  - The `links` check covers these pages too, so a link must resolve locally or be absolute; the extension's URLs are linked absolute (alyhenr.github.io).
- `design/scenes/<name>.md` and `design/scenes/<name>/frames/`: scene directions for Studio pieces (`traco-wireframe`, `roteiro-filme`), directed, not requested; key frames drawn as HTML/SVG (`frames/*.html`, `draw.js`/`frame.css`) and shot to PNG.
- `design/tools/shots-projetos.mjs`: shoots the Projetos pages' `data-shot` sections into each direction's `shots/` (run after `shots.mjs`, which deletes them).
- `design/history/round-1/`: round 1 (Planta, Feira, Cena), kept as history; not served by the preview.

## QA (ours)
- `.jarvis/qa.mjs`: the QA (steps `install`, `syntax`, `links`, `tokens`, `frozen-urls`, `published`, `directions`, `estimate`; HTTP checks; flows, served from `.qa/site`). `estimate` holds the calculator's unit tests (figures worked out by hand from the agency's rules); `published` also scans the staged site for phones, e-mails, "sênior" and apps kept off it.
- `.jarvis/serve.mjs`: local GitHub Pages stand-in (`[port] [root]`; root defaults to the repo).
- `.jarvis/web/kit.mjs`: Jarvis's web QA kit (Jarvis-owned; never edit, re-apply the pack).
- `e2e/flows/*.flow.mjs`: `home`, `calculator`, `contact`, `projetos`, `pages`, `extensions`, `privacy-policy-without-js`, `not-found`, `stage-reduced-motion`, `stage-without-js`, `stage-scene` (a stand-in module plays Studio's scene through the interface); `_lib.mjs` holds their helpers.
- `package.json`, `package-lock.json`: pin `playwright-core` for the QA only.
