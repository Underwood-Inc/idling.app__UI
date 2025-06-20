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

/**
 * Ensure any user data has a slug field populated
 * This is useful for components that receive user data from various sources
 */
export function ensureUserSlug(user: {
  id?: string | number;
  name?: string;
  username?: string;
  slug?: string;
}): string {
  // If slug already exists, use it
  if (user.slug) {
    return user.slug;
  }

  // Generate slug from available data
  const userId = user.id;
  const username = user.name || user.username || 'user';

  if (!userId) {
    // Fallback to username if no ID available
    return encodeURIComponent(username);
  }

  return generateUserSlug(username, userId);
}
