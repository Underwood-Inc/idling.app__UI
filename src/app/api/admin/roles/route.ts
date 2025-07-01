/**
 * Admin Roles API
 * Handles fetching available roles for assignment
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface AvailableRole {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

// GET /api/admin/roles - Get available roles for assignment
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to view roles
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get available roles (excluding protected roles that can only be assigned via database)
    const roles = await sql<AvailableRole[]>`
      SELECT id, name, display_name, description
      FROM user_roles 
      WHERE name NOT IN ('admin', 'moderator')
      ORDER BY display_name
    `;

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
} 