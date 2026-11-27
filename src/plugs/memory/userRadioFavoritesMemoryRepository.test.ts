import { createUserRadioFavoritesMemoryRepositories } from './userRadioFavoritesMemoryRepository';

describe('userRadioFavoritesMemoryRepository', () => {
  test('when a station is favorited, it appears in recency order for that user', async () => {
    const { stations, reset } = createUserRadioFavoritesMemoryRepositories();
    reset();

    await stations.setFavorite(1, 'FIP', 'https://example/fip', true);
    await stations.setFavorite(1, 'WBGO Jazz', 'https://example/wbgo', true);

    const list = await stations.list(1);
    expect(list.map((station) => station.stationName).sort()).toEqual(['FIP', 'WBGO Jazz']);
    expect(list.find((station) => station.stationName === 'WBGO Jazz')?.streamUrl).toBe(
      'https://example/wbgo'
    );
  });

  test('when a song is saved, metadata is kept per user', async () => {
    const { songs, reset } = createUserRadioFavoritesMemoryRepositories();
    reset();

    const draft = {
      display: 'Artist — Title',
      artist: 'Artist',
      title: 'Title',
      stationName: 'Radio Paradise',
      stationGenre: 'eclectic' as const,
    };

    const saved = await songs.setFavorite(2, draft, true);
    expect(saved).toHaveLength(1);
    expect(saved[0].stationGenre).toBe('eclectic');

    const list = await songs.setFavorite(2, draft, false);
    expect(list).toEqual([]);
  });

  test('favorites for one user do not appear for another', async () => {
    const { stations, reset } = createUserRadioFavoritesMemoryRepositories();
    reset();

    await stations.setFavorite(3, 'FIP', 'https://example/fip', true);
    expect(await stations.list(4)).toEqual([]);
  });
});