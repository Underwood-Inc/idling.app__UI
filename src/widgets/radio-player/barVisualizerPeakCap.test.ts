import { describe, expect, test } from 'vitest';
import {
  resolveRoundedBarPeakCapMetrics,
  traceRoundedBarPeakCapPath,
} from './barVisualizerPeakCap';
import { shouldUseRoundedPeakCaps } from './radioVisualizerRoundedPeaks';

describe('barVisualizerPeakCap', () => {
  test('resolveRoundedBarPeakCapMetrics sizes the cap to the bar width', () => {
    const metrics = resolveRoundedBarPeakCapMetrics(8, 120);

    expect(metrics.capHeight).toBeGreaterThanOrEqual(4);
    expect(metrics.cornerRadius).toBe(4);
    expect(metrics.capY).toBe(120 - metrics.capHeight);
  });

  test('traceRoundedBarPeakCapPath opens a closed path', () => {
    const calls: string[] = [];
    const ctx = {
      beginPath: () => calls.push('beginPath'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      quadraticCurveTo: () => calls.push('quadraticCurveTo'),
      closePath: () => calls.push('closePath'),
    } as unknown as CanvasRenderingContext2D;

    traceRoundedBarPeakCapPath(ctx, 10, 8, 100);

    expect(calls[0]).toBe('beginPath');
    expect(calls.at(-1)).toBe('closePath');
  });
});

describe('radioVisualizerRoundedPeaks', () => {
  test('shouldUseRoundedPeakCaps enables custom peaks for rounded linear bar presets', () => {
    expect(
      shouldUseRoundedPeakCaps({
        roundBars: true,
        showPeaks: true,
      })
    ).toBe(true);

    expect(
      shouldUseRoundedPeakCaps({
        roundBars: true,
        peakLine: true,
      })
    ).toBe(false);

    expect(
      shouldUseRoundedPeakCaps({
        roundBars: true,
        radial: true,
      })
    ).toBe(false);
  });
});
