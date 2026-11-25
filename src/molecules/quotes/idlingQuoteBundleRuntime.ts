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

const shardCache: Partial<Record<IdlingLocaleId, QuoteLocaleShard>> = {};

let manifest: QuoteIndexManifest | null = null;
let english: QuoteLocaleShard | null = null;
let bundleReady: Promise<void> | null = null;

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

/** Load index + English shard on demand — keeps quote JSON off the critical path. */
export function ensureQuoteBundleReady(): Promise<void> {
  if (english && manifest) {
    return Promise.resolve();
  }
  if (bundleReady) {
    return bundleReady;
  }
  bundleReady = Promise.all([
    import('../../data/quotes/quote-index.json'),
    import('../../data/quotes/locales/en.json'),
  ]).then(([indexMod, enMod]) => {
    manifest = indexMod.default as QuoteIndexManifest;
    english = enMod.default as QuoteLocaleShard;
    shardCache.en = english;
  });
  return bundleReady;
}

export function ensureQuoteLocaleShard(locale: IdlingLocaleId): Promise<void> {
  return ensureQuoteBundleReady().then(() => {
    if (locale === 'en' || shardCache[locale]) {
      return;
    }
    const existing = shardLoadPromises.get(locale);
    if (existing) {
      return existing;
    }
    const loader = shardLoaders[locale as Exclude<IdlingLocaleId, 'en'>];
    if (!loader) {
      return;
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
  });
}

export function getRandomQuoteFromBundle(
  localeInput: string
): IdlingQuoteRecord | null {
  if (!manifest || !english) {
    return null;
  }
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