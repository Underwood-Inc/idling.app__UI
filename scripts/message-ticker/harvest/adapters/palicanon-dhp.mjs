const BASE = 'https://palicanon.codebuckets.com.au/api';

async function fetchSuttaVerse(chapter, verse) {
  const res = await fetch(`${BASE}/sutta/dhp/${chapter}/${verse}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const text = data?.text ?? data?.verse ?? data?.content;
  if (!text) {
    return null;
  }
  return {
    text: String(text).trim(),
    author: 'The Buddha',
    sourceTitle: 'Dhammapada (Pali Canon API)',
    sourceLocator: `dhp ${chapter}:${verse}`,
    provenanceProvider: 'palicanon-dhp',
    provenanceExternalId: `dhp-${chapter}-${verse}`,
  };
}

export async function harvestPalicanonDhp({ maxChapter = 26, maxVerse = 20 } = {}) {
  const rows = [];
  for (let chapter = 1; chapter <= maxChapter; chapter += 1) {
    for (let verse = 1; verse <= maxVerse; verse += 1) {
      const row = await fetchSuttaVerse(chapter, verse);
      if (row) {
        rows.push(row);
      }
      await new Promise((r) => setTimeout(r, 80));
    }
  }
  return rows;
}