# Portfolio — product

Alysson's site at alyhenr.github.io, in pt-BR: his storefront for sites for Brazilian small businesses, and the home of his own projects and the browser extensions he publishes (each with the privacy policy the stores require). The look is **Traço** (DESIGN.md): a dark stage where lines build a site as the visitor scrolls, then calm light sections.

## Who it's for
- **Small-business owners** arriving from WhatsApp or Instagram: what he makes, how it works, what it costs, and a way to ask for a quote.
- **People arriving from a browser store listing** (mostly Brazilian civil engineers, via the Alvarás extension): the extension's page and its privacy policy, at fixed addresses.
- **Store reviewers and crawlers** (Chrome Web Store, Firefox Add-ons), who read the policy URLs, possibly without JavaScript.
- **Peers and recruiters** looking at what he builds (Projetos, GitHub).

## What it does
- **Início** (`/`):
  - "Seu site, traço a traço." on a sticky dark stage. Studio's line scene (traco-wireframe) plays on it as the visitor scrolls: loose chalk lines gather, step by step (Conversa, Proposta, Sinal de 50%, Entrega), into the wireframe of a small-business site on a phone, and scrolling back un-builds it. A "Passo N de 4" counter follows the scene, and it ends on "O site é seu. Tudo dele é seu." (domain, code, hosting and access are the client's).
  - The scene loads after the page shows. Until then, and with reduced motion, without WebGL or on a weak phone, the stage shows Studio's plates of the same scene, one per step.
  - **Pacotes prontos**: the web agency's four tiers (Página única R$ 500, Site institucional R$ 1.200, Site com recursos R$ 2.500, Sistema sob medida from R$ 5.000), each with what it includes, its timeline and "preço de lançamento", plus the terms (15-day warranty, no monthly fee, +30% for urgency, no online stores).
  - **Quanto custa o seu?**: a live calculator that computes on the agency's own quote rules. You pick a tier, extra pages, add-ons and urgency, and see the total, the lines and the timeline, labelled as an estimate.
  - **Quem faz**: "Engenheiro de software. Construo sistemas com agentes de IA.", "sistemas que não podem parar", a reply within 1 business day, and his GitHub.
  - A link to Projetos.
  - **Contact by form only**: name, e-mail or phone, message, and the estimate (filled by the calculator or a package's "Quero este"), with a short LGPD note. No phone number or e-mail is shown anywhere.
- **Projetos** (`/projetos.html`):
  - Jarvis (an engineering company of AI agents on one Mac mini), told through a live architecture diagram.
  - The Alvarás extension, linking to its page and its policy.
  - A small Lab of upcoming engineering notes, with a live diagram of how a change goes live on this site.
  - His GitHub.
- **Extensões** (`/plugins/`): the published extensions. Static, so it reads without JavaScript.
- **Alvarás — controle de vencimento** (`/plugins/alvaras/`):
  - What the extension does (it reads a construction permit's grant date from the municipal WGeo portal and keeps every permit in one list sorted by expiry, with CSV export).
  - Two screenshots, a privacy summary, and the install buttons: Chrome Web Store (live) and Firefox (in review).
- **Its privacy policy** (`/plugins/alvaras/privacidade/`):
  - A verbatim copy of `PRIVACY.md` from the extension's repo (alvaras-pg). Static HTML, with no script.
  - Its URL was submitted to the stores and is frozen.
- **A custom 404** at any depth. The old template's addresses (`/projects.html`, `/contact.html`, `/blog…`) send visitors to the new pages.
- **Light and dark**: the light sections follow the phone's mode; the stage is always dark.

## Languages
pt-BR throughout.

## Personal data
- The site collects nothing today: no analytics, cookies or storage, and the contact form validates but does not send.
- The form will send a visitor's name, contact, message and estimate once "Connect the contact form" lands. The LGPD note is already on the form.
- The Alvarás policy's Contato section shows an e-mail address, because the policy is verbatim from the extension's repo.
