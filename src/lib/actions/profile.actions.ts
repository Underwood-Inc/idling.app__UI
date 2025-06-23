'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';
import { UserProfileData } from '../types/profile';
import { getEffectiveCharacterCount } from '../utils/string';

export interface ProfileFilters {
  username?: string;
  userId?: string;
  email?: string;
}

/**
 * @deprecated After migration 0011, use getUserProfileByDatabaseId() instead
 * This function is kept for backward compatibility but should not be used in new code
 */
export async function getUserProfile(
  identifier: string
): Promise<UserProfileData | null> {
  console.warn(
    'getUserProfile() is deprecated. Use getUserProfileByDatabaseId() instead.'
  );

  // If it's a numeric ID, use the proper function
  if (/^\d+$/.test(identifier)) {
    return getUserProfileByDatabaseId(identifier);
  }

  // For non-numeric identifiers, return null (no longer supported)
  return null;
}

/**
 * Get user profile by database ID (internal ID)
 */
export async function getUserProfileByDatabaseId(
  databaseId: string | number
): Promise<UserProfileData | null> {
  try {
    const userResult = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.bio,
        u.location,
        u.image,
        u.created_at,
        u.profile_public,
        a."providerAccountId"
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId"
      WHERE u.id = ${parseInt(databaseId.toString())}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get submission statistics
    let stats = null;
    try {
      const submissionStats = await sql`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts_count,
          COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies_count,
          MAX(submission_datetime) as last_activity
        FROM submissions 
        WHERE user_id = ${user.id}
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.id.toString(), // Use database internal ID for consistency
      providerAccountId: user.providerAccountId, // Keep OAuth provider ID separate
      username: user.name, // Use name as username for display
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      image: user.image,
      created_at: user.created_at,
      profile_public: user.profile_public,
      total_submissions: stats ? parseInt(stats.total_submissions) : 0,
      posts_count: stats ? parseInt(stats.posts_count) : 0,
      replies_count: stats ? parseInt(stats.replies_count) : 0,
      last_activity: stats?.last_activity || null
    };
  } catch (error) {
    console.error('Error fetching user profile by database ID:', error);
    return null;
  }
}

/**
 * Get user profile by user ID (for authenticated user's own profile)
 * This function handles both provider account IDs and database IDs
 */
export async function getUserProfileById(
  userId: string
): Promise<UserProfileData | null> {
  try {
    // First try as database ID (numeric)
    if (/^\d+$/.test(userId)) {
      const result = await getUserProfileByDatabaseId(userId);
      if (result) {
        return result;
      }
    }

    // Fallback to provider account ID lookup
    const result = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.bio,
        u.location,
        u.image,
        u.created_at,
        u.profile_public,
        a."providerAccountId"
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId"
      WHERE a."providerAccountId" = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // Get submission statistics
    let stats = null;
    try {
      const submissionStats = await sql`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts_count,
          COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies_count,
          MAX(submission_datetime) as last_activity
        FROM submissions 
        WHERE user_id = ${user.id}
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.id.toString(), // Use database internal ID for consistency with submissions
      providerAccountId: user.providerAccountId, // Keep OAuth provider ID separate
      username: user.name, // Use name as username for display
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      image: user.image,
      created_at: user.created_at,
      profile_public: user.profile_public,
      total_submissions: stats ? parseInt(stats.total_submissions) : 0,
      posts_count: stats ? parseInt(stats.posts_count) : 0,
      replies_count: stats ? parseInt(stats.replies_count) : 0,
      last_activity: stats?.last_activity || null
    };
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    bio: string;
    location: string;
    profile_public: boolean;
  }>
): Promise<UserProfileData | null> {
  try {
    if (Object.keys(updates).length === 0) {
      return getUserProfileById(userId);
    }

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (updates.bio !== undefined) {
      setClauses.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }
    if (updates.location !== undefined) {
      setClauses.push(`location = $${paramIndex++}`);
      values.push(updates.location);
    }
    if (updates.profile_public !== undefined) {
      setClauses.push(`profile_public = $${paramIndex++}`);
      values.push(updates.profile_public);
    }

    if (setClauses.length === 0) {
      return getUserProfileById(userId);
    }

    // Update user by providerAccountId or database ID
    const queryText = `
      UPDATE users 
      SET ${setClauses.join(', ')}
      WHERE id IN (
        SELECT u.id FROM users u 
        LEFT JOIN accounts a ON u.id = a."userId"
        WHERE a."providerAccountId" = $${paramIndex} OR u.id::text = $${paramIndex}
      )
      RETURNING 
        id,
        name,
        email,
        bio,
        location,
        image,
        created_at,
        profile_public
    `;

    const result = await sql.unsafe(queryText, [...values, userId]);

    if (!result || result.length === 0) {
      return null;
    }

    const updatedUser = result[0];

    // Get the providerAccountId for the return value
    const userWithAccount = await sql`
      SELECT u.*, a."providerAccountId"
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId"
      WHERE u.id = ${updatedUser.id}
      LIMIT 1
    `;

    const userRow = userWithAccount[0] || updatedUser;

    return {
      id: userRow.id.toString(), // Use database internal ID for consistency with submissions
      providerAccountId: userRow.providerAccountId, // Keep OAuth provider ID separate
      username: userRow.name, // Use name as username for display
      name: userRow.name,
      email: userRow.email,
      bio: userRow.bio,
      location: userRow.location,
      image: userRow.image,
      created_at: userRow.created_at,
      profile_public: userRow.profile_public
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Search for users by username or name
 */
export async function searchUsers(
  query: string,
  limit: number = 10
): Promise<UserProfileData[]> {
  try {
    const searchTerm = `%${query}%`;

    const result = await sql`
      SELECT 
        id,
        username,
        name,
        email,
        bio,
        location,
        image,
        created_at,
        profile_public
      FROM users 
      WHERE profile_public = true
      AND (
        username ILIKE ${searchTerm}
        OR name ILIKE ${searchTerm}
      )
      ORDER BY 
        CASE 
          WHEN username = ${query} THEN 1
          WHEN name = ${query} THEN 2
          WHEN username ILIKE ${query + '%'} THEN 3
          WHEN name ILIKE ${query + '%'} THEN 4
          ELSE 5
        END,
        username
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      id: row.id.toString(),
      username: row.username,
      name: row.name,
      email: row.email,
      bio: row.bio,
      location: row.location,
      image: row.image,
      created_at: row.created_at,
      profile_public: row.profile_public
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Server action to update user bio (database ID only after migration 0010)
 */
export async function updateBioAction(
  bio: string,
  identifier: string
): Promise<{
  success: boolean;
  error?: string;
  profile?: UserProfileData;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Validate bio length
    if (bio && getEffectiveCharacterCount(bio) > 500) {
      return {
        success: false,
        error: 'Bio must be 500 characters or less'
      };
    }

    // ✅ CRITICAL: Only database ID supported after migration 0010
    // Username-based lookups are no longer supported for maximum reliability
    if (!/^\d+$/.test(identifier)) {
      return {
        success: false,
        error: 'Invalid profile identifier. Only database IDs are supported.'
      };
    }

    // Direct database ID lookup - only supported method
    const userProfile = await getUserProfileByDatabaseId(identifier);

    if (!userProfile) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Simple and secure: only check authenticated user ID
    const canEdit = userProfile.id.toString() === session.user.id.toString();

    if (!canEdit) {
      return {
        success: false,
        error: 'You can only edit your own profile'
      };
    }

    // Update the profile using database ID
    const updatedProfile = await updateUserProfile(session.user.id, {
      bio: bio || undefined
    });

    if (!updatedProfile) {
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }

    // Get the complete profile with stats
    const completeProfile = await getUserProfileById(session.user.id);

    // Invalidate cache for database ID path only
    revalidatePath(`/profile/${userProfile.id}`); // Database ID path (only supported)
    revalidatePath('/profile'); // Profile listing pages
    revalidatePath('/', 'layout'); // Revalidate layout cache for any user data in headers/nav

    return {
      success: true,
      profile: completeProfile || updatedProfile
    };
  } catch (error) {
    console.error('Error updating user bio:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}
