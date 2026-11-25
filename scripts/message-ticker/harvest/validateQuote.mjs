import { createHash } from 'node:crypto';

const MIN = 12;
const MAX = 320;

export function normalizeQuoteText(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function quoteTextHash(text) {
  return createHash('sha256')
    .update(normalizeQuoteText(text).toLowerCase(), 'utf8')
    .digest('hex');
}

function buildAttribution(raw, author) {
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

function buildQuoteId(text, provenanceProvider, provenanceExternalId) {
  const slug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  const provider = slug(provenanceProvider) || 'unknown';
  if (provenanceExternalId) {
    return `${provider}-${slug(provenanceExternalId)}`.slice(0, 120);
  }
  const hash = createHash('sha256')
    .update(normalizeQuoteText(text).toLowerCase(), 'utf8')
    .digest('hex')
    .slice(0, 16);
  return `${provider}-${hash}`;
}

export function validateQuoteForRetention(raw, locale = 'en') {
  if (!raw.provenanceProvider?.trim()) {
    return { ok: false, reason: 'missing_provenance_provider' };
  }
  const text = normalizeQuoteText(raw.text);
  if (!text) {
    return { ok: false, reason: 'missing_text' };
  }
  if (text.length < MIN) {
    return { ok: false, reason: 'text_too_short' };
  }
  if (text.length > MAX) {
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
  return {
    ok: true,
    record: {
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
    },
  };
}