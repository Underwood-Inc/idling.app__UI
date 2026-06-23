import {
  buildRadioStationProbeCatalog,
  LOCAL_DEV_RADIO_STATIONS,
} from './radioStationCatalog';
import type {
  RadioStationAvailabilityState,
  RadioStationCatalog,
  RadioStationProbeFailure,
  RadioStationProbeResult,
} from './radioPlayer.types';
import {
  delay,
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

export interface RunStationAvailabilityChecksOptions {
  timeoutMs?: number;
  concurrency?: number;
  maxRetries?: number;
  probeStream?: ProbeStreamFn;
  onUpdate: (update: RadioStationAvailabilityState) => void;
}

export function createInitialStationAvailabilityMap(
  catalog: RadioStationCatalog
): Record<string, RadioStationAvailabilityState> {
  const availability: Record<string, RadioStationAvailabilityState> = {};

  Object.entries(catalog).forEach(([name, url]) => {
    availability[name] = { name, url, status: 'pending' };
  });

  return availability;
}

export interface SyncStationAvailabilityWithCatalogResult {
  nextMap: Record<string, RadioStationAvailabilityState>;
  catalogToProbe: RadioStationCatalog;
}

/** Keep availability in sync with the station catalog; only new or URL-changed rows need probing. */
export function syncStationAvailabilityWithCatalog(
  current: Record<string, RadioStationAvailabilityState>,
  mergedCatalog: RadioStationCatalog
): SyncStationAvailabilityWithCatalogResult {
  const nextMap: Record<string, RadioStationAvailabilityState> = { ...current };
  const catalogToProbe: RadioStationCatalog = {};

  Object.entries(mergedCatalog).forEach(([name, url]) => {
    const existing = nextMap[name];
    if (!existing || existing.url !== url) {
      nextMap[name] = { name, url, status: 'pending' };
      catalogToProbe[name] = url;
      return;
    }

    if (existing.status === 'pending') {
      catalogToProbe[name] = url;
    }
  });

  Object.keys(nextMap).forEach((name) => {
    if (!mergedCatalog[name]) {
      delete nextMap[name];
    }
  });

  return { nextMap, catalogToProbe };
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

    if (attempt === maxRetries) {
      return { ok: false, reason: lastReason };
    }

    await delay(RADIO_PROBE_RETRY_DELAY_MS * (attempt + 1));
  }

  return { ok: false, reason: lastReason };
}

async function probeStationCatalogEntries(
  entries: [string, string][],
  options: {
    timeoutMs: number;
    concurrency: number;
    maxRetries: number;
    probeStream: ProbeStreamFn;
    cancelled: () => boolean;
    onUpdate: (update: RadioStationAvailabilityState) => void;
    markPending?: boolean;
  }
): Promise<Map<string, string>> {
  const failures = new Map<string, string>();

  if (options.markPending) {
    entries.forEach(([name, url]) => {
      if (!options.cancelled()) {
        options.onUpdate({ name, url, status: 'pending' });
      }
    });
  }

  await mapWithConcurrency(entries, options.concurrency, async ([name, url]) => {
    if (options.cancelled()) {
      return;
    }

    const result = await probeSingleStationWithRetry(
      url,
      options.timeoutMs,
      options.maxRetries,
      options.probeStream
    );

    if (options.cancelled()) {
      return;
    }

    if (result.ok) {
      options.onUpdate({
        name,
        url,
        status: 'available',
      });
      return;
    }

    failures.set(name, url);
    options.onUpdate({
      name,
      url,
      status: 'unreachable',
      reason: result.reason,
    });
  });

  return failures;
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

/**
 * Probe stations in the background with a concurrency cap.
 * Publishes `pending` immediately, then per-station `available` / `unreachable` updates.
 */
export function runStationAvailabilityChecks(
  catalog: RadioStationCatalog,
  options: RunStationAvailabilityChecksOptions
): () => void {
  let cancelled = false;
  const entries = Object.entries(catalog);
  const isCancelled = () => cancelled;

  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const concurrency = options.concurrency ?? RADIO_PROBE_CONCURRENCY;
  const maxRetries = options.maxRetries ?? RADIO_PROBE_MAX_RETRIES;
  const probeStream = options.probeStream ?? probeRadioStreamInBrowser;

  void probeStationCatalogEntries(entries, {
    timeoutMs,
    concurrency,
    maxRetries,
    probeStream,
    cancelled: isCancelled,
    onUpdate: options.onUpdate,
    markPending: true,
  });

  return () => {
    cancelled = true;
  };
}

/** Re-probe a subset of stations (e.g. unreachable rows from the picker). */
export function rerunStationAvailabilityChecks(
  catalog: RadioStationCatalog,
  options: RunStationAvailabilityChecksOptions
): () => void {
  let cancelled = false;
  const entries = Object.entries(catalog);
  const isCancelled = () => cancelled;

  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const concurrency = options.concurrency ?? RADIO_PROBE_CONCURRENCY;
  const maxRetries = options.maxRetries ?? RADIO_PROBE_MAX_RETRIES;
  const probeStream = options.probeStream ?? probeRadioStreamInBrowser;

  void probeStationCatalogEntries(entries, {
    timeoutMs,
    concurrency,
    maxRetries,
    probeStream,
    cancelled: isCancelled,
    onUpdate: options.onUpdate,
    markPending: true,
  });

  return () => {
    cancelled = true;
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
    '[Idling Radio] No stations responded during the availability check. ' +
      'Use the Unreachable filter in the station list to review failed sources.',
    failures
  );
}

export { probeRadioStreamUrl };
