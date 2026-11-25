import type { IdlingLocaleId } from './idlingLocaleCatalog';
import { IDLING_UI_LOCALE_STORAGE_KEY } from './resolveIdlingLocale';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

/** Mirror `localStorage` locale for server metadata and RSC copy. */
export function writeIdlingLocaleCookie(localeId: IdlingLocaleId): void {
  if (typeof document === 'undefined') {
    return;
  }
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${IDLING_UI_LOCALE_STORAGE_KEY}=${encodeURIComponent(localeId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}