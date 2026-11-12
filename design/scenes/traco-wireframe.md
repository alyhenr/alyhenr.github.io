# traco-wireframe — scene direction
The spine of the Traço direction: a full-screen line scene behind the home's four steps. Loose chalk lines gather, beat by beat, into the wireframe of a small-business site on a phone, so a visitor *sees* "conversa → proposta → sinal → entrega" become a finished site while reading it. It must feel calm, precise and made by an engineer: nothing flashy, every line ends up somewhere.

Look (visual-vocabulary): **Wireframe 3D**, no accent look. Status: directed for round 2 of the design directions; not requested from Studio yet (the owner picks a direction first).

## Where and how big
Target: Three.js (web). Mounts at: the home of direction 01-traco, as the sticky stage of `.spine` (`<figure class="stage" data-studio="traco-wireframe">`), behind the hero and the four step beats. Size: the full viewport, `100vw × 100svh`, sticky for the length of the spine (about 6 screens of scroll); the canvas covers it with DPR capped at 1.5. Composition: the drawing sits right of centre on wide screens (the text is on the left, ~40% of the width) and in the top 60% on phones (the text is at the bottom).

## Beats
Input `progress` 0–1 is the scroll through the spine (hero top to the end of the "O site é seu" beat).
1. 0–15% (hero) and 15–30% (Conversa): ~3,000 short chalk segments float in depth; two loose clusters form left and right of the drawing area and pass thin curved threads between them, one of them amber. Page text: "Seu site, traço a traço.", then "Conversa".
2. 30–50% (Proposta): the segments fly in and lie down on a perspective floor grid, snapping into the flat plan of a page (nav, hero block, image box with its cross, three cards, the form); amber dimension marks draw along two edges with tick marks. Page text: "Proposta".
3. 50–72% (Sinal de 50%): the plan tilts up to a 3/4 view; the left half of the blocks extrude to a shallow depth with an amber outline and a faint amber fill, the button solid amber; the right half stays dashed and dim; a dashed amber line marks the middle. Page text: "Sinal de 50%".
4. 72–90% (Entrega): the right half completes, every line turns solid chalk, the page narrows into the proportions of a phone screen and a phone outline draws around it with a soft glow; the camera ends nearly frontal. Page text: "Entrega".
5. 90–100% (O site é seu): hold the finished phone; an amber line underlines it; the loose dust is gone. Page text: "O site é seu. Tudo dele é seu."

## Camera
Perspective, 35 mm feel (moderate field of view). Beat 1: slightly above, yawed −17°, still except a slow drift (±1° over 8 s, ambient). Beat 2: rises to look down at ~60° onto the floor plan, yawed +24°. Beat 3: comes down to ~18° above, yaw +28°. Beat 4: swings to almost frontal (yaw −7°, pitch 3°). Every move is scrubbed by `progress` with an ease-in-out per beat; no move plays on its own.

## Timing
Total: the spine's scroll height (≈ 6 × 100svh). Scrubbed by the scroll, both directions: scrolling back un-builds it. Only the dust's slow drift in beat 1 plays on its own. Ends held on beat 5; no loop.

## Mood and palette
Quiet night studio, a drafting table under one lamp. No light sources, no shading: lines only, a soft vignette.
- Background `#0E1517` (stage), vignette centre `#16262A`
- Lines, chalk `#D9E2E0`; far or dim lines `#7D8F91`; grid `#2E3D3F`
- Accent amber `#F2A93B` (threads, dimension marks, the 50% fill, the button, the final underline); amber fill at 16% opacity
Materials: thin unlit lines (1–1.6 px at DPR 1), round caps; a light bloom only on the phone outline in beat 4.

## Key frames
Desktop 1440 × 900 and phone 390 × 844, the step text drawn where the page puts it:
- `traco-wireframe/frames/01.png` (`phone-01.png`): beat 1, the two clusters and their threads; text "Passo 1 de 4 · Conversa" on the left (bottom on phone).
- `traco-wireframe/frames/02.png` (`phone-02.png`): beat 2, the page's flat plan on the grid with amber dimension marks; text "Proposta".
- `traco-wireframe/frames/03.png` (`phone-03.png`): beat 3, half extruded in amber, half dashed, the middle line; text "Sinal de 50%".
- `traco-wireframe/frames/04.png` (`phone-04.png`): beat 4, the finished site inside the phone outline, the amber underline; text "Entrega".
`frames/plates/` holds the same four frames without type: they are what the mock's stage shows (`design/directions/01-traco/scene/`). The frames are drawn by `traco-wireframe/draw.js` (a tiny projection over SVG lines), storyboard only.

## Interactive
None besides the scroll: it plays from `progress`.
- Inputs: `progress` (0–1, from the page's scroll), `reducedMotion` (boolean), `palette` (the five colours above, so the page can retheme it).
- Events out: `ready` (first frame drawn: the page fades its still plate out), `beat` (1–5, when a beat starts: the page can sync its step counter).
- Pointer: none (the page above it must stay readable and scrollable).

## Fallback
- Before it loads, and when WebGL is missing: the page shows the plates (`scene/desktop-0N.jpg`, `scene/phone-0N.jpg`), swapped per beat. This is what the mock does today.
- `prefers-reduced-motion`: no camera moves and no drift: the four plates crossfade (400 ms) at each beat's threshold.
- Weak phones (`deviceMemory ≤ 2`, `saveData`, or a first frame slower than 50 ms): the same plates, no WebGL.

## Performance budget
- 60 fps on a mid-range phone (Galaxy A5x class), 30 fps acceptable on a budget Android (Moto E / Galaxy A0x); DPR capped at 1.5.
- Download: ≤ 140 KB gzip of script (tree-shaken Three.js, `LineSegments` + one `ShaderMaterial`), geometry generated in code, no model or texture downloads; loaded after the first paint (idle), the plate shows first.
- Memory: ≤ 40 MB GPU; one draw call per beat group.
- Idle: render only on scroll or while the beat-1 drift is on screen; stop when the spine is off screen or the tab is hidden.
