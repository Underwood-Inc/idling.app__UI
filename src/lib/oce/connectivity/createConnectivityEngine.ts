import { classifyFetchOutcome } from './classify';
import {
  OCE_PROBE_DEADLINE_PRESETS,
  OceProbeDeadline,
  type ConnectivityEngine,
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

export function createConnectivityEngine(
  config: ConnectivityEngineConfig
): ConnectivityEngine {
  const failureThreshold = config.failureThreshold ?? 2;
  const healthCheckUrl = config.healthCheckUrl;
  const probeDeadline = assertProbeDeadline(config.probeDeadline);
  const interpretHealthResponse =
    config.interpretHealthResponse ?? (() => true);
  const baseFetch: FetchLike = config.baseFetch ?? ((input, init) => fetch(input, init));

  let generation = 0;
  let streak = 0;
  let unavailable = false;
  let healthContractFailed = false;
  const listeners = new Set<() => void>();

  let inflightProbe: Promise<void> | null = null;
  const observedHealthFlights = new Map<string, Promise<HealthFlightResult>>();

  const publish = (): void => {
    listeners.forEach((listener) => listener());
  };

  const getSnapshot = (): ConnectivitySnapshot => ({
    unavailable,
    streak,
    failureThreshold,
    generation,
    ...(healthContractFailed ? { healthContractFailed: true } : {}),
  });

  const onStart = (_input?: RequestInfo | URL): SettlementToken => ({
    generation,
  });

  const settleResponse = (atGeneration: number): void => {
    if (atGeneration !== generation) {
      return;
    }
    generation += 1;
    streak = 0;
    unavailable = false;
    healthContractFailed = false;
    publish();
  };

  const runEngineOwnedProbe = async (): Promise<HealthFlightResult> => {
    try {
      const response = await baseFetch(healthCheckUrl, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        signal: AbortSignal.timeout(OceProbeDeadline[probeDeadline]),
      });
      if (interpretHealthResponse(response)) {
        return { kind: 'response', response };
      }
      return { kind: 'transport-failure', contractFailed: true };
    } catch (error) {
      const kind = classifyFetchOutcome(error);
      if (kind === 'ignored') {
        return { kind: 'ignored' };
      }
      return { kind: 'transport-failure' };
    }
  };

  const resolveProbeResult = async (): Promise<HealthFlightResult> => {
    const observed = observedHealthFlights.get(healthCheckUrl);
    if (observed) {
      const result = await observed;
      if (result.kind === 'ignored') {
        return runEngineOwnedProbe();
      }
      return result;
    }
    return runEngineOwnedProbe();
  };

  const confirm = async (atGeneration: number): Promise<void> => {
    if (inflightProbe) {
      await inflightProbe;
      return;
    }

    inflightProbe = (async () => {
      const result = await resolveProbeResult();

      if (generation !== atGeneration) {
        return;
      }

      if (result.kind === 'response') {
        generation += 1;
        streak = 0;
        unavailable = false;
        healthContractFailed = false;
      } else if (result.kind === 'transport-failure') {
        unavailable = true;
        healthContractFailed = Boolean(result.contractFailed);
      }
      publish();
    })().finally(() => {
      inflightProbe = null;
    });

    await inflightProbe;
  };

  const settleTransportFailure = (atGeneration: number): void => {
    if (atGeneration !== generation) {
      return;
    }
    streak += 1;
    if (streak < failureThreshold || unavailable) {
      publish();
      return;
    }
    void confirm(atGeneration);
  };

  const onSettled = (token: SettlementToken, kind: SettlementKind): void => {
    if (token.generation !== generation) {
      return;
    }
    if (kind === 'ignored') {
      return;
    }
    if (kind === 'response') {
      settleResponse(token.generation);
      return;
    }
    settleTransportFailure(token.generation);
  };

  const trackObservedHealthCall = (
    url: string,
    flight: Promise<HealthFlightResult>
  ): void => {
    if (!urlsMatchHealthCheck(url, healthCheckUrl)) {
      return;
    }
    observedHealthFlights.set(healthCheckUrl, flight);
    void flight.finally(() => {
      if (observedHealthFlights.get(healthCheckUrl) === flight) {
        observedHealthFlights.delete(healthCheckUrl);
      }
    });
  };

  const wrapHealthCall = async (
    input: RequestInfo | URL,
    _init: RequestInit | undefined,
    call: () => Promise<Response>
  ): Promise<Response> => {
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
        const kind = classifyFetchOutcome(error);
        if (kind === 'ignored') {
          return { kind: 'ignored' };
        }
        return { kind: 'transport-failure' };
      }
    })();
    trackObservedHealthCall(url, flight);
    return runOnce();
  };

  const attachFetch = (userBaseFetch: FetchLike): FetchLike => {
    const wrapped: FetchLike = async (input, init) => {
      const token = onStart(input);
      const url = requestUrl(input);
      const isHealth = urlsMatchHealthCheck(url, healthCheckUrl);

      const invoke = () => userBaseFetch(input, init);

      try {
        const response = isHealth
          ? await wrapHealthCall(input, init, invoke)
          : await invoke();
        onSettled(token, classifyFetchOutcome(response));
        return response;
      } catch (error) {
        onSettled(token, classifyFetchOutcome(error));
        throw error;
      }
    };
    return wrapped;
  };

  const reporter: ConnectivityReporter = {
    reportResponse: () => {
      const token = onStart();
      onSettled(token, 'response');
    },
    reportTransportFailure: () => {
      const token = onStart();
      onSettled(token, 'transport-failure');
    },
    reportIgnored: () => {
      const token = onStart();
      onSettled(token, 'ignored');
    },
  };

  return {
    getSnapshot,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    attachFetch,
    onStart,
    onSettled,
    reporter,
    _resetForTests(): void {
      generation = 0;
      streak = 0;
      unavailable = false;
      healthContractFailed = false;
      inflightProbe = null;
      observedHealthFlights.clear();
      publish();
    },
  };
}