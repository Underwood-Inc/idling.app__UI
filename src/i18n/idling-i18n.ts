import type { Locales, TranslationFunctions } from './i18n-types';
import { i18nObject } from './i18n-util';
import { loadLocaleAsync } from './i18n-util.async';
import { loadBundledEnIfNeeded, tryLoadBundledLocaleSync } from './idling-sync-en';
import {
  localeDirection,
  type IdlingLocaleId,
} from '@molecules/quotes/idlingLocaleCatalog';

export const IDLING_LOCALE_CHANGE = 'idling-locale-change';

let activeLocale: Locales = 'en';
let LL: TranslationFunctions | undefined;
const listeners = new Set<() => void>();

function applyDocumentLocale(locale: Locales): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale as IdlingLocaleId);
}

function notifyLocaleChange(): void {
  for (const fn of listeners) {
    fn();
  }
  if (typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent(IDLING_LOCALE_CHANGE, { detail: { locale: activeLocale } })
    );
  }
}

export function subscribeIdlingLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Sync init — English on client; tests may use async for other locales (same as Overlane). */
export function initIdlingI18n(locale: Locales = 'en'): void {
  const syncReady = tryLoadBundledLocaleSync(locale);
  activeLocale = locale;
  LL = i18nObject(syncReady ? locale : 'en');
  applyDocumentLocale(locale);
  notifyLocaleChange();
}

/** Async init — code-split locale chunks (Mappy site + Overlane console). */
export async function initIdlingI18nAsync(locale: Locales): Promise<void> {
  await loadLocaleAsync(locale);
  activeLocale = locale;
  LL = i18nObject(locale);
  applyDocumentLocale(locale);
  notifyLocaleChange();
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

/** Locale switch — preload `en`, then async chunk (Mappy `SiteLocaleContext.applyLocale`). */
export async function setIdlingLocale(locale: Locales): Promise<void> {
  if (locale === activeLocale && LL) {
    return;
  }
  await loadLocaleAsync('en');
  await initIdlingI18nAsync(locale);
}