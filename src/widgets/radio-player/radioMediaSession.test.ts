import { buildRadioMediaSessionMetadata } from './radioMediaSession';

describe('radioMediaSession', () => {
  test('when track metadata exists, media session title and artist use the now playing fields', () => {
    const metadata = buildRadioMediaSessionMetadata({
      stationName: 'CeolFM',
      stationBlurb: 'Traditional Irish music',
      nowPlaying: {
        streamTitle: 'Future Trad Collective — Las Palmas',
        artist: 'Future Trad Collective',
        title: 'Las Palmas',
        display: 'Future Trad Collective — Las Palmas',
      },
    });

    expect(metadata.title).toBe('Las Palmas');
    expect(metadata.artist).toBe('Future Trad Collective');
    expect(metadata.album).toBe('CeolFM');
    expect(metadata.artwork.length).toBeGreaterThan(0);
  });

  test('when only a station is known, media session falls back to station naming', () => {
    const metadata = buildRadioMediaSessionMetadata({
      stationName: 'Jazz24',
      stationBlurb: '24/7 jazz',
      nowPlaying: {
        streamTitle: null,
        artist: null,
        title: null,
        display: null,
      },
    });

    expect(metadata.title).toBe('Jazz24');
    expect(metadata.artist).toBe('24/7 jazz');
    expect(metadata.album).toBe('Jazz24');
  });
});
