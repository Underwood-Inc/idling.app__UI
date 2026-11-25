/**
 * Shared LibreTranslate batch helpers (used by UI i18n + game-data translation).
 */
import { protectForMachineTranslation, restoreFromMachineTranslation } from './i18n-placeholders.mjs';

export const LIBRE_BATCH_SIZE = 40;
export const LIBRE_BATCH_DELAY_MS = 250;
export const LIBRE_FETCH_TIMEOUT_MS = 180_000;
export const LIBRE_MAX_RATE_LIMIT_RETRIES = 12;

export const LIBRE_TARGET_FROM_EN = {
  zh: 'zh-Hans',
};

/** @param {string} mappyLocaleId */
export function libreTargetFor(mappyLocaleId) {
  return LIBRE_TARGET_FROM_EN[mappyLocaleId] ?? mappyLocaleId;
}

export function dockerLoadOnlyLanguages() {
  return 'en,es,zh,fr,de,ja,pt,ru,ko,it,ar';
}

export function dockerRecreateHelp() {
  const langs = dockerLoadOnlyLanguages();
  return (
    'Recreate the container so all Mappy languages are loaded (first start downloads models):\n\n' +
    '  docker stop mappy-libretranslate 2>nul & docker rm mappy-libretranslate 2>nul\n' +
    `  docker run -d --name mappy-libretranslate -p 5000:5000 libretranslate/libretranslate --load-only ${langs}\n\n` +
    'Wait until http://localhost:5000 responds, then re-run the translate script.\n' +
    'Do NOT omit --load-only — the default image only ships a small language subset.'
  );
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string[]} texts
 * @param {string} targetLocale LibreTranslate target code
 * @param {{ url: string; apiKey?: string }} config
 */
/**
 * @param {string[]} texts
 * @param {string} targetLocale
 * @param {{ url: string; apiKey?: string }} config
 * @param {number} [rateLimitAttempt]
 */
async function translateBatch(texts, targetLocale, config, rateLimitAttempt = 0) {
  /** @type {Record<string, unknown>} */
  const body = {
    q: texts,
    source: 'en',
    target: targetLocale,
    format: 'text',
  };
  if (config.apiKey) body.api_key = config.apiKey;

  const fetchTimeoutMs = config.fetchTimeoutMs ?? LIBRE_FETCH_TIMEOUT_MS;

  const res = await fetch(`${config.url}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });

  if (res.status === 429) {
    if (rateLimitAttempt >= LIBRE_MAX_RATE_LIMIT_RETRIES) {
      throw new Error(
        `LibreTranslate rate-limited (${LIBRE_MAX_RATE_LIMIT_RETRIES} retries) at ${config.url}/translate`,
      );
    }
    await sleep(2000 * (rateLimitAttempt + 1));
    return translateBatch(texts, targetLocale, config, rateLimitAttempt + 1);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `LibreTranslate ${res.status} at ${config.url}/translate: ${errText}\n` +
        'Is the server running? See docs/i18n.md § Machine translation.',
    );
  }

  const json = await res.json();
  const out = json.translatedText;
  if (Array.isArray(out)) return out;
  if (typeof out === 'string') return [out];
  throw new Error('Unexpected LibreTranslate response shape');
}

/**
 * @param {string[]} values
 * @param {string} targetLocale Mappy locale id
 * @param {{ url: string; apiKey?: string; batchSize?: number; batchDelayMs?: number }} config
 */
export async function translateAllStrings(values, targetLocale, config) {
  const batchSize = config.batchSize ?? LIBRE_BATCH_SIZE;
  const batchDelayMs = config.batchDelayMs ?? LIBRE_BATCH_DELAY_MS;
  const libreTarget = libreTargetFor(targetLocale);

  /** @type {string[]} */
  const protectedValues = [];
  /** @type {{ placeholderTokens: string[]; placeholderSpacing: { lead: boolean; trail: boolean }[]; htmlTokens: string[]; urlTokens: string[]; fmtTokens: string[]; linkDestTokens: string[] }[]} */
  const tokenLists = [];

  for (const value of values) {
    if (!value.trim()) {
      protectedValues.push(value);
      tokenLists.push({
        placeholderTokens: [],
        placeholderSpacing: [],
        htmlTokens: [],
        urlTokens: [],
        fmtTokens: [],
        linkDestTokens: [],
      });
      continue;
    }
    const {
      protectedText,
      placeholderTokens,
      placeholderSpacing,
      htmlTokens,
      urlTokens,
      fmtTokens,
      linkDestTokens,
    } = protectForMachineTranslation(value);
    protectedValues.push(protectedText);
    tokenLists.push({ placeholderTokens, placeholderSpacing, htmlTokens, urlTokens, fmtTokens, linkDestTokens });
  }

  /** @type {string[]} */
  const translated = [];

  for (let i = 0; i < protectedValues.length; i += batchSize) {
    const batch = protectedValues.slice(i, i + batchSize);
    const needsTranslation = batch.some((s) => s.trim().length > 0);
    if (!needsTranslation) {
      translated.push(...batch);
      continue;
    }

    const batchOut = await translateBatch(batch, libreTarget, config);
    if (batchOut.length !== batch.length) {
      throw new Error(
        `LibreTranslate returned ${batchOut.length} strings for batch of ${batch.length}`,
      );
    }
    translated.push(...batchOut);

    if (i + batchSize < protectedValues.length) {
      await sleep(batchDelayMs);
    }
  }

  return translated.map((text, idx) => {
    const { placeholderTokens, placeholderSpacing, htmlTokens, urlTokens, fmtTokens, linkDestTokens } =
      tokenLists[idx];
    return restoreFromMachineTranslation(
      text,
      placeholderTokens,
      htmlTokens,
      urlTokens,
      fmtTokens,
      linkDestTokens,
      placeholderSpacing,
    );
  });
}

/**
 * @param {string[]} targetLocales Mappy locale ids (excluding en)
 * @param {{ url: string; apiKey?: string }} config
 */
export async function assertLibreTranslateReachable(targetLocales, config) {
  try {
    const res = await fetch(`${config.url}/languages`).catch(() => null);
    if (!res?.ok) {
      throw new Error(`Cannot reach LibreTranslate at ${config.url} (GET /languages failed).`);
    }
    const langs = await res.json();
    const en = langs.find((l) => l.code === 'en');
    const targets = en?.targets ?? [];
    const targetSet = new Set(targets);

    const missing = targetLocales
      .map((id) => ({ id, libre: libreTargetFor(id) }))
      .filter(({ libre }) => !targetSet.has(libre));

    if (missing.length > 0) {
      const lines = missing.map(({ id, libre }) => `  - ${id} (LibreTranslate target: ${libre})`).join('\n');
      throw new Error(
        `LibreTranslate at ${config.url} cannot translate en → your Mappy locales:\n${lines}\n\n` +
          `Currently loaded en targets: ${targets.join(', ') || '(none)'}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${message}\n\n${dockerRecreateHelp()}`, { cause: err });
  }
}
