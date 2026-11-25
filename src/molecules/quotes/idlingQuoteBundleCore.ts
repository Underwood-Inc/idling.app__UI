import type {
  IdlingQuoteRecord,
  QuoteIndexManifest,
  QuoteLocaleShard,
} from './idlingQuoteTypes';
import type { IdlingLocaleId } from './idlingLocaleCatalog';

function shardEntryToRecord(
  locale: IdlingLocaleId,
  id: string,
  entry: Omit<IdlingQuoteRecord, 'locale'>
): IdlingQuoteRecord {
  return { ...entry, id, locale };
}

/** Overlay locale quote bodies on English; keep English rows when a locale string is missing. */
export function mergeQuoteLocaleShard(
  english: QuoteLocaleShard,
  localeShard: QuoteLocaleShard,
  locale: IdlingLocaleId
): QuoteLocaleShard {
  const quotes: QuoteLocaleShard['quotes'] = { ...localeShard.quotes };

  for (const [id, enEntry] of Object.entries(english.quotes)) {
    if (!quotes[id]?.text) {
      quotes[id] = { ...enEntry };
    }
  }

  return { ...localeShard, locale, quotes };
}

export function resolveQuoteLocaleShard(
  english: QuoteLocaleShard | null,
  localeShard: QuoteLocaleShard | null,
  locale: IdlingLocaleId
): QuoteLocaleShard | null {
  if (!english) {
    return null;
  }
  if (locale === 'en') {
    return english;
  }
  if (!localeShard) {
    return english;
  }
  return mergeQuoteLocaleShard(english, localeShard, locale);
}

export function pickRandomQuoteFromShard(
  manifest: QuoteIndexManifest | null,
  shard: QuoteLocaleShard,
  locale: IdlingLocaleId
): IdlingQuoteRecord | null {
  const ids =
    manifest?.locales[locale]?.ids?.length
      ? manifest.locales[locale].ids
      : Object.keys(shard.quotes);

  if (!ids.length) {
    return null;
  }

  const id = ids[Math.floor(Math.random() * ids.length)]!;
  const entry = shard.quotes[id];
  if (!entry) {
    return null;
  }

  return shardEntryToRecord(locale, id, entry);
}