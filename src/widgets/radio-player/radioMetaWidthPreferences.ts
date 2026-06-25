export const RADIO_META_WIDTH_STORAGE_KEY = 'idling-radio-meta-width';

export interface RadioMetaWidthRangePx {
  min: number;
  max: number;
}

/** Station + track subtitle column width (px). */
export const RADIO_META_WIDTH_RANGE_PX: RadioMetaWidthRangePx = {
  min: 72,
  max: 560,
};

/** Space reserved for play, transport, volume, and action buttons (dock viz is a backdrop). */
export const RADIO_META_WIDTH_ROW_RESERVE_PX = 230;

/** Fullscreen dock has no inline visualizer — only play, controls, and padding. */
export const RADIO_META_WIDTH_ROW_RESERVE_FULLSCREEN_PX = 220;

export interface ResolveRadioMetaWidthMaxInput {
  rowWidthPx: number;
  isFullscreen?: boolean;
}

export function resolveRadioMetaWidthMax({
  rowWidthPx,
  isFullscreen = false,
}: ResolveRadioMetaWidthMaxInput): number {
  const reserve = isFullscreen
    ? RADIO_META_WIDTH_ROW_RESERVE_FULLSCREEN_PX
    : RADIO_META_WIDTH_ROW_RESERVE_PX;
  const maxCap = isFullscreen ? 960 : RADIO_META_WIDTH_RANGE_PX.max;
  const available = rowWidthPx - reserve;
  return Math.min(maxCap, Math.max(RADIO_META_WIDTH_RANGE_PX.min, Math.round(available)));
}

export interface ClampRadioMetaWidthInput {
  widthPx: number;
  rowWidthPx: number;
  isFullscreen?: boolean;
}

export function clampRadioMetaWidth({
  widthPx,
  rowWidthPx,
  isFullscreen = false,
}: ClampRadioMetaWidthInput): number {
  const max = resolveRadioMetaWidthMax({ rowWidthPx, isFullscreen });
  return Math.min(max, Math.max(RADIO_META_WIDTH_RANGE_PX.min, Math.round(widthPx)));
}

/** `null` = use CSS clamp defaults. */
export function loadRadioMetaWidth(): number | null {
  try {
    const raw = localStorage.getItem(RADIO_META_WIDTH_STORAGE_KEY);
    if (!raw || raw === 'auto') {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveRadioMetaWidth(widthPx: number | null): void {
  if (widthPx === null) {
    localStorage.setItem(RADIO_META_WIDTH_STORAGE_KEY, 'auto');
    return;
  }

  localStorage.setItem(RADIO_META_WIDTH_STORAGE_KEY, String(Math.round(widthPx)));
}
