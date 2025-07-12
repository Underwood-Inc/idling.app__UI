/**
 * Admin Subscription Plans API
 * Handles fetching available subscription plans for assignment
 */

import { checkUserPermission } from '@lib/actions/permissions.actions';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface AvailablePlan {
  id: number;
  name: string;
  display_name: string;
  plan_type: string;
  price_monthly_cents: number | null;
  price_yearly_cents: number | null;
  price_lifetime_cents: number | null;
  is_active: boolean;
  description?: string;
}

// GET /api/admin/subscription-plans - Get available subscription plans for assignment
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if subscription system exists
    let plans: AvailablePlan[] = [];
    try {
      plans = await sql<AvailablePlan[]>`
        SELECT 
          id, name, display_name, plan_type, description,
          price_monthly_cents, price_yearly_cents, price_lifetime_cents,
          is_active
        FROM subscription_plans 
        ORDER BY sort_order, display_name
      `;
    } catch (error) {
      // Subscription tables might not exist yet
      return NextResponse.json({ 
        error: 'Subscription system not available' 
      }, { status: 503 });
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(getHandler); 