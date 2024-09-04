'use server';

import sql from '../../../lib/db';
import { Submission } from '../submission-forms/schema';

export async function getSubmissionThread(
  submissionId: number
): Promise<{ parent: Submission | null; replies: Submission[] }> {
  const parentResult = await sql<Submission[]>`
    SELECT * FROM submissions
    WHERE submission_id = ${submissionId}
  `;

  const repliesResult = await sql<Submission[]>`
    SELECT * FROM submissions
    WHERE thread_parent_id = ${submissionId}
    ORDER BY submission_datetime ASC
  `;

  return {
    parent: parentResult[0] || null,
    replies: repliesResult
  };
}
