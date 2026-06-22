import {
  loadRadioStationGenreFilter,
  RADIO_STATION_GENRE_FILTER_ALL,
  RADIO_STATION_GENRE_FILTER_STORAGE_KEY,
  saveRadioStationGenreFilter,
} from './radioStationGenreFilterPersistence';

describe('radioStationGenreFilterPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('when no genre filter was saved, opening the station list starts on All', () => {
    expect(loadRadioStationGenreFilter()).toBeNull();
  });

  test('when a listener filters stations by electronic, that choice survives a reload', () => {
    saveRadioStationGenreFilter('electronic');

    expect(localStorage.getItem(RADIO_STATION_GENRE_FILTER_STORAGE_KEY)).toBe('electronic');
    expect(loadRadioStationGenreFilter()).toBe('electronic');
  });

  test('when a listener clears the genre filter, All is stored for the next visit', () => {
    saveRadioStationGenreFilter('jazz');
    saveRadioStationGenreFilter(null);

    expect(localStorage.getItem(RADIO_STATION_GENRE_FILTER_STORAGE_KEY)).toBe(
      RADIO_STATION_GENRE_FILTER_ALL
    );
    expect(loadRadioStationGenreFilter()).toBeNull();
  });

  test('when localStorage holds an unknown genre id, the filter falls back to All', () => {
    localStorage.setItem(RADIO_STATION_GENRE_FILTER_STORAGE_KEY, 'not-a-real-genre');

    expect(loadRadioStationGenreFilter()).toBeNull();
  });
});
