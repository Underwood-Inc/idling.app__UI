import {
  isRadioSongSaved,
  resolveRadioSongFavoriteUserId,
  toggleRadioSongFavoriteList,
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
        savedAt: 10,
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
});
