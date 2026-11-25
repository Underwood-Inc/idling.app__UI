/**
 * Mappy adapter — incremental translate loop with meta + locale file persist.
 *
 * Canonical CLAD implementation: tools/incremental-l10n
 *   - Molecule: translateWorkIndices (batch + concurrency + per-key persist port)
 *   - Adapter: bindNodeStdoutProgress (Node terminal progress)
 *
 * Keep behaviour aligned until @__code/incremental-l10n is published and wired in.
 */
import { recordLocaleTranslations } from './i18n-translation-meta.mjs';

export const DEFAULT_KEYS_PER_BATCH = 5;
export const DEFAULT_TRANSLATE_CONCURRENCY = 10;
export const DEFAULT_TRANSLATE_CONCURRENCY_WIN32 = 6;
const PROGRESS_WIDTH = 118;

/** @param {number | undefined} parsed */
function clampConcurrency(parsed) {
  if (parsed == null || !Number.isFinite(parsed)) return null;
  return Math.max(1, Math.floor(parsed));
}

/** LibreTranslate + large locale JSON rewrites — lower default concurrency on Windows. */
export function resolveTranslateConcurrency(explicit) {
  const fromExplicit = clampConcurrency(explicit);
  if (fromExplicit != null) return fromExplicit;

  const fromEnv = clampConcurrency(Number(process.env.I18N_TRANSLATE_CONCURRENCY));
  if (fromEnv != null) return fromEnv;

  return process.platform === 'win32'
    ? DEFAULT_TRANSLATE_CONCURRENCY_WIN32
    : DEFAULT_TRANSLATE_CONCURRENCY;
}

/** @returns {(fn: () => void | Promise<void>) => Promise<void>} */
function createAsyncLock() {
  /** @type {Promise<void>} */
  let chain = Promise.resolve();
  return (fn) => {
    const run = chain.then(fn);
    chain = run.catch(() => {});
    return run;
  };
}

/** @param {number} slotCount */
export function createProgressRenderer(slotCount) {
  let initialized = false;
  /** @type {string[]} */
  const lines = Array.from({ length: slotCount }, () => '');
  /** @type {boolean[]} */
  const slotHasKeyDone = Array.from({ length: slotCount }, () => false);

  return {
    /** @param {number} slot @param {string} text @param {{ keyDone?: boolean }} [opts] */
    setLine(slot, text, opts = {}) {
      lines[slot] = text.slice(0, PROGRESS_WIDTH);
      if (opts.keyDone) slotHasKeyDone[slot] = true;
    },
    /**
     * In-flight batch fetch — only shown before the first key on this slot completes.
     * Later batches keep the last key-done line visible (no flicker back to batch text).
     */
    /** @param {number} slot @param {string} text */
    setBatchPending(slot, text) {
      if (slotHasKeyDone[slot]) return;
      lines[slot] = text.slice(0, PROGRESS_WIDTH);
    },
    flush() {
      if (initialized) {
        process.stdout.write(`\x1b[${slotCount}A`);
      }
      for (const line of lines) {
        process.stdout.write(`\r${line.padEnd(PROGRESS_WIDTH)}\n`);
      }
      initialized = true;
    },
    /** @param {string} summaryLine */
    finish(summaryLine) {
      if (initialized) {
        process.stdout.write(`\x1b[${slotCount}A`);
        for (let i = 0; i < slotCount - 1; i++) {
          process.stdout.write('\x1b[2K\r\n');
        }
        process.stdout.write(`\x1b[2K\r${summaryLine.slice(0, PROGRESS_WIDTH).padEnd(PROGRESS_WIDTH)}\n`);
        initialized = false;
        return;
      }
      process.stdout.write(`${summaryLine}\n`);
    },
  };
}

/** @param {number[]} indices @param {number} batchSize */
export function chunkIndices(indices, batchSize) {
  /** @type {number[][]} */
  const batches = [];
  for (let i = 0; i < indices.length; i += batchSize) {
    batches.push(indices.slice(i, i + batchSize));
  }
  return batches;
}

/** @param {string} localeId @param {number} total */
export function finishKeyProgressLine(localeId, total) {
  return `${localeId}: ${total}/${total} done`;
}

/**
 * @param {{
 *   localeId: string;
 *   paths: string[];
 *   enValues: string[];
 *   localeValues: (string | undefined)[];
 *   workIndices: number[];
 *   sourceFingerprints: Record<string, string>;
 *   meta: import('./i18n-translation-meta.d.ts').TranslationMeta;
 *   persistMeta: () => void;
 *   translateValues: (values: string[], localeId: string) => Promise<string[]>;
 *   persistLocaleValues: (localeValues: (string | undefined)[]) => void;
 *   keysPerBatch?: number;
 *   concurrency?: number;
 * }} opts
 */
export async function translateWorkIndicesIncremental(opts) {
  const {
    localeId,
    paths,
    enValues,
    localeValues,
    workIndices,
    sourceFingerprints,
    meta,
    persistMeta,
    translateValues,
    persistLocaleValues,
  } = opts;

  const keysPerBatch = Math.max(1, opts.keysPerBatch ?? DEFAULT_KEYS_PER_BATCH);
  const concurrency = resolveTranslateConcurrency(opts.concurrency);
  const total = workIndices.length;
  if (total === 0) return;

  const batches = chunkIndices(workIndices, keysPerBatch);
  const workerCount = Math.min(concurrency, batches.length);
  const progress = createProgressRenderer(workerCount);
  const withPersistLock = createAsyncLock();
  let nextBatch = 0;
  let done = 0;

  /** @param {number} slotId */
  async function worker(slotId) {
    while (true) {
      const batchIdx = nextBatch++;
      if (batchIdx >= batches.length) break;

      const batch = batches[batchIdx];
      const batchValues = batch.map((i) => enValues[i]);

      progress.setBatchPending(
        slotId,
        `${localeId} · slot ${slotId + 1}: batch ${batchIdx + 1}/${batches.length} (${batch.length} keys)…`,
      );
      progress.flush();

      const translatedBatch = await translateValues(batchValues, localeId);
      if (translatedBatch.length !== batch.length) {
        throw new Error(
          `Translator returned ${translatedBatch.length} strings for batch of ${batch.length}`,
        );
      }

      for (let j = 0; j < batch.length; j++) {
        localeValues[batch[j]] = translatedBatch[j];
      }

      // One disk write per batch (not per key) — avoids multi‑MB JSON rewrites blocking all workers.
      await withPersistLock(async () => {
        recordLocaleTranslations(meta, paths, sourceFingerprints, localeId, batch);
        persistLocaleValues(localeValues);
        persistMeta();
        done += batch.length;
      });

      const lastIndex = batch[batch.length - 1];
      progress.setLine(
        slotId,
        `${localeId} · slot ${slotId + 1}: ${done}/${total} (batch ${batchIdx + 1}/${batches.length}) ${paths[lastIndex]}`,
        { keyDone: true },
      );
      progress.flush();
    }
  }

  await Promise.all(Array.from({ length: workerCount }, (_, slotId) => worker(slotId)));
  progress.finish(finishKeyProgressLine(localeId, total));
}
