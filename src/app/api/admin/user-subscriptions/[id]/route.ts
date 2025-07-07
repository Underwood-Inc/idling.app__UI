/**
 * Admin User Subscription Management API
 * Handles updating individual user subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../../lib/actions/permissions.actions';
import { auth } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import { withRateLimit } from '../../../../../lib/middleware/withRateLimit';
import { PERMISSIONS } from '../../../../../lib/permissions/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'cancelled', 'expired', 'suspended', 'pending', 'trialing']).optional(),
  expires_at: z.string().optional(),
  trial_ends_at: z.string().optional(),
  cancelled_at: z.string().optional(),
  billing_cycle: z.string().optional(),
  assignment_reason: z.string().optional()
});

async function patchHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
      try {
        const session = await auth();
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permissions
        const hasPermission = await checkUserPermission(
          parseInt(session.user.id),
          PERMISSIONS.ADMIN.USERS_MANAGE
        );
        if (!hasPermission) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const subscriptionId = params.id;
        const body = await request.json();
        const updateData = updateSubscriptionSchema.parse(body);

        // Check if subscription exists
        const existingSubscription = await sql`
          SELECT id, user_id, plan_id, status
          FROM user_subscriptions
          WHERE id = ${subscriptionId}
        `;

        if (existingSubscription.length === 0) {
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Update subscription with provided fields
        const result = await sql`
          UPDATE user_subscriptions 
          SET 
            status = COALESCE(${updateData.status ?? null}, status),
            expires_at = COALESCE(${updateData.expires_at ? new Date(updateData.expires_at) : null}, expires_at),
            trial_ends_at = COALESCE(${updateData.trial_ends_at ? new Date(updateData.trial_ends_at) : null}, trial_ends_at),
            cancelled_at = COALESCE(${updateData.cancelled_at ? new Date(updateData.cancelled_at) : null}, cancelled_at),
            billing_cycle = COALESCE(${updateData.billing_cycle ?? null}, billing_cycle),
            assignment_reason = COALESCE(${updateData.assignment_reason ?? null}, assignment_reason),
            updated_at = NOW()
          WHERE id = ${subscriptionId}
          RETURNING *
        `;

        if (result.length === 0) {
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        // Log the action
        await sql`
          INSERT INTO admin_actions (
            admin_user_id, action_type, action_details, created_at
          ) VALUES (
            ${parseInt(session.user.id)},
            'subscription_update',
            ${JSON.stringify({
              subscription_id: subscriptionId,
              user_id: existingSubscription[0].user_id,
              changes: updateData
            })},
            NOW()
          )
        `;

        return NextResponse.json({
          success: true,
          subscription: result[0],
          message: 'Subscription updated successfully'
        });

      } catch (error) {
        console.error('Error updating user subscription:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
}

export const PATCH = withRateLimit(patchHandler); 