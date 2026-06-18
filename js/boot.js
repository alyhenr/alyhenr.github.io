/**
 * boot.js — Boot sequence animator
 *
 * Plays a BIOS-style boot sequence on first visit (per session).
 * On subsequent page navigations within the same session, the
 * boot is skipped and the page appears immediately.
 *
 * Usage:
 *   Add a <div id="boot-screen" class="boot-screen"></div>
 *   to your page, then call Boot.init() after the DOM loads.
 *
 * The boot screen is skipped when:
 *   - sessionStorage['boot_done'] === 'true'
 *   - The user presses any key or clicks during the sequence
 *   - Boot.skip() is called programmatically
 *
 * Configuration:
 *   Set window.BOOT_CONFIG before including this script:
 *
 *   window.BOOT_CONFIG = {
 *     hostname: 'alyhenr.dev',
 *     version:  'v1.0.0',
 *     username: 'alyhenr',
 *     // lines: [ ...custom boot lines... ]  // override defaults
 *   };
 */

(function () {
  'use strict';

  /* ── Defaults ───────────────────────────────────────────── */

  const defaults = {
    hostname:  'alyhenr.dev',
    version:   'v1.0.0',
    username:  'alyhenr',
    onComplete: null,   // callback fired when boot finishes
  };

  const cfg = Object.assign({}, defaults, window.BOOT_CONFIG || {});

  /* ── Boot line definitions ──────────────────────────────── */
  /*
   * Each line: { text, cls, delay, pause }
   *   text  — string to display
   *   cls   — extra CSS class (boot-line--ok | --warn | --highlight)
   *   delay — ms to wait BEFORE printing this line (between lines)
   *   pause — ms to wait AFTER printing this line before next
   */
  function buildLines() {
    const ts = new Date();
    const dateStr = ts.toUTCString();

    return [
      { text: `BIOS v2.06 — ${cfg.hostname}`, cls: 'boot-line--highlight', delay: 0,   pause: 80  },
      { text: `Copyright (C) ${ts.getFullYear()} ${cfg.username}. All rights reserved.`, delay: 80, pause: 60 },
      { text: '',                                                                delay: 80,  pause: 0   },
      { text: 'Initializing memory...',                                          delay: 0,   pause: 120 },
      { text: 'Checking disk integrity...',                                      delay: 0,   pause: 160 },
      { text: 'Loading kernel modules...',                                       delay: 0,   pause: 180 },
      { text: '',                                                                delay: 0,   pause: 0   },
      { text: `[    0.000] ${cfg.hostname} kernel: Linux ${cfg.version} SMP`,   delay: 0,   pause: 60  },
      { text: '[    0.182] NET: Registered PF_INET6 protocol family',            delay: 0,   pause: 40  },
      { text: '[    0.341] clocksource: tsc: mask 0xffffffffffffffff',           delay: 0,   pause: 40  },
      { text: '[    0.502] systemd[1]: Starting network...',                     delay: 0,   pause: 60  },
      { text: `[    0.688] DHCP: acquired address — TTY0`,                       delay: 0,   pause: 80  },
      { text: '[    0.902] systemd[1]: Reached target Network.',   cls: 'boot-line--ok',  delay: 0, pause: 60 },
      { text: '',                                                                delay: 0,   pause: 0   },
      { text: `Loading ${cfg.hostname} OS ${cfg.version}...`,     cls: 'boot-line--highlight', delay: 80, pause: 200 },
      { text: 'Mounting filesystem...',                            cls: 'boot-line--ok',  delay: 0, pause: 80  },
      { text: 'Authenticating session...',                                       delay: 0,   pause: 120 },
      { text: `GUEST_ACCESS_GRANTED — Welcome, ${cfg.username}`,  cls: 'boot-line--ok',  delay: 0, pause: 300 },
      { text: '',                                                                delay: 0,   pause: 0   },
      { text: `SYS.DATE : ${dateStr}`,                                           delay: 0,   pause: 40  },
      { text: `SYS.NODE : ${cfg.hostname}`,                                     delay: 0,   pause: 40  },
      { text: 'SYS.STATUS : ONLINE',                              cls: 'boot-line--ok',  delay: 0, pause: 60 },
      { text: '',                                                                delay: 0,   pause: 0   },
      { text: 'Type  help  for a list of available commands.',                   delay: 0,   pause: 0   },
    ];
  }

  /* ── State ──────────────────────────────────────────────── */

  let skipped = false;
  let skipCallbacks = [];
  let resolveComplete;

  /* ── Core printer ───────────────────────────────────────── */

  function sleep(ms) {
    return new Promise(resolve => {
      if (skipped) { resolve(); return; }
      const id = setTimeout(resolve, ms);
      skipCallbacks.push(() => { clearTimeout(id); resolve(); });
    });
  }

  async function printLines(container, lines) {
    for (const line of lines) {
      if (skipped) break;
      if (line.delay) await sleep(line.delay);

      const el = document.createElement('div');
      el.className = 'boot-line' + (line.cls ? ' ' + line.cls : '');
      el.textContent = line.text;
      container.appendChild(el);

      // Trigger reflow so the opacity transition fires
      el.offsetHeight; // eslint-disable-line no-unused-expressions
      el.classList.add('boot-line--visible');

      if (line.pause) await sleep(line.pause);
    }
  }

  async function printAsciiArt(container, text) {
    if (skipped) return;
    await sleep(200);
    const el = document.createElement('pre');
    el.className = 'boot-line boot-line--highlight ascii-art glow';
    el.textContent = text;
    container.appendChild(el);
    el.offsetHeight;
    el.classList.add('boot-line--visible');
    await sleep(400);
  }

  /* ── Skip logic ─────────────────────────────────────────── */

  function doSkip() {
    if (skipped) return;
    skipped = true;
    skipCallbacks.forEach(cb => cb());
    skipCallbacks = [];
    finishBoot();
  }

  function finishBoot() {
    const screen = document.getElementById('boot-screen');
    if (screen) {
      // Fade out the boot screen
      screen.style.transition = 'opacity 0.3s ease';
      screen.style.opacity = '0';
      setTimeout(() => {
        screen.classList.add('boot-screen--hidden');
      }, 300);
    }

    sessionStorage.setItem('boot_done', 'true');

    if (typeof cfg.onComplete === 'function') cfg.onComplete();
    if (resolveComplete) resolveComplete();

    // Fire the custom event so other scripts can react
    document.dispatchEvent(new CustomEvent('boot:complete'));
  }

  /* ── ASCII art banner ───────────────────────────────────── */
  /*
   * Simple block-letter style. Replace or extend to your liking.
   * Keep lines short so it fits on narrow viewports too.
   */
  const ASCII_BANNER = [
    '  __ _| |_   _ | |__   ___ _ __  _ __',
    " / _` | | | | || '_ \\ / _ \\ '_ \\| '__|",
    '| (_| | | |_| || | | |  __/ | | | |   ',
    ' \\__,_|_|\\__, ||_| |_|\\___|_| |_|_|   ',
    '          |___/                        ',
  ].join('\n');

  /* ── Public API ─────────────────────────────────────────── */

  window.Boot = {
    /**
     * Initialize and run the boot sequence.
     * Returns a Promise that resolves when boot is complete.
     *
     * @param {Object} [options] — override cfg at runtime
     */
    async init(options) {
      Object.assign(cfg, options || {});

      const screen = document.getElementById('boot-screen');
      if (!screen) return Promise.resolve();

      // Skip if already booted this session
      if (sessionStorage.getItem('boot_done') === 'true') {
        screen.classList.add('boot-screen--hidden');
        return Promise.resolve();
      }

      // Skip on any keypress or click
      const skipHandler = () => doSkip();
      document.addEventListener('keydown', skipHandler, { once: true });
      document.addEventListener('click',   skipHandler, { once: true });

      return new Promise(async (resolve) => {
        resolveComplete = resolve;

        await printLines(screen, buildLines());
        if (!skipped) await printAsciiArt(screen, ASCII_BANNER);

        if (!skipped) {
          // Add blinking cursor at the end
          const cursorLine = document.createElement('div');
          cursorLine.className = 'boot-line boot-line--visible';
          cursorLine.innerHTML = `<span class="prompt__user">${escHtml(cfg.username)}</span>`
            + `<span class="prompt__at">@</span>`
            + `<span class="prompt__host">${escHtml(cfg.hostname)}</span>`
            + `<span class="prompt__sigil">:~$</span> `
            + `<span class="prompt__cursor"></span>`;
          screen.appendChild(cursorLine);

          await sleep(800);
        }

        // Remove listeners in case skip wasn't triggered
        document.removeEventListener('keydown', skipHandler);
        document.removeEventListener('click',   skipHandler);

        finishBoot();
      });
    },

    /** Immediately skip the boot sequence */
    skip() {
      doSkip();
    },

    /** Reset the boot-done flag (will play again on next Boot.init()) */
    reset() {
      sessionStorage.removeItem('boot_done');
    },
  };

  /* ── Security helper ────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
