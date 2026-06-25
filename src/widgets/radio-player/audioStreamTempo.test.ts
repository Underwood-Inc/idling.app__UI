import {
  advanceAudioStreamTempoPhase,
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  AUDIO_STREAM_TEMPO_MOTION_RATE_MAX_FACTOR,
  AUDIO_STREAM_TEMPO_MOTION_SCALE_MAX,
  createAudioStreamTempoState,
  formatAudioStreamTempoBpmLabel,
  resolveAudioStreamTempoBpmDisplay,
  resolveAudioStreamTempoMotionRate,
  resolveAudioStreamTempoPhaseDelta,
  tickAudioStreamTempo,
} from './audioStreamTempo';

function quietSpectrum(): Uint8Array {
  return new Uint8Array([8, 10, 6, 4, 3, 2]);
}

function bassHitSpectrum(): Uint8Array {
  return new Uint8Array([220, 200, 120, 60, 30, 12]);
}

describe('audioStreamTempo', () => {
  test('when beats arrive at 120 bpm, tempo confidence and bpm converge near 120', () => {
    let state = createAudioStreamTempoState();
    let uniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;
    const beatIntervalMs = 500;
    let timestampMs = 0;

    for (let beat = 0; beat < 10; beat += 1) {
      for (let frame = 0; frame < 8; frame += 1) {
        timestampMs += beatIntervalMs / 8;
        const tick = tickAudioStreamTempo({
          frequencyData: quietSpectrum(),
          timestampMs,
          state,
          deltaSeconds: beatIntervalMs / 8 / 1000,
        });
        state = tick.state;
        uniforms = tick.uniforms;
      }

      timestampMs += 1;
      const hit = tickAudioStreamTempo({
        frequencyData: bassHitSpectrum(),
        timestampMs,
        state,
        deltaSeconds: 1 / 1000,
      });
      state = hit.state;
      uniforms = hit.uniforms;
    }

    expect(uniforms.bpm).toBeGreaterThan(105);
    expect(uniforms.bpm).toBeLessThan(135);
    expect(uniforms.confidence).toBeGreaterThan(0.35);
    expect(uniforms.motionScale).toBeGreaterThan(0.95);
    expect(uniforms.motionScale).toBeLessThan(1.1);
  });

  test('when the stream stays quiet, confidence stays low and motion scale stays neutral', () => {
    let state = createAudioStreamTempoState();
    let uniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;

    for (let frame = 0; frame < 120; frame += 1) {
      const tick = tickAudioStreamTempo({
        frequencyData: quietSpectrum(),
        timestampMs: frame * 16,
        state,
        deltaSeconds: 0.016,
      });
      state = tick.state;
      uniforms = tick.uniforms;
    }

    expect(uniforms.confidence).toBeLessThan(0.2);
    expect(uniforms.motionScale).toBe(1);
  });

  test('when tempo helpers blend motion, phase advances faster at higher bpm', () => {
    const slowTempo = {
      ...AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
      bpm: 90,
      confidence: 0.8,
      motionScale: 0.9,
    };
    const fastTempo = {
      ...AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
      bpm: 150,
      confidence: 0.8,
      motionScale: 1.2,
    };
    const veryFastTempo = {
      ...AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
      bpm: 180,
      confidence: 0.9,
      motionScale: AUDIO_STREAM_TEMPO_MOTION_SCALE_MAX,
    };

    const slowDelta = resolveAudioStreamTempoPhaseDelta(slowTempo, 0.01, 1 / 60);
    const fastDelta = resolveAudioStreamTempoPhaseDelta(fastTempo, 0.01, 1 / 60);

    expect(fastDelta).toBeGreaterThan(slowDelta);
    expect(resolveAudioStreamTempoMotionRate(fastTempo, 0.01)).toBeGreaterThan(
      resolveAudioStreamTempoMotionRate(slowTempo, 0.01)
    );
    expect(resolveAudioStreamTempoMotionRate(veryFastTempo, 0.01)).toBeGreaterThan(
      resolveAudioStreamTempoMotionRate(fastTempo, 0.01)
    );
    expect(resolveAudioStreamTempoMotionRate(veryFastTempo, 0.01)).toBeLessThanOrEqual(
      0.01 * AUDIO_STREAM_TEMPO_MOTION_RATE_MAX_FACTOR
    );

    const phaseState = { phase: 0 };
    advanceAudioStreamTempoPhase(phaseState, fastTempo, 0.01, 1 / 60);
    expect(phaseState.phase).toBeGreaterThan(0);
  });

  test('when formatting bpm labels, paused and uncertain states read clearly', () => {
    expect(
      formatAudioStreamTempoBpmLabel({ bpm: 128, confidence: 0.8, isPlaying: false })
    ).toBe('—');
    expect(
      formatAudioStreamTempoBpmLabel({
        bpm: 128,
        confidence: 0.05,
        isPlaying: true,
        bassLevel: 0.2,
        beatSampleCount: 0,
        playingForMs: 1000,
      })
    ).toBe('···');
    expect(
      formatAudioStreamTempoBpmLabel({
        bpm: 127.6,
        confidence: 0.4,
        isPlaying: true,
        bassLevel: 0.2,
        beatSampleCount: 4,
        playingForMs: 12000,
      })
    ).toBe('128');
    expect(
      formatAudioStreamTempoBpmLabel({
        bpm: 132,
        confidence: 0.15,
        isPlaying: true,
        bassLevel: 0.18,
        beatSampleCount: 2,
        playingForMs: 5000,
      })
    ).toBe('~132');
    expect(
      resolveAudioStreamTempoBpmDisplay({
        isPlaying: true,
        bpm: 120,
        confidence: 0,
        bassLevel: 0.01,
        beatSampleCount: 0,
        playingForMs: 9000,
      }).state
    ).toBe('silent');
  });
});
