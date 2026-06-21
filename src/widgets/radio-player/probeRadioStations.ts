import {
  buildRadioStationProbeCatalog,
  LOCAL_DEV_RADIO_STATIONS,
} from './radioStationCatalog';
import type {
  RadioStationCatalog,
  RadioStationProbeFailure,
  RadioStationProbeResult,
} from './radioPlayer.types';

export { LOCAL_DEV_RADIO_STATIONS };

export interface ProbeRadioStationsOptions {
  timeoutMs?: number;
  includeLocalDevFallbacks?: boolean;
}

const DEFAULT_PROBE_TIMEOUT_MS = 8000;

function probeSingleStation(
  name: string,
  url: string,
  timeoutMs: number
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const finish = (result: { ok: true } | { ok: false; reason: string }) => {
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

async function probeRadioStationsInBrowser(
  catalog: RadioStationCatalog,
  timeoutMs: number
): Promise<RadioStationProbeResult> {
  const entries = Object.entries(catalog);
  if (entries.length === 0) {
    return { available: {}, failures: [] };
  }

  const probeResults = await Promise.all(
    entries.map(async ([name, url]) => {
      const result = await probeSingleStation(name, url, timeoutMs);
      return { name, url, result };
    })
  );

  const available: RadioStationCatalog = {};
  const failures: RadioStationProbeFailure[] = [];

  probeResults.forEach(({ name, url, result }) => {
    if (result.ok) {
      available[name] = url;
      return;
    }

    failures.push({ name, url, reason: result.reason });
  });

  return { available, failures };
}

/** Probe a catalog in the browser only (used for user-added custom sources). */
export async function probeRadioCatalogInBrowser(
  catalog: RadioStationCatalog,
  options: ProbeRadioStationsOptions = {}
): Promise<RadioStationProbeResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  return probeRadioStationsInBrowser(catalog, timeoutMs);
}

/** Probe built-in stations (server route when available) plus custom sources in-browser. */
export async function probeBuiltInAndCustomRadioStations(
  builtInCatalog: RadioStationCatalog,
  customCatalog: RadioStationCatalog,
  options: ProbeRadioStationsOptions = {}
): Promise<RadioStationProbeResult> {
  const builtInResult = await probeRadioStations(builtInCatalog, options);
  const customResult = await probeRadioCatalogInBrowser(customCatalog, options);

  return {
    available: { ...builtInResult.available, ...customResult.available },
    failures: [...builtInResult.failures, ...customResult.failures],
  };
}

/**
 * Probe stations before the player mounts.
 * Prefers the server route so localhost/dev does not spam failed media GETs in the console.
 */
export async function probeRadioStations(
  catalog: RadioStationCatalog,
  options: ProbeRadioStationsOptions = {}
): Promise<RadioStationProbeResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const includeLocalDevFallbacks = options.includeLocalDevFallbacks ?? true;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const stationsToProbe = buildRadioStationProbeCatalog(
    catalog,
    hostname,
    includeLocalDevFallbacks
  );

  try {
    const response = await fetch('/api/radio/stations', {
      cache: 'no-store',
    });

    if (response.ok) {
      const result = (await response.json()) as RadioStationProbeResult;
      return result;
    }
  } catch {
    // Fall back to in-browser probing below.
  }

  return probeRadioStationsInBrowser(stationsToProbe, timeoutMs);
}

export function logRadioPlayerUnavailable(failures: RadioStationProbeFailure[]): void {
  console.error(
    '%c IDLING RADIO — PLAYER NOT SHOWN ',
    'background:#8b0000;color:#fff;font-size:14px;font-weight:700;padding:6px 10px;border-radius:4px;'
  );
  console.error(
    '[Idling Radio] No stations responded during the pre-mount check. ' +
      'The bottom player was not mounted so it does not cover the footer.',
    failures
  );
}
