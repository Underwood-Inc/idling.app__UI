'use server';

import sql from '../../../lib/db';
import { Submission } from '../submission-forms/schema';

export async function getSubmissionThread(
  submissionId: number
): Promise<{ parent: Submission | null; replies: Submission[] }> {
  const parentResult = await sql<any[]>`
    SELECT 
      s.submission_id,
      s.submission_name,
      s.submission_title,
      s.submission_datetime,
      s.user_id,
      u.name as author,
      COALESCE(s.tags, ARRAY[]::text[]) as tags,
      s.thread_parent_id
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.submission_id = ${submissionId}
  `;

  const repliesResult = await sql<any[]>`
    SELECT 
      s.submission_id,
      s.submission_name,
      s.submission_title,
      s.submission_datetime,
      s.user_id,
      u.name as author,
      COALESCE(s.tags, ARRAY[]::text[]) as tags,
      s.thread_parent_id
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.thread_parent_id = ${submissionId}
    ORDER BY s.submission_datetime ASC
  `;

  // Parse the results to ensure proper typing
  const parseSubmission = (row: any): Submission => ({
    submission_id: Number(row.submission_id),
    submission_name: row.submission_name,
    submission_title: row.submission_title || row.submission_name,
    submission_datetime: new Date(row.submission_datetime),
    user_id: Number(row.user_id),
    author: row.author,
    tags: Array.isArray(row.tags) ? row.tags : [],
    thread_parent_id: row.thread_parent_id ? Number(row.thread_parent_id) : null
  });

  return {
    parent: parentResult[0] ? parseSubmission(parentResult[0]) : null,
    replies: repliesResult.map(parseSubmission)
  };
}
