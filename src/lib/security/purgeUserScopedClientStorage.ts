import { clearAllRouteFilters } from '@lib/state/atoms';
import { clearRadioAccountFavoritesOnLogout } from '@widgets/radio-player/radioFavoritesLogoutCleanup';

export type UserScopedPurgeReason =
  | 'unauthenticated'
  | 'sign-out'
  | 'account-switch';

/** Dispatched after user-scoped client caches are purged (mount, sign-out, account switch). */
export const IDLING_PURGE_USER_SCOPED_STORAGE_EVENT = 'idling:purge-user-scoped-client-storage';

const USER_SCOPED_LOCAL_STORAGE_PATTERNS = [
  /^avatar-cache/i,
  /auth/i,
  /session/i,
  /permission/i,
  /admin/i,
  /\buser\b/i,
  /role/i,
  /token/i,
] as const;

const USER_SCOPED_SESSION_STORAGE_KEYS = ['rate-limit-info'] as const;

function purgeUserScopedLocalStorage(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    for (const key of Object.keys(localStorage)) {
      if (USER_SCOPED_LOCAL_STORAGE_PATTERNS.some((pattern) => pattern.test(key))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Purge must never block auth transitions.
  }
}

function purgeUserScopedSessionStorage(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    for (const key of USER_SCOPED_SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Clear client-side caches that must not survive sign-out, cold mount while
 * anonymous, or switching accounts on a shared browser profile.
 */
export async function purgeUserScopedClientStorage(
  reason: UserScopedPurgeReason
): Promise<void> {
  purgeUserScopedLocalStorage();
  purgeUserScopedSessionStorage();
  clearAllRouteFilters();
  await clearRadioAccountFavoritesOnLogout();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(IDLING_PURGE_USER_SCOPED_STORAGE_EVENT, { detail: { reason } })
    );
  }
}