import type { Locales, TranslationFunctions } from './i18n-types';
import { i18nObject } from './i18n-util';
import { loadLocaleAsync } from './i18n-util.async';
import { tryLoadBundledLocaleSync } from './idling-sync-en';
import {
  localeDirection,
  type IdlingLocaleId,
} from '@molecules/quotes/idlingLocaleCatalog';

let activeLocale: Locales = 'en';
let LL: TranslationFunctions | undefined;

function applyDocumentLocale(locale: Locales): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale as IdlingLocaleId);
}

/** Apply an already-loaded locale dictionary to module state (no async load). */
export function commitIdlingLocale(locale: Locales): TranslationFunctions {
  activeLocale = locale;
  LL = i18nObject(locale);
  applyDocumentLocale(locale);
  return LL;
}

/** Sync init — English on the client bundle only (`idling-sync-en`). */
export function initIdlingI18n(locale: Locales = 'en'): void {
  const syncReady = tryLoadBundledLocaleSync(locale);
  commitIdlingLocale(syncReady ? locale : 'en');
}

/** Async init — code-split locale chunks (same as `mappy-i18n`). */
export async function initIdlingI18nAsync(locale: Locales): Promise<void> {
  await loadLocaleAsync(locale);
  commitIdlingLocale(locale);
}

export function getLocale(): Locales {
  return activeLocale;
}

export function getLL(): TranslationFunctions {
  if (!LL) {
    initIdlingI18n('en');
  }
  return LL!;
}

/** Used in tests and explicit switches — mirrors Mappy `applyLocale` tail. */
export async function setIdlingLocale(locale: Locales): Promise<void> {
  if (locale === activeLocale && LL) {
    return;
  }
  await loadLocaleAsync('en');
  await initIdlingI18nAsync(locale);
}