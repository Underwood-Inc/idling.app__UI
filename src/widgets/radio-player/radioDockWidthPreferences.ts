export const RADIO_DOCK_WIDTH_STORAGE_KEY = 'idling-radio-dock-width';

export interface RadioDockWidthRangePx {
  min: number;
  max: number;
}

export const RADIO_DOCK_WIDTH_RANGE_PX: RadioDockWidthRangePx = {
  min: 280,
  max: 960,
};

export function clampRadioDockWidth(widthPx: number): number {
  return Math.min(
    RADIO_DOCK_WIDTH_RANGE_PX.max,
    Math.max(RADIO_DOCK_WIDTH_RANGE_PX.min, Math.round(widthPx))
  );
}

export function resolveRadioDockWidthMax(viewportWidthPx: number): number {
  const viewportCap = Math.max(RADIO_DOCK_WIDTH_RANGE_PX.min, viewportWidthPx - 16);
  return Math.min(RADIO_DOCK_WIDTH_RANGE_PX.max, viewportCap);
}

/** `null` = stretch to available viewport width. */
export function loadRadioDockWidth(): number | null {
  try {
    const raw = localStorage.getItem(RADIO_DOCK_WIDTH_STORAGE_KEY);
    if (!raw || raw === 'auto') {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return clampRadioDockWidth(parsed);
  } catch {
    return null;
  }
}

export function saveRadioDockWidth(widthPx: number | null): void {
  if (widthPx === null) {
    localStorage.setItem(RADIO_DOCK_WIDTH_STORAGE_KEY, 'auto');
    return;
  }

  localStorage.setItem(RADIO_DOCK_WIDTH_STORAGE_KEY, String(clampRadioDockWidth(widthPx)));
}
