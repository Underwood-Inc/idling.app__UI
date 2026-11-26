import type { Locales } from '$i18n/i18n-types';
import supportedLocales from '$i18n/supported-locales.json';

/** Aligns with typesafe-i18n `Locales` — do not widen to `string` via JSON import typing. */
export type IdlingLocaleId = Locales;

export interface IdlingLocaleRow {
  id: IdlingLocaleId;
  bcp47: string;
  label: string;
  direction: 'ltr' | 'rtl';
}

export const IDLING_LOCALE_CATALOG: IdlingLocaleRow[] =
  supportedLocales.locales as IdlingLocaleRow[];

export const IDLING_BASE_LOCALE: IdlingLocaleId =
  supportedLocales.baseLocale as IdlingLocaleId;

export function isIdlingLocaleId(value: string): value is IdlingLocaleId {
  return IDLING_LOCALE_CATALOG.some((row) => row.id === value);
}

export function coerceIdlingLocaleId(tag: unknown): IdlingLocaleId {
  const normalized = (typeof tag === 'string' ? tag : String(tag ?? ''))
    .trim()
    .toLowerCase();
  if (isIdlingLocaleId(normalized)) {
    return normalized;
  }
  const primary = normalized.split('-')[0] ?? '';
  if (isIdlingLocaleId(primary)) {
    return primary;
  }
  if (primary === 'zh') {
    return 'zh';
  }
  return IDLING_BASE_LOCALE;
}

export function localeDirection(locale: IdlingLocaleId): 'ltr' | 'rtl' {
  const row = IDLING_LOCALE_CATALOG.find((entry) => entry.id === locale);
  return row?.direction ?? 'ltr';
}