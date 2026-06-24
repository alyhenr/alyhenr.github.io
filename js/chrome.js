/**
 * chrome.js — Shared terminal chrome injection
 *
 * Injects the terminal header and status bar (bottom nav) into
 * every page. Include this script at the end of <body>.
 *
 * Required markup in each page:
 *   <div id="terminal-header"></div>
 *   ...page content...
 *   <div id="terminal-nav"></div>
 *
 * Configuration:
 *   Set window.CHROME_CONFIG before including this script to
 *   override defaults:
 *
 *   <script>
 *     window.CHROME_CONFIG = {
 *       user: 'alyhenr',      // username shown in prompt
 *       host: 'alyhenr.dev',  // hostname
 *       activePage: 'blog',   // highlights the active nav link
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
    uptimeStart: null, // Date — if null, uses page load time
  };

  const cfg = Object.assign({}, defaults, window.CHROME_CONFIG || {});

  // Page load timestamp (used for uptime counter)
  const PAGE_LOAD = cfg.uptimeStart ? new Date(cfg.uptimeStart) : new Date();

  /* ── Navigation definition ──────────────────────────────── */
  // Add new pages here. 'id' must match the CHROME_CONFIG.activePage value.
  const NAV_ITEMS = [
    { id: 'home',     label: '~',        href: 'index.html'    },
    { id: 'projects', label: 'projects', href: 'projects.html' },
    { id: 'blog',     label: 'blog',     href: 'blog.html'     },
    { id: 'games',    label: 'games',    href: 'games.html'    },
    { id: 'contact',  label: 'contact',  href: 'contact.html'  },
  ];

  /* ── Helpers ────────────────────────────────────────────── */

  function padTwo(n) {
    return String(n).padStart(2, '0');
  }

  function formatTime(date) {
    return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}:${padTwo(date.getSeconds())}`;
  }

  function formatDate(date) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[date.getMonth()]} ${padTwo(date.getDate())}`;
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

  /* ── Build Header HTML ──────────────────────────────────── */

  function buildHeader() {
    const now = new Date();
    const el = document.createElement('header');
    el.className = 'terminal-header';
    el.setAttribute('role', 'banner');

    el.innerHTML = `
      <div class="terminal-header__left">
        <span class="terminal-header__user">${escHtml(cfg.user)}</span>
        <span class="terminal-header__sep">@</span>
        <span class="terminal-header__host">${escHtml(cfg.host)}</span>
        <span class="terminal-header__sep">:</span>
        <span class="terminal-header__path" id="chrome-cwd">~</span>
        <span class="terminal-header__sep">$</span>
      </div>
      <div class="terminal-header__right">
        <span class="terminal-header__meta" id="chrome-uptime" title="Session uptime">
          up ${uptimeString(PAGE_LOAD)}
        </span>
        <span class="terminal-header__meta" id="chrome-time">
          ${formatDate(now)} ${formatTime(now)}
        </span>
        <span class="terminal-header__status terminal-header__status--ok">
          200 OK
        </span>
      </div>
    `;

    return el;
  }

  /* ── Build Status Bar HTML ──────────────────────────────── */

  function buildStatusBar() {
    const el = document.createElement('nav');
    el.className = 'status-bar';
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', 'Site navigation');

    const navHtml = NAV_ITEMS.map(item => {
      const isActive = item.id === cfg.activePage;
      const cls = 'status-bar__nav-link' + (isActive ? ' status-bar__nav-link--active' : '');
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      return `<li class="status-bar__nav-item">
        <a class="${cls}" href="${item.href}"${ariaCurrent}>[${escHtml(item.label)}]</a>
      </li>`;
    }).join('');

    el.innerHTML = `
      <ul class="status-bar__nav" role="list">
        ${navHtml}
      </ul>
      <div class="status-bar__info">
        <span id="chrome-session">TTY0</span>
        <span id="chrome-footer-time">${formatTime(new Date())}</span>
      </div>
    `;

    return el;
  }

  /* ── Security: escape HTML ──────────────────────────────── */

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Injection ──────────────────────────────────────────── */

  function inject() {
    const headerSlot = document.getElementById('terminal-header');
    if (headerSlot) {
      headerSlot.replaceWith(buildHeader());
    }

    const navSlot = document.getElementById('terminal-nav');
    if (navSlot) {
      navSlot.replaceWith(buildStatusBar());
    }
  }

  /* ── Live clock & uptime ticker ─────────────────────────── */

  function startTicker() {
    setInterval(() => {
      const now = new Date();

      const timeEl = document.getElementById('chrome-time');
      if (timeEl) {
        timeEl.textContent = `${formatDate(now)} ${formatTime(now)}`;
      }

      const footerTimeEl = document.getElementById('chrome-footer-time');
      if (footerTimeEl) {
        footerTimeEl.textContent = formatTime(now);
      }

      const uptimeEl = document.getElementById('chrome-uptime');
      if (uptimeEl) {
        uptimeEl.textContent = `up ${uptimeString(PAGE_LOAD)}`;
      }
    }, 1000);
  }

  /* ── Public API ─────────────────────────────────────────── */
  /*
   * chrome.setCwd(path) — Update the path shown in the header prompt.
   *   Useful when the terminal "navigates" to a virtual directory.
   *
   * chrome.setStatus(code, label) — Update the status badge.
   *   e.g. chrome.setStatus('warn', '404 NOT FOUND')
   *
   * chrome.addNavItem(id, label, href) — Dynamically add a nav item.
   */
  window.chrome = {
    setCwd(path) {
      const el = document.getElementById('chrome-cwd');
      if (el) el.textContent = path;
    },

    setStatus(type, label) {
      const header = document.querySelector('.terminal-header__status');
      if (!header) return;
      header.className = `terminal-header__status terminal-header__status--${type}`;
      header.textContent = label;
    },

    addNavItem(id, label, href) {
      const nav = document.querySelector('.status-bar__nav');
      if (!nav) return;
      const li = document.createElement('li');
      li.className = 'status-bar__nav-item';
      li.innerHTML = `<a class="status-bar__nav-link" href="${href}">[${escHtml(label)}]</a>`;
      nav.appendChild(li);
    },
  };

  /* ── Init ───────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { inject(); startTicker(); });
  } else {
    inject();
    startTicker();
  }
})();
