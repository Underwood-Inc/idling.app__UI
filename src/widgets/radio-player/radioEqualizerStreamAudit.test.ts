import { afterEach, describe, expect, test, vi } from 'vitest';
import { probeEqualizerRadioStream } from './radioEqualizerStreamAudit';

function streamResponse(url: string, status: number, accessControlAllowOrigin: string | null) {
  const headers = new Headers();
  if (accessControlAllowOrigin) {
    headers.set('access-control-allow-origin', accessControlAllowOrigin);
  }
  const response = new Response(new Uint8Array([1, 2, 3]), { status, headers });
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('probeEqualizerRadioStream', () => {
  test('accepts an HTTPS stream that grants equalizer CORS', async () => {
    const fetchMock = vi.fn(async () =>
      streamResponse('https://stream.example.com/live.mp3', 200, '*')
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(probeEqualizerRadioStream('https://stream.example.com/live.mp3')).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://stream.example.com/live.mp3',
      expect.objectContaining({
        headers: expect.objectContaining({ Origin: 'https://idling.app' }),
      })
    );
  });

  test('rejects a stream that omits Access-Control-Allow-Origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse('https://stream.example.com/live.mp3', 200, null))
    );

    await expect(probeEqualizerRadioStream('https://stream.example.com/live.mp3')).resolves.toEqual({
      ok: false,
      reason: 'Missing Access-Control-Allow-Origin for https://idling.app',
    });
  });

  test('rejects a stream that redirects onto HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse('http://stream.example.com/live.mp3', 200, '*'))
    );

    await expect(probeEqualizerRadioStream('https://stream.example.com/live.mp3')).resolves.toEqual({
      ok: false,
      reason: 'Stream URL is not HTTPS',
    });
  });

  test('rejects a station that answers 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse('https://stream.example.com/live.mp3', 401, '*'))
    );

    await expect(probeEqualizerRadioStream('https://stream.example.com/live.mp3')).resolves.toEqual({
      ok: false,
      reason: 'HTTP 401',
    });
  });
});
