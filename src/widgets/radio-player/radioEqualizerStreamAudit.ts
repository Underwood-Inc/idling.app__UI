import { idlingFetch } from './embedIdlingFetch';
import { releaseResponseBody } from '@lib/fetch/releaseResponseBody';
import {
  equalizerStreamRejection,
  IDLING_RADIO_EQUALIZER_ORIGIN,
} from './radioEqualizerStreamPolicy';
import { resolveRadioStreamUrl } from './resolveRadioStreamUrl';
import type { ProbeRadioStreamOptions, ProbeRadioStreamResult } from './radioStreamProbe.types';

const DEFAULT_TIMEOUT_MS = 8000;

function rejectionFromResponse(response: Response, requestedUrl: string): string | null {
  return equalizerStreamRejection({
    finalUrl: response.url || requestedUrl,
    status: response.status,
    accessControlAllowOrigin: response.headers.get('access-control-allow-origin'),
  });
}

async function fetchEqualizerStream(
  url: string,
  timeoutMs: number,
  headers: Record<string, string>
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await idlingFetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Origin: IDLING_RADIO_EQUALIZER_ORIGIN,
        'User-Agent': 'IdlingRadioCiAudit/1.0 (https://idling.app)',
        ...headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** CI catalog audit. Not used by the site or `/api/radio/stations`. */
export async function probeEqualizerRadioStream(
  url: string,
  options: ProbeRadioStreamOptions = {}
): Promise<ProbeRadioStreamResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const resolved = await resolveRadioStreamUrl({ url });
    const response = await fetchEqualizerStream(
      resolved.sourceUrl,
      timeoutMs,
      resolved.playbackKind === 'hls'
        ? { Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*' }
        : { 'Icy-MetaData': '1', Range: 'bytes=0-1023' }
    );
    const reason = rejectionFromResponse(response, resolved.sourceUrl);

    if (reason) {
      await releaseResponseBody(response);
      return { ok: false, reason };
    }

    if (resolved.playbackKind === 'hls') {
      const manifest = await response.text();
      if (!manifest.includes('#EXTM3U')) {
        return { ok: false, reason: 'Response is not a valid HLS manifest.' };
      }
      return { ok: true };
    }

    await releaseResponseBody(response);
    return { ok: true };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? 'Timed out waiting for stream'
        : error instanceof Error
          ? error.message
          : 'Request failed';
    return { ok: false, reason };
  }
}
