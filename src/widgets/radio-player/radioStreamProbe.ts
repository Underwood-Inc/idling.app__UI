import { resolveRadioStreamUrl } from './resolveRadioStreamUrl';
import type { ProbeRadioStreamOptions, ProbeRadioStreamResult } from './radioStreamProbe.types';

const DEFAULT_PROBE_TIMEOUT_MS = 8000;

async function probeDirectStreamUrl(
  url: string,
  timeoutMs: number
): Promise<ProbeRadioStreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'IdlingRadioProbe/1.0',
        'Icy-MetaData': '1',
      },
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'IdlingRadioProbe/1.0',
          'Icy-MetaData': '1',
          Range: 'bytes=0-0',
        },
      });
    }

    await response.body?.cancel();

    if (response.ok) {
      return { ok: true };
    }

    return { ok: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? 'Timed out waiting for stream'
        : error instanceof Error
          ? error.message
          : 'Request failed';

    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

async function probeHlsManifestUrl(
  url: string,
  timeoutMs: number
): Promise<ProbeRadioStreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
        'User-Agent': 'IdlingRadioProbe/1.0',
      },
    });

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const manifest = await response.text();

    if (manifest.includes('#EXTM3U')) {
      return { ok: true };
    }

    return { ok: false, reason: 'Response is not a valid HLS manifest.' };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? 'Timed out waiting for stream'
        : error instanceof Error
          ? error.message
          : 'Request failed';

    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeRadioStreamUrl(
  url: string,
  options: ProbeRadioStreamOptions = {}
): Promise<ProbeRadioStreamResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;

  try {
    const resolved = await resolveRadioStreamUrl({ url });

    if (resolved.playbackKind === 'hls') {
      return probeHlsManifestUrl(resolved.sourceUrl, timeoutMs);
    }

    return probeDirectStreamUrl(resolved.sourceUrl, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Stream resolution failed',
    };
  }
}

export async function probeNativeAudioElement(
  url: string,
  timeoutMs: number
): Promise<ProbeRadioStreamResult> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return probeDirectStreamUrl(url, timeoutMs);
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const finish = (result: ProbeRadioStreamResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.src = '';
      audio.load();
      resolve(result);
    };

    const timer = window.setTimeout(
      () => finish({ ok: false, reason: 'Timed out waiting for stream' }),
      timeoutMs
    );

    const onCanPlay = () => finish({ ok: true });
    const onError = () => finish({ ok: false, reason: 'Stream failed to load' });

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.src = url;
    audio.load();
  });
}

export async function probeRadioStreamInBrowser(
  url: string,
  options: ProbeRadioStreamOptions = {}
): Promise<ProbeRadioStreamResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;

  try {
    const resolved = await resolveRadioStreamUrl({ url });

    if (resolved.playbackKind === 'hls') {
      const manifestResult = await probeHlsManifestUrl(resolved.sourceUrl, timeoutMs);
      if (!manifestResult.ok) {
        return manifestResult;
      }

      if (typeof document !== 'undefined') {
        const audio = document.createElement('audio');
        const canPlayHls =
          audio.canPlayType('application/vnd.apple.mpegurl') ||
          audio.canPlayType('application/x-mpegURL');

        if (canPlayHls) {
          return probeNativeAudioElement(resolved.sourceUrl, timeoutMs);
        }
      }

      return { ok: true };
    }

    return probeNativeAudioElement(resolved.sourceUrl, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Stream resolution failed',
    };
  }
}
