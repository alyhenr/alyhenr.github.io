/**
 * terminal.js — Interactive terminal engine
 *
 * Provides:
 *   - Full command set backed by the virtual filesystem (filesystem.js)
 *   - Input capture with command history (↑↓)
 *   - Tab-completion for commands and FS paths
 *   - Output renderer with typing animation
 *
 * Depends on: filesystem.js (window.FS must be defined first)
 *
 * Usage:
 *   Terminal.init({ user: 'alyhenr', host: 'alyhenr.dev', cwd: '~' });
 *
 *   Pages served from a subdirectory must pass basePath so that the
 *   document-relative hrefs in filesystem.js still resolve:
 *   Terminal.init({ cwd: '/plugins/alvaras', basePath: '../../' });
 *
 * Adding commands:
 *   Terminal.register('mycommand', {
 *     description: 'Does something cool',
 *     usage: 'mycommand [options]',
 *     run(args, term) { term.print('Hello!'); }
 *   });
 */

(function () {
  'use strict';

  /* ── Internal state ─────────────────────────────────────── */

  const state = {
    history:      [],
    historyIdx:   -1,
    pendingInput: '',
    cwd:          '/',
    user:         'alyhenr',
    host:         'alyhenr.dev',
    basePath:     '',
    outputEl:     null,
    inputEl:      null,
  };

  /* ── FS accessor (safe — works even if filesystem.js not loaded) */
  const FS = () => window.FS || null;

  /**
   * Resolve an FS href against state.basePath and navigate to it.
   * FS hrefs are document-relative ('blog.html'), so a page served from
   * a subdirectory needs the basePath prefix to reach them.
   */
  function hrefFor(href) {
    if (/^([a-z]+:)?\/\//i.test(href) || href.startsWith('/')) return href;
    return state.basePath + href;
  }

  function navTo(href) {
    window.location.href = hrefFor(href);
  }

  /* ── Command registry ───────────────────────────────────── */
  const commands = {};

  /* ================================================================
     BUILT-IN COMMANDS
     ================================================================ */

  /* ── help ───────────────────────────────────────────────── */
  commands['help'] = {
    description: 'List available commands or show help for one.',
    usage: 'help [command]',
    run(args, term) {
      if (args[1]) {
        const cmd = commands[args[1].toLowerCase()];
        if (!cmd) { term.error(`help: no manual entry for '${args[1]}'`); return; }
        term.print(args[1], { cls: 'output--bright' });
        term.dim(`  ${cmd.description}`);
        if (cmd.usage) term.dim(`  usage: ${cmd.usage}`);
        return;
      }

      term.dim('Available commands:');
      term.blank();
      const names = Object.keys(commands).sort();
      const maxLen = Math.max(...names.map(n => n.length));
      for (const name of names) {
        const pad = ' '.repeat(maxLen - name.length + 3);
        term.print(`  ${name}${pad}${commands[name].description}`, { cls: 'output--white' });
      }
      term.blank();
      term.dim('Type  help <command>  for details. Type  man <command>  for the manual.');
    },
  };

  /* ── clear / Ctrl-L ─────────────────────────────────────── */
  commands['clear'] = {
    description: 'Clear the terminal output.',
    usage: 'clear',
    run(_args, term) { term.clear(); },
  };

  /* ── echo ───────────────────────────────────────────────── */
  commands['echo'] = {
    description: 'Print text to the terminal.',
    usage: 'echo <text>',
    run(args, term) { term.print(args.slice(1).join(' ')); },
  };

  /* ── pwd ────────────────────────────────────────────────── */
  commands['pwd'] = {
    description: 'Print current working directory.',
    usage: 'pwd',
    run(_args, term) {
      const abs = cwdToAbs();
      term.print(abs, { cls: 'output--white' });
    },
  };

  /* ── ls ─────────────────────────────────────────────────── */
  commands['ls'] = {
    description: 'List directory contents.',
    usage: 'ls [-l] [-a] [path]',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('ls: filesystem not loaded'); return; }

      // Parse flags and path from args
      let longFlag = false;
      let pathArg = null;
      for (let i = 1; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith('-')) {
          if (a.includes('l')) longFlag = true;
        } else {
          pathArg = a;
        }
      }

      const absTarget = pathArg ? fs.resolve(cwdToAbs(), pathArg) : cwdToAbs();
      const node = fs.get(absTarget);

      if (!node) {
        term.error(`ls: cannot access '${pathArg || cwdToAbs()}': No such file or directory`);
        return;
      }

      if (node.type === 'file') {
        // ls on a file just prints it
        if (longFlag) {
          const perms = node.perms || '-rw-r--r--';
          const size  = node.size || '--';
          const date  = node.date || '--';
          const name  = absTarget.split('/').pop();
          term.print(`${perms}  ${size.padStart(7)}  ${date}  ${name}`, { cls: 'output--white' });
        } else {
          term.print(absTarget.split('/').pop(), { cls: 'output--white' });
        }
        return;
      }

      // Directory — get children
      const kids = fs.children(absTarget);
      if (kids.length === 0) {
        term.dim('(empty)');
        return;
      }

      if (longFlag) {
        // Long listing: perms  size  date  name  desc
        for (const { name, node: n } of kids) {
          const perms = n.perms || (n.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
          const size  = n.size || (n.type === 'dir' ? '--' : '--');
          const date  = n.date || '--';
          const nameCls = n.type === 'dir' ? 'output--bright' : 'output--white';
          const display = n.type === 'dir' ? name + '/' : name;
          const desc  = n.desc ? `  ${n.desc}` : '';

          const el = appendLine('', {});
          el.innerHTML =
            `<span class="output--dim">${escHtml(perms)}</span>  ` +
            `<span class="output--dim">${escHtml(size.padStart(7))}</span>  ` +
            `<span class="output--dim">${escHtml(date)}</span>  ` +
            `<span class="${nameCls}">${escHtml(display)}</span>` +
            `<span class="output--dim">${escHtml(desc)}</span>`;
          scrollBottom();
        }
      } else {
        // Compact listing: names across the line, dirs in bright green
        const parts = kids.map(({ name, node: n }) => {
          const display = n.type === 'dir' ? name + '/' : name;
          const cls     = n.type === 'dir' ? 'output--bright' : 'output--white';
          return `<span class="${cls}">${escHtml(display)}</span>`;
        });
        const el = appendLine('', {});
        el.innerHTML = parts.join('   ');
        scrollBottom();
      }
    },
  };

  /* ── cd ─────────────────────────────────────────────────── */
  commands['cd'] = {
    description: 'Change directory (navigates to pages when applicable).',
    usage: 'cd [path]',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('cd: filesystem not loaded'); return; }

      const raw     = args[1] || '~';
      const absPath = (raw === '~' || raw === '/') ? '/' : fs.resolve(cwdToAbs(), raw);
      const node    = fs.get(absPath);

      if (!node) {
        term.error(`cd: ${raw}: No such file or directory`);
        return;
      }
      if (node.type === 'file') {
        term.error(`cd: ${raw}: Not a directory`);
        return;
      }

      // Update CWD display
      state.cwd = absPath;
      updatePromptCwd(absPath);

      // If the directory maps to a page, navigate there
      if (node.href) {
        term.dim(`Navigating to ${absPath}...`);
        setTimeout(() => { navTo(node.href); }, 350);
      }
    },
  };

  /* ── tree ───────────────────────────────────────────────── */
  commands['tree'] = {
    description: 'Display directory tree.',
    usage: 'tree [path]',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('tree: filesystem not loaded'); return; }

      const pathArg  = args[1] || '~';
      const absPath  = (pathArg === '~' || pathArg === '/') ? '/' : fs.resolve(cwdToAbs(), pathArg);
      const node     = fs.get(absPath);

      if (!node || node.type !== 'dir') {
        term.error(`tree: ${pathArg}: Not a directory`);
        return;
      }

      // Print root label
      const rootLabel = absPath === '/' ? '.' : absPath.split('/').pop() + '/';
      term.print(rootLabel, { cls: 'output--bright' });

      let fileCount = 0;
      let dirCount  = 0;

      function renderDir(dirPath, prefix) {
        const kids = fs.children(dirPath);
        kids.forEach(({ name, node: n }, idx) => {
          const isLast    = idx === kids.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const childPfx  = isLast ? '    ' : '│   ';
          const display   = n.type === 'dir' ? name + '/' : name;
          const cls       = n.type === 'dir' ? 'output--bright' : 'output--white';

          const el = appendLine('', {});
          el.innerHTML =
            `<span class="output--dim">${escHtml(prefix + connector)}</span>` +
            `<span class="${cls}">${escHtml(display)}</span>`;
          scrollBottom();

          if (n.type === 'dir') {
            dirCount++;
            renderDir(dirPath === '/' ? '/' + name : dirPath + '/' + name, prefix + childPfx);
          } else {
            fileCount++;
          }
        });
      }

      renderDir(absPath, '');
      term.blank();
      term.dim(`${dirCount} director${dirCount === 1 ? 'y' : 'ies'}, ${fileCount} file${fileCount !== 1 ? 's' : ''}`);
    },
  };

  /* ── cat ────────────────────────────────────────────────── */
  commands['cat'] = {
    description: 'Display the contents of a file.',
    usage: 'cat <file>',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('cat: filesystem not loaded'); return; }

      if (!args[1]) { term.error('cat: missing file operand'); return; }

      const absPath = fs.resolve(cwdToAbs(), args[1]);
      const node    = fs.get(absPath);

      if (!node) {
        term.error(`cat: ${args[1]}: No such file or directory`);
        return;
      }
      if (node.type === 'dir') {
        term.error(`cat: ${args[1]}: Is a directory`);
        return;
      }

      const content = fs.getContent(absPath);
      if (content) {
        // Print each line with the output--white style
        content.split('\n').forEach(line => term.print(line, { cls: 'output--white' }));
      } else {
        term.dim(`(no inline content for this file)`);
      }

      if (node.href) {
        term.blank();
        const el = appendLine('', {});
        el.innerHTML = `<span class="output--dim">→ </span>` +
          `<a href="${escHtml(hrefFor(node.href))}" class="output--bright">[OPEN in browser]</a>`;
        scrollBottom();
      }
    },
  };

  /* ── find ───────────────────────────────────────────────── */
  commands['find'] = {
    description: 'Find files matching a name pattern.',
    usage: 'find [path] [-name <pattern>]',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('find: filesystem not loaded'); return; }

      let startPath = cwdToAbs();
      let pattern   = null;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '-name' && args[i + 1]) {
          pattern = args[++i];
        } else if (!args[i].startsWith('-')) {
          startPath = fs.resolve(cwdToAbs(), args[i]);
        }
      }

      const paths = fs.allPaths(pattern);
      const hits  = paths.filter(p => p.startsWith(startPath === '/' ? '/' : startPath + '/') || p === startPath);

      if (hits.length === 0) {
        term.dim('(no matches)');
        return;
      }
      hits.forEach(p => {
        const n   = fs.get(p);
        const cls = n && n.type === 'dir' ? 'output--bright' : 'output--white';
        term.print(p, { cls });
      });
    },
  };

  /* ── open / go ──────────────────────────────────────────── */
  const goCmd = {
    description: 'Navigate to a site page by name.',
    usage: 'go <home|projects|blog|plugins|contact|games>',
    run(args, term) {
      const target = args[1] ? args[1].toLowerCase() : null;
      if (!target) { term.error(`go: missing destination`); return; }

      // Map friendly names to paths
      const shortcuts = {
        home:     '/',
        '~':      '/',
        projects: '/projects',
        blog:     '/blog',
        plugins:  '/plugins',
        contact:  '/contact',
        games:    '/games',
      };

      const absPath = shortcuts[target] || '/' + target;
      const fs      = FS();
      const node    = fs ? fs.get(absPath) : null;

      if (!node) {
        term.error(`go: unknown destination '${target}'. Try: home, projects, blog, plugins, contact, games`);
        return;
      }
      if (!node.href) {
        term.error(`go: '${target}' has no navigation target`);
        return;
      }

      term.dim(`Navigating to ${absPath}...`);
      setTimeout(() => { navTo(node.href); }, 350);
    },
  };
  commands['go']   = goCmd;
  commands['open'] = { ...goCmd, description: 'Alias for go.' };

  /* ── whoami ─────────────────────────────────────────────── */
  commands['whoami'] = {
    description: 'Display user profile.',
    usage: 'whoami',
    run(_args, term) {
      const fs = FS();
      const content = fs ? fs.getContent('/whoami') : null;
      if (content) {
        content.split('\n').forEach(line => term.print(line, { cls: 'output--white' }));
      } else {
        term.print(state.user, { cls: 'output--bright' });
      }
    },
  };

  /* ── date ───────────────────────────────────────────────── */
  commands['date'] = {
    description: 'Print current date and time.',
    usage: 'date',
    run(_args, term) { term.print(new Date().toString(), { cls: 'output--white' }); },
  };

  /* ── uptime ─────────────────────────────────────────────── */
  commands['uptime'] = {
    description: 'Show session uptime.',
    usage: 'uptime',
    run(_args, term) {
      // chrome.js tracks PAGE_LOAD — we read the uptime element it writes
      const uptimeEl = document.getElementById('chrome-uptime');
      const uptimeStr = uptimeEl ? uptimeEl.textContent.trim() : 'unknown';
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      term.print(
        ` ${h}:${m}  ${uptimeStr}  load average: 0.00, 0.00, 0.00`,
        { cls: 'output--white' }
      );
    },
  };

  /* ── uname ──────────────────────────────────────────────── */
  commands['uname'] = {
    description: 'Print system information.',
    usage: 'uname [-a]',
    run(args, term) {
      if (args.includes('-a') || args.includes('--all')) {
        term.print(
          `${state.host} kernel 1.0.0 SMP POSIX_compliant x86_blog #1 Wed Jun 2025`,
          { cls: 'output--white' }
        );
      } else {
        term.print(state.host, { cls: 'output--white' });
      }
    },
  };

  /* ── env ────────────────────────────────────────────────── */
  commands['env'] = {
    description: 'Print environment variables.',
    usage: 'env',
    run(_args, term) {
      const abs = cwdToAbs();
      const vars = [
        ['USER',  state.user],
        ['HOME',  '/'],
        ['PWD',   abs],
        ['HOST',  state.host],
        ['SHELL', '/bin/terminal.js'],
        ['TERM',  'xterm-256color'],
        ['LANG',  'en_US.UTF-8'],
        ['EDITOR','vim'],
      ];
      const maxKey = Math.max(...vars.map(([k]) => k.length));
      for (const [k, v] of vars) {
        const el = appendLine('', {});
        el.innerHTML =
          `<span class="output--amber">${escHtml(k)}</span>` +
          `<span class="output--dim">${'='.padStart(maxKey - k.length + 1)}</span>` +
          `<span class="output--white">${escHtml(v)}</span>`;
        scrollBottom();
      }
    },
  };

  /* ── history ────────────────────────────────────────────── */
  commands['history'] = {
    description: 'Show command history.',
    usage: 'history',
    run(_args, term) {
      if (state.history.length === 0) { term.dim('No history.'); return; }
      state.history.slice().reverse().forEach((cmd, i) => {
        term.print(`  ${String(i + 1).padStart(4)}  ${cmd}`, { cls: 'output--white' });
      });
    },
  };

  /* ── man ────────────────────────────────────────────────── */
  commands['man'] = {
    description: 'Display the manual for a command.',
    usage: 'man <command>',
    run(args, term) {
      if (!args[1]) { term.error('man: what manual page do you want?'); return; }
      const name = args[1].toLowerCase();
      const cmd  = commands[name];
      if (!cmd) { term.error(`man: no manual entry for '${args[1]}'`); return; }

      term.blank();
      const header = appendLine('', {});
      header.innerHTML =
        `<span class="output--amber">NAME</span>`;
      scrollBottom();

      term.print(`       ${name} — ${cmd.description}`, { cls: 'output--white' });
      term.blank();

      const synHdr = appendLine('', {});
      synHdr.innerHTML = `<span class="output--amber">SYNOPSIS</span>`;
      scrollBottom();

      term.print(`       ${cmd.usage || name}`, { cls: 'output--dim' });
      term.blank();
    },
  };

  /* ── neofetch ───────────────────────────────────────────── */
  commands['neofetch'] = {
    description: 'Display system info with ASCII art.',
    usage: 'neofetch',
    run(_args, term) {
      const abs     = cwdToAbs();
      const now     = new Date();
      const uptimeEl = document.getElementById('chrome-uptime');
      const uptimeStr = uptimeEl ? uptimeEl.textContent.trim() : 'just started';

      const logo = [
        '   ██████╗ ██╗  ██╗   ██╗',
        '   ██╔══██╗██║  ╚██╗ ██╔╝',
        '   ███████║██║   ╚████╔╝ ',
        '   ██╔══██║██║    ╚██╔╝  ',
        '   ██║  ██║███████╗██║   ',
        '   ╚═╝  ╚═╝╚══════╝╚═╝   ',
      ];

      const info = [
        `${state.user}@${state.host}`,
        '─'.repeat(state.user.length + state.host.length + 1),
        `OS:       alyhenr.dev v1.0.0`,
        `Shell:    terminal.js`,
        `PWD:      ${abs}`,
        `Uptime:   ${uptimeStr}`,
        `Date:     ${now.toDateString()}`,
        `Term:     xterm-256color`,
        `Pages:    5 (home, projects, blog, contact, games)`,
      ];

      term.blank();
      const maxLines = Math.max(logo.length, info.length);
      for (let i = 0; i < maxLines; i++) {
        const l = logo[i] || '';
        const r = info[i] || '';
        const el = appendLine('', {});
        el.innerHTML =
          `<span class="output--bright" style="display:inline-block;width:28ch;">${escHtml(l)}</span>` +
          `<span class="output--white">${escHtml(r)}</span>`;
        scrollBottom();
      }
      term.blank();
    },
  };

  /* ── grep ───────────────────────────────────────────────── */
  commands['grep'] = {
    description: 'Search virtual file contents for a pattern.',
    usage: 'grep <pattern> [file]',
    run(args, term) {
      const fs = FS();
      if (!fs) { term.error('grep: filesystem not loaded'); return; }

      if (!args[1]) { term.error('grep: missing pattern'); return; }
      const pattern = args[1];
      const fileArg = args[2];

      let re;
      try { re = new RegExp(pattern, 'gi'); }
      catch (e) { term.error(`grep: invalid pattern: ${e.message}`); return; }

      // Which paths to search
      const paths = fileArg
        ? [fs.resolve(cwdToAbs(), fileArg)]
        : Object.keys(fs.contents);

      let totalMatches = 0;
      for (const p of paths) {
        const content = fs.getContent(p);
        if (!content) continue;
        const lines = content.split('\n');
        lines.forEach((line, lineNo) => {
          re.lastIndex = 0;
          if (re.test(line)) {
            totalMatches++;
            const el = appendLine('', {});
            el.innerHTML =
              `<span class="output--dim">${escHtml(p)}:${lineNo + 1}:</span>` +
              `<span class="output--white">${escHtml(line)}</span>`;
            scrollBottom();
          }
        });
      }

      if (totalMatches === 0) term.dim('(no matches)');
    },
  };

  /* ── alias check ────────────────────────────────────────── */
  commands['ll'] = {
    description: 'Alias for ls -l.',
    usage: 'll [path]',
    run(args, term) { commands['ls'].run(['ls', '-l', ...args.slice(1)], term); },
  };

  commands['la'] = {
    description: 'Alias for ls -la.',
    usage: 'la [path]',
    run(args, term) { commands['ls'].run(['ls', '-l', '-a', ...args.slice(1)], term); },
  };

  /* ================================================================
     OUTPUT RENDERER
     ================================================================ */

  function appendLine(text, opts = {}) {
    const { cls = '', animate = false, delay = 0 } = opts;
    const el = document.createElement('div');
    el.className = 'output' + (cls ? ' ' + cls : '');
    el.textContent = text;
    if (animate) el.classList.add('line-reveal');
    if (delay)   el.style.animationDelay = delay + 'ms';
    state.outputEl.appendChild(el);
    scrollBottom();
    return el;
  }

  function appendPromptLine(rawInput) {
    const cwd = state.cwd === '~' ? '~' : (state.cwd || '/');
    const row = document.createElement('div');
    row.className = 'prompt';
    row.innerHTML =
      `<span class="prompt__user">${escHtml(state.user)}</span>` +
      `<span class="prompt__at">@</span>` +
      `<span class="prompt__host">${escHtml(state.host)}</span>` +
      `<span class="prompt__sep">:</span>` +
      `<span class="prompt__path">${escHtml(cwd)}</span>` +
      `<span class="prompt__sigil">$</span> ` +
      `<span class="prompt__command">${escHtml(rawInput)}</span>`;
    state.outputEl.appendChild(row);
    scrollBottom();
  }

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
    const content = state.outputEl
      ? state.outputEl.closest('.terminal-content') || state.outputEl.parentElement
      : null;
    if (content) {
      content.scrollTop = content.scrollHeight;
    }
    // Belt-and-suspenders: ensure the input row is always visible
    if (state.inputEl) {
      state.inputEl.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ================================================================
     INPUT HANDLING
     ================================================================ */

  function handleSubmit(rawInput) {
    const input = rawInput.trim();
    if (!input) { scrollBottom(); return; }

    appendPromptLine(input);

    if (state.history[0] !== input) {
      state.history.unshift(input);
      if (state.history.length > 200) state.history.pop();
    }
    state.historyIdx  = -1;
    state.pendingInput = '';

    const args    = parseArgs(input);
    const cmdName = args[0] ? args[0].toLowerCase() : '';
    const cmd     = commands[cmdName];

    if (!cmd) {
      appendLine(
        `${cmdName}: command not found — type  help  for available commands.`,
        { cls: 'output--error' }
      );
    } else {
      try { cmd.run(args, Terminal); }
      catch (err) {
        appendLine(`Error executing '${cmdName}': ${err.message}`, { cls: 'output--error' });
        console.error(err);
      }
    }

    appendLine(''); // blank spacer
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
      appendLine('');
      input.value = '';
      state.historyIdx = -1;
    }
  }

  /* ── Tab completion ─────────────────────────────────────── */

  // Commands that take a FS path as their second argument
  const PATH_CMDS = new Set(['cd', 'ls', 'cat', 'tree', 'find', 'll', 'la']);

  function handleTabComplete(inputEl) {
    const val   = inputEl.value;
    const parts = val.trimStart().split(/\s+/);

    if (parts.length <= 1) {
      // Complete command name
      const partial = parts[0].toLowerCase();
      const matches = Object.keys(commands).filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        inputEl.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        appendPromptLine(val);
        appendLine(matches.sort().join('   '), { cls: 'output--dim' });
      }
      return;
    }

    // Complete path argument for path-aware commands
    const cmdName = parts[0].toLowerCase();
    if (!PATH_CMDS.has(cmdName)) return;

    const fs = FS();
    if (!fs) return;

    const partial  = parts[parts.length - 1] || '';
    const absBase  = cwdToAbs();

    // Get everything up to the last '/' in the partial path
    const lastSlash = partial.lastIndexOf('/');
    const dirPart   = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : '';
    const filePart  = partial.slice(lastSlash + 1);

    const searchDir = dirPart
      ? fs.resolve(absBase, dirPart)
      : absBase;

    const kids = fs.children(searchDir);
    const matches = kids.filter(({ name }) => name.startsWith(filePart));

    if (matches.length === 1) {
      const { name, node } = matches[0];
      const suffix = node.type === 'dir' ? '/' : ' ';
      // Replace the last token in the input with the completed path
      const tokens = val.trimStart().split(/\s+/);
      tokens[tokens.length - 1] = dirPart + name + suffix;
      inputEl.value = tokens.join(' ');
    } else if (matches.length > 1) {
      appendPromptLine(val);
      appendLine(matches.map(({ name, node: n }) => name + (n.type === 'dir' ? '/' : '')).join('   '), { cls: 'output--dim' });
    }
  }

  /* ── Argument parser ────────────────────────────────────── */

  function parseArgs(input) {
    const args = [];
    let current = '';
    let inQuote = null;
    for (const ch of input) {
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
        else current += ch;
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

  /* ── CWD helpers ────────────────────────────────────────── */

  /** Return the canonical absolute path for the current CWD */
  function cwdToAbs() {
    if (!state.cwd || state.cwd === '~') return '/';
    return state.cwd;
  }

  /** Update every prompt element on the page to reflect the new CWD */
  function updatePromptCwd(absPath) {
    // Update the live input prompt span
    const cwdEl = document.getElementById('input-cwd');
    if (cwdEl) cwdEl.textContent = absPath;

    // Update chrome header
    if (window.chrome && typeof window.chrome.setCwd === 'function') {
      window.chrome.setCwd(absPath);
    }
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

  /* ================================================================
     PUBLIC API
     ================================================================ */

  const Terminal = {
    init(options = {}) {
      Object.assign(state, options);

      // Normalise incoming cwd
      if (!state.cwd || state.cwd === '~') state.cwd = '/';

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

      state.inputEl.addEventListener('keydown', handleKeyDown);

      // Focus input on click anywhere in content area
      const content = state.outputEl.closest('.terminal-content');
      if (content) {
        content.addEventListener('click', () => {
          if (!window.getSelection().toString()) state.inputEl.focus();
        });
      }

      // Set initial prompt path in both places
      updatePromptCwd(cwdToAbs());
      state.inputEl.focus();
    },

    register(name, cmd) { commands[name.toLowerCase()] = cmd; },
    unregister(name)    { delete commands[name.toLowerCase()]; },

    run(input) { handleSubmit(input); },

    /* Output helpers */
    print(text, opts = {})  { return appendLine(text, opts); },
    error(text)             { return appendLine(text, { cls: 'output--error' }); },
    success(text)           { return appendLine(text, { cls: 'output--success' }); },
    warn(text)              { return appendLine(text, { cls: 'output--warning' }); },
    dim(text)               { return appendLine(text, { cls: 'output--dim' }); },
    blank()                 { return appendLine(''); },

    type(text, opts = {})   { return typeText(text, opts); },

    printLines(lines, stagger = 50) {
      lines.forEach((line, i) => appendLine(line, { animate: true, delay: i * stagger }));
    },

    lsTable(entries) {
      const wrapper = document.createElement('div');
      wrapper.className = 'ls-table';
      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'ls-entry' + (entry.href ? ' ls-entry--clickable' : '');
        if (entry.href) {
          row.addEventListener('click', () => { navTo(entry.href); });
          row.setAttribute('role', 'link');
          row.setAttribute('tabindex', '0');
          row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') navTo(entry.href);
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

    clear() { if (state.outputEl) state.outputEl.innerHTML = ''; },

    setCwd(path) {
      state.cwd = path;
      updatePromptCwd(path);
    },

    get commands() { return { ...commands }; },
    get cwd()      { return cwdToAbs(); },
  };

  window.Terminal = Terminal;
})();
