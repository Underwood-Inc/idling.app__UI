'use server';

import sql from '../db';
import { serverLogger } from '../utils/server-logger';

export interface UserSearchResult {
  id: string;
  value: string;
  label: string;
  displayName?: string;
  avatar?: string;
  type: 'user';
}

export interface PaginatedUserSearchResult {
  items: UserSearchResult[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
}

/** Mention autocomplete for profile bios — users table only (no posts/submissions). */
export async function searchUsers(
  query: string,
  page = 1,
  pageSize = 10,
): Promise<PaginatedUserSearchResult> {
  const startTime = performance.now();

  if (!query || query.length < 2) {
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }

  try {
    const offset = (page - 1) * pageSize;
    const pattern = `%${query}%`;

    const totalResult = await sql<Array<{ total: string }>>`
      SELECT COUNT(*)::text AS total
      FROM users u
      WHERE u.name ILIKE ${pattern}
    `;

    const total = parseInt(totalResult[0]?.total || '0', 10);

    const results = await sql<Array<{ user_id: string; name: string }>>`
      SELECT u.id::text AS user_id, u.name
      FROM users u
      WHERE u.name ILIKE ${pattern}
      ORDER BY u.name ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const queryTime = performance.now() - startTime;
    if (queryTime > 1000) {
      serverLogger.slowQuery('searchUsers', queryTime, 1000);
    }

    const items = results.map((result, index) => ({
      id: `user-${page}-${index}-${result.user_id}`,
      value: result.user_id,
      label: result.name,
      displayName: result.name,
      type: 'user' as const,
    }));

    return {
      items,
      hasMore: offset + results.length < total,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    serverLogger.error('searchUsers failed', error, { query, page, pageSize });
    return { items: [], hasMore: false, total: 0, page, pageSize };
  }
}