import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '../../../../../lib/actions/permissions.actions';
import { auth } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import { PERMISSIONS } from '../../../../../lib/permissions/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at?: string;
  profile_public?: boolean;
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

    // Search users with basic information only (no admin tables)
    const searchResults = await sql<SearchResult[]>`
      SELECT 
        u.id::text,
        u.name,
        u.email,
        u.image,
        u.created_at::text,
        u.profile_public
      FROM users u
      WHERE (
        LOWER(u.name) LIKE ${searchTerm} OR
        LOWER(u.email) LIKE ${searchTerm} OR
        u.id::text LIKE ${searchTerm}
      )
      ORDER BY 
        CASE 
          WHEN LOWER(u.name) LIKE ${searchTerm} THEN 1
          WHEN LOWER(u.email) LIKE ${searchTerm} THEN 2
          ELSE 3
        END,
        u.name NULLS LAST,
        u.email
      LIMIT 10
    `;

    return NextResponse.json({
      users: searchResults,
      count: searchResults.length
    });

  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 