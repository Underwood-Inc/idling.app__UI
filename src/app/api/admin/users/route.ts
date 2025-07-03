/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get users for admin management
 *     description: Retrieve a paginated list of users with comprehensive information for admin management
 *     tags:
 *       - Admin
 *     security:
 *       - NextAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name, email, or provider
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminUser'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions (admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * Admin User Management API
 * Handles user listing, searching, and basic management operations
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { createLogger } from '@/lib/logging';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { AdminUserSearchParamsSchema } from '@/lib/schemas/admin-users.schema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger({ 
  context: { 
    component: 'admin-users-api',
    context: 'server' 
  } 
});

export interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  created_at: string;
  profile_public?: boolean;
  bio?: string;
  location?: string;
  last_login?: string | null;
  login_count?: number;
  is_active?: boolean;
  admin_notes?: string | null;
  // Auth provider info
  provider_name?: string | null;
  provider_email?: string | null;
  provider_verified?: boolean;
  provider_last_used?: string | null;
  // Role summary
  role_count?: number;
  role_names?: string | null;
  has_admin?: boolean;
  has_moderator?: boolean;
  // Subscription summary
  subscription_count?: number;
  active_subscriptions?: number;
  subscription_names?: string | null;
  has_active_subscription?: boolean;
  // Timeout status
  is_timed_out?: boolean;
  timeout_count?: number;
  active_timeout_reason?: string | null;
  timeout_expires?: string | null;
  active_timeout_id?: number | null;
}

// GET /api/admin/users - Get users for admin management
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.error('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    logger.info('User requesting admin users', { userId });

    // Check if user has permission to view users
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_VIEW
    );
    logger.info('User permission check completed', { userId, hasPermission });
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminUserSearchParamsSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: paramsResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { page, limit, search } = paramsResult.data;
    const offset = (page - 1) * limit;

    logger.info('Processing validated query parameters', { page, limit, search, offset });

    // Build search query
    let whereClause = sql`WHERE 1=1`;
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereClause = sql`${whereClause} AND (
        LOWER(u.name) LIKE ${searchTerm} OR 
        LOWER(u.email) LIKE ${searchTerm} OR
        LOWER(pp.provider_name) LIKE ${searchTerm}
      )`;
    }

    // Get users with comprehensive information using new helper functions
    const users = await sql<AdminUser[]>`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.image, 
        u.created_at,
        u.profile_public, 
        u.bio, 
        u.location,
        u.last_login,
        u.login_count,
        u.is_active,
        u.admin_notes,
        -- Auth provider info
        pp.provider_name,
        pp.provider_email,
        pp.provider_verified,
        pp.last_used as provider_last_used,
        -- Role summary
        rs.role_count,
        rs.role_names,
        rs.has_admin,
        rs.has_moderator,
        -- Subscription summary
        ss.subscription_count,
        ss.active_subscriptions,
        ss.subscription_names,
        ss.has_active_subscription,
        -- Timeout status
        ts.is_timed_out,
        ts.timeout_count,
        ts.active_timeout_reason,
        ts.timeout_expires,
        ts.active_timeout_id
      FROM users u
      LEFT JOIN LATERAL get_user_primary_provider(u.id) pp ON true
      LEFT JOIN LATERAL get_user_role_summary(u.id) rs ON true
      LEFT JOIN LATERAL get_user_subscription_summary(u.id) ss ON true
      LEFT JOIN LATERAL get_user_timeout_status(u.id) ts ON true
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    logger.info('Users query completed', { foundUsers: users.length });

    // Get total count for pagination
    const totalResult = await sql<{ count: number }[]>`
      SELECT COUNT(*) as count 
      FROM users u
      LEFT JOIN LATERAL get_user_primary_provider(u.id) pp ON true
      ${whereClause}
    `;
    const total = totalResult[0]?.count || 0;

    logger.info('Total users count retrieved', { total });

    const response = {
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    };

    logger.info('API Response prepared', { 
      userCount: users.length, 
      currentPage: response.currentPage, 
      totalPages: response.totalPages 
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching admin users', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to handlers
export const GET = withRateLimit(getHandler);