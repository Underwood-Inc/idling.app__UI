'use server';

import { getRandomQuoteFromBundleServer } from '@molecules/quotes/idlingQuoteBundleRuntime.server';
import { coerceIdlingLocaleId } from '@molecules/quotes/idlingLocaleCatalog';
import {
  idlingQuoteRecordToTickerPayload,
  type MessageTickerQuotePayload,
} from '@molecules/quotes/messageTickerQuotePayload';

export type TickerQuotePayload = MessageTickerQuotePayload;

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

  return idlingQuoteRecordToTickerPayload(record, separator);
}