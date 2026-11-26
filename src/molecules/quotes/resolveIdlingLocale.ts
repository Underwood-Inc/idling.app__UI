import supportedLocales from '$i18n/supported-locales.json';

import {
  coerceIdlingLocaleId,
  type IdlingLocaleId,
  IDLING_BASE_LOCALE,
} from './idlingLocaleCatalog';

export const IDLING_UI_LOCALE_STORAGE_KEY = 'idling-ui-locale';

export function resolveIdlingLocaleFromStorage(): IdlingLocaleId | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(IDLING_UI_LOCALE_STORAGE_KEY);
    if (stored && supportedLocales.locales.some((row) => row.id === stored)) {
      return stored as IdlingLocaleId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveIdlingLocaleFromNavigator(): IdlingLocaleId {
  if (typeof navigator === 'undefined') {
    return IDLING_BASE_LOCALE;
  }
  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language ?? 'en'];
  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.length === 0) {
      continue;
    }
    return coerceIdlingLocaleId(tag);
  }
  return IDLING_BASE_LOCALE;
}

export function resolveIdlingLocale(): IdlingLocaleId {
  return (
    resolveIdlingLocaleFromStorage() ?? resolveIdlingLocaleFromNavigator()
  );
}