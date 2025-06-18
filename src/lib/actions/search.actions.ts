'use server';

import sql from '../db';
import { serverLogger } from '../utils/server-logger';

// Initialize materialized view refresher
import '../cron/refresh-materialized-views';

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
  const startTime = performance.now();

  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Optimized query with proper indexing for millions of records
    const results = await sql<Array<{ tag: string; count: string }>>`
      SELECT 
        tag,
        COUNT(*) as count
      FROM (
        SELECT UNNEST(tags) as tag
        FROM submissions 
        WHERE tags IS NOT NULL 
        AND array_length(tags, 1) > 0
        AND tags && ARRAY[${query}] -- Use GIN index operator for faster tag searches
      ) tag_table
      WHERE LOWER(tag) LIKE LOWER(${`%${query}%`})
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 10
    `;

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Server-side performance logging
    serverLogger.perf('searchHashtags', duration, {
      query,
      resultCount: results.length
    });

    return results.map((result, index) => {
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
    serverLogger.error('searchHashtags failed', error, { query });
    return [];
  }
}

export async function searchUsers(query: string): Promise<UserResult[]> {
  const startTime = performance.now();

  if (!query || query.length < 2) {
    return [];
  }

  try {
    // ULTRA-OPTIMIZED QUERY FOR MILLIONS OF RECORDS
    // First try materialized view for better performance
    let results = await sql<
      Array<{
        author_id: string;
        author: string;
        submission_count: number;
      }>
    >`
      SELECT 
        author_id,
        author,
        submission_count
      FROM user_submission_stats
      WHERE 
        author ILIKE ${`%${query}%`}
      ORDER BY submission_count DESC, author ASC
      LIMIT 10
    `;

    // If materialized view doesn't exist or is empty, fall back to live query
    if (results.length === 0) {
      serverLogger.debug(
        'Materialized view empty, falling back to live query',
        { query }
      );

      results = await sql<
        Array<{
          author_id: string;
          author: string;
          submission_count: number;
        }>
      >`
        WITH user_search AS (
          -- Use optimized indexes for fast search
          SELECT DISTINCT author_id, author
          FROM submissions 
          WHERE 
            author ILIKE ${`%${query}%`}
            AND author_id IS NOT NULL 
            AND author IS NOT NULL  
          LIMIT 50
        )
        SELECT 
          us.author_id,
          us.author,
          COUNT(s.submission_id)::integer as submission_count
        FROM user_search us
        LEFT JOIN submissions s ON s.author_id = us.author_id
        GROUP BY us.author_id, us.author
        ORDER BY submission_count DESC, author ASC
        LIMIT 10
      `;
    }

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    // Server-side performance logging with detailed metrics
    serverLogger.perf('searchUsers', queryTime, {
      query,
      resultCount: results.length,
      usedMaterializedView: results.length > 0
    });

    // Log slow queries for optimization
    serverLogger.slowQuery('searchUsers', queryTime);

    // Advanced debugging for empty results
    if (results.length === 0) {
      await debugUserSearch(query);
    }

    const mappedResults = results.map((result, index) => ({
      id: `user-${index}-${result.author_id}`,
      value: result.author_id,
      label: `${result.author} (${result.submission_count} posts)`,
      displayName: result.author,
      avatar: undefined,
      type: 'user' as const
    }));

    return mappedResults;
  } catch (error) {
    serverLogger.error('searchUsers failed', error, { query });
    return [];
  }
}

/**
 * Advanced debugging for user search issues
 */
