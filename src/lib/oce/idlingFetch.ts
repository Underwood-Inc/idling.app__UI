import {
  getPageConnectivityEngine,
  type ConnectivityEngine,
} from './connectivity';
import {
  IDLING_OCE_HEALTH_CHECK_URL,
  interpretOceHealthResponse,
} from './connectivity/oceHealthProbe';
import { registerIdlingOce } from '../../widgets/radio-player/embedIdlingFetch';

export { IDLING_OCE_HEALTH_CHECK_URL } from './connectivity/oceHealthProbe';

const engine = getPageConnectivityEngine({
  healthCheckUrl: IDLING_OCE_HEALTH_CHECK_URL,
  interpretHealthResponse: interpretOceHealthResponse,
});

export const idlingFetch = engine.attachFetch((input, init) => globalThis.fetch(input, init));

registerIdlingOce(idlingFetch, engine);

export function getIdlingOceEngine(): ConnectivityEngine {
  return engine;
}