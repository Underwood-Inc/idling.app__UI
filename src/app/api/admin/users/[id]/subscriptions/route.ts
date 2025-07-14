import { checkUserPermission } from '@lib/actions/permissions.actions';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../lib/auth';
import sql from '../../../../../../lib/db';

interface UserSubscription {
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
  assignment_reason?: string;
  created_at: string;
  updated_at: string;
  plan_name: string;
  plan_display_name: string;
  assigned_by_name?: string;
}

// GET /api/admin/users/[id]/subscriptions - Get user subscriptions
async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = parseInt(session.user.id);
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to manage subscriptions
    const hasPermission = await checkUserPermission(
      adminUserId,
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
          us.assignment_reason,
          us.created_at::text,
          us.updated_at::text,
          sp.name as plan_name,
          sp.display_name as plan_display_name,
          assigned_by_user.name as assigned_by_name
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        LEFT JOIN users assigned_by_user ON us.assigned_by = assigned_by_user.id
        WHERE us.user_id = ${targetUserId}
        ORDER BY us.created_at DESC
      `;
    } catch (error) {
      // Subscription tables might not exist yet
      console.error('Error fetching user subscriptions:', error);
      return NextResponse.json(
        {
          error: 'Subscription system not available'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error in user subscriptions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { getHandler as GET };
