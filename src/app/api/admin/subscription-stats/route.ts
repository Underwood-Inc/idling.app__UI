/**
 * Admin Subscription Statistics API
 * Handles fetching aggregate subscription statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../lib/actions/permissions.actions';
import { withUniversalEnhancements } from '../../../../lib/api/withUniversalEnhancements';
import { auth } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import { PERMISSIONS } from '../../../../lib/permissions/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SubscriptionStats {
  total_plans: number;
  active_plans: number;
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  expired_subscriptions: number;
  revenue_monthly_cents: number;
  revenue_yearly_cents: number;
  plan_distribution: Array<{
    plan_name: string;
    plan_display_name: string;
    subscriber_count: number;
    revenue_monthly_cents: number;
  }>;
}

// GET /api/admin/subscription-stats - Get aggregate subscription statistics
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to view subscription statistics
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if subscription system exists and get statistics
    let stats: SubscriptionStats;
    try {
      // Get basic plan counts
      const planCounts = await sql`
        SELECT 
          COUNT(*) as total_plans,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans
        FROM subscription_plans
      `;

      // Get subscription counts by status
      const subscriptionCounts = await sql`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trialing_subscriptions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions
        FROM user_subscriptions
      `;

      // Get revenue statistics - estimate based on plan prices and active subscriptions
      const revenueStats = await sql`
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN us.billing_cycle = 'monthly' THEN sp.price_monthly_cents
              WHEN us.billing_cycle = 'yearly' THEN (sp.price_yearly_cents / 12)
              ELSE 0
            END
          ), 0) as revenue_monthly_cents,
          COALESCE(SUM(
            CASE 
              WHEN us.billing_cycle = 'yearly' THEN sp.price_yearly_cents
              WHEN us.billing_cycle = 'monthly' THEN (sp.price_monthly_cents * 12)
              ELSE 0
            END
          ), 0) as revenue_yearly_cents
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.status IN ('active', 'trialing')
      `;

      // Get plan distribution
      const planDistribution = await sql`
        SELECT 
          sp.name as plan_name,
          sp.display_name as plan_display_name,
          COUNT(us.id) as subscriber_count,
          COALESCE(SUM(
            CASE 
              WHEN us.billing_cycle = 'monthly' THEN sp.price_monthly_cents
              WHEN us.billing_cycle = 'yearly' THEN (sp.price_yearly_cents / 12)
              ELSE 0
            END
          ), 0) as revenue_monthly_cents
        FROM subscription_plans sp
        LEFT JOIN user_subscriptions us ON sp.id = us.plan_id 
          AND us.status IN ('active', 'trialing')
        WHERE sp.is_active = true
        GROUP BY sp.id, sp.name, sp.display_name
        ORDER BY subscriber_count DESC, sp.sort_order
      `;

      stats = {
        total_plans: planCounts[0]?.total_plans || 0,
        active_plans: planCounts[0]?.active_plans || 0,
        total_subscriptions: subscriptionCounts[0]?.total_subscriptions || 0,
        active_subscriptions: subscriptionCounts[0]?.active_subscriptions || 0,
        trialing_subscriptions:
          subscriptionCounts[0]?.trialing_subscriptions || 0,
        expired_subscriptions:
          subscriptionCounts[0]?.expired_subscriptions || 0,
        revenue_monthly_cents: revenueStats[0]?.revenue_monthly_cents || 0,
        revenue_yearly_cents: revenueStats[0]?.revenue_yearly_cents || 0,
        plan_distribution: planDistribution.map((row) => ({
          plan_name: row.plan_name,
          plan_display_name: row.plan_display_name,
          subscriber_count: parseInt(row.subscriber_count) || 0,
          revenue_monthly_cents: parseInt(row.revenue_monthly_cents) || 0
        }))
      };
    } catch (error) {
      // Subscription tables might not exist yet
      return NextResponse.json(
        {
          error: 'Subscription system not available'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching subscription statistics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription statistics' },
      { status: 500 }
    );
  }
}

export const GET = withUniversalEnhancements(getHandler);
