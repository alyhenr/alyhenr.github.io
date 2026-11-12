// traco-wireframe: loose chalk segments gather, beat by beat, into the wireframe of a small-business site on a phone.
// One ES module: mount(el, inputs) -> { update, destroy }. Everything is a pure function of `progress` (and of the
// idle clock in beat 1), so scrolling back un-builds it. Two draw calls: the quads (vignette, glow, fills), the lines.
import { WebGLRenderer, Scene, PerspectiveCamera, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute, InstancedBufferGeometry, InstancedInterleavedBuffer, InterleavedBufferAttribute } from "three";
import { scaffold } from "./scaffold.js";
import { createRig } from "./rig.js";
import { createIdle } from "./idle.js";

/** Where each beat starts (progress), and the settled moment of each (what reduced motion shows). */
export const BEATS = [0, 0.3, 0.5, 0.72, 0.9];
export const STILLS = [0, 0.47, 0.69, 0.88, 1];
export const PALETTE = { background: "#0E1517", vignette: "#16262A", chalk: "#D9E2E0", dim: "#7D8F91", grid: "#2E3D3F", amber: "#F2A93B" };
/** Seconds the follow takes to cover 95% of a scroll step (the feel; shorten it under a smooth-scroll library). */
const SETTLE = 0.45;
const SEGMENTS = 3000;
const DEG = Math.PI / 180;

