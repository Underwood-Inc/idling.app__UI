'use server';

import sql from '../db';

export interface HashtagResult {
  id: string;
  value: string;
  label: string;
  count: number;
  type: 'hashtag';
}

export interface UserResult {
  id: string;
  value: string;
  label: string;
  avatar?: string;
  type: 'user';
}

export async function searchHashtags(query: string): Promise<HashtagResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for hashtags in the tags array of submissions
    const results = await sql<Array<{ tag: string; count: string }>>`
      SELECT 
        tag,
        COUNT(*) as count
      FROM (
        SELECT UNNEST(tags) as tag
        FROM submissions 
        WHERE tags IS NOT NULL 
        AND array_length(tags, 1) > 0
      ) tag_table
      WHERE LOWER(tag) LIKE LOWER(${`%${query}%`})
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 10
    `;

    return results.map((result, index) => {
      // Remove # prefix from tag if it exists to avoid double #
      const cleanTag = result.tag.startsWith('#')
        ? result.tag.slice(1)
        : result.tag;

      return {
        id: `hashtag-${index}-${cleanTag}`,
        value: cleanTag,
        label: `${cleanTag} (${result.count} posts)`,
        count: parseInt(result.count),
        type: 'hashtag' as const
      };
    });
  } catch (error) {
    console.error('Error searching hashtags:', error);
    return [];
  }
}

export async function searchUsers(query: string): Promise<UserResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for users in the submissions table by author and author_id
    const results = await sql<
      Array<{
        author_id: string;
        author: string;
        submission_count: string;
      }>
    >`
      SELECT DISTINCT
        author_id,
        author,
        COUNT(*) as submission_count
      FROM submissions 
      WHERE 
        LOWER(author) LIKE LOWER(${`%${query}%`})
        OR LOWER(author_id) LIKE LOWER(${`%${query}%`})
      GROUP BY author_id, author
      ORDER BY submission_count DESC, author ASC
      LIMIT 10
    `;

    // For now, we'll generate avatar URLs using the author name as seed
    // In a real app, you'd have actual user avatar URLs
    return results.map((result, index) => ({
      id: `user-${index}-${result.author_id}`,
      value: result.author,
      label: `${result.author} (${result.submission_count} posts)`,
      avatar: undefined, // We'll generate this in the component using Avatar
      type: 'user' as const
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}
