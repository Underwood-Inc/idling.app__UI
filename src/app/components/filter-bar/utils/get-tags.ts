export function getTagsFromSearchParams(searchParams: string): string[] {
  const tags: string[] = [];

  if (searchParams.includes(',')) {
    tags.push(...searchParams.split(','));
  } else {
    tags.push(searchParams);
  }

  return tags;
}
