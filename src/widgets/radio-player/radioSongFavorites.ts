export interface RadioSongFavoriteDraft {
  display: string;
  artist: string | null;
  title: string | null;
  stationName: string;
}

export interface RadioSongFavorite extends RadioSongFavoriteDraft {
  songKey: string;
  savedAt: number;
}

export function createRadioSongFavoriteKey(display: string): string | null {
  const normalized = display.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function resolveRadioSongFavoriteUserId(
  status: string,
  userId: string | null | undefined
): string | null {
  if (status !== 'authenticated') {
    return null;
  }

  const trimmed = userId?.trim() ?? '';
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

  return {
    songKey,
    display: draft.display.trim().replace(/\s+/g, ' '),
    artist: draft.artist?.trim() || null,
    title: draft.title?.trim() || null,
    stationName: draft.stationName.trim(),
    savedAt,
  };
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
