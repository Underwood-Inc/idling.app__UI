/**
 * Secure Logout Utility
 *
 * Provides comprehensive logout functionality that ensures complete cache clearing
 * and session invalidation to prevent security issues where subsequent users
 * could access previous user's cached data or admin permissions.
 *
 * SECURITY CRITICAL: This utility prevents cache-based permission leakage
 */

import { createLogger } from '@lib/logging';

// Create logger for secure logout operations
const logger = createLogger({
  context: {
    component: 'SecureLogout',
    module: 'security'
  },
  enabled: true // Enable logging for security operations
});

export interface SecureLogoutResult {
  success: boolean;
  itemsCleared: {
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: number;
    caches: number;
    indexedDB: boolean;
    serviceWorkers: number;
    webSQL: boolean;
  };
  errors: string[];
  securityLevel: 'basic' | 'comprehensive' | 'nuclear';
}

/**
 * SECURITY CRITICAL: Clear all authentication-related cookies
 * This ensures no session tokens remain in the browser
 */
async function clearAuthCookies(): Promise<number> {
  let cookiesCleared = 0;

  try {
    // List of known auth-related cookie patterns
    const authCookiePatterns = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.pkce.code_verifier',
      'next-auth.state'
      // Add any custom auth cookies here
    ];

    // Clear all cookies with auth patterns
    const allCookies = document.cookie.split(';');

    for (const cookie of allCookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Clear for all possible domains and paths
        const clearingPatterns = [
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};secure`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname};secure`
        ];

        clearingPatterns.forEach((pattern) => {
          document.cookie = pattern;
        });

        cookiesCleared++;
      }
    }

    // Use Cookie Store API if available for more thorough clearing
    if ('cookieStore' in window) {
      try {
        const cookieStore = (window as any).cookieStore;
        const allStoreCookies = await cookieStore.getAll();

        for (const cookie of allStoreCookies) {
          await cookieStore.delete(cookie.name);
          cookiesCleared++;
        }
      } catch (error) {
        logger.warn('Cookie Store API clearing failed:', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Auth cookies cleared', { count: cookiesCleared });
    return cookiesCleared;
  } catch (error) {
    logger.error(
      'Failed to clear auth cookies:',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}

/**
 * SECURITY CRITICAL: Clear tooltip cache that may contain user-specific data
 */
async function clearTooltipCache(): Promise<boolean> {
  try {
    const keys = Object.keys(localStorage);
    const tooltipCacheKeys = keys.filter(
      (key) =>
        key.startsWith('link_tooltip_cache_') ||
        key === 'link_tooltip_cache_metadata'
    );

    if (tooltipCacheKeys.length > 0) {
      logger.info('Clearing tooltip cache on logout', {
        items: tooltipCacheKeys.length
      });

      tooltipCacheKeys.forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    return true;
  } catch (error) {
    logger.error(
      'Failed to clear tooltip cache:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * SECURITY CRITICAL: Clear all localStorage including any cached session data
 */
async function clearSecureLocalStorage(): Promise<boolean> {
  try {
    // Log what we're about to clear for audit purposes
    const keys = Object.keys(localStorage);
    const authRelatedKeys = keys.filter(
      (key) =>
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('user') ||
        key.includes('admin') ||
        key.includes('permission') ||
        key.includes('role') ||
        key.includes('token')
    );

    if (authRelatedKeys.length > 0) {
      logger.info('Clearing security-sensitive localStorage items', {
        items: authRelatedKeys
      });
    }

    // Clear tooltip cache first (specific clearing for audit)
    await clearTooltipCache();

    // Complete localStorage clear - no exceptions for security
    localStorage.clear();

    logger.info('localStorage completely cleared');
    return true;
  } catch (error) {
    logger.error(
      'Failed to clear localStorage:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * SECURITY CRITICAL: Clear all sessionStorage
 */
async function clearSecureSessionStorage(): Promise<boolean> {
  try {
    sessionStorage.clear();
    logger.info('sessionStorage cleared');
    return true;
  } catch (error) {
    logger.error(
      'Failed to clear sessionStorage:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * SECURITY CRITICAL: Clear all browser caches that might contain admin data
 */
async function clearSecureCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();

    if (cacheNames.length > 0) {
      logger.info('Clearing browser caches', { caches: cacheNames });
    }

    const deletePromises = cacheNames.map(async (cacheName) => {
      try {
        await caches.delete(cacheName);
        logger.debug('Cache deleted', { cacheName });
        return true;
      } catch (error) {
        logger.warn('Failed to delete cache', {
          cacheName,
          error: error instanceof Error ? error.message : String(error)
        });
        return false;
      }
    });

    const results = await Promise.all(deletePromises);
    const successCount = results.filter((success) => success).length;

    logger.info('Browser caches cleared', {
      cleared: successCount,
      total: cacheNames.length
    });

    return successCount;
  } catch (error) {
    logger.error('Failed to clear caches:', error as Error);
    return 0;
  }
}

/**
 * SECURITY CRITICAL: Unregister all service workers to prevent cached responses
 */
async function clearServiceWorkers(): Promise<number> {
  if (!('serviceWorker' in navigator)) {
    return 0;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    if (registrations.length > 0) {
      logger.info('Unregistering service workers', {
        count: registrations.length
      });
    }

    const unregisterPromises = registrations.map(async (registration) => {
      try {
        await registration.unregister();
        logger.debug('Service worker unregistered');
        return true;
      } catch (error) {
        logger.warn('Failed to unregister service worker:', error as Error);
        return false;
      }
    });

    const results = await Promise.all(unregisterPromises);
    const successCount = results.filter((success) => success).length;

    logger.info('Service workers cleared', {
      cleared: successCount,
      total: registrations.length
    });

    return successCount;
  } catch (error) {
    logger.error('Failed to clear service workers:', error as Error);
    return 0;
  }
}

/**
 * SECURITY CRITICAL: Clear IndexedDB that might contain cached user data
 */
async function clearSecureIndexedDB(): Promise<boolean> {
  if (!('indexedDB' in window)) {
    return false;
  }

  try {
    // Modern browsers support indexedDB.databases()
    if ('databases' in indexedDB) {
      const databases = await (indexedDB as any).databases();

      if (databases.length > 0) {
        logger.info('Clearing IndexedDB databases', {
          databases: databases.map((db: any) => db.name)
        });
      }

      await Promise.all(
        databases.map((db: any) => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => {
                logger.debug('IndexedDB deleted', { database: db.name });
                resolve();
              };
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => {
                logger.warn('IndexedDB deletion blocked', {
                  database: db.name
                });
                resolve(); // Don't fail the entire process
              };
            });
          }
          return Promise.resolve();
        })
      );
    }

    logger.info('IndexedDB cleared');
    return true;
  } catch (error) {
    logger.warn('Failed to clear IndexedDB:', error as Error);
    return false;
  }
}

/**
 * SECURITY CRITICAL: Clear WebSQL (legacy but still present in some browsers)
 */
async function clearSecureWebSQL(): Promise<boolean> {
  try {
    if ('webkitStorageInfo' in window) {
      const webkitStorageInfo = (window as any).webkitStorageInfo;
      if (webkitStorageInfo && webkitStorageInfo.requestQuota) {
        return new Promise((resolve) => {
          webkitStorageInfo.requestQuota(
            0, // TEMPORARY storage
            0, // quota
            () => {
              logger.info('WebSQL cleared');
              resolve(true);
            },
            () => {
              logger.warn('WebSQL clearing failed');
              resolve(false);
            }
          );
        });
      }
    }
    return false;
  } catch (error) {
    logger.warn('Failed to clear WebSQL:', error as Error);
    return false;
  }
}

/**
 * COMPREHENSIVE SECURE LOGOUT
 *
 * This function performs a complete logout that clears ALL possible
 * cache and storage mechanisms to prevent any data leakage to subsequent users.
 *
 * SECURITY LEVEL: NUCLEAR - Clears everything
 */
export async function performSecureLogout(
  options: {
    level?: 'basic' | 'comprehensive' | 'nuclear';
    skipServiceWorkers?: boolean;
    skipIndexedDB?: boolean;
  } = {}
): Promise<SecureLogoutResult> {
  const {
    level = 'comprehensive',
    skipServiceWorkers = false,
    skipIndexedDB = false
  } = options;

  logger.group('🔒 PERFORMING SECURE LOGOUT');
  logger.info('Security logout initiated', { level, options });

  const result: SecureLogoutResult = {
    success: false,
    itemsCleared: {
      localStorage: false,
      sessionStorage: false,
      cookies: 0,
      caches: 0,
      indexedDB: false,
      serviceWorkers: 0,
      webSQL: false
    },
    errors: [],
    securityLevel: level
  };

  try {
    // 1. Clear localStorage (ALWAYS - most critical)
    logger.debug('Step 1: Clearing localStorage');
    result.itemsCleared.localStorage = await clearSecureLocalStorage();

    // 2. Clear sessionStorage (ALWAYS - critical)
    logger.debug('Step 2: Clearing sessionStorage');
    result.itemsCleared.sessionStorage = await clearSecureSessionStorage();

    // 3. Clear all cookies (ALWAYS - critical)
    logger.debug('Step 3: Clearing auth cookies');
    result.itemsCleared.cookies = await clearAuthCookies();

    if (level === 'comprehensive' || level === 'nuclear') {
      // 4. Clear browser caches
      logger.debug('Step 4: Clearing browser caches');
      result.itemsCleared.caches = await clearSecureCaches();

      // 5. Clear service workers (unless skipped)
      if (!skipServiceWorkers) {
        logger.debug('Step 5: Clearing service workers');
        result.itemsCleared.serviceWorkers = await clearServiceWorkers();
      }

      // 6. Clear IndexedDB (unless skipped)
      if (!skipIndexedDB) {
        logger.debug('Step 6: Clearing IndexedDB');
        result.itemsCleared.indexedDB = await clearSecureIndexedDB();
      }

      if (level === 'nuclear') {
        // 7. Clear WebSQL (nuclear option only)
        logger.debug('Step 7: Clearing WebSQL');
        result.itemsCleared.webSQL = await clearSecureWebSQL();
      }
    }

    result.success = true;
    logger.info('Secure logout completed successfully', {
      level,
      itemsCleared: result.itemsCleared
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Secure logout failed: ${errorMsg}`);
    logger.error('Secure logout failed:', error as Error);
  }

  logger.groupEnd();
  return result;
}

/**
 * CLIENT-SIDE SECURE LOGOUT HOOK
 *
 * MOVED TO: useSecureLogout.ts to avoid Edge Runtime compatibility issues
 * Import from '@lib/security/useSecureLogout' instead of this file
 */

/**
 * GLOBAL CACHE-BUSTING HEADERS
 *
 * Returns headers that should be included in responses to force cache clearing
 */
export function getSecureCacheBustingHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Clear-Session': 'true',
    'X-Force-Logout': 'true',
    'X-Cache-Bust': Date.now().toString()
  };
}
