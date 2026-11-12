/*
 * flow.js: live architecture diagrams, shared by the round-2 directions (same file in each folder).
 * Page work, not a Studio piece: an SVG drawn in the page, with small packets that travel its wires.
 *
 *   <div data-flow data-routes='[{"label":"…","wires":["w1","w2"]}]'>
 *     <svg>… <path id="w1" data-wire data-to="core"/> … <g data-node="core">…</g> …</svg>
 *     <ol data-flow-log></ol>   (optional: one line per route, newest first)
 *   </div>
 *
 * A packet runs each route wire by wire; the node a wire ends at lights up (.is-hot), the wire
 * it runs on is .is-live. Idle off screen and in a hidden tab; with prefers-reduced-motion
 * nothing moves and the log lists the routes as a still.
 */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function Flow(el) {
    this.el = el;
    this.svg = el.querySelector('svg');
    this.log = el.querySelector('[data-flow-log]');
    this.speed = Number(el.getAttribute('data-speed')) || 180; // viewBox units per second
    this.routes = [];
    try { this.routes = JSON.parse(el.getAttribute('data-routes') || '[]'); } catch (e) { this.routes = []; }
    this.i = 0;
    this.visible = false;
    this.running = false;
    this.timer = null;
    var self = this;
    if (reduce.matches || !this.routes.length) return this.still();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        self.visible = es[0].isIntersecting;
        self.visible ? self.play() : self.pause();
      }, { threshold: 0.15 }).observe(el);
    } else {
      this.visible = true;
      this.play();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? self.pause() : self.visible && self.play();
    });
  }

  Flow.prototype.still = function () {
    if (!this.log) return;
    this.log.innerHTML = '';
    var self = this;
    this.routes.forEach(function (r) { self.line(r.label, true); });
  };

  Flow.prototype.line = function (text, done) {
    if (!this.log || !text) return null;
    var li = document.createElement('li');
    li.textContent = text;
    if (done) li.className = 'is-done';
    if (this.log.getAttribute('data-order') === 'append') this.log.appendChild(li);
    else this.log.insertBefore(li, this.log.firstChild);
    while (this.log.children.length > (Number(this.log.getAttribute('data-max')) || 4)) {
      this.log.removeChild(this.log.getAttribute('data-order') === 'append' ? this.log.firstChild : this.log.lastChild);
    }
    return li;
  };

  Flow.prototype.play = function () {
    if (this.running) return;
    this.running = true;
    this.next();
  };

  Flow.prototype.pause = function () {
    this.running = false;
    clearTimeout(this.timer);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.dot) { this.dot.remove(); this.dot = null; }
    var live = this.svg.querySelectorAll('.is-live, .is-hot');
    for (var k = 0; k < live.length; k++) live[k].classList.remove('is-live', 'is-hot');
  };

  Flow.prototype.next = function () {
    if (!this.running) return;
    var route = this.routes[this.i % this.routes.length];
    this.i++;
    var li = this.line(route.label, false);
    var self = this;
    var wires = route.wires.map(function (id) { return self.svg.getElementById ? self.svg.getElementById(id) : self.svg.querySelector('#' + id); }).filter(Boolean);
    this.el.setAttribute('data-route', route.id || '');
    this.el.dispatchEvent(new CustomEvent('flow:route', { detail: route }));
    this.run(wires, 0, function () {
      if (li) li.className = 'is-done';
      self.timer = setTimeout(function () { self.next(); }, Number(self.el.getAttribute('data-gap')) || 900);
    });
  };

  Flow.prototype.run = function (wires, n, done) {
    if (!this.running) return;
    if (n >= wires.length) return done();
    var self = this;
    var wire = wires[n];
    var len = wire.getTotalLength();
    var dur = Math.max(260, (len / this.speed) * 1000);
    if (!this.dot) {
      this.dot = document.createElementNS(SVGNS, 'circle');
      this.dot.setAttribute('r', this.el.getAttribute('data-dot') || '4');
      this.dot.setAttribute('class', 'flow-dot');
      this.svg.appendChild(this.dot);
    }
    wire.classList.add('is-live');
    var t0 = null;
    var step = function (t) {
      if (!self.running) return;
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var p = wire.getPointAtLength(e * len);
      self.dot.setAttribute('cx', p.x);
      self.dot.setAttribute('cy', p.y);
      if (k < 1) { self.raf = requestAnimationFrame(step); return; }
      wire.classList.remove('is-live');
      var node = self.svg.querySelector('[data-node="' + wire.getAttribute('data-to') + '"]');
      if (node) {
        node.classList.add('is-hot');
        setTimeout(function () { node.classList.remove('is-hot'); }, 700);
      }
      self.timer = setTimeout(function () { self.run(wires, n + 1, done); }, 160);
    };
    this.raf = requestAnimationFrame(step);
  };

  var all = [];
  function start() {
    var els = document.querySelectorAll('[data-flow]');
    for (var k = 0; k < els.length; k++) all.push(new Flow(els[k]));
  }
  window.Flow = { start: function (el) { var f = new Flow(el); all.push(f); return f; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