async function debugUserSearch(query: string): Promise<void> {
  try {
    serverLogger.debug('Starting comprehensive user search debug', { query });

    // Check if materialized view exists and has data
    const viewExists = await sql<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_submission_stats'
      ) as exists
    `;

    if (viewExists[0]?.exists) {
      const viewCount = await sql<Array<{ count: string }>>`
        SELECT COUNT(*) as count FROM user_submission_stats
      `;
      serverLogger.debug('Materialized view status', {
        exists: true,
        rowCount: viewCount[0]?.count || 0
      });
    } else {
      serverLogger.debug('Materialized view does not exist');
    }

    // Check total users in submissions table
    const totalUsers = await sql<Array<{ count: string }>>`
      SELECT COUNT(DISTINCT author_id) as count 
      FROM submissions 
      WHERE author_id IS NOT NULL
    `;

    // Check for sample users
    const sampleUsers = await sql<Array<{ author: string; author_id: string }>>`
      SELECT DISTINCT author, author_id
      FROM submissions 
      WHERE author IS NOT NULL AND author_id IS NOT NULL
      LIMIT 5
    `;

    // Check if query matches any users (case insensitive)
    const matchingUsers = await sql<
      Array<{ author: string; author_id: string }>
    >`
      SELECT DISTINCT author, author_id
      FROM submissions 
      WHERE LOWER(author) LIKE LOWER(${`%${query}%`})
      AND author_id IS NOT NULL
      LIMIT 3
    `;

    serverLogger.debug('User search debugging complete', {
      query,
      totalUsers: totalUsers[0]?.count || 0,
      sampleUsers: sampleUsers.length,
      matchingUsers: matchingUsers.length,
      firstMatch: matchingUsers[0]?.author || 'none'
    });
  } catch (debugError) {
    serverLogger.error('Debug user search failed', debugError, { query });
  }
}

/**
 * OPTIMIZED: Get user information by username for millions of records
 */
export async function getUserInfo(
  username: string
): Promise<{ userId: string; username: string } | null> {
  const startTime = performance.now();

  if (!username) {
    return null;
  }

  try {
    const cleanUsername = username.startsWith('@')
      ? username.slice(1)
      : username;

    // Try materialized view first for better performance
    let result = await sql<Array<{ author_id: string; author: string }>>`
      SELECT author_id, author
      FROM user_submission_stats 
      WHERE author = ${cleanUsername}
      LIMIT 1
    `;

    // Fall back to live query if needed
    if (result.length === 0) {
      result = await sql<Array<{ author_id: string; author: string }>>`
        SELECT author_id, author
        FROM submissions 
        WHERE author = ${cleanUsername}
        LIMIT 1
      `;
    }

    const endTime = performance.now();
    serverLogger.perf('getUserInfo', endTime - startTime, {
      username: cleanUsername
    });

    if (result.length > 0) {
      return {
        userId: result[0].author_id,
        username: result[0].author
      };
    }

    // If no exact match, try case-insensitive search
    const fallbackResult = await sql<
      Array<{ author_id: string; author: string }>
    >`
      SELECT author_id, author
      FROM submissions 
      WHERE LOWER(author) = LOWER(${cleanUsername})
      LIMIT 1
    `;

    return fallbackResult.length > 0
      ? {
          userId: fallbackResult[0].author_id,
          username: fallbackResult[0].author
        }
      : null;
  } catch (error) {
    serverLogger.error('getUserInfo failed', error, { username });
    return null;
  }
}

/**
 * OPTIMIZED: Resolve user ID to username with caching consideration
 */
export async function resolveUserIdToUsername(
  userId: string
): Promise<string | null> {
  const startTime = performance.now();

  if (!userId) {
    return null;
  }

  try {
    // Try materialized view first
    let result = await sql<Array<{ author: string }>>`
      SELECT author
      FROM user_submission_stats 
      WHERE author_id = ${userId}
      LIMIT 1
    `;

    // Fall back to live query if needed
    if (result.length === 0) {
      result = await sql<Array<{ author: string }>>`
        SELECT author
        FROM submissions 
        WHERE author_id = ${userId}
        LIMIT 1
      `;
    }

    const endTime = performance.now();
    serverLogger.perf('resolveUserIdToUsername', endTime - startTime, {
      userId
    });

    return result.length > 0 ? result[0].author : null;
  } catch (error) {
    serverLogger.error('resolveUserIdToUsername failed', error, { userId });
    return null;
  }
}

/**
 * Refresh user statistics materialized view
 * Call this periodically (e.g., every hour) for optimal performance
 */
export async function refreshUserStats(): Promise<void> {
  const startTime = performance.now();

  try {
    await sql`SELECT refresh_user_submission_stats()`;

    const endTime = performance.now();
    serverLogger.perf('refreshUserStats', endTime - startTime);
  } catch (error) {
    serverLogger.error('refreshUserStats failed', error);
  }
}
