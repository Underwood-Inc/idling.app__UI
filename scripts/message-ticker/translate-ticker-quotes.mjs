#!/usr/bin/env node
/**
 * Incremental quote-body MT into locale shards (same ledger pattern as UI i18n).
 *
 *   node scripts/message-ticker/translate-ticker-quotes.mjs           # incremental batches
 *   node scripts/message-ticker/translate-ticker-quotes.mjs --sync-en # copy EN text (no API)
 *   node scripts/message-ticker/translate-ticker-quotes.mjs --full    # re-translate all bodies
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { atomicWriteFileSync } from '../lib/atomic-write-file.mjs';
import {
  translateWorkIndicesIncremental,
} from '../lib/incremental-translate-keys.mjs';
import { isStubLocaleString } from '../lib/i18n-locale-tree.mjs';
import {
  buildSourceFingerprints,
  loadTranslationMeta,
  planLocaleTranslationWork,
  repairLocaleMetaFromFiles,
  saveTranslationMeta,
} from '../lib/i18n-translation-meta.mjs';
import {
  assertLibreTranslateReachable,
  libreTargetFor,
  translateAllStrings,
} from '../lib/libretranslate-batch.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const META_PATH = path.join(ROOT, 'src/data/quotes/quote-translation-meta.json');
const MANIFEST_PATH = path.join(ROOT, 'src/i18n/supported-locales.json');
const EN_SHARD = path.join(ROOT, 'src/data/quotes/locales/en.json');
const LOCALES_DIR = path.join(ROOT, 'src/data/quotes/locales');
const INDEX_PATH = path.join(ROOT, 'src/data/quotes/quote-index.json');

const syncEn = process.argv.includes('--sync-en');
const fullMode = process.argv.includes('--full');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyLocales = onlyArg
  ? new Set(onlyArg.replace('--only=', '').split(',').map((s) => s.trim()).filter(Boolean))
  : null;

/** Legacy meta used `{ locales: { ja: { updatedAt, count } } }` — strip to ledger shape. */
function loadQuoteTranslationMeta() {
  const raw = loadTranslationMeta(META_PATH);
  for (const value of Object.values(raw.locales)) {
    if (value && typeof value === 'object' && 'updatedAt' in value) {
      raw.locales = {};
      break;
    }
  }
  return raw;
}

function syncEnglishToAllLocales() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const enShard = JSON.parse(fs.readFileSync(EN_SHARD, 'utf8'));
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  index.locales = {};

  for (const row of manifest.locales) {
    const locale = row.id;
    const quotes = {};
    for (const [id, entry] of Object.entries(enShard.quotes)) {
      quotes[id] = { ...entry };
    }
    const shard = { version: enShard.version ?? 1, locale, quotes };
    atomicWriteFileSync(
      path.join(LOCALES_DIR, `${locale}.json`),
      `${JSON.stringify(shard, null, 2)}\n`
    );
    index.locales[locale] = {
      count: Object.keys(quotes).length,
      ids: Object.keys(quotes).sort(),
    };
  }
  index.generatedAt = new Date().toISOString();
  atomicWriteFileSync(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);
  console.log(
    `Synced EN quote text to ${manifest.locales.length} locale shards (run without --sync-en when LibreTranslate is up)`
  );
}

function readLocaleQuoteTexts(ids, localeId) {
  const localePath = path.join(LOCALES_DIR, `${localeId}.json`);
  if (!fs.existsSync(localePath)) {
    return ids.map(() => undefined);
  }
  const shard = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const quotes = shard.quotes ?? {};
  return ids.map((id) => quotes[id]?.text);
}

function writeLocaleQuoteShard(localeId, ids, enShard, localeTexts) {
  const quotes = {};
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    quotes[id] = {
      ...enShard.quotes[id],
      text: localeTexts[i] ?? enShard.quotes[id].text,
    };
  }
  const shard = { version: enShard.version ?? 1, locale: localeId, quotes };
  atomicWriteFileSync(
    path.join(LOCALES_DIR, `${localeId}.json`),
    `${JSON.stringify(shard, null, 2)}\n`
  );
  return shard;
}

