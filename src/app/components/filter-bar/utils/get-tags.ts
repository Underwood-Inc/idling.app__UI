/**
 * when provided with a stringified comma delimited list of tags, return a string[] where each row is a single tag
 * @example getTagsFromSearchParams('bacon,donut') => ['bacon','donut']
 * @example getTagsFromSearchParams('bacon, donut ') => ['bacon','donut']
 * @example getTagsFromSearchParams('') => []
 */
export function getTagsFromSearchParams(searchParams: string): string[] {
  if (!searchParams) return [];

  return searchParams
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
