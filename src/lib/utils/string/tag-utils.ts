/**
 * Universal tag handling utilities - single source of truth
 * Fixes tag normalization inconsistencies throughout the application
 */

/**
 * Normalizes a tag for database storage (lowercase, no # prefix)
 * @param tag - Raw tag input (with or without #)
 * @returns string - normalized tag for database operations (e.g., "my_posts")
 */
export function normalizeTagForDatabase(tag: string): string {
  if (!tag || typeof tag !== 'string') return '';

  const trimmed = tag.trim().toLowerCase();
  if (!trimmed) return '';

  // Remove # prefix if present, keep lowercase
  const withoutHash = trimmed.startsWith('#') ? trimmed.substring(1) : trimmed;

  // Validate format: only letters, numbers, underscores, hyphens
  if (
    /^[a-z0-9_-]+$/.test(withoutHash) &&
    withoutHash.length > 0 &&
    withoutHash.length <= 50
  ) {
    return withoutHash;
  }

  return '';
}

/**
 * Formats a tag for display (with # prefix)
 * @param tag - Database tag or any tag format
 * @returns string - display-ready tag (e.g., "#my_posts")
 */
export function formatTagForDisplay(tag: string): string {
  const normalized = normalizeTagForDatabase(tag);
  return normalized ? `#${normalized}` : '';
}

/**
 * Formats multiple tags for URL parameters (no # prefix, comma-separated)
 * @param tags - Array of tags in any format
 * @returns string - URL-ready tags (e.g., "my_posts,react,typescript")
 */
export function formatTagsForUrl(tags: string[]): string {
  return tags.map(normalizeTagForDatabase).filter(Boolean).join(',');
}

/**
 * Parses tags from URL parameter back to display format
 * @param urlTags - Comma-separated tags from URL (e.g., "my_posts,react")
 * @returns string[] - Display-ready tags (e.g., ["#my_posts", "#react"])
 */
export function parseTagsFromUrl(urlTags: string): string[] {
  if (!urlTags) return [];

  return urlTags
    .split(',')
    .map(normalizeTagForDatabase)
    .filter(Boolean)
    .map(formatTagForDisplay);
}

/**
 * Normalizes an array of tags for database queries
 * @param tags - Array of tags in any format
 * @returns string[] - Database-ready tags (e.g., ["my_posts", "react"])
 */
export function normalizeTagsForDatabase(tags: string[]): string[] {
  return tags.map(normalizeTagForDatabase).filter(Boolean);
}

/**
 * Validates a tag input
 * @param tag - Tag to validate
 * @returns boolean - true if valid
 */
export function isValidTag(tag: string): boolean {
  const normalized = normalizeTagForDatabase(tag);
  return normalized.length > 0;
}
