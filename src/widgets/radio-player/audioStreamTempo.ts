import type {
  AudioStreamTempoBpmDisplayView,
  AudioStreamTempoState,
  AudioStreamTempoUniforms,
  FormatAudioStreamTempoBpmLabelInput,
  ResolveAudioStreamTempoBpmDisplayInput,
  ResolveAudioStreamTempoMotionRateOptions,
  ResolveAudioStreamTempoPhaseDeltaOptions,
  TickAudioStreamTempoInput,
  TickAudioStreamTempoResult,
} from './audioStreamTempo.types';

export type {
  AudioStreamTempoBpmDisplayState,
  AudioStreamTempoBpmDisplayView,
  AudioStreamTempoState,
  AudioStreamTempoUniforms,
  FormatAudioStreamTempoBpmLabelInput,
  ResolveAudioStreamTempoBpmDisplayInput,
  ResolveAudioStreamTempoMotionRateOptions,
  ResolveAudioStreamTempoPhaseDeltaOptions,
  TickAudioStreamTempoInput,
  TickAudioStreamTempoResult,
} from './audioStreamTempo.types';

export const AUDIO_STREAM_TEMPO_NEUTRAL_BPM = 120;
export const AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE = 12;
export const AUDIO_STREAM_TEMPO_MIN_BEAT_INTERVAL_MS = 280;
export const AUDIO_STREAM_TEMPO_MAX_BEAT_INTERVAL_MS = 1000;
export const AUDIO_STREAM_TEMPO_MOTION_SCALE_MIN = 0.68;
export const AUDIO_STREAM_TEMPO_MOTION_SCALE_MAX = 1.72;
export const AUDIO_STREAM_TEMPO_MOTION_RATE_MIN_FACTOR = 0.68;
export const AUDIO_STREAM_TEMPO_MOTION_RATE_MAX_FACTOR = 1.72;

export const AUDIO_STREAM_TEMPO_SILENCE_BASS_THRESHOLD = 0.035;
export const AUDIO_STREAM_TEMPO_QUIET_BASS_THRESHOLD = 0.055;
export const AUDIO_STREAM_TEMPO_SILENCE_AFTER_MS = 7000;
export const AUDIO_STREAM_TEMPO_STABLE_CONFIDENCE = 0.35;
export const AUDIO_STREAM_TEMPO_ESTIMATE_CONFIDENCE = 0.08;

export const AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS: AudioStreamTempoUniforms = {
  bpm: AUDIO_STREAM_TEMPO_NEUTRAL_BPM,
  beatPhase: 0,
  confidence: 0,
  beat: 0,
  motionScale: 1,
  bassLevel: 0,
  beatSampleCount: 0,
};

export function createAudioStreamTempoState(): AudioStreamTempoState {
  return {
    bassSmoothed: 0,
    prevBass: 0,
    lastBeatTimeMs: 0,
    beat: 0,
    bpm: AUDIO_STREAM_TEMPO_NEUTRAL_BPM,
    confidence: 0,
    motionScale: 1,
    intervals: new Float32Array(AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE),
    intervalWriteIndex: 0,
    intervalCount: 0,
  };
}

function sampleBassEnergy(frequencyData: Uint8Array): number {
  const count = frequencyData.length;
  if (count === 0) {
    return 0;
  }

  const bassEnd = Math.max(1, Math.floor(count * 0.12));
  let sum = 0;
  for (let index = 0; index < bassEnd; index += 1) {
    sum += (frequencyData[index] ?? 0) / 255;
  }

  return sum / bassEnd;
}

function medianBeatIntervalMs(intervals: Float32Array, count: number): number {
  if (count <= 0) {
    return 0;
  }

  const sorted = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    sorted[index] = intervals[index];
  }
  sorted.sort();

  const mid = Math.floor(count / 2);
  if (count % 2 === 1) {
    return sorted[mid];
  }

  return (sorted[mid - 1] + sorted[mid]) * 0.5;
}

