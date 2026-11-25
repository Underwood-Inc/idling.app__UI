export type QuoteRetentionRejectReason =
  | 'missing_text'
  | 'text_too_short'
  | 'text_too_long'
  | 'missing_author'
  | 'missing_source'
  | 'missing_attribution'
  | 'missing_provenance_provider';

export interface IdlingQuoteRecord {
  id: string;
  locale: string;
  text: string;
  author: string;
  sourceTitle: string;
  sourceLocator?: string;
  sourceUrl?: string;
  attribution: string;
  rights?: string;
  verification?: string;
  textHash: string;
  provenanceProvider: string;
  provenanceExternalId?: string;
}

export interface HarvestRawQuote {
  text: string;
  author?: string;
  sourceTitle?: string;
  sourceLocator?: string;
  sourceUrl?: string;
  attribution?: string;
  rights?: string;
  verification?: string;
  provenanceProvider: string;
  provenanceExternalId?: string;
}

export interface QuoteRetentionValidationResult {
  ok: true;
  record: IdlingQuoteRecord;
}

export interface QuoteRetentionValidationFailure {
  ok: false;
  reason: QuoteRetentionRejectReason;
}

export type QuoteRetentionValidation =
  | QuoteRetentionValidationResult
  | QuoteRetentionValidationFailure;

export interface IdlingQuoteRandomFilters {
  locale: string;
}

export interface IdlingQuoteRepository {
  upsertBatch(records: IdlingQuoteRecord[]): Promise<{ inserted: number; updated: number }>;
  getById(id: string, locale: string): Promise<IdlingQuoteRecord | null>;
  getRandom(filters: IdlingQuoteRandomFilters): Promise<IdlingQuoteRecord | null>;
  listIdsByLocale(locale: string): Promise<string[]>;
  countByLocale(locale: string): Promise<number>;
}

export interface QuoteIndexManifest {
  version: number;
  generatedAt: string;
  baseLocale: string;
  locales: Record<
    string,
    {
      count: number;
      ids: string[];
    }
  >;
}

export interface QuoteLocaleShard {
  version: number;
  locale: string;
  quotes: Record<string, Omit<IdlingQuoteRecord, 'locale'>>;
}