export const RADIO_SAVED_SONG_ROW_HEIGHT_PX = 44;

const OVERSCAN_ROWS = 2;
const LIST_CHROME_PX = 148;

export function resolveRadioSavedSongViewportHeight(
  measuredHeightPx: number,
  panelHeightPx: number | null
): number {
  if (measuredHeightPx > 0) {
    return measuredHeightPx;
  }

  return Math.max((panelHeightPx ?? 320) - LIST_CHROME_PX, RADIO_SAVED_SONG_ROW_HEIGHT_PX);
}

export function windowRadioSavedSongRange(
  count: number,
  scrollTop: number,
  viewportHeightPx: number
): { start: number; end: number } {
  if (count <= 0) {
    return { start: 0, end: 0 };
  }

  const viewport = Math.max(viewportHeightPx, RADIO_SAVED_SONG_ROW_HEIGHT_PX);
  const start = Math.max(
    0,
    Math.floor(Math.max(scrollTop, 0) / RADIO_SAVED_SONG_ROW_HEIGHT_PX) - OVERSCAN_ROWS
  );
  const visible = Math.ceil(viewport / RADIO_SAVED_SONG_ROW_HEIGHT_PX) + OVERSCAN_ROWS * 2;
  return {
    start,
    end: Math.min(count, start + visible),
  };
}