function resolveIntervalConfidence(intervals: Float32Array, count: number, median: number): number {
  if (count < 3 || median <= 0) {
    return Math.min(1, count / AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE);
  }

  let deviationSum = 0;
  for (let index = 0; index < count; index += 1) {
    deviationSum += Math.abs(intervals[index] - median) / median;
  }

  const meanDeviation = deviationSum / count;
  const consistency = Math.max(0, 1 - meanDeviation * 2.4);
  const sampleConfidence = Math.min(1, count / AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE);
  return consistency * sampleConfidence;
}

function resolveMotionScale(bpm: number, confidence: number): number {
  const normalized = bpm / AUDIO_STREAM_TEMPO_NEUTRAL_BPM;
  const scaled = 1 + (normalized - 1) * confidence;
  return Math.max(
    AUDIO_STREAM_TEMPO_MOTION_SCALE_MIN,
    Math.min(AUDIO_STREAM_TEMPO_MOTION_SCALE_MAX, scaled)
  );
}

function pushBeatInterval(state: AudioStreamTempoState, intervalMs: number): AudioStreamTempoState {
  if (
    intervalMs < AUDIO_STREAM_TEMPO_MIN_BEAT_INTERVAL_MS ||
    intervalMs > AUDIO_STREAM_TEMPO_MAX_BEAT_INTERVAL_MS
  ) {
    return state;
  }

  state.intervals[state.intervalWriteIndex] = intervalMs;
  state.intervalWriteIndex =
    (state.intervalWriteIndex + 1) % AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE;
  state.intervalCount = Math.min(
    AUDIO_STREAM_TEMPO_INTERVAL_BUFFER_SIZE,
    state.intervalCount + 1
  );

  const median = medianBeatIntervalMs(state.intervals, state.intervalCount);
  if (median <= 0) {
    return state;
  }

  const targetBpm = 60000 / median;
  state.bpm = state.bpm + (targetBpm - state.bpm) * 0.26;
  state.confidence = resolveIntervalConfidence(state.intervals, state.intervalCount, median);
  return state;
}

export function tickAudioStreamTempo({
  frequencyData,
  timestampMs,
  state,
  deltaSeconds,
}: TickAudioStreamTempoInput): TickAudioStreamTempoResult {
  const bassRaw = sampleBassEnergy(frequencyData);
  const bassSmoothed = state.bassSmoothed * 0.9 + bassRaw * 0.1;
  const bassRise = bassRaw - state.prevBass;
  const timeSinceBeat =
    state.lastBeatTimeMs > 0 ? timestampMs - state.lastBeatTimeMs : Number.POSITIVE_INFINITY;

  let nextState: AudioStreamTempoState = {
    ...state,
    bassSmoothed,
    prevBass: bassRaw,
    beat: state.beat * 0.86,
  };

  const beatDetected =
    timeSinceBeat >= AUDIO_STREAM_TEMPO_MIN_BEAT_INTERVAL_MS &&
    bassRaw > bassSmoothed * 1.08 + 0.035 &&
    bassRise > 0.028;

  if (beatDetected) {
    if (state.lastBeatTimeMs > 0) {
      nextState = pushBeatInterval(nextState, timeSinceBeat);
    }
    nextState.lastBeatTimeMs = timestampMs;
    nextState.beat = Math.max(nextState.beat, 1);
  }

  const beatPeriodMs = 60000 / Math.max(40, nextState.bpm);
  const beatPhase =
    nextState.lastBeatTimeMs > 0
      ? ((timestampMs - nextState.lastBeatTimeMs) % beatPeriodMs) / beatPeriodMs
      : 0;

  const targetMotionScale = resolveMotionScale(nextState.bpm, nextState.confidence);
  const motionScale = state.motionScale + (targetMotionScale - state.motionScale) * 0.16;

  const uniforms: AudioStreamTempoUniforms = {
    bpm: nextState.bpm,
    beatPhase,
    confidence: nextState.confidence,
    beat: nextState.beat,
    motionScale,
    bassLevel: bassSmoothed,
    beatSampleCount: nextState.intervalCount,
  };

  nextState = { ...nextState, motionScale };

  if (deltaSeconds <= 0) {
    return { uniforms, state: nextState };
  }

  return { uniforms, state: nextState };
}

