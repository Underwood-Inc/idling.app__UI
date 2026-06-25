import type { AudioStreamTempoUniforms } from './audioStreamTempo.types';

export interface BarVisualizerThemeRgb {
  r: number;
  g: number;
  b: number;
}

export interface BarVisualizerTheme {
  id: string;
  label: string;
  primary: BarVisualizerThemeRgb;
  secondary: BarVisualizerThemeRgb;
  glow: string;
  canvasBg: string;
}

export type BarVisualizerWaveStyle = 'line' | 'ribbon';

export type BarVisualizerColorPalette = 'theme' | 'prism';

export type BarVisualizerBarFill = 'solid' | 'glass';

export type BarVisualizerBarTrail = 'none' | 'peaks' | 'cascade';

export type BarVisualizerGlow = 'off' | 'soft';

export type BarVisualizerFullscreenLayout = 'strip' | 'canvas' | 'radial' | 'hemisphere';

export type BarVisualizerSurface = 'dock' | 'expanded';

export interface BarVisualizerPreferences {
  /** Active preset in expanded (fullscreen / PWA) bar mode. */
  presetId: string;
  /** Preset used for the dock player bar — never a fullscreen-only style. */
  dockPresetId: string;
  density: BarVisualizerDensity;
  enabled: boolean;
  waveStyle: BarVisualizerWaveStyle;
  colorPalette: BarVisualizerColorPalette;
  barFill: BarVisualizerBarFill;
  barTrail: BarVisualizerBarTrail;
  glow: BarVisualizerGlow;
  scopeSmoothing: number;
}

export type BarVisualizerDensity = 'compact' | 'normal' | 'wide';

export type BarVisualizerDockLayout = 'wide' | 'compact';

export interface BarVisualizerPresetDefinition {
  id: string;
  label: string;
  description: string;
  dockLayout: BarVisualizerDockLayout;
  /** Hidden from the dock Look menu — expanded bar / PWA visualizer only. */
  fullscreenOnly?: boolean;
  /** Hidden from the fullscreen Look menu — dock bar visualizer only. */
  dockOnly?: boolean;
  /** How the preset occupies the fullscreen frame above the dock. */
  fullscreenLayout?: BarVisualizerFullscreenLayout;
}

export interface BarVisualizerCircularMetrics {
  cx: number;
  cy: number;
  extent: number;
}

export interface BarVisualizerDrawState {
  peaks: Float32Array;
  phase: number;
}

export interface BarVisualizerDrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  data: Float32Array;
  theme: BarVisualizerTheme;
  state: BarVisualizerDrawState;
  playing: boolean;
  barGap: number;
  fullscreen?: boolean;
  waveStyle: BarVisualizerWaveStyle;
  colorPalette: BarVisualizerColorPalette;
  timeData: Float32Array;
  barFill: BarVisualizerBarFill;
  barTrail: BarVisualizerBarTrail;
  glow: BarVisualizerGlow;
  tempo: AudioStreamTempoUniforms;
  deltaSeconds: number;
}

export type BarVisualizerPresetDrawer = (drawContext: BarVisualizerDrawContext) => void;

export interface BarVisualizerRuntimeHandle {
  presetId: string;
  draw: BarVisualizerPresetDrawer;
  reset: () => void;
  resize: (nextBarCount: number) => void;
  getState: () => BarVisualizerDrawState;
}
