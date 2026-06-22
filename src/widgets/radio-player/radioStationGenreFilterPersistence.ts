import type { RadioStationGenreId } from './radioPlayer.types';
import { RADIO_STATION_GENRES } from './radioStationBrowse';

export const RADIO_STATION_GENRE_FILTER_STORAGE_KEY = 'idling-radio-player-genre-filter';

export const RADIO_STATION_GENRE_FILTER_ALL = 'all';

function isRadioStationGenreId(value: unknown): value is RadioStationGenreId {
  return typeof value === 'string' && value in RADIO_STATION_GENRES;
}

export function loadRadioStationGenreFilter(): RadioStationGenreId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(RADIO_STATION_GENRE_FILTER_STORAGE_KEY);
    if (!raw || raw === RADIO_STATION_GENRE_FILTER_ALL) {
      return null;
    }

    return isRadioStationGenreId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveRadioStationGenreFilter(genreId: RadioStationGenreId | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      RADIO_STATION_GENRE_FILTER_STORAGE_KEY,
      genreId ?? RADIO_STATION_GENRE_FILTER_ALL
    );
  } catch {
    // Ignore write failures.
  }
}
