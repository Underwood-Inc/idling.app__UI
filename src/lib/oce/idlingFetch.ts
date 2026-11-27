import {
  getPageConnectivityEngine,
  type ConnectivityEngine,
} from '@strixun/api-framework/connectivity';
import { registerIdlingOce } from '../../widgets/radio-player/embedIdlingFetch';

/** Same-origin probe for OCE confirm step (public, unauthenticated). */
export const IDLING_OCE_HEALTH_CHECK_URL = '/api/version';

const engine = getPageConnectivityEngine({
  healthCheckUrl: IDLING_OCE_HEALTH_CHECK_URL,
});

export const idlingFetch = engine.attachFetch((input, init) => globalThis.fetch(input, init));

registerIdlingOce(idlingFetch, engine);

export function getIdlingOceEngine(): ConnectivityEngine {
  return engine;
}