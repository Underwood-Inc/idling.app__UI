const ALLOW = /buddha|dogen|thich|nhat hanh|dalai|suzuki|ayya|bodhi|pali/i;

async function fetchRandom() {
  const res = await fetch('https://zenquotes.io/api/random', {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'idling.app-harvest/1.0' },
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const quote = Array.isArray(data) ? data[0] : data;
  if (!quote?.q || !quote?.a) {
    return null;
  }
  if (!ALLOW.test(quote.a)) {
    return null;
  }
  return {
    text: quote.q,
    author: quote.a,
    sourceTitle: 'ZenQuotes',
    sourceLocator: quote.h ?? undefined,
    provenanceProvider: 'zenquotes-filtered',
    provenanceExternalId: quote.h,
  };
}

export async function harvestZenQuotesFiltered({ attempts = 120 } = {}) {
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < attempts; i += 1) {
    const row = await fetchRandom();
    if (row && !seen.has(row.text)) {
      seen.add(row.text);
      rows.push(row);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return rows;
}