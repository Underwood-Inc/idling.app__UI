import sql from '@lib/db';
import { NextResponse } from 'next/server';

export interface BatchDecorationsRequest {
  userIds: string[];
}

export interface UserDecoration {
  userId: string;
  decoration: string | null;
}

export interface BatchDecorationsResponse {
  decorations: Record<string, string | null>;
}

export interface BatchDecorationRow {
  user_id: string;
  decoration: string | null;
}

/**
 * Batch endpoint to fetch decorations for multiple users at once
 * Reduces N+1 query problem for post lists
 */
export async function POST(request: Request) {
  try {
    const body: BatchDecorationsRequest = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 users per batch' },
        { status: 400 }
      );
    }

    // Convert user IDs to numbers
    const userIdNumbers = userIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (userIdNumbers.length === 0) {
      return NextResponse.json({ decorations: {} });
    }

    // Batch query for all users at once
    const result = await sql<BatchDecorationRow[]>`
      WITH user_subscriptions AS (
        SELECT 
          u.id as user_id,
          u.flair_preference,
          array_agg(DISTINCT s.flair_name) FILTER (WHERE s.flair_name IS NOT NULL) as available_flairs
        FROM users u
        LEFT JOIN subscriptions sub ON sub.user_id = u.id 
          AND sub.status = 'active'
          AND (sub.end_date IS NULL OR sub.end_date > NOW())
        LEFT JOIN subscription_types s ON s.id = sub.subscription_type_id
        WHERE u.id = ANY(${userIdNumbers})
        GROUP BY u.id, u.flair_preference
      )
      SELECT 
        user_id::text,
        CASE
          -- User explicitly chose 'none'
          WHEN flair_preference = 'none' THEN NULL
          -- User chose a specific flair - verify they have access to it
          WHEN flair_preference IS NOT NULL 
            AND flair_preference != 'auto' 
            AND flair_preference != 'none'
            AND flair_preference = ANY(available_flairs) 
          THEN flair_preference
          -- Auto mode: choose highest priority flair
          WHEN available_flairs IS NOT NULL 
            AND array_length(available_flairs, 1) > 0
          THEN available_flairs[1]
          -- No decoration available
          ELSE NULL
        END as decoration
      FROM user_subscriptions
    `;

    // Build response object
    const decorations: Record<string, string | null> = {};
    result.forEach((row) => {
      decorations[row.user_id] = row.decoration;
    });
    userIds.forEach((userId) => {
      if (!(userId in decorations)) {
        decorations[userId] = null;
      }
    });

    return NextResponse.json({ decorations });
  } catch (error) {
    console.error('Error fetching batch decorations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decorations' },
      { status: 500 }
    );
  }
}
