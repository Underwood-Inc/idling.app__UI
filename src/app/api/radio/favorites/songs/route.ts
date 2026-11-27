import { requireRadioApiSession } from '@lib/radio/requireRadioApiSession';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { userRadioSongFavoritesPostgresRepository } from '@plugs/postgres/userRadioFavoritesPostgresRepository';
import type { RadioSongFavoriteDraft } from '@widgets/radio-player/radioSongFavorites';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isDraft(value: unknown): value is RadioSongFavoriteDraft {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const draft = value as RadioSongFavoriteDraft;
  return typeof draft.display === 'string' && typeof draft.stationName === 'string';
}

async function getHandler() {
  const gate = await requireRadioApiSession();
  if (!gate.ok) {
    return gate.response;
  }

  const songs = await userRadioSongFavoritesPostgresRepository.list(gate.userId);
  return NextResponse.json({ songs });
}

async function putHandler(request: NextRequest) {
  const gate = await requireRadioApiSession();
  if (!gate.ok) {
    return gate.response;
  }
  const userId = gate.userId;

  const body = (await request.json()) as {
    draft?: RadioSongFavoriteDraft;
    saved?: boolean;
  };

  if (!isDraft(body.draft)) {
    return NextResponse.json({ error: 'draft is required' }, { status: 400 });
  }

  if (typeof body.saved !== 'boolean') {
    return NextResponse.json({ error: 'saved boolean is required' }, { status: 400 });
  }

  const songs = await userRadioSongFavoritesPostgresRepository.setFavorite(
    userId,
    body.draft,
    body.saved
  );

  return NextResponse.json({ songs });
}

export const GET = withRateLimit(getHandler);
export const PUT = withRateLimit(putHandler);