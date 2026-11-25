/** Flatten / unflatten locale JSON trees and read leaf values by dot-path. */

/** @param {string} seg */
function isArrayIndex(seg) {
  return /^\d+$/.test(seg);
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ paths: string[]; values: string[] }} acc
 */
function visitFlatten(value, path, acc) {
  if (typeof value === 'string') {
    if (!path) return;
    acc.paths.push(path);
    acc.values.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      visitFlatten(value[i], `${path}.${i}`, acc);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visitFlatten(child, path ? `${path}.${key}` : key, acc);
    }
  }
}

/** @param {Record<string, unknown>} node @param {string} [prefix] */
export function flattenLeaves(node, prefix = '') {
  /** @type {{ paths: string[]; values: string[] }} */
  const acc = { paths: [], values: [] };
  if (prefix) {
    visitFlatten(node, prefix, acc);
  } else {
    visitFlatten(node, '', acc);
  }
  return acc;
}

/**
 * @param {Record<string, unknown> | unknown[]} parent
 * @param {string[]} parts
 * @param {string} value
 */
function setAtPath(parent, parts, value) {
  let cur = parent;
  for (let j = 0; j < parts.length - 1; j++) {
    const seg = parts[j];
    const nextSeg = parts[j + 1];
    const nextIsIndex = isArrayIndex(nextSeg);

    if (Array.isArray(cur) && isArrayIndex(seg)) {
      const idx = Number(seg);
      while (cur.length <= idx) cur.push(undefined);
      if (cur[idx] == null || typeof cur[idx] !== 'object') {
        cur[idx] = nextIsIndex ? [] : {};
      }
      cur = /** @type {Record<string, unknown> | unknown[]} */ (cur[idx]);
    } else if (cur && typeof cur === 'object') {
      /** @type {Record<string, unknown>} */
      const obj = /** @type {Record<string, unknown>} */ (cur);
      if (!(seg in obj) || obj[seg] == null || typeof obj[seg] !== 'object') {
        obj[seg] = nextIsIndex ? [] : {};
      }
      cur = /** @type {Record<string, unknown> | unknown[]} */ (obj[seg]);
    }
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(cur) && isArrayIndex(last)) {
    const idx = Number(last);
    while (cur.length <= idx) cur.push(undefined);
    cur[idx] = value;
    return;
  }
  if (cur && typeof cur === 'object') {
    /** @type {Record<string, unknown>} */ (cur)[last] = value;
  }
}

/** @param {string[]} paths @param {string[]} values */
export function unflattenLeaves(paths, values) {
  /** @type {Record<string, unknown>} */
  const root = {};
  for (let i = 0; i < paths.length; i++) {
    setAtPath(root, paths[i].split('.'), values[i]);
  }
  return root;
}

/**
 * Patch string leaves onto an existing locale tree (used by incremental translate).
 * Skips undefined entries so JSON.stringify does not drop sibling keys as `{}`.
 * @param {Record<string, unknown>} tree
 * @param {string[]} paths
 * @param {(string | undefined)[]} values
 */
export function applyLeafPathsToTree(tree, paths, values) {
  for (let i = 0; i < paths.length; i++) {
    const value = values[i];
    if (typeof value === 'string') {
      setAtPath(tree, paths[i].split('.'), value);
    }
  }
  return tree;
}

/**
 * typesafe-i18n models fixed-length string lists as `{ "0": "…", "1": "…" }`, not JSON arrays.
 * @param {unknown} value
 */
/** @param {unknown} value */
function isIndexedObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
}

/**
 * Inverse of typesafe-i18n list normalization: `{ "0": "a", "1": "b" }` → `["a","b"]`.
 * Recurses into section trees (e.g. site landing `sections[].features[]`).
 * @param {unknown} value
 */
export function restoreIndexedObjectsToArrays(value) {
  if (Array.isArray(value)) {
    return value.map(restoreIndexedObjectsToArrays);
  }
  if (isIndexedObject(value)) {
    const keys = Object.keys(value).sort((a, b) => Number(a) - Number(b));
    return keys.map((key) =>
      restoreIndexedObjectsToArrays(/** @type {Record<string, unknown>} */ (value)[key]),
    );
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, restoreIndexedObjectsToArrays(child)]),
    );
  }
  return value;
}

export function normalizeLocaleTreeForTypesafeI18n(value) {
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((item) => typeof item === 'string')) {
      return Object.fromEntries(value.map((item, index) => [String(index), item]));
    }
    if (value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
      return Object.fromEntries(
        value.map((item, index) => [String(index), normalizeLocaleTreeForTypesafeI18n(item)]),
      );
    }
    return value.map(normalizeLocaleTreeForTypesafeI18n);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeLocaleTreeForTypesafeI18n(child)]),
    );
  }
  return value;
}

/** @param {Record<string, unknown>} tree @param {string} dotPath */
export function getLeafString(tree, dotPath) {
  const parts = dotPath.split('.');
  let cur = /** @type {unknown} */ (tree);
  for (const seg of parts) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && isArrayIndex(seg)) {
      cur = cur[Number(seg)];
      continue;
    }
    if (typeof cur === 'object') {
      cur = /** @type {Record<string, unknown>} */ (cur)[seg];
      continue;
    }
    return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

/** @param {string[]} paths @param {Record<string, unknown>} tree */
export function valuesForPaths(paths, tree) {
  return paths.map((path) => getLeafString(tree, path));
}

/** @param {string | undefined} value @param {string} localeId */
export function isStubLocaleString(value, localeId) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return value.startsWith(`[${localeId}] `);
}

const MT_PLACEHOLDER_LEAK_RE =
  /__PH_\d+__|__HTML_\d+__|__URL_\d+__|__LINKDEST_\d+__|__FMT_\d+__|\sPH\s+\d+\s/i;

