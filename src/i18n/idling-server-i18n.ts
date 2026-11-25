import 'server-only';

import type { TranslationFunctions } from './i18n-types';
import { loadLocaleAsync } from './i18n-util.async';
import { getLL, initIdlingI18nAsync } from './idling-i18n';
import { resolveServerIdlingLocale } from '@molecules/quotes/resolveIdlingLocale.server';

export async function getServerLL(): Promise<TranslationFunctions> {
  const locale = await resolveServerIdlingLocale();
  await loadLocaleAsync('en');
  await initIdlingI18nAsync(locale);
  return getLL();
}