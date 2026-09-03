/**
 * plugins.js — Browser extension registry
 *
 * Single source of truth for /plugins. The index page renders its listing
 * straight from this array, so publishing a new extension is a data edit
 * here plus the extension's own landing + privacy pages — never a copy of
 * the index markup.
 *
 * ── Adding an extension ────────────────────────────────────
 *
 *   1. Append an entry to PLUGINS (below)
 *   2. Create plugins/<slug>/index.html          — landing page
 *   3. Create plugins/<slug>/privacidade/index.html — privacy policy
 *      (stores require a policy specific to that extension; a shared
 *       generic page is a common rejection reason)
 *   4. Register both paths in js/filesystem.js so the terminal knows them
 *
 * Entry shape:
 *   slug     — directory name under plugins/, and the URL segment
 *   name     — display name
 *   tagline  — one line, in the extension's own language
 *   status   — 'live' | 'review' | 'unpublished'
 *   date     — 'YYYY-MM', shown in the ls-style listing
 *   size     — display string for the ls-style listing
 *   browsers — array of supported browser names
 *   privacy  — path to the policy, relative to plugins/
 *   stores   — { chrome, firefox, edge, ... } — null means NOT PUBLISHED YET.
 *              Leave null rather than guessing a URL; the index renders a
 *              visible placeholder so an unfilled link cannot ship silently.
 *
 * ──────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const PLUGINS = [
    {
      slug:     'alvaras',
      name:     'Alvarás — controle de vencimento',
      tagline:  'Escaneie a página do processo e acompanhe o vencimento dos seus ' +
                'alvarás de construção em um só lugar.',
      status:   'unpublished',
      date:     '2026-07',
      size:     '46kb',
      browsers: ['Chrome', 'Brave', 'Edge', 'Opera', 'Firefox'],
      href:     'alvaras/index.html',
      privacy:  'alvaras/privacidade/index.html',
      stores: {
        chrome:  null, // TODO: Chrome Web Store URL once the listing is approved
        firefox: null, // TODO: Firefox Add-ons (AMO) URL once the listing is approved
      },
    },
  ];

  /* ── Status display metadata ────────────────────────────── */

  const STATUS_LABELS = {
    live:        { label: 'LIVE',            cls: 'tag--live'  },
    review:      { label: 'IN REVIEW',       cls: 'tag--amber' },
    unpublished: { label: 'NOT PUBLISHED',   cls: 'tag--amber' },
  };

  const STORE_LABELS = {
    chrome:  'Chrome Web Store',
    firefox: 'Firefox Add-ons',
    edge:    'Edge Add-ons',
  };

  window.PLUGINS = {
    all:           PLUGINS,
    get(slug)      { return PLUGINS.find(p => p.slug === slug) || null; },
    STATUS_LABELS,
    STORE_LABELS,
  };
})();
