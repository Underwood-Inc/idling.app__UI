import type { QuoteIndexManifest, QuoteLocaleShard } from './idlingQuoteTypes';
import {
  coerceIdlingLocaleId,
  type IdlingLocaleId,
} from './idlingLocaleCatalog';
import {
  pickRandomQuoteFromShard,
  resolveQuoteLocaleShard,
} from './idlingQuoteBundleCore';
import type { IdlingQuoteRecord } from './idlingQuoteTypes';

import quoteIndex from '../../data/quotes/quote-index.json';
import enShard from '../../data/quotes/locales/en.json';

const manifest = quoteIndex as QuoteIndexManifest;
const english = enShard as QuoteLocaleShard;

const shardCache: Partial<Record<IdlingLocaleId, QuoteLocaleShard>> = {
  en: english,
};

const shardLoaders: Record<
  Exclude<IdlingLocaleId, 'en'>,
  () => Promise<QuoteLocaleShard>
> = {
  ar: () => import('../../data/quotes/locales/ar.json').then((m) => m.default as QuoteLocaleShard),
  de: () => import('../../data/quotes/locales/de.json').then((m) => m.default as QuoteLocaleShard),
  es: () => import('../../data/quotes/locales/es.json').then((m) => m.default as QuoteLocaleShard),
  fr: () => import('../../data/quotes/locales/fr.json').then((m) => m.default as QuoteLocaleShard),
  it: () => import('../../data/quotes/locales/it.json').then((m) => m.default as QuoteLocaleShard),
  ja: () => import('../../data/quotes/locales/ja.json').then((m) => m.default as QuoteLocaleShard),
  ko: () => import('../../data/quotes/locales/ko.json').then((m) => m.default as QuoteLocaleShard),
  pt: () => import('../../data/quotes/locales/pt.json').then((m) => m.default as QuoteLocaleShard),
  ru: () => import('../../data/quotes/locales/ru.json').then((m) => m.default as QuoteLocaleShard),
  zh: () => import('../../data/quotes/locales/zh.json').then((m) => m.default as QuoteLocaleShard),
};

const shardLoadPromises = new Map<IdlingLocaleId, Promise<void>>();

/** Load a locale shard on demand — avoids parsing ~3MB of JSON on the main thread at startup. */
export function ensureQuoteLocaleShard(locale: IdlingLocaleId): Promise<void> {
  if (locale === 'en' || shardCache[locale]) {
    return Promise.resolve();
  }
  const existing = shardLoadPromises.get(locale);
  if (existing) {
    return existing;
  }
  const loader = shardLoaders[locale as Exclude<IdlingLocaleId, 'en'>];
  if (!loader) {
    return Promise.resolve();
  }
  const promise = loader()
    .then((shard) => {
      shardCache[locale] = shard;
    })
    .finally(() => {
      shardLoadPromises.delete(locale);
    });
  shardLoadPromises.set(locale, promise);
  return promise;
}

/** Sync pick from shards already in memory (English always; others after `ensureQuoteLocaleShard`). */
export function getRandomQuoteFromBundle(
  localeInput: string
): IdlingQuoteRecord | null {
  const locale = coerceIdlingLocaleId(localeInput);
  const shard = resolveQuoteLocaleShard(
    english,
    shardCache[locale] ?? null,
    locale
  );

  if (!shard) {
    return null;
  }

  return pickRandomQuoteFromShard(manifest, shard, locale);
}