import { describe, expect, test, vi } from 'vitest';
import { resolveRadioStreamUrl } from './resolveRadioStreamUrl';

describe('resolveRadioStreamUrl', () => {
  test('when the URL is a direct mp3 stream, playback uses native audio', async () => {
    const result = await resolveRadioStreamUrl({
      url: 'https://stream.example.com/live.mp3'
    });

    expect(result).toEqual({
      sourceUrl: 'https://stream.example.com/live.mp3',
      playbackKind: 'native',
      formatId: 'direct'
    });
  });

  test('when the URL is an HLS manifest, playback uses hls.js', async () => {
    const result = await resolveRadioStreamUrl({
      url: 'https://stream.example.com/live.m3u8'
    });

    expect(result).toEqual({
      sourceUrl: 'https://stream.example.com/live.m3u8',
      playbackKind: 'hls',
      formatId: 'hls'
    });
  });

  test('when the URL is a PLS playlist, the embedded stream URL is resolved first', async () => {
    const fetchText = vi.fn().mockResolvedValue(`[playlist]
File1=https://stream.example.com/live.mp3
`);

    const result = await resolveRadioStreamUrl({
      url: 'https://radio.example.com/stream.pls',
      fetchText
    });

    expect(fetchText).toHaveBeenCalledWith('https://radio.example.com/stream.pls');
    expect(result).toEqual({
      sourceUrl: 'https://stream.example.com/live.mp3',
      playbackKind: 'native',
      formatId: 'direct'
    });
  });

  test('when the URL is an M3U playlist pointing at HLS, the resolved entry uses hls playback', async () => {
    const fetchText = vi.fn().mockResolvedValue(`#EXTM3U
https://stream.example.com/live.m3u8
`);

    const result = await resolveRadioStreamUrl({
      url: 'https://radio.example.com/feed.m3u',
      fetchText
    });

    expect(result).toEqual({
      sourceUrl: 'https://stream.example.com/live.m3u8',
      playbackKind: 'hls',
      formatId: 'hls'
    });
  });

  test('when a playlist redirects too many times, resolution fails with a redirect error', async () => {
    const fetchText = vi
      .fn()
      .mockResolvedValueOnce(`#EXTM3U\nhttps://radio.example.com/a.m3u\n`)
      .mockResolvedValueOnce(`#EXTM3U\nhttps://radio.example.com/b.m3u\n`)
      .mockResolvedValueOnce(`#EXTM3U\nhttps://radio.example.com/c.m3u\n`)
      .mockResolvedValueOnce(`#EXTM3U\nhttps://radio.example.com/d.m3u\n`);

    await expect(
      resolveRadioStreamUrl({
        url: 'https://radio.example.com/start.m3u',
        fetchText,
        maxRedirects: 3
      })
    ).rejects.toThrow(/redirect/i);
  });
});
