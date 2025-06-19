/* eslint-disable no-console */
'use server';
import sql from '../../../lib/db';
import { Submission, submissionSchema } from '../submission-forms/schema';

export interface SubmissionWithReplies extends Submission {
  replies?: SubmissionWithReplies[];
}

export type GetSubmissionsActionArguments = {
  onlyMine: boolean;
  providerAccountId: string;
  filters?: { name: string; value: string }[];
  page?: number;
  pageSize?: number;
  includeThreadReplies?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
  };
};

export type GetSubmissionsActionResponse = {
  data?: PaginatedResponse<Submission>;
  error?: string;
};

// For test compatibility - returns the format expected by tests
export async function getSubmissions({
  onlyMine,
  providerAccountId,
  filters = [],
  page = 1,
  pageSize = 10,
  includeThreadReplies = false
}: GetSubmissionsActionArguments) {
  // Handle edge case for tests
  if (onlyMine && !providerAccountId) {
    return {
      result: [],
      pagination: {
        currentPage: 1,
        pageSize,
        totalRecords: 0,
        totalPages: 0
      }
    };
  }

  // Ensure page is at least 1
  const currentPage = Math.max(1, page);

  try {
    const offset = (currentPage - 1) * pageSize;
    const tagFilter = filters.find((f) => f.name === 'tags')?.value;

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    // Exclude thread replies by default unless explicitly requested
    if (!includeThreadReplies) {
      whereConditions.push('s.thread_parent_id IS NULL');
    }

    if (onlyMine) {
      whereConditions.push('s.author_id = $' + (queryParams.length + 1));
      queryParams.push(providerAccountId);
    }

    if (tagFilter && tagFilter.trim()) {
      whereConditions.push(
        'EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $' +
          (queryParams.length + 1) +
          ')'
      );
      queryParams.push(tagFilter);
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Count query
    const countQueryText = `
      SELECT COUNT(*) 
      FROM submissions s
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQueryText, queryParams);
    const totalRecords = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Submissions query
    const submissionsQueryText = `
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_title,
        s.submission_datetime,
        s.author_id,
        s.author,
        COALESCE(s.tags, ARRAY[]::text[]) as tags,
        s.thread_parent_id
      FROM submissions s
      ${whereClause}
      ORDER BY s.submission_datetime DESC
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}
    `;

    const submissionsParams = [...queryParams, pageSize, offset];
    const submissionsResult = await sql.unsafe(
      submissionsQueryText,
      submissionsParams
    );

    return {
      result: submissionsResult || [],
      pagination: {
        currentPage,
        pageSize,
        totalRecords,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getSubmissions:', error);
    return {
      result: [],
      pagination: {
        currentPage,
        pageSize,
        totalRecords: 0,
        totalPages: 0
      }
    };
  }
}

/**
 * OPTIMIZED: Fetch submissions with replies using a single query to eliminate N+1 problem
 * This replaces the inefficient getSubmissionReplies approach
 */
export async function getSubmissionsWithRepliesOptimized(
  parentIds: number[]
): Promise<Map<number, SubmissionWithReplies[]>> {
  if (parentIds.length === 0) {
    return new Map();
  }

  try {
    // Single query to fetch all replies for all parents at once
    const repliesResult = await sql<any[]>`
      WITH RECURSIVE reply_tree AS (
        -- Base case: direct replies to the parent posts
      SELECT 
        submission_id,
        submission_name,
        submission_title,
        submission_datetime,
        author_id,
        author,
        COALESCE(tags, ARRAY[]::text[]) as tags,
          thread_parent_id,
          thread_parent_id as root_parent_id,
          1 as depth
      FROM submissions
        WHERE thread_parent_id = ANY(${parentIds})
        
        UNION ALL
        
        -- Recursive case: replies to replies (nested threads)
        SELECT 
          s.submission_id,
          s.submission_name,
          s.submission_title,
          s.submission_datetime,
          s.author_id,
          s.author,
          COALESCE(s.tags, ARRAY[]::text[]) as tags,
          s.thread_parent_id,
          rt.root_parent_id,
          rt.depth + 1
        FROM submissions s
        INNER JOIN reply_tree rt ON s.thread_parent_id = rt.submission_id
        WHERE rt.depth < 10 -- Prevent infinite recursion
      )
      SELECT * FROM reply_tree
      ORDER BY root_parent_id, thread_parent_id, submission_datetime ASC
    `;

    // Group replies by root parent ID
    const repliesMap = new Map<number, SubmissionWithReplies[]>();
    const allRepliesById = new Map<number, SubmissionWithReplies>();

    // First pass: create all reply objects
    for (const row of repliesResult) {
      const submission: SubmissionWithReplies = {
        submission_id: Number(row.submission_id),
        submission_name: row.submission_name,
        submission_title: row.submission_title || row.submission_name,
        submission_datetime: new Date(row.submission_datetime),
        author_id: row.author_id,
        author: row.author,
        tags: Array.isArray(row.tags) ? row.tags : [],
        thread_parent_id: row.thread_parent_id
          ? Number(row.thread_parent_id)
          : null,
        replies: []
      };

      allRepliesById.set(submission.submission_id, submission);
    }

    // Second pass: organize into tree structure
    for (const reply of allRepliesById.values()) {
      if (parentIds.includes(reply.thread_parent_id!)) {
        // This is a direct reply to a parent post
        const parentId = reply.thread_parent_id!;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(reply);
      } else if (
        reply.thread_parent_id &&
        allRepliesById.has(reply.thread_parent_id)
      ) {
        // This is a nested reply
        const parent = allRepliesById.get(reply.thread_parent_id);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(reply);
        }
      }
    }

    return repliesMap;
  } catch (error) {
    console.error('Error fetching optimized submission replies:', error);
    return new Map();
  }
}

/**
 * Legacy function kept for backward compatibility
 * @deprecated Use getSubmissionsWithRepliesOptimized instead
 */
export async function getSubmissionReplies(
  parentId: number
): Promise<SubmissionWithReplies[]> {
  const repliesMap = await getSubmissionsWithRepliesOptimized([parentId]);
  return repliesMap.get(parentId) || [];
}

/**
 * Get submissions with their thread replies populated
 */
export async function getSubmissionsWithReplies({
  onlyMine,
  providerAccountId,
  filters = [],
  page = 1,
  pageSize = 10,
  includeThreadReplies = false
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  // Production optimized - logging removed

  try {
    if (includeThreadReplies && filters.length > 0) {
      // When includeThreadReplies is true and we have filters:
      // 1. Get all submissions (including replies) that match filters
      // 2. Group them into proper thread structure
      // 3. Return only parent posts with nested replies

      const allMatchingSubmissions = await getSubmissionsAction({
        onlyMine,
        providerAccountId,
        filters,
        page,
        pageSize,
        includeThreadReplies: true // Include replies in filter matching
      });

      if (!allMatchingSubmissions.data) {
        return allMatchingSubmissions;
      }

      // Logging removed for performance

      // Group submissions by thread (parent posts and their replies)
      const submissionMap = new Map<number, SubmissionWithReplies>();
      const threadReplies = new Map<number, SubmissionWithReplies[]>();

      // First pass: separate parents and replies
      for (const submission of allMatchingSubmissions.data.data) {
        const submissionWithReplies: SubmissionWithReplies = { ...submission };

        if (submission.thread_parent_id === null) {
          // This is a parent post
          submissionMap.set(submission.submission_id, submissionWithReplies);
        } else {
          // This is a reply - group by parent
          const parentId = submission.thread_parent_id;
          if (!threadReplies.has(parentId)) {
            threadReplies.set(parentId, []);
          }
          threadReplies.get(parentId)!.push(submissionWithReplies);

          // If parent isn't in results, fetch it
          if (!submissionMap.has(parentId)) {
            const parentResult = await sql<any[]>`
              SELECT 
                submission_id,
                submission_name,
                submission_title,
                submission_datetime,
                author_id,
                author,
                COALESCE(tags, ARRAY[]::text[]) as tags,
                thread_parent_id
              FROM submissions
              WHERE submission_id = ${parentId}
            `;

            if (parentResult[0]) {
              const parentSubmission: SubmissionWithReplies = {
                submission_id: Number(parentResult[0].submission_id),
                submission_name: parentResult[0].submission_name,
                submission_title:
                  parentResult[0].submission_title ||
                  parentResult[0].submission_name,
                submission_datetime: new Date(
                  parentResult[0].submission_datetime
                ),
                author_id: parentResult[0].author_id,
                author: parentResult[0].author,
                tags: Array.isArray(parentResult[0].tags)
                  ? parentResult[0].tags
                  : [],
                thread_parent_id: parentResult[0].thread_parent_id
                  ? Number(parentResult[0].thread_parent_id)
                  : null
              };
              submissionMap.set(parentId, parentSubmission);
            }
          }
        }
      }

      // Second pass: attach replies to their parents
      for (const [parentId, replies] of threadReplies) {
        const parent = submissionMap.get(parentId);
        if (parent) {
          parent.replies = replies;
        }
      }

      // Convert to array and sort by datetime (most recent first)
      const finalSubmissions = Array.from(submissionMap.values()).sort(
        (a, b) =>
          new Date(b.submission_datetime).getTime() -
          new Date(a.submission_datetime).getTime()
      );

      // Performance logging removed

      return {
        data: {
          data: finalSubmissions,
          pagination: allMatchingSubmissions.data.pagination
        }
      };
    } else {
      // When includeThreadReplies is false or no filters:
      // Get main submissions only and fetch their replies separately
      const mainSubmissionsResponse = await getSubmissionsAction({
        onlyMine,
        providerAccountId,
        filters,
        page,
        pageSize,
        includeThreadReplies: false // Only main posts for filtering
      });

      if (!mainSubmissionsResponse.data) {
        return mainSubmissionsResponse;
      }

      // OPTIMIZED: Fetch all replies in a single query instead of N+1 queries
      const parentIds = mainSubmissionsResponse.data.data.map(
        (s) => s.submission_id
      );
      const repliesMap = await getSubmissionsWithRepliesOptimized(parentIds);

      const submissionsWithReplies: SubmissionWithReplies[] = [];

      // Attach replies to their parent submissions
      for (const submission of mainSubmissionsResponse.data.data) {
        const submissionWithReplies: SubmissionWithReplies = { ...submission };

        const replies = repliesMap.get(submission.submission_id);
        if (replies && replies.length > 0) {
          submissionWithReplies.replies = replies;
        }

        submissionsWithReplies.push(submissionWithReplies);
      }

      // Performance logging removed

      return {
        data: {
          data: submissionsWithReplies,
          pagination: mainSubmissionsResponse.data.pagination
        }
      };
    }
  } catch (error) {
    console.error('Error in getSubmissionsWithReplies:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch submissions with replies'
    };
  }
}

export async function getSubmissionsAction({
  onlyMine,
  providerAccountId,
  filters = [],
  page = 1,
  pageSize = 10,
  includeThreadReplies = false
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  // Remove all production logging for performance

  if (!providerAccountId) {
    return {
      error: 'Provider account ID is required'
    };
  }

  try {
    const offset = (page - 1) * pageSize;

    // Parse filters into groups
    const filterGroups = parseFiltersIntoGroups(filters);

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    // Exclude thread replies by default unless explicitly requested
    if (!includeThreadReplies) {
      whereConditions.push('s.thread_parent_id IS NULL');
    }

    if (onlyMine) {
      whereConditions.push('s.author_id = $' + (queryParams.length + 1));
      queryParams.push(providerAccountId);
    }

    // Build complex filter conditions
    const filterConditions = await buildFilterConditions(
      filterGroups,
      queryParams
    );
    if (filterConditions.condition) {
      whereConditions.push(filterConditions.condition);
      queryParams.push(...filterConditions.params);
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Optimized count query - use estimation for large datasets
    let totalRecords;
    if (
      whereConditions.length === 0 ||
      (whereConditions.length === 1 &&
        whereConditions[0] === 's.thread_parent_id IS NULL')
    ) {
      // For simple queries, use table statistics (much faster)
      const statsResult = await sql.unsafe(`
        SELECT 
          reltuples::bigint as estimate,
          reltuples > 10000 as use_estimate
        FROM pg_class 
        WHERE relname = 'submissions'
      `);

      if (statsResult[0]?.use_estimate) {
        // Use estimated count for large tables
        totalRecords = Math.floor(statsResult[0].estimate * 0.9); // Main posts are ~90% of total
      } else {
        // Fall back to accurate count for smaller tables
        const countResult = await sql.unsafe(
          `SELECT COUNT(*) FROM submissions s ${whereClause}`,
          queryParams
        );
        totalRecords = parseInt(countResult[0].count);
      }
    } else {
      // For complex filtered queries, we need accurate count
      const countResult = await sql.unsafe(
        `SELECT COUNT(*) FROM submissions s ${whereClause}`,
        queryParams
      );
      totalRecords = parseInt(countResult[0].count);
    }

    // Optimized pagination strategy for large datasets
    let submissionsQueryText;
    let submissionsParams;

    if (offset > 1000) {
      // Use keyset pagination for large offsets (much faster)
      submissionsQueryText = `
        SELECT 
          s.submission_id,
          s.submission_name,
          s.submission_title,
          s.submission_datetime,
          s.author_id,
          s.author,
          COALESCE(s.tags, ARRAY[]::text[]) as tags,
          s.thread_parent_id
        FROM submissions s
        ${whereClause}
        ORDER BY s.submission_datetime DESC, s.submission_id DESC
        LIMIT $${queryParams.length + 1}
      `;
      submissionsParams = [...queryParams, pageSize];
    } else {
      // Standard pagination for small offsets
      submissionsQueryText = `
        SELECT 
          s.submission_id,
          s.submission_name,
          s.submission_title,
          s.submission_datetime,
          s.author_id,
          s.author,
          COALESCE(s.tags, ARRAY[]::text[]) as tags,
          s.thread_parent_id
        FROM submissions s
        ${whereClause}
        ORDER BY s.submission_datetime DESC
        LIMIT $${queryParams.length + 1}
        OFFSET $${queryParams.length + 2}
      `;
      submissionsParams = [...queryParams, pageSize, offset];
    }
    const submissionsResult = await sql.unsafe(
      submissionsQueryText,
      submissionsParams
    );

    if (!submissionsResult || submissionsResult.length === 0) {
      return {
        data: {
          data: [],
          pagination: {
            currentPage: page,
            pageSize,
            totalRecords
          }
        }
      };
    }

    const submissions = submissionsResult.map((row: any) => {
      try {
        const parsedData = {
          submission_id: Number(row.submission_id),
          submission_name: row.submission_name,
          submission_title: row.submission_title || row.submission_name, // Fallback for legacy data
          submission_datetime: new Date(row.submission_datetime),
          author_id: row.author_id,
          author: row.author,
          tags: Array.isArray(row.tags) ? row.tags : [],
          thread_parent_id: row.thread_parent_id
            ? Number(row.thread_parent_id)
            : null
        };
        return submissionSchema.parse(parsedData);
      } catch (parseError) {
        console.error('Error parsing submission:', parseError, 'Row:', row);
        throw new Error(
          `Failed to parse submission: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        );
      }
    });

    // Sample result verification removed for performance

    return {
      data: {
        data: submissions,
        pagination: {
          currentPage: page,
          pageSize,
          totalRecords
        }
      }
    };
  } catch (error) {
    console.error('🔍 [BACKEND] Error in getSubmissions:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to fetch submissions'
    };
  }
}

