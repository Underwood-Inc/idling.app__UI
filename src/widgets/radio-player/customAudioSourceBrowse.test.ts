import {
  buildCustomAudioSourceCatalog,
  createCustomAudioSourceFromUrl,
  createCustomAudioSourceRecord,
  deriveCustomAudioSourceName,
  mergeCustomAudioSourcesIntoDefinitions,
  normalizeCustomAudioSourceRecord,
  updateCustomAudioSourceGenre,
  validateCustomAudioSourceGenre,
  validateCustomAudioSourceName,
  validateCustomAudioSourceUrl,
} from './customAudioSourceBrowse';
import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import type { CustomAudioSourceRecord } from './radioPlayer.types';

const sampleCustomSource: CustomAudioSourceRecord = {
  id: 'custom-1',
  name: 'My Stream',
  url: 'https://example.com/live.mp3',
  kind: 'live-stream',
  genre: 'custom',
  regionFlag: '★',
  blurb: 'Custom live audio stream',
  supportsTrackMetadata: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('customAudioSourceBrowse', () => {
  test('accepts direct https mp3 stream URLs', () => {
    const result = validateCustomAudioSourceUrl('https://radio.example.com/live.mp3');

    expect(result.ok).toBe(true);
    expect(result.normalizedUrl).toBe('https://radio.example.com/live.mp3');
  });

  test('accepts HLS and playlist URLs', () => {
    expect(validateCustomAudioSourceUrl('https://radio.example.com/live.m3u8').ok).toBe(true);
    expect(validateCustomAudioSourceUrl('https://radio.example.com/list.pls').ok).toBe(true);
    expect(validateCustomAudioSourceUrl('https://radio.example.com/feed.m3u').ok).toBe(true);
  });

  test('rejects unsupported XSPF playlists', () => {
    expect(validateCustomAudioSourceUrl('https://radio.example.com/feed.xspf').ok).toBe(false);
  });

  test('rejects duplicate names against the built-in catalog', () => {
    const reserved = RADIO_STATION_DEFINITIONS.map((definition) => definition.name);
    const result = validateCustomAudioSourceName('Jazz24', reserved);

    expect(result.ok).toBe(false);
  });

  test('merges custom sources after the built-in catalog definitions', () => {
    const merged = mergeCustomAudioSourcesIntoDefinitions(RADIO_STATION_DEFINITIONS, [
      sampleCustomSource,
    ]);

    expect(merged.at(-1)).toEqual(
      expect.objectContaining({
        name: 'My Stream',
        customId: 'custom-1',
        genre: 'custom',
      })
    );
  });

  test('builds a probe catalog from custom sources', () => {
    const catalog = buildCustomAudioSourceCatalog([sampleCustomSource]);

    expect(catalog).toEqual({
      'My Stream': 'https://example.com/live.mp3',
    });
  });

  test('creates a custom source from a URL with derived defaults', () => {
    const reserved: string[] = [];
    const result = createCustomAudioSourceFromUrl('https://night.example.net/live.mp3', reserved);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.name).toBe('night.example.net');
      expect(result.record.kind).toBe('live-stream');
      expect(result.record.genre).toBe('custom');
      expect(result.record.supportsTrackMetadata).toBe(true);
    }
  });

  test('derives unique names when hostname collides with catalog entries', () => {
    const reserved = RADIO_STATION_DEFINITIONS.map((definition) => definition.name);
    const name = deriveCustomAudioSourceName('https://stream.wqxr.org/wqxr', reserved);

    expect(name.startsWith('stream.wqxr.org')).toBe(true);
    expect(name).not.toBe('WQXR Classical');
  });

  test('creates a persisted custom source record with explicit fields', () => {
    const reserved = RADIO_STATION_DEFINITIONS.map((definition) => definition.name);
    const result = createCustomAudioSourceRecord(
      {
        name: 'Night drone',
        url: 'https://example.com/drone.ogg',
        kind: 'static-media',
      },
      reserved
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.kind).toBe('static-media');
      expect(result.record.supportsTrackMetadata).toBe(false);
      expect(result.record.genre).toBe('custom');
    }
  });

  test('stores the selected genre when explicitly provided', () => {
    const reserved = RADIO_STATION_DEFINITIONS.map((definition) => definition.name);
    const result = createCustomAudioSourceRecord(
      {
        name: 'Late night jazz',
        url: 'https://example.com/jazz.mp3',
        kind: 'live-stream',
        genre: 'jazz',
      },
      reserved
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.genre).toBe('jazz');
    }
  });

  test('updates genre on an existing custom source record', () => {
    const updated = updateCustomAudioSourceGenre(sampleCustomSource, 'ambient');

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.record.genre).toBe('ambient');
      expect(updated.record.updatedAt).not.toBe(sampleCustomSource.updatedAt);
    }
  });

  test('normalizes legacy records with invalid genres back to custom', () => {
    const normalized = normalizeCustomAudioSourceRecord({
      ...sampleCustomSource,
      genre: 'not-a-genre' as CustomAudioSourceRecord['genre'],
    });

    expect(normalized.genre).toBe('custom');
  });

  test('rejects invalid genre ids during validation', () => {
    expect(validateCustomAudioSourceGenre('jazz').ok).toBe(true);
    expect(validateCustomAudioSourceGenre('not-a-genre' as CustomAudioSourceRecord['genre']).ok).toBe(
      false
    );
  });
});
