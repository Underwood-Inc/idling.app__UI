export async function harvestBuddhaApi({ attempts = 80 } = {}) {
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch('https://buddha-api.com/api/random', {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
      if (!data?.text || !data?.byName) {
        continue;
      }
      if (seen.has(data.text)) {
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
    await new Promise((r) => setTimeout(r, 300));
  }
  return rows;
}