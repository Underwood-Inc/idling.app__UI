// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { realFetch } from '../../../vitest.real-fetch';
import { probeRadioStationCatalog } from './probeRadioStations';
import { RADIO_STATIONS } from './radioStationCatalog';
import { probeEqualizerRadioStream } from './radioEqualizerStreamAudit';

// One live probe per workflow run (shard 1 only) — see RADIO_CATALOG_LIVE_AUDIT in quality-assurance.yml.
const auditCatalogOnCi =
  process.env.GITHUB_ACTIONS === 'true' &&
  process.env.RADIO_CATALOG_LIVE_AUDIT === 'true';

describe('radio station catalog availability', () => {
  test.skipIf(!auditCatalogOnCi)(
    'every catalog station still serves HTTPS audio the equalizer can attach',
    async () => {
      // vitest.setup replaces global fetch with an empty 200. This audit must use the network.
      globalThis.fetch = realFetch;

      const result = await probeRadioStationCatalog(RADIO_STATIONS, {
        timeoutMs: 12000,
        concurrency: 12,
        maxRetries: 2,
        probeStream: probeEqualizerRadioStream,
      });

      const report = result.failures
        .map((failure) => `${failure.name}: ${failure.reason} (${failure.url})`)
        .sort()
        .join('\n');

      expect(result.failures, report || 'catalog streams responded').toEqual([]);
    },
    180_000
  );
});
