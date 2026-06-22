import type { BarVisualizerDensity, BarVisualizerPreferences } from './barVisualizer.types';
import { getBarVisualizerDockLayout } from './barVisualizerPresets';

export const BAR_VISUALIZER_PREFS_STORAGE_KEY = 'idling-radio-player-viz-prefs';

export const DEFAULT_BAR_VISUALIZER_PREFERENCES: BarVisualizerPreferences = {
  presetId: 'wave',
  density: 'normal',
  enabled: true,
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

export function loadBarVisualizerPreferences(): BarVisualizerPreferences {
  try {
    const raw = localStorage.getItem(BAR_VISUALIZER_PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
    }

    const parsed = JSON.parse(raw) as Partial<BarVisualizerPreferences>;
    return {
      presetId:
        typeof parsed.presetId === 'string'
          ? parsed.presetId
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.presetId,
      density: isDensity(parsed.density)
        ? parsed.density
        : DEFAULT_BAR_VISUALIZER_PREFERENCES.density,
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_BAR_VISUALIZER_PREFERENCES.enabled,
    };
  } catch {
    return { ...DEFAULT_BAR_VISUALIZER_PREFERENCES };
  }
}

export function saveBarVisualizerPreferences(prefs: BarVisualizerPreferences): void {
  localStorage.setItem(BAR_VISUALIZER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
