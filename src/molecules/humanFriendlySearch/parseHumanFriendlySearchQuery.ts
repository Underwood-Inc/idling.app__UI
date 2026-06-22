import type {
  HumanFriendlySearchQuery,
  HumanFriendlySearchTerm,
  ParseHumanFriendlySearchQueryOptions,
} from './humanFriendlySearch.types';

const QUERY_TOKEN_REGEX = /"([^"]+)"|(#\w+)|(\S+)/g;

export function parseHumanFriendlySearchQuery(
  raw: string,
  options: ParseHumanFriendlySearchQueryOptions = {}
): HumanFriendlySearchQuery {
  const minTermLength = options.minTermLength ?? 2;
  const trimmed = raw.trim();

  if (!trimmed) {
    return { raw: '', terms: [] };
  }

  const terms: HumanFriendlySearchTerm[] = [];
  QUERY_TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null = QUERY_TOKEN_REGEX.exec(trimmed);
  while (match !== null) {
    const quotedTerm = match[1];
    const hashtagTerm = match[2];
    const wordTerm = match[3];

    if (quotedTerm) {
      if (quotedTerm.length >= minTermLength) {
        terms.push(createTextTerm(quotedTerm, `"${quotedTerm}"`));
      }
    } else if (hashtagTerm) {
      const value = hashtagTerm.slice(1);
      if (value.length >= minTermLength) {
        terms.push({
          kind: 'hashtag',
          raw: hashtagTerm,
          value: value.toLowerCase(),
        });
      }
    } else if (wordTerm && wordTerm.length >= minTermLength) {
      terms.push(createTextTerm(wordTerm, wordTerm));
    }

    match = QUERY_TOKEN_REGEX.exec(trimmed);
  }

  return { raw: trimmed, terms };
}

function createTextTerm(value: string, raw: string): HumanFriendlySearchTerm {
  return {
    kind: 'text',
    raw,
    value: value.toLowerCase(),
  };
}
