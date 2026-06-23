import { vi } from 'vitest';
import {
  rerunStationAvailabilityChecks,
  runStationAvailabilityChecks,
} from './probeRadioStations';

describe('runStationAvailabilityChecks', () => {
  test('when probes finish one by one, each station publishes pending then a final status', async () => {
    const updates: string[] = [];
    const probeStream = vi.fn(async (url: string) => ({
      ok: url.includes('good'),
      reason: 'Timed out waiting for stream',
    }));

    const cancel = runStationAvailabilityChecks(
      {
        'Good Station': 'https://example.com/good.mp3',
        'Bad Station': 'https://example.com/bad.mp3',
      },
      {
        concurrency: 1,
        maxRetries: 0,
        probeStream,
        onUpdate: (update) => {
          updates.push(`${update.name}:${update.status}`);
        },
      }
    );

    await vi.waitFor(() => {
      expect(updates).toContain('Good Station:available');
      expect(updates).toContain('Bad Station:unreachable');
    });

    cancel();
  });

  test('when only one pass runs, unreachable stations are not automatically re-checked', async () => {
    const probeAttempts = new Map<string, number>();
    const updates: string[] = [];
    const probeStream = vi.fn(async (url: string) => {
      const attempts = (probeAttempts.get(url) ?? 0) + 1;
      probeAttempts.set(url, attempts);

      return {
        ok: false,
        reason: 'Timed out waiting for stream',
      };
    });

    const cancel = runStationAvailabilityChecks(
      {
        'Flaky Station': 'https://example.com/flaky.mp3',
      },
      {
        concurrency: 1,
        maxRetries: 0,
        probeStream,
        onUpdate: (update) => {
          updates.push(`${update.name}:${update.status}`);
        },
      }
    );

    await vi.waitFor(() => {
      expect(updates).toContain('Flaky Station:unreachable');
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    expect(probeAttempts.get('https://example.com/flaky.mp3')).toBe(1);
    expect(updates.filter((entry) => entry === 'Flaky Station:pending')).toHaveLength(1);

    cancel();
  });
});

describe('rerunStationAvailabilityChecks', () => {
  test('when the user retries unreachable stations, only that subset is re-probed', async () => {
    const updates: string[] = [];
    const probeStream = vi.fn(async () => ({ ok: true }));

    rerunStationAvailabilityChecks(
      {
        'Flaky Station': 'https://example.com/flaky.mp3',
      },
      {
        concurrency: 1,
        maxRetries: 0,
        probeStream,
        onUpdate: (update) => {
          updates.push(`${update.name}:${update.status}`);
        },
      }
    );

    await vi.waitFor(() => {
      expect(updates).toEqual(['Flaky Station:pending', 'Flaky Station:available']);
    });

    expect(probeStream).toHaveBeenCalledTimes(1);
  });
});
