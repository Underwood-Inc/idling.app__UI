'use server';

import sql from '../../../lib/db';

export interface SubmissionWithReplies {
  submission_id: number;
  submission_name: string;
  submission_title: string;
  submission_datetime: Date | null;
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

// Helper function to extract user IDs from author filter values
function extractUserIdsFromAuthorFilters(authors: string[]): number[] {
  return authors
    .map((author) => {
      // Handle username|userId format
      if (author.includes('|')) {
        const [, userId] = author.split('|');
        return parseInt(userId);
      }
      // Handle legacy numeric-only format
      return parseInt(author);
    })
    .filter((authorId) => !isNaN(authorId) && authorId > 0);
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

    // Check if onlyReplies filter is active
    const onlyRepliesFilter = filters.find((f) => f.name === 'onlyReplies');
    const isOnlyReplies = onlyRepliesFilter?.value === 'true';

    // Handle thread replies filter - but skip if onlyReplies is active
    if (!includeThreadReplies && !isOnlyReplies) {
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

    // Handle multiple tag filters as a single group
    const tagFilters = filters.filter((f) => f.name === 'tags');
    if (tagFilters.length > 0) {
      const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
      const tagLogic = tagLogicFilter?.value || 'OR';
      
      // Each tag filter is now a separate entry, not comma-separated
      const allTags = tagFilters.map(f => f.value.trim()).filter(Boolean);

      if (allTags.length > 0) {
        let tagGroupCondition = '';
        
        if (tagLogic === 'AND') {
          // All tags must be present
          const tagConditions: string[] = [];
          for (const tag of allTags) {
            tagConditions.push(`$${paramIndex} = ANY(s.tags)`);
            queryParams.push(tag.startsWith('#') ? tag.slice(1) : tag);
            paramIndex++;
          }
          tagGroupCondition = tagConditions.join(' AND ');
        } else {
          // Any tag can be present (OR logic)
          const tagPlaceholders = allTags
            .map(() => `$${paramIndex++}`)
            .join(',');
          tagGroupCondition = `s.tags && ARRAY[${tagPlaceholders}]`;
          queryParams.push(
            ...allTags.map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
          );
        }

        if (tagGroupCondition) {
          filterGroups.push(`(${tagGroupCondition})`);
        }
      }
    }

    // Process other filters - collect multiple entries of same type
    const authorFilters = filters.filter((f) => f.name === 'author');
    const mentionFilters = filters.filter((f) => f.name === 'mentions');
    const searchFilters = filters.filter((f) => f.name === 'search');
    
    // Handle author filters
    if (authorFilters.length > 0) {
      const authors = authorFilters.map((f) => f.value.trim()).filter(Boolean);
      
      if (authors.length > 0) {
        const authorLogicFilter = filters.find((f) => f.name === 'authorLogic');
        const authorLogic = globalLogic === 'AND' ? 'AND' : authorLogicFilter?.value || 'OR';

        // Extract user IDs from username|userId format
        const validAuthorIds = extractUserIdsFromAuthorFilters(authors);

        if (validAuthorIds.length > 0) {
          const groupCondition = `s.user_id IN (${validAuthorIds.map(() => `$${paramIndex++}`).join(',')})`;
          queryParams.push(...validAuthorIds);
          
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        }
      }
    }

    // Handle mention filters
    if (mentionFilters.length > 0) {
      const mentions = mentionFilters.map((f) => f.value.trim()).filter(Boolean);
      
      if (mentions.length > 0) {
        const mentionsLogicFilter = filters.find((f) => f.name === 'mentionsLogic');
        const mentionsLogic = globalLogic === 'AND' ? 'AND' : mentionsLogicFilter?.value || 'OR';

        if (mentionsLogic === 'AND') {
          // All mentions must be present
          const mentionConditions: string[] = [];
          for (const mention of mentions) {
            const username = mention.includes('|') ? mention.split('|')[0] : mention;
            mentionConditions.push(
              `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`
            );
            queryParams.push(`%${username}%`);
            paramIndex++;
          }
          const groupCondition = mentionConditions.join(' AND ');
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        } else {
          // Any mention can be present (OR logic)
          const mentionConditions = mentions.map((mention) => {
            const username = mention.includes('|') ? mention.split('|')[0] : mention;
            const condition = `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`;
            queryParams.push(`%${username}%`);
            paramIndex++;
            return condition;
          });
          const groupCondition = mentionConditions.join(' OR ');
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        }
      }
    }

    // Handle search filters
    if (searchFilters.length > 0) {
      const searchValues = searchFilters.map((f) => f.value.trim()).filter((v) => v.length >= 2);
      
      if (searchValues.length > 0) {
        const searchLogicFilter = filters.find((f) => f.name === 'searchLogic');
        const searchLogic = globalLogic === 'AND' ? 'AND' : searchLogicFilter?.value || 'OR';

        const allSearchConditions: string[] = [];
        
        for (const searchValue of searchValues) {
          // Parse search with quote support
          const terms: string[] = [];
          const regex = /"([^"]+)"|(\S+)/g;
          let match;

          while ((match = regex.exec(searchValue)) !== null) {
            const quotedTerm = match[1];
            const unquotedTerm = match[2];
            const term = quotedTerm || unquotedTerm;
            if (term && term.length >= 2) {
              terms.push(term.toLowerCase());
            }
          }

          if (terms.length > 0) {
            const searchConditions = terms.map((term) => {
              const condition = `(
                LOWER(s.submission_name) LIKE $${paramIndex} OR 
                LOWER(s.submission_title) LIKE $${paramIndex}
              )`;
              queryParams.push(`%${term}%`);
              paramIndex++;
              return condition;
            });
            
            const termOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
            allSearchConditions.push(`(${searchConditions.join(termOperator)})`);
          }
        }
        
        if (allSearchConditions.length > 0) {
          const searchOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
          const groupCondition = allSearchConditions.join(searchOperator);
          filterGroups.push(`(${groupCondition})`);
        }
      }
    }

