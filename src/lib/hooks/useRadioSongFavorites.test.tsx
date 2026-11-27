import { act, renderHook } from '@testing-library/react';
import { buildRadioSongFavorite, type RadioSongFavoriteDraft } from '@widgets/radio-player/radioSongFavorites';
import { useRadioSongFavorites } from './useRadioSongFavorites';
import { putRadioSongFavoriteCloud, fetchRadioSongFavoritesCloud } from '@widgets/radio-player/radioFavoritesHttpClient';
import { listRadioSongFavorites } from '@widgets/radio-player/radioSongFavoritesIndexedDb';

vi.mock('@widgets/radio-player/radioFavoritesHttpClient', () => ({
  fetchRadioSongFavoritesCloud: vi.fn(),
  putRadioSongFavoriteCloud: vi.fn(),
}));

vi.mock('@widgets/radio-player/radioFavoritesIndexedDbCache', () => ({
  cacheRadioSongFavoriteToggle: vi.fn(async () => undefined),
  replaceRadioSongFavoritesCache: vi.fn(async () => undefined),
}));

vi.mock('@widgets/radio-player/radioSongFavoritesIndexedDb', () => ({
  listRadioSongFavorites: vi.fn(async () => []),
}));

const draft: RadioSongFavoriteDraft = {
  display: "Fleetwood Mac — Don't Stop",
  artist: 'Fleetwood Mac',
  title: "Don't Stop",
  stationName: 'Radio Paradise',
  stationGenre: 'eclectic',
};

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe('useRadioSongFavorites', () => {
  beforeEach(() => {
    vi.mocked(fetchRadioSongFavoritesCloud).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(putRadioSongFavoriteCloud).mockImplementation(async (nextDraft, saved) => {
      if (!saved) {
        return [];
      }
      const song = buildRadioSongFavorite(nextDraft, Date.now());
      return song ? [song] : [];
    });
    vi.mocked(listRadioSongFavorites).mockResolvedValue([]);
  });

  test('when the bookmark is clicked once, the song is saved even if an earlier load finishes later', async () => {
    const pendingLoad = deferred<Awaited<ReturnType<typeof fetchRadioSongFavoritesCloud>>>();
    vi.mocked(fetchRadioSongFavoritesCloud).mockImplementation(() => pendingLoad.promise);

    const { result } = renderHook(() => useRadioSongFavorites('user-1'));

    await act(async () => {
      await result.current.toggleSavedSong(draft);
    });

    expect(putRadioSongFavoriteCloud).toHaveBeenCalledTimes(1);
    expect(putRadioSongFavoriteCloud).toHaveBeenCalledWith(
      expect.objectContaining({
        stationName: 'Radio Paradise',
        stationGenre: 'eclectic',
        display: draft.display,
      }),
      true
    );
    expect(result.current.isSongSaved(draft.display)).toBe(true);
    expect(result.current.savedSongs[0]).toMatchObject({
      stationName: 'Radio Paradise',
      stationGenre: 'eclectic',
    });
    expect(result.current.savedSongs[0]?.favoritedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await act(async () => {
      pendingLoad.resolve([]);
      await pendingLoad.promise;
    });

    expect(result.current.isSongSaved(draft.display)).toBe(true);
    expect(putRadioSongFavoriteCloud).toHaveBeenCalledTimes(1);
  });
});
