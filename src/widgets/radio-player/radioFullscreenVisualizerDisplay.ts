export interface RadioFullscreenSpectrumBarHeightRange {
  min: number;
  max: number;
}

export interface RadioFullscreenVisualizerDisplay {
  enabled: boolean;
  opacity: number;
  presetIndex: number;
  spectrumBarHeight: number;
}

export const RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE: RadioFullscreenSpectrumBarHeightRange = {
  min: 0.5,
  max: 2.5,
};

export const RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY =
  'idling-radio-fullscreen-viz-display';

export const DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY: RadioFullscreenVisualizerDisplay = {
  enabled: true,
  opacity: 1,
  presetIndex: 0,
  spectrumBarHeight: 1,
};

export function clampRadioFullscreenVisualizerOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function clampRadioFullscreenSpectrumBarHeight(value: number): number {
  return Math.min(
    RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.max,
    Math.max(RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.min, value)
  );
}

export function resolveRadioFullscreenLinearBoost(
  baseLinearBoost: number,
  spectrumBarHeight: number
): number {
  return Math.max(1, baseLinearBoost * clampRadioFullscreenSpectrumBarHeight(spectrumBarHeight));
}

export interface ResolveRadioFullscreenRadialRadiusInput {
  presetRadius?: number;
  channelLayout?: string;
  spectrumBarHeight: number;
}

export function resolveRadioFullscreenRadialRadius({
  presetRadius,
  channelLayout,
  spectrumBarHeight,
}: ResolveRadioFullscreenRadialRadiusInput): number {
  const barHeight = clampRadioFullscreenSpectrumBarHeight(spectrumBarHeight);
  const baseRadius = presetRadius ?? 0.15;
  const isDualCombined = channelLayout === 'dual-combined';
  const scaledRadius = baseRadius / barHeight;
  const minimumRadius = isDualCombined ? 0.035 : 0.05;

  return Math.max(minimumRadius, Math.min(0.18, scaledRadius));
}

export function normalizeRadioFullscreenVisualizerPresetIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY.presetIndex;
  }

  return Math.max(0, Math.floor(value));
}

export function loadRadioFullscreenVisualizerDisplay(): RadioFullscreenVisualizerDisplay {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY };
  }

  try {
    const raw = localStorage.getItem(RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY };
    }

    const parsed = JSON.parse(raw) as Partial<RadioFullscreenVisualizerDisplay>;
    return {
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY.enabled,
      opacity:
        typeof parsed.opacity === 'number'
          ? clampRadioFullscreenVisualizerOpacity(parsed.opacity)
          : DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY.opacity,
      presetIndex: normalizeRadioFullscreenVisualizerPresetIndex(parsed.presetIndex),
      spectrumBarHeight:
        typeof parsed.spectrumBarHeight === 'number'
          ? clampRadioFullscreenSpectrumBarHeight(parsed.spectrumBarHeight)
          : DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY.spectrumBarHeight,
    };
  } catch {
    return { ...DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY };
  }
}

export function saveRadioFullscreenVisualizerDisplay(
  display: RadioFullscreenVisualizerDisplay
): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
    JSON.stringify({
      enabled: display.enabled,
      opacity: clampRadioFullscreenVisualizerOpacity(display.opacity),
      presetIndex: normalizeRadioFullscreenVisualizerPresetIndex(display.presetIndex),
      spectrumBarHeight: clampRadioFullscreenSpectrumBarHeight(display.spectrumBarHeight),
    })
  );
}
