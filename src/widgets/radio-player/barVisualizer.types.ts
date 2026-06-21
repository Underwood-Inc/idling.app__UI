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

export interface BarVisualizerPreferences {
  presetId: string;
  density: BarVisualizerDensity;
}

export type BarVisualizerDensity = 'compact' | 'normal' | 'wide';

export interface BarVisualizerPresetDefinition {
  id: string;
  label: string;
  description: string;
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
}

export interface BarVisualizerPresetRuntime {
  id: string;
  label: string;
  draw: (drawContext: BarVisualizerDrawContext) => void;
  reset: () => void;
}
