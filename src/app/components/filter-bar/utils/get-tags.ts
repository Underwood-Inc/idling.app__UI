/**
 * when provided with a stringified comma delimited list of tags, return a string[] where each row is a single tag
 * @example getTagsFromSearchParams('bacon,donut') => ['bacon','donut']
 */
export function getTagsFromSearchParams(searchParams: string): string[] {
  const tags: string[] = [];

  if (searchParams.includes(',')) {
    tags.push(...searchParams.split(','));
  } else {
    tags.push(searchParams);
  }

  return tags;
}
