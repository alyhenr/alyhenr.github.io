# Portfolio — agent rules

Alysson's personal site on GitHub Pages: static HTML, CSS and vanilla JS, no build. PRODUCT.md says what it is, ARCHITECTURE.md how it's built, docs/MAP.md where things are, README.md is the public repo readme (kept, accurate).

## Commands
- `node .jarvis/qa.mjs`: the full QA (install, syntax, links, frozen-urls, HTTP checks, Playwright flows in Chromium and WebKit, desktop and phone). Writes `.qa/qa-report.json`.
- `node .jarvis/qa.mjs syntax links frozen-urls`: the quick static checks (the project's lint).
- `node .jarvis/qa.mjs flows` or `node .jarvis/qa.mjs <flow>` (e.g. `contact`): browser flows only.
- `node .jarvis/serve.mjs 8000`: the site locally the way Pages serves it (the README's `python3 -m http.server` also works, but has no 404 page).
- First run on a machine: `npx playwright-core@1.53.2 install chromium webkit`.

## Rules
- **Every push to `main` deploys to production** (`.github/workflows/deploy.yml`), and it publishes the whole repo root, our docs included. Nothing secret or private goes in the repo, ever.
- **Frozen URLs**: `/plugins/`, `/plugins/alvaras/` and `/plugins/alvaras/privacidade/` are submitted to the Chrome Web Store and Firefox Add-ons. Never move or delete them, and never change the nav hrefs in `js/chrome.js` (labels may change). The `frozen-urls` check guards this.
- **Privacy policies are verbatim**: `plugins/<slug>/privacidade/index.html` copies `PRIVACY.md` from the extension's repo word for word. Restyle freely; never reword. A change goes in both files together, with the "Última atualização" date updated in both. Each extension has its own policy (a shared generic one is a rejection reason).
- **Policies and extension pages work without JavaScript**: no content may depend on a script (reviewers and crawlers may not run JS). The `privacy-policy-without-js` flow checks it.
- **Colours and sizes only from `css/tokens.css`**; nothing else hardcodes a colour. Beige is chrome, never a text background: body copy sits on `--color-doc` inside a window.
- **`404.html` uses root-absolute paths only**; every other page uses relative paths plus `basePath` for its depth.
- **`js/chrome.js` stays at the end of `<body>`, without `defer`**, before the inline `Terminal.init()`.
- **No dependencies in the site**: `package.json` is QA tooling only (playwright-core). Don't add a framework or build step without a roadmap item.
- **Never let a test post the contact form to Formspree** (a live service): the `contact` flow blocks it.
- The site is in English; extension pages and policies in pt-BR.

## Adding things
- **An extension**: an entry in `PLUGINS` in `js/plugins.js` (status is one of `live`, `review`, `unpublished`), then `plugins/<slug>/index.html` and `plugins/<slug>/privacidade/index.html`, the `<noscript>` list in `plugins/index.html`, and both paths in `js/filesystem.js`.
- **A post**: `blog/<slug>.html` (copy `blog/first-post.html`), a card in `blog.html`, a node in `js/filesystem.js`.
- **A project**: copy a `<section class="window">` block in `projects.html`, and a node in `js/filesystem.js`.
- A new page: add it to the `PAGES` list in `e2e/flows/pages.flow.mjs`.

## Gotchas
- Playwright's text and role locators skip `<noscript>` content: use CSS locators there.
- The `links` check reads `href:` strings in `js/chrome.js` and `js/filesystem.js` (relative to the root) and `href:`/`privacy:` in `js/plugins.js` (relative to `plugins/`).
- Commit format: a short subject, a blank line, the why.
