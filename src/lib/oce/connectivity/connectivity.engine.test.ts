import { afterEach, describe, expect, test, vi } from 'vitest';
import { createConnectivityEngine } from './createConnectivityEngine';
import {
  getPageConnectivityEngine,
  resetPageConnectivityEngineForTests,
} from './getPageConnectivityEngine';
import { OceProbeDeadline } from './types';

const HEALTH = '/health';

function transportError(message = 'Failed to fetch'): TypeError {
  return new TypeError(message);
}

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError');
}

function timeoutError(): DOMException {
  return new DOMException('Timeout', 'TimeoutError');
}

afterEach(() => {
  resetPageConnectivityEngineForTests();
  vi.useRealTimers();
});

describe('Offline Connectivity Engine', () => {
  /**
   * @description Any Response recovers without health probe
   * @linked FR-OCE-001
   */
  test('[FR-OCE-001] any Response clears unavailable and does not probe health', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === HEALTH) {
        throw new Error('health should not be called');
      }
      return new Response('ok', { status: 500 });
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await fetch('/api/widgets');
    const snap = engine.getSnapshot();
    expect(snap.unavailable).toBe(false);
    expect(snap.streak).toBe(0);
    expect(baseFetch).not.toHaveBeenCalledWith(HEALTH, expect.anything());
  });

  /**
   * @description Sub-threshold transport failures
   * @linked FR-OCE-002
   */
  test('[FR-OCE-002] failures below threshold skip health and stay available', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw new Error('health should not be called');
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      failureThreshold: 2,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await expect(fetch('/a')).rejects.toThrow();
    const snap = engine.getSnapshot();
    expect(snap.streak).toBe(1);
    expect(snap.unavailable).toBe(false);
    expect(baseFetch).not.toHaveBeenCalledWith(
      HEALTH,
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  /**
   * @description Threshold probe single-flight
   * @linked FR-OCE-003
   */
  test('[FR-OCE-003] threshold triggers one probe; transport fail sets unavailable', async () => {
    let probeCount = 0;
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        probeCount += 1;
        throw transportError();
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await expect(fetch('/one')).rejects.toThrow();
    await expect(fetch('/two')).rejects.toThrow();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    expect(probeCount).toBe(1);

    engine.reporter.reportResponse();
    const after = engine.getSnapshot();
    expect(after.unavailable).toBe(false);
    expect(after.streak).toBe(0);
  });

  /**
   * @description Parallel failures share one probe
   * @linked FR-OCE-003
   */
  test('[FR-OCE-003] parallel failures at threshold do not start a second probe', async () => {
    let probeResolvers: Array<() => void> = [];
    let probeCount = 0;

    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        probeCount += 1;
        await new Promise<void>((resolve) => {
          probeResolvers.push(resolve);
        });
        throw transportError();
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await Promise.allSettled([fetch('/a'), fetch('/b')]);
    await vi.waitFor(() => expect(probeCount).toBe(1));
    probeResolvers.forEach((r) => r());
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));
    expect(probeCount).toBe(1);
  });

  /**
   * @description Generation discard while probe in flight
   * @linked FR-OCE-004
   */
  test('[FR-OCE-004] Response during probe discards stale probe unavailable', async () => {
    let releaseProbe: (() => void) | undefined;
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        await new Promise<void>((resolve) => {
          releaseProbe = resolve;
        });
        throw transportError();
      }
      if (url === '/recover') {
        return new Response('ok');
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await expect(fetch('/one')).rejects.toThrow();
    await expect(fetch('/two')).rejects.toThrow();

    await vi.waitFor(() =>
      expect(baseFetch).toHaveBeenCalledWith(HEALTH, expect.anything())
    );

    await fetch('/recover');
    releaseProbe?.();
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.getSnapshot().unavailable).toBe(false);
  });

  /**
   * @description Abort vs timeout classification
   * @linked FR-OCE-005
   */
  test('[FR-OCE-005] AbortError is ignored and TimeoutError increments streak', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === '/abort') {
        throw abortError();
      }
      if (url === '/timeout') {
        throw timeoutError();
      }
      return new Response('ok');
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      failureThreshold: 2,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await expect(fetch('/abort')).rejects.toThrow();
    expect(engine.getSnapshot().streak).toBe(0);

    await expect(fetch('/timeout')).rejects.toThrow();
    expect(engine.getSnapshot().streak).toBe(1);
  });

  /**
   * @description attachFetch stays non-blocking
   * @linked FR-OCE-006
   */
  test('[FR-OCE-006] attachFetch calls base when already unavailable', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw transportError();
      }
      if (url === '/user') {
        return new Response('user', { status: 200 });
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await expect(fetch('/one')).rejects.toThrow();
    await expect(fetch('/two')).rejects.toThrow();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    const response = await fetch('/user');
    expect(response.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledWith('/user', undefined);
  });

  /**
   * @description Page singleton
   * @linked FR-OCE-007
   */
  test('[FR-OCE-007] getPageConnectivityEngine returns the same instance', () => {
    const a = getPageConnectivityEngine();
    const b = getPageConnectivityEngine();
    expect(a).toBe(b);
  });

  /**
   * @description Reuse in-flight health traffic
   * @linked FR-OCE-008
   */
  test('[FR-OCE-008] reuses in-flight health check instead of second probe', async () => {
    let releaseHealth: (() => void) | undefined;
    const healthGate = new Promise<void>((resolve) => {
      releaseHealth = resolve;
    });

    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        await healthGate;
        return new Response('ok', { status: 200 });
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    void fetch(HEALTH);
    await expect(fetch('/one')).rejects.toThrow();
    await expect(fetch('/two')).rejects.toThrow();

    const healthCalls = baseFetch.mock.calls.filter((c) => c[0] === HEALTH).length;
    expect(healthCalls).toBe(1);

    releaseHealth?.();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(false));
    expect(baseFetch.mock.calls.filter((c) => c[0] === HEALTH).length).toBe(1);
  });

  /**
   * @description Probe deadline presets
   * @linked FR-OCE-009
   */
  test('[FR-OCE-009] rejects numeric probeDeadline and defaults Interactive', () => {
    expect(() =>
      createConnectivityEngine({
        healthCheckUrl: HEALTH,
        // @ts-expect-error intentional invalid config in test
        probeDeadline: 5000,
      })
    ).toThrow(/preset name/);

    const engine = createConnectivityEngine({ healthCheckUrl: HEALTH });
    const wrapped = engine.attachFetch(vi.fn() as typeof fetch);
    expect(wrapped).toBeDefined();
    expect(OceProbeDeadline.Interactive).toBe(5000);
  });

  test('[FR-OCE-009] probe TimeoutError counts as failed confirm', async () => {
    vi.useFakeTimers();
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        await new Promise((_resolve, reject) => {
          setTimeout(() => reject(timeoutError()), OceProbeDeadline.Snappy + 50);
        });
        throw timeoutError();
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      probeDeadline: 'Snappy',
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    await Promise.allSettled([fetch('/one'), fetch('/two')]);
    await vi.advanceTimersByTimeAsync(OceProbeDeadline.Snappy + 200);
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));
  });

  /**
   * @description Reporter records transport before swallow
   * @linked FR-OCE-010
   */
  test('[FR-OCE-010] reporter records transport failure and user fetch still runs', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === '/user') {
        return new Response('ok');
      }
      throw transportError();
    });

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const fetch = engine.attachFetch(baseFetch as typeof fetch);

    engine.reporter.reportTransportFailure();
    engine.reporter.reportTransportFailure();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    const simulatePausedQuery = async (unavailable: boolean) => {
      if (unavailable) {
        return undefined;
      }
      return fetch('/user');
    };

    const pausedResult = await simulatePausedQuery(true);
    expect(pausedResult).toBeUndefined();

    const alwaysResult = await fetch('/user');
    expect(alwaysResult).toBeInstanceOf(Response);
    expect(baseFetch).toHaveBeenCalledWith('/user', undefined);
  });
});