#!/usr/bin/env node
/**
 * Bulk scrape Buddhist attributed quotes → validated corpus (no runtime UI).
 * Run: pnpm quotes:harvest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateQuoteForRetention, quoteTextHash } from './harvest/validateQuote.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'src', 'data', 'quotes', 'corpus.en.json');
const REPORT = path.join(ROOT, 'scripts', 'message-ticker', 'harvest-report.json');

async function fetchUrantiaDhammapada() {
  const rows = [];
  const concurrency = 16;
  for (let start = 1; start <= 414; start += concurrency) {
    const chunk = [];
    for (let n = start; n < start + concurrency && n <= 414; n += 1) {
      chunk.push(n);
    }
    const batch = await Promise.all(
      chunk.map(async (n) => {
        try {
          const res = await fetch(
            `https://api.urantia.dev/scriptures/dhammapada/${n}`,
            { signal: AbortSignal.timeout(20000) }
          );
          if (!res.ok) {
            return null;
          }
          const body = await res.json();
          const passage = body?.data?.passages?.[0];
          if (!passage?.text) {
            return null;
          }
          return {
            text: passage.text,
            author: 'The Buddha',
            sourceTitle: 'The Dhammapada',
            sourceLocator: passage.ref ?? `Dhp ${n}`,
            sourceUrl: `https://api.urantia.dev/scriptures/dhammapada/${n}`,
            rights: 'public-domain',
            provenanceProvider: 'urantia-dhammapada',
            provenanceExternalId: String(n),
          };
        } catch {
          return null;
        }
      })
    );
    for (const row of batch) {
      if (row) {
        rows.push(row);
      }
    }
    process.stdout.write(`\r[urantia] ${Math.min(start + concurrency - 1, 414)}/414`);
  }
  process.stdout.write('\n');
  return rows;
}

async function fetchQuotableDataset() {
  const [quotesRes, authorsRes] = await Promise.all([
    fetch(
      'https://raw.githubusercontent.com/quotable-io/data/master/data/quotes.json',
      { signal: AbortSignal.timeout(120000) }
    ),
    fetch(
      'https://raw.githubusercontent.com/quotable-io/data/master/data/authors.json',
      { signal: AbortSignal.timeout(120000) }
    ),
  ]);
  if (!quotesRes.ok) {
    throw new Error(`Quotable quotes.json HTTP ${quotesRes.status}`);
  }
  const quotes = await quotesRes.json();
  const authorNameById = new Map();
  if (authorsRes.ok) {
    const authors = await authorsRes.json();
    for (const row of authors) {
      authorNameById.set(row._id, row.name);
    }
  }

  const buddhistAuthor = /buddha|dogen|thich nhat hanh|dalai|suzuki|nāgārjuna|nagarjuna|bodhidharma|shan|ayya|rumi/i;

  const rows = [];
  for (const item of quotes) {
    const author =
      item.author ??
      authorNameById.get(item.authorId) ??
      authorNameById.get(item.authorId?.$oid) ??
      '';
    const tags = (item.tags ?? []).map((t) => String(t).toLowerCase());
    const tagJoined = tags.join(' ');
    const isRelevant =
      buddhistAuthor.test(author) ||
      tags.includes('buddhism') ||
      tagJoined.includes('buddhist');
    if (!isRelevant || !item.content) {
      continue;
    }
    rows.push({
      text: item.content,
      author: author || 'The Buddha',
      sourceTitle: 'Quotable open dataset',
      sourceLocator: item._id,
      attribution: `${author || 'The Buddha'}, Quotable`,
      provenanceProvider: 'quotable-github-data',
      provenanceExternalId: item._id,
    });
  }
  return rows;
}

async function fetchLovingUniverseBuddhist() {
  const buddhistAuthor =
    /buddha|dogen|thich nhat hanh|dalai|suzuki|bodhi|nagarjuna|nāgārjuna/i;
  const rows = [];
  let offset = 0;
  const totalCap = 500;
  while (offset < totalCap) {
    const url = new URL('https://api.loving-universe.com/quotes');
    url.searchParams.set('limit', '50');
    if (offset > 0) {
      url.searchParams.set('offset', String(offset));
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      break;
    }
    const page = await res.json();
    const data = page.data ?? [];
    for (const item of data) {
      if (item.verification === 'misattributed') {
        continue;
      }
      const authorName = item.author?.name ?? '';
      if (!buddhistAuthor.test(authorName)) {
        continue;
      }
      rows.push({
        text: item.text,
        author: authorName,
        sourceTitle: item.source?.title ?? 'Collected teachings',
        sourceLocator: item.source?.locator,
        sourceUrl: item.source?.url ?? item.url,
        attribution: item.attribution,
        rights: item.rights,
        verification: item.verification,
        provenanceProvider: 'loving-universe',
        provenanceExternalId: item.id,
      });
    }
    if (!data.length) {
      break;
    }
    offset += data.length;
    if (offset >= (page.total ?? offset)) {
      break;
    }
  }
  return rows;
}

async function fetchBuddhaApiRandom(attempts = 250) {
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch('https://buddha-api.com/api/random', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
      if (!data?.text || !data?.byName || seen.has(data.text)) {
        continue;
      }
      seen.add(data.text);
      rows.push({
        text: data.text,
        author: data.byName,
        sourceTitle: 'Buddha Quotes API',
        sourceLocator: data.id,
        provenanceProvider: 'buddha-api',
        provenanceExternalId: data.id,
      });
    } catch {
      /* skip */
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return rows;
}

const SOURCES = [
  { id: 'urantia-dhammapada', run: fetchUrantiaDhammapada },
  { id: 'quotable-github-data', run: fetchQuotableDataset },
  { id: 'loving-universe', run: fetchLovingUniverseBuddhist },
  { id: 'buddha-api', run: () => fetchBuddhaApiRandom(300) },
];

async function main() {
  const byHash = new Map();
  const report = {
    sources: {},
    totalAccepted: 0,
    generatedAt: new Date().toISOString(),
  };

  for (const source of SOURCES) {
    console.log(`[harvest] ${source.id}…`);
    const stats = {
      status: 'ok',
      fetched: 0,
      accepted: 0,
      rejected: {},
      duplicate: 0,
      error: null,
    };
    try {
      const rawRows = await source.run();
      stats.fetched = rawRows.length;
      for (const raw of rawRows) {
        const result = validateQuoteForRetention(raw);
        if (!result.ok) {
          stats.rejected[result.reason] =
            (stats.rejected[result.reason] ?? 0) + 1;
          continue;
        }
        const hash = result.record.textHash;
        if (byHash.has(hash)) {
          stats.duplicate += 1;
          continue;
        }
        byHash.set(hash, result.record);
        stats.accepted += 1;
      }
    } catch (error) {
      stats.status = 'failed';
      stats.error = error instanceof Error ? error.message : String(error);
    }
    report.sources[source.id] = stats;
    console.log(
      `  → fetched ${stats.fetched}, kept ${stats.accepted}, dupes ${stats.duplicate}`
    );
  }

  const records = [...byHash.values()].sort((a, b) => a.id.localeCompare(b.id));
  report.totalAccepted = records.length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    `${JSON.stringify({ locale: 'en', quotes: records }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${records.length} quotes → ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});