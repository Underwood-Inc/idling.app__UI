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
 *
 * Plan-to-flair mapping (done in SQL for performance):
 * - enterprise → 'enterprise-crown'
 * - creator_bundle → 'premium-galaxy'
 * - pro → 'pro-plasma'
 * - starter → 'active-glow'
 * - free → no flair
 *
 * Flair priority order (highest first):
 * enterprise-crown > premium-galaxy > pro-plasma > active-glow
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

    // Batch query for all users at once using correct table names
    // Tables: user_subscriptions (not subscriptions), subscription_plans (not subscription_types)
    const result = await sql<BatchDecorationRow[]>`
      WITH active_user_subs AS (
        SELECT 
          u.id as user_id,
          u.flair_preference,
          array_agg(DISTINCT sp.name) FILTER (WHERE sp.name IS NOT NULL AND sp.name != 'free') as plan_names,
          -- Derive flairs from plan names with priority ordering
          array_agg(DISTINCT 
            CASE sp.name
              WHEN 'enterprise' THEN 'enterprise-crown'
              WHEN 'creator_bundle' THEN 'premium-galaxy'
              WHEN 'pro' THEN 'pro-plasma'
              WHEN 'starter' THEN 'active-glow'
              ELSE NULL
            END
          ) FILTER (WHERE sp.name IN ('enterprise', 'creator_bundle', 'pro', 'starter')) as available_flairs
        FROM users u
        LEFT JOIN user_subscriptions sub ON sub.user_id = u.id 
          AND sub.status IN ('active', 'trialing')
          AND (sub.expires_at IS NULL OR sub.expires_at > NOW())
        LEFT JOIN subscription_plans sp ON sp.id = sub.plan_id
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
          -- Auto mode: choose highest priority flair based on priority order
          WHEN available_flairs IS NOT NULL 
            AND array_length(available_flairs, 1) > 0
          THEN (
            SELECT f FROM unnest(ARRAY['enterprise-crown', 'premium-galaxy', 'pro-plasma', 'active-glow']) AS f
            WHERE f = ANY(available_flairs)
            LIMIT 1
          )
          -- No decoration available
          ELSE NULL
        END as decoration
      FROM active_user_subs
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
