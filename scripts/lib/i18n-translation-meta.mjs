/**
 * Translation memory metadata for incremental UI i18n (source-string fingerprint per leaf key).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

import { atomicWriteFileSync } from './atomic-write-file.mjs';
import { getLeafString, isStubLocaleString, hasMachineTranslationPlaceholderLeak, hasEnglishPhraseCarryover } from './i18n-locale-tree.mjs';

export const TRANSLATION_META_VERSION = 1;

/** @param {string} value */
export function hashSourceString(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/** @param {string[]} paths @param {string[]} enValues */
export function buildSourceFingerprints(paths, enValues) {
  /** @type {Record<string, string>} */
  const source = {};
  for (let i = 0; i < paths.length; i++) {
    source[paths[i]] = hashSourceString(enValues[i]);
  }
  return source;
}

/** @returns {import('./i18n-translation-meta.d.ts').TranslationMeta} */
export function emptyTranslationMeta() {
  return {
    version: TRANSLATION_META_VERSION,
    updatedAt: new Date(0).toISOString(),
    source: {},
    locales: {},
  };
}

/** @param {unknown} raw */
export function normalizeTranslationMeta(raw) {
  if (!raw || typeof raw !== 'object') return emptyTranslationMeta();
  const obj = /** @type {Record<string, unknown>} */ (raw);
  return {
    version:
      typeof obj.version === 'number' ? obj.version : TRANSLATION_META_VERSION,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date(0).toISOString(),
    source:
      obj.source && typeof obj.source === 'object'
        ? /** @type {Record<string, string>} */ (obj.source)
        : {},
    locales:
      obj.locales && typeof obj.locales === 'object'
        ? /** @type {Record<string, Record<string, string>>} */ (obj.locales)
        : {},
  };
}

/** @param {string} metaPath */
export function loadTranslationMeta(metaPath) {
  if (!fs.existsSync(metaPath)) return emptyTranslationMeta();
  return normalizeTranslationMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8')));
}

/** @param {string} metaPath @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta */
export function saveTranslationMeta(metaPath, meta) {
  const next = {
    ...meta,
    version: TRANSLATION_META_VERSION,
    updatedAt: new Date().toISOString(),
  };
  atomicWriteFileSync(metaPath, `${JSON.stringify(next, null, 2)}\n`);
}

/** @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta @param {string[]} paths @param {Record<string, string>} sourceFingerprints @param {string[]} localeIds @param {Record<string, Record<string, unknown>>} localeTrees @param {string[] | undefined} enValues */
export function bootstrapTranslationMeta(
  meta,
  paths,
  sourceFingerprints,
  localeIds,
  localeTrees,
  enValues,
) {
  for (const path of paths) {
    meta.source[path] = sourceFingerprints[path];
  }
  for (const localeId of localeIds) {
    if (!meta.locales[localeId]) meta.locales[localeId] = {};
    const tree = localeTrees[localeId] ?? {};
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const value = getLeafString(tree, path);
      const enValue = enValues?.[i];
      if (value !== undefined && value.length > 0 && !isStubLocaleString(value, localeId)) {
        if (enValue !== undefined && value === enValue) continue;
        meta.locales[localeId][path] = sourceFingerprints[path];
      }
    }
  }
  return meta;
}

/** @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta @param {string[]} paths @param {Record<string, string>} sourceFingerprints @param {string[]} localeIds @param {Record<string, Record<string, string>>} localeStringsByLocale @param {string[] | undefined} enValues */
export function bootstrapFlatLocaleStringsMeta(
  meta,
  paths,
  sourceFingerprints,
  localeIds,
  localeStringsByLocale,
  enValues,
) {
  for (const path of paths) {
    meta.source[path] = sourceFingerprints[path];
  }
  for (const localeId of localeIds) {
    if (!meta.locales[localeId]) meta.locales[localeId] = {};
    const strings = localeStringsByLocale[localeId] ?? {};
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const value = strings[path];
      const enValue = enValues?.[i];
      if (
        typeof value === 'string' &&
        value.length > 0 &&
        !isStubLocaleString(value, localeId)
      ) {
        if (enValue !== undefined && value === enValue) continue;
        meta.locales[localeId][path] = sourceFingerprints[path];
      }
    }
  }
  return meta;
}

/** @param {{ paths: string[]; enValues?: string[]; sourceFingerprints: Record<string, string>; localeId: string; localeValues: (string | undefined)[]; meta: import('./i18n-translation-meta.d.ts').TranslationMeta; full?: boolean; acceptStubs?: boolean }} opts */
export function planLocaleTranslationWork(opts) {
  const {
    paths,
    sourceFingerprints,
    localeId,
    localeValues,
    meta,
    full = false,
    acceptStubs = false,
  } = opts;
  /** @type {number[]} */
  const indices = [];
  /** @type {string[]} */
  const reasons = [];

  if (!meta.locales[localeId]) meta.locales[localeId] = {};

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const enHash = sourceFingerprints[path];
    const recordedHash = meta.locales[localeId][path];
    const existing = localeValues[i];

    if (full) {
      indices.push(i);
      reasons.push('full');
      continue;
    }

    if (existing === undefined || existing === '') {
      indices.push(i);
      reasons.push('missing');
      continue;
    }

    if (!acceptStubs && isStubLocaleString(existing, localeId)) {
      indices.push(i);
      reasons.push('stub');
      continue;
    }

    if (!acceptStubs && hasMachineTranslationPlaceholderLeak(existing)) {
      indices.push(i);
      reasons.push('placeholder-leak');
      continue;
    }

    if (recordedHash === enHash) {
      const enValue = opts.enValues?.[i];
      if (
        typeof enValue === 'string' &&
        path.startsWith('wiki.') &&
        localeId !== 'en' &&
        hasEnglishPhraseCarryover(enValue, existing)
      ) {
        indices.push(i);
        reasons.push('stale');
        continue;
      }
      continue;
    }

    indices.push(i);
    reasons.push('stale');
  }

  return { indices, reasons };
}

