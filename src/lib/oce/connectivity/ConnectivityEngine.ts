import type { NavigatorOnLineWindow } from './NavigatorOnLineWindow';
import {
  OCE_PROBE_DEADLINE_PRESETS,
  OceProbeDeadline,
  type ConnectivityEngineConfig,
  type ConnectivityReporter,
  type ConnectivitySnapshot,
  type FetchLike,
  type OceProbeDeadlinePreset,
  type SettlementKind,
  type SettlementToken,
} from './types';

type HealthFlightResult =
  | { kind: 'response'; response: Response }
  | { kind: 'transport-failure'; contractFailed?: boolean }
  | { kind: 'ignored' };

function assertProbeDeadline(
  value: ConnectivityEngineConfig['probeDeadline']
): OceProbeDeadlinePreset {
  if (value === undefined) {
    return 'Interactive';
  }
  if (typeof value === 'number') {
    throw new TypeError(
      'probeDeadline must be a preset name (Snappy, Interactive, Steady, Background), not a number'
    );
  }
  if (!OCE_PROBE_DEADLINE_PRESETS.includes(value)) {
    throw new TypeError(
      `probeDeadline must be one of ${OCE_PROBE_DEADLINE_PRESETS.join(', ')}`
    );
  }
  return value;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function urlsMatchHealthCheck(requestUrlValue: string, healthCheckUrl: string): boolean {
  if (requestUrlValue === healthCheckUrl) {
    return true;
  }
  try {
    const req = new URL(requestUrlValue, 'http://oce.local');
    const health = new URL(healthCheckUrl, 'http://oce.local');
    return req.pathname === health.pathname && req.search === health.search;
  } catch {
    return requestUrlValue.endsWith(healthCheckUrl);
  }
}

/**
 * Offline Connectivity Engine — failure streaks, health confirm, and observed fetch.
 *
 * Constructed once per host runtime (`OCE.ts` on idling.app). Call sites use the returned
 * `fetch` wrapper, not this class directly, except for snapshots and `subscribe`.
 */
export class ConnectivityEngine {
  /** Reporter port exposed on {@link OCE.reporter}. */
  readonly reporter: ConnectivityReporter;

  private readonly failureThreshold: number;
  private readonly healthCheckUrl: string;
  private readonly probeDeadline: OceProbeDeadlinePreset;
  private readonly interpretHealthResponse: (response: Response) => boolean;
  private readonly probeBaseFetch: FetchLike;
  private readonly listenToNavigatorOnLine: boolean;
  private readonly healthProbeReuseMs: number;
  private readonly navigatorVerifyDebounceMs: number;
  private readonly recoveryDebounceMs: number;

  private generation = 0;
  private streak = 0;
  private unavailable = false;
  private healthContractFailed = false;
  private lastHealthyAt: number | null = null;
  private readonly listeners = new Set<() => void>();
  private navigatorOnLineDetach: (() => void) | null = null;
  /** In-flight app fetch to the health URL (e.g. `/api/version`). */
  private observedHealthFlight: Promise<HealthFlightResult> | null = null;
  /** Shared engine-owned GET; concurrent callers await the same promise. */
  private healthProbeFlight: Promise<HealthFlightResult> | null = null;
  private healthProbeCached: { at: number; result: HealthFlightResult } | null = null;
  private navigatorVerifyTimer: ReturnType<typeof setTimeout> | null = null;
  private navigatorVerifyEvent: 'online' | 'offline' | null = null;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param config - `healthCheckUrl` required; `baseFetch` used for confirm probes only.
   */
  constructor(config: ConnectivityEngineConfig) {
    this.failureThreshold = config.failureThreshold ?? 2;
    this.healthCheckUrl = config.healthCheckUrl;
    this.probeDeadline = assertProbeDeadline(config.probeDeadline);
    this.interpretHealthResponse =
      config.interpretHealthResponse ?? (() => true);
    this.probeBaseFetch =
      config.baseFetch ?? ((input, init) => fetch(input, init));
    this.listenToNavigatorOnLine = config.listenToNavigatorOnLine ?? true;
    this.healthProbeReuseMs = config.healthProbeReuseMs ?? 4_000;
    this.navigatorVerifyDebounceMs = config.navigatorVerifyDebounceMs ?? 600;
    this.recoveryDebounceMs = config.recoveryDebounceMs ?? 800;
    this.reporter = {
      reportResponse: () => this.reportResponse(),
      reportTransportFailure: () => this.reportTransportFailure(),
      reportIgnored: () => this.reportIgnored(),
    };
  }

  /** Manual settlement: successful transport (non-`fetch` callers). */
  reportResponse(): void {
    this.clearPendingRecovery();
    const token = this.beginSettlement();
    if (token.generation !== this.generation) {
      return;
    }
    this.markHealthy(token.generation);
  }

  /** Manual settlement: network / timeout failure. */
  reportTransportFailure(): void {
    this.applySettlement('transport-failure');
  }

  /** Manual settlement: deliberately ignored (e.g. user abort). */
  reportIgnored(): void {
    this.applySettlement('ignored');
  }

  private applySettlement(kind: SettlementKind): void {
    const token = this.beginSettlement();
    this.completeSettlement(token, kind);
  }

  private static classifyOutcome(value: unknown): SettlementKind {
    if (typeof Response !== 'undefined' && value instanceof Response) {
      return 'response';
    }
    if (value && typeof value === 'object' && 'name' in value) {
      const name = (value as { name: string }).name;
      if (name === 'AbortError') {
        return 'ignored';
      }
      if (name === 'TimeoutError') {
        return 'transport-failure';
      }
    }
    return 'transport-failure';
  }

  /** Current snapshot; new object each call — cache in React via `readOceSnapshot` in `OceProvider`. */
  getSnapshot(): ConnectivitySnapshot {
    return {
      unavailable: this.unavailable,
      streak: this.streak,
      failureThreshold: this.failureThreshold,
      generation: this.generation,
      lastHealthyAt: this.lastHealthyAt,
      ...(this.healthContractFailed ? { healthContractFailed: true } : {}),
    };
  }

  /**
   * Subscribe to `online` / `offline` and run a **health verify** for each.
   * Does not read {@link Navigator.onLine} — MDN treats it as unreliable.
   *
   * @param win - Host window (defaults to `globalThis.window` when present).
   * @returns Detach listeners.
   */
  attachNavigatorOnLine(win?: NavigatorOnLineWindow): () => void {
    this.detachNavigatorOnLine();
    if (!this.listenToNavigatorOnLine) {
      return () => {};
    }
    const target =
      win ?? (typeof globalThis.window !== 'undefined' ? globalThis.window : undefined);
    if (!target?.addEventListener) {
      return () => {};
    }

    const onOnline = (): void => {
      this.scheduleNavigatorVerification('online');
    };
    const onOffline = (): void => {
      this.scheduleNavigatorVerification('offline');
    };

    target.addEventListener('online', onOnline);
    target.addEventListener('offline', onOffline);
    const detach = (): void => {
      target.removeEventListener('online', onOnline);
      target.removeEventListener('offline', onOffline);
    };
    this.navigatorOnLineDetach = detach;
    return detach;
  }

  /** Remove `online` / `offline` listeners (idempotent). */
  detachNavigatorOnLine(): void {
    this.navigatorOnLineDetach?.();
    this.navigatorOnLineDetach = null;
    this.clearNavigatorVerifySchedule();
    this.navigatorVerifyEvent = null;
  }

  /**
   * Notify when snapshot fields may have changed (toasts, `useSyncExternalStore`).
   * @returns Unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Start token for a request; paired with {@link ConnectivityEngine.onSettled}. */
  onStart(_input?: RequestInfo | URL): SettlementToken {
    return { generation: this.generation };
  }

  /** Apply settlement if `token.generation` is still current. */
  onSettled(token: SettlementToken, kind: SettlementKind): void {
    this.completeSettlement(token, kind);
  }

  /** Reporter helper: start + immediate settle in one generation. */
  beginSettlement(): SettlementToken {
    return this.onStart();
  }

  /** Core settlement logic shared by `fetch` and reporter. */
  completeSettlement(token: SettlementToken, kind: SettlementKind): void {
    if (token.generation !== this.generation) {
      return;
    }
    if (kind === 'ignored') {
      return;
    }
    if (kind === 'response') {
      this.settleResponse(token.generation);
      return;
    }
    this.settleTransportFailure(token.generation);
  }

  /**
   * Binds automatic connectivity settlements to every {@link fetch} invocation.
   * Callers never use {@link ConnectivityReporter} for this path — outcomes are
   * recorded on success (`Response`), rejection (connection failure), or ignore (`AbortError`).
   *
   * @param userBaseFetch - Underlying transport (native fetch on idling.app).
   */
  fetch(userBaseFetch: FetchLike): FetchLike {
    const engine = this;
    const wrapped: FetchLike = async (input, init) => {
      const token = engine.onStart(input);
      const url = requestUrl(input);
      const isHealth = urlsMatchHealthCheck(url, engine.healthCheckUrl);

      const invoke = () => userBaseFetch(input, init);

      try {
        const response = isHealth
          ? await engine.wrapHealthCall(input, init, invoke)
          : await invoke();
        engine.onSettled(token, ConnectivityEngine.classifyOutcome(response));
        return response;
      } catch (error) {
        engine.onSettled(token, ConnectivityEngine.classifyOutcome(error));
        throw error;
      }
    };
    return wrapped;
  }

  /**
   * Auto-reports stream reachability for {@code <audio>} / {@code <video>} (non-`fetch` transports).
   * @returns Detach listeners.
   */
  bindHtmlMediaElement(
    element: Pick<
      HTMLMediaElement,
      'addEventListener' | 'removeEventListener' | 'src' | 'load'
    >
  ): () => void {
    const onCanPlay = (): void => this.reportResponse();
    const onError = (): void => this.reportTransportFailure();

    element.addEventListener('canplay', onCanPlay);
    element.addEventListener('error', onError);
    return () => {
      element.removeEventListener('canplay', onCanPlay);
      element.removeEventListener('error', onError);
    };
  }

  /** Reset internal counters; does not replace `baseFetch`. */
  resetForTests(): void {
    this.detachNavigatorOnLine();
    this.clearNavigatorVerifySchedule();
    this.clearPendingRecovery();
    this.generation = 0;
    this.streak = 0;
    this.unavailable = false;
    this.healthContractFailed = false;
    this.lastHealthyAt = null;
    this.observedHealthFlight = null;
    this.healthProbeFlight = null;
    this.healthProbeCached = null;
    this.publish();
  }

  private publish(): void {
    this.listeners.forEach((listener) => listener());
  }

  private settleResponse(atGeneration: number): void {
    if (!this.unavailable) {
      this.markHealthy(atGeneration);
      return;
    }
    this.scheduleDebouncedRecovery(atGeneration);
  }

  private markHealthy(atGeneration: number): void {
    if (atGeneration !== this.generation) {
      return;
    }
    this.generation += 1;
    this.streak = 0;
    this.unavailable = false;
    this.healthContractFailed = false;
    this.lastHealthyAt = Date.now();
    this.publish();
  }

  private settleTransportFailure(atGeneration: number): void {
    if (atGeneration !== this.generation) {
      return;
    }
    this.clearPendingRecovery();
    this.streak += 1;
    if (this.streak < this.failureThreshold || this.unavailable) {
      this.publish();
      return;
    }
    void this.healthProbe({ fresh: true }).then((result) =>
      this.applyHealthResult(atGeneration, result, 'confirm')
    );
  }

  private scheduleNavigatorVerification(event: 'online' | 'offline'): void {
    this.navigatorVerifyEvent = event;
    this.clearNavigatorVerifySchedule();
    this.navigatorVerifyTimer = setTimeout(() => {
      this.navigatorVerifyTimer = null;
      const scheduled = this.navigatorVerifyEvent;
      this.navigatorVerifyEvent = null;
      if (scheduled) {
        this.runNavigatorVerification(scheduled, this.generation);
      }
    }, this.navigatorVerifyDebounceMs);
  }

  private clearNavigatorVerifySchedule(): void {
    if (this.navigatorVerifyTimer) {
      clearTimeout(this.navigatorVerifyTimer);
      this.navigatorVerifyTimer = null;
    }
  }

  private runNavigatorVerification(
    event: 'online' | 'offline',
    atGeneration: number
  ): void {
    void this.healthProbe().then((result) =>
      this.applyHealthResult(atGeneration, result, event)
    );
  }

  /** One health GET — cache, join in-flight app traffic, or issue a single engine probe. */
  private healthProbe(options?: { fresh?: boolean }): Promise<HealthFlightResult> {
    const fresh = options?.fresh ?? false;
    if (!fresh && this.healthProbeCached) {
      if (Date.now() - this.healthProbeCached.at < this.healthProbeReuseMs) {
        return Promise.resolve(this.healthProbeCached.result);
      }
    }
    if (this.healthProbeFlight) {
      return this.healthProbeFlight;
    }
    this.healthProbeFlight = this.resolveHealthProbe().finally(() => {
      this.healthProbeFlight = null;
    });
    return this.healthProbeFlight;
  }

  private async resolveHealthProbe(): Promise<HealthFlightResult> {
    if (this.observedHealthFlight) {
      const result = await this.observedHealthFlight;
      if (result.kind !== 'ignored') {
        this.rememberHealthProbe(result);
        return result;
      }
    }
    const result = await this.runEngineOwnedProbe();
    this.rememberHealthProbe(result);
    return result;
  }

  private rememberHealthProbe(result: HealthFlightResult): void {
    if (result.kind === 'ignored') {
      return;
    }
    this.healthProbeCached = { at: Date.now(), result };
  }

  private applyHealthResult(
    atGeneration: number,
    result: HealthFlightResult,
    source: 'confirm' | 'online' | 'offline'
  ): void {
    if (atGeneration !== this.generation) {
      return;
    }
    if (result.kind === 'response') {
      if (this.unavailable) {
        this.scheduleDebouncedRecovery(atGeneration);
      } else {
        this.markHealthy(atGeneration);
      }
      return;
    }
    if (result.kind === 'ignored') {
      return;
    }
    const contractFailed = Boolean(result.contractFailed);
    if (source === 'confirm' || source === 'offline') {
      this.unavailable = true;
      this.healthContractFailed = contractFailed;
      this.publish();
      return;
    }
    this.streak += 1;
    if (this.streak >= this.failureThreshold) {
      this.unavailable = true;
      this.healthContractFailed = contractFailed;
    }
    this.publish();
  }

  private scheduleDebouncedRecovery(atGeneration: number): void {
    this.clearPendingRecovery();
    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = null;
      if (atGeneration === this.generation) {
        this.markHealthy(atGeneration);
      }
    }, this.recoveryDebounceMs);
  }

  private clearPendingRecovery(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  private async runEngineOwnedProbe(): Promise<HealthFlightResult> {
    try {
      const response = await this.probeBaseFetch(this.healthCheckUrl, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        signal: AbortSignal.timeout(OceProbeDeadline[this.probeDeadline]),
      });
      if (this.interpretHealthResponse(response)) {
        return { kind: 'response', response };
      }
      return { kind: 'transport-failure', contractFailed: true };
    } catch (error) {
      const kind = ConnectivityEngine.classifyOutcome(error);
      if (kind === 'ignored') {
        return { kind: 'ignored' };
      }
      return { kind: 'transport-failure' };
    }
  }

  private trackObservedHealthCall(url: string, flight: Promise<HealthFlightResult>): void {
    if (!urlsMatchHealthCheck(url, this.healthCheckUrl)) {
      return;
    }
    this.observedHealthFlight = flight;
    void flight.then((result) => this.rememberHealthProbe(result));
    void flight.finally(() => {
      if (this.observedHealthFlight === flight) {
        this.observedHealthFlight = null;
      }
    });
  }

  private async wrapHealthCall(
    input: RequestInfo | URL,
    _init: RequestInit | undefined,
    call: () => Promise<Response>
  ): Promise<Response> {
    const url = requestUrl(input);
    let sharedCall: Promise<Response> | undefined;
    const runOnce = (): Promise<Response> => {
      if (!sharedCall) {
        sharedCall = call();
      }
      return sharedCall;
    };
    const flight = (async (): Promise<HealthFlightResult> => {
      try {
        const response = await runOnce();
        return { kind: 'response', response };
      } catch (error) {
        const kind = ConnectivityEngine.classifyOutcome(error);
        if (kind === 'ignored') {
          return { kind: 'ignored' };
        }
        return { kind: 'transport-failure' };
      }
    })();
    this.trackObservedHealthCall(url, flight);
    return runOnce();
  }
}