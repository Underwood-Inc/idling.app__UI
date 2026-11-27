import {
  getPageConnectivityEngine,
  type ConnectivityEngine,
} from './connectivity';
import { registerIdlingOce } from '../../widgets/radio-player/embedIdlingFetch';
import {
  createIdlingOceInstrumentedFetch,
  wireIdlingOceFetch,
} from './idlingOceFetchAdoption';

export const IDLING_OCE_HEALTH_CHECK_URL = '/api/version';

const globalFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  globalThis.fetch(input, init);

const instrumentedGlobalFetch = createIdlingOceInstrumentedFetch(globalFetch);

const engine = getPageConnectivityEngine({
  healthCheckUrl: IDLING_OCE_HEALTH_CHECK_URL,
  baseFetch: instrumentedGlobalFetch,
});

export const idlingFetch = wireIdlingOceFetch(engine, globalFetch);

registerIdlingOce(idlingFetch, engine);

export function getIdlingOceEngine(): ConnectivityEngine {
  return engine;
}