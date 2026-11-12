# traco-wireframe

A full-screen line scene for the sticky stage of the home's `.spine`: loose chalk segments gather, beat by beat, into the wireframe of a small-business site on a phone. A Three.js scene delivered by Studio as one ES module. Version 1.0.0 (CHANGELOG.md).

## Entry point

```ts
import { mount } from "./vendor/studio/traco-wireframe/index.js";

const stage = document.querySelector('[data-studio="traco-wireframe"]');
const piece = mount(stage, {
  progress: 0,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  onReady: ({ firstFrameMs }) => { /* fade the plate out; over 50 ms: destroy() and keep the plates */ },
  onBeat: (beat) => { /* 1..5 */ },
  onError: () => { /* keep the plates */ },
});
piece.update({ progress: 0.4 });
piece.destroy();
```

`mount(el, inputs) → { update(partialInputs), destroy() }`. The piece fills `el` (give it a size: it follows `el`'s size with a ResizeObserver) and draws only when something changes. Plain JavaScript (types in `index.d.ts`). Needs `three` 0.187.0 in the site's dependencies and WebGL 2. Import it after first paint (`await import(...)`): the module is the whole download.

## Inputs

| Input | Type | Default | What it does |
| --- | --- | --- | --- |
| `progress` | number, 0–1 | 0 | The scroll through the spine. Beats start at 0, 0.30, 0.50, 0.72 and 0.90 (`BEATS`); each transition plays in the first ~14% after its mark, then holds. Scrolling back un-builds it. |
| `reducedMotion` | boolean | false | No camera moves and no drift: the scene jumps to the beat's settled still (`STILLS`: 0, 0.47, 0.69, 0.88, 1). |
| `palette` | `{ background, vignette, chalk, dim, grid, amber }`, `#rrggbb` | the direction's (`PALETTE`) | Any subset; the rest keep their defaults. |
| `smooth` | boolean | true | Eases toward `progress` (about 0.45 s to arrive). `false` draws it exactly: previews and tests use it. |
| `pixelRatio` | number | `devicePixelRatio`, at most 1.5 | The canvas's pixel ratio; lower it on a slow device. |
| `idle` | number (s) | 0 | Previews only, with `smooth: false`: the moment of the beat-1 drift to draw. |

Pass any subset to `update`; the piece redraws.

## Events

| Callback | When |
| --- | --- |
| `onReady({ firstFrameMs })` | Once, after the first two frames are drawn: fade the plate out here. `firstFrameMs` is the setup plus the first frame as the CPU saw it (the shaders compile there): the direction's "first frame > 50 ms" test. |
| `onBeat(n)` | A beat starts, `n` 1–5: when the eased progress crosses a mark, in either direction, and once on the first frame. Under `reducedMotion` it follows the raw `progress`. |
| `onError(reason)` | The piece can't run (e.g. no WebGL 2): keep the plates. |

No pointer input.

## Binding it to the page

The page owns the scroll; the piece only takes `progress`. With `.spine` about 6 viewport heights tall and the stage sticky:

```ts
const spine = document.querySelector(".spine");
const onScroll = () => {
  const r = spine.getBoundingClientRect();
  piece.update({ progress: Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))) });
};
addEventListener("scroll", onScroll, { passive: true });
onScroll(); // the visitor may have scrolled before the piece was ready
```

A smooth-scroll library adds its own easing on top of the piece's: if the pair feels late, pass `smooth: false`.

**Where the drawing sits.** On a wide stage (aspect ≥ ~1.15) the drawing is centred at 70% of the width and fits the right 60%; on a tall one (aspect ≤ ~0.75) it is centred 31% from the top and fits the top 60%; in between it blends. The background and its vignette cover the whole stage.

## Fallback and reduced motion

- **Plates:** `plates/desktop-01…05.jpg` (2160 × 1350) and `plates/phone-01…05.jpg` (585 × 1266) are the scene itself at each beat's still (beat 1 at progress 0.15, then `STILLS`), so a plate and the live scene line up when they crossfade near those shapes. Show them before `onReady`, on `onError`, and on weak phones (`deviceMemory ≤ 2`, `saveData`, or `firstFrameMs > 50`: call `destroy()`).
- **Reduced motion:** the page shows the plates and crossfades them per beat (400 ms), as the direction says. If the piece is mounted anyway, `reducedMotion: true` makes it draw each beat's still with no drift (it also follows the system setting for the drift).
- **Idle:** in beat 1 only, the camera drifts ±1° over 8 s, at 30 fps at most, fading in over 2 s. It pauses when the tab is hidden or the stage is off screen, and stops past beat 1: there the piece draws only while the scroll moves.

## Budget

Measured with `npm run budget` in Studio at progress 0.57 (the fills, the dashes and the remaining dust together), headless Chrome on an Apple M2 Pro: relative numbers; a phone shows the real ones.

- Frame: 0.8 ms on the GPU at 2160 × 1350 (median of 30 frames; headless Chrome on Apple M2 Pro, ANGLE Metal Renderer: Apple M2 Pro: a relative number, a device shows the real one)
- Frame: 0.7 ms on the GPU at 585 × 1266 (same machine)
- Draw calls: 2; triangles: 6240
- Download: 138.0 KB gzipped with three, 8.5 KB the piece's own code

- Assets: none: everything is procedural (no models, textures or fonts).
- The budget the request named: ≤ 140 KB gzip (138.0, of which three's `WebGLRenderer` is ~130: there are 2 KB to spare, so nothing else from three fits); one draw call per beat group (2 for the whole frame); ≤ 40 MB GPU (one canvas without depth, stencil or MSAA: ~23 MB at 1440 × 900 × 1.5 with the browser's back buffer, and a 160 KB vertex buffer); 60 and 30 fps on phones is what only a device shows: each frame moves ~3,300 segments on the CPU (well under a millisecond here) and fills thin lines, so the cost is small, but measure it on the A5x and the Moto E.

## How it's built

About 3,000 short segments tile every edge of the wireframe: each floats in one of two clusters in beat 1 and flies to its own slot, in reading order, when its group is called (the plan in beat 2, the built half's relief in beat 3, the rest and the phone outline in beat 4), so by beat 5 no dust is left. The page has a desktop layout and a phone layout and morphs between them; it lies on the floor grid, tilts up around its bottom edge and ends upright as the phone's screen. Every frame is a pure function of `progress` (and of the drift's clock): the segments' ends are computed in JavaScript into one instanced buffer and drawn as screen-space capsules (round caps, antialiased in the shader, 1–1.6 px) in one call; a second call draws the background and vignette, the glow around the phone (a rounded-rectangle distance field, no bloom pass) and the amber fills. No lights, no depth buffer, no textures; the direction's hex values are written to the screen as they are.

It uses Studio's web kit, copied into this folder with its types stripped: `scaffold.js` (the mount, the first frame, resize, destroy), `rig.js` (the camera's poses and the eased follow), `idle.js` (the drift's clock). `assets.json` records every file's origin. `previews/render.ts` (Studio's, not shipped to the site) renders the stills, the plates and the clips.
