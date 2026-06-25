import type {
  BarVisualizerCircularMetrics,
  BarVisualizerDrawContext,
  BarVisualizerDockLayout,
  BarVisualizerFullscreenLayout,
  BarVisualizerPresetDefinition,
  BarVisualizerPresetDrawer,
  BarVisualizerRuntimeHandle,
  BarVisualizerSurface,
  BarVisualizerThemeRgb,
} from './barVisualizer.types';
import { advanceAudioStreamTempoPhase } from './audioStreamTempo';

function mixRgb(from: BarVisualizerThemeRgb, to: BarVisualizerThemeRgb, t: number): BarVisualizerThemeRgb {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(from.r + (to.r - from.r) * clamped),
    g: Math.round(from.g + (to.g - from.g) * clamped),
    b: Math.round(from.b + (to.b - from.b) * clamped),
  };
}

function rgba(rgb: BarVisualizerThemeRgb, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function themeColor(drawContext: BarVisualizerDrawContext, level: number, index: number, total: number): string {
  const { theme } = drawContext;
  const position = total <= 1 ? 0 : index / (total - 1);
  const blended = mixRgb(theme.primary, theme.secondary, position * 0.65 + level * 0.35);
  return rgba(blended, 0.35 + level * 0.65);
}

function resolveBarFill(
  drawContext: BarVisualizerDrawContext,
  level: number,
  index: number,
  total: number
): string {
  if (drawContext.colorPalette === 'prism') {
    const hue = (index / Math.max(1, total)) * 300 + level * 40;
    return `hsla(${hue}, 78%, 62%, ${0.35 + level * 0.55})`;
  }

  return themeColor(drawContext, level, index, total);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function paintCanvasBg(drawContext: BarVisualizerDrawContext): void {
  const { ctx, width, height, theme, fullscreen } = drawContext;
  ctx.clearRect(0, 0, width, height);

  if (fullscreen) {
    return;
  }

  ctx.fillStyle = theme.canvasBg;
  roundRect(ctx, 0, 0, width, height, 10);
  ctx.fill();
}

function forEachBar(
  drawContext: BarVisualizerDrawContext,
  drawBar: (barIndex: number, level: number, x: number, barW: number) => void
): void {
  const { width, data, barGap } = drawContext;
  const count = data.length;
  const gap = Math.max(0, barGap);
  const barW = count > 0 ? (width - gap * (count - 1)) / count : width;

  for (let i = 0; i < count; i += 1) {
    const level = data[i] ?? 0;
    const x = i * (barW + gap);
    drawBar(i, level, x, barW);
  }
}

function drawFrequencyBars(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, height, theme, state, barFill, barTrail, glow } = drawContext;
  const useGlow = glow === 'soft';

  if (useGlow) {
    ctx.globalCompositeOperation = 'lighter';
  }

  forEachBar(drawContext, (index, level, x, barW) => {
    if (barTrail === 'peaks') {
      state.peaks[index] = Math.max(level, state.peaks[index] * 0.968);
    } else if (barTrail === 'cascade') {
      state.peaks[index] = Math.max(level, state.peaks[index] * 0.955);
      const trailH = state.peaks[index] * height * 0.92;
      const topY = height - trailH;
      const trailGradient = ctx.createLinearGradient(x, topY, x, height);
      trailGradient.addColorStop(
        0,
        resolveBarFill(drawContext, state.peaks[index], index, drawContext.data.length)
      );
      trailGradient.addColorStop(
        1,
        resolveBarFill(drawContext, level * 0.35, index, drawContext.data.length)
      );
      ctx.fillStyle = trailGradient;
      roundRect(ctx, x, topY, barW, trailH, Math.min(barW / 2, 3));
      ctx.fill();
    }

    const barH = Math.max(barFill === 'glass' ? 3 : 2, level * height * 0.88);
    const y = height - barH;

    if (barFill === 'glass') {
      const glass = ctx.createLinearGradient(x, y, x, height);
      glass.addColorStop(0, rgba(theme.primary, 0.55 + level * 0.35));
      glass.addColorStop(0.5, rgba(theme.secondary, 0.18 + level * 0.25));
      glass.addColorStop(1, rgba(theme.secondary, 0.05));
      ctx.fillStyle = glass;
      roundRect(ctx, x, y, barW, barH, Math.min(barW / 2, 5));
      ctx.fill();
      ctx.strokeStyle = rgba(theme.primary, 0.18 + level * 0.35);
      ctx.lineWidth = 1;
      roundRect(ctx, x + 0.5, y + 0.5, Math.max(1, barW - 1), Math.max(1, barH - 1), Math.min(barW / 2, 4));
      ctx.stroke();
      return;
    }

    const liveH = barTrail === 'cascade' ? Math.max(2, level * height * 0.78) : barH;
    const liveY = height - liveH;
    ctx.fillStyle = resolveBarFill(drawContext, level, index, drawContext.data.length);
    roundRect(ctx, x, liveY, barW, liveH, Math.min(barW / 2, 4));
    ctx.fill();

    if (barH > 6 && barTrail === 'none') {
      ctx.fillStyle = rgba(theme.primary, 0.12 + level * 0.28);
      roundRect(ctx, x + 0.5, liveY + 0.5, Math.max(1, barW - 1), 2, 1);
      ctx.fill();
    }

    if (barTrail === 'peaks') {
      const peakY = height - state.peaks[index] * height * 0.88;
      ctx.fillStyle = rgba(theme.secondary, 0.95);
      roundRect(ctx, x, peakY, barW, 2, 1);
      ctx.fill();
    }
  });

  if (useGlow) {
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawIdlingBars(drawContext: BarVisualizerDrawContext): void {
  drawFrequencyBars(drawContext);
}

function drawMirrorBars(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, height } = drawContext;
  const mid = height / 2;

  forEachBar(drawContext, (index, level, x, barW) => {
    const halfH = Math.max(2, level * mid * 0.92);
    ctx.fillStyle = resolveBarFill(drawContext, level, index, drawContext.data.length);
    roundRect(ctx, x, mid - halfH, barW, halfH, Math.min(barW / 2, 3));
    ctx.fill();
    roundRect(ctx, x, mid, barW, halfH, Math.min(barW / 2, 3));
    ctx.fill();
  });
}

function buildWavePoints(
  drawContext: BarVisualizerDrawContext
): Array<{ x: number; y: number }> {
  const { width, height, data } = drawContext;
  const count = data.length;
  const step = count > 1 ? width / (count - 1) : width;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i += 1) {
    const level = data[i] ?? 0;
    points.push({
      x: i * step,
      y: height - Math.max(4, level * height * 0.86),
    });
  }

  return points;
}

function traceAngularWavePath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length === 0) {
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
}

