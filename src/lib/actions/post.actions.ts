'use server';

import { revalidatePath } from 'next/cache';
import { CustomSession } from 'src/auth.config';
import { auth } from '../auth';
import sql from '../db';
import { CreatePost, Post, PostSchema } from '../schemas/post.schemas';

export async function createPost(data: Omit<CreatePost, 'authorId'>) {
  const session = (await auth()) as CustomSession;
  if (!session || !session?.user) {
    throw new Error('You must be logged in to create a post');
  }

  const { title, content, subthread } = data;
  console.log('*-*-*-*-session:', session);
  // First, get the user's id from the users table
  const userResult = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE email = ${session.user.email!}
  `;

  if (userResult.length === 0) {
    throw new Error('User not found'); // logout and login again to resolve
  }

  const userId = userResult[0].id;

  const result = await sql<[Post]>`
    INSERT INTO posts (title, content, author_id, subthread)
    VALUES (${title}, ${content}, ${userId}, ${subthread})
    RETURNING *
  `;

  console.log('*-*-*-result:', result);
  const post = PostSchema.parse(result[0]);

  revalidatePath(`/t/${subthread}`);
  return post;
}

export async function getPosts(subthread?: string, limit = 20, offset = 0) {
  console.log('subthread', subthread);

  const result = await sql<Post[]>`
    SELECT * FROM posts
    ${subthread ? sql`WHERE subthread = ${subthread}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.map((post) => PostSchema.parse(post));
}

export async function getPost(id: string) {
  const result = await sql<Post[]>`
    SELECT * FROM posts WHERE id = ${id}
  `;

  if (result.length === 0) {
    return null;
  }

  return PostSchema.parse(result[0]);
}

export async function votePost(postId: string, voteType: 1 | -1) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('You must be logged in to vote');
  }

  await sql`
    INSERT INTO votes (user_id, post_id, vote_type)
    VALUES (${session.user.id!}, ${postId}, ${voteType})
    ON CONFLICT (user_id, post_id)
    DO UPDATE SET vote_type = ${voteType}
  `;

  await sql`
    UPDATE posts
    SET score = (
      SELECT COALESCE(SUM(vote_type), 0)
      FROM votes
      WHERE post_id = ${postId}
    )
    WHERE id = ${postId}
  `;

  revalidatePath(`/t/[subthread]/comments/${postId}`);
}