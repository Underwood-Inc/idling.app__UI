'use server';
import { PageSize } from 'src/lib/state/PaginationContext';
import sql from '../../../lib/db';
import { Filter } from '../filter-bar/FilterBar';
import { Submission } from '../submission-forms/schema';

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface PaginatedResponse<T> {
  result: T[];
  pagination: Pagination;
}

export async function getSubmissions({
  onlyMine = false,
  providerAccountId = '',
  filters,
  page = 0,
  pageSize = PageSize.TEN
}: {
  onlyMine: boolean;
  providerAccountId: string;
  filters: Filter[];
  page: number;
  pageSize: PageSize;
}): Promise<PaginatedResponse<Submission>> {
  let submissions: Submission[] = [];

  const pagination: Pagination = {
    currentPage: page,
    pageSize,
    totalPages: 0,
    totalRecords: 0
  };

  const response: PaginatedResponse<Submission> = {
    result: [],
    pagination
  };

  const tagFilters = filters.find((filter) => filter.name === 'tags')?.value;

  const tags = tagFilters
    ? tagFilters.split(',').map((value) => `#${value}`) || []
    : null; // prepend a #. values come from URL so they are excluded lest the URL break expected params behavior

  console.log('filters', filters);
  console.log('tags', tags);

  if (onlyMine && providerAccountId) {
    const submissionsCount = await sql`
        SELECT COUNT(*)
        FROM submissions ${
          tags
            ? sql`WHERE tags && ${tags} AND author_id = ${providerAccountId}`
            : sql`WHERE author_id = ${providerAccountId}`
        }
      `;

    submissions = await sql`
      SELECT * FROM submissions ${
        tags
          ? sql`WHERE tags && ${tags} AND author_id = ${providerAccountId}`
          : sql`WHERE author_id = ${providerAccountId}`
      }
      ORDER BY submission_datetime DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;
    // TODO: add zod schema parsing for `submissions`

    response.pagination.totalRecords = submissionsCount[0].count;
    response.result = submissions;
  } else if (!onlyMine) {
    const submissionsCount =
      await sql`SELECT COUNT(*) FROM submissions ${tags ? sql`where tags && ${tags}` : sql``}`;

    submissions = await sql`
      SELECT * FROM submissions ${tags ? sql`WHERE tags && ${tags}` : sql``}
      ORDER BY submission_datetime DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;
    // TODO: add zod schema parsing for `submissions`

    response.pagination.totalRecords = submissionsCount[0].count;
    response.result = submissions;
  }

  // console.log('response', response);

  return response;
}

export interface GetSubmissionsActionArguments {
  currentPage: number;
  pageSize: number;
  onlyMine: boolean;
  providerAccountId: string;
  filters: Filter[];
}

export type GetSubmissionsActionResponse = {
  data?: PaginatedResponse<Submission>;
  message?: string;
  error?: string;
};

/**
 * GET submissions
 * performs SQL
 */
export async function getSubmissionsAction({
  currentPage = 0,
  filters,
  onlyMine = false,
  providerAccountId = '',
  pageSize = 10
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  const pagedSubmissions = await getSubmissions({
    onlyMine,
    providerAccountId,
    filters,
    page: currentPage,
    pageSize
  });

  return {
    data: pagedSubmissions,
    error: '',
    message: ''
  };
}
