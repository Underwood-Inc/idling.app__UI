import sql from '@lib/db';
import { SubmissionWithReplies } from '../types';

export class SqlQueryBuilder {
  /**
   * Build the main submissions query with pagination
   */
  public static buildMainQuery(
    whereClause: string,
    isOnlyReplies: boolean,
    page: number,
    pageSize: number
  ): string {
    const offset = (page - 1) * pageSize;

    let mainQuery: string;

    if (isOnlyReplies) {
      // For replies, use a simpler structure without nested replies
      mainQuery = `
        SELECT 
          s.submission_id,
          s.submission_name,
          s.submission_title,
          s.submission_datetime,
          s.user_id,
          u.name as author,
          u.bio as author_bio,
          s.tags,
          s.thread_parent_id
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.submission_datetime DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      // For main posts, use the complex structure with nested replies
      mainQuery = `
        SELECT 
          s.submission_id,
          s.submission_name,
          s.submission_title,
          s.submission_datetime,
          s.user_id,
          u.name as author,
          u.bio as author_bio,
          s.tags,
          s.thread_parent_id,
          -- Get nested replies as JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'submission_id', r.submission_id,
                  'submission_name', r.submission_name,
                  'submission_title', r.submission_title,
                  'submission_datetime', r.submission_datetime,
                  'user_id', r.user_id,
                  'author', ru.name,
                  'author_bio', ru.bio,
                  'tags', r.tags,
                  'thread_parent_id', r.thread_parent_id
                ) ORDER BY r.submission_datetime ASC
              )
              FROM submissions r
              JOIN users ru ON r.user_id = ru.id
              WHERE r.thread_parent_id = s.submission_id
            ),
            '[]'::json
          ) as replies_json
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.submission_datetime DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    }

    return mainQuery;
  }

  /**
   * Build count query for pagination
   */
  public static buildCountQuery(whereClause: string): string {
    return `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;
  }

  /**
   * Process query results and handle nested replies
   */
  public static processQueryResults(
    rows: any[],
    isOnlyReplies: boolean
  ): SubmissionWithReplies[] {
    return rows.map((row) => {
      // Parse submission_datetime
      let parsedDate: Date | null = null;
      if (row.submission_datetime) {
        const dateValue = row.submission_datetime;
        if (dateValue && dateValue !== '0') {
          try {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime()) && d.getTime() > 0) {
              parsedDate = d;
            } else {
              console.error('Invalid submission_datetime (invalid date):', {
                submission_id: row.submission_id,
                raw_datetime: dateValue,
                parsed_time: d.getTime()
              });
            }
          } catch (error) {
            console.error('Invalid submission_datetime (parse error):', {
              submission_id: row.submission_id,
              raw_datetime: dateValue,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else {
          console.warn('Missing or zero submission_datetime:', {
            submission_id: row.submission_id,
            raw_datetime: dateValue
          });
        }
      }

      const submission: SubmissionWithReplies = {
        submission_id: row.submission_id,
        submission_name: row.submission_name || '',
        submission_title: row.submission_title || '',
        submission_datetime: parsedDate,
        user_id: row.user_id,
        author: row.author || '',
        author_bio: row.author_bio || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        thread_parent_id: row.thread_parent_id || null
      };

      // Handle nested replies for main posts
      if (!isOnlyReplies && row.replies_json) {
        try {
          const repliesData =
            typeof row.replies_json === 'string'
              ? JSON.parse(row.replies_json)
              : row.replies_json;

          if (Array.isArray(repliesData)) {
            submission.replies = repliesData.map((reply: any) => {
              // Parse reply submission_datetime
              let replyParsedDate: Date | null = null;
              if (reply.submission_datetime) {
                const dateValue = reply.submission_datetime;
                if (dateValue && dateValue !== '0') {
                  try {
                    const d = new Date(dateValue);
                    if (!isNaN(d.getTime()) && d.getTime() > 0) {
                      replyParsedDate = d;
                    } else {
                      console.error(
                        'Invalid nested reply submission_datetime (invalid date):',
                        {
                          reply_id: reply.submission_id,
                          raw_datetime: dateValue,
                          parsed_time: d.getTime(),
                          parent_id: row.submission_id
                        }
                      );
                    }
                  } catch (error) {
                    console.error(
                      'Invalid nested reply submission_datetime (parse error):',
                      {
                        reply_id: reply.submission_id,
                        raw_datetime: dateValue,
                        error:
                          error instanceof Error
                            ? error.message
                            : String(error),
                        parent_id: row.submission_id
                      }
                    );
                  }
                } else {
                  console.warn(
                    'Missing or zero nested reply submission_datetime:',
                    {
                      reply_id: reply.submission_id,
                      raw_datetime: dateValue,
                      parent_id: row.submission_id
                    }
                  );
                }
              }

              return {
                submission_id: reply.submission_id,
                submission_name: reply.submission_name || '',
                submission_title: reply.submission_title || '',
                submission_datetime: replyParsedDate,
                user_id: reply.user_id,
                author: reply.author || '',
                author_bio: reply.author_bio || '',
                tags: Array.isArray(reply.tags) ? reply.tags : [],
                thread_parent_id: reply.thread_parent_id || null
              };
            });
          }
        } catch (error) {
          console.error('Error parsing replies JSON:', error);
          submission.replies = [];
        }
      }

      return submission;
    });
  }

  /**
   * Execute query safely with error handling
   */
  public static async executeQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      return await sql.unsafe(query, params);
    } catch (error) {
      console.error('SQL Query Error:', {
        error: error instanceof Error ? error.message : String(error),
        query: query.substring(0, 200) + '...',
        paramsCount: params.length
      });
      throw error;
    }
  }
}
