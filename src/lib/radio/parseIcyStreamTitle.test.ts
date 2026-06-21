import { buildNowPlayingDisplay, buildRadioNowPlaying, parseIcyStreamTitle, splitArtistTitle } from './parseIcyStreamTitle';

describe('parseIcyStreamTitle', () => {
  test('parses StreamTitle from ICY metadata block', () => {
    const metadata = "StreamTitle='Khruangbin - Maria También';StreamUrl='';";
    expect(parseIcyStreamTitle(metadata)).toBe('Khruangbin - Maria También');
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
