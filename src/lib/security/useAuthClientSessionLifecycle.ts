'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { purgeUserScopedClientStorage } from './purgeUserScopedClientStorage';

function sessionUserId(session: ReturnType<typeof useSession>['data']): string | null {
  const raw = session?.user?.id;
  if (raw == null) {
    return null;
  }
  const text = String(raw).trim();
  return text.length > 0 ? text : null;
}

/**
 * Shared auth boundary: purge user-scoped browser storage when the app mounts
 * without a session, when the user signs out, or when the signed-in account changes.
 */
export function useAuthClientSessionLifecycle(): void {
  const { data: session, status } = useSession();
  const userId = sessionUserId(session);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const sessionResolvedRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const prev = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (!sessionResolvedRef.current) {
      sessionResolvedRef.current = true;
      if (!userId) {
        void purgeUserScopedClientStorage('unauthenticated');
      }
      return;
    }

    if (!userId) {
      void purgeUserScopedClientStorage('sign-out');
      return;
    }

    if (prev && prev !== userId) {
      void purgeUserScopedClientStorage('account-switch');
    }
  }, [status, userId]);
}