'use server';

import { getRandomQuoteFromBundleServer } from '@molecules/quotes/idlingQuoteBundleRuntime.server';
import { coerceIdlingLocaleId } from '@molecules/quotes/idlingLocaleCatalog';
import type { IdlingQuoteRecord } from '@molecules/quotes/idlingQuoteTypes';

export interface TickerQuotePayload {
  line: string;
  id: string;
  locale: string;
  text: string;
  attribution: string;
  author: string;
  sourceTitle: string;
}

function toPayload(
  record: IdlingQuoteRecord,
  separator: string
): TickerQuotePayload {
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

export async function fetchTickerQuote(
  localeInput: string,
  separator: string
): Promise<TickerQuotePayload | null> {
  const locale = coerceIdlingLocaleId(localeInput);

  let record = getRandomQuoteFromBundleServer(locale);

  if (!record && locale !== 'en') {
    record = getRandomQuoteFromBundleServer('en');
  }

  if (!record) {
    return null;
  }

  return toPayload(record, separator);
}