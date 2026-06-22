const HLS_CDN_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js';
function loadHlsScript() {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-idling-hls="true"]`);
        if (existing) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = HLS_CDN_URL;
        script.async = true;
        script.dataset.idlingHls = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load HLS playback library.'));
        document.head.appendChild(script);
    });
}
async function loadHlsFromCdn() {
    if (typeof window === 'undefined') {
        throw new Error('HLS CDN loader requires a browser environment.');
    }
    const browserWindow = window;
    if (!browserWindow.Hls) {
        await loadHlsScript();
    }
    if (!browserWindow.Hls) {
        throw new Error('HLS playback library did not initialize.');
    }
    return browserWindow.Hls;
}
const defaultRadioHlsLoader = {
    async load() {
        try {
            const module = await import('hls.js');
            return module.default;
        }
        catch {
            return loadHlsFromCdn();
        }
    },
};
export async function attachRadioHlsPlayback(audio, url, loader = defaultRadioHlsLoader) {
    const Hls = await loader.load();
    if (Hls.isSupported()) {
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(url);
        instance.attachMedia(audio);
        return {
            destroy: () => {
                instance.destroy();
            },
        };
    }
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = url;
        return {
            destroy: () => {
                audio.removeAttribute('src');
                audio.load();
            },
        };
    }
    throw new Error('HLS playback is not supported in this browser.');
}
export function createRadioHlsLoaderFromLibrary(library) {
    return {
        load: async () => library,
    };
}
