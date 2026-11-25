#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/i18n/supported-locales.json'), 'utf8')
);
const enShard = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'src/data/quotes/locales/en.json'),
    'utf8'
  )
);

const localesDir = path.join(ROOT, 'src/data/quotes/locales');
fs.mkdirSync(localesDir, { recursive: true });

const index = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/quotes/quote-index.json'), 'utf8')
);

index.locales = {};

for (const row of manifest.locales) {
  const locale = row.id;
  const quotes = {};
  for (const [id, entry] of Object.entries(enShard.quotes)) {
    quotes[id] = {
      ...entry,
      text: locale === 'en' ? entry.text : `[${locale}] ${entry.text}`,
    };
  }
  const shard = { version: 1, locale, quotes };
  fs.writeFileSync(
    path.join(localesDir, `${locale}.json`),
    `${JSON.stringify(shard, null, 2)}\n`,
    'utf8'
  );
  index.locales[locale] = {
    count: Object.keys(quotes).length,
    ids: Object.keys(quotes).sort(),
  };
}

index.generatedAt = new Date().toISOString();
fs.writeFileSync(
  path.join(ROOT, 'src/data/quotes/quote-index.json'),
  `${JSON.stringify(index, null, 2)}\n`,
  'utf8'
);

console.log(`Stubbed quote shards for ${manifest.locales.length} locales`);