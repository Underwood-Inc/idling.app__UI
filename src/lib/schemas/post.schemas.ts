import { z } from 'zod';

/**
 * @deprecated Legacy Post schema - kept for backward compatibility only.
 * New submissions should use Submission types from src/app/components/submission-forms/schema.ts
 *
 * This schema represents the old Reddit-style posts system with:
 * - id (string)
 * - title/content fields
 * - authorId/subthread fields
 *
 * Current system uses submissions table with:
 * - submission_id (number)
 * - submission_title/submission_name fields
 * - author_id/author fields
 * - threading support via thread_parent_id
 */
export const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  authorId: z.string(),
  subthread: z.string().min(1).max(50),
  score: z.number().int(),
  commentCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * @deprecated Use SubmissionWithReplies from submissions-list/actions.ts instead
 */
export type Post = z.infer<typeof PostSchema>;

/**
 * @deprecated Use createSubmissionAction from submission-forms/actions.ts instead
 */
export const CreatePostSchema = PostSchema.omit({
  id: true,
  score: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true
});

/**
 * @deprecated Use createSubmissionAction from submission-forms/actions.ts instead
 */
export type CreatePost = z.infer<typeof CreatePostSchema>;
