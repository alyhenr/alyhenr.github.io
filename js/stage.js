/*
 * stage.js: the home's sticky stage (DESIGN.md, "How the page drives the stage";
 * design/scenes/traco-wireframe.md). A classic script, no dependencies.
 *
 * The page owns the scroll. It turns the scroll through the spine into `progress` 0–1, piecewise
 * so each beat section covers its share of the scene (the scene's beats start at 0, .30, .50,
 * .72 and .90):
 *   hero 0–.15 · Conversa .15–.30 · Proposta .30–.50 · Sinal .50–.72 · Entrega .72–.90 · O site é seu .90–1
 * The plates (Studio's, rendered from the scene at each beat) are the stage until the scene is
 * ready and its fallback: plate 1 below .30, 2 below .50, 3 below .72, 4 below .90, then 5,
 * crossfading 400 ms (also the reduced-motion version). The step counter follows the section in
 * view, or, while the scene is live, the scene's own beat. Without JS, plate 1 stays.
 *
 * Studio's scene (vendor/studio/traco-wireframe, bundled with three into the module the stage's
 * `data-scene-src` names) is loaded after `load` and the first paint, when the browser is idle,
 * and only with WebGL 2, no reduced motion, no Save-Data and deviceMemory > 2. Its interface
 * (its README):
 *   mount(host, { progress, reducedMotion, palette, onReady({ firstFrameMs }), onBeat(n), onError(reason) })
 *     → { update(partial), destroy() }
 *   palette: { background, vignette, chalk, dim, grid, amber } (from css/tokens.css)
 * onReady fades the plates out (.stage.is-live), unless firstFrameMs is over 50 ms (a weak
 * device: destroy, keep the plates). onBeat (1–5) drives the counter. onError, a failed load or
 * reduced motion turning on puts the plates back. window.TracoStage exposes mountScene(), the
 * state (`reason` says why the scene isn't live), refusal() and `auto` (the page's own mount, a
 * promise of whether it went live) for the QA.
 */
