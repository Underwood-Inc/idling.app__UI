import { fetchStreamNowPlaying } from '@lib/radio/fetchStreamNowPlaying';
import { buildRadioNowPlaying } from '@lib/radio/parseIcyStreamTitle';
import type { RadioNowPlaying } from '@lib/radio/radioNowPlaying.types';
import {
  buildRadioStationProbeCatalog,
  RADIO_STATIONS,
} from '@widgets/radio-player/radioStationCatalog';
import { getCatalogTrackMetadataSupport } from '@widgets/radio-player/radioStationMetadata';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resolveStationStreamUrl(station: string, hostname: string): string | null {
  const catalog = buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true);
  return catalog[station] ?? null;
}

export async function GET(request: NextRequest) {
  const station = request.nextUrl.searchParams.get('station')?.trim();

  if (!station) {
    return NextResponse.json({ error: 'station query parameter is required' }, { status: 400 });
  }

  const streamUrl = resolveStationStreamUrl(station, request.nextUrl.hostname);

  if (!streamUrl) {
    return NextResponse.json({ error: 'Unknown station' }, { status: 404 });
  }

  if (!getCatalogTrackMetadataSupport(station)) {
    const nowPlaying: RadioNowPlaying = buildRadioNowPlaying(station, null, false);

    return NextResponse.json(nowPlaying, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const nowPlaying: RadioNowPlaying = await fetchStreamNowPlaying(station, streamUrl);

  return NextResponse.json(nowPlaying, {
    headers: {
      'Cache-Control': 'public, max-age=15',
    },
  });
}
