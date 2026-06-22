import {
  buildRadioStationProbeCatalog,
  RADIO_STATIONS,
} from '@widgets/radio-player/radioStationCatalog';
import type {
  RadioStationCatalog,
  RadioStationProbeFailure,
  RadioStationProbeResult,
} from '@widgets/radio-player/radioPlayer.types';
import { probeRadioStreamUrl } from '@widgets/radio-player/radioStreamProbe';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PROBE_TIMEOUT_MS = 8000;

async function probeCatalog(catalog: RadioStationCatalog): Promise<RadioStationProbeResult> {
  const entries = Object.entries(catalog);
  const probeResults = await Promise.all(
    entries.map(async ([name, url]) => {
      const result = await probeRadioStreamUrl(url, { timeoutMs: PROBE_TIMEOUT_MS });
      return { name, url, result };
    })
  );

  const available: RadioStationCatalog = {};
  const failures: RadioStationProbeFailure[] = [];

  probeResults.forEach(({ name, url, result }) => {
    if (result.ok) {
      available[name] = url;
      return;
    }

    failures.push({
      name,
      url,
      reason: result.reason ?? 'Stream failed to load',
    });
  });

  return { available, failures };
}

async function getHandler(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const catalog = buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true);
  const result = await probeCatalog(catalog);

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export const GET = withRateLimit(getHandler);
