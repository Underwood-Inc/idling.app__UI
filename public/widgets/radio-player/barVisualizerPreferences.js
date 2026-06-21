import { getBarVisualizerDockLayout } from './barVisualizerPresets';
export const BAR_VISUALIZER_PREFS_STORAGE_KEY = 'idling-radio-player-viz-prefs';
export const DEFAULT_BAR_VISUALIZER_PREFERENCES = {
    presetId: 'wave',
    density: 'normal',
};
export const BAR_COUNT_BY_DENSITY = {
    compact: 24,
    normal: 40,
    wide: 56,
};
const BAR_SLOT_WIDTH_PX = 5;
const MAX_BAR_COUNT = 128;
export function resolveBarCountForCanvas({ density, canvasWidthPx, presetId, }) {
    const baseCount = BAR_COUNT_BY_DENSITY[density] ?? BAR_COUNT_BY_DENSITY.normal;
    if (getBarVisualizerDockLayout(presetId) === 'compact') {
        return baseCount;
    }
    if (canvasWidthPx <= 0) {
        return baseCount;
    }
    const widthScaledCount = Math.round(canvasWidthPx / BAR_SLOT_WIDTH_PX);
    return Math.min(MAX_BAR_COUNT, Math.max(baseCount, widthScaledCount));
}
function isDensity(value) {
    return value === 'compact' || value === 'normal' || value === 'wide';
}
export function loadBarVisualizerPreferences() {
    try {
        const raw = localStorage.getItem(BAR_VISUALIZER_PREFS_STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
        }
        const parsed = JSON.parse(raw);
        return {
            presetId: typeof parsed.presetId === 'string'
                ? parsed.presetId
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId,
            density: isDensity(parsed.density)
                ? parsed.density
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.density,
        };
    }
    catch {
        return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
    }
}
export function saveBarVisualizerPreferences(prefs) {
    localStorage.setItem(BAR_VISUALIZER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
