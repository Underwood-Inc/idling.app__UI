/**
 * @deprecated After migration 0010, all profile URLs use database IDs only
 * Generate a unique user slug combining username and ID
 * Format: username-id (e.g., "johndoe-123")
 */
export function generateUserSlug(
  username: string,
  userId: string | number
): string {
  // Handle undefined or null username
  if (!username || typeof username !== 'string') {
    username = 'user';
  }

  // Sanitize username for URL safety
  const sanitizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${sanitizedUsername}-${userId}`;
}

/**
 * @deprecated After migration 0010, all profile URLs use database IDs only
 * Parse a user slug back into username and user ID
 * Returns null if the string doesn't match the expected slug format
 */
export function parseUserSlug(
  slug: string
): { username: string; userId: string } | null {
  // Match pattern: anything-followed-by-numbers
  const match = slug.match(/^(.+)-(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    username: match[1],
    userId: match[2]
  };
}

/**
 * @deprecated After migration 0010, all profile URLs use database IDs only
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
