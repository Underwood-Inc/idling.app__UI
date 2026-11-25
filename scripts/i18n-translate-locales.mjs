#!/usr/bin/env node
/**
 * Machine-translate src/i18n/locales/en.json into sibling locale JSON files.
 *
 * Incremental by default: only keys whose English source changed (or are missing /
 * untracked) are sent to LibreTranslate. Fingerprints live in translation-meta.json.
 *
 * Provider: self-hosted LibreTranslate only (open source — no credit-card signup).
 *
 * Usage:
 *   node scripts/i18n-translate-locales.mjs              # incremental
 *   node scripts/i18n-translate-locales.mjs --full       # re-translate all keys
 *   node scripts/i18n-translate-locales.mjs --stub       # offline prefix mode
 *   node scripts/i18n-translate-locales.mjs --locale es  # one locale
 *   node scripts/i18n-translate-locales.mjs --bootstrap-meta  # record hashes only
 *
 * Start LibreTranslate locally (first run downloads language models):
 *   docker run -d --name mappy-libretranslate -p 5000:5000 libretranslate/libretranslate --load-only en,es,zh,fr,de,ja,pt,ru,ko,it,ar
 *
 * Env:
 *   LIBRETRANSLATE_URL      — default http://localhost:5000
 *   LIBRETRANSLATE_API_KEY  — optional when your server requires api_key
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { atomicWriteFileSync } from './lib/atomic-write-file.mjs';

import {
  applyLeafPathsToTree,
  flattenLeaves,
  normalizeLocaleTreeForTypesafeI18n,
  valuesForPaths,
} from './lib/i18n-locale-tree.mjs';
import { protectPlaceholders, restorePlaceholders } from './lib/i18n-placeholders.mjs';
import { translateWorkIndicesIncremental, resolveTranslateConcurrency } from './lib/incremental-translate-keys.mjs';
import {
  assertLibreTranslateReachable,
  libreTargetFor,
  translateAllStrings,
} from './lib/libretranslate-batch.mjs';
import {
  bootstrapTranslationMeta,
  buildSourceFingerprints,
  loadTranslationMeta,
  planLocaleTranslationWork,
  pruneTranslationMeta,
  repairLocaleMetaFromFiles,
  saveTranslationMeta,
  summarizeTranslationPlan,
} from './lib/i18n-translation-meta.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_PATH = path.join(ROOT, 'src/i18n/locales/en.json');
const MANIFEST_PATH = path.join(ROOT, 'src/i18n/supported-locales.json');
const META_PATH = path.join(ROOT, 'src/i18n/translation-meta.json');

const stubMode = process.argv.includes('--stub');
const fullMode = process.argv.includes('--full');
const bootstrapMetaOnly = process.argv.includes('--bootstrap-meta');
const localeArgIdx = process.argv.indexOf('--locale');
const onlyLocale = localeArgIdx >= 0 ? process.argv[localeArgIdx + 1] : null;

const libreUrl = (process.env.LIBRETRANSLATE_URL ?? 'http://localhost:5000').replace(/\/$/, '');
const libreApiKey = process.env.LIBRETRANSLATE_API_KEY?.trim() ?? '';

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const targetLocales = manifest.locales
  .map((row) => row.id)
  .filter((id) => id !== manifest.baseLocale)
  .filter((id) => !onlyLocale || id === onlyLocale);

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const { paths, values } = flattenLeaves(en);
const sourceFingerprints = buildSourceFingerprints(paths, values);

/** @type {Record<string, Record<string, unknown>>} */
const localeTrees = {};
/** @type {Record<string, (string | undefined)[]>} */
const localeValueMaps = {};

for (const localeId of targetLocales) {
  const localePath = path.join(ROOT, 'src/i18n/locales', `${localeId}.json`);
  const tree = fs.existsSync(localePath)
    ? JSON.parse(fs.readFileSync(localePath, 'utf8'))
    : {};
  localeTrees[localeId] = tree;
  localeValueMaps[localeId] = valuesForPaths(paths, tree);
}

let meta = loadTranslationMeta(META_PATH);

