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
  enabled: boolean;
}

export type BarVisualizerDensity = 'compact' | 'normal' | 'wide';

export type BarVisualizerDockLayout = 'wide' | 'compact';

export interface BarVisualizerPresetDefinition {
  id: string;
  label: string;
  description: string;
  dockLayout: BarVisualizerDockLayout;
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
}

export type BarVisualizerPresetDrawer = (drawContext: BarVisualizerDrawContext) => void;

export interface BarVisualizerRuntimeHandle {
  presetId: string;
  draw: BarVisualizerPresetDrawer;
  reset: () => void;
  resize: (nextBarCount: number) => void;
  getState: () => BarVisualizerDrawState;
}
