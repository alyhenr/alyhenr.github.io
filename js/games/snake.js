/**
 * snake.js — Classic Snake game engine
 *
 * Pure game logic. Reads CSS custom properties from the page's
 * :root to stay in sync with the terminal color theme.
 *
 * Public API:
 *   Snake.init(canvasEl, callbacks)
 *   Snake.pause()
 *   Snake.resume()
 *   Snake.restart()
 *   Snake.destroy()
 *
 * Callbacks object:
 *   onScore(score)   — called whenever score increases
 *   onDeath(score)   — called when the snake dies
 *   onPause(paused)  — called when pause state changes
 */

(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────── */

  const GRID       = 20;    // cell size in px
  const TICK_BASE  = 130;   // ms per step at score 0
  const TICK_MIN   = 60;    // fastest possible tick
  const SPEED_STEP = 5;     // score points needed to speed up 1 tick
  const SPEED_GAIN = 3;     // ms to subtract per SPEED_STEP

  /* ── Color helpers ──────────────────────────────────────── */

  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim() || '#000';
  }

  /* ── Game state ─────────────────────────────────────────── */

  const state = {
    canvas:     null,
    ctx:        null,
    cols:       0,
    rows:       0,
    snake:      [],       // [{x, y}], head at index 0
    dir:        { x: 1, y: 0 },
    nextDir:    { x: 1, y: 0 },
    food:       null,
    score:      0,
    highScore:  0,
    running:    false,
    paused:     false,
    dead:       false,
    tickId:     null,
    callbacks:  {},
  };

  /* ── Init ───────────────────────────────────────────────── */

  function init(canvasEl, callbacks = {}) {
    if (state.tickId) destroy();

    state.canvas    = canvasEl;
    state.ctx       = canvasEl.getContext('2d');
    state.callbacks = callbacks;

    resize();
    bindKeys();
    restart();
  }

  function resize() {
    const c = state.canvas;
    // Snap canvas dimensions to grid
    state.cols = Math.floor(c.clientWidth  / GRID) || 20;
    state.rows = Math.floor(c.clientHeight / GRID) || 20;
    c.width    = state.cols * GRID;
    c.height   = state.rows * GRID;
  }

  /* ── Game loop ──────────────────────────────────────────── */

  function restart() {
    clearTimeout(state.tickId);

    const midC = Math.floor(state.cols / 2);
    const midR = Math.floor(state.rows / 2);

    state.snake   = [
      { x: midC,     y: midR },
      { x: midC - 1, y: midR },
      { x: midC - 2, y: midR },
    ];
    state.dir      = { x: 1, y: 0 };
    state.nextDir  = { x: 1, y: 0 };
    state.score    = 0;
    state.paused   = false;
    state.dead     = false;
    state.running  = true;

    placeFood();
    draw();
    scheduleTick();

    if (state.callbacks.onScore) state.callbacks.onScore(0);
  }

  function scheduleTick() {
    if (!state.running || state.paused || state.dead) return;
    const speedTier = Math.floor(state.score / SPEED_STEP);
    const delay     = Math.max(TICK_MIN, TICK_BASE - speedTier * SPEED_GAIN);
    state.tickId    = setTimeout(tick, delay);
  }

  function tick() {
    if (!state.running || state.paused || state.dead) return;

    state.dir = { ...state.nextDir };

    const head = state.snake[0];
    const next = {
      x: (head.x + state.dir.x + state.cols) % state.cols,
      y: (head.y + state.dir.y + state.rows) % state.rows,
    };

    // Self-collision
    if (state.snake.some(s => s.x === next.x && s.y === next.y)) {
      die();
      return;
    }

    state.snake.unshift(next);

    // Ate food?
    if (next.x === state.food.x && next.y === state.food.y) {
      state.score++;
      if (state.score > state.highScore) state.highScore = state.score;
      if (state.callbacks.onScore) state.callbacks.onScore(state.score, state.highScore);
      placeFood();
    } else {
      state.snake.pop();
    }

    draw();
    scheduleTick();
  }

  function die() {
    state.dead    = true;
    state.running = false;
    clearTimeout(state.tickId);
    drawDead();
    if (state.callbacks.onDeath) state.callbacks.onDeath(state.score, state.highScore);
  }

  /* ── Food placement ─────────────────────────────────────── */

  function placeFood() {
    const occupied = new Set(state.snake.map(s => `${s.x},${s.y}`));
    let f;
    do {
      f = {
        x: Math.floor(Math.random() * state.cols),
        y: Math.floor(Math.random() * state.rows),
      };
    } while (occupied.has(`${f.x},${f.y}`));
    state.food = f;
  }

  /* ── Drawing ────────────────────────────────────────────── */

  function draw() {
    const { ctx, canvas, cols, rows, snake, food } = state;
    const bg     = cssVar('--color-bg');
    const bgSurf = cssVar('--color-bg-surface');
    const fg     = cssVar('--color-fg');
    const fgBrt  = cssVar('--color-fg-bright');
    const fgDim  = cssVar('--color-fg-dim');
    const amber  = cssVar('--color-amber');
    const border = cssVar('--color-border');

    // Background
    ctx.fillStyle = bgSurf;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.3;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID, 0);
      ctx.lineTo(x * GRID, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID);
      ctx.lineTo(canvas.width, y * GRID);
      ctx.stroke();
    }

    // Food — blinking amber square with glow
    if (food) {
      ctx.shadowColor = amber;
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = amber;
      const fp = GRID * 0.25;
      ctx.fillRect(food.x * GRID + fp, food.y * GRID + fp, GRID - fp * 2, GRID - fp * 2);
      ctx.shadowBlur = 0;
    }

    // Snake body
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const alpha  = isHead ? 1 : Math.max(0.25, 1 - (i / snake.length) * 0.75);

      ctx.shadowColor = isHead ? fgBrt : fg;
      ctx.shadowBlur  = isHead ? 6 : 2;

      ctx.fillStyle = isHead
        ? fgBrt
        : i === 1
          ? fg
          : fgDim;
      ctx.globalAlpha = alpha;

      const pad = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * GRID + pad,
        seg.y * GRID + pad,
        GRID - pad * 2,
        GRID - pad * 2
      );
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  function drawDead() {
    draw(); // draw final frame first

    const { ctx, canvas } = state;
    const fg    = cssVar('--color-fg');
    const amber = cssVar('--color-amber');
    const bg    = cssVar('--color-bg');

    // Dark overlay
    ctx.fillStyle = 'rgba(10, 10, 10, 0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // "GAME OVER" text
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.font         = `bold 22px "JetBrains Mono", monospace`;
    ctx.fillStyle    = amber;
    ctx.shadowColor  = amber;
    ctx.shadowBlur   = 12;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 22);

    ctx.shadowBlur   = 0;
    ctx.font         = `14px "JetBrains Mono", monospace`;
    ctx.fillStyle    = fg;
    ctx.fillText(`SCORE: ${state.score}`, canvas.width / 2, canvas.height / 2 + 8);

    ctx.font         = `12px "JetBrains Mono", monospace`;
    ctx.fillStyle    = cssVar('--color-fg-dim');
    ctx.fillText('press R or type restart', canvas.width / 2, canvas.height / 2 + 32);
  }

  function drawPaused() {
    draw();

    const { ctx, canvas } = state;
    const fg    = cssVar('--color-fg');
    const fgDim = cssVar('--color-fg-dim');

    ctx.fillStyle = 'rgba(10, 10, 10, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 18px "JetBrains Mono", monospace`;
    ctx.fillStyle    = fg;
    ctx.shadowColor  = fg;
    ctx.shadowBlur   = 8;
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 10);

    ctx.shadowBlur = 0;
    ctx.font       = `12px "JetBrains Mono", monospace`;
    ctx.fillStyle  = fgDim;
    ctx.fillText('press P or type resume', canvas.width / 2, canvas.height / 2 + 14);
  }

  /* ── Controls ───────────────────────────────────────────── */

  const DIR_MAP = {
    ArrowUp:    { x:  0, y: -1 },
    ArrowDown:  { x:  0, y:  1 },
    ArrowLeft:  { x: -1, y:  0 },
    ArrowRight: { x:  1, y:  0 },
    w: { x:  0, y: -1 }, W: { x:  0, y: -1 },
    s: { x:  0, y:  1 }, S: { x:  0, y:  1 },
    a: { x: -1, y:  0 }, A: { x: -1, y:  0 },
    d: { x:  1, y:  0 }, D: { x:  1, y:  0 },
  };

  function onKeyDown(e) {
    const newDir = DIR_MAP[e.key];
    if (newDir) {
      // Prevent reversing directly into itself
      if (newDir.x !== -state.dir.x || newDir.y !== -state.dir.y) {
        state.nextDir = newDir;
      }
      // Prevent page scroll on arrow keys when game is focused
      e.preventDefault();
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      if (state.paused) resume(); else pause();
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      restart();
      return;
    }
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
  }

  /* ── Public controls ────────────────────────────────────── */

  function pause() {
    if (state.dead || !state.running) return;
    state.paused = true;
    clearTimeout(state.tickId);
    drawPaused();
    if (state.callbacks.onPause) state.callbacks.onPause(true);
  }

  function resume() {
    if (!state.paused) return;
    state.paused = false;
    draw();
    scheduleTick();
    if (state.callbacks.onPause) state.callbacks.onPause(false);
  }

  function destroy() {
    clearTimeout(state.tickId);
    document.removeEventListener('keydown', onKeyDown);
    state.running = false;
    state.canvas  = null;
    state.ctx     = null;
  }

  /* ── Expose ─────────────────────────────────────────────── */

  window.Snake = { init, pause, resume, restart, destroy };
})();
