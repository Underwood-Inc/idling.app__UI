import { getBarVisualizerDockLayout, isBarVisualizerFullscreenOnly, isBarVisualizerDockOnly, listBarVisualizerPresetsForSurface, normalizeBarVisualizerPresetId, } from './barVisualizerPresets';
export const BAR_VISUALIZER_PREFS_STORAGE_KEY = 'idling-radio-player-viz-prefs';
export const DEFAULT_BAR_VISUALIZER_PREFERENCES = {
    presetId: 'wave',
    dockPresetId: 'drift-mist',
    density: 'normal',
    enabled: true,
    waveStyle: 'line',
    colorPalette: 'theme',
    barFill: 'solid',
    barTrail: 'none',
    glow: 'off',
    scopeSmoothing: 0.62,
};
export const BAR_COUNT_BY_DENSITY = {
    compact: 24,
    normal: 40,
    wide: 56,
};
/** Target pixel width per bar slot — lower = tighter spacing / more bars. */
export const BAR_SLOT_WIDTH_BY_DENSITY = {
    compact: 3,
    normal: 5,
    wide: 8,
};
/** Gap between bars in the dock canvas (CSS px). */
export const BAR_GAP_BY_DENSITY = {
    compact: 1,
    normal: 2,
    wide: 4,
};
const MAX_BAR_COUNT = 128;
export function resolveBarGapForDensity(density) {
    return BAR_GAP_BY_DENSITY[density] ?? BAR_GAP_BY_DENSITY.normal;
}
export function resolveBarCountForCanvas({ density, canvasWidthPx, presetId, }) {
    if (getBarVisualizerDockLayout(presetId) === 'compact') {
        return BAR_COUNT_BY_DENSITY[density] ?? BAR_COUNT_BY_DENSITY.normal;
    }
    if (canvasWidthPx <= 0) {
        return BAR_COUNT_BY_DENSITY[density] ?? BAR_COUNT_BY_DENSITY.normal;
    }
    const slotWidth = BAR_SLOT_WIDTH_BY_DENSITY[density] ?? BAR_SLOT_WIDTH_BY_DENSITY.normal;
    const widthScaledCount = Math.round(canvasWidthPx / slotWidth);
    return Math.min(MAX_BAR_COUNT, Math.max(8, widthScaledCount));
}
function isDensity(value) {
    return value === 'compact' || value === 'normal' || value === 'wide';
}
function isColorPalette(value) {
    return value === 'theme' || value === 'prism';
}
function isWaveStyle(value) {
    return value === 'line' || value === 'ribbon';
}
function isBarFill(value) {
    return value === 'solid' || value === 'glass';
}
function isBarTrail(value) {
    return value === 'none' || value === 'peaks' || value === 'cascade';
}
function isGlow(value) {
    return value === 'off' || value === 'soft';
}
export const SCOPE_SMOOTHING_RANGE = {
    min: 0.35,
    max: 0.95,
    step: 0.01,
};
export function clampScopeSmoothing(value) {
    return Math.min(SCOPE_SMOOTHING_RANGE.max, Math.max(SCOPE_SMOOTHING_RANGE.min, value));
}
function migrateLegacyVisualizerStyle(legacyPresetId) {
    switch (legacyPresetId) {
        case 'glass':
            return { barFill: 'glass', barTrail: 'none', glow: 'off' };
        case 'peaks':
            return { barFill: 'solid', barTrail: 'peaks', glow: 'off' };
        case 'cascade':
            return { barFill: 'solid', barTrail: 'cascade', glow: 'off' };
        case 'ambient':
            return { barFill: 'solid', barTrail: 'none', glow: 'soft' };
        default:
            return {
                barFill: DEFAULT_BAR_VISUALIZER_PREFERENCES.barFill,
                barTrail: DEFAULT_BAR_VISUALIZER_PREFERENCES.barTrail,
                glow: DEFAULT_BAR_VISUALIZER_PREFERENCES.glow,
            };
    }
}
function normalizeDockPresetId(presetId) {
    const normalized = normalizeBarVisualizerPresetId(presetId);
    if (isBarVisualizerFullscreenOnly(normalized)) {
        return DEFAULT_BAR_VISUALIZER_PREFERENCES.dockPresetId;
    }
    return normalized;
}
export function resolveBarVisualizerPresetForSurface(prefs, surface) {
    if (surface === 'expanded') {
        const normalized = normalizeBarVisualizerPresetId(prefs.presetId);
        if (isBarVisualizerDockOnly(normalized)) {
            const dockFallback = normalizeDockPresetId(prefs.dockPresetId);
            return isBarVisualizerDockOnly(dockFallback)
                ? DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId
                : dockFallback;
        }
        return normalized;
    }
    return normalizeDockPresetId(prefs.dockPresetId);
}
export function loadBarVisualizerPreferences() {
    try {
        const raw = localStorage.getItem(BAR_VISUALIZER_PREFS_STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
        }
        const parsed = JSON.parse(raw);
        const legacyPresetId = typeof parsed.presetId === 'string' ? parsed.presetId : DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId;
        const migratedWaveStyle = legacyPresetId === 'ribbon'
            ? 'ribbon'
            : isWaveStyle(parsed.waveStyle)
                ? parsed.waveStyle
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.waveStyle;
        const legacyStyle = migrateLegacyVisualizerStyle(legacyPresetId);
        const normalizedPresetId = normalizeBarVisualizerPresetId(legacyPresetId);
        const migratedColorPalette = legacyPresetId === 'prism' || normalizedPresetId === 'prism'
            ? 'prism'
            : isColorPalette(parsed.colorPalette)
                ? parsed.colorPalette
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.colorPalette;
        const presetIdAfterPrismMigration = normalizedPresetId === 'prism' ? 'idling-bars' : normalizedPresetId;
        const dockPresetId = normalizeDockPresetId(typeof parsed.dockPresetId === 'string' ? parsed.dockPresetId : presetIdAfterPrismMigration);
        const presetId = isBarVisualizerFullscreenOnly(presetIdAfterPrismMigration)
            ? presetIdAfterPrismMigration
            : isBarVisualizerDockOnly(presetIdAfterPrismMigration)
                ? DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId
                : dockPresetId;
        return {
            presetId,
            dockPresetId,
            density: isDensity(parsed.density)
                ? parsed.density
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.density,
            enabled: typeof parsed.enabled === 'boolean'
                ? parsed.enabled
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.enabled,
            waveStyle: migratedWaveStyle,
            colorPalette: migratedColorPalette,
            barFill: isBarFill(parsed.barFill) ? parsed.barFill : legacyStyle.barFill,
            barTrail: isBarTrail(parsed.barTrail) ? parsed.barTrail : legacyStyle.barTrail,
            glow: isGlow(parsed.glow) ? parsed.glow : legacyStyle.glow,
            scopeSmoothing: typeof parsed.scopeSmoothing === 'number'
                ? clampScopeSmoothing(parsed.scopeSmoothing)
                : DEFAULT_BAR_VISUALIZER_PREFERENCES.scopeSmoothing,
        };
    }
    catch {
        return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
    }
}
export function saveBarVisualizerPreferences(prefs) {
    localStorage.setItem(BAR_VISUALIZER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
export function isKnownDockBarVisualizerPresetId(presetId) {
    return listBarVisualizerPresetsForSurface('dock').some((preset) => preset.id === presetId);
}
