import { auth } from '@lib/auth';
import { NextResponse } from 'next/server';

function parseUserId(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const userId = Number.parseInt(raw, 10);
  return Number.isFinite(userId) && userId > 0 ? userId : null;
}

export type RadioApiSession =
  | { ok: true; userId: number }
  | { ok: false; response: NextResponse };

/** Same shape as `src/proxy.ts` protected API responses. */
export async function requireRadioApiSession(): Promise<RadioApiSession> {
  const session = await auth();
  const userId = parseUserId(session?.user?.id);
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          requiresReauth: true,
        },
        { status: 401 }
      ),
    };
  }
  return { ok: true, userId };
}