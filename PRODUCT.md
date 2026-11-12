# Portfolio — product

Alysson's personal site at alyhenr.github.io: who Alysson is, the browser extensions Alysson publishes (each with its own landing page and the privacy policy the stores require), projects, writing and a way to get in touch.

## Who it's for
- **People arriving from a browser store listing** (mostly Brazilian civil engineers, via the Alvarás extension). They need the extension's page and its privacy policy, in Portuguese, at a fixed address. This is the site's most important job today.
- **Store reviewers and crawlers** (Chrome Web Store, Firefox Add-ons), who read the policy URLs, possibly without JavaScript.
- **Recruiters, clients and peers** looking at Alysson's work and how to reach Alysson.

## What it does today
- **Home** (`/`): a short intro (software engineer, Brazil), status ("Open to interesting projects"), the public email, the Alvarás extension featured, cards to Work, Writing and Contact.
- **Extensions** (`/plugins/`): the list of published extensions, rendered from a registry; a plain list when JavaScript is off.
- **Alvarás — controle de vencimento** (`/plugins/alvaras/`, pt-BR): what the extension does (reads a construction permit's grant date from the municipal WGeo portal and keeps every permit in one list sorted by expiry, CSV export), two screenshots, its privacy summary, and install buttons (Chrome Web Store live; Firefox pending).
- **Its privacy policy** (`/plugins/alvaras/privacidade/`, pt-BR): a verbatim copy of `PRIVACY.md` in the extension's own repo (alvaras-pg). Static HTML, readable without JavaScript. The URL is submitted to the stores and frozen.
- **Work** (`/projects.html`) and **Writing** (`/blog.html`, `/blog/first-post.html`): both still hold template placeholders (project-alpha, project-beta, "Your First Blog Post").
- **Contact** (`/contact.html`): email, GitHub and LinkedIn links, and a message form that isn't connected yet. Its action is the Formspree placeholder, so the page blocks the send and points to the email instead.
- **A custom 404** for any missing address, at any depth.
- **The look**: a 90s desktop (bevelled windows, menu bar, status bar with a clock). Beige is chrome and never a text background; body copy sits on a near-white document surface.
- **The hidden terminal**: `~` (or the `>_` button in the status bar) opens a terminal with `ls`, `cd`, `cat`, `go`, `tree`, `find`, `grep`, `neofetch` and friends over a virtual filesystem of the site. `Esc` closes it.

## Languages
The site is in English. The extension pages and policies are in Portuguese (pt-BR), for Brazilian users.

## Personal data
The site collects nothing today: no analytics, cookies or storage, and the contact form doesn't send. Once the form is connected it will send a visitor's name, email and message to a third party (Formspree), which needs a privacy note under LGPD (see ROADMAP.md).
