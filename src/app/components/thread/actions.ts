'use server';

import sql from '../../../lib/db';
import { Submission } from '../submission-forms/schema';

export interface NestedSubmission extends Submission {
  replies?: NestedSubmission[];
  depth?: number;
}

export async function getSubmissionThread(
  submissionId: number
): Promise<{ parent: NestedSubmission | null; replies: NestedSubmission[] }> {
  // Get the parent submission
  const parentResult = await sql<any[]>`
    SELECT 
      s.submission_id,
      s.submission_name,
      s.submission_title,
      s.submission_datetime,
      s.user_id,
      u.name as author,
      u.bio as author_bio,
      COALESCE(s.tags, ARRAY[]::text[]) as tags,
      s.thread_parent_id
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.submission_id = ${submissionId}
  `;

  // Get all nested replies using recursive CTE
  const repliesResult = await sql<any[]>`
    WITH RECURSIVE thread_replies AS (
      -- Base case: direct replies to the main submission
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_title,
        s.submission_datetime,
        s.user_id,
        u.name as author,
        u.bio as author_bio,
        COALESCE(s.tags, ARRAY[]::text[]) as tags,
        s.thread_parent_id,
        1 as depth,
        ARRAY[s.submission_datetime] as path
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.thread_parent_id = ${submissionId}
      
      UNION ALL
      
      -- Recursive case: replies to replies
      SELECT 
        s.submission_id,
        s.submission_name,
        s.submission_title,
        s.submission_datetime,
        s.user_id,
        u.name as author,
        u.bio as author_bio,
        COALESCE(s.tags, ARRAY[]::text[]) as tags,
        s.thread_parent_id,
        tr.depth + 1,
        tr.path || s.submission_datetime
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      INNER JOIN thread_replies tr ON s.thread_parent_id = tr.submission_id
      WHERE tr.depth < 5 -- Limit depth to prevent infinite recursion
    )
    SELECT * FROM thread_replies
    ORDER BY path ASC
  `;

  // Parse the results to ensure proper typing
  const parseSubmission = (row: any): NestedSubmission => ({
    submission_id: Number(row.submission_id),
    submission_name: row.submission_name,
    submission_title: row.submission_title || row.submission_name,
    submission_datetime: new Date(row.submission_datetime),
    user_id: Number(row.user_id),
    author: row.author,
    author_bio: row.author_bio || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    thread_parent_id: row.thread_parent_id
      ? Number(row.thread_parent_id)
      : null,
    depth: row.depth || 0,
    replies: []
  });

  // Build nested structure
  const allReplies = repliesResult.map(parseSubmission);
  const buildNestedStructure = (parentId: number): NestedSubmission[] => {
    return allReplies
      .filter((reply) => reply.thread_parent_id === parentId)
      .map((reply) => ({
        ...reply,
        replies: buildNestedStructure(reply.submission_id)
      }));
  };

  // Get top-level replies (direct replies to the main submission)
  const nestedReplies = buildNestedStructure(submissionId);

  return {
    parent: parentResult[0] ? parseSubmission(parentResult[0]) : null,
    replies: nestedReplies
  };
}
