const QUOTES_URL =
  'https://raw.githubusercontent.com/quotable-io/data/master/data/quotes.json';
const AUTHORS_URL =
  'https://raw.githubusercontent.com/quotable-io/data/master/data/authors.json';

export async function harvestQuotableGithubData() {
  const [quotesRes, authorsRes] = await Promise.all([
    fetch(QUOTES_URL, { signal: AbortSignal.timeout(120000) }),
    fetch(AUTHORS_URL, { signal: AbortSignal.timeout(120000) }),
  ]);
  if (!quotesRes.ok) {
    throw new Error(`quotable-github-data quotes fetch failed (${quotesRes.status})`);
  }
  const quotes = await quotesRes.json();
  const authorsById = new Map();
  if (authorsRes.ok) {
    const authors = await authorsRes.json();
    for (const author of authors) {
      authorsById.set(author._id, author.name);
    }
  }
  const rows = [];
  for (const item of quotes) {
    const author =
      item.author ??
      authorsById.get(item.authorId) ??
      authorsById.get(item.authorId?.$oid) ??
      '';
    const tags = (item.tags ?? []).join(' ').toLowerCase();
    const isBuddhist =
      /buddha|dogen|thich nhat hanh|dalai|suzuki|bodhi|pali|nāgārjuna|nagarjuna/i.test(author) ||
      tags.includes('buddhism') ||
      tags.includes('buddhist') ||
      tags.includes('wisdom') ||
      tags.includes('zen');
    if (!isBuddhist) {
      continue;
    }
    rows.push({
      text: item.content,
      author: author || 'The Buddha',
      sourceTitle: 'Quotable open dataset',
      sourceLocator: item._id,
      attribution: `${author}, Quotable`,
      provenanceProvider: 'quotable-github-data',
      provenanceExternalId: item._id,
    });
  }
  return rows;
}