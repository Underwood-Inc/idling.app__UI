/**
 * Admin User Subscriptions API
 * Handles fetching user subscription data for admin management
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../lib/actions/permissions.actions';
import { auth } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import { PERMISSIONS } from '../../../../lib/permissions/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status:
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'pending'
    | 'trialing';
  billing_cycle?: string;
  expires_at?: string;
  trial_ends_at?: string;
  assigned_by?: string;
  assignment_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan_name: string;
  plan_display_name: string;
  user_name?: string;
  user_email?: string;
  assigned_by_name?: string;
}

// GET /api/admin/user-subscriptions - Get user subscriptions for admin management
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to manage subscriptions
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

    // Check if subscription system exists and get user subscriptions
    let subscriptions: UserSubscription[] = [];
    try {
      subscriptions = await sql<UserSubscription[]>`
        SELECT 
          us.id::text,
          us.user_id::text,
          us.plan_id::text,
          us.status,
          us.billing_cycle,
          us.expires_at::text,
          us.trial_ends_at::text,
          us.assigned_by::text,
          us.assignment_reason,
          us.created_at::text,
          us.updated_at::text,
          sp.name as plan_name,
          sp.display_name as plan_display_name,
          u.name as user_name,
          u.email as user_email,
          assigned_by_user.name as assigned_by_name
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN users u ON us.user_id = u.id
        LEFT JOIN users assigned_by_user ON us.assigned_by = assigned_by_user.id
        ORDER BY us.created_at DESC
      `;
    } catch (error) {
      // Subscription tables might not exist yet
      return NextResponse.json(
        {
          error: 'Subscription system not available'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch user subscriptions' },
      { status: 500 }
    );
  }
}

export const GET = withUniversalEnhancements(getHandler);
