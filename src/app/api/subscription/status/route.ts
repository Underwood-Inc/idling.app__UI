import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  isPro: boolean;
  currentPlan?: {
    id: number;
    name: string;
    display_name: string;
    plan_type: string;
  };
  subscription?: {
    id: number;
    status: string;
    billing_cycle?: string;
    expires_at?: string;
    has_price_override: boolean;
    price_override_cents?: number;
  };
}

// GET /api/subscription/status - Check user's current subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ 
        hasActiveSubscription: false, 
        isPro: false 
      });
    }

    const userId = parseInt(session.user.id);

    // Check for active subscription
    const subscriptions = await sql<Array<{
      id: number;
      plan_id: number;
      status: string;
      billing_cycle: string;
      expires_at: string | null;
      admin_price_override_cents: number | null;
      admin_price_override_reason: string | null;
      plan_name: string;
      plan_display_name: string;
      plan_type: string;
    }>>`
      SELECT 
        us.id,
        us.plan_id,
        us.status,
        us.billing_cycle,
        us.expires_at,
        us.admin_price_override_cents,
        us.admin_price_override_reason,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.plan_type
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${userId}
        AND us.status IN ('active', 'trialing')
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
        AND sp.is_active = true
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        hasActiveSubscription: false, 
        isPro: false 
      });
    }

    const subscription = subscriptions[0];
    
    // Check if this is a pro-level plan (could be Pro, Enterprise, etc.)
    const isPro = subscription.plan_type === 'tier' && 
                  (subscription.plan_name.toLowerCase().includes('pro') || 
                   subscription.plan_name.toLowerCase().includes('enterprise'));

    const response: SubscriptionStatusResponse = {
      hasActiveSubscription: true,
      isPro,
      currentPlan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        display_name: subscription.plan_display_name,
        plan_type: subscription.plan_type
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        expires_at: subscription.expires_at || undefined,
        has_price_override: subscription.admin_price_override_cents !== null,
        price_override_cents: subscription.admin_price_override_cents || undefined
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    // Return safe defaults on error
    return NextResponse.json({ 
      hasActiveSubscription: false, 
      isPro: false 
    });
  }
} 