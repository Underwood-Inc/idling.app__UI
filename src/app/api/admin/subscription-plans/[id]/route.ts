/**
 * Admin Subscription Plan Management API
 * Handles updating individual subscription plans
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../../lib/actions/permissions.actions';
import { auth } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import { PERMISSIONS } from '../../../../../lib/permissions/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updatePlanSchema = z.object({
  is_active: z.boolean().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  price_monthly_cents: z.number().optional(),
  price_yearly_cents: z.number().optional(),
  price_lifetime_cents: z.number().optional(),
  sort_order: z.number().optional()
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
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const planId = parseInt(params.id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const body = await request.json();
    const updateData = updatePlanSchema.parse(body);

    // Check if plan exists
    const existingPlan = await sql`
          SELECT id, name, display_name, is_active
          FROM subscription_plans
          WHERE id = ${planId}
        `;

    if (existingPlan.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update plan with provided fields
    const result = await sql`
          UPDATE subscription_plans 
          SET 
            is_active = COALESCE(${updateData.is_active ?? null}, is_active),
            display_name = COALESCE(${updateData.display_name ?? null}, display_name),
            description = COALESCE(${updateData.description ?? null}, description),
            price_monthly_cents = COALESCE(${updateData.price_monthly_cents ?? null}, price_monthly_cents),
            price_yearly_cents = COALESCE(${updateData.price_yearly_cents ?? null}, price_yearly_cents),
            price_lifetime_cents = COALESCE(${updateData.price_lifetime_cents ?? null}, price_lifetime_cents),
            sort_order = COALESCE(${updateData.sort_order ?? null}, sort_order),
            updated_at = NOW()
          WHERE id = ${planId}
          RETURNING *
        `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    // Log the action
    await sql`
          INSERT INTO admin_actions (
            admin_user_id, action_type, action_details, created_at
          ) VALUES (
            ${parseInt(session.user.id)},
            'plan_update',
            ${JSON.stringify({
              plan_id: planId,
              plan_name: existingPlan[0].name,
              changes: updateData
            })},
            NOW()
          )
        `;

    return NextResponse.json({
      success: true,
      plan: result[0],
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
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
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const planId = parseInt(params.id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Check if plan exists and has active subscriptions
    const planInfo = await sql`
          SELECT 
            sp.id, sp.name, sp.display_name,
            COUNT(us.id) as active_subscriptions
          FROM subscription_plans sp
          LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status = 'active'
          WHERE sp.id = ${planId}
          GROUP BY sp.id, sp.name, sp.display_name
        `;

    if (planInfo.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = planInfo[0];
    if (plan.active_subscriptions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan with ${plan.active_subscriptions} active subscriptions. Disable the plan instead.`
        },
        { status: 400 }
      );
    }

    // Delete the plan
    await sql`
          DELETE FROM subscription_plans
          WHERE id = ${planId}
        `;

    // Log the action
    await sql`
          INSERT INTO admin_actions (
            admin_user_id, action_type, action_details, created_at
          ) VALUES (
            ${parseInt(session.user.id)},
            'plan_delete',
            ${JSON.stringify({
              plan_id: planId,
              plan_name: plan.name,
              plan_display_name: plan.display_name
            })},
            NOW()
          )
        `;

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = withUniversalEnhancements(patchHandler);
export const DELETE = withUniversalEnhancements(deleteHandler);
