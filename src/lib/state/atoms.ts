import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// ============================================================================
// SHARED TYPES (account / UI — not posts-specific)
// ============================================================================

export interface Filter<T extends string = string> {
  name: T;
  value: string;
}

export interface SessionData {
  timeoutInfo: {
    is_timed_out: boolean;
    lastValidated: string | null;
    reason: string | null;
    userInfo: {
      id: number;
      username: string;
      email: string;
      is_active: boolean;
    } | null;
    userValidated: boolean;
    expires_at?: Date;
  };
  lastUpdated: string;
  isValid: boolean;
}

export const sessionCacheAtom = atomWithStorage<unknown>('session-cache', null);

export const sessionDataAtom = atom<SessionData | null>(null);

export const updateSessionDataAtom = atom(
  null,
  (get, set, update: Partial<SessionData>) => {
    const current = get(sessionDataAtom);

    if (!current) {
      const defaultSessionData: SessionData = {
        timeoutInfo: {
          is_timed_out: false,
          lastValidated: null,
          reason: null,
          userInfo: null,
          userValidated: false,
        },
        lastUpdated: new Date().toISOString(),
        isValid: true,
      };

      set(sessionDataAtom, {
        ...defaultSessionData,
        ...update,
        lastUpdated: new Date().toISOString(),
      });
      return;
    }

    set(sessionDataAtom, {
      ...current,
      ...update,
      lastUpdated: new Date().toISOString(),
    });
  },
);

const createAvatarCacheStorage = () => {
  const STORAGE_KEY = 'avatar-cache-v3-adventurer';
  const MAX_CACHE_SIZE = 100;

  return {
    getItem: (_key: string): Record<string, string> => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};

        const parsed = JSON.parse(stored);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch (error) {
        console.warn('Failed to load avatar cache, clearing:', error);
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
    },
    setItem: (_key: string, value: Record<string, string>): void => {
      try {
        const entries = Object.entries(value);
        if (entries.length > MAX_CACHE_SIZE) {
          value = Object.fromEntries(entries.slice(-MAX_CACHE_SIZE));
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          try {
            localStorage.removeItem(STORAGE_KEY);
            const entries = Object.entries(value);
            if (entries.length > 10) {
              value = Object.fromEntries(entries.slice(-10));
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
          } catch (retryError) {
            console.error(
              'Failed to store avatar cache even after cleanup:',
              retryError,
            );
          }
        } else {
          console.error('Failed to store avatar cache:', error);
        }
      }
    },
    removeItem: (_key: string): void => {
      localStorage.removeItem(STORAGE_KEY);
    },
  };
};

export const avatarCacheAtom = atomWithStorage<Record<string, string>>(
  'avatar-cache-v3-adventurer',
  {},
  createAvatarCacheStorage(),
);

/** Legacy no-op — posts filters removed; logout still calls this. */
export const clearAllRouteFilters = () => {
  // URL-first filters for the social product are removed.
};