function traceRibbonWavePath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length < 2) {
    return;
  }

  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

function drawWaveLine(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, width, height, theme, waveStyle } = drawContext;
  const points = buildWavePoints(drawContext);

  if (points.length < 2) {
    return;
  }

  const isRibbon = waveStyle === 'ribbon';

  ctx.beginPath();
  if (isRibbon) {
    traceRibbonWavePath(ctx, points);
  } else {
    traceAngularWavePath(ctx, points);
  }

  if (isRibbon) {
    ctx.save();
    ctx.shadowColor = rgba(theme.primary, 0.45);
    ctx.shadowBlur = 8;
    const ribbonStroke = ctx.createLinearGradient(0, 0, width, 0);
    ribbonStroke.addColorStop(0, rgba(theme.primary, 0.95));
    ribbonStroke.addColorStop(0.5, rgba(theme.secondary, 0.92));
    ribbonStroke.addColorStop(1, rgba(theme.primary, 0.95));
    ctx.strokeStyle = ribbonStroke;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const ribbonFill = ctx.createLinearGradient(0, 0, 0, height);
    ribbonFill.addColorStop(0, rgba(theme.secondary, 0.28));
    ribbonFill.addColorStop(0.55, rgba(theme.primary, 0.12));
    ribbonFill.addColorStop(1, rgba(theme.secondary, 0.02));
    ctx.fillStyle = ribbonFill;
    ctx.fill();
    return;
  }

  ctx.strokeStyle = rgba(theme.primary, 0.92);
  ctx.lineWidth = 1.75;
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.stroke();

  for (let i = 0; i < points.length; i += 2) {
    const point = points[i];
    const level = drawContext.data[i] ?? 0;
    if (level < 0.08) {
      continue;
    }

    ctx.fillStyle = rgba(theme.primary, 0.55 + level * 0.35);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.2 + level * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = rgba(theme.primary, 0.1);
  ctx.fill();
}