    // Handle remaining single-value filters
    for (const filter of filters) {
      let groupCondition = '';

      switch (filter.name) {
        case 'tags':
        case 'author':
        case 'mentions':
        case 'search':
          // Skip - already handled above
          break;
          
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

        case 'onlyReplies': {
          // Filter to show only replies (posts with thread_parent_id)
          if (filter.value === 'true') {
            groupCondition = `s.thread_parent_id IS NOT NULL`;
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
        case 'searchLogic':
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

    // Debug logging for pagination count
    // eslint-disable-next-line no-console
    console.log('Pagination count debug:', {
      isOnlyReplies,
      includeThreadReplies,
      totalRecords,
      whereClause,
      queryParams
    });

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

    // Check if onlyReplies filter is active
    const onlyRepliesFilter = filters.find((f) => f.name === 'onlyReplies');
    const isOnlyReplies = onlyRepliesFilter?.value === 'true';

    // Handle thread replies filter - but skip if onlyReplies is active
    if (!includeThreadReplies && !isOnlyReplies) {
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

    // Handle multiple tag filters as a single group
    const tagFilters = filters.filter((f) => f.name === 'tags');
    if (tagFilters.length > 0) {
      const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
      const tagLogic = tagLogicFilter?.value || 'OR';
      
      // Each tag filter is now a separate entry, not comma-separated
      const allTags = tagFilters.map(f => f.value.trim()).filter(Boolean);

      if (allTags.length > 0) {
        let tagGroupCondition = '';
        
        if (tagLogic === 'AND') {
          // All tags must be present
          const tagConditions: string[] = [];
          for (const tag of allTags) {
            tagConditions.push(`$${paramIndex} = ANY(s.tags)`);
            queryParams.push(tag.startsWith('#') ? tag.slice(1) : tag);
            paramIndex++;
          }
          tagGroupCondition = tagConditions.join(' AND ');
        } else {
          // Any tag can be present (OR logic)
          const tagPlaceholders = allTags
            .map(() => `$${paramIndex++}`)
            .join(',');
          tagGroupCondition = `s.tags && ARRAY[${tagPlaceholders}]`;
          queryParams.push(
            ...allTags.map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
          );
        }

        if (tagGroupCondition) {
          filterGroups.push(`(${tagGroupCondition})`);
        }
      }
    }

    // Process other filters - collect multiple entries of same type
    const authorFilters = filters.filter((f) => f.name === 'author');
    const mentionFilters = filters.filter((f) => f.name === 'mentions');
    const searchFilters = filters.filter((f) => f.name === 'search');
    
    // Handle author filters
    if (authorFilters.length > 0) {
      const authors = authorFilters.map((f) => f.value.trim()).filter(Boolean);
      
      if (authors.length > 0) {
        const authorLogicFilter = filters.find((f) => f.name === 'authorLogic');
        const authorLogic = globalLogic === 'AND' ? 'AND' : authorLogicFilter?.value || 'OR';

        // Extract user IDs from username|userId format
        const validAuthorIds = extractUserIdsFromAuthorFilters(authors);

        if (validAuthorIds.length > 0) {
          const groupCondition = `s.user_id IN (${validAuthorIds.map(() => `$${paramIndex++}`).join(',')})`;
          queryParams.push(...validAuthorIds);
          
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        }
      }
    }

    // Handle mention filters
    if (mentionFilters.length > 0) {
      const mentions = mentionFilters.map((f) => f.value.trim()).filter(Boolean);
      
      if (mentions.length > 0) {
        const mentionsLogicFilter = filters.find((f) => f.name === 'mentionsLogic');
        const mentionsLogic = globalLogic === 'AND' ? 'AND' : mentionsLogicFilter?.value || 'OR';

        if (mentionsLogic === 'AND') {
          // All mentions must be present
          const mentionConditions: string[] = [];
          for (const mention of mentions) {
            const username = mention.includes('|') ? mention.split('|')[0] : mention;
            mentionConditions.push(
              `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`
            );
            queryParams.push(`%${username}%`);
            paramIndex++;
          }
          const groupCondition = mentionConditions.join(' AND ');
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        } else {
          // Any mention can be present (OR logic)
          const mentionConditions = mentions.map((mention) => {
            const username = mention.includes('|') ? mention.split('|')[0] : mention;
            const condition = `(s.submission_name ILIKE $${paramIndex} OR s.submission_title ILIKE $${paramIndex})`;
            queryParams.push(`%${username}%`);
            paramIndex++;
            return condition;
          });
          const groupCondition = mentionConditions.join(' OR ');
          if (groupCondition) {
            filterGroups.push(`(${groupCondition})`);
          }
        }
      }
    }

    // Handle search filters
    if (searchFilters.length > 0) {
      const searchValues = searchFilters.map((f) => f.value.trim()).filter((v) => v.length >= 2);
      
      if (searchValues.length > 0) {
        const searchLogicFilter = filters.find((f) => f.name === 'searchLogic');
        const searchLogic = globalLogic === 'AND' ? 'AND' : searchLogicFilter?.value || 'OR';

        const allSearchConditions: string[] = [];
        
        for (const searchValue of searchValues) {
          // Parse search with quote support
          const terms: string[] = [];
          const regex = /"([^"]+)"|(\S+)/g;
          let match;

          while ((match = regex.exec(searchValue)) !== null) {
            const quotedTerm = match[1];
            const unquotedTerm = match[2];
            const term = quotedTerm || unquotedTerm;
            if (term && term.length >= 2) {
              terms.push(term.toLowerCase());
            }
          }

          if (terms.length > 0) {
            const searchConditions = terms.map((term) => {
              const condition = `(
                LOWER(s.submission_name) LIKE $${paramIndex} OR 
                LOWER(s.submission_title) LIKE $${paramIndex}
              )`;
              queryParams.push(`%${term}%`);
              paramIndex++;
              return condition;
            });
            
            const termOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
            allSearchConditions.push(`(${searchConditions.join(termOperator)})`);
          }
        }
        
        if (allSearchConditions.length > 0) {
          const searchOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
          const groupCondition = allSearchConditions.join(searchOperator);
          filterGroups.push(`(${groupCondition})`);
        }
      }
    }

    // Handle remaining single-value filters
    for (const filter of filters) {
      let groupCondition = '';

      switch (filter.name) {
        case 'tags':
        case 'author':
        case 'mentions':
        case 'search':
          // Skip - already handled above
          break;
          
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

        case 'onlyReplies': {
          // Filter to show only replies (posts with thread_parent_id)
          if (filter.value === 'true') {
            groupCondition = `s.thread_parent_id IS NOT NULL`;
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
        case 'searchLogic':
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

    // Main query with pagination - different structure for replies vs posts
    let mainQuery: string;
    
    if (isOnlyReplies) {
      // Simplified query for only replies - no nested replies subquery needed
      mainQuery = `
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
          0 as reply_count,
          NULL as replies
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.submission_datetime DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    } else {
      // Full query with nested replies for posts
      mainQuery = `
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
    }

    queryParams.push(pageSize, offset);

    const result = await sql.unsafe(mainQuery, queryParams);

    // Debug logging for the first few results to understand timestamp issues
    if (result.length > 0) {
      // eslint-disable-next-line no-console
      console.log('First few results from database:', {
        isOnlyReplies,
        count: result.length,
        firstResult: {
          submission_id: result[0]?.submission_id,
          raw_submission_datetime: result[0]?.submission_datetime,
          typeof_datetime: typeof result[0]?.submission_datetime,
          thread_parent_id: result[0]?.thread_parent_id
        },
        secondResult: result[1] ? {
          submission_id: result[1]?.submission_id,
          raw_submission_datetime: result[1]?.submission_datetime,
          typeof_datetime: typeof result[1]?.submission_datetime,
          thread_parent_id: result[1]?.thread_parent_id
        } : null
      });
    }

    // Process results with debug logging
    const processedData: SubmissionWithReplies[] = result.map((row: any) => {
      let mainDate: Date | null = null;
      
      try {
        const d = new Date(row.submission_datetime);
        if (!isNaN(d.getTime()) && d.getTime() > 0) {
          mainDate = d;
        } else {
          // eslint-disable-next-line no-console
          console.error('Invalid main submission_datetime (invalid date):', {
            submission_id: row.submission_id,
            raw_datetime: row.submission_datetime,
            parsed_time: d.getTime(),
            isOnlyReplies,
            thread_parent_id: row.thread_parent_id
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Invalid main submission_datetime (parse error):', {
          submission_id: row.submission_id,
          raw_datetime: row.submission_datetime,
          error: error instanceof Error ? error.message : String(error),
          isOnlyReplies,
          thread_parent_id: row.thread_parent_id
        });
      }

      return {
      submission_id: row.submission_id,
      submission_name: row.submission_name,
      submission_title: row.submission_title,
        submission_datetime: mainDate,
      user_id: row.user_id,
      author: row.author,
      author_bio: row.author_bio,
      tags: row.tags || [],
      thread_parent_id: row.thread_parent_id,
        replies: Array.isArray(row.replies)
          ? row.replies.map((reply: any) => {
              let dateValue = reply.submission_datetime;
              let parsedDate: Date | null = null;
              
              if (dateValue && dateValue !== 0 && dateValue !== '0') {
                try {
                  const d = new Date(dateValue);
                  if (!isNaN(d.getTime()) && d.getTime() > 0) {
                    parsedDate = d;
                  } else {
                    // eslint-disable-next-line no-console
                    console.error('Invalid nested reply submission_datetime (invalid date):', {
                      reply_id: reply.submission_id,
                      raw_datetime: dateValue,
                      parsed_time: d.getTime(),
                      parent_id: row.submission_id
                    });
                  }
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('Invalid nested reply submission_datetime (parse error):', {
                    reply_id: reply.submission_id,
                    raw_datetime: dateValue,
                    error: error instanceof Error ? error.message : String(error),
                    parent_id: row.submission_id
                  });
                }
              } else {
                // eslint-disable-next-line no-console
                console.warn('Missing or zero nested reply submission_datetime:', {
                  reply_id: reply.submission_id,
                  raw_datetime: dateValue,
                  parent_id: row.submission_id
                });
              }
              
              return {
                ...reply,
                submission_datetime: parsedDate
              };
            })
          : []
      };
    });

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

/**
 * Get a single submission by ID with all its replies
 * Used for refreshing individual posts
 */
export async function getSubmissionById(
  submissionId: number
): Promise<{ data?: SubmissionWithReplies; error?: string }> {
  try {
    // Get the main submission
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
      WHERE s.submission_id = $1
    `;

    const result = await sql.unsafe(mainQuery, [submissionId]);

    if (result.length === 0) {
      return { error: 'Submission not found' };
    }

    const row = result[0];

    // Process the result with the same logic as getSubmissionsAction
    let mainDate: Date | null = null;
    
    try {
      const d = new Date(row.submission_datetime);
      if (!isNaN(d.getTime()) && d.getTime() > 0) {
        mainDate = d;
      } else {
        console.error('Invalid submission_datetime (invalid date):', {
          submission_id: row.submission_id,
          raw_datetime: row.submission_datetime,
          parsed_time: d.getTime()
        });
      }
    } catch (error) {
      console.error('Invalid submission_datetime (parse error):', {
        submission_id: row.submission_id,
        raw_datetime: row.submission_datetime,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    const processedSubmission: SubmissionWithReplies = {
      submission_id: row.submission_id,
      submission_name: row.submission_name,
      submission_title: row.submission_title,
      submission_datetime: mainDate,
      user_id: row.user_id,
      author: row.author,
      author_bio: row.author_bio,
      tags: row.tags || [],
      thread_parent_id: row.thread_parent_id,
      replies: Array.isArray(row.replies)
        ? row.replies.map((reply: any) => {
            let dateValue = reply.submission_datetime;
            let parsedDate: Date | null = null;
            
            if (dateValue && dateValue !== 0 && dateValue !== '0') {
              try {
                const d = new Date(dateValue);
                if (!isNaN(d.getTime()) && d.getTime() > 0) {
                  parsedDate = d;
                } else {
                  console.error('Invalid reply submission_datetime (invalid date):', {
                    reply_id: reply.submission_id,
                    raw_datetime: dateValue,
                    parsed_time: d.getTime(),
                    parent_id: row.submission_id
                  });
                }
              } catch (error) {
                console.error('Invalid reply submission_datetime (parse error):', {
                  reply_id: reply.submission_id,
                  raw_datetime: dateValue,
                  error: error instanceof Error ? error.message : String(error),
                  parent_id: row.submission_id
                });
              }
            } else {
              console.warn('Missing or zero reply submission_datetime:', {
                reply_id: reply.submission_id,
                raw_datetime: dateValue,
                parent_id: row.submission_id
              });
            }
            
            return {
              ...reply,
              submission_datetime: parsedDate
            };
          })
        : []
    };

    return { data: processedSubmission };
  } catch (error) {
    console.error('getSubmissionById error:', error);
    return { error: 'Failed to fetch submission' };
  }
}
