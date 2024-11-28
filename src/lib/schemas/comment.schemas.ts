import { z } from 'zod';

export const CommentSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  authorId: z.string(),
  postId: z.string(),
  parentId: z.string().nullable(),
  score: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Comment = z.infer<typeof CommentSchema>;

export const CreateCommentSchema = CommentSchema.omit({
  id: true,
  score: true,
  createdAt: true,
  updatedAt: true
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;