const ss = (a, b, x) => {
  const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
  return t * t * (3 - 2 * t);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── The page, in page units: x right, v down, centre (0, 0). Each block has a desktop layout and a phone layout. ──
const HINGE = 2.6; // the page's bottom edge (desktop layout): it tilts up around it
const PHONE = [1.3, 2.5, 0.36]; // the phone outline: half width, half height, corner radius
// [desktop x, v, w, h], [phone x, v, w, h], relief height, kind (0 box, 1 line along its top edge, 2 box with a cross, 3 the button)
const BLOCKS = [
  [[-2.2, -2.6, 4.4, 5.2], [-1.15, -2.3, 2.3, 4.6], 0, 0], // the page
  [[-2.2, -2.1, 4.4, 0], [-1.15, -1.95, 2.3, 0], 0, 1], // under the nav
  [[-2, -2.46, 0.62, 0.22], [-1, -2.21, 0.46, 0.16], 0.07, 0], // logo
  [[0.75, -2.35, 0.34, 0], [0.74, -2.2, 0.26, 0], 0, 1], // nav links -> the menu icon
  [[1.25, -2.35, 0.34, 0], [0.74, -2.13, 0.26, 0], 0, 1],
  [[1.75, -2.35, 0.25, 0], [0.74, -2.06, 0.26, 0], 0, 1],
  [[-1.95, -1.78, 1.6, 0.17], [-1, -1.76, 1.7, 0.14], 0.06, 0], // headline
  [[-1.95, -1.5, 1.15, 0.17], [-1, -1.54, 1.2, 0.14], 0.06, 0],
  [[-1.95, -1.12, 1.5, 0], [-1, -1.26, 1.9, 0], 0, 1], // paragraph
  [[-1.95, -0.98, 1.5, 0], [-1, -1.15, 1.9, 0], 0, 1],
  [[-1.95, -0.84, 0.95, 0], [-1, -1.04, 1.2, 0], 0, 1],
  [[-1.95, -0.62, 0.78, 0.27], [-1, -0.88, 0.8, 0.24], 0.13, 3], // the button
  [[0.25, -1.86, 1.7, 1.42], [-1, -0.48, 2, 1], 0.1, 2], // image box
  [[-2, -0.1, 1.24, 1.3], [-1, 0.68, 0.6, 0.72], 0.1, 0], // three cards
  [[-0.62, -0.1, 1.24, 1.3], [-0.3, 0.68, 0.6, 0.72], 0.1, 0],
  [[0.76, -0.1, 1.24, 1.3], [0.4, 0.68, 0.6, 0.72], 0.1, 0],
  [[-1.88, 0.02, 1, 0.52], [-0.94, 0.74, 0.48, 0.3], 0, 0],
  [[-0.5, 0.02, 1, 0.52], [-0.24, 0.74, 0.48, 0.3], 0, 0],
  [[0.88, 0.02, 1, 0.52], [0.46, 0.74, 0.48, 0.3], 0, 0],
  [[-1.88, 0.78, 0.9, 0], [-0.94, 1.15, 0.44, 0], 0, 1],
  [[-1.88, 0.95, 0.6, 0], [-0.94, 1.26, 0.3, 0], 0, 1],
  [[-0.5, 0.78, 0.9, 0], [-0.24, 1.15, 0.44, 0], 0, 1],
  [[-0.5, 0.95, 0.6, 0], [-0.24, 1.26, 0.3, 0], 0, 1],
  [[0.88, 0.78, 0.9, 0], [0.46, 1.15, 0.44, 0], 0, 1],
  [[0.88, 0.95, 0.6, 0], [0.46, 1.26, 0.3, 0], 0, 1],
  [[-1.4, 1.42, 2.8, 0.98], [-1, 1.56, 2, 0.64], 0.08, 0], // the form
  [[-1.2, 1.56, 2.4, 0.2], [-0.9, 1.64, 1.8, 0.13], 0, 0],
  [[-1.2, 1.86, 2.4, 0.2], [-0.9, 1.83, 1.8, 0.13], 0, 0],
  [[0.6, 2.14, 0.6, 0.17], [0.4, 2.02, 0.5, 0.12], 0, 0],
];

function build() {
  const rand = mulberry32(20261112);
  const rects = []; // { d, p, h, side, button }
  const edges = []; // { c0, c1, group, len, order, side }
  const fills = []; // rect indices whose top face fills amber (the built half)
  const edge = (k, a, b, group, len) => edges.push({ c0: k * 8 + a, c1: k * 8 + b, group, len, order: (rects[k].d[1] + rects[k].d[3] / 2 + 2.6) / 5.2, side: rects[k].side });
  const rect = (d, p, h, kind, open) => {
    const k = rects.length;
    const side = d[0] + d[2] / 2 < 0 ? -1 : 1;
    rects.push({ d, p, h, side, button: kind === 3 });
    if (kind === 1) return edge(k, 0, 1, 0, d[2]);
    const ext = side < 0 ? 1 : 2;
    const sides = [[0, 1, d[2]], [1, 2, d[3]], [2, 3, d[2]], [3, 0, d[3]]].filter((_, i) => !(open === 1 && i === 1) && !(open === 2 && i === 3));
    for (const [a, b, len] of sides) {
      edge(k, a, b, 0, len);
      if (h) edge(k, a + 4, b + 4, ext, len);
    }
    if (h) for (const c of open === 2 ? [1, 2] : [0, 1, 2, 3]) edge(k, c, c + 4, ext, h * 3);
    if (kind === 2) edge(k, 4, 6, 0, Math.hypot(d[2], d[3])), edge(k, 5, 7, 0, Math.hypot(d[2], d[3]));
    if (h && side < 0) fills.push(k);
  };
  for (const [d, p, h, kind] of BLOCKS) {
    // A block across the middle is two halves, open where they meet: the left one is the half that gets built first.
    if (d[0] < -1e-6 && d[0] + d[2] > 1e-6) {
      const f = -d[0] / d[2];
      if (kind === 1) rect([d[0], d[1], -d[0], 0], [p[0], p[1], p[2] * f, 0], 0, 1), rect([0, d[1], d[0] + d[2], 0], [p[0] + p[2] * f, p[1], p[2] * (1 - f), 0], 0, 1);
      else rect([d[0], d[1], -d[0], d[3]], [p[0], p[1], p[2] * f, p[3]], h, kind, 1), rect([0, d[1], d[0] + d[2], d[3]], [p[0] + p[2] * f, p[1], p[2] * (1 - f), p[3]], h, kind, 2);
    } else rect(d, p, h, kind, 0);
  }
  // The phone outline: free points after the rects' corners, a closed loop from the bottom centre.
  const free = [];
  const loop = [];
  const [hx, hy, r] = PHONE;
  const corners = [[-hx + r, hy - r, 90], [-hx + r, -hy + r, 180], [hx - r, -hy + r, 270], [hx - r, hy - r, 0]];
  loop.push([0, hy]);
  for (const [cx, cy, a0] of corners) for (let i = 0; i <= 8; i++) loop.push([cx + r * Math.cos((a0 + i * 11.25) * DEG), cy + r * Math.sin((a0 + i * 11.25) * DEG)]);
  loop.push([0, hy]);
  const base = rects.length * 8;
  let run = 0;
  const runs = [];
  loop.forEach(([x, v], i) => {
    free.push(x, v, 0);
    if (i) {
      const len = Math.hypot(x - loop[i - 1][0], v - loop[i - 1][1]);
      runs.push([base + i - 1, base + i, len, run]);
      run += len;
    }
  });
  for (const [c0, c1, len, at] of runs) edges.push({ c0, c1, group: 3, len, order: at / run, side: 1 });

  // Cut every edge into short pieces: each one is a floating segment that ends up there.
  const total = edges.reduce((sum, e) => sum + e.len, 0);
  const unit = total / (SEGMENTS - edges.length / 2);
  const pieces = [];
  for (const e of edges) {
    const n = Math.max(1, Math.round(e.len / unit));
    for (let i = 0; i < n; i++) {
      const cluster = rand() < 0.5 ? -1 : 1;
      const loose = rand() < 0.3;
      const g = () => (rand() + rand() + rand() - 1.5) / 1.5; // roughly a bell, -1..1
      const home = loose ? [(rand() - 0.5) * 15, rand() * 7 - 1.5, rand() * 11 - 7] : [cluster * 2.4 + g() * 1.7, 1.6 + g() * 1.6, g() * 3];
      const a = rand() * Math.PI * 2;
      const z = rand() * 2 - 1;
      const half = 0.035 + rand() * 0.05;
      const q = Math.sqrt(1 - z * z) * half;
      pieces.push({
        c0: e.c0, c1: e.c1, s0: i / n, s1: (i + 1) / n, group: e.group, side: e.side, home,
        dir: [Math.cos(a) * q, z * half, Math.sin(a) * q],
        // When it leaves, within its group's window: in reading order for the plan, around the loop for the phone.
        delay: e.group === 3 ? e.order : 0.7 * e.order + 0.3 * rand(),
        dash: (i >> 1) & 1,
        near: ss(-7, 4, home[2]),
      });
    }
  }

  // Strokes: lines that aren't made of dust. [space (0 world, 1 page), a, b, colour, width, grow from..to, fade from..to, alpha, end alpha]
  const strokes = [];
  const stroke = (space, a, b, colour, width, g0, g1, f0, f1, alpha = 1, end = 1) => strokes.push({ space, a, b, colour, width, g0, g1, f0, f1, alpha, end });
  // The floor grid, fading out from its centre.
  for (let k = -9; k <= 9; k++) {
    const a = 1 - (k / 9.5) ** 2;
    for (const s of [-1, 1]) {
      stroke(0, [k, 0, 0.5], [k, 0, 0.5 + s * 9.5], "grid", 1, 0.27, 0.27, 2, 2, a, 0);
      stroke(0, [0, 0, 0.5 + k], [s * 9.5, 0, 0.5 + k], "grid", 1, 0.27, 0.27, 2, 2, a, 0);
    }
  }
  // Beat 1: threads between the two clusters, one amber.
  [[1.9, 0.6, 0.2], [0.5, -0.9, -0.3], [-0.5, 0.9, 0.1], [-1.5, -0.4, 0.4], [2.9, 0.2, -0.2]].forEach(([lift, depth, dy], t) => {
    const from = [-2.4, 1.6 + dy, depth * 0.4];
    const to = [2.4, 1.6 - dy, -depth * 0.4];
    const mid = [dy, 1.6 + lift, depth * 2];
    const at = (u) => from.map((f, i) => (1 - u) * (1 - u) * f + 2 * u * (1 - u) * mid[i] + u * u * to[i]);
    for (let i = 0; i < 26; i++) stroke(0, at(i / 26), at((i + 1) / 26), t === 1 ? "amber" : "dim", t === 1 ? 1.3 : 1, -1, -1, 0.22, 0.32, t === 1 ? 1 : 0.75);
  });
  // Beat 2: dimension marks along the top and left edges, with ticks.
  const dim = (a, b, g0, g1, w = 1.2) => stroke(1, a, b, "amber", w, g0, g1, 0.5, 0.56);
  dim([-2.2, -3, 0], [2.2, -3, 0], 0.4, 0.46);
  dim([-2.62, -2.6, 0], [-2.62, 2.6, 0], 0.41, 0.47);
  for (let i = 0; i <= 4; i++) {
    const t = i % 4 ? 0.07 : 0.16;
    dim([-2.2 + i * 1.1, -3 - t, 0], [-2.2 + i * 1.1, -3 + t, 0], 0.4 + i * 0.015, 0.42 + i * 0.015);
    dim([-2.62 - t, -2.6 + i * 1.3, 0], [-2.62 + t, -2.6 + i * 1.3, 0], 0.41 + i * 0.015, 0.43 + i * 0.015);
  }
  // Beat 3: the dashed line down the middle (the 50%).
  for (let i = 0; i < 22; i++) stroke(1, [0, -2.9 + i * 0.27, 0.01], [0, -2.9 + i * 0.27 + 0.15, 0.01], "amber", 1.4, 0.53 + i * 0.003, 0.54 + i * 0.003, 0.72, 0.78);
  // Beat 5: the underline.
  stroke(1, [-1.05, PHONE[1] + 0.42, 0], [1.05, PHONE[1] + 0.42, 0], "amber", 2, 0.9, 0.965, 2, 2);
  return { rects, pieces, fills, free, strokes };
}

const LINE_VERT = /* glsl */ `
attribute vec3 iA; attribute vec3 iB; attribute vec4 iColor; attribute vec2 iWidth;
uniform vec2 uRes; uniform vec3 uFit; uniform float uRatio;
varying vec4 vColor; varying vec4 vLine;
void main() {
  vec4 a = projectionMatrix * viewMatrix * vec4(iA, 1.0);
  vec4 b = projectionMatrix * viewMatrix * vec4(iB, 1.0);
  // Behind the camera: cut the segment at the near plane, or drop it.
  float near = 0.05;
  if (a.w < near && b.w < near) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  if (a.w < near) a = mix(a, b, (near - a.w) / (b.w - a.w));
  if (b.w < near) b = mix(b, a, (near - b.w) / (a.w - b.w));
  vec2 sa = (a.xy / a.w * uFit.x + uFit.yz) * 0.5 * uRes;
  vec2 sb = (b.xy / b.w * uFit.x + uFit.yz) * 0.5 * uRes;
  vec2 d = sb - sa;
  float len = length(d);
  d = len > 1e-4 ? d / len : vec2(1.0, 0.0);
  float hw = 0.5 * iWidth.x * uRatio;
  float pad = hw + 1.0;
  float end = position.x * 2.0 - 1.0;
  vec2 p = mix(sa, sb, position.x) + d * end * pad + vec2(-d.y, d.x) * position.y * pad;
  vLine = vec4(position.x * len + end * pad, position.y * pad, len, hw);
  vColor = iColor * mix(1.0, iWidth.y, position.x);
  gl_Position = vec4(p / (0.5 * uRes), 0.0, 1.0);
}`;
// A capsule: round caps, one pixel of antialiasing. Premultiplied.
const LINE_FRAG = /* glsl */ `
varying vec4 vColor; varying vec4 vLine;
void main() {
  float dx = vLine.x - clamp(vLine.x, 0.0, vLine.z);
  float cover = clamp(vLine.w + 0.5 - length(vec2(dx, vLine.y)), 0.0, 1.0);
  gl_FragColor = vec4(vColor.rgb, 1.0) * vColor.a * cover;
}`;
// Quads: mode 0 a flat fill in the page's plane, 1 the glow around the phone outline, 2 the background and its vignette.
const QUAD_VERT = /* glsl */ `
attribute vec4 tint; attribute vec3 info;
uniform vec3 uFit; uniform vec2 uRes;
varying vec4 vColor; varying vec3 vInfo;
void main() {
  vColor = tint; vInfo = info;
  if (info.z > 1.5) {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vInfo.xy = (position.xy - uFit.yz) * vec2(uRes.x / uRes.y, 1.0);
    return;
  }
  vec4 c = projectionMatrix * viewMatrix * vec4(position, 1.0);
  gl_Position = vec4(c.xy * uFit.x + uFit.yz * c.w, 0.0, c.w);
}`;
const QUAD_FRAG = /* glsl */ `
uniform vec3 uBack; uniform vec3 uCentre; uniform vec3 uPhone;
varying vec4 vColor; varying vec3 vInfo;
void main() {
  if (vInfo.z > 1.5) {
    float r = length(vInfo.xy) / 1.15;
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    gl_FragColor = vec4(mix(uBack, uCentre, exp(-r * r * 2.2)) + n / 255.0, 1.0);
  } else if (vInfo.z > 0.5) {
    vec2 q = abs(vInfo.xy) - uPhone.xy + uPhone.z;
    float d = (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uPhone.z) / 0.17;
    gl_FragColor = vec4(vColor.rgb, 1.0) * vColor.a * exp(-d * d);
  } else gl_FragColor = vec4(vColor.rgb, 1.0) * vColor.a;
}`;

const camera = (yaw, pitch, dist, tx, ty, tz, span) => ({ yaw, pitch, dist, tx, ty, tz, span });
const POSES = [
  [0, camera(-17, 6, 11.5, 0, 1.7, 0, 1.3)],
  [0.3, camera(-14, 9, 10.8, 0, 1.6, 0, 1.3)],
  [0.44, camera(24, 60, 11.5, 0, 0, 0.1, 1.08)],
  [0.5, camera(24, 60, 11.5, 0, 0, 0.1, 1.08)],
  [0.64, camera(28, 18, 11.2, 0, 2.25, 1.1, 0.95)],
  [0.72, camera(28, 18, 11.2, 0, 2.25, 1.1, 0.95)],
  [0.86, camera(-7, 3, 11.5, 0, 3.02, 2.6, 0.5)],
  [1, camera(-7, 3, 11.5, 0, 3.02, 2.6, 0.5)],
].map(([at, values]) => ({ at, position: [0, 0, 0], target: [0, 0, 0], values }));

const inner = scaffold((ctx) => {
  const renderer = new WebGLRenderer({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
  const scene = new Scene();
  const cam = new PerspectiveCamera(37.8, 1, 0.1, 100); // a 35 mm lens on a full frame
  const { rects, pieces, fills, free, strokes } = build();

  const uniforms = {
    uRes: { value: [1, 1] }, uFit: { value: [1, 0, 0] }, uRatio: { value: 1 },
    uBack: { value: [0, 0, 0] }, uCentre: { value: [0, 0, 0] }, uPhone: { value: PHONE },
  };
  const material = (vertexShader, fragmentShader) => new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, premultipliedAlpha: true, side: 2, depthTest: false, depthWrite: false });

  // The quads: the background, the glow, then one per filled top face.
  const quadCount = 2 + fills.length;
  const quadPos = new Float32Array(quadCount * 12);
  const quadColor = new Float32Array(quadCount * 16);
  const quadInfo = new Float32Array(quadCount * 12);
  const quadIndex = [];
  for (let q = 0; q < quadCount; q++) quadIndex.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
  quadPos.set([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  for (let i = 0; i < 4; i++) quadInfo[i * 3 + 2] = 2, (quadInfo[12 + i * 3 + 2] = 1);
  const GLOW = [PHONE[0] + 1, PHONE[1] + 1];
  const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  CORNERS.forEach(([x, y], i) => quadInfo.set([x * GLOW[0], y * GLOW[1]], 12 + i * 3));
  const quads = new BufferGeometry();
  const quadPosAttr = new BufferAttribute(quadPos, 3);
  const quadColorAttr = new BufferAttribute(quadColor, 4);
  quads.setAttribute("position", quadPosAttr);
  quads.setAttribute("tint", quadColorAttr);
  quads.setAttribute("info", new BufferAttribute(quadInfo, 3));
  quads.setIndex(quadIndex);
  const quadMesh = new Mesh(quads, material(QUAD_VERT, QUAD_FRAG));

  // The lines: one instanced quad per segment.
  const count = strokes.length + pieces.length;
  const data = new Float32Array(count * 12);
  const buffer = new InstancedInterleavedBuffer(data, 12, 1);
  buffer.setUsage(35048); // DYNAMIC_DRAW
  const lines = new InstancedBufferGeometry();
  lines.setAttribute("position", new BufferAttribute(new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]), 2));
  lines.setIndex([0, 1, 2, 2, 1, 3]);
  lines.setAttribute("iA", new InterleavedBufferAttribute(buffer, 3, 0));
  lines.setAttribute("iB", new InterleavedBufferAttribute(buffer, 3, 3));
  lines.setAttribute("iColor", new InterleavedBufferAttribute(buffer, 4, 6));
  lines.setAttribute("iWidth", new InterleavedBufferAttribute(buffer, 2, 10));
  lines.instanceCount = count;
  const lineMesh = new Mesh(lines, material(LINE_VERT, LINE_FRAG));
  for (const mesh of [quadMesh, lineMesh]) (mesh.frustumCulled = false), scene.add(mesh);
  quadMesh.renderOrder = 0;
  lineMesh.renderOrder = 1;

  let colours;
  const paint = () => {
    const palette = { ...PALETTE, ...ctx.inputs.palette };
    colours = Object.fromEntries(Object.keys(PALETTE).map((k) => [k, hex(palette[k])]));
    uniforms.uBack.value = colours.background;
    uniforms.uCentre.value = colours.vignette;
  };
  paint();

  const rig = createRig({ poses: POSES, settle: SETTLE });
  const idle = createIdle({ fps: 30, fadeIn: 2 });
  const unwatch = ctx.inputs.smooth === false ? () => {} : idle.watch(ctx.el, ctx.invalidate);
  let beat = 0;
  let drifts = true;
  let aspect = 1;

  const points = new Float32Array((rects.length * 8 + free.length / 3) * 3); // world positions: the rects' corners, then the phone loop
  let cosT = 1;
  let sinT = 0;
  /** A page point (x, v, relief) in the world: the page lies on the floor, then tilts up around its bottom edge. */
  const place = (x, v, e, out, o) => {
    const d = v - HINGE;
    out[o] = x;
    out[o + 1] = 0.5 * sinT - d * sinT + e * cosT;
    out[o + 2] = HINGE + d * cosT + e * sinT;
  };

  const frame = (p, drift) => {
    // The camera.
    const { yaw, pitch, dist, tx, ty, tz, span } = rig.sample(p).values;
    const calm = 1 - ss(0.2, 0.3, p);
    const y = (yaw + drift * calm * Math.sin(idle.time * 0.7854)) * DEG; // ±1° over 8 s
    const x = (pitch + drift * calm * 0.5 * Math.sin(idle.time * 0.7854 * 2)) * DEG;
    cam.position.set(tx + dist * Math.sin(y) * Math.cos(x), ty + dist * Math.sin(x), tz + dist * Math.cos(y) * Math.cos(x));
    cam.lookAt(tx, ty, tz);
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    // Where the drawing sits: right of centre on a wide stage (60% of its width), the top 60% of a tall one.
    const wide = ss(0.75, 1.15, aspect);
    const roomW = (1 - 0.4 * wide) * aspect;
    const roomH = 0.6 + 0.4 * wide;
    uniforms.uFit.value = [Math.min(roomH, roomW / span), 0.4 * wide, 0.38 * (1 - wide)];

    // The page's state.
    const tilt = (52 * ss(0.5, 0.64, p) + 38 * ss(0.72, 0.86, p)) * DEG;
    cosT = Math.cos(tilt);
    sinT = Math.sin(tilt);
    const phone = ss(0.72, 0.86, p); // desktop layout -> phone layout
    // The built half's relief; it lies back down as the page becomes the phone's flat screen.
    const raise = ss(0.52, 0.64, p) * (1 - phone);
    const signed = ss(0.51, 0.58, p) * (1 - ss(0.72, 0.8, p)); // beat 3's colours: the built half amber, the rest dashed and dim
    rects.forEach((r, k) => {
      const [x0, v0, w, h] = r.d.map((d, i) => d + (r.p[i] - d) * phone);
      const e = r.side < 0 ? r.h * raise : 0;
      for (let c = 0; c < 8; c++) place(x0 + (c % 4 === 1 || c % 4 === 2 ? w : 0), v0 + (c % 4 > 1 ? h : 0), c > 3 ? e : 0, points, (k * 8 + c) * 3);
    });
    for (let i = 0; i < free.length; i += 3) place(free[i], free[i + 1], free[i + 2], points, rects.length * 24 + i);

    // The quads.
    const { chalk, dim, amber } = colours;
    CORNERS.forEach(([sx, sv], i) => place(sx * GLOW[0], sv * GLOW[1], 0, quadPos, 12 + i * 3));
    const glow = 0.2 * ss(0.82, 0.9, p);
    for (let i = 0; i < 4; i++) quadColor.set([chalk[0], chalk[1], chalk[2], glow], 16 + i * 4);
    fills.forEach((k, f) => {
      const alpha = rects[k].button ? Math.max(0.16 * signed, ss(0.56, 0.62, p)) : 0.16 * signed * ss(0.52, 0.64, p);
      for (let c = 0; c < 4; c++) {
        quadPos.set(points.subarray((k * 8 + 4 + c) * 3, (k * 8 + 5 + c) * 3), (2 + f) * 12 + c * 3);
        quadColor.set([amber[0], amber[1], amber[2], alpha], (2 + f) * 16 + c * 4);
      }
    });
    quadPosAttr.needsUpdate = quadColorAttr.needsUpdate = true;

    // The lines: strokes first (the grid lies under everything), then the pieces.
    let o = 0;
    const put = (ax, ay, az, bx, by, bz, c, alpha, width, end) => {
      data[o] = ax; data[o + 1] = ay; data[o + 2] = az; data[o + 3] = bx; data[o + 4] = by; data[o + 5] = bz;
      data[o + 6] = c[0]; data[o + 7] = c[1]; data[o + 8] = c[2]; data[o + 9] = alpha; data[o + 10] = width; data[o + 11] = end;
      o += 12;
    };
    const gridAlpha = ss(0.28, 0.38, p) * (1 - 0.65 * ss(0.72, 0.86, p));
    const A = [0, 0, 0];
    const B = [0, 0, 0];
    for (const s of strokes) {
      const grow = s.g1 > s.g0 ? ss(s.g0, s.g1, p) : p >= s.g0 ? 1 : 0;
      const alpha = s.alpha * (s.colour === "grid" ? gridAlpha : (1 - ss(s.f0, s.f1, p)) * (grow > 0 ? 1 : 0));
      if (s.space) place(s.a[0], s.a[1], s.a[2], A, 0), place(s.b[0], s.b[1], s.b[2], B, 0);
      else for (let i = 0; i < 3; i++) (A[i] = s.a[i]), (B[i] = s.b[i]);
      put(A[0], A[1], A[2], A[0] + (B[0] - A[0]) * grow, A[1] + (B[1] - A[1]) * grow, A[2] + (B[2] - A[2]) * grow, colours[s.colour], alpha, s.width, s.end);
    }
    const WINDOWS = [[0.3, 0.44], [0.5, 0.64], [0.72, 0.86], [0.74, 0.89]];
    const waiting = 1 - 0.55 * ss(0.3, 0.5, p); // the dust still floating steps back once the plan is down
    const spread = 1 + 0.5 * ss(0.3, 0.6, p);
    const mixed = [0, 0, 0];
    for (const s of pieces) {
      const [w0, w1] = WINDOWS[s.group];
      const t0 = w0 + s.delay * (w1 - w0) * 0.5;
      const u = Math.min(1, Math.max(0, (p - t0) / ((w1 - w0) * 0.5)));
      const e = u < 0.5 ? 4 * u * u * u : 1 - 4 * (1 - u) * (1 - u) * (1 - u);
      const i0 = s.c0 * 3;
      const i1 = s.c1 * 3;
      const hx = s.home[0] * spread;
      const hy = s.home[1];
      const hz = s.home[2] * spread;
      const amberish = s.group === 1 || (s.group === 0 && s.side < 0) ? signed : 0;
      const dimmed = s.group === 0 && s.side > 0 ? signed : 0;
      const dust = (0.3 + 0.6 * s.near) * waiting;
      for (let i = 0; i < 3; i++) {
        const role = chalk[i] + (amber[i] - chalk[i]) * amberish + (dim[i] - chalk[i]) * dimmed;
        mixed[i] = dim[i] + (chalk[i] - dim[i]) * s.near;
        mixed[i] += (role - mixed[i]) * e;
      }
      const solid = 1 - dimmed * s.dash;
      const alpha = dust + (solid - dust) * e;
      const f = 1 - e;
      put(
        (points[i0] + (points[i1] - points[i0]) * s.s0) * e + (hx - s.dir[0]) * f,
        (points[i0 + 1] + (points[i1 + 1] - points[i0 + 1]) * s.s0) * e + (hy - s.dir[1]) * f,
        (points[i0 + 2] + (points[i1 + 2] - points[i0 + 2]) * s.s0) * e + (hz - s.dir[2]) * f,
        (points[i0] + (points[i1] - points[i0]) * s.s1) * e + (hx + s.dir[0]) * f,
        (points[i0 + 1] + (points[i1 + 1] - points[i0 + 1]) * s.s1) * e + (hy + s.dir[1]) * f,
        (points[i0 + 2] + (points[i1 + 2] - points[i0 + 2]) * s.s1) * e + (hz + s.dir[2]) * f,
        mixed, alpha, 1 + 0.3 * e + (s.group === 3 ? 0.3 * e : 0), 1,
      );
    }
    buffer.needsUpdate = true;
  };

  /** The beat a progress is in, 1..5. */
  const beatAt = (p) => BEATS.reduce((n, b) => n + (p >= b ? 1 : 0), 0);

  return {
    renderer,
    resize(width, height, pixelRatio) {
      aspect = width / height;
      uniforms.uRes.value = [width * pixelRatio, height * pixelRatio];
      uniforms.uRatio.value = pixelRatio;
    },
    update(inputs, changed) {
      if ("palette" in changed) paint();
    },
    draw({ inputs, dt, smooth, first }) {
      const reduced = inputs.reducedMotion === true;
      const input = Math.min(1, Math.max(0, +inputs.progress || 0));
      // Reduced motion: no camera moves, each beat is its settled still.
      const goal = reduced ? STILLS[beatAt(input) - 1] : input;
      const moving = smooth && !first && !reduced ? rig.follow(goal, dt) : (rig.jump(goal), false);
      const p = rig.progress;
      // The drift plays only in beat 1; past it the clock is off, so nothing asks for frames.
      const drifting = !reduced && p < BEATS[1];
      if (drifting !== drifts) idle.set({ enabled: (drifts = drifting) });
      if (!smooth) idle.seek(inputs.idle ?? 0);
      frame(p, idle.gain);
      renderer.render(scene, cam);
      const now = beatAt(reduced ? input : p);
      if (now !== beat) (beat = now), inputs.onBeat?.(now);
      return moving;
    },
    dispose() {
      unwatch();
      quads.dispose();
      lines.dispose();
      quadMesh.material.dispose();
      lineMesh.material.dispose();
    },
  };
}, { maxPixelRatio: 1.5 });

/**
 * Mounts the scene in `el`. Inputs: progress (0..1), reducedMotion, palette, onReady({ firstFrameMs }), onBeat(n),
 * onError(reason); smooth, pixelRatio and idle are for previews. README.md has the whole interface.
 */
export function mount(el, inputs = {}) {
  const t0 = performance.now();
  let firstFrameMs = 0;
  const handle = inner(el, { ...inputs, onReady: () => inputs.onReady?.({ firstFrameMs }) });
  // The setup and the first frame run synchronously inside the call above (the shaders compile there).
  firstFrameMs = performance.now() - t0;
  return handle;
}
