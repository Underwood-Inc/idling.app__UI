'use server';

import sql from '../../../lib/db';
import { Submission } from '../submission-forms/schema';

export async function getSubmissionThread(
  submissionId: number
): Promise<{ parent: Submission | null; replies: Submission[] }> {
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
    WHERE submission_id = ${submissionId}
  `;

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
    WHERE thread_parent_id = ${submissionId}
    ORDER BY submission_datetime ASC
  `;

  // Parse the results to ensure proper typing
  const parseSubmission = (row: any): Submission => ({
    submission_id: Number(row.submission_id),
    submission_name: row.submission_name,
    submission_title: row.submission_title || row.submission_name,
    submission_datetime: new Date(row.submission_datetime),
    author_id: row.author_id,
    author: row.author,
    tags: Array.isArray(row.tags) ? row.tags : [],
    thread_parent_id: row.thread_parent_id ? Number(row.thread_parent_id) : null
  });

  return {
    parent: parentResult[0] ? parseSubmission(parentResult[0]) : null,
    replies: repliesResult.map(parseSubmission)
  };
}
