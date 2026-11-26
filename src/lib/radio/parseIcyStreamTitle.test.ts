import { buildNowPlayingDisplay, buildRadioNowPlaying, parseIcyStreamTitle, splitArtistTitle } from './parseIcyStreamTitle';

describe('parseIcyStreamTitle', () => {
  test('parses StreamTitle from ICY metadata block', () => {
    const metadata = "StreamTitle='Khruangbin - Maria También';StreamUrl='';";
    expect(parseIcyStreamTitle(metadata)).toBe('Khruangbin - Maria También');
  });

  test('keeps apostrophes and other punctuation inside a single-quoted StreamTitle', () => {
    const metadata = "StreamTitle='Fleetwood Mac - Don't Stop (Live)!';StreamUrl='';";
    expect(parseIcyStreamTitle(metadata)).toBe("Fleetwood Mac - Don't Stop (Live)!");
  });

  test('keeps several apostrophes in a StreamTitle', () => {
    const metadata = "StreamTitle='The Bangles - Rock 'n' Roll';";
    expect(parseIcyStreamTitle(metadata)).toBe("The Bangles - Rock 'n' Roll");
  });

  test('turns doubled single quotes into one apostrophe', () => {
    const metadata = "StreamTitle='Fleetwood Mac - Don''t Stop';";
    expect(parseIcyStreamTitle(metadata)).toBe("Fleetwood Mac - Don't Stop");
  });

  test('keeps an apostrophe inside a double-quoted StreamTitle', () => {
    const metadata = 'StreamTitle="Fleetwood Mac - Don\'t Stop";';
    expect(parseIcyStreamTitle(metadata)).toBe("Fleetwood Mac - Don't Stop");
  });

  test('returns null when StreamTitle is empty', () => {
    expect(parseIcyStreamTitle("StreamTitle='';")).toBeNull();
  });

  test('keeps an apostrophe in the now-playing display', () => {
    expect(buildNowPlayingDisplay("Fleetwood Mac - Don't Stop", 'Classic')).toBe(
      "Fleetwood Mac — Don't Stop"
    );
  });

  test('splits artist and title on hyphen separator', () => {
    expect(splitArtistTitle('Khruangbin - Maria También')).toEqual({
      artist: 'Khruangbin',
      title: 'Maria También',
    });
  });

  test('builds display label for artist and title', () => {
    expect(buildNowPlayingDisplay('Khruangbin - Maria También', 'Chillhop Lofi')).toBe(
      'Khruangbin — Maria También'
    );
  });

  test('builds radio now playing payload', () => {
    expect(buildRadioNowPlaying('Chillhop Lofi', 'Khruangbin - Maria También', true)).toEqual({
      station: 'Chillhop Lofi',
      streamTitle: 'Khruangbin - Maria También',
      artist: 'Khruangbin',
      title: 'Maria También',
      display: 'Khruangbin — Maria También',
      supportsTrackMetadata: true,
    });
  });
});
