import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchStreamNowPlaying } from './fetchStreamNowPlaying';

function encodeIcyMetadata(streamTitle: string | null): Uint8Array {
  if (!streamTitle) {
    return new Uint8Array([0]);
  }

  const text = `StreamTitle='${streamTitle}';`;
  const textBytes = new TextEncoder().encode(text);
  const blockCount = Math.ceil(textBytes.length / 16);
  const payload = new Uint8Array(1 + blockCount * 16);
  payload[0] = blockCount;
  payload.set(textBytes, 1);
  return payload;
}

function icyStreamBody(metaInt: number, frames: Array<string | null>): Uint8Array {
  const chunks: Uint8Array[] = [];

  for (const frame of frames) {
    chunks.push(new Uint8Array(metaInt));
    chunks.push(encodeIcyMetadata(frame));
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchStreamNowPlaying', () => {
  test('skips an empty first ICY metadata block and uses the next StreamTitle', async () => {
    const body = icyStreamBody(16, [null, 'Khruangbin - Maria También']);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(body, {
          status: 200,
          headers: {
            'icy-metaint': '16',
          },
        });
      })
    );

    const nowPlaying = await fetchStreamNowPlaying('Jazz24', 'https://example.test/stream');

    expect(nowPlaying).toEqual({
      station: 'Jazz24',
      streamTitle: 'Khruangbin - Maria También',
      artist: 'Khruangbin',
      title: 'Maria También',
      display: 'Khruangbin — Maria También',
      supportsTrackMetadata: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.test/stream',
      expect.objectContaining({
        cache: 'no-store',
      })
    );
  });
});
