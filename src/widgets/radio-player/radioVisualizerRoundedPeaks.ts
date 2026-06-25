import type { ConstructorOptions } from 'audiomotion-analyzer';
import { traceRoundedBarPeakCapPath } from './barVisualizerPeakCap';

const COLOR_BAR_INDEX = 'bar-index';
const COLOR_BAR_LEVEL = 'bar-level';
const CHANNEL_SINGLE = 'single';

export interface RadioVisualizerGradientStop {
  color: string;
  level: number;
}

export interface RadioVisualizerAnalyzerBar {
  posX: number;
  width: number;
  barCenter: number;
  peak: number[];
  alpha: number[];
  hold: number[];
  value: number[];
}

export interface RadioVisualizerAnalyzerChannelCoords {
  analyzerBottom: number;
}

export interface RadioVisualizerAnalyzerLayout {
  analyzerHeight: number;
  initialX: number;
  centerX: number;
  channelCoords: RadioVisualizerAnalyzerChannelCoords[];
}

export interface RadioVisualizerAnalyzerPeakSource {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  _bars: RadioVisualizerAnalyzerBar[];
  _aux: RadioVisualizerAnalyzerLayout;
  _flg: { isRound: boolean };
  _gradients: Array<{ colorStops: RadioVisualizerGradientStop[] }>;
  _selectedGrads: number[];
  fps: number;
  peakFadeTime: number;
  fadePeaks: boolean;
  radial: boolean;
  ledBars: boolean;
  peakLine: boolean;
  colorMode: string;
  mirror: number;
  channelLayout: string;
}

export function shouldUseRoundedPeakCaps(options: ConstructorOptions): boolean {
  if (options.showPeaks === false || options.peakLine === true || options.ledBars === true) {
    return false;
  }

  if (options.radial === true) {
    return false;
  }

  return options.roundBars === true;
}

function resolvePeakAlpha(
  analyzer: RadioVisualizerAnalyzerPeakSource,
  channel: number,
  bar: RadioVisualizerAnalyzerBar
): number {
  const peakAlpha = bar.alpha[channel] ?? 0;
  if (peakAlpha > 0) {
    return peakAlpha;
  }

  if (!analyzer.fadePeaks) {
    return 1;
  }

  const fadeFrames = Math.max(1, analyzer.fps * analyzer.peakFadeTime / 1e3);
  const hold = bar.hold[channel] ?? 0;
  if (hold >= 0) {
    return 1;
  }

  return Math.max(0, 1 + hold / fadeFrames);
}

function resolvePeakFillStyle(
  analyzer: RadioVisualizerAnalyzerPeakSource,
  channel: number,
  barIndex: number,
  peakValue: number,
  canvasGradients: CanvasGradient[]
): string | CanvasGradient {
  if (analyzer.colorMode === COLOR_BAR_INDEX) {
    const gradient = analyzer._gradients[analyzer._selectedGrads[channel]];
    const stops = gradient?.colorStops ?? [];
    if (stops.length > 0) {
      return stops[barIndex % stops.length]?.color ?? analyzer.ctx.fillStyle;
    }
  }

  if (analyzer.colorMode === COLOR_BAR_LEVEL) {
    const gradient = analyzer._gradients[analyzer._selectedGrads[channel]];
    const stops = gradient?.colorStops ?? [];
    const selectedIndex = stops.findLastIndex((stop) => peakValue <= stop.level);
    if (selectedIndex >= 0) {
      return stops[selectedIndex].color;
    }
  }

  const channelGradient = canvasGradients[channel];
  if (channelGradient) {
    return channelGradient;
  }

  return analyzer.ctx.fillStyle;
}

function drawChannelRoundedPeaks(
  analyzer: RadioVisualizerAnalyzerPeakSource,
  channel: number,
  canvasGradients: CanvasGradient[]
): void {
  const { analyzerHeight, channelCoords } = analyzer._aux;
  const channelCoord = channelCoords[channel];
  if (!channelCoord) {
    return;
  }

  const analyzerBottom = channelCoord.analyzerBottom;
  const maxBarHeight = analyzerHeight;
  const ctx = analyzer.ctx;

  analyzer._bars.forEach((bar, barIndex) => {
    const peakValue = bar.peak[channel] ?? 0;
    if (peakValue <= 0) {
      return;
    }

    const peakAlpha = resolvePeakAlpha(analyzer, channel, bar);
    if (peakAlpha <= 0.01) {
      return;
    }

    const width = bar.width;
    const posX = bar.posX;
    if (width <= 0) {
      return;
    }

    const halfWidth = width / 2;
    const peakTopY = analyzerBottom - peakValue * maxBarHeight;

    ctx.save();
    ctx.globalAlpha = peakAlpha;
    ctx.fillStyle = resolvePeakFillStyle(analyzer, channel, barIndex, peakValue, canvasGradients);

    if (analyzer._flg.isRound) {
      ctx.beginPath();
      ctx.arc(bar.barCenter, peakTopY, halfWidth, Math.PI, 0);
      ctx.fill();
    } else {
      traceRoundedBarPeakCapPath(ctx, posX, width, peakTopY, halfWidth);
      ctx.fill();
    }

    ctx.restore();
  });
}

export function drawRadioVisualizerRoundedPeaks(
  analyzer: RadioVisualizerAnalyzerPeakSource,
  drawInfo?: { canvasGradients?: CanvasGradient[] }
): void {
  if (analyzer.radial || analyzer.ledBars || analyzer.peakLine) {
    return;
  }

  const canvasGradients = drawInfo?.canvasGradients ?? [];
  const channelCount = analyzer.channelLayout === CHANNEL_SINGLE ? 1 : 2;
  const ctx = analyzer.ctx;

  for (let channel = 0; channel < channelCount; channel += 1) {
    drawChannelRoundedPeaks(analyzer, channel, canvasGradients);
  }

  if (analyzer.mirror !== 0) {
    const { initialX } = analyzer._aux;
    ctx.save();
    ctx.setTransform(-1, 0, 0, 1, analyzer.canvas.width - initialX, 0);
    for (let channel = 0; channel < channelCount; channel += 1) {
      drawChannelRoundedPeaks(analyzer, channel, canvasGradients);
    }
    ctx.restore();
  }
}
