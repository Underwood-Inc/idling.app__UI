import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '../../../../../lib/actions/permissions.actions';
import { auth } from '../../../../../lib/auth';
import { PERMISSIONS } from '../../../../../lib/permissions/permissions';

interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles?: Array<{
    id: string;
    name: string;
    assigned_at: string;
  }>;
  subscriptions?: Array<{
    id: string;
    service_name: string;
    plan_name: string;
    status: string;
    expires_at: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Get session and check admin permissions
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to view users
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_VIEW
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get search query
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Search users with roles and subscriptions
    const searchResults = await sql<SearchResult[]>`
      SELECT DISTINCT
        u.id::text,
        u.name,
        u.email,
        u.image,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ur.id::text,
              'name', r.name,
              'assigned_at', ura.assigned_at::text
            )
          ) FILTER (WHERE ur.id IS NOT NULL),
          '[]'::json
        ) as roles,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', us.id::text,
              'service_name', ss.name,
              'plan_name', sp.name,
              'status', us.status,
              'expires_at', us.expires_at::text
            )
          ) FILTER (WHERE us.id IS NOT NULL AND us.status = 'active'),
          '[]'::json
        ) as subscriptions
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN user_roles ur ON ura.role_id = ur.id
      LEFT JOIN roles r ON ur.id = r.id
      LEFT JOIN user_subscriptions us ON u.id = us.user_id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      LEFT JOIN subscription_services ss ON sp.service_id = ss.id
      WHERE (
        LOWER(u.name) LIKE $1 OR
        LOWER(u.email) LIKE $1 OR
        u.id::text LIKE $1
      )
      GROUP BY u.id, u.name, u.email, u.image
      ORDER BY 
        CASE 
          WHEN LOWER(u.name) LIKE $1 THEN 1
          WHEN LOWER(u.email) LIKE $1 THEN 2
          ELSE 3
        END,
        u.name NULLS LAST,
        u.email
      LIMIT 10
    `;

    return NextResponse.json({
      users: searchResults.rows || searchResults,
      count: (searchResults.rows || searchResults).length
    });

  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 