/**
 * chrome.js — Shared site chrome
 *
 * Injects the menu bar, the status bar, and the terminal overlay
 * into every page. Include this script at the END of <body>.
 *
 * Pages no longer carry chrome markup of their own: there are no
 * placeholder divs and no inline terminal form. Everything below
 * is appended to <body> directly.
 *
 * ── Ordering matters ───────────────────────────────────────
 * The overlay holds #terminal-output / #terminal-input, which
 * Terminal.init() looks up. This script therefore injects
 * SYNCHRONOUSLY when it runs (at the end of <body>, so <body>
 * already exists), before the inline Terminal.init() call that
 * follows it. Moving this script into <head>, or adding defer,
 * would break that ordering.
 *
 * Configuration:
 *   <script>
 *     window.CHROME_CONFIG = {
 *       user: 'alyhenr',      // username shown in the terminal prompt
 *       host: 'alyhenr.dev',  // hostname
 *       activePage: 'blog',   // highlights the active nav item
 *       basePath: '../',      // prefix for nav hrefs on nested pages
 *       terminal: false,      // page provides its own terminal markup
 *     };
 *   </script>
 */

(function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────── */

  const defaults = {
    user: 'alyhenr',
    host: 'alyhenr.dev',
    activePage: 'home',
    basePath: '',      // '../' etc. for pages served from a subdirectory
    terminal: true,    // false on pages that host their own terminal (see below)
    uptimeStart: null, // Date — if null, uses page load time
  };

  const cfg = Object.assign({}, defaults, window.CHROME_CONFIG || {});
  const PAGE_LOAD = cfg.uptimeStart ? new Date(cfg.uptimeStart) : new Date();

  /* ── Navigation definition ──────────────────────────────── */
  /* Labels are plain words on purpose — a visitor arriving from a
     store listing should not have to decode the navigation.
     HREFS ARE FROZEN: /plugins/ was submitted to the Chrome Web
     Store and Firefox Add-ons. Change the label, never the href. */
  const NAV_ITEMS = [
    { id: 'home',     label: 'Home',       href: 'index.html'        },
    { id: 'projects', label: 'Work',       href: 'projects.html'     },
    { id: 'plugins',  label: 'Extensions', href: 'plugins/index.html' },
    { id: 'blog',     label: 'Writing',    href: 'blog.html'         },
    { id: 'contact',  label: 'Contact',    href: 'contact.html'      },
  ];

  /* ── Helpers ────────────────────────────────────────────── */

  function padTwo(n) { return String(n).padStart(2, '0'); }

  function formatTime(date) {
    return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
  }

  function uptimeString(startDate) {
    const secs = Math.floor((Date.now() - startDate.getTime()) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${padTwo(m)}m`;
    if (m > 0) return `${m}m ${padTwo(s)}s`;
    return `${s}s`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Menu bar ───────────────────────────────────────────── */

  function buildMenubar() {
    const el = document.createElement('nav');
    el.className = 'menubar';
    el.setAttribute('aria-label', 'Main navigation');

    const items = NAV_ITEMS.map(item => {
      const isActive = item.id === cfg.activePage;
      const cls = 'menubar__item' + (isActive ? ' menubar__item--active' : '');
      const current = isActive ? ' aria-current="page"' : '';
      return `<li><a class="${cls}" href="${cfg.basePath}${item.href}"${current}>${escHtml(item.label)}</a></li>`;
    }).join('');

    el.innerHTML = `
      <a class="menubar__brand" href="${cfg.basePath}index.html">${escHtml(cfg.user)}</a>
      <ul class="menubar__nav" role="list">${items}</ul>
    `;
    return el;
  }

  /* ── Status bar ─────────────────────────────────────────── */

  function buildStatusbar() {
    const el = document.createElement('div');
    el.className = 'statusbar';

    el.innerHTML = `
      <span class="statusbar__well" id="chrome-status">Ready</span>
      <span class="statusbar__right">
        <span class="statusbar__well" id="chrome-uptime">up ${uptimeString(PAGE_LOAD)}</span>
        <span class="statusbar__well" id="chrome-time">${formatTime(new Date())}</span>
        <button type="button" class="statusbar__term" id="chrome-term-btn"
                aria-label="Open terminal" title="Open terminal (~)">&gt;_</button>
      </span>
    `;
    return el;
  }

  /* ── Terminal overlay ───────────────────────────────────── */
  /* The easter egg. Holds the elements Terminal.init() expects:
     #terminal-output, #terminal-input, #terminal-form, #input-cwd. */

  function buildTerminalOverlay() {
    const el = document.createElement('div');
    el.className = 'terminal-overlay';
    el.id = 'terminal-overlay';
    el.hidden = true;

    const u = escHtml(cfg.user), h = escHtml(cfg.host);

    el.innerHTML = `
      <div class="terminal-overlay__window" role="dialog" aria-modal="true"
           aria-label="Terminal" id="terminal-dialog">
        <div class="window__bar">
          <span class="window__title">Terminal</span>
          <button type="button" class="terminal-overlay__close" id="chrome-term-close"
                  aria-label="Close terminal">&times;</button>
        </div>
        <div class="terminal-overlay__body">
          <div id="terminal-output">
            <p class="output output--dim">Type <span class="output--amber">help</span> for commands, or <span class="output--amber">ls</span> to look around. Esc closes.</p>
            <div class="output output--blank"></div>
          </div>
        </div>
        <form class="terminal-input-row" id="terminal-form" autocomplete="off" spellcheck="false">
          <span class="prompt" aria-hidden="true"><span class="prompt__user">${u}</span><span
            class="prompt__at">@</span><span class="prompt__host">${h}</span><span
            class="prompt__sep">:</span><span class="prompt__path" id="input-cwd">/</span><span
            class="prompt__sigil">$</span></span>
          <label for="terminal-input" class="sr-only">Terminal command input</label>
          <input id="terminal-input" class="terminal-input" type="text"
                 placeholder="type a command…" aria-label="Terminal command input" />
        </form>
      </div>
    `;
    return el;
  }

  /* ── Overlay behaviour ──────────────────────────────────── */

  let lastFocused = null;

  function openTerminal() {
    const overlay = document.getElementById('terminal-overlay');
    if (!overlay || !overlay.hidden) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    const input = document.getElementById('terminal-input');
    if (input) input.focus();
  }

  function closeTerminal() {
    const overlay = document.getElementById('terminal-overlay');
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  /** True when the user is typing somewhere a '~' should be literal. */
  function isTyping(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function wireOverlay() {
    const btn   = document.getElementById('chrome-term-btn');
    const close = document.getElementById('chrome-term-close');
    const overlay = document.getElementById('terminal-overlay');

    if (btn)   btn.addEventListener('click', openTerminal);
    if (close) close.addEventListener('click', closeTerminal);

    // Click the dimmed backdrop (but not the window) to close
    if (overlay) {
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) closeTerminal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeTerminal(); return; }
      // '~' and '`' open it — but never while the user is typing,
      // or they could not type a literal '~' into the terminal.
      if ((e.key === '~' || e.key === '`') && !isTyping(e.target)) {
        e.preventDefault();
        openTerminal();
      }
    });
  }

  /* ── Live clock & uptime ────────────────────────────────── */

  function startTicker() {
    setInterval(() => {
      const timeEl = document.getElementById('chrome-time');
      if (timeEl) timeEl.textContent = formatTime(new Date());

      const uptimeEl = document.getElementById('chrome-uptime');
      if (uptimeEl) uptimeEl.textContent = `up ${uptimeString(PAGE_LOAD)}`;
    }, 1000);
  }

  /* ── Injection ──────────────────────────────────────────── */

  function inject() {
    document.body.appendChild(buildMenubar());
    document.body.appendChild(buildStatusbar());

    /* Pages that build the terminal into their own layout (the game
       pages) set terminal:false. Injecting the overlay there would
       duplicate #terminal-output / #terminal-input, and Terminal.init
       would bind to whichever came first in the document. */
    if (cfg.terminal) {
      document.body.appendChild(buildTerminalOverlay());
      wireOverlay();
    } else {
      const btn = document.getElementById('chrome-term-btn');
      if (btn) btn.remove();
    }

    startTicker();
  }

  /* ── Public API ─────────────────────────────────────────── */
  /*
   * chrome.setCwd(path)          — update the terminal prompt path
   * chrome.setStatus(type, text) — update the status bar message
   * chrome.addNavItem(...)       — add a nav item at runtime
   * chrome.openTerminal() / closeTerminal()
   */
  window.chrome = {
    setCwd(path) {
      const el = document.getElementById('chrome-cwd');
      if (el) el.textContent = path;
    },

    setStatus(type, label) {
      const el = document.getElementById('chrome-status');
      if (el) el.textContent = label;
    },

    addNavItem(id, label, href) {
      const nav = document.querySelector('.menubar__nav');
      if (!nav) return;
      const li = document.createElement('li');
      li.innerHTML = `<a class="menubar__item" href="${escHtml(href)}">${escHtml(label)}</a>`;
      nav.appendChild(li);
    },

    openTerminal,
    closeTerminal,
  };

  /* ── Init ───────────────────────────────────────────────── */
  /* Synchronous when <body> exists (this script sits at the end of
     it), so the overlay is in the DOM before Terminal.init() runs. */
  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
