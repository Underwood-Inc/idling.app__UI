/** Stable JSON key for product ids inside typesafe-i18n catalogs (hyphens → underscores). */
export function idlingProductI18nKey(projectId: string): string {
  return projectId.replace(/-/g, '_');
}