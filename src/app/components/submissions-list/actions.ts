'use server';
import sql from '../../../lib/db';
import { PostFilters } from '../../posts/page';
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

export async function getSubmissions(
  onlyMine = false,
  providerAccountId: string,
  filters: Filter<PostFilters>[],
  page = 1
): Promise<PaginatedResponse<Submission>> {
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
    submissions = await sql`
      SELECT * from (
        SELECT *, ROW_NUMBER() OVER (ORDER BY submission_id DESC) as row_num from submissions
        WHERE author_id = ${providerAccountId}
      ) sub
      WHERE row_num BETWEEN ${fromRow} AND ${toRow}
    `;

    // old
    // SELECT * FROM submissions
    //   WHERE author_id = ${providerAccountId}
    //   order by submission_datetime desc

    response.result = submissions;
  } else if (!onlyMine) {
    const tags = filters
      .find((filter) => filter.name === 'tags')
      ?.value.split(',')
      .map((value) => `#${value}`); // prepend a #. values come from URL so they are excluded lest the URL break expected params behavior

    // select * where post contents contains any of the entries in the `tags` string array
    // @> is a "has both/all" match
    // && is a "contains any" match
    submissions = await sql`
      SELECT * from (
        SELECT *, ROW_NUMBER() OVER (ORDER BY submission_id DESC) as row_num from submissions
      ) sub
      WHERE row_num BETWEEN ${fromRow} AND ${toRow}
      ${tags ? sql`AND WHERE tags && ${tags}` : sql``}
    `;

    // old
    // SELECT * FROM submissions
    // ${tags ? sql`where tags && ${tags}` : sql``}
    //   order by submission_datetime desc

    response.result = submissions;
  }

  const submissionsCount = await sql`SELECT COUNT(*) FROM submissions`;
  console.info('submissionsCount', submissionsCount[0].count);
  response.pagination.totalRecords = submissionsCount[0].count;

  return response;
}

/**
 * CREATE new submission action
 * performs SQL
 */
export async function getSubmissionsAction(
  prevState: {
    message?: string;
    error?: string;
    data?: PaginatedResponse<Submission>;
  },
  formData: FormData
): Promise<{
  data?: PaginatedResponse<Submission>;
  message?: string;
  error?: string;
}> {
  console.info('form data', formData);
  const page = Number.parseInt(formData.get('current_page')?.toString() || '1');
  const onlyMine = formData.get('only_mine')?.toString() === '1';
  const providerAccountId =
    formData.get('provider_account_id')?.toString() ?? '';
  const filters = JSON.parse(
    formData.get('filters')?.toString() || '[]'
  ) as Filter<PostFilters>[];
  console.info('current page', page);
  console.info('onlyMine', onlyMine);
  const pagedSubmissions = await getSubmissions(
    onlyMine,
    providerAccountId,
    filters,
    page
  );

  return {
    data: pagedSubmissions,
    error: '',
    message: ''
  };
}
