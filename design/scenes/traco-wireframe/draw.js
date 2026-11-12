/*
 * Key frames for traco-wireframe: storyboard stills, not the piece. Each frame page sets
 * window.FRAME (1–4) and window.PLATE (true: no type, the image the mock's stage shows).
 * A tiny perspective projection over a few hundred line segments, drawn as SVG.
 */
(function () {
  var W = window.innerWidth, H = window.innerHeight;
  var phone = W < 700;
  var C = { bg: '#0E1517', chalk: '#D9E2E0', muted: '#7D8F91', dim: '#2E3D3F', amber: '#F2A93B' };
  var seed = 7 + (window.FRAME || 1);
  function rnd() { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  var out = [];
  function line(a, b, color, w, op, dash) {
    out.push('<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + color + '" stroke-width="' + (w || 1) + '" stroke-opacity="' + (op == null ? 1 : op) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linecap="round"/>');
  }
  function poly(pts, fill, op, stroke, w) {
    out.push('<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="' + fill + '" fill-opacity="' + op + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (w || 1) + '"' : '') + '/>');
  }

  // camera: model rotated (rx, ry), pushed back by dist, projected around (cx, cy)
  var cam = { rx: 0, ry: 0, dist: 30, f: 1, cx: W / 2, cy: H / 2, sx: 1 };
  function P(x, y, z) {
    z = z || 0;
    x *= cam.sx || 1;
    var cy = Math.cos(cam.ry), sy = Math.sin(cam.ry), cx = Math.cos(cam.rx), sx = Math.sin(cam.rx);
    var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    var y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    var d = cam.dist + z2;
    return [cam.cx + cam.f * x1 / d, cam.cy - cam.f * y2 / d, d];
  }
  function seg(a, b, color, w, op, dash) { line(P(a[0], a[1], a[2]), P(b[0], b[1], b[2]), color, w, op, dash); }
  function rect(x0, y0, x1, y1, z, color, w, op, dash) {
    seg([x0, y0, z], [x1, y0, z], color, w, op, dash); seg([x1, y0, z], [x1, y1, z], color, w, op, dash);
    seg([x1, y1, z], [x0, y1, z], color, w, op, dash); seg([x0, y1, z], [x0, y0, z], color, w, op, dash);
  }

  // the page being drawn: rects in page units (10 × 14, y up)
  var PAGE = [
    { r: [-5, -7, 5, 7], k: 'outline' },
    { r: [-4.4, 5.6, 4.4, 6.4], k: 'nav' },
    { r: [-4.2, 5.8, -2.8, 6.2], k: 'logo' },
    { r: [-4.4, 3.4, 1.4, 4.6], k: 'title' },
    { r: [-4.4, 2.6, 0.8, 2.9], k: 'text' },
    { r: [-4.4, 2.1, -0.4, 2.4], k: 'text' },
    { r: [-4.4, 1.1, -1.8, 1.7], k: 'button' },
    { r: [2.0, 1.1, 4.4, 4.6], k: 'image' },
    { r: [-4.4, -2.6, -1.7, 0.3], k: 'card' },
    { r: [-1.35, -2.6, 1.35, 0.3], k: 'card' },
    { r: [1.7, -2.6, 4.4, 0.3], k: 'card' },
    { r: [-4.4, -6.3, 4.4, -3.3], k: 'form' },
    { r: [-4.0, -4.5, 4.0, -3.9], k: 'input' },
    { r: [-4.0, -5.5, 4.0, -4.9], k: 'input' },
  ];

  function grid(span, step, op) {
    for (var g = -span; g <= span; g += step) {
      seg([g, -span, 0], [g, span, 0], C.dim, 1, op);
      seg([-span, g, 0], [span, g, 0], C.dim, 1, op);
    }
  }

  function drawPage(opts) {
    PAGE.forEach(function (e) {
      var r = e.r;
      var left = (r[0] + r[2]) / 2 < 0 || e.k === 'outline';
      var built = opts.half ? (e.k === 'outline' ? false : left) : true;
      var color = opts.solid || built ? C.chalk : C.muted;
      var op = opts.solid || built ? 0.95 : 0.55;
      var dash = !opts.solid && opts.half && !built ? '4 6' : null;
      if (opts.half && built && e.k !== 'nav') {
        var d = 0.7;
        var fr = [P(r[0], r[1], -d), P(r[2], r[1], -d), P(r[2], r[3], -d), P(r[0], r[3], -d)];
        poly(fr, C.amber, e.k === 'button' ? 0.85 : 0.16);
        [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]].forEach(function (c) { seg([c[0], c[1], 0], [c[0], c[1], -d], C.amber, 1.2, 0.9); });
        rect(r[0], r[1], r[2], r[3], -d, C.amber, 1.4, 1);
      }
      if (opts.solid && e.k === 'button') poly([P(r[0], r[1]), P(r[2], r[1]), P(r[2], r[3]), P(r[0], r[3])], C.amber, 1);
      rect(r[0], r[1], r[2], r[3], 0, color, e.k === 'outline' ? 1.6 : 1.2, op, dash);
      if (e.k === 'image') { seg([r[0], r[1]], [r[2], r[3]], color, 1, op * 0.7, dash); seg([r[0], r[3]], [r[2], r[1]], color, 1, op * 0.7, dash); }
      if (e.k === 'card') { seg([r[0] + 0.3, r[3] - 0.6], [r[2] - 0.6, r[3] - 0.6], color, 1, op * 0.7, dash); seg([r[0] + 0.3, r[3] - 1.0], [r[2] - 1.0, r[3] - 1.0], color, 1, op * 0.6, dash); }
    });
    if (opts.dims) {
      // dimension marks: the proposal's measured plan
      seg([-5, 7.9], [5, 7.9], C.amber, 1, 0.9); seg([-5, 7.6], [-5, 8.2], C.amber, 1, 0.9); seg([5, 7.6], [5, 8.2], C.amber, 1, 0.9);
      seg([5.9, -7], [5.9, 7], C.amber, 1, 0.9); seg([5.6, -7], [6.2, -7], C.amber, 1, 0.9); seg([5.6, 7], [6.2, 7], C.amber, 1, 0.9);
      for (var t = -7; t <= 7; t += 1) seg([5.9, t], [6.1, t], C.amber, 1, 0.5);
    }
    if (opts.half) seg([0, -8.2, 0], [0, 8.2, 0], C.amber, 1.2, 0.9, '6 6');
  }

  function strays(n, spread, op) {
    for (var i = 0; i < n; i++) {
      var x = (rnd() - 0.5) * spread * 1.6, y = (rnd() - 0.5) * spread, z = (rnd() - 0.5) * spread;
      var a = rnd() * Math.PI * 2, b = rnd() * Math.PI, L = 0.2 + rnd() * 0.9;
      seg([x, y, z], [x + Math.cos(a) * Math.sin(b) * L, y + Math.sin(a) * Math.sin(b) * L, z + Math.cos(b) * L], C.chalk, 1, op * (0.4 + rnd() * 0.6));
    }
  }

  var F = window.FRAME || 1;
  var objX = phone ? W * 0.5 : W * 0.64, objY = phone ? H * 0.34 : H * 0.5;
  var unit = phone ? H * 0.95 : H * 1.5;

  if (F === 1) {
    cam = { rx: 0.18, ry: -0.3, dist: 30, f: unit, cx: objX, cy: objY };
    strays(180, 40, 0.35);
    var clusters = phone ? [[-4.2, 1.5, 0], [4.2, -1.5, 1]] : [[-3.2, 0.5, 0], [6.2, -0.5, 1]];
    var ends = [];
    clusters.forEach(function (c, ci) {
      for (var i = 0; i < 110; i++) {
        var r = Math.pow(rnd(), 0.6) * 3.2, a = rnd() * Math.PI * 2, b = rnd() * Math.PI;
        var x = c[0] + r * Math.cos(a) * Math.sin(b), y = c[1] + r * Math.sin(a) * Math.sin(b), z = c[2] + r * Math.cos(b);
        var a2 = rnd() * Math.PI * 2, L = 0.3 + rnd() * 1.1;
        seg([x, y, z], [x + Math.cos(a2) * L, y + Math.sin(a2) * L, z], C.chalk, 1.1, 0.5 + rnd() * 0.5);
        if (i < 6) ends.push({ c: ci, p: P(x, y, z) });
      }
    });
    // threads between the two: the conversation
    for (var k = 0; k < 6; k++) {
      var a = ends[k].p, b = ends[k + 6].p;
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - (40 + k * 18) * (k % 2 ? 1 : -1);
      out.push('<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" fill="none" stroke="' + (k === 2 ? C.amber : C.chalk) + '" stroke-width="' + (k === 2 ? 1.6 : 1) + '" stroke-opacity="' + (k === 2 ? 1 : 0.45) + '"/>');
    }
  } else if (F === 2) {
    cam = { rx: -1.05, ry: 0.42, dist: 30, f: unit * 1.05, cx: objX, cy: objY + (phone ? 10 : 30) };
    grid(14, 1, 0.55);
    drawPage({ dims: true });
    cam.rx = -1.05;
    strays(70, 26, 0.25);
  } else if (F === 3) {
    cam = { rx: -0.32, ry: 0.5, dist: 30, f: unit, cx: objX, cy: objY };
    var keep = cam;
    cam = { rx: -1.35, ry: 0.5, dist: 30, f: unit, cx: objX, cy: objY + unit * 0.25 };
    grid(14, 1, 0.35);
    cam = keep;
    drawPage({ half: true });
  } else {
    cam = { rx: 0.05, ry: -0.18, dist: 30, f: unit * 0.92, cx: objX, cy: objY - (phone ? 0 : 10), sx: 0.62 };
    // the phone around the finished page
    var m = 0.8;
    out.push('<g filter="url(#glow)">');
    rect(-5 - m * 1.4, -7 - m * 1.6, 5 + m * 1.4, 7 + m * 1.6, 0.01, C.chalk, 2, 1);
    seg([-1.6, 7 + m * 1.05], [1.6, 7 + m * 1.05], C.chalk, 2, 1);
    out.push('</g>');
    drawPage({ solid: true });
    seg([-6.4, -9.2], [6.4, -9.2], C.amber, 2, 1);
  }

  var type = '';
  if (!window.PLATE) {
    var T = {
      1: ['Passo 1 de 4', 'Conversa', 'Você me conta do negócio pelo formulário. Eu respondo em até 1 dia útil.'],
      2: ['Passo 2 de 4', 'Proposta', 'Em até 2 dias úteis: as páginas, o prazo e o preço fechado.'],
      3: ['Passo 3 de 4', 'Sinal de 50%', 'Metade por Pix para começar; a outra metade só na entrega.'],
      4: ['Passo 4 de 4', 'Entrega', 'O site no ar, no seu domínio. O site é seu. Tudo dele é seu.'],
    }[F];
    type = '<div class="type"><span>' + T[0] + '</span><h2>' + T[1] + '</h2><p>' + T[2] + '</p></div>';
  }
  document.body.innerHTML =
    '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<radialGradient id="v" cx="' + (objX / W) + '" cy="' + (objY / H) + '" r="0.8"><stop offset="0" stop-color="#16262A"/><stop offset="1" stop-color="' + C.bg + '"/></radialGradient></defs>' +
    '<rect width="100%" height="100%" fill="url(#v)"/>' + out.join('') + '</svg>' + (type ? '<div class="shade"></div>' + type : '');
})();
