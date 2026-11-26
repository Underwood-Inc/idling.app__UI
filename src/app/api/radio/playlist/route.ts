import { isFetchableRadioPlaylistUrl } from '@lib/radio/radioPlaylistProxy';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PLAYLIST_CHARS = 256 * 1024;
const FETCH_TIMEOUT_MS = 8000;

async function getHandler(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')?.trim() ?? '';
  if (!isFetchableRadioPlaylistUrl(raw)) {
    return NextResponse.json({ error: 'Invalid playlist URL' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(raw, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept:
          'application/vnd.apple.mpegurl, audio/x-mpegurl, audio/mpegurl, audio/x-scpls, text/plain, */*',
        'User-Agent': 'IdlingRadioResolver/1.0 (https://idling.app)',
      },
    });

    clearTimeout(timer);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Playlist fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const text = await upstream.text();
    if (text.length > MAX_PLAYLIST_CHARS) {
      return NextResponse.json({ error: 'Playlist too large' }, { status: 502 });
    }

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Playlist fetch failed' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

export const GET = withRateLimit(getHandler);
