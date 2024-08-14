export function dedupeStringArray(array: string[]): string[] {
  return [...new Set(array)].filter((value) => !!value) as [];
}
