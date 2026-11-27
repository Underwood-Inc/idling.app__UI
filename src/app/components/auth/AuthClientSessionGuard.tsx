'use client';

import { useAuthClientSessionLifecycle } from '@lib/security/useAuthClientSessionLifecycle';

/** Runs global client auth/session hygiene (no UI). Mount inside SessionProvider. */
export function AuthClientSessionGuard() {
  useAuthClientSessionLifecycle();
  return null;
}