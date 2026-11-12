# roteiro-filme — scene direction
The heart of the Roteiro direction: a 24-second silent motion film that tells a small-business owner how getting a site works, in four chapters (conversa, proposta, sinal de 50%, entrega) and one closing line, "O site é seu. Tudo dele é seu." The page under it is the film's script: each section is a chapter, with the film's timecode and its line as a subtitle. It must feel quick, confident and friendly, like a good bus-stop ad that you understand without sound.

Look (visual-vocabulary): **Kinetic type**, no accent look. Status: directed for round 2 of the design directions; not requested from Studio yet (the owner picks a direction first). Made with Studio's Remotion promo kit.

## Where and how big
Target: rendered video (Remotion, from code), delivered as MP4 plus posters. Mounts at: the home of direction 02-roteiro, under the hero line (`<figure class="film" data-studio="roteiro-filme">`). Sizes:
- 16:9, 1920 × 1080 master, shown at the content width (max 1180 px) on screens wider than 760 px;
- 4:5, 1080 × 1350 recut for phones (full width minus 20 px margins), also usable as an Instagram post or a WhatsApp status.
Both cuts share the beats and timing; the 4:5 stacks type on top and the object below.

## Beats
Silent, 24 s, one play, holds on the last frame.
1. 0–6 s, Conversa: cobalt field. A speech bubble draws its outline (0–0.8 s); "ME CONTA / DO SEU / NEGÓCIO." snaps in word by word (0.6–2.4 s, the last word yellow); business types in outlined pills ("SALÃO", "OFICINA", "CLÍNICA", "PADARIA", "RESTAURANTE") flick past around the bubble, two in motion blur; the bubble's three dots pulse once.
2. 6–12 s, Proposta: hard cut. A white proposal sheet slides up from below with a small rotation (−4°) and lands; its rows type in ("Páginas 4", "Prazo 10 dias úteis", "Preço fechado", "Domínio no seu nome"), the price row gets a yellow highlight; "PREÇO / FECHADO." slams in on the left.
3. 12–18 s, Sinal de 50%: hard cut. "METADE AGORA." then "METADE NA ENTREGA." (yellow); a wide bar splits in two: the left half fills yellow with "50% · para começar", the right half stays a dashed outline with "50% · com o site aprovado".
4. 18–22 s, Entrega: the dashed half fills; the bar folds into a phone; inside it a simple site builds block by block (nav, yellow hero with its button, four cards).
5. 22–24 s, the line: "O SITE É SEU." then "TUDO DELE / É SEU." (yellow); "Alysson · sites para pequenos negócios" fades in small at the bottom. Hold.

## Camera
Fixed 2D frame; the motion is in the type and the objects (springs, slides, hard cuts). No zooms or parallax.

## Timing
24 s at 30 fps, plays once and holds the last frame; no loop. Cuts are hard between chapters 1→2→3, a morph from 3→4. Type springs: short and stiff (Remotion `spring`, damping ~14, about 300 ms to settle). The page's chapters use the same timecodes: 00:00, 00:06, 00:12, 00:18, 00:24 (credits).

## Mood and palette
Bright, daytime, poster-like: flat colour, no gradients, no grain, one soft shadow under the proposal sheet.
- Field, cobalt `#1E3BD0`; deep ink `#0A1240` (phone body, dark text on yellow)
- White `#FFFFFF` (main type, outlines); yellow `#FFD23F` (second line, highlights, the paid half)
- Muted lines on cobalt: white at 25–40%; sheet rule `#D6D9E3`
Type: Big Shoulders Display 900 (all the big words, uppercase), Figtree 600–700 (rows, small labels); both OFL, the page's own fonts.

## Key frames
Each in both cuts, `roteiro-filme/frames/16x9-0N.png` and `4x5-0N.png`, drawn as HTML/CSS (`frames/0N.html` with `frame.css`):
- `01` at 00:02.5: "ME CONTA DO SEU NEGÓCIO." left, the bubble and the business pills right.
- `02` at 00:09: "PREÇO FECHADO." left, the proposal sheet with the yellow price row right.
- `03` at 00:15: "METADE AGORA. METADE NA ENTREGA." over the split bar (yellow half, dashed half).
- `04` at 00:22.5: "O SITE É SEU. TUDO DELE É SEU." with the finished phone; the small signature. Also the reduced-motion still and the end frame.
The mock's slot shows them as JPEGs (`design/directions/02-roteiro/scene/`).

## Interactive
None: it plays. The page controls it.
- Inputs: `play()`, `pause()`, `currentTime` (the page may seek to a chapter's start when its link in the chapter bar is tapped), `muted` (always true; there is no audio track).
- Events out: `timeupdate` (the page moves its playhead and marks the chapter), `ended`.
- Controls: one play/pause button and the timecode, drawn by the page, not by the video.

## Fallback
- Before it loads: the poster (frame 01, ≤ 60 KB JPEG at each cut's size).
- `prefers-reduced-motion`: no autoplay; the poster is frame 04 (the message), and the play button stays for whoever wants it.
- `saveData` or a slow connection (`effectiveType` 2g/3g): poster only, the video loads when play is tapped.
- Captions: none needed (no speech); the page's chapters are the transcript, and the `<figure>` has a text label.

## Performance budget
- File: ≤ 1.6 MB per cut (H.264, 720p for 16:9 and 720 × 900 for 4:5, ~500 kbps works for flat colour), `preload="none"`, `playsinline muted`; starts loading only when the figure is within one screen of the viewport.
- Decoding: hardware H.264 only (no WebM-only cut), so budget Android phones play it smoothly.
- Idle: paused when off screen or when the tab is hidden; never loops.
