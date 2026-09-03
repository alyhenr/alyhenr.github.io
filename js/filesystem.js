/**
 * filesystem.js — Virtual site filesystem
 *
 * Defines the site's page/file structure as a Unix-like path tree.
 * Used by terminal commands: ls, cd, pwd, tree, cat, find.
 *
 * ── Updating the filesystem ────────────────────────────────
 *
 * When you add a new page or blog post:
 *   1. Add a node entry to FS.nodes
 *   2. If it has readable content, add it to FS.contents
 *
 * Node shape:
 *   { type: 'dir'|'file', href?, size?, date?, desc?, perms? }
 *
 *   href  — if present, `cd` and `open` will navigate there
 *   size  — display string ('4.2kb', '--', etc.)
 *   date  — display string ('2025-06', 'YYYY-MM')
 *   desc  — one-line description shown in ls -l
 *   perms — overrides default perms string
 *
 * ──────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Node definitions ───────────────────────────────────── */

  const nodes = {
    '/': {
      type: 'dir',
      desc: 'home directory',
    },

    /* Root-level files */
    '/status.txt': {
      type: 'file',
      size: '1.2kb',
      date: '2025-06',
      desc: 'Site status & contact info',
      perms: '-r--r--r--',
    },
    '/whoami': {
      type: 'file',
      size: '0.6kb',
      date: '2025-06',
      desc: 'User profile',
      perms: '-r--r--r--',
    },

    /* Projects */
    '/projects': {
      type: 'dir',
      href: 'projects.html',
      date: '2024-11',
      desc: 'Portfolio of projects',
    },
    '/projects/project-alpha': {
      type: 'file',
      href: 'projects.html',
      size: '12.4kb',
      date: '2024-11',
      desc: 'A short description of this project',
      perms: '-rwxr-xr-x',
    },
    '/projects/project-beta': {
      type: 'file',
      href: 'projects.html',
      size: '8.1kb',
      date: '2025-03',
      desc: 'Another project — one-line description',
      perms: '-rwxr-xr-x',
    },

    /* Plugins — browser extensions.
       Metadata for these pages lives in js/plugins.js; the entries here
       exist so the terminal's ls/cd/cat can reach them. */
    '/plugins': {
      type: 'dir',
      href: 'plugins/index.html',
      date: '2026-07',
      desc: 'Browser extensions & their privacy policies',
    },
    '/plugins/alvaras': {
      type: 'dir',
      href: 'plugins/alvaras/index.html',
      date: '2026-07',
      desc: 'Alvarás — controle de vencimento (Chrome, Firefox)',
    },
    '/plugins/alvaras/privacidade': {
      type: 'dir',
      href: 'plugins/alvaras/privacidade/index.html',
      date: '2026-07',
      desc: 'Política de privacidade — URL estável, não mover',
    },

    /* Blog */
    '/blog': {
      type: 'dir',
      href: 'blog.html',
      date: '2025-06',
      desc: 'Writing & notes',
    },
    '/blog/first-post.md': {
      type: 'file',
      href: 'blog/first-post.html',
      size: '4.2kb',
      date: '2025-06',
      desc: 'Your first blog post — add a short teaser here',
      perms: '-r--r--r--',
    },

    /* Contact */
    '/contact': {
      type: 'dir',
      href: 'contact.html',
      date: '2025-06',
      desc: 'Contact info & message form',
    },

    /* Games */
    '/games': {
      type: 'dir',
      href: 'games.html',
      date: '2025-06',
      desc: 'Playable browser games',
    },
    '/games/snake': {
      type: 'file',
      href: 'games/snake.html',
      size: '8kb',
      date: '2025-06',
      desc: 'Classic snake — terminal edition',
      perms: '-rwxr-xr-x',
    },
  };

  /* ── Virtual file contents ──────────────────────────────── */
  /* Returned by `cat <path>`. Update with your real content. */

  const contents = {
    '/status.txt': [
      'LOCATION   Brazil',
      'FOCUS      Software Engineering · Systems · Open Source',
      'CONTACT    alyssonhenr99@gmail.com',
      'STATUS     Open to interesting projects',
    ].join('\n'),

    '/whoami': [
      'Software developer & tinkerer.',
      'I build things that interest me and write about what I learn.',
      'This is my corner of the internet —',
      'part portfolio, part notebook, part playground.',
    ].join('\n'),
  };

  /* ── Path helpers ───────────────────────────────────────── */

  /**
   * Normalize a path: remove trailing slash (except root), collapse
   * double slashes, resolve . and .. segments.
   */
  function normalize(path) {
    if (!path || path === '/') return '/';

    // Split on / and process each segment
    const parts = path.split('/');
    const resolved = [];

    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    return '/' + resolved.join('/');
  }

  /**
   * Resolve a path relative to a cwd.
   *
   * resolve('~', '../blog/first-post') → '/blog/first-post'
   * resolve('/games', '..') → '/'
   * resolve('/blog', './first-post.md') → '/blog/first-post.md'
   * resolve('/blog', '/projects') → '/projects'  (absolute)
   *
   * @param {string} cwd  — current working directory (canonical abs path or '~')
   * @param {string} path — the path to resolve
   * @returns {string} — canonical absolute path
   */
  function resolve(cwd, path) {
    if (!path || path === '~' || path === '/') return '/';

    // Absolute path — normalize directly
    if (path.startsWith('/')) return normalize(path);

    // Relative — join with cwd first
    const base = cwd === '~' ? '/' : (cwd || '/');
    return normalize(base + '/' + path);
  }

  /**
   * Get a node by its absolute path.
   * @returns {Object|null}
   */
  function get(absPath) {
    return nodes[absPath] || null;
  }

  /**
   * Check if a path exists.
   */
  function exists(absPath) {
    return absPath in nodes;
  }

  /**
   * List direct children of a directory path.
   * Returns array of { name: string, path: string, node: Object }.
   *
   * @param {string} absPath — absolute path of a directory
   */
  function children(absPath) {
    const base = absPath === '/' ? '/' : absPath + '/';
    const result = [];

    for (const [path, node] of Object.entries(nodes)) {
      if (path === absPath) continue;
      if (!path.startsWith(base)) continue;

      // Only direct children — no further '/' after the base prefix
      const rest = path.slice(base.length);
      if (rest.includes('/')) continue;

      result.push({
        name: rest,
        path,
        node,
      });
    }

    // Sort: dirs first, then files, alphabetically within each group
    result.sort((a, b) => {
      if (a.node.type !== b.node.type) {
        return a.node.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  /**
   * Get all paths (flat list), optionally filtered by a glob-style
   * pattern (only * wildcard, matched against the basename).
   *
   * @param {string} [pattern] — optional basename pattern, e.g. '*.md'
   * @returns {string[]}
   */
  function allPaths(pattern) {
    const paths = Object.keys(nodes).filter(p => p !== '/');
    if (!pattern) return paths;

    // Convert simple glob to regex: only * supported
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return paths.filter(p => {
      const base = p.split('/').pop();
      return re.test(base);
    });
  }

  /**
   * Register new nodes at runtime (call from individual page scripts
   * to add their own content without editing this file).
   *
   * FS.register('/blog/new-post.md', {
   *   type: 'file', href: 'blog/new-post.html',
   *   size: '3kb', date: '2025-07', desc: '...'
   * });
   */
  function register(path, node, content) {
    nodes[normalize(path)] = node;
    if (content) contents[normalize(path)] = content;
  }

  /**
   * Get the virtual file content for `cat`.
   * Returns string or null.
   */
  function getContent(absPath) {
    return contents[absPath] || null;
  }

  /* ── Expose as window.FS ────────────────────────────────── */

  window.FS = {
    nodes,      // direct access for advanced use
    contents,   // direct access for advanced use
    normalize,
    resolve,
    get,
    exists,
    children,
    allPaths,
    register,
    getContent,
  };
})();
