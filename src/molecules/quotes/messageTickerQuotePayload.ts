import type { IdlingLocaleId } from './idlingLocaleCatalog';
import { getRandomQuoteFromBundle } from './idlingQuoteBundleRuntime';
import type { IdlingQuoteRecord } from './idlingQuoteTypes';

export interface MessageTickerQuotePayload {
  line: string;
  id: string;
  locale: string;
  text: string;
  attribution: string;
  author: string;
  sourceTitle: string;
}

export function idlingQuoteRecordToTickerPayload(
  record: IdlingQuoteRecord,
  separator: string
): MessageTickerQuotePayload {
  return {
    id: record.id,
    locale: record.locale,
    text: record.text,
    attribution: record.attribution,
    author: record.author,
    sourceTitle: record.sourceTitle,
    line: `${record.text}${separator}${record.attribution}`,
  };
}

/** Synchronous pick from bundled shards — no server round trip. */
export function pickMessageTickerQuote(
  localeId: IdlingLocaleId,
  separator: string
): MessageTickerQuotePayload | null {
  let record = getRandomQuoteFromBundle(localeId);
  if (!record && localeId !== 'en') {
    record = getRandomQuoteFromBundle('en');
  }
  if (!record) {
    return null;
  }
  return idlingQuoteRecordToTickerPayload(record, separator);
}