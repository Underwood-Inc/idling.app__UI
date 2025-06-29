/**
 * Admin User Subscription Management API
 * Handles assigning and managing user subscriptions
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

export interface SubscriptionAssignmentRequest {
  planId: number;
  billingCycle?: string;
  expiresAt?: string;
  status?: string;
  reason?: string;
}

// POST /api/admin/users/[id]/assign-subscription - Assign subscription to user
export async function POST(
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: SubscriptionAssignmentRequest = await request.json();
    const { planId, billingCycle, expiresAt, status, reason } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Check if subscription system exists
    let planExists = false;
    try {
      const plans = await sql<{ id: number; name: string }[]>`
        SELECT id, name FROM subscription_plans WHERE id = ${planId}
      `;
      planExists = plans.length > 0;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Subscription system not available' 
      }, { status: 503 });
    }

    if (!planExists) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    // Check for existing active subscription
    const existingSubscriptions = await sql<{ id: number }[]>`
      SELECT id FROM user_subscriptions 
      WHERE user_id = ${targetUserId} 
        AND status IN ('active', 'trialing')
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (existingSubscriptions.length > 0) {
      return NextResponse.json({ 
        error: 'User already has an active subscription' 
      }, { status: 409 });
    }

    // Calculate expiry date if not provided
    let finalExpiresAt = expiresAt;
    if (!finalExpiresAt && billingCycle) {
      const now = new Date();
      switch (billingCycle) {
        case 'monthly':
          now.setMonth(now.getMonth() + 1);
          break;
        case 'yearly':
          now.setFullYear(now.getFullYear() + 1);
          break;
        case 'weekly':
          now.setDate(now.getDate() + 7);
          break;
        default:
          // Default to monthly if unrecognized
          now.setMonth(now.getMonth() + 1);
      }
      finalExpiresAt = now.toISOString();
    }

    // Assign the subscription
    await sql`
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, billing_cycle, expires_at, 
        assigned_by, created_at, notes
      ) VALUES (
        ${targetUserId}, 
        ${planId}, 
        ${status || 'active'}, 
        ${billingCycle || 'monthly'}, 
        ${finalExpiresAt || null}, 
        ${adminUserId}, 
        NOW(), 
        ${reason || null}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription assigned successfully',
      expiresAt: finalExpiresAt
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to assign subscription' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id]/assign-subscription - Update subscription
export async function PATCH(
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId, status, expiresAt, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Update the subscription
    await sql`
      UPDATE user_subscriptions 
      SET 
        status = COALESCE(${status}, status),
        expires_at = COALESCE(${expiresAt}, expires_at),
        notes = COALESCE(${reason}, notes),
        updated_at = NOW()
      WHERE id = ${subscriptionId} AND user_id = ${targetUserId}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/assign-subscription - Cancel subscription
export async function DELETE(
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const reason = searchParams.get('reason') || 'Cancelled by admin';

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Cancel the subscription
    await sql`
      UPDATE user_subscriptions 
      SET 
        status = 'cancelled',
        expires_at = NOW(),
        notes = ${reason},
        updated_at = NOW()
      WHERE id = ${parseInt(subscriptionId)} AND user_id = ${targetUserId}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 