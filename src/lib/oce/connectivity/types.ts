/**
 * Offline Connectivity Engine (OCE) — shared types.
 *
 * Host-agnostic shapes; idling.app wires a single {@link ConnectivityEngine} in `OCE.ts`.
 */

/** How a single in-flight request resolved for settlement purposes. */
export type SettlementKind = 'response' | 'transport-failure' | 'ignored';

/** Named probe timeouts for engine-owned health checks. */
export type OceProbeDeadlinePreset = 'Snappy' | 'Interactive' | 'Steady' | 'Background';

/** Millisecond deadlines keyed by {@link OceProbeDeadlinePreset}. */
export const OceProbeDeadline: Record<OceProbeDeadlinePreset, number> = {
  Snappy: 1000,
  Interactive: 5000,
  Steady: 10000,
  Background: 30000,
};

export const OCE_PROBE_DEADLINE_PRESETS: readonly OceProbeDeadlinePreset[] = [
  'Snappy',
  'Interactive',
  'Steady',
  'Background',
] as const;

/** Immutable read model for UI and toasts; updates when `generation` changes. */
export interface ConnectivitySnapshot {
  /** Confirmed offline / degraded after failure streak + health confirm. */
  unavailable: boolean;
  /** Consecutive transport failures at the current generation. */
  streak: number;
  /** Failures required before health confirm runs. */
  failureThreshold: number;
  /** Bumps on recovery; stale settlement tokens are ignored. */
  generation: number;
  /** Health check returned a response that failed `interpretHealthResponse`. */
  healthContractFailed?: boolean;
  /**
   * UTC ms when connectivity was last **confirmed** healthy (any tracked `Response`
   * or a successful health verify). `null` until the first confirmation in this session.
   */
  lastHealthyAt: number | null;
}

export interface ConnectivityEngineConfig {
  /** Defaults to `2`. */
  failureThreshold?: number;
  /** URL used for confirm probes (pathname match allowed). */
  healthCheckUrl: string;
  /** Defaults to `Interactive`. */
  probeDeadline?: OceProbeDeadlinePreset;
  /** When false, health response counts as transport/contract failure. */
  interpretHealthResponse?: (response: Response) => boolean;
  /** Transport for engine-owned probes; defaults to global `fetch`. */
  baseFetch?: FetchLike;
  /**
   * When `true` (default), `window` `online` / `offline` events trigger a **health verify**
   * — OCE never reads `navigator.onLine` directly for settlement.
   */
  listenToNavigatorOnLine?: boolean;
  /** Reuse the last health probe result within this window (default 4000). */
  healthProbeReuseMs?: number;
  /** Debounce `online` / `offline` before health verify (default 600). */
  navigatorVerifyDebounceMs?: number;
  /** Debounce clearing `unavailable` after a healthy `Response` (default 800). */
  recoveryDebounceMs?: number;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/** Captured at request start; must match engine `generation` when settling. */
export interface SettlementToken {
  generation: number;
}

/**
 * Manual settlement API for non-HTTP transports.
 * Mirrors what {@link ConnectivityEngine.fetch} records automatically.
 */
export interface ConnectivityReporter {
  reportResponse(): void;
  reportTransportFailure(): void;
  reportIgnored(): void;
}

/**
 * SSR / first paint default so React does not flash offline.
 * Does not imply the user is actually online.
 */
export const SERVER_OCE_SNAPSHOT: ConnectivitySnapshot = {
  unavailable: false,
  streak: 0,
  failureThreshold: 2,
  generation: 0,
  lastHealthyAt: null,
};