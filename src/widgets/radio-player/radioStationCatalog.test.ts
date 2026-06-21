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

  test('includes browse metadata on every station definition', () => {
    RADIO_STATION_DEFINITIONS.forEach((definition) => {
      expect(definition.genre).toBeTruthy();
      expect(definition.regionFlag.length).toBeGreaterThan(0);
      expect(definition.blurb.trim().length).toBeGreaterThan(0);
    });
  });

  test('buildRadioStationCatalog maps definitions by name', () => {
    const catalog = buildRadioStationCatalog([
      {
        name: 'Test Station',
        url: 'https://example.com/stream.mp3',
        genre: 'eclectic',
        regionFlag: '🇺🇸',
        blurb: 'Test stream',
      },
    ]);

    expect(catalog).toEqual({ 'Test Station': 'https://example.com/stream.mp3' });
  });
});
