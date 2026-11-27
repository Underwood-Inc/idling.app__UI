import { matchesHumanFriendlySearch } from '@molecules/humanFriendlySearch/matchHumanFriendlySearch';
import { parseHumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/parseHumanFriendlySearchQuery';
import type { HumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/humanFriendlySearch.types';
import { RADIO_STATION_GENRES } from './radioStationBrowse';
import type { RadioStationGenreId } from './radioPlayer.types';

/** Coerce JWT / adapter user ids that are not always typed as strings at runtime. */
export function trimUnknownText(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
}

function trimOptionalText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = trimUnknownText(value);
  return trimmed.length > 0 ? trimmed : null;
}

export interface RadioSongFavoriteDraft {
  display: string;
  artist: string | null;
  title: string | null;
  stationName: string;
  stationGenre?: RadioStationGenreId | null;
}

export interface RadioSongFavorite extends RadioSongFavoriteDraft {
  songKey: string;
  /** Epoch milliseconds. Older saved rows may omit this. */
  savedAt: number;
  /** ISO-8601 instant recorded when the song was favorited. Older rows may omit this. */
  favoritedAt?: string | null;
}

export function createRadioSongFavoriteKey(display: string): string | null {
  const normalized = display.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function resolveRadioSongFavoriteUserId(
  status: string,
  userId: unknown
): string | null {
  if (status !== 'authenticated') {
    return null;
  }

  const trimmed = trimUnknownText(userId);
  return trimmed.length > 0 ? trimmed : null;
}

export function buildRadioSongFavorite(
  draft: RadioSongFavoriteDraft,
  savedAt: number
): RadioSongFavorite | null {
  const songKey = createRadioSongFavoriteKey(draft.display);
  if (!songKey) {
    return null;
  }

  const stationGenre =
    draft.stationGenre === undefined ? null : (draft.stationGenre ?? null);
  const savedAtMs = Number.isFinite(savedAt) && savedAt > 0 ? savedAt : 0;

  return {
    songKey,
    display: draft.display.trim().replace(/\s+/g, ' '),
    artist: trimOptionalText(draft.artist),
    title: trimOptionalText(draft.title),
    stationName: trimUnknownText(draft.stationName),
    stationGenre,
    savedAt: savedAtMs,
    favoritedAt: savedAtMs > 0 ? new Date(savedAtMs).toISOString() : null,
  };
}

export function radioSongFavoriteGenreLabel(genre: string | null | undefined): string {
  if (!genre?.trim()) {
    return '';
  }
  if (Object.prototype.hasOwnProperty.call(RADIO_STATION_GENRES, genre)) {
    return RADIO_STATION_GENRES[genre as RadioStationGenreId].label;
  }
  return genre.trim();
}

export function buildRadioSongFavoriteSearchHaystack(song: RadioSongFavorite): string {
  const favoritedAt =
    song.favoritedAt ?? (song.savedAt > 0 ? new Date(song.savedAt).toISOString() : '');
  return [
    song.display,
    song.artist,
    song.title,
    song.stationName,
    song.stationGenre,
    radioSongFavoriteGenreLabel(song.stationGenre),
    favoritedAt,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function matchesRadioSongFavoriteSearch(
  song: RadioSongFavorite,
  query: HumanFriendlySearchQuery
): boolean {
  if (!query.terms.length) {
    return true;
  }

  const haystack = buildRadioSongFavoriteSearchHaystack(song);
  return query.terms.some((term) => {
    if (term.kind === 'hashtag') {
      const genre = (song.stationGenre ?? '').toLowerCase();
      const label = radioSongFavoriteGenreLabel(song.stationGenre).toLowerCase();
      return genre === term.value || label.includes(term.value) || haystack.includes(term.value);
    }

    return matchesHumanFriendlySearch(haystack, {
      raw: query.raw,
      terms: [term],
    });
  });
}

/** Same quotes / #genre query language as the station picker. */
export function filterRadioSongFavorites(
  songs: readonly RadioSongFavorite[],
  rawQuery: string
): RadioSongFavorite[] {
  const query = parseHumanFriendlySearchQuery(rawQuery);
  if (!query.terms.length) {
    return [...songs];
  }
  return songs.filter((song) => matchesRadioSongFavoriteSearch(song, query));
}

export function isRadioSongSaved(songs: readonly RadioSongFavorite[], display: string): boolean {
  const songKey = createRadioSongFavoriteKey(display);
  if (!songKey) {
    return false;
  }

  return songs.some((song) => song.songKey === songKey);
}

export function toggleRadioSongFavoriteList(
  songs: readonly RadioSongFavorite[],
  draft: RadioSongFavoriteDraft,
  savedAt: number
): RadioSongFavorite[] {
  const next = buildRadioSongFavorite(draft, savedAt);
  if (!next) {
    return [...songs];
  }

  if (songs.some((song) => song.songKey === next.songKey)) {
    return songs.filter((song) => song.songKey !== next.songKey);
  }

  return [next, ...songs];
}
