import {
  getUserProfileByDatabaseId,
  getUserProfileById
} from '../actions/profile.actions';
import { auth } from '../auth';
import { UserProfileData } from '../types/profile';

export interface PrivacyCheckResult {
  allowed: boolean;
  profile?: UserProfileData;
  error?: string;
  statusCode?: number;
}

/**
 * Check if a user can access a profile by database ID
 * @param profileId - The database ID of the profile to check
 * @returns Privacy check result with access permission and profile data
 */
export async function checkProfilePrivacyById(
  profileId: string
): Promise<PrivacyCheckResult> {
  try {
    // Get the profile
    const profile = await getUserProfileByDatabaseId(profileId);

    if (!profile) {
      return {
        allowed: false,
        error: 'User not found',
        statusCode: 404
      };
    }

    // Check if profile is public
    if (profile.profile_public !== false) {
      return {
        allowed: true,
        profile
      };
    }

    // Profile is private - check if user is the owner
    const session = await auth();
    const isOwner = session?.user?.id?.toString() === profile.id?.toString();

    if (isOwner) {
      return {
        allowed: true,
        profile
      };
    }

    // Private profile and user is not the owner
    return {
      allowed: false,
      error: 'This profile is private',
      statusCode: 403
    };
  } catch (error) {
    console.error('Error checking profile privacy:', error);
    return {
      allowed: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}

/**
 * Check if a user can access a profile by user ID
 * @param userId - The user ID of the profile to check
 * @returns Privacy check result with access permission and profile data
 */
export async function checkProfilePrivacyByUserId(
  userId: string
): Promise<PrivacyCheckResult> {
  try {
    // Get the profile
    const profile = await getUserProfileById(userId);

    if (!profile) {
      return {
        allowed: false,
        error: 'User not found',
        statusCode: 404
      };
    }

    // Check if profile is public
    if (profile.profile_public !== false) {
      return {
        allowed: true,
        profile
      };
    }

    // Profile is private - check if user is the owner
    const session = await auth();
    const isOwner = session?.user?.id?.toString() === profile.id?.toString();

    if (isOwner) {
      return {
        allowed: true,
        profile
      };
    }

    // Private profile and user is not the owner
    return {
      allowed: false,
      error: 'This profile is private',
      statusCode: 403
    };
  } catch (error) {
    console.error('Error checking profile privacy:', error);
    return {
      allowed: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}

/**
 * Middleware-style function to check profile privacy and return appropriate response
 * Use this in API routes to standardize privacy protection
 */
export async function withProfilePrivacy(
  profileIdentifier: string,
  isUserId: boolean = false
): Promise<{ response?: Response; profile?: UserProfileData }> {
  const result = isUserId
    ? await checkProfilePrivacyByUserId(profileIdentifier)
    : await checkProfilePrivacyById(profileIdentifier);

  if (!result.allowed) {
    return {
      response: new Response(JSON.stringify({ error: result.error }), {
        status: result.statusCode || 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { profile: result.profile };
}
