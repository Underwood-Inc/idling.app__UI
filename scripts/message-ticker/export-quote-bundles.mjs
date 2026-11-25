#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(ROOT, 'src', 'data', 'quotes', 'corpus.en.json');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'quotes');
const LOCALES_DIR = path.join(OUT_DIR, 'locales');
const MANIFEST_PATH = path.join(OUT_DIR, 'quote-index.json');

function loadCorpus() {
  if (!fs.existsSync(CORPUS)) {
    return [];
  }
  const body = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
  return body.quotes ?? [];
}

function toShardEntry(record) {
  const { locale: _locale, ...rest } = record;
  return rest;
}

function main() {
  const quotes = loadCorpus();
  if (!quotes.length) {
    console.error('No corpus found. Run quotes:harvest first.');
    process.exit(1);
  }

  const ids = quotes.map((q) => q.id);
  const quotesMap = {};
  for (const record of quotes) {
    quotesMap[record.id] = toShardEntry(record);
  }

  const shard = {
    version: 1,
    locale: 'en',
    quotes: quotesMap,
  };

  fs.mkdirSync(LOCALES_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(LOCALES_DIR, 'en.json'),
    `${JSON.stringify(shard, null, 2)}\n`,
    'utf8'
  );

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    baseLocale: 'en',
    locales: {
      en: { count: ids.length, ids },
    },
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Exported ${ids.length} quotes to ${LOCALES_DIR} and ${MANIFEST_PATH}`);
}

main();