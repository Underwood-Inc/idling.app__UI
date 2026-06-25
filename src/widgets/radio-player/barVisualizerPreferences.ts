import type {
  BarVisualizerBarFill,
  BarVisualizerBarTrail,
  BarVisualizerColorPalette,
  BarVisualizerDensity,
  BarVisualizerDockLayoutMode,
  BarVisualizerGlow,
  BarVisualizerPreferences,
  BarVisualizerWaveStyle,
} from './barVisualizer.types';
import {
  getBarVisualizerDockLayout,
  isBarVisualizerFullscreenOnly,
  isBarVisualizerDockOnly,
  listBarVisualizerPresetsForSurface,
  normalizeBarVisualizerPresetId,
} from './barVisualizerPresets';

export const BAR_VISUALIZER_PREFS_STORAGE_KEY = 'idling-radio-player-viz-prefs';

export const DEFAULT_BAR_VISUALIZER_PREFERENCES: BarVisualizerPreferences = {
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
  dockOpacity: 0.28,
  dockLayoutMode: 'backdrop',
};

export const BAR_COUNT_BY_DENSITY: Record<BarVisualizerDensity, number> = {
  compact: 24,
  normal: 40,
  wide: 56,
};

/** Target pixel width per bar slot — lower = tighter spacing / more bars. */
export const BAR_SLOT_WIDTH_BY_DENSITY: Record<BarVisualizerDensity, number> = {
  compact: 3,
  normal: 5,
  wide: 8,
};

/** Gap between bars in the dock canvas (CSS px). */
export const BAR_GAP_BY_DENSITY: Record<BarVisualizerDensity, number> = {
  compact: 1,
  normal: 2,
  wide: 4,
};

export interface ResolveBarCountForCanvasInput {
  density: BarVisualizerDensity;
  canvasWidthPx: number;
  presetId: string;
}

const MAX_BAR_COUNT = 128;

export function resolveBarGapForDensity(density: BarVisualizerDensity): number {
  return BAR_GAP_BY_DENSITY[density] ?? BAR_GAP_BY_DENSITY.normal;
}

export function resolveBarCountForCanvas({
  density,
  canvasWidthPx,
  presetId,
}: ResolveBarCountForCanvasInput): number {
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

function isDensity(value: unknown): value is BarVisualizerDensity {
  return value === 'compact' || value === 'normal' || value === 'wide';
}

function isColorPalette(value: unknown): value is BarVisualizerColorPalette {
  return value === 'theme' || value === 'prism';
}

function isWaveStyle(value: unknown): value is BarVisualizerWaveStyle {
  return value === 'line' || value === 'ribbon';
}

function isBarFill(value: unknown): value is BarVisualizerBarFill {
  return value === 'solid' || value === 'glass';
}

function isBarTrail(value: unknown): value is BarVisualizerBarTrail {
  return value === 'none' || value === 'peaks' || value === 'cascade';
}

function isGlow(value: unknown): value is BarVisualizerGlow {
  return value === 'off' || value === 'soft';
}

export const SCOPE_SMOOTHING_RANGE = {
  min: 0.35,
  max: 0.95,
  step: 0.01,
} as const;

export function clampScopeSmoothing(value: number): number {
  return Math.min(SCOPE_SMOOTHING_RANGE.max, Math.max(SCOPE_SMOOTHING_RANGE.min, value));
}

export interface DockOpacityRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

/** Dock backdrop opacity — lower ceiling than fullscreen spectrum. */
export const DOCK_OPACITY_RANGE: DockOpacityRange = {
  min: 0.05,
  max: 0.45,
  step: 0.05,
  default: 0.28,
};

export function clampDockOpacity(value: number): number {
  return Math.min(DOCK_OPACITY_RANGE.max, Math.max(DOCK_OPACITY_RANGE.min, value));
}

export function normalizeDockLayoutMode(value: unknown): BarVisualizerDockLayoutMode {
  return value === 'inline' ? 'inline' : 'backdrop';
}

interface LegacyVisualizerStyleMigration {
  barFill: BarVisualizerBarFill;
  barTrail: BarVisualizerBarTrail;
  glow: BarVisualizerGlow;
}

function migrateLegacyVisualizerStyle(legacyPresetId: string): LegacyVisualizerStyleMigration {
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

function normalizeDockPresetId(presetId: string): string {
  const normalized = normalizeBarVisualizerPresetId(presetId);
  if (isBarVisualizerFullscreenOnly(normalized)) {
    return DEFAULT_BAR_VISUALIZER_PREFERENCES.dockPresetId;
  }

  return normalized;
}

export function resolveBarVisualizerPresetForSurface(
  prefs: BarVisualizerPreferences,
  surface: 'dock' | 'expanded'
): string {
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

export function loadBarVisualizerPreferences(): BarVisualizerPreferences {
  try {
    const raw = localStorage.getItem(BAR_VISUALIZER_PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
    }

    const parsed = JSON.parse(raw) as Partial<BarVisualizerPreferences> & {
      presetId?: string;
    };
    const legacyPresetId =
      typeof parsed.presetId === 'string' ? parsed.presetId : DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId;
    const migratedWaveStyle: BarVisualizerWaveStyle =
      legacyPresetId === 'ribbon'
        ? 'ribbon'
        : isWaveStyle(parsed.waveStyle)
          ? parsed.waveStyle
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.waveStyle;
    const legacyStyle = migrateLegacyVisualizerStyle(legacyPresetId);
    const normalizedPresetId = normalizeBarVisualizerPresetId(legacyPresetId);
    const migratedColorPalette: BarVisualizerColorPalette =
      legacyPresetId === 'prism' || normalizedPresetId === 'prism'
        ? 'prism'
        : isColorPalette(parsed.colorPalette)
          ? parsed.colorPalette
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.colorPalette;
    const presetIdAfterPrismMigration =
      normalizedPresetId === 'prism' ? 'idling-bars' : normalizedPresetId;
    const dockPresetId = normalizeDockPresetId(
      typeof parsed.dockPresetId === 'string' ? parsed.dockPresetId : presetIdAfterPrismMigration
    );
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
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.enabled,
      waveStyle: migratedWaveStyle,
      colorPalette: migratedColorPalette,
      barFill: isBarFill(parsed.barFill) ? parsed.barFill : legacyStyle.barFill,
      barTrail: isBarTrail(parsed.barTrail) ? parsed.barTrail : legacyStyle.barTrail,
      glow: isGlow(parsed.glow) ? parsed.glow : legacyStyle.glow,
      scopeSmoothing:
        typeof parsed.scopeSmoothing === 'number'
          ? clampScopeSmoothing(parsed.scopeSmoothing)
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.scopeSmoothing,
      dockOpacity:
        typeof parsed.dockOpacity === 'number'
          ? clampDockOpacity(parsed.dockOpacity)
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.dockOpacity,
      dockLayoutMode: normalizeDockLayoutMode(parsed.dockLayoutMode),
    };
  } catch {
    return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
  }
}

export function saveBarVisualizerPreferences(prefs: BarVisualizerPreferences): void {
  localStorage.setItem(BAR_VISUALIZER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

export function isKnownDockBarVisualizerPresetId(presetId: string): boolean {
  return listBarVisualizerPresetsForSurface('dock').some((preset) => preset.id === presetId);
}
