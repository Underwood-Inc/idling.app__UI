import { describe, expect, test } from 'vitest';
import {
  resolveRoundedBarPeakCapMetrics,
  traceRoundedBarPeakCapPath,
} from './barVisualizerPeakCap';
import {
  drawRadioVisualizerRoundedPeaks,
  shouldUseRoundedPeakCaps,
  type RadioVisualizerAnalyzerPeakSource,
} from './radioVisualizerRoundedPeaks';

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

  test('drawRadioVisualizerRoundedPeaks uses AudioMotion canvasCtx', () => {
    const saveCalls: string[] = [];
    const canvasCtx = {
      save: () => saveCalls.push('save'),
      restore: () => saveCalls.push('restore'),
      beginPath: () => undefined,
      arc: () => undefined,
      fill: () => undefined,
      setTransform: () => undefined,
      fillStyle: '#fff',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    const analyzer = {
      canvas: { width: 640 } as HTMLCanvasElement,
      canvasCtx,
      _bars: [
        {
          posX: 10,
          width: 8,
          barCenter: 14,
          peak: [0.5],
          alpha: [1],
          hold: [0],
          value: [0.5],
        },
      ],
      _aux: {
        analyzerHeight: 200,
        initialX: 0,
        centerX: 320,
        channelCoords: [{ analyzerBottom: 200 }],
      },
      _flg: { isRound: true },
      _gradients: {},
      _selectedGrads: ['classic'],
      fps: 60,
      peakFadeTime: 750,
      fadePeaks: false,
      radial: false,
      ledBars: false,
      peakLine: false,
      colorMode: 'gradient',
      mirror: 0,
      channelLayout: 'single',
    } as unknown as RadioVisualizerAnalyzerPeakSource;

    drawRadioVisualizerRoundedPeaks(analyzer, { canvasGradients: [] });

    expect(saveCalls).toContain('save');
    expect(saveCalls).toContain('restore');
  });
});
