/**
 * React integration for {@link OCE}.
 *
 * Mount {@link OceProvider} once in site chrome. Hooks read the module singleton
 * (no context). UI hints must remain non-blocking when `unavailable` is true.
 */

'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { OceConnectivityToastBinder } from './OceConnectivityToastBinder';
import { OCE } from './OCE';
import { SERVER_OCE_SNAPSHOT, type ConnectivitySnapshot } from './connectivity/types';
import type { ConnectivityReporter } from './connectivity/types';

let cachedSnapshot: ConnectivitySnapshot | null = null;

/** Stable reference for `useSyncExternalStore` when the engine snapshot fields are unchanged. */
function readOceSnapshot(): ConnectivitySnapshot {
  const next = OCE.engine.getSnapshot();
  if (
    cachedSnapshot &&
    cachedSnapshot.generation === next.generation &&
    cachedSnapshot.unavailable === next.unavailable &&
    cachedSnapshot.streak === next.streak &&
    cachedSnapshot.failureThreshold === next.failureThreshold &&
    cachedSnapshot.healthContractFailed === next.healthContractFailed &&
    cachedSnapshot.lastHealthyAt === next.lastHealthyAt
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return cachedSnapshot;
}

/**
 * Site-chrome wrapper: subscribes {@link OceConnectivityToastBinder} to {@link OCE.engine}.
 * @param props.children - App tree under `SiteChromeProviders`.
 */
export function OceProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    return new OceConnectivityToastBinder(OCE.engine).bind();
  }, []);
  return children;
}

/** Same function reference as {@link OCE.fetch} for components that need `fetch` in deps. */
export function useOceFetch(): typeof fetch {
  return OCE.fetch;
}

/**
 * Live OCE snapshot on the client; {@link SERVER_OCE_SNAPSHOT} during SSR / hydration.
 */
export function useOceSnapshot(): ConnectivitySnapshot {
  return useSyncExternalStore(
    (onStoreChange) => OCE.engine.subscribe(onStoreChange),
    readOceSnapshot,
    () => SERVER_OCE_SNAPSHOT
  );
}

/**
 * Convenience selector for {@link ConnectivitySnapshot.unavailable}.
 * Server snapshot treats the app as reachable (`false`).
 */
export function useOceUnavailable(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => OCE.engine.subscribe(onStoreChange),
    () => readOceSnapshot().unavailable,
    () => false
  );
}

/**
 * UTC ms of the last confirmed healthy observation, or `null` before the first in this session.
 * SSR / hydration default: `null`.
 */
export function useOceLastHealthyAt(): number | null {
  return useSyncExternalStore(
    (onStoreChange) => OCE.engine.subscribe(onStoreChange),
    () => readOceSnapshot().lastHealthyAt,
    () => SERVER_OCE_SNAPSHOT.lastHealthyAt
  );
}

/** {@link OCE.reporter} for manual settlements outside `fetch`. */
export function useOceReporter(): ConnectivityReporter {
  return OCE.reporter;
}