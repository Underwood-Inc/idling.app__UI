import 'server-only';

import { cache } from 'react';

import type { TranslationFunctions } from './i18n-types';
import { getLL, initIdlingI18nAsync } from './idling-i18n';
import { resolveServerIdlingLocale } from '@molecules/quotes/resolveIdlingLocale.server';

async function loadServerLL(): Promise<TranslationFunctions> {
  const locale = await resolveServerIdlingLocale();
  await initIdlingI18nAsync(locale);
  return getLL();
}

/** Cached per RSC request so layout + page metadata do not reload locale chunks twice. */
export const getServerLL = cache(loadServerLL);