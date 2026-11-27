// @vitest-environment node
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { ConnectivityEngine } from './connectivity/ConnectivityEngine';
import { OceConnectivityToastBinder } from './OceConnectivityToastBinder';
import { getToastSnapshot, resetToastStoreForTests } from '@lib/toast/toastStore';

const HEALTH = '/api/version';

function transportError(): TypeError {
  return new TypeError('Failed to fetch');
}

describe('OceConnectivityToastBinder', () => {
  beforeEach(() => {
    resetToastStoreForTests();
  });

  afterEach(() => {
    resetToastStoreForTests();
  });

  test('shows manual toast when engine reports unavailable', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw transportError();
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });

    const unsubscribe = new OceConnectivityToastBinder(engine).bind();
    engine.reporter.reportTransportFailure();
    engine.reporter.reportTransportFailure();

    await vi.waitFor(() => {
      expect(engine.getSnapshot().unavailable).toBe(true);
    });

    expect(getToastSnapshot().some((t) => t.dedupeKey === 'oce-network-unavailable')).toBe(
      true
    );
    expect(
      getToastSnapshot().find((t) => t.dedupeKey === 'oce-network-unavailable')?.dismissMode
    ).toBe('manual');

    unsubscribe();
  });

  test('dismisses offline toast and auto-dismisses success when engine recovers', async () => {
    vi.useFakeTimers();

    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === HEALTH) {
        throw transportError();
      }
      throw transportError();
    });

    const engine = new ConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });

    const unsubscribe = new OceConnectivityToastBinder(engine).bind();

    engine.reporter.reportTransportFailure();
    engine.reporter.reportTransportFailure();

    await vi.waitFor(() => {
      expect(engine.getSnapshot().unavailable).toBe(true);
    });

    expect(getToastSnapshot().some((t) => t.dedupeKey === 'oce-network-unavailable')).toBe(true);

    engine.reporter.reportResponse();
    await vi.waitFor(() => {
      expect(engine.getSnapshot().unavailable).toBe(false);
    });

    expect(getToastSnapshot().some((t) => t.dedupeKey === 'oce-network-unavailable')).toBe(false);
    const recovered = getToastSnapshot().find((t) => t.dedupeKey === 'oce-network-recovered');
    expect(recovered?.dismissMode).toBe('auto');
    expect(recovered?.durationMs).toBe(4_000);

    vi.advanceTimersByTime(4_000);
    expect(getToastSnapshot().some((t) => t.dedupeKey === 'oce-network-recovered')).toBe(false);

    unsubscribe();
    vi.useRealTimers();
  });
});