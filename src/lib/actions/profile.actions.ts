'use server';

import { auth } from '../auth';
import sql from '../db';
import { UserProfileData } from '../types/profile';

export interface ProfileFilters {
  username?: string;
  userId?: string;
  email?: string;
}

/**
 * Get user profile by username
 */
export async function getUserProfile(
  username: string
): Promise<UserProfileData | null> {
  try {
    // Clean modern profile lookup: providerAccountId first, then name
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
      WHERE a."providerAccountId" = ${username}
         OR LOWER(u.name) = LOWER(${username})
      ORDER BY 
        CASE 
          WHEN a."providerAccountId" = ${username} THEN 1
          WHEN LOWER(u.name) = LOWER(${username}) THEN 2
          ELSE 3
        END
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get submission statistics if they exist
    let stats = null;
    try {
      const submissionStats = await sql`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts_count,
          COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies_count,
          MAX(submission_datetime) as last_activity
        FROM submissions 
        WHERE author_id = ${user.id} OR LOWER(author) = LOWER(${user.name})
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.providerAccountId || user.id.toString(), // Use providerAccountId as primary ID
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
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user profile by user ID (for authenticated user's own profile)
 */
export async function getUserProfileById(
  userId: string
): Promise<UserProfileData | null> {
  try {
    // Find user by providerAccountId first (most reliable), then by database ID
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
      WHERE a."providerAccountId" = ${userId} OR u.id::text = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // Get submission statistics if they exist
    let stats = null;
    try {
      const submissionStats = await sql`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts_count,
          COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies_count,
          MAX(submission_datetime) as last_activity
        FROM submissions 
        WHERE author_id = ${userId} OR LOWER(author) = LOWER(${user.name})
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.providerAccountId || user.id.toString(), // Use providerAccountId as primary ID
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
      id: userRow.providerAccountId || userRow.id.toString(),
      username: userRow.name,
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
 * Server action to update user bio
 */
export async function updateUserBioAction(formData: FormData): Promise<{
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

    const bio = formData.get('bio') as string;
    const username = formData.get('username') as string;

    // Validate bio length
    if (bio && bio.length > 500) {
      return {
        success: false,
        error: 'Bio must be 500 characters or less'
      };
    }

    // Verify the user is updating their own profile
    if (username) {
      const userProfile = await getUserProfile(username);
      if (!userProfile) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Simple and secure: only check authenticated user ID
      const canEdit = userProfile.id === session.user.id;

      if (!canEdit) {
        return {
          success: false,
          error: 'You can only edit your own profile'
        };
      }
    }

    // Update the profile
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

/**
 * Alternative server action using direct bio and username parameters
 */
export async function updateBioAction(
  bio: string,
  username: string
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
    if (bio && bio.length > 500) {
      return {
        success: false,
        error: 'Bio must be 500 characters or less'
      };
    }

    // Verify the user is updating their own profile
    const userProfile = await getUserProfile(username);
    if (!userProfile) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Simple and secure: only check authenticated user ID
    const canEdit = userProfile.id === session.user.id;

    if (!canEdit) {
      return {
        success: false,
        error: 'You can only edit your own profile'
      };
    }

    // Update the profile
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
