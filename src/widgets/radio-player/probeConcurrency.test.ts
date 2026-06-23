import {
  delay,
  isProbeTimeoutReason,
  mapWithConcurrency,
  RADIO_PROBE_RETRY_DELAY_MS,
} from './probeConcurrency';

describe('probeConcurrency', () => {
  test('when a probe times out, the timeout reason is recognized for retry', () => {
    expect(isProbeTimeoutReason('Timed out waiting for stream')).toBe(true);
    expect(isProbeTimeoutReason('HTTP 404')).toBe(false);
  });

  test('when many tasks run with a concurrency cap, at most that many run at once', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (value) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(RADIO_PROBE_RETRY_DELAY_MS);
      inFlight -= 1;
      return value * 2;
    });

    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(results).toEqual([2, 4, 6, 8, 10, 12]);
  });
});