if (bootstrapMetaOnly) {
  meta = bootstrapTranslationMeta(meta, paths, sourceFingerprints, targetLocales, localeTrees, values);
  pruneTranslationMeta(meta, paths, targetLocales);
  saveTranslationMeta(META_PATH, meta);
  console.log(`Wrote ${META_PATH} (${paths.length} keys × ${targetLocales.length} locales).`);
  process.exit(0);
}

const metaWasEmpty = Object.keys(meta.source).length === 0;

if (metaWasEmpty && !fullMode) {
  meta = bootstrapTranslationMeta(meta, paths, sourceFingerprints, targetLocales, localeTrees, values);
  saveTranslationMeta(META_PATH, meta);
  console.log(
    'Initialized translation-meta.json from existing locale files (no re-translation).',
  );
}

if (
  !fullMode &&
  repairLocaleMetaFromFiles(meta, paths, sourceFingerprints, targetLocales, localeValueMaps, values)
) {
  saveTranslationMeta(META_PATH, meta);
  console.log('Repaired translation-meta.json from existing locale files (ledger was incomplete).');
}

const planSummary = summarizeTranslationPlan(
  meta,
  paths,
  sourceFingerprints,
  targetLocales,
  localeValueMaps,
  { enValues: values, acceptStubs: stubMode },
);

async function translateLocaleStub(batchValues, localeId) {
  return batchValues.map((value) => {
    if (!value.trim()) return value;
    const { protectedText, tokens, spacing } = protectPlaceholders(value);
    return restorePlaceholders(`[${localeId}] ${protectedText}`, tokens, spacing);
  });
}

const libreConfig = { url: libreUrl, apiKey: libreApiKey || undefined };

if (!stubMode && (fullMode || planSummary.totalTranslate > 0)) {
  try {
    await assertLibreTranslateReachable(targetLocales, libreConfig);
  } catch (err) {
    console.error(err.message ?? err);
    process.exit(1);
  }
  console.log(
    `LibreTranslate OK — en → ${targetLocales.map((id) => libreTargetFor(id)).join(', ')}`,
  );
}

if (fullMode) {
  console.log(`Full re-translation mode (${paths.length} keys per locale).`);
} else {
  console.log(
    `Incremental mode — ${planSummary.totalTranslate} string(s) to translate across ${targetLocales.length} locale(s).`,
  );
  for (const localeId of targetLocales) {
    const row = planSummary.byLocale[localeId];
    console.log(`  ${localeId}: translate ${row.translate}, skip ${row.skip}`);
  }
}

if (planSummary.totalTranslate === 0 && !fullMode) {
  pruneTranslationMeta(meta, paths, targetLocales);
  saveTranslationMeta(META_PATH, meta);
  console.log('All locale strings are up to date with en.json.');
  process.exit(0);
}

const translateConcurrency = resolveTranslateConcurrency();
console.log(`Translation concurrency: ${translateConcurrency} (${process.platform})`);

async function translateValues(batchValues, localeId) {
  if (stubMode) return translateLocaleStub(batchValues, localeId);
  return translateAllStrings(batchValues, localeId, libreConfig);
}

for (const localeId of targetLocales) {
  const localeValues = localeValueMaps[localeId];
  const { indices: workIndices } = planLocaleTranslationWork({
    paths,
    enValues: values,
    sourceFingerprints,
    localeId,
    localeValues,
    meta,
    full: fullMode,
    acceptStubs: stubMode,
  });

  if (workIndices.length === 0) {
    process.stdout.write(`${localeId}: up to date\n`);
    continue;
  }

  const outPath = path.join(ROOT, 'src/i18n/locales', `${localeId}.json`);
  const outTree = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};

  await translateWorkIndicesIncremental({
    localeId,
    paths,
    enValues: values,
    localeValues,
    workIndices,
    sourceFingerprints,
    meta,
    persistMeta: () => saveTranslationMeta(META_PATH, meta),
    translateValues,
    concurrency: translateConcurrency,
    persistLocaleValues: (vals) => {
      applyLeafPathsToTree(outTree, paths, vals);
      const tree = normalizeLocaleTreeForTypesafeI18n(outTree);
      atomicWriteFileSync(outPath, `${JSON.stringify(tree, null, 2)}\n`);
    },
  });
}

pruneTranslationMeta(meta, paths, targetLocales);
saveTranslationMeta(META_PATH, meta);

console.log(`Updated ${targetLocales.length} locale file(s) and translation-meta.json.`);
