import type { AudioStreamTempoUniforms } from '../audioStreamTempo.types';
import type { NeonConstellationMotionMode } from './neonConstellationMotion.types';

export interface WebglVisualizerThemeUniforms {
  primary: WebglRgbUnit;
  secondary: WebglRgbUnit;
}

export type WebglRgbUnit = [number, number, number];

export interface WebglAudioReactiveUniforms {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  beat: number;
}

export interface WebglDrawFrameInput {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  reactive: WebglAudioReactiveUniforms;
  theme: WebglVisualizerThemeUniforms;
  time: number;
  width: number;
  height: number;
  reducedMotion: boolean;
  tempo: AudioStreamTempoUniforms;
  deltaSeconds: number;
  constellationMotion: NeonConstellationMotionMode;
  /** Fullscreen spectrum opacity — bars only; scene backgrounds stay opaque. */
  barOpacity: number;
}

export interface WebglVisualizerRenderer {
  resize: (width: number, height: number) => void;
  draw: (frame: WebglDrawFrameInput) => void;
  reset?: () => void;
  destroy: () => void;
}

export interface WebglVisualizerPresetDefinition {
  id: string;
  label: string;
  description: string;
  createRenderer: (gl: WebGL2RenderingContext) => WebglVisualizerRenderer;
}

export interface WebglVisualizerEngine {
  setPreset: (presetId: string) => void;
  setConstellationMotion: (mode: NeonConstellationMotionMode) => void;
  setBarOpacity: (opacity: number) => void;
  resize: (width: number, height: number) => void;
  start: (analyser: AnalyserNode) => void;
  stop: () => void;
  destroy: () => void;
}

export interface CreateWebglVisualizerEngineOptions {
  theme: WebglVisualizerThemeUniforms;
  reducedMotion?: boolean;
  initialPresetId?: string;
  constellationMotion?: NeonConstellationMotionMode;
  initialBarOpacity?: number;
  onFatalError?: (message: string) => void;
}

export interface WebglVisualizerCapability {
  isSupported: boolean;
  reason: string | null;
}
