import {
  detectRadioStreamFormat,
  getRadioStreamFormatCatalogEntry,
  getRadioStreamPlaybackKind,
  RADIO_STREAM_FORMAT_CATALOG,
} from './radioStreamFormatCatalog';

describe('radioStreamFormatCatalog', () => {
  test('catalog defines direct, hls, pls, and m3u formats', () => {
    expect(RADIO_STREAM_FORMAT_CATALOG.map((entry) => entry.id)).toEqual([
      'direct',
      'hls',
      'pls',
      'm3u',
    ]);
  });

  test('detectRadioStreamFormat classifies m3u8 URLs as hls', () => {
    expect(detectRadioStreamFormat('https://radio.example.com/live.m3u8')).toBe('hls');
    expect(detectRadioStreamFormat('https://radio.example.com/master.m3u8?token=abc')).toBe('hls');
  });

  test('detectRadioStreamFormat classifies pls URLs as pls', () => {
    expect(detectRadioStreamFormat('https://radio.example.com/stream.pls')).toBe('pls');
  });

  test('detectRadioStreamFormat classifies m3u URLs as m3u but not m3u8', () => {
    expect(detectRadioStreamFormat('https://radio.example.com/feed.m3u')).toBe('m3u');
  });

  test('detectRadioStreamFormat classifies icecast mounts as direct', () => {
    expect(detectRadioStreamFormat('https://stream.example.com/mp3-128')).toBe('direct');
    expect(detectRadioStreamFormat('https://stream.example.com/live.mp3')).toBe('direct');
  });

  test('getRadioStreamPlaybackKind maps catalog playback kinds', () => {
    expect(getRadioStreamPlaybackKind('direct')).toBe('native');
    expect(getRadioStreamPlaybackKind('hls')).toBe('hls');
    expect(getRadioStreamPlaybackKind('pls')).toBe('native');
    expect(getRadioStreamPlaybackKind('m3u')).toBe('native');
  });

  test('getRadioStreamFormatCatalogEntry returns catalog row by id', () => {
    expect(getRadioStreamFormatCatalogEntry('hls')).toEqual(
      expect.objectContaining({ id: 'hls', playbackKind: 'hls' })
    );
  });
});
