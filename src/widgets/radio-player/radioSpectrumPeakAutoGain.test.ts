import {
  createRadioSpectrumPeakAutoGainState,
  resolveRadioSpectrumPeakSensitivity,
  tickRadioSpectrumPeakAutoGain,
} from './radioSpectrumPeakAutoGain';

describe('radioSpectrumPeakAutoGain', () => {
  test('tracks rolling peak energy from frequency bins', () => {
    const quiet = new Uint8Array([10, 12, 8, 15]);
    const first = tickRadioSpectrumPeakAutoGain({
      frequencyData: quiet,
      state: createRadioSpectrumPeakAutoGainState(),
    });

    expect(first.framePeak).toBeCloseTo(15 / 255, 5);
    expect(first.state.rollingPeak).toBeGreaterThanOrEqual(0.06);

    const loud = new Uint8Array([220, 180, 200, 160]);
    const second = tickRadioSpectrumPeakAutoGain({
      frequencyData: loud,
      state: first.state,
    });

    expect(second.state.rollingPeak).toBeGreaterThan(first.state.rollingPeak);
  });

  test('widens sensitivity when the stream is quiet', () => {
    const quiet = resolveRadioSpectrumPeakSensitivity({
      spectrumBarHeight: 1,
      rollingPeak: 0.08,
    });
    const loud = resolveRadioSpectrumPeakSensitivity({
      spectrumBarHeight: 1,
      rollingPeak: 0.72,
    });

    expect(quiet.minDecibels).toBeLessThan(loud.minDecibels);
  });
});
