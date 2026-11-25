import 'server-only';

import type { Locales } from '$i18n/i18n-types';
import supportedLocales from '$i18n/supported-locales.json';
import { cookies } from 'next/headers';

import {
  IDLING_BASE_LOCALE,
  type IdlingLocaleId,
} from './idlingLocaleCatalog';
import { IDLING_UI_LOCALE_STORAGE_KEY } from './resolveIdlingLocale';

function isSupportedLocale(id: string): id is IdlingLocaleId {
  return supportedLocales.locales.some((row) => row.id === id);
}

/** Locale for RSC / metadata — cookie from `IdlingLocaleProvider` only; default English. */
export async function resolveServerIdlingLocale(): Promise<Locales> {
  const jar = await cookies();
  const fromCookie = jar.get(IDLING_UI_LOCALE_STORAGE_KEY)?.value?.trim();
  if (fromCookie && isSupportedLocale(fromCookie)) {
    return fromCookie as Locales;
  }
  return IDLING_BASE_LOCALE as Locales;
}