# Portfolio — architecture

## Stack
Hand-written HTML, CSS and vanilla JavaScript. No framework, no bundler, no build step, no runtime dependencies: the committed files are the site. `package.json` exists only for the QA (it pins `playwright-core`) and nothing the site loads comes from it.

## Where it runs
GitHub Pages, as a user page (repo `alyhenr/alyhenr.github.io`, served at the domain root). `.github/workflows/deploy.yml` runs on **every push to `main`** (and by hand) and uploads the **whole repository root** (`path: '.'`; `upload-pages-artifact` leaves out only `.git` and `.github`) as the Pages artifact. A push to main is a production deploy. Pages serves `404.html` for any missing path, at any depth, keeping that path in the address bar.

No backend, no database, no API keys, no environment variables. The only outside service referenced is Formspree, as an unfilled placeholder in the contact form's `action`.

## Parts
- **Pages**: one HTML file per page (`index.html`, `projects.html`, `blog.html`, `blog/<slug>.html`, `contact.html`, `plugins/index.html`, `plugins/<slug>/index.html`, `plugins/<slug>/privacidade/index.html`, `404.html`). Each holds only its own content in `<section class="window">` blocks.
- **Styles**: `css/tokens.css` holds every colour, size and spacing value (retheme from there only); `css/components.css` is the component library (window, menubar, statusbar, card, kv-row, tag, btn, notice, field, shot, doc, terminal overlay).
- **Shared chrome** (`js/chrome.js`): injected at the end of `<body>` on every page. Builds the menu bar (its nav hrefs are frozen), the status bar (clock, uptime, `>_` button) and the terminal overlay, and wires `~`/`` ` ``/`Esc`. Configured per page by `window.CHROME_CONFIG` (`activePage`, `basePath`). It injects synchronously so the overlay exists before `Terminal.init()` runs; moving it to `<head>` or adding `defer` breaks the terminal.
- **Terminal** (`js/terminal.js` + `js/filesystem.js`): the command engine (history, tab completion, typing animation) over a virtual path tree (`FS.nodes`, `FS.contents`). `go`/`cd` navigate to a node's `href`, prefixed by `basePath`.
- **Extension registry** (`js/plugins.js`): `window.PLUGINS`, the data `plugins/index.html` renders its cards from (name, tagline, status, browsers, page and policy paths, store URLs).

## Paths
Links are document-relative, so nested pages pass `basePath` (`'../'`, `'../../'`) to `CHROME_CONFIG` and `Terminal.init`. `404.html` is the exception: it uses root-absolute paths only (`/css/…`, `/js/…`, `basePath: '/'`), because Pages serves it at whatever depth was mistyped. A move to a project page (a path prefix) would break both.

## Data
None stored. Content lives in the HTML, `js/filesystem.js` (terminal file contents) and `js/plugins.js`. The privacy policy page is a verbatim copy of `PRIVACY.md` in the extension's own repo (alvaras-pg).

## QA
`node .jarvis/qa.mjs` (Jarvis's web kit, `.jarvis/web/kit.mjs`): `npm ci`, JS syntax, a local link checker over pages and registries, the frozen-URL checks, then HTTP checks and the Playwright flows in `e2e/flows/` against `.jarvis/serve.mjs`, a zero-dependency stand-in for GitHub Pages (directory index, `.html` fallback, `404.html` with status 404), in Chromium and WebKit at desktop and phone sizes. There is no dev server distinct from production, so there is no dev pass.
