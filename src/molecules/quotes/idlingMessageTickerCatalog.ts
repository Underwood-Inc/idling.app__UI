import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import type {
  IdlingQuoteRecord,
  QuoteIndexManifest,
  QuoteLocaleShard,
} from './idlingQuoteTypes';
import { coerceIdlingLocaleId, type IdlingLocaleId } from './idlingLocaleCatalog';
export { formatTickerLine } from './idlingMessageTickerFormat';
import {
  pickRandomQuoteFromShard,
  resolveQuoteLocaleShard,
} from './idlingQuoteBundleCore';

const DATA_ROOT = path.join(process.cwd(), 'src', 'data', 'quotes');

function loadManifest(): QuoteIndexManifest | null {
  const manifestPath = path.join(DATA_ROOT, 'quote-index.json');
  if (!existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as QuoteIndexManifest;
}

function loadShard(locale: IdlingLocaleId): QuoteLocaleShard | null {
  const basePath = path.join(DATA_ROOT, 'locales', 'en.json');
  if (!existsSync(basePath)) {
    return null;
  }
  const enShard = JSON.parse(readFileSync(basePath, 'utf8')) as QuoteLocaleShard;

  if (locale === 'en') {
    return enShard;
  }

  const shardPath = path.join(DATA_ROOT, 'locales', `${locale}.json`);
  if (!existsSync(shardPath)) {
    return enShard;
  }

  const localeShard = JSON.parse(readFileSync(shardPath, 'utf8')) as QuoteLocaleShard;
  return resolveQuoteLocaleShard(enShard, localeShard, locale);
}

export function getQuoteByIdFromBundle(
  id: string,
  localeInput: string
): IdlingQuoteRecord | null {
  const locale = coerceIdlingLocaleId(localeInput);
  const shard = loadShard(locale);
  if (!shard?.quotes[id]) {
    return null;
  }
  const entry = shard.quotes[id];
  return { ...entry, id, locale };
}

export function getRandomQuoteFromBundle(localeInput: string): IdlingQuoteRecord | null {
  const locale = coerceIdlingLocaleId(localeInput);
  const manifest = loadManifest();
  const shard = loadShard(locale);
  if (!shard) {
    return null;
  }

  return pickRandomQuoteFromShard(manifest, shard, locale);
}