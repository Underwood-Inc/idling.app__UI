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
 * Fetch replies for a specific submission thread
 */
export async function getSubmissionReplies(
  parentId: number
): Promise<SubmissionWithReplies[]> {
  try {
    const repliesResult = await sql<any[]>`
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
      WHERE thread_parent_id = ${parentId}
      ORDER BY submission_datetime ASC
    `;

    const replies: SubmissionWithReplies[] = repliesResult.map((row: any) => {
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
          : null
      };
      return submission;
    });

    // Recursively fetch replies for each reply (nested threads)
    for (const reply of replies) {
      const nestedReplies = await getSubmissionReplies(reply.submission_id);
      if (nestedReplies.length > 0) {
        reply.replies = nestedReplies;
      }
    }

    return replies;
  } catch (error) {
    console.error('Error fetching submission replies:', error);
    return [];
  }
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
  try {
    // First get the main submissions (excluding thread replies)
    const mainSubmissionsResponse = await getSubmissionsAction({
      onlyMine,
      providerAccountId,
      filters,
      page,
      pageSize,
      includeThreadReplies: false // Always exclude replies for main query
    });

    if (!mainSubmissionsResponse.data) {
      return mainSubmissionsResponse;
    }

    const submissionsWithReplies: SubmissionWithReplies[] = [];

    // For each main submission, fetch its replies
    for (const submission of mainSubmissionsResponse.data.data) {
      const submissionWithReplies: SubmissionWithReplies = { ...submission };

      // Fetch replies for this submission
      const replies = await getSubmissionReplies(submission.submission_id);
      if (replies.length > 0) {
        submissionWithReplies.replies = replies;
      }

      submissionsWithReplies.push(submissionWithReplies);
    }

    return {
      data: {
        data: submissionsWithReplies,
        pagination: mainSubmissionsResponse.data.pagination
      }
    };
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
  // eslint-disable-next-line no-console
  console.log('🔍 [BACKEND] getSubmissionsAction called with:', {
    onlyMine,
    providerAccountId: providerAccountId
      ? `${providerAccountId.substring(0, 8)}...`
      : 'null',
    filters,
    page,
    pageSize
  });

  if (!providerAccountId) {
    return {
      error: 'Provider account ID is required'
    };
  }

  try {
    const offset = (page - 1) * pageSize;
    const tagFilter = filters.find((f) => f.name === 'tags')?.value;
    const tagLogicFilter =
      filters.find((f) => f.name === 'tagLogic')?.value || 'OR'; // Default to OR

    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] Extracted filters:', {
      tagFilter,
      tagLogicFilter,
      filtersCount: filters.length
    });

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

    if (tagFilter) {
      // Parse multiple tags from comma-separated string
      const tags = tagFilter
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      // eslint-disable-next-line no-console
      console.log('🔍 [BACKEND] Parsed tags:', {
        tags,
        tagCount: tags.length,
        logic: tagLogicFilter
      });

      if (tags.length === 1) {
        // Single tag - use simple EXISTS
        whereConditions.push(
          'EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $' +
            (queryParams.length + 1) +
            ')'
        );
        queryParams.push(tags[0]);
        // eslint-disable-next-line no-console
        console.log('🔍 [BACKEND] Using single tag logic');
      } else if (tags.length > 1) {
        if (tagLogicFilter === 'AND') {
          // AND logic - submissions must contain ALL selected tags
          const tagConditions = tags.map((_, index) => {
            const paramIndex = queryParams.length + index + 1;
            return `EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $${paramIndex})`;
          });

          whereConditions.push(`(${tagConditions.join(' AND ')})`);
          queryParams.push(...tags);
          // eslint-disable-next-line no-console
          console.log(
            '🔍 [BACKEND] Using AND logic - posts must have ALL tags'
          );
        } else {
          // OR logic - submissions must contain ANY of the selected tags (default)
          const tagConditions = tags.map((_, index) => {
            const paramIndex = queryParams.length + index + 1;
            return `EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $${paramIndex})`;
          });

          whereConditions.push(`(${tagConditions.join(' OR ')})`);
          queryParams.push(...tags);
          // eslint-disable-next-line no-console
          console.log('🔍 [BACKEND] Using OR logic - posts must have ANY tag');
        }
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] SQL WHERE clause:', whereClause);
    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] Query parameters:', queryParams);

    // Count query
    const countQueryText = `
      SELECT COUNT(*) 
      FROM submissions s
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQueryText, queryParams);
    const totalRecords = parseInt(countResult[0].count);

    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] Count query result:', { totalRecords });

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

    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] Query execution result:', {
      resultCount: submissionsResult?.length || 0,
      totalRecords,
      page,
      pageSize,
      offset
    });

    if (!submissionsResult || submissionsResult.length === 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [BACKEND] Returning empty result set');
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

    // Log sample of returned data (first submission's tags for verification)
    if (submissions.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [BACKEND] Sample result verification:', {
        firstSubmissionId: submissions[0].submission_id,
        firstSubmissionTags: submissions[0].tags,
        lastSubmissionId: submissions[submissions.length - 1].submission_id,
        lastSubmissionTags: submissions[submissions.length - 1].tags
      });
    }

    const response = {
      data: {
        data: submissions,
        pagination: {
          currentPage: page,
          pageSize,
          totalRecords
        }
      }
    };

    // eslint-disable-next-line no-console
    console.log('🔍 [BACKEND] Final response metadata:', {
      dataCount: response.data.data.length,
      pagination: response.data.pagination,
      success: true
    });

    return response;
  } catch (error) {
    console.error('🔍 [BACKEND] Error in getSubmissions:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to fetch submissions'
    };
  }
}
