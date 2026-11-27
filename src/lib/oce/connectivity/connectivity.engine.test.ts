import { afterEach, describe, expect, test, vi } from 'vitest';
import { ConnectivityEngine } from './ConnectivityEngine';
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

function mockNavigatorWindow(): {
  win: Window;
  emit: (type: 'online' | 'offline') => void;
} {
  const handlers = new Map<string, Set<() => void>>();
  const win = {
    addEventListener(type: string, fn: () => void) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: () => void) {
      handlers.get(type)?.delete(fn);
    },
  } as unknown as Window;
  return {
    win,
    emit(type: 'online' | 'offline') {
      handlers.get(type)?.forEach((fn) => fn());
    },
  };
}

afterEach(() => {
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await attachedFetch('/api/widgets');
    const snap = engine.getSnapshot();
    expect(snap.unavailable).toBe(false);
    expect(snap.streak).toBe(0);
    expect(snap.lastHealthyAt).not.toBeNull();
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      failureThreshold: 2,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/a')).rejects.toThrow();
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/one')).rejects.toThrow();
    await expect(attachedFetch('/two')).rejects.toThrow();
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await Promise.allSettled([attachedFetch('/a'), attachedFetch('/b')]);
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/one')).rejects.toThrow();
    await expect(attachedFetch('/two')).rejects.toThrow();

    await vi.waitFor(() =>
      expect(baseFetch).toHaveBeenCalledWith(HEALTH, expect.anything())
    );

    await attachedFetch('/recover');
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      failureThreshold: 2,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/abort')).rejects.toThrow();
    expect(engine.getSnapshot().streak).toBe(0);

    await expect(attachedFetch('/timeout')).rejects.toThrow();
    expect(engine.getSnapshot().streak).toBe(1);
  });

  /**
   * @description fetch stays non-blocking
   * @linked FR-OCE-006
   */
  test('[FR-OCE-006] fetch calls base when already unavailable', async () => {
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/one')).rejects.toThrow();
    await expect(attachedFetch('/two')).rejects.toThrow();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    const response = await attachedFetch('/user');
    expect(response.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledWith('/user', undefined);
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    void attachedFetch(HEALTH);
    await expect(attachedFetch('/one')).rejects.toThrow();
    await expect(attachedFetch('/two')).rejects.toThrow();

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
      new ConnectivityEngine({
        healthCheckUrl: HEALTH,
        // @ts-expect-error intentional invalid config in test
        probeDeadline: 5000,
      })
    ).toThrow(/preset name/);

    const engine = new ConnectivityEngine({ healthCheckUrl: HEALTH });
    const attachedFetch = engine.fetch(vi.fn() as typeof fetch);
    expect(attachedFetch).toBeDefined();
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      probeDeadline: 'Snappy',
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await Promise.allSettled([attachedFetch('/one'), attachedFetch('/two')]);
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

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    engine.reporter.reportTransportFailure();
    engine.reporter.reportTransportFailure();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    const simulatePausedQuery = async (unavailable: boolean) => {
      if (unavailable) {
        return undefined;
      }
      return attachedFetch('/user');
    };

    const pausedResult = await simulatePausedQuery(true);
    expect(pausedResult).toBeUndefined();

    const alwaysResult = await attachedFetch('/user');
    expect(alwaysResult).toBeInstanceOf(Response);
    expect(baseFetch).toHaveBeenCalledWith('/user', undefined);
  });

  test('[FR-OCE-011] navigator online runs health verify and sets lastHealthyAt', async () => {
    vi.useFakeTimers();
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        return new Response('ok', { status: 200 });
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
      navigatorVerifyDebounceMs: 50,
    });
    const { win, emit } = mockNavigatorWindow();
    engine.attachNavigatorOnLine(win);

    emit('online');
    await vi.advanceTimersByTimeAsync(50);
    await vi.waitFor(() => expect(engine.getSnapshot().lastHealthyAt).not.toBeNull());
    expect(baseFetch).toHaveBeenCalledWith(
      HEALTH,
      expect.objectContaining({ cache: 'no-store' })
    );
    engine.detachNavigatorOnLine();
    vi.useRealTimers();
  });

  test('[FR-OCE-011] navigator offline verifies with health; probe fail sets unavailable', async () => {
    vi.useFakeTimers();
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw transportError();
      }
      return new Response('ok');
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
      navigatorVerifyDebounceMs: 50,
    });
    const { win, emit } = mockNavigatorWindow();
    engine.attachNavigatorOnLine(win);

    emit('offline');
    await vi.advanceTimersByTimeAsync(50);
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));
    engine.detachNavigatorOnLine();
    vi.useRealTimers();
  });

  test('[FR-OCE-011] navigator offline with successful probe stays available', async () => {
    vi.useFakeTimers();
    const baseFetch = vi.fn(async () => new Response('ok', { status: 200 }));

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
      navigatorVerifyDebounceMs: 50,
    });
    const { win, emit } = mockNavigatorWindow();
    engine.attachNavigatorOnLine(win);

    emit('offline');
    await vi.advanceTimersByTimeAsync(50);
    await vi.waitFor(() => expect(engine.getSnapshot().lastHealthyAt).not.toBeNull());
    expect(engine.getSnapshot().unavailable).toBe(false);
    engine.detachNavigatorOnLine();
    vi.useRealTimers();
  });

  /**
   * @description Debounced navigator events and cached health probes
   * @linked FR-OCE-012
   */
  test('[FR-OCE-012] debounced navigator bursts reuse one health GET', async () => {
    vi.useFakeTimers();
    let probeCount = 0;
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        probeCount += 1;
        return new Response('ok', { status: 200 });
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
      navigatorVerifyDebounceMs: 100,
      healthProbeReuseMs: 5_000,
    });
    const { win, emit } = mockNavigatorWindow();
    engine.attachNavigatorOnLine(win);

    emit('online');
    emit('offline');
    emit('online');
    await vi.advanceTimersByTimeAsync(100);
    await vi.waitFor(() => expect(engine.getSnapshot().lastHealthyAt).not.toBeNull());
    expect(probeCount).toBe(1);

    engine.detachNavigatorOnLine();
    vi.useRealTimers();
  });

  test('[FR-OCE-012] cached health probe satisfies a second confirm without hammering', async () => {
    let probeCount = 0;
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        probeCount += 1;
        return new Response('ok', { status: 200 });
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      failureThreshold: 2,
      healthProbeReuseMs: 10_000,
      navigatorVerifyDebounceMs: 50,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    await expect(attachedFetch('/one')).rejects.toThrow();
    await expect(attachedFetch('/two')).rejects.toThrow();
    await vi.waitFor(() => expect(probeCount).toBe(1));
    expect(engine.getSnapshot().unavailable).toBe(false);

    vi.useFakeTimers();
    const { win, emit } = mockNavigatorWindow();
    engine.attachNavigatorOnLine(win);
    emit('online');
    await vi.advanceTimersByTimeAsync(600);
    expect(probeCount).toBe(1);

    engine.detachNavigatorOnLine();
    vi.useRealTimers();
  });

  /**
   * @description Debounced recovery from unavailable
   * @linked FR-OCE-013
   */
  test('[FR-OCE-013] recovery from unavailable debounces before clearing flag', async () => {
    vi.useFakeTimers();
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw transportError();
      }
      if (url === '/ok') {
        return new Response('ok');
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      recoveryDebounceMs: 200,
      baseFetch: baseFetch as typeof fetch,
    });
    const attachedFetch = engine.fetch(baseFetch as typeof fetch);

    engine.reporter.reportTransportFailure();
    engine.reporter.reportTransportFailure();
    await vi.waitFor(() => expect(engine.getSnapshot().unavailable).toBe(true));

    await attachedFetch('/ok');
    expect(engine.getSnapshot().unavailable).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(engine.getSnapshot().unavailable).toBe(false);

    vi.useRealTimers();
  });
});