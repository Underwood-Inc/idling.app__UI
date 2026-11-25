const BASE = 'https://api.loving-universe.com';
const AUTHORS = ['buddha', 'thich-nhat-hanh', 'dogen'];

async function fetchPage(author, offset = 0) {
  const url = new URL(`${BASE}/quotes`);
  url.searchParams.set('author', author);
  url.searchParams.set('limit', '50');
  if (offset > 0) {
    url.searchParams.set('offset', String(offset));
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    return { data: [], total: 0 };
  }
  return res.json();
}

export async function harvestLovingUniverse() {
  const rows = [];
  for (const authorSlug of AUTHORS) {
    let offset = 0;
    let total = Infinity;
    while (offset < total) {
      const page = await fetchPage(authorSlug, offset);
      const data = page.data ?? [];
      total = page.total ?? data.length;
      for (const item of data) {
        if (item.verification === 'misattributed') {
          continue;
        }
        rows.push({
          text: item.text,
          author: item.author?.name ?? 'Unknown',
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
      offset += data.length;
      if (!data.length) {
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return rows;
}