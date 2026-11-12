# Map — where things are

## Pages (published by `.github/stage-site.mjs`: root `*.html`, `css/`, `js/`, `plugins/`, `blog/`)
| Path | Page |
|---|---|
| `index.html` | Home: intro, featured extension, cards to the other sections |
| `projects.html` | Work (template placeholders: project-alpha, project-beta) |
| `blog.html`, `blog/first-post.html` | Writing index and its one (placeholder) post |
| `contact.html` | Email, GitHub, LinkedIn; the unconnected form and its inline submit guard |
| `plugins/index.html` | Extensions list, rendered from `js/plugins.js` by an inline script; `<noscript>` fallback list |
| `plugins/alvaras/index.html` | Alvarás landing page (pt-BR), screenshots in `plugins/alvaras/img/` |
| `plugins/alvaras/privacidade/index.html` | Alvarás privacy policy (pt-BR, verbatim from alvaras-pg's PRIVACY.md), frozen URL |
| `404.html` | Custom not-found page, root-absolute paths, shows the requested path |

## Styles
- `css/tokens.css`: every colour, font, size, spacing, bevel and shadow token.
- `css/components.css`: components (`.window`, `.menubar`, `.statusbar`, `.card`, `.kv-row`, `.tag`, `.btn`, `.notice`, `.field`, `.shot`, `.doc`, `.terminal-overlay`, terminal output classes); responsive rules at `max-width: 640px`; reduced-motion rules.

## Scripts
- `js/chrome.js`: menu bar (`NAV_ITEMS`, frozen hrefs), status bar, terminal overlay and its keys; `window.chrome` API.
- `js/terminal.js`: command engine and every command (`help`, `ls`, `cd`, `tree`, `cat`, `find`, `go`/`open`, `grep`, `neofetch`, …); `window.Terminal` (`init`, `register`, `print`, …).
- `js/filesystem.js`: the virtual filesystem (`nodes`: path → `{type, href, size, date, desc}`; `contents`: what `cat` prints); `window.FS`.
- `js/plugins.js`: the extension registry (`window.PLUGINS`), status and store labels.

## Deploy
- `.github/workflows/deploy.yml`: GitHub Pages, on push to `main` and by hand; stages the site into `_site/` and uploads that.
- `.github/stage-site.mjs`: what the site is (root `*.html` pages and `SITE_DIRS`); copies it, dotfiles left out. The QA imports it too.

## Design (ours, never published)
- `design/directions/NN-<slug>/`: round 2 of the look options (`01-traco` cinematic, `02-roteiro` film, `03-esquema` system), in the showcase layout Core serves to the owner's phone: `index.html` (the home, `data-shot` sections), `projetos.html` (the Projetos page), `style.css` (tokens light/dark), `pitch.md` (pt-BR pitch, then look, techniques, pieces and notes), `shots/` (`shots.mjs --sections design/directions` makes the home's; the `-p-` ones are the Projetos page's, numbered after them), `scene/` (the Studio slot's key frames as JPEGs).
  - `site.js` and `flow.js` are one file copied into each direction (the QA's `directions` step checks they match): `site.js` holds the provisional `CATALOGUE` (packages, per-page and per-feature figures, the "preço de lançamento" flag), the estimate, the calculator → contact form wiring and the form's validation (it never sends); `flow.js` animates the live SVG diagrams (`[data-flow]`, packets along `path[data-wire]`). The Jarvis diagram is the same SVG in the three Projetos pages.
  - The `links` check covers these pages too, so a link must resolve locally or be absolute; the extension's URLs are linked absolute (alyhenr.github.io).
- `design/scenes/<name>.md` and `design/scenes/<name>/frames/`: scene directions for Studio pieces (`traco-wireframe`, `roteiro-filme`), directed, not requested; key frames drawn as HTML/SVG (`frames/*.html`, `draw.js`/`frame.css`) and shot to PNG.
- `design/tools/shots-projetos.mjs`: shoots the Projetos pages' `data-shot` sections into each direction's `shots/` (run after `shots.mjs`, which deletes them).
- `design/history/round-1/`: round 1 (Planta, Feira, Cena), kept as history; not served by the preview.

## QA (ours)
- `.jarvis/qa.mjs`: the QA (steps `install`, `syntax`, `links`, `frozen-urls`, `published`, `directions`; HTTP checks; flows, served from `.qa/site`). `directions` checks the design mocks (the brief's copy, the form, no exposed phone or e-mail, a scene direction behind every `data-studio` slot, identical shared scripts) and unit-tests `site.js`'s estimate.
- `.jarvis/serve.mjs`: local GitHub Pages stand-in (`[port] [root]`; root defaults to the repo).
- `.jarvis/web/kit.mjs`: Jarvis's web QA kit (Jarvis-owned; never edit, re-apply the pack).
- `e2e/flows/*.flow.mjs`: `home`, `pages`, `extensions`, `privacy-policy-without-js`, `contact`, `terminal`, `not-found`.
- `package.json`, `package-lock.json`: pin `playwright-core` for the QA only.
