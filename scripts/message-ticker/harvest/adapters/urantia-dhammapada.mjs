const BASE = 'https://api.urantia.dev/scriptures/dhammapada';

async function fetchVerse(n) {
  const res = await fetch(`${BASE}/${n}`, { signal: AbortSignal.timeout(15000) });
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
}

export async function harvestUrantiaDhammapada() {
  const rows = [];
  const maxVerse = 414;
  const concurrency = 12;
  const bucket = Array.from({ length: maxVerse }, (_, i) => i + 1);
  for (let i = 0; i < bucket.length; i += concurrency) {
    const chunk = bucket.slice(i, i + concurrency);
    const batch = await Promise.all(chunk.map((n) => fetchVerse(n)));
    for (const row of batch) {
      if (row) {
        rows.push(row);
      }
    }
  }
  return rows;
}