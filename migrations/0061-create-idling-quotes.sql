-- Indexed quote store for message ticker and internal quote API

CREATE TABLE IF NOT EXISTS idling_quotes (
  id TEXT PRIMARY KEY,
  text_hash TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  source_title TEXT NOT NULL,
  source_locator TEXT,
  source_url TEXT,
  attribution TEXT NOT NULL,
  rights TEXT,
  verification TEXT,
  provenance_provider TEXT NOT NULL,
  provenance_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idling_quote_locales (
  quote_id TEXT NOT NULL REFERENCES idling_quotes (id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (quote_id, locale)
);

CREATE INDEX IF NOT EXISTS idling_quote_locales_locale_idx
  ON idling_quote_locales (locale);

CREATE INDEX IF NOT EXISTS idling_quotes_author_idx
  ON idling_quotes (author);

CREATE INDEX IF NOT EXISTS idling_quotes_provenance_provider_idx
  ON idling_quotes (provenance_provider);