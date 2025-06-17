'use server';

import sql from '../db';

export interface HashtagResult {
  id: string;
  value: string;
  label: string;
  count: number;
  type: 'hashtag';
}

export interface UserResult {
  id: string;
  value: string; // This is the author_id for filtering
  label: string;
  displayName?: string; // This is the author name for display
  avatar?: string;
  type: 'user';
}

export async function searchHashtags(query: string): Promise<HashtagResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for hashtags in the tags array of submissions
    const results = await sql<Array<{ tag: string; count: string }>>`
      SELECT 
        tag,
        COUNT(*) as count
      FROM (
        SELECT UNNEST(tags) as tag
        FROM submissions 
        WHERE tags IS NOT NULL 
        AND array_length(tags, 1) > 0
      ) tag_table
      WHERE LOWER(tag) LIKE LOWER(${`%${query}%`})
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 10
    `;

    return results.map((result, index) => {
      // Remove # prefix from tag if it exists to avoid double #
      const cleanTag = result.tag.startsWith('#')
        ? result.tag.slice(1)
        : result.tag;

      return {
        id: `hashtag-${index}-${cleanTag}`,
        value: cleanTag,
        label: `${cleanTag} (${result.count} posts)`,
        count: parseInt(result.count),
        type: 'hashtag' as const
      };
    });
  } catch (error) {
    console.error('Error searching hashtags:', error);
    return [];
  }
}

export async function searchUsers(query: string): Promise<UserResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for users in the submissions table by author and author_id
    const results = await sql<
      Array<{
        author_id: string;
        author: string;
        submission_count: string;
      }>
    >`
      SELECT DISTINCT
        author_id,
        author,
        COUNT(*) as submission_count
      FROM submissions 
      WHERE 
        LOWER(author) LIKE LOWER(${`%${query}%`})
        OR LOWER(author_id) LIKE LOWER(${`%${query}%`})
      GROUP BY author_id, author
      ORDER BY submission_count DESC, author ASC
      LIMIT 10
    `;

    // For now, we'll generate avatar URLs using the author name as seed
    // In a real app, you'd have actual user avatar URLs
    return results.map((result, index) => ({
      id: `user-${index}-${result.author_id}`,
      value: result.author_id, // Use author_id for filtering
      label: `${result.author} (${result.submission_count} posts)`,
      displayName: result.author, // Keep the display name separate
      avatar: undefined, // We'll generate this in the component using Avatar
      type: 'user' as const
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Get user information by username - returns both ID and username in one call
 * This replaces the separate resolution functions for better efficiency
 */
export async function getUserInfo(
  username: string
): Promise<{ userId: string; username: string } | null> {
  if (!username) {
    return null;
  }

  try {
    // Remove @ prefix if present
    const cleanUsername = username.startsWith('@')
      ? username.slice(1)
      : username;

    // Look up both user ID and username by exact username match
    const result = await sql<Array<{ author_id: string; author: string }>>`
      SELECT DISTINCT author_id, author
      FROM submissions 
      WHERE LOWER(author) = LOWER(${cleanUsername})
      LIMIT 1
    `;

    if (result.length > 0) {
      return {
        userId: result[0].author_id,
        username: result[0].author
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Resolve a username to a user ID for more accurate filtering
 * This helps when clicking mentions in content to filter by the actual user ID
 * @deprecated Use getUserInfo instead for better efficiency
 */
export async function resolveUsernameToUserId(
  username: string
): Promise<string | null> {
  const userInfo = await getUserInfo(username);
  return userInfo?.userId || null;
}

/**
 * Resolve a user ID back to a username for display purposes
 * This helps when showing user ID filters in a readable format
 * @deprecated Use getUserInfo instead for better efficiency
 */
export async function resolveUserIdToUsername(
  userId: string
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  try {
    // Look up the username by user ID
    const result = await sql<Array<{ author: string }>>`
      SELECT DISTINCT author
      FROM submissions 
      WHERE author_id = ${userId}
      LIMIT 1
    `;

    return result.length > 0 ? result[0].author : null;
  } catch (error) {
    console.error('Error resolving user ID to username:', error);
    return null;
  }
}
