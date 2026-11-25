#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(ROOT, 'src', 'data', 'quotes', 'corpus.en.json');

const sql = postgres({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  prepare: false,
});

async function main() {
  const body = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
  const quotes = body.quotes ?? [];
  let upserted = 0;
  for (const record of quotes) {
    const existing = await sql`
      SELECT id FROM idling_quotes WHERE id = ${record.id} OR text_hash = ${record.textHash}
      LIMIT 1
    `;
    const quoteId = existing[0]?.id ?? record.id;
    if (!existing.length) {
      await sql`
        INSERT INTO idling_quotes (
          id, text_hash, author, source_title, source_locator, source_url,
          attribution, rights, verification, provenance_provider, provenance_external_id
        ) VALUES (
          ${record.id}, ${record.textHash}, ${record.author}, ${record.sourceTitle},
          ${record.sourceLocator ?? null}, ${record.sourceUrl ?? null},
          ${record.attribution}, ${record.rights ?? null}, ${record.verification ?? null},
          ${record.provenanceProvider}, ${record.provenanceExternalId ?? null}
        )
      `;
    }
    await sql`
      INSERT INTO idling_quote_locales (quote_id, locale, text)
      VALUES (${quoteId}, ${record.locale}, ${record.text})
      ON CONFLICT (quote_id, locale) DO UPDATE SET text = EXCLUDED.text, updated_at = NOW()
    `;
    upserted += 1;
  }
  console.log(`Imported ${upserted} quotes into Postgres`);
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});