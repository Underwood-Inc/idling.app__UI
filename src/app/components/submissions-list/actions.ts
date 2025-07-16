'use server';

import { createFilterBuilder } from './query-builders/filter-builder';
import { SqlQueryBuilder } from './query-builders/sql-builder';
import {
  FilterGroup,
  GetSubmissionsActionArguments,
  GetSubmissionsActionResponse,
  GetSubmissionsPaginationCountResponse,
  SubmissionWithReplies
} from './types';

/**
 * Get pagination count for submissions
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
    // Build filters using centralized filter builder
    const filterBuilder = createFilterBuilder();
    const { whereClause, queryParams } = filterBuilder.buildFilters(
      filters as FilterGroup[],
      onlyMine,
      userIdNum,
      includeThreadReplies
    );

    // Build and execute count query
    const countQuery = SqlQueryBuilder.buildCountQuery(whereClause);
    const countResult = await SqlQueryBuilder.executeQuery(
      countQuery,
      queryParams
    );
    const totalRecords = parseInt(countResult[0]?.total || '0');

    // Calculate expected items for current page
    const expectedItems = Math.min(totalRecords, pageSize);

    return {
      data: {
        totalRecords,
        expectedItems
      }
    };
  } catch (error) {
    console.error('Error in getSubmissionsPaginationCount:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get submissions with filtering and pagination
 */
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
    // Check if onlyReplies filter is active
    const onlyRepliesFilter = filters.find((f) => f.name === 'onlyReplies');
    const isOnlyReplies = onlyRepliesFilter?.value === 'true';

    // Build filters using centralized filter builder
    const filterBuilder = createFilterBuilder();
    const { whereClause, queryParams } = filterBuilder.buildFilters(
      filters as FilterGroup[],
      onlyMine,
      userIdNum,
      includeThreadReplies
    );

    // Get total count
    const countQuery = SqlQueryBuilder.buildCountQuery(whereClause);
    const countResult = await SqlQueryBuilder.executeQuery(
      countQuery,
      queryParams
    );
    const totalRecords = parseInt(countResult[0]?.total || '0');

    // Build and execute main query
    const mainQuery = SqlQueryBuilder.buildMainQuery(
      whereClause,
      isOnlyReplies,
      page,
      pageSize
    );
    const rows = await SqlQueryBuilder.executeQuery(mainQuery, queryParams);

    // Process results
    const submissions = SqlQueryBuilder.processQueryResults(
      rows,
      isOnlyReplies
    );

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
    console.error('Error in getSubmissionsAction:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get submissions with replies (wrapper for compatibility)
 */
export async function getSubmissionsWithReplies({
  filters = [],
  page = 1,
  pageSize = 10,
  onlyMine = false,
  userId = '',
  includeThreadReplies = false
}: {
  filters?: FilterGroup[];
  page?: number;
  pageSize?: number;
  onlyMine?: boolean;
  userId?: string;
  includeThreadReplies?: boolean;
}): Promise<GetSubmissionsActionResponse> {
  return getSubmissionsAction({
    onlyMine,
    userId,
    filters,
    page,
    pageSize,
    includeThreadReplies
  });
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(
  submissionId: number
): Promise<{ data?: SubmissionWithReplies; error?: string }> {
  try {
    const query = `
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_title,
        s.submission_datetime,
        s.user_id,
        u.name as author,
        u.bio as author_bio,
        s.tags,
        s.thread_parent_id
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.submission_id = $1
    `;

    const rows = await SqlQueryBuilder.executeQuery(query, [submissionId]);

    if (rows.length === 0) {
      return { error: 'Submission not found' };
    }

    const submissions = SqlQueryBuilder.processQueryResults(rows, false);
    return { data: submissions[0] };
  } catch (error) {
    console.error('Error in getSubmissionById:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
