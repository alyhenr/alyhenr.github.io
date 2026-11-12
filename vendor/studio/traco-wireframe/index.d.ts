export type Palette = { background: string; vignette: string; chalk: string; dim: string; grid: string; amber: string };
export type Inputs = {
  /** The scroll through the spine, 0..1. Default 0. */
  progress?: number;
  /** No camera moves and no drift: each beat is drawn as its settled still. Default false. */
  reducedMotion?: boolean;
  /** `#rrggbb` colours; any subset. */
  palette?: Partial<Palette>;
  /** Once, after the first frames are drawn. `firstFrameMs`: the setup and the first frame, on the CPU. */
  onReady?: (info: { firstFrameMs: number }) => void;
  /** A beat starts (1..5), in either scroll direction; also once on the first frame. */
  onBeat?: (beat: 1 | 2 | 3 | 4 | 5) => void;
  /** The scene can't run (no WebGL 2, a lost context at start). */
  onError?: (reason: string) => void;
  /** Eases toward `progress`. `false` draws it exactly (previews, tests). Default true. */
  smooth?: boolean;
  /** The canvas's pixel ratio. Default `devicePixelRatio`, at most 1.5. */
  pixelRatio?: number;
  /** Previews only (with `smooth: false`): the drift's clock, in seconds. */
  idle?: number;
};
export type Handle = { update(inputs: Partial<Inputs>): void; destroy(): void; draw(): void; info(): { frames: number; drawCalls: number; triangles: number; ready: boolean; width: number; height: number; pixelRatio: number } };
export function mount(el: HTMLElement, inputs?: Inputs): Handle;
/** Where each beat starts, and each beat's settled moment (what the plates and reduced motion show). */
export const BEATS: number[];
export const STILLS: number[];
export const PALETTE: Palette;
