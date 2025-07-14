/**
 * Admin User Subscription Management API
 * Handles assigning and managing user subscriptions
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import {
  AdminSubscriptionAssignmentSchema,
  AdminSubscriptionCancelParamsSchema,
  AdminSubscriptionUpdateSchema
} from '@lib/schemas/admin-subscriptions.schema';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

export interface SubscriptionAssignmentRequest {
  planId: number;
  billingCycle?: string;
  expiresAt?: string;
  status?: string;
  reason?: string;
  priceOverrideCents?: number;
  priceOverrideReason?: string;
}

// POST /api/admin/users/[id]/assign-subscription - Assign subscription to user
async function postHandler(
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

    // Validate request body
    const body = await request.json();
    const bodyResult = AdminSubscriptionAssignmentSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: bodyResult.error.errors
        },
        { status: 400 }
      );
    }

    const {
      planId,
      billingCycle,
      expiresAt,
      status,
      reason,
      priceOverrideCents,
      priceOverrideReason
    } = bodyResult.data;

    // Check if subscription system exists
    let planExists = false;
    try {
      const plans = await sql<{ id: number; name: string }[]>`
        SELECT id, name FROM subscription_plans WHERE id = ${planId}
      `;
      planExists = plans.length > 0;
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Subscription system not available'
        },
        { status: 503 }
      );
    }

    if (!planExists) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Check for existing active subscription
    const existingSubscriptions = await sql<{ id: number }[]>`
      SELECT id FROM user_subscriptions 
      WHERE user_id = ${targetUserId} 
        AND status IN ('active', 'trialing')
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (existingSubscriptions.length > 0) {
      return NextResponse.json(
        {
          error: 'User already has an active subscription'
        },
        { status: 409 }
      );
    }

    // Calculate expiry date if not provided
    let finalExpiresAt: string | null = expiresAt || null;
    if (!finalExpiresAt && billingCycle) {
      const now = new Date();
      switch (billingCycle) {
        case 'monthly':
          now.setMonth(now.getMonth() + 1);
          finalExpiresAt = now.toISOString();
          break;
        case 'yearly':
          now.setFullYear(now.getFullYear() + 1);
          finalExpiresAt = now.toISOString();
          break;
        case 'weekly':
          now.setDate(now.getDate() + 7);
          finalExpiresAt = now.toISOString();
          break;
        case 'lifetime':
          // Lifetime subscriptions never expire
          finalExpiresAt = null;
          break;
        default:
          // Default to monthly if unrecognized
          now.setMonth(now.getMonth() + 1);
          finalExpiresAt = now.toISOString();
      }
    }

    // Assign the subscription
    await sql`
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, billing_cycle, expires_at, 
        assigned_by, created_at, notes,
        admin_price_override_cents, admin_price_override_reason, 
        admin_price_override_by, admin_price_override_at
      ) VALUES (
        ${targetUserId}, 
        ${planId}, 
        ${status || 'active'}, 
        ${billingCycle || 'monthly'}, 
        ${finalExpiresAt || null}, 
        ${adminUserId}, 
        NOW(), 
        ${reason || null},
        ${priceOverrideCents || null},
        ${priceOverrideReason || null},
        ${priceOverrideCents !== undefined ? adminUserId : null},
        ${priceOverrideCents !== undefined ? sql`NOW()` : null}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Subscription assigned successfully',
      expiresAt: finalExpiresAt
    });
  } catch (error) {
    console.error('Error assigning subscription:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to assign subscription' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id]/assign-subscription - Update subscription
async function patchHandler(
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

    // Validate request body
    const body = await request.json();
    const bodyResult = AdminSubscriptionUpdateSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: bodyResult.error.errors
        },
        { status: 400 }
      );
    }

    const { subscriptionId, status, expiresAt, reason } = bodyResult.data;

    // Update the subscription
    await sql`
      UPDATE user_subscriptions 
      SET 
        status = ${status || 'active'},
        expires_at = ${expiresAt || null},
        notes = ${reason || null},
        updated_at = NOW()
      WHERE id = ${subscriptionId} AND user_id = ${targetUserId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/assign-subscription - Cancel subscription
async function deleteHandler(
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

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminSubscriptionCancelParamsSchema.safeParse({
      subscriptionId: searchParams.get('subscriptionId'),
      reason: searchParams.get('reason')
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid cancellation parameters',
          details: paramsResult.error.errors
        },
        { status: 400 }
      );
    }

    const { subscriptionId, reason = 'Cancelled by administrator' } =
      paramsResult.data;

    // Cancel the subscription
    await sql`
      UPDATE user_subscriptions 
      SET 
        status = 'cancelled',
        notes = ${reason},
        updated_at = NOW()
      WHERE id = ${parseInt(subscriptionId.toString())} AND user_id = ${targetUserId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

// Apply permission wrappers to handlers
export const POST = withUniversalEnhancements(postHandler);
export const PATCH = withUniversalEnhancements(patchHandler);
export const DELETE = withUniversalEnhancements(deleteHandler);
