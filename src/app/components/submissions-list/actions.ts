/* eslint-disable no-console */
'use server';
import sql from '../../../lib/db';
import { Submission, submissionSchema } from '../submission-forms/schema';

export type GetSubmissionsActionArguments = {
  onlyMine: boolean;
  providerAccountId: string;
  filters?: { name: string; value: string }[];
  page?: number;
  pageSize?: number;
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

export async function getSubmissionsAction({
  onlyMine,
  providerAccountId,
  filters = [],
  page = 1,
  pageSize = 10
}: GetSubmissionsActionArguments): Promise<GetSubmissionsActionResponse> {
  console.log('getSubmissions called with:', {
    onlyMine,
    providerAccountId,
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

    const countQuery = sql`
      SELECT COUNT(*) 
      FROM submissions s
      WHERE ${onlyMine ? sql`s.author_id = ${providerAccountId}` : sql`1=1`}
      ${tagFilter ? sql`AND EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = ${tagFilter})` : sql``}
    `;

    const submissionsQuery = sql`
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_datetime,
        s.author_id,
        s.author,
        COALESCE(s.tags, ARRAY[]::text[]) as tags,
        s.thread_parent_id
      FROM submissions s
      WHERE ${onlyMine ? sql`s.author_id = ${providerAccountId}` : sql`1=1`}
      ${tagFilter ? sql`AND EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = ${tagFilter})` : sql``}
      ORDER BY s.submission_datetime DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    console.log('Executing count query:', countQuery);
    const countResult = await countQuery;
    const totalRecords = parseInt(countResult[0].count);

    console.log('Executing submissions query:', submissionsQuery);
    const submissionsResult = await submissionsQuery;

    if (!submissionsResult || submissionsResult.length === 0) {
      return {
        data: {
          data: [],
          pagination: {
            currentPage: page,
            pageSize,
            totalRecords: 0
          }
        }
      };
    }

    const submissions = submissionsResult.map((row: any) => {
      console.log('Processing row:', row);
      try {
        const parsedData = {
          submission_id: Number(row.submission_id),
          submission_name: row.submission_name,
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
        throw new Error(`Failed to parse submission: ${parseError.message}`);
      }
    });

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
    console.error('Error in getSubmissions:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to fetch submissions'
    };
  }
}
