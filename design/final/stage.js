/*
 * stage.js: how the home drives the stage (the reference the build copies).
 *
 * The page owns the scroll. It turns the scroll through the spine into `progress` 0–1, mapped
 * piecewise so each beat section covers its share of the scene (design/scenes/traco-wireframe.md):
 *   hero 0–.15 · Conversa .15–.30 · Proposta .30–.50 · Sinal .50–.72 · Entrega .72–.90 · O site é seu .90–1
 * With the plates (now, and as the fallback) it shows plate 1 below .30, 2 below .50, 3 below .72,
 * then 4, crossfading 400 ms. The step counter follows the section in view ("Passo N de 4").
 *
 * When Studio's package exists, mountScene() loads it after the first paint, on capable devices
 * only, and hands it { progress, reducedMotion, palette }; its `ready` event fades the plates
 * out, its `beat` event is informational (the counter stays on the sections). Without JS the
 * first plate stays and every beat's text reads on its own.
 */
(function () {
  'use strict';
  var spine = document.querySelector('[data-spine]');
  if (!spine) return;
  var stage = spine.querySelector('.stage');
  var plates = stage.querySelectorAll('[data-plate]');
  var counter = stage.querySelector('[data-progress]');
  var label = stage.querySelector('[data-progress-label]');
  var bars = counter.querySelectorAll('.bars span');
  var beats = spine.querySelectorAll('[data-beat]');
  var RANGES = [[0, .15], [.15, .30], [.30, .50], [.50, .72], [.72, .90], [.90, 1]];
  var PLATE_AT = [.30, .50, .72]; // plate n+1 from this progress on
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = { progress: 0, plate: 0, step: -1, scene: null };

  counter.hidden = false;

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function measure() {
    var line = window.innerHeight / 2; // a section counts once its top passes the middle
    var i = 0;
    for (var k = 0; k < beats.length; k++) if (beats[k].getBoundingClientRect().top <= line) i = k;
    var r = beats[i].getBoundingClientRect();
    var local = clamp((line - r.top) / r.height);
    var range = RANGES[Number(beats[i].getAttribute('data-beat'))];
    return { section: Number(beats[i].getAttribute('data-beat')), progress: range[0] + local * (range[1] - range[0]) };
  }

  function showPlate(n) {
    if (n === state.plate) return;
    state.plate = n;
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
  frame();

  /* ---- Studio's scene (not in the mock: the package isn't here yet) ---- */
  function palette() {
    var css = getComputedStyle(document.documentElement);
    var get = function (n) { return css.getPropertyValue(n).trim(); };
    return { background: get('--stage'), chalk: get('--chalk'), dim: get('--chalk-dim'), grid: get('--stage-grid'), amber: get('--amber') };
  }
  function capable() {
    var c = navigator.connection || {};
    if (reduce.matches || c.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2)) return false;
    var gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    return !!gl;
  }
  function mountScene(load) { // load: () => import('<the package>')
    if (!capable()) return;
    var host = stage.querySelector('[data-scene-host]');
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
    idle(function () {
      load().then(function (pkg) {
        var scene = pkg.mount(host, { progress: state.progress, reducedMotion: reduce.matches, palette: palette() });
        host.addEventListener('ready', function () { stage.classList.add('is-live'); state.scene = scene; });
        host.addEventListener('beat', function (e) { stage.setAttribute('data-scene-beat', e.detail); });
        reduce.addEventListener('change', function () {
          scene.set({ reducedMotion: reduce.matches });
          if (reduce.matches) { stage.classList.remove('is-live'); state.scene = null; }
        });
      }).catch(function () { /* the plates stay */ });
    });
  }
  window.TracoStage = { mountScene: mountScene, state: state };
})();
