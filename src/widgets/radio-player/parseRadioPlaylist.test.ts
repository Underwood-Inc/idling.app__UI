import { parseRadioPlaylist } from './parseRadioPlaylist';

describe('parseRadioPlaylist', () => {
  test('parseRadioPlaylist extracts File1 from a PLS playlist', () => {
    const result = parseRadioPlaylist({
      content: `[playlist]
NumberOfEntries=1
File1=https://stream.example.com/live.mp3
Title1=Example
Length1=-1
`,
      baseUrl: 'https://radio.example.com/stream.pls',
    });

    expect(result).toEqual({
      ok: true,
      streamUrl: 'https://stream.example.com/live.mp3',
    });
  });

  test('parseRadioPlaylist extracts the first stream URL from M3U', () => {
    const result = parseRadioPlaylist({
      content: `#EXTM3U
#EXTINF:-1,Example Radio
https://stream.example.com/live.aac
`,
      baseUrl: 'https://radio.example.com/feed.m3u',
    });

    expect(result).toEqual({
      ok: true,
      streamUrl: 'https://stream.example.com/live.aac',
    });
  });

  test('parseRadioPlaylist resolves relative M3U URLs against the playlist URL', () => {
    const result = parseRadioPlaylist({
      content: `#EXTM3U
/live.mp3
`,
      baseUrl: 'https://radio.example.com/path/feed.m3u',
    });

    expect(result).toEqual({
      ok: true,
      streamUrl: 'https://radio.example.com/live.mp3',
    });
  });

  test('parseRadioPlaylist returns an error when no stream URL is found', () => {
    const result = parseRadioPlaylist({
      content: '#EXTM3U\n# comment only\n',
      baseUrl: 'https://radio.example.com/empty.m3u',
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBeTruthy();
  });
});
