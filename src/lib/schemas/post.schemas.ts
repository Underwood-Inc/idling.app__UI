import { z } from 'zod';

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

export type Post = z.infer<typeof PostSchema>;

export const CreatePostSchema = PostSchema.omit({
  id: true,
  score: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true
});

export type CreatePost = z.infer<typeof CreatePostSchema>;
