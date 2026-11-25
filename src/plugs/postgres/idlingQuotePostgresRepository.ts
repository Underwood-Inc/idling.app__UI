import sql from '@lib/db';

import type {
  IdlingQuoteRecord,
  IdlingQuoteRepository,
  IdlingQuoteRandomFilters,
} from '@molecules/quotes/idlingQuoteTypes';

interface QuoteRow {
  id: string;
  text_hash: string;
  author: string;
  source_title: string;
  source_locator: string | null;
  source_url: string | null;
  attribution: string;
  rights: string | null;
  verification: string | null;
  provenance_provider: string;
  provenance_external_id: string | null;
  locale_text: string;
  locale: string;
}

function mapRow(row: QuoteRow): IdlingQuoteRecord {
  return {
    id: row.id,
    locale: row.locale,
    text: row.locale_text,
    author: row.author,
    sourceTitle: row.source_title,
    sourceLocator: row.source_locator ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    attribution: row.attribution,
    rights: row.rights ?? undefined,
    verification: row.verification ?? undefined,
    textHash: row.text_hash,
    provenanceProvider: row.provenance_provider,
    provenanceExternalId: row.provenance_external_id ?? undefined,
  };
}

export const idlingQuotePostgresRepository: IdlingQuoteRepository = {
  async upsertBatch(records: IdlingQuoteRecord[]) {
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const existing = await sql<{ id: string }[]>`
        SELECT id FROM idling_quotes WHERE id = ${record.id} OR text_hash = ${record.textHash}
        LIMIT 1
      `;

      if (existing.length > 0) {
        updated += 1;
        await sql`
          UPDATE idling_quotes SET
            author = ${record.author},
            source_title = ${record.sourceTitle},
            source_locator = ${record.sourceLocator ?? null},
            source_url = ${record.sourceUrl ?? null},
            attribution = ${record.attribution},
            rights = ${record.rights ?? null},
            verification = ${record.verification ?? null},
            provenance_provider = ${record.provenanceProvider},
            provenance_external_id = ${record.provenanceExternalId ?? null},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
        `;
        await sql`
          INSERT INTO idling_quote_locales (quote_id, locale, text)
          VALUES (${existing[0].id}, ${record.locale}, ${record.text})
          ON CONFLICT (quote_id, locale) DO UPDATE SET
            text = EXCLUDED.text,
            updated_at = NOW()
        `;
      } else {
        inserted += 1;
        await sql`
          INSERT INTO idling_quotes (
            id, text_hash, author, source_title, source_locator, source_url,
            attribution, rights, verification, provenance_provider, provenance_external_id
          ) VALUES (
            ${record.id},
            ${record.textHash},
            ${record.author},
            ${record.sourceTitle},
            ${record.sourceLocator ?? null},
            ${record.sourceUrl ?? null},
            ${record.attribution},
            ${record.rights ?? null},
            ${record.verification ?? null},
            ${record.provenanceProvider},
            ${record.provenanceExternalId ?? null}
          )
        `;
        await sql`
          INSERT INTO idling_quote_locales (quote_id, locale, text)
          VALUES (${record.id}, ${record.locale}, ${record.text})
        `;
      }
    }

    return { inserted, updated };
  },

  async getById(id: string, locale: string) {
    const rows = await sql<QuoteRow[]>`
      SELECT
        q.id,
        q.text_hash,
        q.author,
        q.source_title,
        q.source_locator,
        q.source_url,
        q.attribution,
        q.rights,
        q.verification,
        q.provenance_provider,
        q.provenance_external_id,
        l.text AS locale_text,
        l.locale
      FROM idling_quotes q
      INNER JOIN idling_quote_locales l ON l.quote_id = q.id
      WHERE q.id = ${id} AND l.locale = ${locale}
      LIMIT 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async getRandom({ locale }: IdlingQuoteRandomFilters) {
    const rows = await sql<QuoteRow[]>`
      SELECT
        q.id,
        q.text_hash,
        q.author,
        q.source_title,
        q.source_locator,
        q.source_url,
        q.attribution,
        q.rights,
        q.verification,
        q.provenance_provider,
        q.provenance_external_id,
        l.text AS locale_text,
        l.locale
      FROM idling_quotes q
      INNER JOIN idling_quote_locales l ON l.quote_id = q.id
      WHERE l.locale = ${locale}
      ORDER BY RANDOM()
      LIMIT 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async listIdsByLocale(locale: string) {
    const rows = await sql<{ quote_id: string }[]>`
      SELECT quote_id FROM idling_quote_locales WHERE locale = ${locale} ORDER BY quote_id
    `;
    return rows.map((r) => r.quote_id);
  },

  async countByLocale(locale: string) {
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM idling_quote_locales WHERE locale = ${locale}
    `;
    return Number(rows[0]?.count ?? 0);
  },
};