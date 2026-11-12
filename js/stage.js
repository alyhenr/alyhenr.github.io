/*
 * stage.js: the home's sticky stage (DESIGN.md, "How the page drives the stage";
 * design/scenes/traco-wireframe.md). A classic script, no dependencies.
 *
 * The page owns the scroll. It turns the scroll through the spine into `progress` 0–1, piecewise
 * so each beat section covers its share of the scene:
 *   hero 0–.15 · Conversa .15–.30 · Proposta .30–.50 · Sinal .50–.72 · Entrega .72–.90 · O site é seu .90–1
 * With the plates (until Studio's scene is mounted, and as its fallback) it shows plate 1 below .30,
 * 2 below .50, 3 below .72, then 4, crossfading 400 ms (also the reduced-motion version). The step
 * counter follows the section in view. Without JS, plate 1 stays and every beat reads on its own.
 *
 * Studio's scene (traco-wireframe) drops in as an ES module named by the stage's `data-scene-src`
 * (empty until the package arrives). The contract:
 *   mount(host, { progress, reducedMotion, palette }) → { set(partial), destroy() }
 *   palette: { background, chalk, dim, grid, amber } (from css/tokens.css)
 *   host receives CustomEvent 'ready' (first frame drawn: the plates fade out) and
 *   'beat' (detail 1–5, when a beat starts: the stage's data-scene-beat follows it).
 * It loads after the first paint, only with WebGL, no reduced motion, no Save-Data and
 * deviceMemory > 2; a first frame slower than 50 ms, an error or reduced motion turning on
 * puts the plates back. window.TracoStage exposes mountScene() and the state (the QA uses them).
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
  var PLATE_AT = [.30, .50, .72]; // plate n+1 from this progress on
  var SLOW_FRAME_MS = 50;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = { progress: 0, plate: 1, step: -1, scene: null, live: false, beat: 0 };

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

  function showStep(section) {
    var step = Math.min(section, 4); // the finale holds step 4
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
    var n = 1;
    for (var k = 0; k < PLATE_AT.length; k++) if (m.progress >= PLATE_AT[k]) n = k + 2;
    showPlate(n);
    showStep(m.section);
    if (state.scene) state.scene.set({ progress: m.progress });
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
    return { background: get('--stage'), chalk: get('--chalk'), dim: get('--chalk-dim'), grid: get('--stage-grid'), amber: get('--amber') };
  }

  function capable() {
    var c = navigator.connection || {};
    if (reduce.matches || c.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2)) return false;
    try {
      var canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  function unmount() {
    var scene = state.scene || state.mounted;
    state.scene = null;
    state.mounted = null;
    state.live = false;
    stage.classList.remove('is-live');
    if (scene && typeof scene.destroy === 'function') { try { scene.destroy(); } catch (e) { /* plates stay */ } }
  }

  /**
   * The scene's first frames, right after `ready`: when the median time between five of them is
   * over `limit` ms, the device is too weak and gets the plates back (one slow frame isn't enough).
   */
  function framesAreFast(limit, done) {
    var times = [];
    function tick(t) {
      times.push(t);
      if (times.length < 6) return requestAnimationFrame(tick);
      var gaps = [];
      for (var k = 1; k < times.length; k++) gaps.push(times[k] - times[k - 1]);
      gaps.sort(function (a, b) { return a - b; });
      done(gaps[2] <= limit);
    }
    requestAnimationFrame(tick);
  }

  /**
   * load: () => Promise<module with mount()>. opts.check replaces the capability check and
   * opts.slowFrameMs the frame budget (the QA's stand-in scene runs in browsers without WebGL, on
   * a busy machine). Resolves true once the scene is live.
   */
  function mountScene(load, opts) {
    opts = opts || {};
    var check = opts.check || capable;
    if (!host || !check()) return Promise.resolve(false);
    return new Promise(function (resolve) {
      var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
      idle(function () {
        Promise.resolve().then(load).then(function (pkg) {
          var mount = pkg && (pkg.mount || (pkg.default && pkg.default.mount));
          if (typeof mount !== 'function') throw new Error('the scene package has no mount()');
          host.addEventListener('ready', function onReady() {
            host.removeEventListener('ready', onReady);
            framesAreFast(opts.slowFrameMs || SLOW_FRAME_MS, function (fast) {
              if (!fast || !state.mounted) { unmount(); return resolve(false); }
              state.scene = state.mounted;
              state.live = true;
              stage.classList.add('is-live');
              state.scene.set({ progress: state.progress });
              resolve(true);
            });
          });
          host.addEventListener('beat', function (e) {
            state.beat = Number(e.detail) || 0;
            stage.setAttribute('data-scene-beat', state.beat);
          });
          state.mounted = mount(host, { progress: state.progress, reducedMotion: reduce.matches, palette: palette() });
        }).catch(function () { unmount(); resolve(false); });
      });
    });
  }

  reduce.addEventListener('change', function () {
    var scene = state.scene || state.mounted;
    if (scene) scene.set({ reducedMotion: reduce.matches });
    if (reduce.matches) unmount();
  });

  window.TracoStage = { mountScene: mountScene, state: state, palette: palette };

  var src = stage.getAttribute('data-scene-src');
  if (src) {
    var url = new URL(src, document.baseURI).href;
    var start = function () { mountScene(function () { return import(url); }); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  }
})();