export function resolveAudioStreamTempoPhaseDelta(
  tempo: AudioStreamTempoUniforms,
  basePhaseDelta: number,
  deltaSeconds: number,
  options: ResolveAudioStreamTempoPhaseDeltaOptions = {}
): number {
  const tempoWeight = options.tempoWeight ?? 0.7;
  const tempoDriven = (tempo.bpm / 60) * deltaSeconds * (0.55 + tempo.beat * 0.45);
  const blend = tempo.confidence * tempoWeight;
  return basePhaseDelta * (1 - blend) + tempoDriven * blend;
}

export function resolveAudioStreamTempoMotionRate(
  tempo: AudioStreamTempoUniforms,
  baseRate: number,
  options: ResolveAudioStreamTempoMotionRateOptions = {}
): number {
  const minRate = options.minRate ?? baseRate * AUDIO_STREAM_TEMPO_MOTION_RATE_MIN_FACTOR;
  const maxRate = options.maxRate ?? baseRate * AUDIO_STREAM_TEMPO_MOTION_RATE_MAX_FACTOR;
  const blended = baseRate * (1 - tempo.confidence) + baseRate * tempo.motionScale * tempo.confidence;
  return Math.max(minRate, Math.min(maxRate, blended));
}

export function advanceAudioStreamTempoPhase(
  phaseState: { phase: number },
  tempo: AudioStreamTempoUniforms,
  basePhaseDelta: number,
  deltaSeconds: number,
  options?: ResolveAudioStreamTempoPhaseDeltaOptions
): void {
  phaseState.phase += resolveAudioStreamTempoPhaseDelta(
    tempo,
    basePhaseDelta,
    deltaSeconds,
    options
  );
}

export function resolveAudioStreamTempoBpmDisplay({
  isPlaying,
  bpm,
  confidence,
  bassLevel,
  beatSampleCount,
  playingForMs,
}: ResolveAudioStreamTempoBpmDisplayInput): AudioStreamTempoBpmDisplayView {
  if (!isPlaying) {
    return {
      state: 'paused',
      label: '—',
      description: 'Tempo unavailable while paused',
    };
  }

  const isSilentSignal =
    bassLevel < AUDIO_STREAM_TEMPO_SILENCE_BASS_THRESHOLD ||
    (bassLevel < AUDIO_STREAM_TEMPO_QUIET_BASS_THRESHOLD &&
      beatSampleCount === 0 &&
      playingForMs >= AUDIO_STREAM_TEMPO_SILENCE_AFTER_MS);

  if (isSilentSignal) {
    return {
      state: 'silent',
      label: '—',
      description: 'No clear beat in the stream right now',
    };
  }

  if (confidence >= AUDIO_STREAM_TEMPO_STABLE_CONFIDENCE) {
    const rounded = Math.round(bpm);
    return {
      state: 'stable',
      label: String(rounded),
      description: `Tempo ${rounded} beats per minute`,
    };
  }

  if (beatSampleCount >= 2 || confidence >= AUDIO_STREAM_TEMPO_ESTIMATE_CONFIDENCE) {
    const rounded = Math.round(bpm);
    return {
      state: 'estimating',
      label: `~${rounded}`,
      description: `Approximate tempo ${rounded} beats per minute`,
    };
  }

  return {
    state: 'listening',
    label: '···',
    description: 'Listening for beats in the stream',
  };
}

export function formatAudioStreamTempoBpmLabel(
  input: FormatAudioStreamTempoBpmLabelInput
): string {
  return resolveAudioStreamTempoBpmDisplay({
    isPlaying: input.isPlaying,
    bpm: input.bpm,
    confidence: input.confidence,
    bassLevel: input.bassLevel ?? 0,
    beatSampleCount: input.beatSampleCount ?? 0,
    playingForMs: input.playingForMs ?? 0,
  }).label;
}

export function describeAudioStreamTempoBpm(
  input: FormatAudioStreamTempoBpmLabelInput
): string {
  return resolveAudioStreamTempoBpmDisplay({
    isPlaying: input.isPlaying,
    bpm: input.bpm,
    confidence: input.confidence,
    bassLevel: input.bassLevel ?? 0,
    beatSampleCount: input.beatSampleCount ?? 0,
    playingForMs: input.playingForMs ?? 0,
  }).description;
}
