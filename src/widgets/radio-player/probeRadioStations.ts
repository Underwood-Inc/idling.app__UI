import {
  buildRadioStationProbeCatalog,
  LOCAL_DEV_RADIO_STATIONS,
} from './radioStationCatalog';
import type {
  RadioStationCatalog,
  RadioStationProbeFailure,
  RadioStationProbeResult,
} from './radioPlayer.types';
import {
  delay,
  isProbeTimeoutReason,
  mapWithConcurrency,
  RADIO_PROBE_CONCURRENCY,
  RADIO_PROBE_MAX_RETRIES,
  RADIO_PROBE_RETRY_DELAY_MS,
} from './probeConcurrency';
import { probeRadioStreamInBrowser, probeRadioStreamUrl } from './radioStreamProbe';
import type { ProbeRadioStreamOptions, ProbeRadioStreamResult } from './radioStreamProbe.types';

export { LOCAL_DEV_RADIO_STATIONS };

export interface ProbeRadioStationsOptions {
  timeoutMs?: number;
  includeLocalDevFallbacks?: boolean;
  concurrency?: number;
  maxRetries?: number;
}

const DEFAULT_PROBE_TIMEOUT_MS = 8000;

type ProbeStreamFn = (
  url: string,
  options?: ProbeRadioStreamOptions
) => Promise<ProbeRadioStreamResult>;

export interface ProbeRadioStationCatalogOptions {
  timeoutMs?: number;
  concurrency?: number;
  maxRetries?: number;
  probeStream: ProbeStreamFn;
}

async function probeSingleStationWithRetry(
  url: string,
  timeoutMs: number,
  maxRetries: number,
  probeStream: ProbeStreamFn
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let lastReason = 'Stream failed to load';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = await probeStream(url, { timeoutMs });

    if (result.ok) {
      return { ok: true };
    }

    lastReason = result.reason ?? 'Stream failed to load';

    if (!isProbeTimeoutReason(lastReason) || attempt === maxRetries) {
      return { ok: false, reason: lastReason };
    }

    await delay(RADIO_PROBE_RETRY_DELAY_MS);
  }

  return { ok: false, reason: lastReason };
}

export async function probeRadioStationCatalog(
  catalog: RadioStationCatalog,
  options: ProbeRadioStationCatalogOptions
): Promise<RadioStationProbeResult> {
  const entries = Object.entries(catalog);
  if (entries.length === 0) {
    return { available: {}, failures: [] };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const concurrency = options.concurrency ?? RADIO_PROBE_CONCURRENCY;
  const maxRetries = options.maxRetries ?? RADIO_PROBE_MAX_RETRIES;

  const probeResults = await mapWithConcurrency(entries, concurrency, async ([name, url]) => {
    const result = await probeSingleStationWithRetry(
      url,
      timeoutMs,
      maxRetries,
      options.probeStream
    );
    return { name, url, result };
  });

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

async function probeRadioStationsInBrowser(
  catalog: RadioStationCatalog,
  options: ProbeRadioStationsOptions = {}
): Promise<RadioStationProbeResult> {
  return probeRadioStationCatalog(catalog, {
    timeoutMs: options.timeoutMs,
    concurrency: options.concurrency,
    maxRetries: options.maxRetries,
    probeStream: probeRadioStreamInBrowser,
  });
}

/** Probe a catalog in the browser only (used for user-added custom sources). */
export async function probeRadioCatalogInBrowser(
  catalog: RadioStationCatalog,
  options: ProbeRadioStationsOptions = {}
): Promise<RadioStationProbeResult> {
  return probeRadioStationsInBrowser(catalog, options);
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

  return probeRadioStationsInBrowser(stationsToProbe, { ...options, timeoutMs });
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

export { probeRadioStreamUrl };
