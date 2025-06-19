'use server';

import { UserProfileData } from '../../app/components/user-profile/UserProfile';
import { auth } from '../auth';
import sql from '../db';

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
    // First, try to find user in the users table (primary source)
    const userResult = await sql`
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
      WHERE LOWER(username) = LOWER(${username})
         OR LOWER(name) = LOWER(${username})
         OR id = ${username}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      // Fallback: try to find user in submissions table (for legacy support)
      const submissionUser = await sql`
        SELECT DISTINCT 
          author_id,
          author as username,
          MIN(submission_datetime) as created_at
        FROM submissions 
        WHERE LOWER(author) = LOWER(${username})
           OR author_id = ${username}
        GROUP BY author_id, author
        LIMIT 1
      `;

      if (submissionUser.length === 0) {
        return null;
      }

      const authorData = submissionUser[0];

      // Get submission statistics
      const stats = await sql`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts_count,
          COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies_count,
          MAX(submission_datetime) as last_activity
        FROM submissions 
        WHERE author_id = ${authorData.author_id}
      `;

      const userStats = stats[0];

      return {
        id: authorData.author_id,
        username: authorData.username,
        name: undefined,
        email: undefined,
        bio: undefined,
        location: undefined,
        image: undefined,
        created_at: authorData.created_at,
        profile_public: true, // Default to true for legacy users
        total_submissions: parseInt(userStats.total_submissions),
        posts_count: parseInt(userStats.posts_count),
        replies_count: parseInt(userStats.replies_count),
        last_activity: userStats.last_activity
      };
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
        WHERE author_id = ${user.id} OR LOWER(author) = LOWER(${user.username || user.name})
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.id.toString(),
      username: user.username,
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
    // First try to find the user in the NextAuth users table
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
      WHERE id = ${userId}
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
        WHERE author_id = ${userId} OR LOWER(author) = LOWER(${user.username || user.name})
      `;

      if (submissionStats.length > 0) {
        stats = submissionStats[0];
      }
    } catch (statsError) {
      // Stats not available, continue without them
    }

    return {
      id: user.id.toString(),
      username: user.username,
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
    username: string;
    bio: string;
    location: string;
    profile_public: boolean;
  }>
): Promise<UserProfileData | null> {
  try {
    if (Object.keys(updates).length === 0) {
      return getUserProfileById(userId);
    }

    // Handle each update type individually to avoid dynamic SQL issues
    let result;

    if (updates.bio !== undefined) {
      result = await sql`
        UPDATE users 
        SET bio = ${updates.bio}
        WHERE id = ${userId}
        RETURNING 
          id,
          username,
          name,
          email,
          bio,
          location,
          image,
          created_at,
          profile_public
      `;
    } else if (updates.username !== undefined) {
      result = await sql`
        UPDATE users 
        SET username = ${updates.username}
        WHERE id = ${userId}
        RETURNING 
          id,
          username,
          name,
          email,
          bio,
          location,
          image,
          created_at,
          profile_public
      `;
    } else if (updates.location !== undefined) {
      result = await sql`
        UPDATE users 
        SET location = ${updates.location}
        WHERE id = ${userId}
        RETURNING 
          id,
          username,
          name,
          email,
          bio,
          location,
          image,
          created_at,
          profile_public
      `;
    } else if (updates.profile_public !== undefined) {
      result = await sql`
        UPDATE users 
        SET profile_public = ${updates.profile_public}
        WHERE id = ${userId}
        RETURNING 
          id,
          username,
          name,
          email,
          bio,
          location,
          image,
          created_at,
          profile_public
      `;
    }

    if (!result || result.length === 0) {
      return null;
    }

    return {
      id: result[0].id.toString(),
      username: result[0].username,
      name: result[0].name,
      email: result[0].email,
      bio: result[0].bio,
      location: result[0].location,
      image: result[0].image,
      created_at: result[0].created_at,
      profile_public: result[0].profile_public
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

      // Enhanced profile ownership verification
      const sessionUserId = session.user.id;
      const sessionUserName = session.user.name;
      const sessionUserEmail = session.user.email;

      const canEdit =
        userProfile.id === sessionUserId ||
        (sessionUserName && userProfile.username === sessionUserName) ||
        (sessionUserEmail && userProfile.username === sessionUserEmail) ||
        (sessionUserName && userProfile.name === sessionUserName) ||
        (sessionUserEmail && userProfile.name === sessionUserEmail);

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

    // Enhanced profile ownership verification
    const sessionUserId = session.user.id;
    const sessionUserName = session.user.name;
    const sessionUserEmail = session.user.email;

    const canEdit =
      userProfile.id === sessionUserId ||
      (sessionUserName && userProfile.username === sessionUserName) ||
      (sessionUserEmail && userProfile.username === sessionUserEmail) ||
      (sessionUserName && userProfile.name === sessionUserName) ||
      (sessionUserEmail && userProfile.name === sessionUserEmail);

    if (!canEdit) {
      return {
        success: false,
        error: 'You can only edit your own profile'
      };
    }

    // Update the profile
    const updatedProfile = await updateUserProfile(sessionUserId, {
      bio: bio || undefined
    });

    if (!updatedProfile) {
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }

    // Get the complete profile with stats
    const completeProfile = await getUserProfileById(sessionUserId);

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
