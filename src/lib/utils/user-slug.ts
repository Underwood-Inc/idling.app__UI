/**
 * Generate a unique user slug combining username and ID
 * Format: username-id (e.g., "johndoe-123")
 */
export function generateUserSlug(
  username: string,
  userId: string | number
): string {
  // Sanitize username for URL safety
  const sanitizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${sanitizedUsername}-${userId}`;
}

/**
 * Parse a user slug to extract username and ID
 * Returns null if the slug format is invalid
 */
export function parseUserSlug(
  slug: string
): { username: string; userId: string } | null {
  // Match pattern: anything followed by dash and number at the end
  const match = slug.match(/^(.+)-(\d+)$/);
  if (!match) return null;

  const [, username, userId] = match;
  return { username, userId };
}
