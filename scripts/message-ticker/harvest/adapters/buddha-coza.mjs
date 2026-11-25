export async function harvestBuddhaCoza({ attempts = 40 } = {}) {
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch('https://buddha.co.za/api/discourse/random', {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
      const text = data?.content?.trim();
      const discourse = data?.discourse;
      if (!text || !discourse) {
        continue;
      }
      if (seen.has(text)) {
        continue;
      }
      seen.add(text);
      rows.push({
        text,
        author: 'The Buddha',
        sourceTitle: 'Pali Canon',
        sourceLocator: discourse,
        provenanceProvider: 'buddha-coza',
        provenanceExternalId: discourse,
      });
    } catch {
      /* skip */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return rows;
}