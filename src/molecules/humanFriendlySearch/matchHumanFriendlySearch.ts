import type {
  HumanFriendlySearchLogic,
  HumanFriendlySearchMatchOptions,
  HumanFriendlySearchQuery,
  HumanFriendlySearchTerm,
} from './humanFriendlySearch.types';

export function matchesHumanFriendlySearch(
  haystack: string,
  query: HumanFriendlySearchQuery,
  options: HumanFriendlySearchMatchOptions = {}
): boolean {
  if (!query.terms.length) {
    return true;
  }

  const logic: HumanFriendlySearchLogic = options.logic ?? 'OR';
  const normalizedHaystack = haystack.toLowerCase();
  const matches = query.terms.map((term) => termMatchesHaystack(term, normalizedHaystack));

  return logic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
}

function termMatchesHaystack(term: HumanFriendlySearchTerm, haystack: string): boolean {
  return haystack.includes(term.value);
}
