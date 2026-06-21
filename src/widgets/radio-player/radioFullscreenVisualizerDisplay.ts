import {
  getRadioVisualizerPresetIndex,
  RADIO_FULLSCREEN_DEFAULT_PRESET_ID,
} from './radioVisualizerPresets';

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
  min: 0.35,
  max: 1.5,
};

export interface RadioFullscreenBarHeightMultiplierRange {
  min: number;
  max: number;
}

/** Visual / amplitude multiplier applied from the bar-height slider. */
export const RADIO_FULLSCREEN_BAR_HEIGHT_MULTIPLIER_RANGE: RadioFullscreenBarHeightMultiplierRange = {
  min: 0.45,
  max: 1.15,
};

export function resolveRadioFullscreenBarHeightMultiplier(spectrumBarHeight: number): number {
  const height = clampRadioFullscreenSpectrumBarHeight(spectrumBarHeight);
  const sliderMin = RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.min;
  const sliderMax = RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.max;

  if (height <= 1) {
    const progress = (height - sliderMin) / (1 - sliderMin);
    return (
      RADIO_FULLSCREEN_BAR_HEIGHT_MULTIPLIER_RANGE.min +
      progress * (1 - RADIO_FULLSCREEN_BAR_HEIGHT_MULTIPLIER_RANGE.min)
    );
  }

  const progress = (height - 1) / (sliderMax - 1);
  return 1 + progress * (RADIO_FULLSCREEN_BAR_HEIGHT_MULTIPLIER_RANGE.max - 1);
}

export const RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY =
  'idling-radio-fullscreen-viz-display';

export const DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY: RadioFullscreenVisualizerDisplay = {
  enabled: true,
  opacity: 1,
  presetIndex: getRadioVisualizerPresetIndex(RADIO_FULLSCREEN_DEFAULT_PRESET_ID),
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
  const multiplier = resolveRadioFullscreenBarHeightMultiplier(spectrumBarHeight);
  return Math.max(1, baseLinearBoost * (0.85 + multiplier * 0.15));
}

export interface RadioFullscreenSensitivityRange {
  minDecibels: number;
  maxDecibels: number;
}

export interface ResolveRadioFullscreenSensitivityInput {
  spectrumBarHeight: number;
  baseMinDecibels?: number;
  baseMaxDecibels?: number;
}

export function resolveRadioFullscreenSensitivity({
  spectrumBarHeight,
  baseMinDecibels = -88,
  baseMaxDecibels = -22,
}: ResolveRadioFullscreenSensitivityInput): RadioFullscreenSensitivityRange {
  const multiplier = resolveRadioFullscreenBarHeightMultiplier(spectrumBarHeight);
  const baseRange = baseMaxDecibels - baseMinDecibels;
  const adjustedRange = Math.min(102, Math.max(30, baseRange / multiplier));
  const mid = (baseMaxDecibels + baseMinDecibels) / 2;

  return {
    minDecibels: Math.max(-100, mid - adjustedRange / 2),
    maxDecibels: Math.min(-6, mid + adjustedRange / 2),
  };
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
  const multiplier = resolveRadioFullscreenBarHeightMultiplier(spectrumBarHeight);
  const baseRadius = presetRadius ?? 0.15;
  const isDualCombined = channelLayout === 'dual-combined';
  const scaledRadius = baseRadius / multiplier;
  const minimumRadius = isDualCombined ? 0.035 : 0.05;

  return Math.max(minimumRadius, Math.min(0.18, scaledRadius));
}

export function normalizeRadioFullscreenVisualizerPresetIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return getRadioVisualizerPresetIndex(RADIO_FULLSCREEN_DEFAULT_PRESET_ID);
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
