import en from './en';
import { initFormatters } from './formatters';
import type { Locales, Translations } from './i18n-types';
import { loadedFormatters, loadedLocales } from './i18n-util';

/** Client-safe sync path: English only (Mappy site uses async for all other locales). */
export function loadBundledEnIfNeeded(): void {
  if (loadedLocales.en) {
    return;
  }
  loadedLocales.en = en as unknown as Translations;
  loadedFormatters.en = initFormatters('en');
}

/** Returns true only when the requested locale is available synchronously (English). */
export function tryLoadBundledLocaleSync(locale: Locales): boolean {
  loadBundledEnIfNeeded();
  return locale === 'en';
}