'use server';

import sql from '../../../lib/db';

export interface SubmissionWithReplies {
  submission_id: number;
  submission_name: string;
  submission_title: string;
  submission_datetime: Date;
  user_id: number;
  author: string;
  author_bio?: string;
  tags: string[];
  thread_parent_id: number | null;
  replies?: SubmissionWithReplies[];
}

export type GetSubmissionsActionArguments = {
  onlyMine: boolean;
  userId?: string; // Internal database user ID only
  filters?: { name: string; value: string }[];
  page?: number;
  pageSize?: number;
  includeThreadReplies?: boolean;
};

export type GetSubmissionsActionResponse = {
  data?: {
    data: SubmissionWithReplies[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
    };
  };
  error?: string;
};

export interface GetSubmissionsPaginationCountResponse {
  data?: {
    totalRecords: number;
    expectedItems: number; // Items expected for current page size
  };
  error?: string;
}

/**
 * Pre-request to get pagination count for skeleton loader optimization
 * This allows us to show the exact number of skeleton items that will be loaded
 */
export async function getSubmissionsPaginationCount({
  onlyMine,
  userId,
  filters = [],
  pageSize = 10,
  includeThreadReplies = false
}: Omit<
  GetSubmissionsActionArguments,
  'page'
>): Promise<GetSubmissionsPaginationCountResponse> {
  if (onlyMine && !userId) {
    return {
      error: 'User ID is required for user-specific queries'
    };
  }

  const userIdNum = userId ? parseInt(userId) : null;

  try {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Handle thread replies filter
    if (!includeThreadReplies) {
      whereClause += ` AND s.thread_parent_id IS NULL`;
    }

    // Handle user filter (only mine)
    if (onlyMine && userIdNum) {
      whereClause += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(userIdNum);
      paramIndex++;
    }

    // Handle dynamic filters with global logic support
    const filterGroups: string[] = [];
    const globalLogicFilter = filters.find((f) => f.name === 'globalLogic');
    const globalLogic = globalLogicFilter?.value || 'AND';

    for (const filter of filters) {
      let groupCondition = '';

      switch (filter.name) {
        case 'author': {
          // Handle multiple authors with logic
          const authors = filter.value
            .split(',')
            .map((author) => author.trim())
            .filter(Boolean);

          if (authors.length > 0) {
            const authorLogicFilter = filters.find(
              (f) => f.name === 'authorLogic'
            );
            // When globalLogic is AND, force all individual filters to AND
            const authorLogic =
              globalLogic === 'AND' ? 'AND' : authorLogicFilter?.value || 'OR';

            if (authorLogic === 'AND') {
              // All authors must match (posts from all specified authors)
              // This would require posts to be from multiple authors, which is impossible
              // So we'll treat AND as requiring exact author match
              groupCondition = `s.user_id IN (${authors.map(() => `$${paramIndex++}`).join(',')})`;
              queryParams.push(...authors.map((author) => parseInt(author)));
            } else {
              // Any author can match (OR logic)
              groupCondition = `s.user_id IN (${authors.map(() => `$${paramIndex++}`).join(',')})`;
              queryParams.push(...authors.map((author) => parseInt(author)));
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'tags': {
          const tags = filter.value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

          if (tags.length > 0) {
            const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
            // When globalLogic is AND, force all individual filters to AND
            const tagLogic =
              globalLogic === 'AND' ? 'AND' : tagLogicFilter?.value || 'OR';

            if (tagLogic === 'AND') {
              // All tags must be present
              const tagConditions: string[] = [];
              for (const tag of tags) {
                tagConditions.push(`$${paramIndex} = ANY(s.tags)`);
                queryParams.push(tag.startsWith('#') ? tag.slice(1) : tag);
                paramIndex++;
              }
              groupCondition = tagConditions.join(' AND ');
            } else {
              // Any tag can be present (OR logic)
              const tagPlaceholders = tags
                .map(() => `$${paramIndex++}`)
                .join(',');
              groupCondition = `s.tags && ARRAY[${tagPlaceholders}]`;
              queryParams.push(
                ...tags.map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
              );
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'mentions': {
          const mentions = filter.value
            .split(',')
            .map((mention) => mention.trim())
            .filter(Boolean);

          if (mentions.length > 0) {
            const mentionsLogicFilter = filters.find(
              (f) => f.name === 'mentionsLogic'
            );
            // When globalLogic is AND, force all individual filters to AND
            const mentionsLogic =
              globalLogic === 'AND'
                ? 'AND'
                : mentionsLogicFilter?.value || 'OR';

            if (mentionsLogic === 'AND') {
              // All mentions must be present
              const mentionConditions: string[] = [];
              for (const mention of mentions) {
                mentionConditions.push(
                  `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`
                );
                queryParams.push(`%${mention}%`);
                paramIndex++;
              }
              groupCondition = mentionConditions.join(' AND ');
            } else {
              // Any mention can be present (OR logic)
              const mentionConditions = mentions.map((mention) => {
                const condition = `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`;
                queryParams.push(`%${mention}%`);
                paramIndex++;
                return condition;
              });
              groupCondition = mentionConditions.join(' OR ');
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'content': {
          groupCondition = `(s.submission_title ILIKE $${paramIndex} OR s.submission_name ILIKE $${paramIndex})`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'title': {
          groupCondition = `s.submission_title ILIKE $${paramIndex}`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'url': {
          groupCondition = `s.submission_url ILIKE $${paramIndex}`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'dateFrom': {
          groupCondition = `s.submission_datetime >= $${paramIndex}`;
          queryParams.push(filter.value);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'dateTo': {
          groupCondition = `s.submission_datetime <= $${paramIndex}`;
          queryParams.push(filter.value);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'search': {
          // Multi-word text search with OR logic
          const searchTerms = filter.value
            .trim()
            .split(/\s+/)
            .filter((term) => term.length >= 2) // Minimum 2 characters per term
            .map((term) => term.toLowerCase());

          if (searchTerms.length > 0) {
            const searchConditions = searchTerms.map((term) => {
              const condition = `(
                LOWER(s.submission_name) LIKE $${paramIndex} OR 
                LOWER(s.submission_title) LIKE $${paramIndex}
              )`;
              queryParams.push(`%${term}%`);
              paramIndex++;
              return condition;
            });
            groupCondition = searchConditions.join(' OR ');

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        // Skip logic filters as they're handled above
        case 'tagLogic':
        case 'authorLogic':
        case 'mentionsLogic':
        case 'globalLogic':
          break;
      }
    }

    // Apply global logic to combine filter groups
    if (filterGroups.length > 0) {
      const globalOperator = globalLogic === 'OR' ? ' OR ' : ' AND ';
      whereClause += ` AND (${filterGroups.join(globalOperator)})`;
    }

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQuery, queryParams);
    const totalRecords = parseInt(countResult[0]?.total || '0');

    // Calculate expected items for current page (will be pageSize or less if on last page)
    const expectedItems = Math.min(totalRecords, pageSize);

    return {
      data: {
        totalRecords,
        expectedItems
      }
    };
  } catch (error) {
    console.error('getSubmissionsPaginationCount error:', error);
    return {
      error: 'Failed to fetch pagination count'
    };
  }
}

export async function getSubmissionsAction({
  onlyMine,
  userId,
  filters = [],
  page = 1,
  pageSize = 10,
  includeThreadReplies = false
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  if (onlyMine && !userId) {
    return {
      error: 'User ID is required for user-specific queries'
    };
  }

  const userIdNum = userId ? parseInt(userId) : null;

  try {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Handle thread replies filter
    if (!includeThreadReplies) {
      whereClause += ` AND s.thread_parent_id IS NULL`;
    }

    // Handle user filter (only mine)
    if (onlyMine && userIdNum) {
      whereClause += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(userIdNum);
      paramIndex++;
    }

    // Handle dynamic filters with global logic support
    const filterGroups: string[] = [];
    const globalLogicFilter = filters.find((f) => f.name === 'globalLogic');
    const globalLogic = globalLogicFilter?.value || 'AND';

    for (const filter of filters) {
      let groupCondition = '';

      switch (filter.name) {
        case 'author': {
          // Handle multiple authors with logic
          const authors = filter.value
            .split(',')
            .map((author) => author.trim())
            .filter(Boolean);

          if (authors.length > 0) {
            const authorLogicFilter = filters.find(
              (f) => f.name === 'authorLogic'
            );
            // When globalLogic is AND, force all individual filters to AND
            const authorLogic =
              globalLogic === 'AND' ? 'AND' : authorLogicFilter?.value || 'OR';

            if (authorLogic === 'AND') {
              // All authors must match (posts from all specified authors)
              // This would require posts to be from multiple authors, which is impossible
              // So we'll treat AND as requiring exact author match
              groupCondition = `s.user_id IN (${authors.map(() => `$${paramIndex++}`).join(',')})`;
              queryParams.push(...authors.map((author) => parseInt(author)));
            } else {
              // Any author can match (OR logic)
              groupCondition = `s.user_id IN (${authors.map(() => `$${paramIndex++}`).join(',')})`;
              queryParams.push(...authors.map((author) => parseInt(author)));
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'tags': {
          const tags = filter.value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

          if (tags.length > 0) {
            const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
            // When globalLogic is AND, force all individual filters to AND
            const tagLogic =
              globalLogic === 'AND' ? 'AND' : tagLogicFilter?.value || 'OR';

            if (tagLogic === 'AND') {
              // All tags must be present
              const tagConditions: string[] = [];
              for (const tag of tags) {
                tagConditions.push(`$${paramIndex} = ANY(s.tags)`);
                queryParams.push(tag.startsWith('#') ? tag.slice(1) : tag);
                paramIndex++;
              }
              groupCondition = tagConditions.join(' AND ');
            } else {
              // Any tag can be present (OR logic)
              const tagPlaceholders = tags
                .map(() => `$${paramIndex++}`)
                .join(',');
              groupCondition = `s.tags && ARRAY[${tagPlaceholders}]`;
              queryParams.push(
                ...tags.map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
              );
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'mentions': {
          const mentions = filter.value
            .split(',')
            .map((mention) => mention.trim())
            .filter(Boolean);

          if (mentions.length > 0) {
            const mentionsLogicFilter = filters.find(
              (f) => f.name === 'mentionsLogic'
            );
            // When globalLogic is AND, force all individual filters to AND
            const mentionsLogic =
              globalLogic === 'AND'
                ? 'AND'
                : mentionsLogicFilter?.value || 'OR';

            if (mentionsLogic === 'AND') {
              // All mentions must be present
              const mentionConditions: string[] = [];
              for (const mention of mentions) {
                mentionConditions.push(
                  `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`
                );
                queryParams.push(`%${mention}%`);
                paramIndex++;
              }
              groupCondition = mentionConditions.join(' AND ');
            } else {
              // Any mention can be present (OR logic)
              const mentionConditions = mentions.map((mention) => {
                const condition = `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`;
                queryParams.push(`%${mention}%`);
                paramIndex++;
                return condition;
              });
              groupCondition = mentionConditions.join(' OR ');
            }

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        case 'content': {
          groupCondition = `(s.submission_title ILIKE $${paramIndex} OR s.submission_name ILIKE $${paramIndex})`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'title': {
          groupCondition = `s.submission_title ILIKE $${paramIndex}`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'url': {
          groupCondition = `s.submission_url ILIKE $${paramIndex}`;
          queryParams.push(`%${filter.value}%`);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'dateFrom': {
          groupCondition = `s.submission_datetime >= $${paramIndex}`;
          queryParams.push(filter.value);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'dateTo': {
          groupCondition = `s.submission_datetime <= $${paramIndex}`;
          queryParams.push(filter.value);
          paramIndex++;

          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
          break;
        }

        case 'search': {
          // Multi-word text search with OR logic
          const searchTerms = filter.value
            .trim()
            .split(/\s+/)
            .filter((term) => term.length >= 2) // Minimum 2 characters per term
            .map((term) => term.toLowerCase());

          if (searchTerms.length > 0) {
            const searchConditions = searchTerms.map((term) => {
              const condition = `(
                LOWER(s.submission_name) LIKE $${paramIndex} OR 
                LOWER(s.submission_title) LIKE $${paramIndex}
              )`;
              queryParams.push(`%${term}%`);
              paramIndex++;
              return condition;
            });
            groupCondition = searchConditions.join(' OR ');

            if (groupCondition) {
              filterGroups.push(`(${groupCondition})`);
            }
          }
          break;
        }

        // Skip logic filters as they're handled above
        case 'tagLogic':
        case 'authorLogic':
        case 'mentionsLogic':
        case 'globalLogic':
          break;
      }
    }

    // Apply global logic to combine filter groups
    if (filterGroups.length > 0) {
      const globalOperator = globalLogic === 'OR' ? ' OR ' : ' AND ';
      whereClause += ` AND (${filterGroups.join(globalOperator)})`;
    }

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQuery, queryParams);
    const totalRecords = parseInt(countResult[0]?.total || '0');

    // Calculate pagination
    const offset = (page - 1) * pageSize;

    // Main query with pagination
    const mainQuery = `
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_title,
        s.submission_url,
        s.submission_datetime,
        s.user_id,
        s.tags,
        s.thread_parent_id,
        u.name as author,
        u.bio as author_bio,
        (
          SELECT COUNT(*)::int
          FROM submissions replies
          WHERE replies.thread_parent_id = s.submission_id
        ) as reply_count,
        (
          SELECT json_agg(
            json_build_object(
              'submission_id', r.submission_id,
              'submission_name', r.submission_name,
              'submission_title', r.submission_title,
              'submission_datetime', r.submission_datetime,
              'user_id', r.user_id,
              'author', ru.name,
              'author_bio', ru.bio,
              'tags', r.tags,
              'thread_parent_id', r.thread_parent_id
            )
            ORDER BY r.submission_datetime ASC
          )
          FROM submissions r
          JOIN users ru ON r.user_id = ru.id
          WHERE r.thread_parent_id = s.submission_id
        ) as replies
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.submission_datetime DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(pageSize, offset);

    const result = await sql.unsafe(mainQuery, queryParams);

    // Process results
    const processedData: SubmissionWithReplies[] = result.map((row: any) => ({
      submission_id: row.submission_id,
      submission_name: row.submission_name,
      submission_title: row.submission_title,
      submission_datetime: new Date(row.submission_datetime),
      user_id: row.user_id,
      author: row.author,
      author_bio: row.author_bio,
      tags: row.tags || [],
      thread_parent_id: row.thread_parent_id,
      replies: row.replies || []
    }));

    return {
      data: {
        data: processedData,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalRecords
        }
      }
    };
  } catch (error) {
    console.error('getSubmissionsAction error:', error);
    return {
      error: 'Failed to fetch submissions'
    };
  }
}

// Helper function for the submissions manager
export async function getSubmissionsWithReplies({
  filters = [],
  page = 1,
  pageSize = 10,
  onlyMine = false,
  userId,
  includeThreadReplies = false
}: {
  filters?: { name: string; value: string }[];
  page?: number;
  pageSize?: number;
  onlyMine?: boolean;
  userId?: string;
  includeThreadReplies?: boolean;
}) {
  return await getSubmissionsAction({
    onlyMine,
    userId,
    filters,
    page,
    pageSize,
    includeThreadReplies
  });
}
