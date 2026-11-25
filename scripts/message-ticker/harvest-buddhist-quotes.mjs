#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateQuoteForRetention, quoteTextHash } from './harvest/validateQuote.mjs';
import { harvestUrantiaDhammapada } from './harvest/adapters/urantia-dhammapada.mjs';
import { harvestLovingUniverse } from './harvest/adapters/loving-universe.mjs';
import { harvestQuotable } from './harvest/adapters/quotable.mjs';
import { harvestQuotableGithubData } from './harvest/adapters/quotable-github-data.mjs';
import { harvestZenQuotesFiltered } from './harvest/adapters/zenquotes-filtered.mjs';
import { harvestBuddhaApi } from './harvest/adapters/buddha-api.mjs';
import { harvestPalicanonDhp } from './harvest/adapters/palicanon-dhp.mjs';
import { harvestBuddhaCoza } from './harvest/adapters/buddha-coza.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'src', 'data', 'quotes', 'corpus.en.json');
const REPORT = path.join(ROOT, 'scripts', 'message-ticker', 'harvest-report.json');

const ADAPTERS = [
  { id: 'urantia-dhammapada', run: harvestUrantiaDhammapada },
  { id: 'loving-universe', run: harvestLovingUniverse },
  { id: 'quotable', run: harvestQuotable },
  { id: 'quotable-github-data', run: harvestQuotableGithubData },
  { id: 'zenquotes-filtered', run: () => harvestZenQuotesFiltered({ attempts: 40 }) },
  { id: 'buddha-api', run: () => harvestBuddhaApi({ attempts: 30 }) },
  { id: 'palicanon-dhp', run: () => harvestPalicanonDhp({ maxChapter: 26, maxVerse: 12 }) },
  { id: 'buddha-coza', run: () => harvestBuddhaCoza({ attempts: 60 }) },
];

const fastMode = process.argv.includes('--fast');

async function main() {
  const byHash = new Map();
  const report = { adapters: {}, totalAccepted: 0, generatedAt: new Date().toISOString() };

  const activeAdapters = fastMode
    ? ADAPTERS.filter((row) =>
        ['urantia-dhammapada', 'quotable', 'loving-universe'].includes(row.id)
      )
    : ADAPTERS;

  for (const adapter of activeAdapters) {
    console.log(`[quotes:harvest] ${adapter.id}…`);
    const stats = {
      status: 'ok',
      fetched: 0,
      accepted: 0,
      rejected: {},
      duplicate: 0,
      error: null,
    };
    try {
      const rawRows = await adapter.run();
      stats.fetched = rawRows.length;
      for (const raw of rawRows) {
        const result = validateQuoteForRetention({
          ...raw,
          provenanceProvider: raw.provenanceProvider ?? adapter.id,
        });
        if (!result.ok) {
          stats.rejected[result.reason] = (stats.rejected[result.reason] ?? 0) + 1;
          continue;
        }
        const hash = result.record.textHash ?? quoteTextHash(result.record.text);
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
    report.adapters[adapter.id] = stats;
  }

  const records = [...byHash.values()].sort((a, b) => a.id.localeCompare(b.id));
  report.totalAccepted = records.length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({ locale: 'en', quotes: records }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Harvest complete: ${records.length} quotes → ${OUT}`);
  console.log(`Report → ${REPORT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});