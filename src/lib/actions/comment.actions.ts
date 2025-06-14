'use server';
import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';
import { CommentSchema, CreateComment } from '../schemas/comment.schemas';

export async function createComment(data: CreateComment) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('You must be logged in to comment');
  }

  const { content, postId, parentId } = data;

  const result = await sql<[Comment]>`
    INSERT INTO comments (content, author_id, post_id, parent_id)
    VALUES (${content}, ${session.user.id!}, ${postId}, ${parentId})
    RETURNING *
  `;

  const comment = CommentSchema.parse(result[0]);

  await sql`
    UPDATE posts
    SET comment_count = comment_count + 1
    WHERE id = ${postId}
  `;

  revalidatePath(`/t/[subreddit]/comments/${postId}`);
  return comment;
}

export async function getComments(postId: string) {
  const result = await sql<Comment[]>`
    SELECT * FROM comments
    WHERE post_id = ${postId}
    ORDER BY created_at DESC
  `;

  return result.map((comment: Comment) => CommentSchema.parse(comment));
}

export async function voteComment(commentId: string, voteType: 1 | -1) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('You must be logged in to vote');
  }

  await sql`
    INSERT INTO votes (user_id, comment_id, vote_type)
    VALUES (${session.user.id!}, ${commentId}, ${voteType})
    ON CONFLICT (user_id, comment_id)
    DO UPDATE SET vote_type = ${voteType}
  `;

  await sql`
    UPDATE comments
    SET score = (
      SELECT COALESCE(SUM(vote_type), 0)
      FROM votes
      WHERE comment_id = ${commentId}
    )
    WHERE id = ${commentId}
  `;

  revalidatePath(`/t/[subreddit]/comments/[postId]`);
}
