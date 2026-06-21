import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import {
  getCatalogTrackMetadataSupport,
  loadTrackMetadataDenylist,
  rememberTrackMetadataUnsupported,
  stationSupportsTrackMetadata,
} from './radioStationMetadata';

describe('radioStationMetadata', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('marks catalogued no-metadata stations as unsupported', () => {
    const withoutMetadata = RADIO_STATION_DEFINITIONS.filter(
      (definition) => definition.supportsTrackMetadata === false
    ).map((definition) => definition.name);

    expect(withoutMetadata.length).toBeGreaterThan(0);
    withoutMetadata.forEach((stationName) => {
      expect(getCatalogTrackMetadataSupport(stationName)).toBe(false);
      expect(stationSupportsTrackMetadata(stationName)).toBe(false);
    });
  });

  test('remembers runtime discoveries in localStorage', () => {
    rememberTrackMetadataUnsupported('KEXP Seattle');

    expect(loadTrackMetadataDenylist()).toEqual(['KEXP Seattle']);
    expect(stationSupportsTrackMetadata('KEXP Seattle')).toBe(false);
    expect(stationSupportsTrackMetadata('Radio Paradise')).toBe(true);
  });
});