/** Record one translated key and flush meta.source — call saveTranslationMeta after each batch or key. */
export function recordLocaleTranslationKey(meta, paths, sourceFingerprints, localeId, index) {
  const path = paths[index];
  if (!meta.locales[localeId]) meta.locales[localeId] = {};
  meta.locales[localeId][path] = sourceFingerprints[path];
  meta.source[path] = sourceFingerprints[path];
}

/** Record translated keys for one locale. Does not prune other locales — callers prune once at end. */
export function recordLocaleTranslations(meta, paths, sourceFingerprints, localeId, translatedIndices) {
  if (!meta.locales[localeId]) meta.locales[localeId] = {};
  for (const i of translatedIndices) {
    recordLocaleTranslationKey(meta, paths, sourceFingerprints, localeId, i);
  }
  for (const path of paths) {
    meta.source[path] = sourceFingerprints[path];
  }
}

/** @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta @param {string[]} activePaths @param {string[]} activeLocaleIds */
export function pruneTranslationMeta(meta, activePaths, activeLocaleIds) {
  const pathSet = new Set(activePaths);
  const localeSet = new Set(activeLocaleIds);

  for (const path of Object.keys(meta.source)) {
    if (!pathSet.has(path)) delete meta.source[path];
  }

  for (const localeId of Object.keys(meta.locales)) {
    if (!localeSet.has(localeId)) {
      delete meta.locales[localeId];
      continue;
    }
    for (const path of Object.keys(meta.locales[localeId])) {
      if (!pathSet.has(path)) delete meta.locales[localeId][path];
    }
  }
}

/** @param {string[]} paths @param {string[]} enValues @param {(string | undefined)[]} localeValues @param {number[]} workIndices @param {string[]} translatedStrings */
export function mergeTranslatedLocaleValues(
  paths,
  enValues,
  localeValues,
  workIndices,
  translatedStrings,
) {
  /** @type {string[]} */
  const merged = paths.map((_, i) => localeValues[i] ?? '');
  for (let j = 0; j < workIndices.length; j++) {
    merged[workIndices[j]] = translatedStrings[j];
  }
  return merged;
}

/** @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta @param {string[]} paths @param {Record<string, string>} sourceFingerprints @param {string[]} localeIds @param {Record<string, (string | undefined)[]>} localeValueMaps @param {{ enValues?: string[]; acceptStubs?: boolean }} [opts] */
export function summarizeTranslationPlan(
  meta,
  paths,
  sourceFingerprints,
  localeIds,
  localeValueMaps,
  opts = {},
) {
  /** @type {Record<string, { total: number; translate: number; skip: number }>} */
  const byLocale = {};
  let totalTranslate = 0;

  for (const localeId of localeIds) {
    const plan = planLocaleTranslationWork({
      paths,
      enValues: opts.enValues,
      sourceFingerprints,
      localeId,
      localeValues: localeValueMaps[localeId],
      meta,
      acceptStubs: opts.acceptStubs ?? false,
    });
    byLocale[localeId] = {
      total: paths.length,
      translate: plan.indices.length,
      skip: paths.length - plan.indices.length,
    };
    totalTranslate += plan.indices.length;
  }

  return { byLocale, totalTranslate };
}

/**
 * Trust on-disk locale strings missing from the ledger (e.g. after a partial translate run
 * that pruned other locales). Returns true when meta was updated.
 *
 * @param {import('./i18n-translation-meta.d.ts').TranslationMeta} meta
 * @param {string[]} paths
 * @param {Record<string, string>} sourceFingerprints
 * @param {string[]} localeIds
 * @param {Record<string, (string | undefined)[]>} localeValueMaps
 * @param {string[] | undefined} enValues
 */
export function repairLocaleMetaFromFiles(
  meta,
  paths,
  sourceFingerprints,
  localeIds,
  localeValueMaps,
  enValues,
) {
  let changed = false;
  for (const localeId of localeIds) {
    if (!meta.locales[localeId]) meta.locales[localeId] = {};
    const values = localeValueMaps[localeId] ?? [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (meta.locales[localeId][path]) continue;
      const existing = values[i];
      const enValue = enValues?.[i];
      if (existing === undefined || existing === '') continue;
      if (isStubLocaleString(existing, localeId)) continue;
      if (enValue !== undefined && existing === enValue) continue;
      meta.locales[localeId][path] = sourceFingerprints[path];
      changed = true;
    }
  }
  for (const path of paths) {
    meta.source[path] = sourceFingerprints[path];
  }
  return changed;
}
