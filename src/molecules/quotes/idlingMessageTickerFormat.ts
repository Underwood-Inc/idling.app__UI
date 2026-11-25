import type { TranslationFunctions } from '$i18n/i18n-types';
import type { IdlingQuoteRecord } from './idlingQuoteTypes';

/** Safe for client components — no Node `fs`. */
export function formatTickerLine(
  record: IdlingQuoteRecord,
  ll?: TranslationFunctions
): string {
  const separator = ll?.messageTicker.separator() ?? ' — ';
  return `${record.text}${separator}${record.attribution}`;
}