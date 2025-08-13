/**
 * User Search API
 * Provides search functionality for finding user profiles
 *
 * Accessibility:
 * - Guest users: Can search but only see public profiles
 * - Authenticated users: Can search and see both public and private profiles
 *
 * Privacy is enforced at search level, with additional checks at profile view level
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).optional().default(10)
});

async function searchHandler(request: NextRequest) {
  try {
    // Require authentication for user search
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to search users' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { q, limit: validatedLimit } = searchSchema.parse({
      q: query,
      limit: limit ? parseInt(limit) : 10
    });

    // Search for users by name, email, or username
    // Using ILIKE for case-insensitive search (PostgreSQL)
    const searchTerm = `%${q}%`;

    // Authenticated users can see all active users
    const users = await sql`
      SELECT 
        id,
        name,
        email,
        image,
        created_at,
        profile_public,
        -- Calculate relevance score
        CASE 
          WHEN LOWER(name) = LOWER(${q}) THEN 100
          WHEN LOWER(name) LIKE LOWER(${q + '%'}) THEN 90
          WHEN LOWER(email) = LOWER(${q}) THEN 85
          WHEN LOWER(email) LIKE LOWER(${q + '%'}) THEN 80
          WHEN LOWER(name) LIKE LOWER(${searchTerm}) THEN 70
          WHEN LOWER(email) LIKE LOWER(${searchTerm}) THEN 60
          ELSE 50
        END as relevance_score
      FROM users 
      WHERE 
        (
          LOWER(name) LIKE LOWER(${searchTerm}) OR 
          LOWER(email) LIKE LOWER(${searchTerm})
        )
        AND COALESCE(is_active, true) = TRUE
      ORDER BY relevance_score DESC, created_at DESC
      LIMIT ${validatedLimit}
    `;

    // Format results to match expected interface
    const formattedUsers = users.map((user) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      profile_public: user.profile_public
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: users.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching users:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

export const GET = withUniversalEnhancements(searchHandler);