async function translateWithLibreTranslate() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const enShard = JSON.parse(fs.readFileSync(EN_SHARD, 'utf8'));
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  let meta = loadQuoteTranslationMeta();

  const url = process.env.LIBRETRANSLATE_URL ?? 'http://localhost:5000';
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;
  const libreConfig = { url, apiKey, batchSize: 20, batchDelayMs: 200, fetchTimeoutMs: 300_000 };

  const targetLocales = manifest.locales
    .map((row) => row.id)
    .filter((id) => id !== 'en')
    .filter((id) => !onlyLocales || onlyLocales.has(id));

  const ids = Object.keys(enShard.quotes).sort();
  const paths = ids;
  const enValues = ids.map((id) => enShard.quotes[id].text ?? '');
  const sourceFingerprints = buildSourceFingerprints(paths, enValues);

  /** @type {Record<string, (string | undefined)[]>} */
  const localeValueMaps = {};
  for (const localeId of targetLocales) {
    localeValueMaps[localeId] = readLocaleQuoteTexts(ids, localeId);
  }

  if (
    !fullMode &&
    repairLocaleMetaFromFiles(meta, paths, sourceFingerprints, targetLocales, localeValueMaps, enValues)
  ) {
    saveTranslationMeta(META_PATH, meta);
    console.log('[quotes:translate] Repaired quote translation-meta from existing shards.');
  }

  let totalPlanned = 0;
  for (const localeId of targetLocales) {
    const { indices } = planLocaleTranslationWork({
      paths,
      enValues,
      sourceFingerprints,
      localeId,
      localeValues: localeValueMaps[localeId],
      meta,
      full: fullMode,
    });
    totalPlanned += indices.length;
  }

  if (totalPlanned === 0 && !fullMode) {
    console.log('[quotes:translate] All quote bodies up to date with EN corpus.');
    return;
  }

  await assertLibreTranslateReachable(targetLocales, libreConfig);
  console.log(
    `[quotes:translate] Incremental mode — ${totalPlanned} body string(s) across ${targetLocales.length} locale(s).`,
  );

  async function translateValues(batchValues, localeId) {
    return translateAllStrings(batchValues, localeId, libreConfig);
  }

  for (const localeId of targetLocales) {
    const localeValues = localeValueMaps[localeId];
    const target = libreTargetFor(localeId);
    const { indices: workIndices } = planLocaleTranslationWork({
      paths,
      enValues,
      sourceFingerprints,
      localeId,
      localeValues,
      meta,
      full: fullMode,
    });

    if (workIndices.length === 0) {
      process.stdout.write(`[quotes:translate] ${localeId} (${target}): up to date\n`);
      continue;
    }

    console.log(
      `[quotes:translate] ${localeId} (${target}): translate ${workIndices.length} / ${ids.length}`,
    );

    const enShardSnapshot = enShard;

    await translateWorkIndicesIncremental({
      localeId,
      paths,
      enValues,
      localeValues,
      workIndices,
      sourceFingerprints,
      meta,
      persistMeta: () => saveTranslationMeta(META_PATH, meta),
      translateValues,
      keysPerBatch: 5,
      persistLocaleValues: (vals) => {
        writeLocaleQuoteShard(localeId, ids, enShardSnapshot, vals);
        index.locales[localeId] = { count: ids.length, ids };
      },
    });
  }

  index.generatedAt = new Date().toISOString();
  atomicWriteFileSync(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);
  saveTranslationMeta(META_PATH, meta);
  console.log('[quotes:translate] Quote localization updated via incremental LibreTranslate batches.');
}

async function main() {
  if (syncEn) {
    syncEnglishToAllLocales();
    return;
  }
  try {
    await translateWithLibreTranslate();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      'Quote translation failed; locale shards were not overwritten. Re-run when LibreTranslate is up, or use --sync-en only if you explicitly want English in all shards.'
    );
    process.exitCode = 1;
  }
}

main();