import 'server-only';

import { cache } from 'react';

import type { TranslationFunctions } from './i18n-types';
import { getLL, initIdlingI18n } from './idling-i18n';

/**
 * RSC metadata uses sync bundled English only — never `loadLocaleAsync` or locale cookies
 * (non-EN chunks on the server were stalling `generateMetadata` on prod).
 * @see ./i18n-ssr-metadata-gotcha.mdx
 */
export const getServerLL = cache((): TranslationFunctions => {
  initIdlingI18n('en');
  return getLL();
});