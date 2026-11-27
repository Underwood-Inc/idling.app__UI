import { getIdlingOceEngine, idlingFetch } from './embedIdlingFetch';
import { resolveRadioStreamUrl } from './resolveRadioStreamUrl';
/** Catalog reachability checks run in the visitor's browser only — not on the app server. */
const DEFAULT_PROBE_TIMEOUT_MS = 8000;
async function probeHlsManifestUrl(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await idlingFetch(url, {
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
    }
    catch (error) {
        const reason = error instanceof Error && error.name === 'AbortError'
            ? 'Timed out waiting for stream'
            : error instanceof Error
                ? error.message
                : 'Request failed';
        return { ok: false, reason };
    }
    finally {
        clearTimeout(timer);
    }
}
export async function probeNativeAudioElement(url, timeoutMs) {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
        return { ok: false, reason: 'Stream probes require a browser.' };
    }
    return new Promise((resolve) => {
        const audio = new Audio();
        let settled = false;
        const finish = (result) => {
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
        const timer = window.setTimeout(() => finish({ ok: false, reason: 'Timed out waiting for stream' }), timeoutMs);
        const onCanPlay = () => finish({ ok: true });
        const onError = () => {
            getIdlingOceEngine().reporter.reportTransportFailure();
            finish({ ok: false, reason: 'Stream failed to load' });
        };
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.src = url;
        audio.load();
    });
}
export async function probeRadioStreamInBrowser(url, options = {}) {
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
                const canPlayHls = audio.canPlayType('application/vnd.apple.mpegurl') ||
                    audio.canPlayType('application/x-mpegURL');
                if (canPlayHls) {
                    return probeNativeAudioElement(resolved.sourceUrl, timeoutMs);
                }
            }
            return { ok: true };
        }
        return probeNativeAudioElement(resolved.sourceUrl, timeoutMs);
    }
    catch (error) {
        return {
            ok: false,
            reason: error instanceof Error ? error.message : 'Stream resolution failed',
        };
    }
}
