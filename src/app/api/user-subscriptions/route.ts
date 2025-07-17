import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Opt out of static rendering since this route uses dynamic request data
export const dynamic = 'force-dynamic';

export interface UserSubscriptionResponse {
  id: string;
  name: string;
  display_name: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  status:
    | 'active'
    | 'trialing'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'pending';
  billing_cycle?: 'monthly' | 'yearly' | 'lifetime' | 'trial';
  expires_at?: string;
  trial_ends_at?: string;
  has_price_override?: boolean;
}

export interface UserSubscriptionsResponse {
  subscriptions: UserSubscriptionResponse[];
  hasActiveSubscription: boolean;
  totalCount: number;
}

// GET /api/user-subscriptions - Get subscription badges for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate user ID format
    if (!/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Check if user exists
    const userExists = await sql<Array<{ id: number }>>`
      SELECT id FROM users WHERE id = ${userIdNum} LIMIT 1
    `;

    if (userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's subscriptions with plan details
    const subscriptions = await sql<
      Array<{
        subscription_id: number;
        plan_id: number;
        plan_name: string;
        plan_display_name: string;
        plan_type: string;
        status: string;
        billing_cycle: string | null;
        expires_at: string | null;
        trial_ends_at: string | null;
        admin_price_override_cents: number | null;
        created_at: string;
      }>
    >`
      SELECT 
        us.id as subscription_id,
        us.plan_id,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.plan_type,
        us.status,
        us.billing_cycle,
        us.expires_at,
        us.trial_ends_at,
        us.admin_price_override_cents,
        us.created_at
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${userIdNum}
        AND sp.is_active = true
      ORDER BY 
        CASE us.status 
          WHEN 'active' THEN 1
          WHEN 'trialing' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'suspended' THEN 4
          WHEN 'cancelled' THEN 5
          WHEN 'expired' THEN 6
          ELSE 7
        END,
        us.created_at DESC
    `;

    // Transform to response format
    const subscriptionData: UserSubscriptionResponse[] = subscriptions.map(
      (sub) => ({
        id: sub.subscription_id.toString(),
        name: sub.plan_name,
        display_name: sub.plan_display_name,
        plan_type: sub.plan_type as 'tier' | 'addon' | 'bundle',
        status: sub.status as
          | 'active'
          | 'trialing'
          | 'cancelled'
          | 'expired'
          | 'suspended'
          | 'pending',
        billing_cycle: sub.billing_cycle as
          | 'monthly'
          | 'yearly'
          | 'lifetime'
          | 'trial'
          | undefined,
        expires_at: sub.expires_at || undefined,
        trial_ends_at: sub.trial_ends_at || undefined,
        has_price_override: sub.admin_price_override_cents !== null
      })
    );

    // Determine if user has any active subscriptions
    const hasActiveSubscription = subscriptions.some(
      (sub) =>
        ['active', 'trialing'].includes(sub.status) &&
        (sub.expires_at === null || new Date(sub.expires_at) > new Date())
    );

    const response: UserSubscriptionsResponse = {
      subscriptions: subscriptionData,
      hasActiveSubscription,
      totalCount: subscriptions.length
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Force fresh data for subscriptions
      }
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        subscriptions: [],
        hasActiveSubscription: false,
        totalCount: 0
      },
      { status: 500 }
    );
  }
}
