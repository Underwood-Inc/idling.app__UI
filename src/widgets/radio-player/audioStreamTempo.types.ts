export interface AudioStreamTempoUniforms {
  /** Estimated tempo in beats per minute. */
  bpm: number;
  /** Position within the current beat cycle, 0–1. */
  beatPhase: number;
  /** How stable the tempo estimate is, 0–1. */
  confidence: number;
  /** Short pulse on detected beats, 0–1. */
  beat: number;
  /** Multiplier for animation speeds derived from BPM and confidence. */
  motionScale: number;
}

export interface AudioStreamTempoState {
  bassSmoothed: number;
  prevBass: number;
  lastBeatTimeMs: number;
  beat: number;
  bpm: number;
  confidence: number;
  motionScale: number;
  intervals: Float32Array;
  intervalWriteIndex: number;
  intervalCount: number;
}

export interface TickAudioStreamTempoInput {
  frequencyData: Uint8Array;
  timestampMs: number;
  state: AudioStreamTempoState;
  deltaSeconds: number;
}

export interface TickAudioStreamTempoResult {
  uniforms: AudioStreamTempoUniforms;
  state: AudioStreamTempoState;
}

export interface ResolveAudioStreamTempoPhaseDeltaOptions {
  tempoWeight?: number;
}

export interface ResolveAudioStreamTempoMotionRateOptions {
  minRate?: number;
  maxRate?: number;
}

export interface FormatAudioStreamTempoBpmLabelInput {
  bpm: number;
  confidence: number;
  isPlaying: boolean;
}
