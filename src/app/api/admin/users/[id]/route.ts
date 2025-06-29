/**
 * Admin User Details API
 * Handles detailed user information retrieval for admin management
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

export interface DetailedUser {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  created_at: string;
  profile_public?: boolean;
  bio?: string;
  location?: string;
  provider_name?: string | null;
  provider_email?: string | null;
  provider_verified?: boolean;
  provider_last_used?: string | null;
  roles?: UserRole[];
  subscriptions?: UserSubscription[];
  timeouts?: UserTimeout[];
}

export interface UserRole {
  id: number;
  role_name: string;
  display_name: string;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  assigned_by_name?: string;
}

export interface UserSubscription {
  id: number;
  plan_name: string;
  plan_display_name: string;
  status: string;
  billing_cycle: string | null;
  expires_at: string | null;
  assigned_by_name?: string;
}

export interface UserTimeout {
  id: number;
  timeout_type: string;
  reason: string;
  expires_at: string;
  is_active: boolean;
  issued_by_name?: string;
}

// GET /api/admin/users/[id] - Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to view user details
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_VIEW
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get basic user information with provider data
    const users = await sql<DetailedUser[]>`
      SELECT 
        u.id, u.name, u.email, u.image, u.created_at,
        u.profile_public, u.bio, u.location,
        pp.provider_name,
        pp.provider_email,
        pp.provider_verified,
        pp.last_used as provider_last_used
      FROM users u
      LEFT JOIN LATERAL get_user_primary_provider(u.id) pp ON true
      WHERE u.id = ${targetUserId}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Get user roles
    const roles = await sql<UserRole[]>`
      SELECT 
        ura.id,
        r.name as role_name,
        r.display_name,
        ura.assigned_at,
        ura.expires_at,
        ura.is_active,
        assigned_by.name as assigned_by_name
      FROM user_role_assignments ura
      JOIN user_roles r ON ura.role_id = r.id
      LEFT JOIN users assigned_by ON ura.assigned_by = assigned_by.id
      WHERE ura.user_id = ${targetUserId}
      ORDER BY ura.assigned_at DESC
    `;

    // Get user subscriptions (if subscription system exists)
    let subscriptions: UserSubscription[] = [];
    try {
      subscriptions = await sql<UserSubscription[]>`
        SELECT 
          us.id,
          sp.name as plan_name,
          sp.display_name as plan_display_name,
          us.status,
          us.billing_cycle,
          us.expires_at,
          assigned_by.name as assigned_by_name
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        LEFT JOIN users assigned_by ON us.assigned_by = assigned_by.id
        WHERE us.user_id = ${targetUserId}
        ORDER BY us.created_at DESC
      `;
    } catch (error) {
      // Subscription tables might not exist yet - this is expected
    }

    // Get user timeouts
    const timeouts = await sql<UserTimeout[]>`
      SELECT 
        ut.id,
        ut.timeout_type,
        ut.reason,
        ut.expires_at,
        ut.is_active,
        issued_by.name as issued_by_name
      FROM user_timeouts ut
      LEFT JOIN users issued_by ON ut.issued_by = issued_by.id
      WHERE ut.user_id = ${targetUserId}
      ORDER BY ut.created_at DESC
    `;

    // Combine all data
    const detailedUser: DetailedUser = {
      ...user,
      roles,
      subscriptions,
      timeouts
    };

    return NextResponse.json(detailedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
} 