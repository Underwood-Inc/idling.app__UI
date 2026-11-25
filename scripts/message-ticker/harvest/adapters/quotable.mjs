const BASE = 'https://api.quotable.io';

async function fetchQuotesPage(page) {
  const url = new URL(`${BASE}/quotes`);
  url.searchParams.set('author', 'The Buddha');
  url.searchParams.set('limit', '150');
  url.searchParams.set('page', String(page));
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    return { results: [], totalPages: 0 };
  }
  const body = await res.json();
  return {
    results: body.results ?? [],
    totalPages: body.totalPages ?? 1,
  };
}

export async function harvestQuotable() {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const { results, totalPages: tp } = await fetchQuotesPage(page);
    totalPages = tp;
    for (const item of results) {
      rows.push({
        text: item.content,
        author: item.author ?? 'The Buddha',
        sourceTitle: 'Quotable verified Buddha sayings',
        sourceLocator: item._id,
        attribution: `${item.author}, Quotable`,
        provenanceProvider: 'quotable',
        provenanceExternalId: item._id,
      });
    }
    page += 1;
    await new Promise((r) => setTimeout(r, 400));
  }
  return rows;
}