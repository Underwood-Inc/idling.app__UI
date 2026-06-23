export const RADIO_STATION_PANEL_HEIGHT_STORAGE_KEY = 'idling-radio-station-panel-height';

export interface RadioStationPanelHeightRangePx {
  min: number;
  max: number;
}

export const RADIO_STATION_PANEL_HEIGHT_RANGE_PX: RadioStationPanelHeightRangePx = {
  min: 280,
  max: 832,
};

export const RADIO_STATION_PANEL_HEIGHT_VIEWPORT_RATIO = 0.82;

export function resolveRadioStationPanelHeightMax(viewportHeightPx: number): number {
  const viewportCap = Math.round(viewportHeightPx * RADIO_STATION_PANEL_HEIGHT_VIEWPORT_RATIO);
  return Math.min(RADIO_STATION_PANEL_HEIGHT_RANGE_PX.max, Math.max(RADIO_STATION_PANEL_HEIGHT_RANGE_PX.min, viewportCap));
}

export function clampRadioStationPanelHeight(
  heightPx: number,
  viewportHeightPx: number = typeof window !== 'undefined' ? window.innerHeight : 900
): number {
  const max = resolveRadioStationPanelHeightMax(viewportHeightPx);
  return Math.min(max, Math.max(RADIO_STATION_PANEL_HEIGHT_RANGE_PX.min, Math.round(heightPx)));
}

/** `null` = use the CSS default height. */
export function loadRadioStationPanelHeight(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(RADIO_STATION_PANEL_HEIGHT_STORAGE_KEY);
    if (!raw || raw === 'auto') {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return clampRadioStationPanelHeight(parsed);
  } catch {
    return null;
  }
}

export function saveRadioStationPanelHeight(heightPx: number | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (heightPx === null) {
      localStorage.setItem(RADIO_STATION_PANEL_HEIGHT_STORAGE_KEY, 'auto');
      return;
    }

    localStorage.setItem(
      RADIO_STATION_PANEL_HEIGHT_STORAGE_KEY,
      String(clampRadioStationPanelHeight(heightPx))
    );
  } catch {
    // Ignore write failures.
  }
}