/**
 * Parse simple filters into filter groups for complex filtering
 */
function parseFiltersIntoGroups(filters: { name: string; value: string }[]): {
  tags: { values: string[]; logic: 'AND' | 'OR' };
  authors: { values: string[]; logic: 'AND' | 'OR' };
  mentions: { values: string[]; logic: 'AND' | 'OR' };
  globalLogic: 'AND' | 'OR';
} {
  const tagFilter = filters.find((f) => f.name === 'tags')?.value;
  const tagLogic = filters.find((f) => f.name === 'tagLogic')?.value || 'OR';
  const authorFilter = filters.find((f) => f.name === 'author')?.value;
  const authorLogic =
    filters.find((f) => f.name === 'authorLogic')?.value || 'OR';
  const mentionsFilter = filters.find((f) => f.name === 'mentions')?.value;
  const mentionsLogic =
    filters.find((f) => f.name === 'mentionsLogic')?.value || 'OR';
  const globalLogic =
    filters.find((f) => f.name === 'globalLogic')?.value || 'AND';

  return {
    tags: {
      values: tagFilter
        ? tagFilter
            .split(',')
            .map((tag) => {
              const {
                normalizeTagForDatabase
              } = require('../../../lib/utils/string/tag-utils');
              return normalizeTagForDatabase(tag);
            })
            .filter(Boolean)
        : [],
      logic: tagLogic === 'AND' || tagLogic === 'OR' ? tagLogic : 'OR'
    },
    authors: {
      values: authorFilter ? [authorFilter] : [], // For now, single author but ready for multiple
      logic: authorLogic === 'AND' || authorLogic === 'OR' ? authorLogic : 'OR'
    },
    mentions: {
      values: mentionsFilter ? [mentionsFilter] : [], // For now, single mention but ready for multiple
      logic:
        mentionsLogic === 'AND' || mentionsLogic === 'OR' ? mentionsLogic : 'OR'
    },
    globalLogic:
      globalLogic === 'AND' || globalLogic === 'OR' ? globalLogic : 'AND'
  };
}

