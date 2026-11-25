import { buildQuoteId } from './buildQuoteId';
import type {
  HarvestRawQuote,
  IdlingQuoteRecord,
  QuoteRetentionValidation,
} from './idlingQuoteTypes';
import {
  normalizeQuoteText,
  QUOTE_TEXT_MAX_LENGTH,
  QUOTE_TEXT_MIN_LENGTH,
} from './normalizeQuoteText';
import { quoteTextHash } from './quoteTextHash';

const DEFAULT_LOCALE = 'en';

function buildAttribution(raw: HarvestRawQuote, author: string): string | null {
  if (raw.attribution?.trim()) {
    return raw.attribution.trim();
  }
  const sourceTitle = raw.sourceTitle?.trim();
  const sourceLocator = raw.sourceLocator?.trim();
  if (sourceTitle && sourceLocator) {
    return `${author}, ${sourceTitle} (${sourceLocator})`;
  }
  if (sourceTitle) {
    return `${author}, ${sourceTitle}`;
  }
  if (sourceLocator) {
    return `${author}, ${sourceLocator}`;
  }
  return null;
}

export function validateQuoteForRetention(
  raw: HarvestRawQuote,
  locale: string = DEFAULT_LOCALE
): QuoteRetentionValidation {
  if (!raw.provenanceProvider?.trim()) {
    return { ok: false, reason: 'missing_provenance_provider' };
  }

  const text = normalizeQuoteText(raw.text ?? '');
  if (!text) {
    return { ok: false, reason: 'missing_text' };
  }
  if (text.length < QUOTE_TEXT_MIN_LENGTH) {
    return { ok: false, reason: 'text_too_short' };
  }
  if (text.length > QUOTE_TEXT_MAX_LENGTH) {
    return { ok: false, reason: 'text_too_long' };
  }

  const author = raw.author?.trim() ?? '';
  if (!author) {
    return { ok: false, reason: 'missing_author' };
  }

  const sourceTitle = raw.sourceTitle?.trim() ?? '';
  const sourceLocator = raw.sourceLocator?.trim() ?? '';
  if (!sourceTitle && !sourceLocator) {
    return { ok: false, reason: 'missing_source' };
  }

  const attribution = buildAttribution(raw, author);
  if (!attribution) {
    return { ok: false, reason: 'missing_attribution' };
  }

  const record: IdlingQuoteRecord = {
    id: buildQuoteId(text, raw.provenanceProvider, raw.provenanceExternalId),
    locale,
    text,
    author,
    sourceTitle: sourceTitle || sourceLocator,
    sourceLocator: sourceLocator || undefined,
    sourceUrl: raw.sourceUrl?.trim() || undefined,
    attribution,
    rights: raw.rights?.trim() || undefined,
    verification: raw.verification?.trim() || undefined,
    textHash: quoteTextHash(text),
    provenanceProvider: raw.provenanceProvider.trim(),
    provenanceExternalId: raw.provenanceExternalId?.trim() || undefined,
  };

  return { ok: true, record };
}