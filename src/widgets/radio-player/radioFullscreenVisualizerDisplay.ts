export interface RadioFullscreenVisualizerDisplay {
  enabled: boolean;
  opacity: number;
  presetIndex: number;
}

export const RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY =
  'idling-radio-fullscreen-viz-display';

export const DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY: RadioFullscreenVisualizerDisplay = {
  enabled: true,
  opacity: 1,
  presetIndex: 0,
};

export function clampRadioFullscreenVisualizerOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
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
    })
  );
}
