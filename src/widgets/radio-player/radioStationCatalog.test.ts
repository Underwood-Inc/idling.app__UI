import {
  buildRadioStationCatalog,
  RADIO_STATION_DEFINITIONS,
  RADIO_STATIONS,
} from './radioStationCatalog';

describe('radioStationCatalog', () => {
  test('builds a catalog entry for every definition', () => {
    expect(Object.keys(RADIO_STATIONS).length).toBe(RADIO_STATION_DEFINITIONS.length);
  });

  test('uses unique station names', () => {
    const names = RADIO_STATION_DEFINITIONS.map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('uses https stream urls', () => {
    Object.values(RADIO_STATIONS).forEach((url) => {
      expect(url.startsWith('https://')).toBe(true);
    });
  });

  test('buildRadioStationCatalog maps definitions by name', () => {
    const catalog = buildRadioStationCatalog([
      { name: 'Test Station', url: 'https://example.com/stream.mp3' },
    ]);

    expect(catalog).toEqual({ 'Test Station': 'https://example.com/stream.mp3' });
  });
});
