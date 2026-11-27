import { RADIO_STATIONS } from '@widgets/radio-player/radioStationCatalog';

/** Resolve a station display name to its default stream URL from the catalog. */
export function resolveRadioStationStreamUrl(stationName: string): string | null {
  const trimmed = stationName.trim();
  if (!trimmed) {
    return null;
  }

  return RADIO_STATIONS[trimmed] ?? null;
}