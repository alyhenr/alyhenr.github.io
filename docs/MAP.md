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

## QA (ours)
- `.jarvis/qa.mjs`: the QA (steps `install`, `syntax`, `links`, `frozen-urls`, `published`; HTTP checks; flows, served from `.qa/site`).
- `.jarvis/serve.mjs`: local GitHub Pages stand-in (`[port] [root]`; root defaults to the repo).
- `.jarvis/web/kit.mjs`: Jarvis's web QA kit (Jarvis-owned; never edit, re-apply the pack).
- `e2e/flows/*.flow.mjs`: `home`, `pages`, `extensions`, `privacy-policy-without-js`, `contact`, `terminal`, `not-found`.
- `package.json`, `package-lock.json`: pin `playwright-core` for the QA only.
