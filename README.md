# alyhenr.github.io

My personal site — projects, writing, and the browser extensions I publish,
along with the privacy policy each one needs.

**Live:** <https://alyhenr.github.io>

Hand-written HTML, CSS and vanilla JS. No framework, no build step, no
dependencies: what is committed is exactly what is served.

---

## Structure

```
index.html            landing page
projects.html         portfolio
blog.html  blog/      writing
contact.html          email + message form
plugins/              browser extensions  ← URLs are frozen, see below
404.html              custom not-found page

css/tokens.css        every colour, size and spacing decision
css/components.css    the component library
js/chrome.js          menu bar, status bar, terminal overlay
js/plugins.js         extension registry (data)
js/filesystem.js      virtual filesystem for the terminal
js/terminal.js        the terminal itself
```

## Design

A 90s desktop: bevelled windows, a menu bar, chunky buttons.

The rule that holds it together is that **beige is chrome, never a text
background** — body copy sits on the near-white `--color-doc` surface inside
a window, the way a System 7 document area did. That is what keeps text at
13.9:1 instead of a muddy ink-on-beige. Accent colour follows from it: fine
on the document surface, but on beige it has to be white-on-accent.

Retheme the whole site from `css/tokens.css`; nothing else hardcodes a colour.

## The terminal

The site used to be a terminal. It still is, tucked away — press `~` or the
`>_` button in the status bar, `Esc` to close. `ls`, `cd`, `cat`, `go` and
friends all work against the virtual filesystem in `js/filesystem.js`.

## ⚠️ Frozen URLs

These are submitted to the Chrome Web Store and Firefox Add-ons. A moved or
dead policy URL fails review — not just the first one, every future one:

```
/plugins/alvaras/
/plugins/alvaras/privacidade/
```

The policy text is a verbatim copy of `PRIVACY.md` in the extension's own
repo. Restyle it freely; **do not reword it**. Reviewers compare it against
the manifest, and any discrepancy is a rejection. Change both files together
and update the date in both.

It must also stay readable with JavaScript disabled — reviewers and crawlers
may not run scripts, so no part of the policy can depend on JS.

## Adding things

**An extension** — append an entry to `PLUGINS` in `js/plugins.js`, then add
`plugins/<slug>/index.html` and `plugins/<slug>/privacidade/index.html`.
The index page renders itself from that data, so it needs no edit. Give each
extension its own policy; a shared generic one is a common rejection reason.

**A post** — add `blog/<slug>.html`, then a card in `blog.html`.

**A project** — copy a `<section class="window">` block in `projects.html`.

Register new pages in `js/filesystem.js` so the terminal can find them too.

## Running it locally

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Opening the files directly over `file://` will
not work properly — a directory URL lists the folder instead of loading its
`index.html`.

Note that `404.html` is only exercised by a real server that routes misses to
it; `http.server` shows its own plain 404 instead.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` publishes the
repository root to GitHub Pages as-is.
