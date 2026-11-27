// @vitest-environment node
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { createConnectivityEngine } from './connectivity/createConnectivityEngine';
import { resetPageConnectivityEngineForTests } from './connectivity/getPageConnectivityEngine';
import { bindOceConnectivityToasts } from './oceConnectivityToasts';
import { getToastSnapshot, resetToastStoreForTests } from '@lib/toast/toastStore';

const HEALTH = '/api/version';

function transportError(): TypeError {
  return new TypeError('Failed to fetch');
}

describe('bindOceConnectivityToasts', () => {
  beforeEach(() => {
    resetToastStoreForTests();
    resetPageConnectivityEngineForTests();
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

    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: baseFetch as typeof fetch,
    });

    const unsubscribe = bindOceConnectivityToasts(engine);
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
});