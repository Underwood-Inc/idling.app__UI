import { parseHumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/parseHumanFriendlySearchQuery';
import {
  filterRadioSongFavorites,
  isRadioSongSaved,
  resolveRadioSongFavoriteUserId,
  toggleRadioSongFavoriteList,
  type RadioSongFavorite,
  type RadioSongFavoriteDraft,
} from './radioSongFavorites';

const draft: RadioSongFavoriteDraft = {
  display: "Fleetwood Mac — Don't Stop",
  artist: 'Fleetwood Mac',
  title: "Don't Stop",
  stationName: 'Radio Paradise',
};

describe('radioSongFavorites', () => {
  test('when a song is toggled on, the saved list keeps the full title and artist', () => {
    const saved = toggleRadioSongFavoriteList([], draft, 10);

    expect(saved).toEqual([
      {
        songKey: "fleetwood mac — don't stop",
        display: "Fleetwood Mac — Don't Stop",
        artist: 'Fleetwood Mac',
        title: "Don't Stop",
        stationName: 'Radio Paradise',
        stationGenre: null,
        savedAt: 10,
        favoritedAt: new Date(10).toISOString(),
      },
    ]);
    expect(isRadioSongSaved(saved, "  Fleetwood Mac — Don't Stop  ")).toBe(true);
  });

  test('when a saved song is toggled again, it leaves the list', () => {
    const saved = toggleRadioSongFavoriteList([], draft, 10);
    expect(toggleRadioSongFavoriteList(saved, draft, 20)).toEqual([]);
  });

  test('when the visitor is signed out, song favorites have no user id', () => {
    expect(resolveRadioSongFavoriteUserId('unauthenticated', '12')).toBeNull();
    expect(resolveRadioSongFavoriteUserId('authenticated', '  ')).toBeNull();
    expect(resolveRadioSongFavoriteUserId('authenticated', '12')).toBe('12');
  });

  test('when the session user id is numeric, it is coerced without throwing', () => {
    expect(resolveRadioSongFavoriteUserId('authenticated', 42)).toBe('42');
  });

  test('when a song is favorited, the record stores station, genre, and an ISO favorited date', () => {
    const savedAt = 1_700_000_000_000;
    const saved = toggleRadioSongFavoriteList(
      [],
      { ...draft, stationGenre: 'eclectic' },
      savedAt
    );

    expect(saved[0]).toMatchObject({
      stationName: 'Radio Paradise',
      stationGenre: 'eclectic',
      savedAt,
      favoritedAt: new Date(savedAt).toISOString(),
    });
  });

  test('when a listener searches saved songs, #genre and quoted phrases use the search parser', () => {
    const savedAt = 1_700_000_000_000;
    const songs: RadioSongFavorite[] = [
      toggleRadioSongFavoriteList([], { ...draft, stationGenre: 'eclectic' }, savedAt)[0],
      toggleRadioSongFavoriteList(
        [],
        {
          display: 'Miles Davis — So What',
          artist: 'Miles Davis',
          title: 'So What',
          stationName: 'WBGO Jazz',
          stationGenre: 'jazz',
        },
        savedAt
      )[0],
    ];
    const query = parseHumanFriendlySearchQuery('#jazz');

    expect(query.terms).toEqual([
      expect.objectContaining({ kind: 'hashtag', value: 'jazz' }),
    ]);
    expect(filterRadioSongFavorites(songs, '#jazz').map((song) => song.display)).toEqual([
      'Miles Davis — So What',
    ]);
    expect(filterRadioSongFavorites(songs, '"Don\'t Stop"').map((song) => song.stationName)).toEqual([
      'Radio Paradise',
    ]);
  });
});
