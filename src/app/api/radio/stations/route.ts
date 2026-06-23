import {
  buildRadioStationProbeCatalog,
  RADIO_STATIONS,
} from '@widgets/radio-player/radioStationCatalog';
import { probeRadioStationCatalog } from '@widgets/radio-player/probeRadioStations';
import { probeRadioStreamUrl } from '@widgets/radio-player/radioStreamProbe';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PROBE_TIMEOUT_MS = 8000;

async function getHandler(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const catalog = buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true);
  const result = await probeRadioStationCatalog(catalog, {
    timeoutMs: PROBE_TIMEOUT_MS,
    probeStream: probeRadioStreamUrl,
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export const GET = withRateLimit(getHandler);
