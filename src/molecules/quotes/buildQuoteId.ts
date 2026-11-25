import { createHash } from 'node:crypto';

import { normalizeQuoteText } from './normalizeQuoteText';

function slugPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function buildQuoteId(
  text: string,
  provenanceProvider: string,
  provenanceExternalId?: string
): string {
  const provider = slugPart(provenanceProvider) || 'unknown';
  if (provenanceExternalId) {
    const ext = slugPart(provenanceExternalId);
    return `${provider}-${ext}`.slice(0, 120);
  }
  const hash = createHash('sha256')
    .update(normalizeQuoteText(text).toLowerCase(), 'utf8')
    .digest('hex')
    .slice(0, 16);
  return `${provider}-${hash}`;
}