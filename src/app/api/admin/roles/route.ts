/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Get available roles for assignment
 *     description: Retrieve a list of available roles that can be assigned to users. Excludes protected roles that can only be assigned via database.
 *     tags:
 *       - Admin
 *     security:
 *       - NextAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved available roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *       403:
 *         description: Insufficient permissions - requires ADMIN.USERS_MANAGE permission
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 */

import { checkUserPermission } from '@lib/actions/permissions.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { PERMISSIONS } from '@lib/permissions/permissions';
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
async function getHandler(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
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

export const GET = withUniversalEnhancements(getHandler);
