import 'server-only';

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
import arShard from '../../data/quotes/locales/ar.json';
import deShard from '../../data/quotes/locales/de.json';
import esShard from '../../data/quotes/locales/es.json';
import frShard from '../../data/quotes/locales/fr.json';
import itShard from '../../data/quotes/locales/it.json';
import jaShard from '../../data/quotes/locales/ja.json';
import koShard from '../../data/quotes/locales/ko.json';
import ptShard from '../../data/quotes/locales/pt.json';
import ruShard from '../../data/quotes/locales/ru.json';
import zhShard from '../../data/quotes/locales/zh.json';

const manifest = quoteIndex as QuoteIndexManifest;
const english = enShard as QuoteLocaleShard;

const localeShards: Partial<Record<IdlingLocaleId, QuoteLocaleShard>> = {
  en: english,
  ar: arShard as QuoteLocaleShard,
  de: deShard as QuoteLocaleShard,
  es: esShard as QuoteLocaleShard,
  fr: frShard as QuoteLocaleShard,
  it: itShard as QuoteLocaleShard,
  ja: jaShard as QuoteLocaleShard,
  ko: koShard as QuoteLocaleShard,
  pt: ptShard as QuoteLocaleShard,
  ru: ruShard as QuoteLocaleShard,
  zh: zhShard as QuoteLocaleShard,
};

export function getRandomQuoteFromBundleServer(
  localeInput: string
): IdlingQuoteRecord | null {
  const locale = coerceIdlingLocaleId(localeInput);
  const shard = resolveQuoteLocaleShard(
    english,
    localeShards[locale] ?? null,
    locale
  );

  if (!shard) {
    return null;
  }

  return pickRandomQuoteFromShard(manifest, shard, locale);
}