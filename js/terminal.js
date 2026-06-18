/**
 * terminal.js — Interactive terminal engine scaffold
 *
 * Provides:
 *   - Command registry (add your own commands here)
 *   - Input capture with command history (↑↓)
 *   - Tab-completion stub
 *   - Output renderer with typing animation
 *   - Output helpers: text, error, success, table, etc.
 *
 * Usage:
 *   Include this script after chrome.js. The terminal attaches
 *   to elements with these IDs:
 *     #terminal-output  — where output lines are appended
 *     #terminal-input   — the <input> or contenteditable element
 *     #terminal-form    — optional <form> wrapping the input row
 *
 *   Then call:
 *     Terminal.init({ user: 'alyhenr', host: 'alyhenr.dev' });
 *
 * Extending commands:
 *   Terminal.register('mycommand', {
 *     description: 'Does something cool',
 *     usage: 'mycommand [options]',
 *     run(args, term) {
 *       term.print('Hello from mycommand!');
 *     }
 *   });
 */

(function () {
  'use strict';

  /* ── Internal state ─────────────────────────────────────── */

  const state = {
    history:     [],    // command history stack
    historyIdx:  -1,    // current history navigation index (-1 = new input)
    pendingInput: '',   // saved input while browsing history
    cwd:         '~',  // current virtual working directory
    user:        'alyhenr',
    host:        'alyhenr.dev',
    outputEl:    null,
    inputEl:     null,
  };

  /* ── Command registry ───────────────────────────────────── */
  /*
   * Each command is an object: { description, usage, run(args, term) }
   * `args` is a string[] from the raw input split on whitespace.
   * `term` is the public Terminal API (see bottom of file).
   */
  const commands = {};

  /* ── Built-in commands ──────────────────────────────────── */

  commands['help'] = {
    description: 'List available commands.',
    usage: 'help [command]',
    run(args, term) {
      if (args[1]) {
        const cmd = commands[args[1]];
        if (!cmd) {
          term.error(`help: unknown command: ${args[1]}`);
          return;
        }
        term.print(`${args[1]}: ${cmd.description}`);
        if (cmd.usage) term.print(`usage: ${cmd.usage}`, { cls: 'output--dim' });
        return;
      }

      term.print('Available commands:', { cls: 'output--dim' });
      term.blank();
      const names = Object.keys(commands).sort();
      const maxLen = Math.max(...names.map(n => n.length));
      for (const name of names) {
        const cmd = commands[name];
        const pad = ' '.repeat(maxLen - name.length + 2);
        term.print(`  ${name}${pad}${cmd.description}`, { cls: 'output--white' });
      }
      term.blank();
      term.print('Type  help <command>  for details.', { cls: 'output--dim' });
    },
  };

  commands['clear'] = {
    description: 'Clear the terminal output.',
    usage: 'clear',
    run(_args, term) {
      term.clear();
    },
  };

  commands['echo'] = {
    description: 'Print text to the terminal.',
    usage: 'echo <text>',
    run(args, term) {
      term.print(args.slice(1).join(' '));
    },
  };

  commands['pwd'] = {
    description: 'Print working directory.',
    usage: 'pwd',
    run(_args, term) {
      term.print(`/${state.cwd === '~' ? 'home/' + state.user : state.cwd}`);
    },
  };

  commands['cd'] = {
    description: 'Change virtual directory (updates header path).',
    usage: 'cd <path>',
    run(args, term) {
      const target = args[1] || '~';
      state.cwd = target;
      if (window.chrome && typeof window.chrome.setCwd === 'function') {
        window.chrome.setCwd(target);
      }
    },
  };

  commands['whoami'] = {
    description: 'Print current user information.',
    usage: 'whoami',
    run(_args, term) {
      // Customize this to show your real bio
      term.print(state.user, { cls: 'output--bright' });
    },
  };

  commands['date'] = {
    description: 'Print the current date and time.',
    usage: 'date',
    run(_args, term) {
      term.print(new Date().toString());
    },
  };

  commands['history'] = {
    description: 'Show command history.',
    usage: 'history',
    run(_args, term) {
      if (state.history.length === 0) {
        term.print('No history.', { cls: 'output--dim' });
        return;
      }
      state.history.forEach((cmd, i) => {
        term.print(`  ${String(i + 1).padStart(3)}  ${cmd}`, { cls: 'output--white' });
      });
    },
  };

  /*
   * ── Placeholder commands you'll want to fill in ───────────
   * These stubs show up in `help` and accept calls, but just
   * remind you to implement them.
   */
  function stub(name, desc) {
    commands[name] = {
      description: desc,
      usage: name,
      run(_args, term) {
        term.print(`[${name}] Not yet implemented.`, { cls: 'output--amber' });
      },
    };
  }

  stub('ls',      'List contents of the current directory.');
  stub('cat',     'Display the contents of a file.');
  stub('open',    'Open a project or blog post by name.');
  stub('theme',   'Switch terminal color theme.');
  stub('contact', 'Show contact information.');
  stub('projects','List all projects.');
  stub('blog',    'List blog posts.');

  /* ── Output renderer ────────────────────────────────────── */

  function appendLine(text, opts = {}) {
    const { cls = '', animate = false, delay = 0 } = opts;
    const el = document.createElement('div');
    el.className = 'output' + (cls ? ' ' + cls : '');
    el.textContent = text;

    if (animate) el.classList.add('line-reveal');
    if (delay) el.style.animationDelay = delay + 'ms';

    state.outputEl.appendChild(el);
    scrollBottom();
    return el;
  }

  function appendPromptLine(rawInput) {
    const row = document.createElement('div');
    row.className = 'prompt';
    row.innerHTML =
      `<span class="prompt__user">${escHtml(state.user)}</span>` +
      `<span class="prompt__at">@</span>` +
      `<span class="prompt__host">${escHtml(state.host)}</span>` +
      `<span class="prompt__sep">:</span>` +
      `<span class="prompt__path">${escHtml(state.cwd)}</span>` +
      `<span class="prompt__sigil">$</span> ` +
      `<span class="prompt__command">${escHtml(rawInput)}</span>`;
    state.outputEl.appendChild(row);
  }

  /**
   * Type text character-by-character into an output element.
   * Returns a Promise that resolves when typing is done.
   */
  function typeText(text, opts = {}) {
    const { speed = 30, cls = '' } = opts;
    return new Promise(resolve => {
      const el = appendLine('', { cls });
      let i = 0;
      function tick() {
        if (i >= text.length) { resolve(el); return; }
        el.textContent += text[i++];
        scrollBottom();
        setTimeout(tick, speed);
      }
      tick();
    });
  }

  function scrollBottom() {
    const content = state.outputEl.closest('.terminal-content') || state.outputEl.parentElement;
    if (content) content.scrollTop = content.scrollHeight;
  }

  /* ── Input handling ─────────────────────────────────────── */

  function handleSubmit(rawInput) {
    const input = rawInput.trim();
    if (!input) return;

    // Echo the prompt line into output
    appendPromptLine(input);

    // Save to history (avoid consecutive duplicates)
    if (state.history[0] !== input) {
      state.history.unshift(input);
      if (state.history.length > 200) state.history.pop();
    }
    state.historyIdx = -1;
    state.pendingInput = '';

    // Parse: split on whitespace, respecting quoted strings
    const args = parseArgs(input);
    const cmdName = args[0] ? args[0].toLowerCase() : '';

    const cmd = commands[cmdName];
    if (!cmd) {
      appendLine(
        `${cmdName}: command not found. Type  help  for available commands.`,
        { cls: 'output--error' }
      );
    } else {
      try {
        cmd.run(args, Terminal);
      } catch (err) {
        appendLine(`Error: ${err.message}`, { cls: 'output--error' });
        console.error(err);
      }
    }

    appendLine(''); // blank spacer after each command
  }

  function handleKeyDown(e) {
    const input = state.inputEl;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.historyIdx === -1) state.pendingInput = input.value;
      if (state.historyIdx < state.history.length - 1) {
        state.historyIdx++;
        input.value = state.history[state.historyIdx];
        setTimeout(() => { input.selectionStart = input.value.length; }, 0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.historyIdx > 0) {
        state.historyIdx--;
        input.value = state.history[state.historyIdx];
      } else if (state.historyIdx === 0) {
        state.historyIdx = -1;
        input.value = state.pendingInput;
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete(input);
      return;
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      Terminal.clear();
      return;
    }

    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      appendPromptLine(input.value + '^C');
      input.value = '';
      state.historyIdx = -1;
    }
  }

  /* ── Tab completion ─────────────────────────────────────── */

  function handleTabComplete(inputEl) {
    const val = inputEl.value;
    const parts = val.split(' ');
    if (parts.length === 1) {
      // Complete command name
      const partial = parts[0].toLowerCase();
      const matches = Object.keys(commands).filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        inputEl.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        appendPromptLine(val);
        appendLine(matches.join('   '), { cls: 'output--dim' });
      }
    }
    // Further argument completion can be implemented per-command
    // by adding a `complete(args)` method to a command object.
  }

  /* ── Argument parser ────────────────────────────────────── */
  /*
   * Splits a command string on whitespace, but keeps
   * quoted strings (single or double) together.
   * e.g. cat "my file.txt" → ['cat', 'my file.txt']
   */
  function parseArgs(input) {
    const args = [];
    let current = '';
    let inQuote = null;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (inQuote) {
        if (ch === inQuote) { inQuote = null; }
        else { current += ch; }
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === ' ') {
        if (current) { args.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current) args.push(current);
    return args;
  }

  /* ── Security helper ────────────────────────────────────── */

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Public API ─────────────────────────────────────────── */

  const Terminal = {
    /**
     * Initialize the terminal engine.
     * @param {Object} options
     */
    init(options = {}) {
      Object.assign(state, options);

      state.outputEl = document.getElementById('terminal-output');
      state.inputEl  = document.getElementById('terminal-input');

      if (!state.outputEl || !state.inputEl) {
        console.warn('terminal.js: #terminal-output or #terminal-input not found.');
        return;
      }

      // Submit on Enter
      const form = document.getElementById('terminal-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = state.inputEl.value;
          state.inputEl.value = '';
          handleSubmit(val);
        });
      } else {
        state.inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = state.inputEl.value;
            state.inputEl.value = '';
            handleSubmit(val);
          }
        });
      }

      // History & tab completion
      state.inputEl.addEventListener('keydown', handleKeyDown);

      // Focus input on click anywhere on the terminal content
      const content = state.outputEl.closest('.terminal-content');
      if (content) {
        content.addEventListener('click', (e) => {
          if (!window.getSelection().toString()) {
            state.inputEl.focus();
          }
        });
      }

      // Auto-focus
      state.inputEl.focus();
    },

    /**
     * Register a new command.
     * @param {string} name
     * @param {{ description: string, usage?: string, run: Function }} cmd
     */
    register(name, cmd) {
      commands[name.toLowerCase()] = cmd;
    },

    /**
     * Unregister a command.
     * @param {string} name
     */
    unregister(name) {
      delete commands[name.toLowerCase()];
    },

    /**
     * Run a command string programmatically.
     * @param {string} input — raw command string
     */
    run(input) {
      handleSubmit(input);
    },

    /* ── Output helpers ─────────────────────────────────────── */

    /** Print a plain text line. */
    print(text, opts = {}) {
      return appendLine(text, opts);
    },

    /** Print an error line. */
    error(text) {
      return appendLine(text, { cls: 'output--error' });
    },

    /** Print a success / bright line. */
    success(text) {
      return appendLine(text, { cls: 'output--success' });
    },

    /** Print a warning / amber line. */
    warn(text) {
      return appendLine(text, { cls: 'output--warning' });
    },

    /** Print a dim / secondary line. */
    dim(text) {
      return appendLine(text, { cls: 'output--dim' });
    },

    /** Print a blank spacer line. */
    blank() {
      return appendLine('');
    },

    /**
     * Type text character-by-character (async).
     * @param {string} text
     * @param {{ speed?: number, cls?: string }} opts
     * @returns {Promise<HTMLElement>}
     */
    type(text, opts = {}) {
      return typeText(text, opts);
    },

    /**
     * Print multiple lines with staggered fade-in animation.
     * @param {string[]} lines
     * @param {number} [stagger=50] — ms between each line
     */
    printLines(lines, stagger = 50) {
      lines.forEach((line, i) => {
        appendLine(line, { animate: true, delay: i * stagger });
      });
    },

    /**
     * Render an ls-style table from an array of entry objects.
     * Each entry: { name, desc, size, date, perms, cls }
     *
     * @param {Array<Object>} entries
     */
    lsTable(entries) {
      const wrapper = document.createElement('div');
      wrapper.className = 'ls-table';

      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'ls-entry' + (entry.href ? ' ls-entry--clickable' : '');
        if (entry.href) {
          row.addEventListener('click', () => { window.location.href = entry.href; });
          row.setAttribute('role', 'link');
          row.setAttribute('tabindex', '0');
          row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') window.location.href = entry.href;
          });
        }

        row.innerHTML =
          `<span class="ls-entry__perms">${escHtml(entry.perms || '-rw-r--r--')}</span>` +
          `<span class="ls-entry__size">${escHtml(entry.size || '--')}</span>` +
          `<span class="ls-entry__date">${escHtml(entry.date || '--')}</span>` +
          `<span class="ls-entry__name ${entry.cls || ''}">${escHtml(entry.name)}</span>` +
          `<span class="ls-entry__desc">${escHtml(entry.desc || '')}</span>`;
        wrapper.appendChild(row);
      }

      state.outputEl.appendChild(wrapper);
      scrollBottom();
    },

    /** Clear all output. */
    clear() {
      if (state.outputEl) state.outputEl.innerHTML = '';
    },

    /** Programmatically update the virtual CWD. */
    setCwd(path) {
      state.cwd = path;
      if (window.chrome) window.chrome.setCwd(path);
    },

    /** Expose the commands registry for external inspection. */
    get commands() {
      return { ...commands };
    },
  };

  /* ── Attach to window ───────────────────────────────────── */

  window.Terminal = Terminal;
})();
