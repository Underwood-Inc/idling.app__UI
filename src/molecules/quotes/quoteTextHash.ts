import { createHash } from 'node:crypto';

import { normalizeQuoteText } from './normalizeQuoteText';

export function quoteTextHash(text: string): string {
  const normalized = normalizeQuoteText(text).toLowerCase();
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}