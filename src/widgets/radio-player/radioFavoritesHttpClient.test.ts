import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  fetchRadioSongFavoritesCloud,
  fetchRadioStationFavoritesCloud,
  putRadioSongFavoriteCloud,
  putRadioStationFavoriteCloud,
} from './radioFavoritesHttpClient';
import type { RadioSongFavoriteDraft } from './radioSongFavorites';

const fetchMock = vi.fn();

vi.mock('@lib/oce', () => ({
  OCE: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

function jsonResponse<T>(body: T): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('radioFavoritesHttpClient', () => {
  test('uses OCE.fetch on stations', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ stations: [] }));
    await fetchRadioStationFavoritesCloud();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/stations',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('PUT station favorite via OCE.fetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ stations: [] }));
    await putRadioStationFavoriteCloud('Station', true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/stations',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  test('uses OCE.fetch on songs', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ songs: [] }));
    await fetchRadioSongFavoritesCloud();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/songs',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('PUT song favorite via OCE.fetch', async () => {
    const draft: RadioSongFavoriteDraft = {
      display: 'Artist — Song',
      artist: 'Artist',
      title: 'Song',
      stationName: 'Station',
    };
    fetchMock.mockResolvedValue(jsonResponse({ songs: [] }));
    await putRadioSongFavoriteCloud(draft, true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/songs',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});