/** Untranslated MT protection tokens — must re-translate through the normal pipeline. */
export function hasMachineTranslationPlaceholderLeak(value) {
  return typeof value === 'string' && MT_PLACEHOLDER_LEAK_RE.test(value);
}

/**
 * English source phrase still present in locale output (partial MT).
 * @param {string} enValue
 * @param {string} localeValue
 */
export function hasEnglishPhraseCarryover(enValue, localeValue) {
  if (typeof enValue !== 'string' || typeof localeValue !== 'string') return false;
  const phrases = enValue.match(/[A-Za-z][A-Za-z''\- ]{4,}[A-Za-z]/g) ?? [];
  for (const phrase of phrases) {
    const trimmed = phrase.trim();
    if (trimmed.length < 6) continue;
    if (
      /^(mappy|windows|setup|rowan|github|readme|smartscreen|official|marker|install|start|menu|file|quick|demo|realm|packs?|nsis)$/i.test(
        trimmed,
      )
    ) {
      continue;
    }
    if (localeValue.includes(trimmed)) return true;
  }
  return false;
}

/** @param {unknown} value */
function isStringLeafTree(value) {
  if (typeof value === 'string') return true;
  if (Array.isArray(value) || value == null || typeof value !== 'object') return false;
  return Object.values(value).every(isStringLeafTree);
}

/**
 * Add missing string leaves from base without removing existing locale copy.
 * @param {Record<string, unknown>} base
 * @param {unknown} locale
 */
function mergeStringLeafMapFromBase(base, locale) {
  const localeObj =
    locale && typeof locale === 'object' && !Array.isArray(locale)
      ? /** @type {Record<string, unknown>} */ ({ ...locale })
      : {};
  for (const [key, baseChild] of Object.entries(base)) {
    if (typeof baseChild === 'string') {
      if (!(key in localeObj) || localeObj[key] === '') localeObj[key] = baseChild;
      continue;
    }
    if (baseChild && typeof baseChild === 'object' && !Array.isArray(baseChild)) {
      localeObj[key] = mergeStringLeafMapFromBase(
        /** @type {Record<string, unknown>} */ (baseChild),
        localeObj[key],
      );
    }
  }
  return localeObj;
}

/**
 * Remove keys from `locale` that are not present in `base` (deep).
 * Orphans accumulate when keys are deleted from `en.json` — this keeps translated files in sync.
 * @param {unknown} base
 * @param {unknown} locale
 */
function localeChildAsArray(localeChild) {
  if (Array.isArray(localeChild)) return localeChild;
  if (localeChild && typeof localeChild === 'object') {
    const restored = restoreIndexedObjectsToArrays(localeChild);
    return Array.isArray(restored) ? restored : [];
  }
  return [];
}

export function pruneOrphanKeys(base, locale) {
  if (Array.isArray(base)) {
    const localeArr = localeChildAsArray(locale);
    return base.map((baseChild, index) => pruneOrphanKeys(baseChild, localeArr[index]));
  }
  if (!base || typeof base !== 'object') return locale;
  if (!locale || typeof locale !== 'object' || Array.isArray(locale)) return locale;
  /** @type {Record<string, unknown>} */
  const baseObj = /** @type {Record<string, unknown>} */ (base);
  /** @type {Record<string, unknown>} */
  const localeObj = /** @type {Record<string, unknown>} */ (locale);
  /** @type {Record<string, unknown>} */
  const result = {};
  for (const key of Object.keys(baseObj)) {
    if (!(key in localeObj)) continue;
    const baseChild = baseObj[key];
    const localeChild = localeObj[key];
    if (baseChild && typeof baseChild === 'object') {
      result[key] = pruneOrphanKeys(baseChild, localeChild);
    } else {
      result[key] = localeChild;
    }
  }
  return result;
}

/**
 * Copy missing empty arrays from the base locale (e.g. `bullets: []`) into sibling locales.
 * Empty string-only maps left as `{}` (e.g. new `categories` keys) are filled from base until
 * machine translation runs. String leaves and non-empty arrays are never overwritten.
 * @param {unknown} base
 * @param {unknown} locale
 */
export function backfillEmptyArraysFromBase(base, locale) {
  if (Array.isArray(base)) {
    const localeArr = localeChildAsArray(locale);
    return base.map((baseChild, index) => backfillEmptyArraysFromBase(baseChild, localeArr[index]));
  }
  if (base && typeof base === 'object') {
    const localeObj =
      locale && typeof locale === 'object' && !Array.isArray(locale)
        ? /** @type {Record<string, unknown>} */ ({ ...locale })
        : {};
    for (const [key, baseChild] of Object.entries(base)) {
      if (typeof baseChild === 'string') {
        if (!(key in localeObj) || localeObj[key] === '') localeObj[key] = baseChild;
        continue;
      }
      if (typeof baseChild === 'boolean' || typeof baseChild === 'number') {
        if (!(key in localeObj)) localeObj[key] = baseChild;
        continue;
      }
      if (Array.isArray(baseChild) && baseChild.length === 0) {
        if (!(key in localeObj)) localeObj[key] = [];
      } else if (baseChild && typeof baseChild === 'object' && !Array.isArray(baseChild)) {
        const localeChild = localeObj[key];
        if (isStringLeafTree(baseChild)) {
          localeObj[key] = mergeStringLeafMapFromBase(
            /** @type {Record<string, unknown>} */ (baseChild),
            localeChild,
          );
        } else {
          localeObj[key] = backfillEmptyArraysFromBase(baseChild, localeChild);
        }
      }
    }
    return localeObj;
  }
  return locale;
}
