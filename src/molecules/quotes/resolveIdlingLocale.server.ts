import 'server-only';

import type { Locales } from '$i18n/i18n-types';
import supportedLocales from '$i18n/supported-locales.json';
import { cookies, headers } from 'next/headers';

import {
  coerceIdlingLocaleId,
  IDLING_BASE_LOCALE,
  type IdlingLocaleId,
} from './idlingLocaleCatalog';
import { IDLING_UI_LOCALE_STORAGE_KEY } from './resolveIdlingLocale';

function isSupportedLocale(id: string): id is IdlingLocaleId {
  return supportedLocales.locales.some((row) => row.id === id);
}

/** Locale for RSC / metadata — cookie set by `IdlingLocaleProvider`, else Accept-Language. */
export async function resolveServerIdlingLocale(): Promise<Locales> {
  const jar = await cookies();
  const fromCookie = jar.get(IDLING_UI_LOCALE_STORAGE_KEY)?.value?.trim();
  if (fromCookie && isSupportedLocale(fromCookie)) {
    return fromCookie;
  }

  const headerBag = await headers();
  const accept = headerBag.get('accept-language');
  if (accept) {
    const first = accept.split(',')[0]?.trim();
    if (first) {
      return coerceIdlingLocaleId(first) as Locales;
    }
  }

  return IDLING_BASE_LOCALE as Locales;
}