import { withUserPermissions } from '@/lib/api/wrappers/withUserPermissions';
import { withUserRoles } from '@/lib/api/wrappers/withUserRoles';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { AdminUserSimpleSearchParamsSchema } from '@/lib/schemas/admin-users.schema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
  profile_public: boolean;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  count: number;
  query: string;
}

/**
 * GET /api/admin/users/search - Search users for admin management
 * Query Parameters:
 * - q: Search query (minimum 2 characters, alphanumeric + @._- allowed)
 */
async function getHandler(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Validate search parameters
    const searchParams = request.nextUrl.searchParams;
    const paramsResult = AdminUserSimpleSearchParamsSchema.safeParse({
      q: searchParams.get('q'),
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters',
          details: paramsResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { q: query } = paramsResult.data;

    // Prepare search pattern with SQL injection protection
    const searchTerm = `%${query.toLowerCase()}%`;

    // Execute search with parameterized query
    const searchResults = await sql<UserSearchResult[]>`
      SELECT 
        u.id::text,
        u.name,
        u.email,
        u.image,
        u.created_at::text,
        COALESCE(u.profile_public, false) as profile_public
      FROM users u
      WHERE (
        LOWER(COALESCE(u.name, '')) LIKE ${searchTerm} OR
        LOWER(COALESCE(u.email, '')) LIKE ${searchTerm} OR
        u.id::text LIKE ${searchTerm}
      )
      AND u.id IS NOT NULL
      ORDER BY 
        CASE 
          WHEN LOWER(COALESCE(u.name, '')) LIKE ${searchTerm} THEN 1
          WHEN LOWER(COALESCE(u.email, '')) LIKE ${searchTerm} THEN 2
          ELSE 3
        END,
        u.name NULLS LAST,
        u.email NULLS LAST,
        u.id
      LIMIT 10
    `;

    const response: UserSearchResponse = {
      users: searchResults,
      count: searchResults.length,
      query: query
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin user search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

export const GET = withUserRoles(withUserPermissions(withRateLimit(getHandler as any) as any)) as any; 