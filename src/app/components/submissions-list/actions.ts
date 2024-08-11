'use server';
import sql from '../../../lib/db';
import { Filter } from '../filter-bar/FilterBar';
import { Submission } from '../submission-forms/schema';

export interface Pagination {
  from: number;
  to: number;
  currentPage: number;
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
  page = 0
}: {
  onlyMine: boolean;
  providerAccountId: string;
  filters: Filter[];
  page: number;
}): Promise<PaginatedResponse<Submission>> {
  let fromRow = 0;
  let toRow = 10;
  let submissions: Submission[] = [];

  if (page > 1) {
    fromRow = page + 10;
    toRow = fromRow + 10;
  }

  const pagination: Pagination = {
    from: fromRow,
    to: toRow,
    currentPage: page,
    totalPages: 0,
    totalRecords: 0
  };

  const response: PaginatedResponse<Submission> = {
    result: [],
    pagination
  };

  if (onlyMine && providerAccountId) {
    const submissionsCount =
      await sql`SELECT COUNT(*) FROM submissions WHERE author_id = ${providerAccountId}`;

    submissions = await sql`
      SELECT * FROM submissions WHERE author_id = ${providerAccountId} ORDER BY submission_datetime DESC LIMIT 10 OFFSET ${(page - 1) * 10}
    `;

    response.pagination.totalRecords = submissionsCount[0].count;
    response.result = submissions;
  } else if (!onlyMine) {
    const tags = filters
      .find((filter) => filter.name === 'tags')
      ?.value.split(',')
      .map((value) => `#${value}`); // prepend a #. values come from URL so they are excluded lest the URL break expected params behavior
    const submissionsCount =
      await sql`SELECT COUNT(*) FROM submissions ${tags ? sql`where tags && ${tags}` : sql``}`;

    // select * where post contents contains any of the entries in the `tags` string array
    // @> is a "has both/all" match
    // && is a "contains any" match
    submissions = await sql`
      SELECT * FROM submissions ${tags ? sql`WHERE tags && ${tags}` : sql``}ORDER BY submission_datetime DESC LIMIT 10 OFFSET ${(page - 1) * 10}
    `;

    response.pagination.totalRecords = submissionsCount[0].count;

    response.result = submissions;
  }

  return response;
}

export interface GetSubmissionsActionArguments {
  currentPage: number;
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
 * CREATE new submission action
 * performs SQL
 */
export async function getSubmissionsAction({
  currentPage = 0,
  filters,
  onlyMine = false,
  providerAccountId = ''
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  const pagedSubmissions = await getSubmissions({
    onlyMine,
    providerAccountId,
    filters,
    page: currentPage
  });

  return {
    data: pagedSubmissions,
    error: '',
    message: ''
  };
}