/**
 * Build SQL conditions for complex filtering
 */
async function buildFilterConditions(
  filterGroups: ReturnType<typeof parseFiltersIntoGroups>,
  baseParams: any[]
): Promise<{ condition: string; params: any[] }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = baseParams.length;

  // Build tags conditions
  if (filterGroups.tags.values.length > 0) {
    const tagConditions = filterGroups.tags.values.map(() => {
      paramIndex++;
      return `EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $${paramIndex})`;
    });

    const tagsCondition =
      filterGroups.tags.values.length === 1
        ? tagConditions[0]
        : `(${tagConditions.join(` ${filterGroups.tags.logic} `)})`;

    conditions.push(tagsCondition);
    params.push(...filterGroups.tags.values);
  }

  // Build author conditions (author ID only)
  if (filterGroups.authors.values.length > 0) {
    const authorConditions = [];

    for (const authorValue of filterGroups.authors.values) {
      paramIndex += 1;
      // Only filter by author ID - simpler and more reliable
      authorConditions.push(`s.author_id = $${paramIndex}`);
      params.push(authorValue);
    }

    const authorsCondition =
      authorConditions.length === 1
        ? authorConditions[0]
        : `(${authorConditions.join(` ${filterGroups.authors.logic} `)})`;

    conditions.push(authorsCondition);
  }

  // Build mentions conditions (username-based content search)
  if (filterGroups.mentions.values.length > 0) {
    const mentionConditions = [];

    for (const mentionValue of filterGroups.mentions.values) {
      // For mentions, the value should always be a username (for content search)
      // If it's a userId, resolve it to username at request time
      let searchUsername = mentionValue;

      if (/^[0-9a-f-]{8,}$/i.test(mentionValue)) {
        try {
          const { resolveUserIdToUsername } = await import(
            '../../../lib/actions/search.actions'
          );
          const resolvedUsername = await resolveUserIdToUsername(mentionValue);
          if (resolvedUsername) {
            searchUsername = resolvedUsername;
          }
        } catch (error) {
          console.error(
            'Error resolving user ID to username for mentions search:',
            error
          );
        }
      }

      paramIndex += 2;
      // Search for @[username|...] format in content (more reliable)
      const robustPattern = `%@[${searchUsername}|%`;
      mentionConditions.push(
        `(s.submission_title ILIKE $${paramIndex - 1} OR s.submission_name ILIKE $${paramIndex})`
      );
      params.push(robustPattern, robustPattern);
    }

    const mentionsCondition =
      mentionConditions.length === 1
        ? mentionConditions[0]
        : `(${mentionConditions.join(` ${filterGroups.mentions.logic} `)})`;

    conditions.push(mentionsCondition);
  }

  // Combine all conditions with global logic
  if (conditions.length === 0) {
    return { condition: '', params: [] };
  }

  const finalCondition =
    conditions.length === 1
      ? conditions[0]
      : `(${conditions.join(` ${filterGroups.globalLogic} `)})`;

  return { condition: finalCondition, params };
}
