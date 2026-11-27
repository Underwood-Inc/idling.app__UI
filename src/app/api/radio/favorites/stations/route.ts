import { auth } from '@lib/auth';
import { resolveRadioStationStreamUrl } from '@lib/radio/resolveRadioStationStreamUrl';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { userRadioStationFavoritesPostgresRepository } from '@plugs/postgres/userRadioFavoritesPostgresRepository';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseUserId(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const userId = Number.parseInt(raw, 10);
  return Number.isFinite(userId) && userId > 0 ? userId : null;
}

async function getHandler() {
  const session = await auth();
  const userId = parseUserId(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stations = await userRadioStationFavoritesPostgresRepository.list(userId);
  return NextResponse.json({ stations });
}

async function putHandler(request: NextRequest) {
  const session = await auth();
  const userId = parseUserId(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    stationName?: string;
    saved?: boolean;
    streamUrl?: string;
  };

  const stationName = body.stationName?.trim();
  if (!stationName) {
    return NextResponse.json({ error: 'stationName is required' }, { status: 400 });
  }

  if (typeof body.saved !== 'boolean') {
    return NextResponse.json({ error: 'saved boolean is required' }, { status: 400 });
  }

  const streamUrl =
    body.streamUrl?.trim() || resolveRadioStationStreamUrl(stationName) || '';

  if (body.saved && !streamUrl) {
    return NextResponse.json({ error: 'Unknown station' }, { status: 404 });
  }

  const stations = await userRadioStationFavoritesPostgresRepository.setFavorite(
    userId,
    stationName,
    streamUrl,
    body.saved
  );

  return NextResponse.json({ stations });
}

export const GET = withRateLimit(getHandler);
export const PUT = withRateLimit(putHandler);