# alyhenr.github.io

My site, in Portuguese: sites for small businesses (packages, a live price
estimate, a contact form), the projects I build on my own, and the browser
extensions I publish, along with the privacy policy each one needs.

**Live:** <https://alyhenr.github.io>

Hand-written HTML, CSS and vanilla JS. No framework, no build step, no
dependencies: the site's files are served exactly as committed.

---

## Structure

```
index.html            Início: the stage, the four steps, packages, calculator, contact
projetos.html         Projetos: Jarvis, Alvarás, the Lab, GitHub
plugins/              browser extensions  ← URLs are frozen, see below
404.html              custom not-found page

css/tokens.css        every colour, font and size decision (light and dark)
css/site.css          the components
fonts/                Anybody and Hanken Grotesk, self-hosted
img/plates/           the stage's plates
js/stage.js           the sticky stage, and the mount point for its 3D scene
js/site.js            the calculator and the contact form
js/estimate.js        what the calculator hands the form (pure, tested)
js/flow.js            the live architecture diagrams
vendor/web/prices/    the price catalogue and its quote math (vendored)
```

## Design

"Traço": a dark stage where loose lines become a site on a phone as you
scroll through the four steps, then calm light sections. The design system
is in `DESIGN.md`. Retheme from `css/tokens.css`; nothing else hardcodes a
colour.

## ⚠️ Frozen URLs

These are submitted to the Chrome Web Store and Firefox Add-ons. A moved or
dead policy URL fails review — not just the first one, every future one:

```
/plugins/
/plugins/alvaras/
/plugins/alvaras/privacidade/
```

The policy text is a verbatim copy of `PRIVACY.md` in the extension's own
repo. Restyle it freely; **do not reword it**. Reviewers compare it against
the manifest, and any discrepancy is a rejection. Change both files together
and update the date in both.

These pages carry no script: reviewers and crawlers may not run JavaScript.

## Running it locally

```sh
node .jarvis/serve.mjs 8000
```

Open <http://localhost:8000>. It serves the site the way Pages does, 404
included. (`python3 -m http.server 8000` also works, without the 404 page.)

## Checks

`node .jarvis/qa.mjs` checks every local link, the frozen URLs, the
calculator's quotes against the price rules, that no page shows a phone or
e-mail, and each page in Chromium and WebKit with Playwright. `package.json`
exists only for that; the site itself still has no dependencies.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` stages the
site's files with `.github/stage-site.mjs` (the root `*.html` pages, `css/`,
`js/`, `fonts/`, `img/`, `plugins/` and the vendored price files) and
publishes only those to GitHub Pages.