function drawDots(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, height } = drawContext;

  forEachBar(drawContext, (index, level, x, barW) => {
    const radius = Math.max(1.5, level * Math.min(barW, height) * 0.42);
    const cx = x + barW / 2;
    const cy = height - radius - 2;
    ctx.fillStyle = resolveBarFill(drawContext, level, index, drawContext.data.length);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawScope(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, width, height, theme, timeData } = drawContext;
  const mid = height / 2;
  const count = timeData.length;

  if (count < 2) {
    return;
  }

  const step = width / (count - 1);
  const amplitude = mid * 0.72;

  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    const x = index * step;
    const sample = timeData[index] ?? 0;
    const y = mid - sample * amplitude;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevX = (index - 1) * step;
      const prevSample = timeData[index - 1] ?? 0;
      const prevY = mid - prevSample * amplitude;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(cpX, prevY, x, y);
    }
  }

  ctx.strokeStyle = rgba(theme.primary, 0.16);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.strokeStyle = rgba(theme.secondary, 0.9);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, rgba(theme.primary, 0.12));
  fill.addColorStop(1, rgba(theme.secondary, 0.02));
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawDriftMist(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, width, height, data, theme, state, fullscreen } = drawContext;
  const layerCount = fullscreen ? 6 : 5;
  advanceAudioStreamTempoPhase(
    state,
    drawContext.tempo,
    fullscreen ? 0.005 : 0.007,
    drawContext.deltaSeconds
  );
  const mistReference = fullscreen ? Math.min(height, 200) : height;
  const waveFrequency = fullscreen ? (150 / Math.max(width, 1)) * 0.012 : 0.012;
  const crossFrequency = fullscreen ? (150 / Math.max(width, 1)) * 0.008 : 0.008;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let layer = 0; layer < layerCount; layer += 1) {
    const bandStart = Math.floor((layer / layerCount) * data.length);
    const bandEnd = Math.floor(((layer + 1) / layerCount) * data.length);
    let energy = 0;
    for (let index = bandStart; index < bandEnd; index += 1) {
      energy += data[index] ?? 0;
    }
    energy /= Math.max(1, bandEnd - bandStart);

    const bandTop = fullscreen ? 0.1 : 0.25;
    const bandReach = fullscreen ? 0.78 : 0.55;
    const layerSpan = Math.max(1, layerCount - 1);
    const baseY = height * (bandTop + (layer / layerSpan) * bandReach);
    const amplitude = (fullscreen ? 8 : 10) + energy * mistReference * (fullscreen ? 0.1 : 0.18);
    const phase = state.phase + layer * 1.3;

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const step = Math.max(fullscreen ? 12 : 8, Math.floor(width / (fullscreen ? 52 : 24)));
    for (let x = 0; x <= width; x += step) {
      const y =
        baseY +
        Math.sin(phase + x * waveFrequency + layer * 0.7) * amplitude +
        Math.cos(phase * 0.6 + x * crossFrequency) * energy * mistReference * 0.04;
      ctx.lineTo(x, y);
    }

    const color = mixRgb(theme.primary, theme.secondary, layer / layerCount);
    const strokeAlpha = fullscreen ? 0.03 + energy * 0.1 : 0.05 + energy * 0.18;
    const lineWidth = fullscreen ? 1.35 + energy * 2 : 6 + energy * 10;

    if (fullscreen) {
      ctx.shadowBlur = 18 + energy * 22;
      ctx.shadowColor = rgba(color, strokeAlpha * 0.9);
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = rgba(color, strokeAlpha);
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (fullscreen && energy > 0.1) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(color, 0.012 + energy * 0.028);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function fadeOrganicCanvas(drawContext: BarVisualizerDrawContext, fadeAlpha: number): void {
  const { ctx, width, height, fullscreen } = drawContext;

  if (!fullscreen) {
    paintCanvasBg(drawContext);
    return;
  }

  ctx.fillStyle = `rgba(8, 10, 14, ${fadeAlpha})`;
  ctx.fillRect(0, 0, width, height);
}

function drawThreadWeave(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, width, height, data, theme, state } = drawContext;
  const threadCount = 7;
  advanceAudioStreamTempoPhase(state, drawContext.tempo, 0.009, drawContext.deltaSeconds);

  for (let thread = 0; thread < threadCount; thread += 1) {
    const bandStart = Math.floor((thread / threadCount) * data.length);
    const bandEnd = Math.floor(((thread + 1) / threadCount) * data.length);
    let energy = 0;
    for (let i = bandStart; i < bandEnd; i += 1) {
      energy += data[i] ?? 0;
    }
    energy /= Math.max(1, bandEnd - bandStart);

    const baseY = ((thread + 1) / (threadCount + 1)) * height;
    const amplitude = 6 + energy * height * 0.22;
    const phase = state.phase + thread * 0.9;

    ctx.beginPath();
    ctx.moveTo(0, baseY);

    const step = Math.max(6, Math.floor(width / 28));
    for (let x = 0; x <= width; x += step) {
      const bin = Math.min(data.length - 1, Math.floor((x / width) * data.length));
      const local = data[bin] ?? 0;
      const y =
        baseY +
        Math.sin(phase + x * 0.018 + thread) * amplitude +
        Math.cos(phase * 0.7 + x * 0.01) * local * height * 0.08;
      ctx.lineTo(x, y);
    }

    const stroke =
      drawContext.colorPalette === 'prism'
        ? `hsla(${thread * 48 + energy * 80}, 72%, 62%, ${0.35 + energy * 0.45})`
        : rgba(mixRgb(theme.primary, theme.secondary, thread / threadCount), 0.28 + energy * 0.5);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1 + energy * 2.4;
    ctx.stroke();

    if (energy > 0.18) {
      ctx.fillStyle = rgba(theme.primary, 0.04 + energy * 0.08);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function resolveCircularVisualizerMetrics(
  drawContext: BarVisualizerDrawContext
): BarVisualizerCircularMetrics {
  const { width, height } = drawContext;
  const extent = Math.min(width, height);

  return {
    cx: width / 2,
    cy: height / 2,
    extent,
  };
}

function drawArcSpectrum(drawContext: BarVisualizerDrawContext): void {
  paintCanvasBg(drawContext);
  const { ctx, data, theme, fullscreen, width, height } = drawContext;
  const count = data.length;
  const { cx, cy, extent } = resolveCircularVisualizerMetrics(drawContext);

  if (fullscreen) {
    const cx = width / 2;
    const cy = height;
    const radiusBase = Math.min(width * 0.5, height * 0.92);
    const inner = radiusBase * 0.34;

    for (let i = 0; i < count; i += 1) {
      const level = data[i] ?? 0;
      const startAngle = Math.PI - (i / count) * Math.PI;
      const endAngle = Math.PI - ((i + 1) / count) * Math.PI;
      const outer = inner + Math.max(2, level * radiusBase * 0.5);

      ctx.beginPath();
      ctx.arc(cx, cy, outer, startAngle, endAngle);
      ctx.arc(cx, cy, inner, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = resolveBarFill(drawContext, level, i, count);
      ctx.fill();
    }

    ctx.fillStyle = rgba(theme.primary, 0.14);
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.92, Math.PI, 0);
    ctx.lineTo(cx - inner * 0.92, cy);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const compact = height < 36;
  const dockCy = compact ? height - 0.5 : height + 4;
  const radiusBase = compact
    ? Math.min(width * 0.48, height * 2.4)
    : Math.min(width, height * 2) * 0.42;
  const inner = radiusBase * (compact ? 0.28 : 0.55);

  for (let i = 0; i < count; i += 1) {
    const level = data[i] ?? 0;
    const startAngle = compact
      ? Math.PI - (i / count) * Math.PI
      : Math.PI + (i / count) * Math.PI;
    const endAngle = compact
      ? Math.PI - ((i + 1) / count) * Math.PI
      : Math.PI + ((i + 1) / count) * Math.PI;
    const outer = inner + Math.max(2, level * radiusBase * (compact ? 0.55 : 0.45));

    ctx.beginPath();
    ctx.arc(cx, dockCy, outer, startAngle, endAngle);
    ctx.arc(cx, dockCy, inner, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = resolveBarFill(drawContext, level, i, count);
    ctx.fill();
  }

  ctx.fillStyle = rgba(theme.primary, compact ? 0.12 : 0.18);
  ctx.beginPath();
  ctx.arc(cx, dockCy, inner * 0.92, 0, Math.PI * 2);
  ctx.fill();
}

export const FREQUENCY_BARS_PRESET_ID = 'idling-bars';

export const REMOVED_BAR_VISUALIZER_PRESET_IDS = new Set([
  'shimmer',
  'aurora',
  'constellation',
  'led',
  'rungs',
  'embers',
  'ember-field',
  'spark',
  'outline',
  'ribbon',
  'prism',
  'glass',
  'peaks',
  'cascade',
  'ambient',
  'aurora-veil',
  'starfall',
  'orbit-swarm',
  'halo',
  'pulse',
]);

export const BAR_VISUALIZER_PRESET_DEFINITIONS: BarVisualizerPresetDefinition[] = [
  {
    id: 'idling-bars',
    label: 'Frequency bars',
    description: 'Classic spectrum bars with fill and trail options',
    dockLayout: 'wide',
    fullscreenLayout: 'strip',
  },
  {
    id: 'scope',
    label: 'Oscilloscope',
    description: 'Live waveform trace',
    dockLayout: 'wide',
    fullscreenLayout: 'strip',
  },
  {
    id: 'mirror',
    label: 'Mirror',
    description: 'Symmetric reflection',
    dockLayout: 'wide',
    fullscreenLayout: 'strip',
  },
  {
    id: 'wave',
    label: 'Wave',
    description: 'Frequency wave line or ribbon',
    dockLayout: 'wide',
    fullscreenLayout: 'strip',
  },
  {
    id: 'dots',
    label: 'Dots',
    description: 'Reactive particle dots',
    dockLayout: 'wide',
    fullscreenLayout: 'strip',
  },
  {
    id: 'thread-weave',
    label: 'Thread weave',
    description: 'Interlaced flowing threads',
    dockLayout: 'wide',
    dockOnly: true,
  },
  {
    id: 'drift-mist',
    label: 'Drift mist',
    description: 'Layered mist bands',
    dockLayout: 'wide',
    fullscreenLayout: 'canvas',
  },
  {
    id: 'arc',
    label: 'Arc',
    description: 'Radial arc ring',
    dockLayout: 'compact',
    fullscreenLayout: 'hemisphere',
    fullscreenOnly: true,
  },
];

const PRESET_DRAWERS: Record<string, BarVisualizerPresetDrawer> = {
  'idling-bars': drawIdlingBars,
  scope: drawScope,
  mirror: drawMirrorBars,
  wave: drawWaveLine,
  dots: drawDots,
  'thread-weave': drawThreadWeave,
  'drift-mist': drawDriftMist,
  arc: drawArcSpectrum,
};

export function normalizeBarVisualizerPresetId(presetId: string): string {
  if (REMOVED_BAR_VISUALIZER_PRESET_IDS.has(presetId)) {
    if (presetId === 'ribbon') {
      return 'wave';
    }
    if (presetId === 'aurora-veil') {
      return 'drift-mist';
    }
    if (presetId === 'starfall') {
      return 'dots';
    }
    if (presetId === 'orbit-swarm' || presetId === 'halo' || presetId === 'pulse') {
      return 'arc';
    }
    if (presetId === 'glass' || presetId === 'peaks' || presetId === 'cascade' || presetId === 'ambient' || presetId === 'prism') {
      return FREQUENCY_BARS_PRESET_ID;
    }
    return 'wave';
  }

  return BAR_VISUALIZER_PRESET_DEFINITIONS.some((preset) => preset.id === presetId)
    ? presetId
    : 'wave';
}

export function isFrequencyBarsVisualizerPreset(presetId: string): boolean {
  return normalizeBarVisualizerPresetId(presetId) === FREQUENCY_BARS_PRESET_ID;
}

export function isBarVisualizerFullscreenOnly(presetId: string): boolean {
  const normalized = normalizeBarVisualizerPresetId(presetId);
  return (
    BAR_VISUALIZER_PRESET_DEFINITIONS.find((preset) => preset.id === normalized)?.fullscreenOnly ===
    true
  );
}

export function isBarVisualizerDockOnly(presetId: string): boolean {
  const normalized = normalizeBarVisualizerPresetId(presetId);
  return (
    BAR_VISUALIZER_PRESET_DEFINITIONS.find((preset) => preset.id === normalized)?.dockOnly === true
  );
}

export function getBarVisualizerFullscreenLayout(presetId: string): BarVisualizerFullscreenLayout {
  const normalized = normalizeBarVisualizerPresetId(presetId);
  const preset = BAR_VISUALIZER_PRESET_DEFINITIONS.find((entry) => entry.id === normalized);
  return preset?.fullscreenLayout ?? 'strip';
}

export function isScopeVisualizerPreset(presetId: string): boolean {
  return normalizeBarVisualizerPresetId(presetId) === 'scope';
}

export function isBarVisualizerCircularPreset(presetId: string): boolean {
  const layout = getBarVisualizerFullscreenLayout(presetId);
  return layout === 'radial' || layout === 'hemisphere';
}

export function listBarVisualizerPresetsForSurface(
  surface: BarVisualizerSurface
): BarVisualizerPresetDefinition[] {
  if (surface === 'expanded') {
    return BAR_VISUALIZER_PRESET_DEFINITIONS.filter((preset) => !preset.dockOnly);
  }

  return BAR_VISUALIZER_PRESET_DEFINITIONS.filter((preset) => !preset.fullscreenOnly);
}

export function createBarVisualizerRuntime(
  presetId: string,
  barCount: number
): BarVisualizerRuntimeHandle {
  const normalizedPresetId = normalizeBarVisualizerPresetId(presetId);
  const drawer = PRESET_DRAWERS[normalizedPresetId] ?? drawIdlingBars;
  const state = {
    peaks: new Float32Array(barCount),
    phase: 0,
  };

  return {
    presetId: PRESET_DRAWERS[normalizedPresetId] ? normalizedPresetId : 'idling-bars',
    draw(drawContext) {
      drawer(drawContext);
    },
    reset() {
      state.peaks.fill(0);
      state.phase = 0;
    },
    resize(nextBarCount) {
      if (state.peaks.length !== nextBarCount) {
        state.peaks = new Float32Array(nextBarCount);
      }
    },
    getState: () => state,
  };
}

export function getBarVisualizerPresetDefinition(presetId: string): BarVisualizerPresetDefinition {
  const normalized = normalizeBarVisualizerPresetId(presetId);
  return (
    BAR_VISUALIZER_PRESET_DEFINITIONS.find((preset) => preset.id === normalized) ??
    BAR_VISUALIZER_PRESET_DEFINITIONS[0]
  );
}

export function getBarVisualizerDockLayout(presetId: string): BarVisualizerDockLayout {
  return getBarVisualizerPresetDefinition(presetId).dockLayout;
}
