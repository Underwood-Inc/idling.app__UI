import type { Locales, TranslationFunctions } from './i18n-types';
import { i18nObject } from './i18n-util';
import { loadLocale } from './i18n-util.sync';
import { loadLocaleAsync } from './i18n-util.async';
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

/** Sync init — bundled locale modules (English, tests, first paint). */
export function initIdlingI18n(locale: Locales = 'en'): void {
  loadLocale(locale);
  activeLocale = locale;
  LL = i18nObject(locale);
  applyDocumentLocale(locale);
  notifyLocaleChange();
}

/** Async init — code-split locale chunks at startup or on switch. */
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

/** Typed translation functions for the active locale. Initializes `en` on first use if needed. */
export function getLL(): TranslationFunctions {
  if (!LL) {
    initIdlingI18n('en');
  }
  return LL!;
}

/** Mappy site pattern: ensure English is loaded, then activate the target locale. */
export async function setIdlingLocale(locale: Locales): Promise<void> {
  await loadLocaleAsync('en');
  await loadLocaleAsync(locale);
  activeLocale = locale;
  LL = i18nObject(locale);
  applyDocumentLocale(locale);
  notifyLocaleChange();
}