import { UserProfileData } from '../../app/components/user-profile/UserProfile';
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
    const result = await sql`
      SELECT 
        id,
        username,
        name,
        email,
        bio,
        location,
        image,
        avatar_seed,
        created_at,
        profile_public
      FROM users 
      WHERE username = ${username}
      AND profile_public = true
      LIMIT 1
    `;

    if (result.length === 0) {
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
      avatar_seed: result[0].avatar_seed,
      created_at: result[0].created_at,
      profile_public: result[0].profile_public
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
    const result = await sql`
      SELECT 
        id,
        username,
        name,
        email,
        bio,
        location,
        image,
        avatar_seed,
        created_at,
        profile_public
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
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
      avatar_seed: result[0].avatar_seed,
      created_at: result[0].created_at,
      profile_public: result[0].profile_public
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
    // Build dynamic update query
    const setClause = [];
    const values = [];

    if (updates.username !== undefined) {
      setClause.push(`username = $${setClause.length + 1}`);
      values.push(updates.username);
    }

    if (updates.bio !== undefined) {
      setClause.push(`bio = $${setClause.length + 1}`);
      values.push(updates.bio);
    }

    if (updates.location !== undefined) {
      setClause.push(`location = $${setClause.length + 1}`);
      values.push(updates.location);
    }

    if (updates.profile_public !== undefined) {
      setClause.push(`profile_public = $${setClause.length + 1}`);
      values.push(updates.profile_public);
    }

    if (setClause.length === 0) {
      return getUserProfileById(userId);
    }

    values.push(userId); // Add userId as the last parameter

    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(setClause.join(', '))}
      WHERE id = $${values.length}
      RETURNING 
        id,
        username,
        name,
        email,
        bio,
        location,
        image,
        avatar_seed,
        created_at,
        profile_public
    `;

    if (result.length === 0) {
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
      avatar_seed: result[0].avatar_seed,
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
        avatar_seed,
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
      avatar_seed: row.avatar_seed,
      created_at: row.created_at,
      profile_public: row.profile_public
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}
