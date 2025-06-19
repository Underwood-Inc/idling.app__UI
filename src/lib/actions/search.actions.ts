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

export interface PaginatedHashtagResult {
  items: HashtagResult[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedUserResult {
  items: UserResult[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
}

// Enhanced searchHashtags with pagination support
export async function searchHashtags(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedHashtagResult> {
  const startTime = performance.now();

  if (!query || query.length < 2) {
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }

  try {
    const offset = (page - 1) * pageSize;

    // Get total count for pagination - fixed to avoid duplicates
    const totalResult = await sql<Array<{ total: string }>>`
      SELECT COUNT(DISTINCT tag) as total 
      FROM (
        SELECT unnest(tags) as tag
        FROM submissions 
        WHERE tags IS NOT NULL 
      ) hashtag_search
      WHERE tag ILIKE ${`%${query}%`}
    `;

    const total = parseInt(totalResult[0]?.total || '0');

    // Get paginated results - fixed to avoid duplicates
    const results = await sql<
      Array<{
        tag: string;
        tag_count: number;
      }>
    >`
      SELECT 
        tag,
        COUNT(*) as tag_count
      FROM (
        SELECT unnest(tags) as tag
        FROM submissions 
        WHERE tags IS NOT NULL 
      ) hashtag_search
      WHERE tag ILIKE ${`%${query}%`}
      GROUP BY tag
      ORDER BY tag_count DESC, tag ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const endTime = performance.now();
    serverLogger.perf('searchHashtags', endTime - startTime, {
      query,
      page,
      pageSize,
      resultCount: results.length,
      total
    });

    const items = results.map((result, index) => ({
      id: `hashtag-${page}-${index}-${result.tag}`,
      value: result.tag,
      label: `${result.tag} (${result.tag_count} posts)`,
      count: result.tag_count,
      type: 'hashtag' as const
    }));

    return {
      items,
      hasMore: offset + results.length < total,
      total,
      page,
      pageSize
    };
  } catch (error) {
    serverLogger.error('searchHashtags failed', error, {
      query,
      page,
      pageSize
    });
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }
}

// Enhanced searchUsers with pagination support
export async function searchUsers(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedUserResult> {
  const startTime = performance.now();

  if (!query || query.length < 2) {
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }

  try {
    const offset = (page - 1) * pageSize;

    // Get total count for pagination
    let totalResult = await sql<Array<{ total: string }>>`
      SELECT COUNT(*) as total
      FROM user_stats
      WHERE name ILIKE ${`%${query}%`}
    `;

    // Fall back to live query if materialized view is empty
    if (parseInt(totalResult[0]?.total || '0') === 0) {
      totalResult = await sql<Array<{ total: string }>>`
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        JOIN submissions s ON u.id = s.user_id
        WHERE u.name ILIKE ${`%${query}%`}
        AND s.user_id IS NOT NULL 
        AND u.name IS NOT NULL
      `;
    }

    const total = parseInt(totalResult[0]?.total || '0');

    // ULTRA-OPTIMIZED QUERY FOR MILLIONS OF RECORDS with pagination
    // First try materialized view for better performance
    let results = await sql<
      Array<{
        user_id: string;
        name: string;
        submission_count: number;
      }>
    >`
      SELECT 
        user_id::text,
        name,
        submission_count
      FROM user_stats
      WHERE 
        name ILIKE ${`%${query}%`}
      ORDER BY submission_count DESC, name ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    // If materialized view doesn't exist or is empty, fall back to live query
    if (results.length === 0 && page === 1) {
      results = await sql<
        Array<{
          user_id: string;
          name: string;
          submission_count: number;
        }>
      >`
        WITH user_search AS (
          -- Use optimized indexes for fast search
          SELECT DISTINCT u.id, u.name
          FROM users u
          JOIN submissions s ON u.id = s.user_id
          WHERE 
            u.name ILIKE ${`%${query}%`}
            AND s.user_id IS NOT NULL 
            AND u.name IS NOT NULL  
          LIMIT ${pageSize * 3} -- Get more for better accuracy
          OFFSET ${offset}
        )
        SELECT 
          us.id::text as user_id,
          us.name,
          COUNT(s.submission_id)::integer as submission_count
        FROM user_search us
        LEFT JOIN submissions s ON s.user_id = us.id
        GROUP BY us.id, us.name
        ORDER BY submission_count DESC, name ASC
        LIMIT ${pageSize}
      `;
    }

    // Only log truly slow queries (>1000ms) in production
    const endTime = performance.now();
    const queryTime = endTime - startTime;

    if (queryTime > 1000) {
      serverLogger.slowQuery('searchUsers', queryTime, 1000);
    }

    const items = results.map((result, index) => ({
      id: `user-${page}-${index}-${result.user_id}`,
      value: result.user_id,
      label: `${result.name} (${result.submission_count} posts)`,
      displayName: result.name,
      avatar: undefined,
      type: 'user' as const
    }));

    return {
      items,
      hasMore: offset + results.length < total,
      total,
      page,
      pageSize
    };
  } catch (error) {
    serverLogger.error('searchUsers failed', error, { query, page, pageSize });
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }
}

/**
 * Removed expensive debugging function that was running extra queries on every search
 * This was causing significant performance overhead
 */

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
    let result = await sql<Array<{ user_id: string; name: string }>>`
      SELECT user_id::text as user_id, name
      FROM user_stats 
      WHERE name = ${cleanUsername}
      LIMIT 1
    `;

    // Fall back to live query if needed
    if (result.length === 0) {
      result = await sql<Array<{ user_id: string; name: string }>>`
        SELECT u.id::text as user_id, u.name
        FROM users u
        JOIN submissions s ON u.id = s.user_id
        WHERE u.name = ${cleanUsername}
        LIMIT 1
      `;
    }

    // Removed performance logging for frequently called function

    if (result.length > 0) {
      return {
        userId: result[0].user_id,
        username: result[0].name
      };
    }

    // If no exact match, try case-insensitive search
    const fallbackResult = await sql<Array<{ user_id: string; name: string }>>`
      SELECT u.id::text as user_id, u.name
      FROM users u
      JOIN submissions s ON u.id = s.user_id
      WHERE LOWER(u.name) = LOWER(${cleanUsername})
      LIMIT 1
    `;

    return fallbackResult.length > 0
      ? {
          userId: fallbackResult[0].user_id,
          username: fallbackResult[0].name
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
    let result = await sql<Array<{ name: string }>>`
      SELECT name
      FROM user_stats 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    // Fall back to live query if needed
    if (result.length === 0) {
      result = await sql<Array<{ name: string }>>`
        SELECT u.name
        FROM users u
        WHERE u.id = ${userId}
        LIMIT 1
      `;
    }

    // Removed performance logging for frequently called function

    return result.length > 0 ? result[0].name : null;
  } catch (error) {
    serverLogger.error('resolveUserIdToUsername failed', error, { userId });
    return null;
  }
}

/**
 * Refresh user statistics materialized view
 * Call this periodically (e.g., nightly) for optimal performance
 */
export async function refreshUserStats(): Promise<void> {
  const startTime = performance.now();

  try {
    await sql`SELECT refresh_user_stats()`;

    // Only log if refresh takes longer than expected
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 5000) {
      // 5 seconds
      serverLogger.slowQuery('refreshUserStats', duration, 5000);
    }
  } catch (error) {
    serverLogger.error('refreshUserStats failed', error);
  }
}

/**
 * Refresh tag statistics materialized view
 * Call this periodically (e.g., nightly) for optimal performance
 */
export async function refreshTagStats(): Promise<void> {
  const startTime = performance.now();

  try {
    await sql`SELECT refresh_tag_statistics()`;

    const endTime = performance.now();
    serverLogger.perf('refreshTagStats', endTime - startTime);
  } catch (error) {
    serverLogger.error('refreshTagStats failed', error);
  }
}

/**
 * Refresh trending posts materialized view
 * Call this periodically (e.g., every 6 hours) for optimal performance
 */
export async function refreshTrendingPosts(): Promise<void> {
  const startTime = performance.now();

  try {
    await sql`SELECT refresh_trending_posts()`;

    const endTime = performance.now();
    serverLogger.perf('refreshTrendingPosts', endTime - startTime);
  } catch (error) {
    serverLogger.error('refreshTrendingPosts failed', error);
  }
}

/**
 * Refresh daily statistics materialized view
 * Call this periodically (e.g., nightly) for optimal performance
 */
export async function refreshDailyStats(): Promise<void> {
  const startTime = performance.now();

  try {
    await sql`SELECT refresh_daily_stats()`;

    const endTime = performance.now();
    serverLogger.perf('refreshDailyStats', endTime - startTime);
  } catch (error) {
    serverLogger.error('refreshDailyStats failed', error);
  }
}
