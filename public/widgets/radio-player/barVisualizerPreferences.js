/** @typedef {import('./barVisualizer.types').BarVisualizerPreferences} BarVisualizerPreferences */
/** @typedef {import('./barVisualizer.types').BarVisualizerDensity} BarVisualizerDensity */

export const BAR_VISUALIZER_PREFS_STORAGE_KEY = 'idling-radio-player-viz-prefs';

/** @type {BarVisualizerPreferences} */
export const DEFAULT_BAR_VISUALIZER_PREFERENCES = {
  presetId: 'idling-bars',
  density: 'normal',
};

/** @type {Record<BarVisualizerDensity, number>} */
export const BAR_COUNT_BY_DENSITY = {
  compact: 24,
  normal: 40,
  wide: 56,
};

/**
 * @param {unknown} value
 * @returns {value is BarVisualizerDensity}
 */
function isDensity(value) {
  return value === 'compact' || value === 'normal' || value === 'wide';
}

/**
 * @returns {BarVisualizerPreferences}
 */
export function loadBarVisualizerPreferences() {
  try {
    const raw = localStorage.getItem(BAR_VISUALIZER_PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
    }

    const parsed = JSON.parse(raw);
    return {
      presetId:
        typeof parsed.presetId === 'string'
          ? parsed.presetId
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId,
      density: isDensity(parsed.density)
        ? parsed.density
        : DEFAULT_BAR_VISUALIZER_PREFERENCES.density,
    };
  } catch {
    return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
  }
}

/** @param {BarVisualizerPreferences} prefs */
export function saveBarVisualizerPreferences(prefs) {
  localStorage.setItem(BAR_VISUALIZER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
