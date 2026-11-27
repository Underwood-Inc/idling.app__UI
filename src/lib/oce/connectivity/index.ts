/** Host-agnostic OCE core (engine + types). idling.app bootstraps via `../OCE.ts`. */
export { ConnectivityEngine } from './ConnectivityEngine';
export {
  OCE_PROBE_DEADLINE_PRESETS,
  OceProbeDeadline,
  SERVER_OCE_SNAPSHOT,
} from './types';
export type {
  ConnectivityEngineConfig,
  ConnectivitySnapshot,
  ConnectivityReporter,
  FetchLike,
  OceProbeDeadlinePreset,
  SettlementKind,
  SettlementToken,
} from './types';