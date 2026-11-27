/**
 * idling.app OCE public surface.
 *
 * - HTTP: {@link OCE} or {@link OfflineConnectivityEngine} (same object)
 * - React: {@link OceProvider}, {@link useOceFetch}, {@link useOceSnapshot}
 * - Tests / advanced: {@link ConnectivityEngine} from `./connectivity`
 */

export { ConnectivityEngine } from './connectivity';
export {
  OCE,
  OfflineConnectivityEngine,
  OCE_HEALTH_URL,
  type OCEFetchInit,
  type OfflineConnectivityEngineApi,
} from './OCE';

export {
  OceProvider,
  useOceFetch,
  useOceSnapshot,
  useOceUnavailable,
  useOceLastHealthyAt,
  useOceReporter,
} from './OceProvider';
export type { ConnectivitySnapshot, ConnectivityReporter, ConnectivityEngineConfig } from './connectivity';