(function () {
  'use strict';
  var spine = document.querySelector('[data-spine]');
  if (!spine) return;
  var stage = spine.querySelector('.stage');
  var host = stage.querySelector('[data-scene-host]');
  var plates = stage.querySelectorAll('[data-plate]');
  var counter = stage.querySelector('[data-progress]');
  var label = stage.querySelector('[data-progress-label]');
  var bars = counter.querySelectorAll('.bars span');
  var beats = spine.querySelectorAll('[data-beat]');
  var RANGES = [[0, .15], [.15, .30], [.30, .50], [.50, .72], [.72, .90], [.90, 1]];
  var PLATE_AT = [.30, .50, .72, .90]; // plate n+1 from this progress on
  var SLOW_FIRST_FRAME_MS = 50;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = { progress: 0, section: 0, plate: 1, step: -1, scene: null, mounted: null, live: false, beat: 0, firstFrameMs: null, reason: '', loads: 0, token: null };

  counter.hidden = false;

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function measure() {
    var line = window.innerHeight / 2; // a section counts once its top passes the middle
    var i = 0;
    for (var k = 0; k < beats.length; k++) if (beats[k].getBoundingClientRect().top <= line) i = k;
    var r = beats[i].getBoundingClientRect();
    var local = clamp((line - r.top) / r.height);
    var section = Number(beats[i].getAttribute('data-beat'));
    var range = RANGES[section];
    return { section: section, progress: range[0] + local * (range[1] - range[0]) };
  }

  function showPlate(n) {
    if (n === state.plate) return;
    state.plate = n;
    stage.setAttribute('data-plate-on', n);
    for (var k = 0; k < plates.length; k++) plates[k].classList.toggle('is-on', Number(plates[k].getAttribute('data-plate')) === n);
  }

  /**
   * The step the counter shows: the section in view, or, while the scene is live, the scene's beat
   * (it eases behind the scroll, and the counter waits for it). Beat 1 spans the hero and Conversa,
   * so there the section tells them apart; the finale (beat 5) holds step 4.
   */
  function stepNow() {
    if (state.live && state.beat) return state.beat === 1 ? Math.min(state.section, 1) : Math.min(state.beat, 4);
    return Math.min(state.section, 4);
  }

  function showStep() {
    var step = stepNow();
    if (step === state.step) return;
    state.step = step;
    label.textContent = step === 0 ? 'Como funciona' : 'Passo ' + step + ' de 4';
    for (var k = 0; k < bars.length; k++) bars[k].classList.toggle('is-on', k < step);
  }

  var queued = false;
  function frame() {
    queued = false;
    var m = measure();
    state.progress = m.progress;
    state.section = m.section;
    var n = 1;
    for (var k = 0; k < PLATE_AT.length; k++) if (m.progress >= PLATE_AT[k]) n = k + 2;
    showPlate(n);
    showStep();
    var scene = state.scene || state.mounted; // a scene still getting ready takes the scroll too
    if (scene) scene.update({ progress: m.progress });
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  stage.setAttribute('data-plate-on', 1);
  frame();

  /* ---- Studio's scene ---- */
  function palette() {
    var css = getComputedStyle(document.documentElement);
    var get = function (n) { return css.getPropertyValue(n).trim(); };
    return { background: get('--stage'), vignette: get('--stage-vignette'), chalk: get('--chalk'), dim: get('--chalk-dim'), grid: get('--stage-grid'), amber: get('--amber') };
  }

  /** Why this browser gets the plates and not the scene ('' when it can run it). */
  function refusal() {
    var c = navigator.connection || {};
    if (reduce.matches) return 'reduced-motion';
    if (c.saveData) return 'save-data';
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) return 'weak-device';
    try {
      var gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return 'no-webgl';
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext(); // the probe's context; the scene makes its own
      return '';
    } catch (e) {
      return 'no-webgl';
    }
  }

  function unmount() {
    var scene = state.scene || state.mounted;
    state.scene = null;
    state.mounted = null;
    state.live = false;
    state.beat = 0;
    state.token = null;
    stage.classList.remove('is-live');
    stage.removeAttribute('data-scene-beat');
    if (scene && typeof scene.destroy === 'function') { try { scene.destroy(); } catch (e) { /* plates stay */ } }
    showStep();
  }

  /**
   * load: () => Promise<module with mount()>. opts.check replaces the capability check (true: go)
   * and opts.slowFrameMs the first-frame budget (the QA's browsers render WebGL in software, on a
   * busy machine). Resolves true once the scene is live, false when the plates stay (state.reason
   * says why).
   */
  function mountScene(load, opts) {
    opts = opts || {};
    var why = !host ? 'no-host' : opts.check ? (opts.check() ? '' : 'refused') : refusal();
    state.reason = why;
    if (why) return Promise.resolve(false);
    var limit = opts.slowFrameMs || SLOW_FIRST_FRAME_MS;
    return new Promise(function (resolve) {
      var settled = false;
      function settle(live) {
        if (settled) return;
        settled = true;
        resolve(live);
      }
      var mine = {}; // this mount's token: a scene replaced since then is ignored
      function current() { return state.token === mine; }
      function fallBack(reason) {
        if (!current()) return settle(false); // a newer scene took the stage
        unmount();
        state.reason = reason;
        settle(false);
      }
      var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
      idle(function () {
        Promise.resolve().then(load).then(function (pkg) {
          var mount = pkg && (pkg.mount || (pkg.default && pkg.default.mount));
          if (typeof mount !== 'function') throw new Error('the scene package has no mount()');
          if (reduce.matches) { state.reason = 'reduced-motion'; return settle(false); } // turned on while it loaded
          unmount(); // one scene at a time
          state.token = mine;
          state.loads++;
          state.mounted = mount(host, {
            progress: state.progress,
            reducedMotion: false,
            palette: palette(),
            onReady: function (info) {
              if (!current() || !state.mounted) return;
              var ms = info && typeof info.firstFrameMs === 'number' ? info.firstFrameMs : 0;
              state.firstFrameMs = ms;
              if (ms > limit) return fallBack('slow-first-frame');
              state.scene = state.mounted;
              state.live = true;
              stage.classList.add('is-live');
              state.reason = '';
              state.scene.update({ progress: state.progress });
              showStep();
              settle(true);
            },
            onBeat: function (n) {
              if (!current()) return;
              state.beat = Number(n) || 0;
              stage.setAttribute('data-scene-beat', state.beat);
              showStep();
            },
            onError: function () { if (current()) fallBack('error'); },
          });
        }).catch(function () {
          if (current()) return fallBack('error');
          if (!settled && !state.mounted) state.reason = 'error'; // it failed before mounting
          settle(false);
        });
      });
    });
  }

  reduce.addEventListener('change', function () {
    var scene = state.scene || state.mounted;
    if (scene) scene.update({ reducedMotion: reduce.matches });
    if (reduce.matches && scene) { unmount(); state.reason = 'reduced-motion'; }
  });

  window.TracoStage = { mountScene: mountScene, state: state, palette: palette, refusal: refusal };

  /**
   * Calls `go` once the page has painted its content (the first-contentful-paint entry; two frames
   * where paint timing is missing). `load` alone isn't enough: a fast load can come before it.
   */
  function afterFirstPaint(go) {
    var done = false;
    function once() { if (!done) { done = true; go(); } }
    var types = (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) || [];
    if (types.indexOf('paint') < 0) return requestAnimationFrame(function () { requestAnimationFrame(once); });
    if (performance.getEntriesByName('first-contentful-paint').length) return once();
    var po = new PerformanceObserver(function (list) {
      if (list.getEntriesByName('first-contentful-paint').length) { po.disconnect(); once(); }
    });
    po.observe({ type: 'paint', buffered: true });
    setTimeout(once, 3000); // a tab opened in the background paints nothing until it shows
  }

  var src = stage.getAttribute('data-scene-src');
  if (src) {
    var url = new URL(src, document.baseURI).href;
    // TracoStage.auto: the page's own mount, after `load` and the first paint (resolves to whether
    // it went live; mountScene then waits for the browser to be idle).
    var start = function () { afterFirstPaint(function () { window.TracoStage.auto = mountScene(function () { return import(url); }); }); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  }
})();
