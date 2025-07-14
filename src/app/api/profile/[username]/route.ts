import { updateBioAction } from '@lib/actions/profile.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import { withProfilePrivacy } from '@lib/utils/privacy';
import { getEffectiveCharacterCount } from '@lib/utils/string';
import { NextRequest, NextResponse } from 'next/server';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getHandler(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // ✅ CRITICAL: Only database ID supported after migration 0010
    // Username-based lookups are no longer supported for maximum reliability
    if (!/^\d+$/.test(username)) {
      return NextResponse.json(
        {
          error: 'Invalid profile identifier. Only database IDs are supported.'
        },
        { status: 400 }
      );
    }

    // Use privacy protection utility
    const { response, profile } = await withProfilePrivacy(username, false);

    if (response) {
      // Privacy check failed, return the error response
      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers
      });
    }

    // Return profile data
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function patchHandler(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // First, verify authentication with JWT
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { username } = params;
    const body = await request.json();
    const { bio } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (typeof bio !== 'string') {
      return NextResponse.json(
        { error: 'Bio must be a string' },
        { status: 400 }
      );
    }

    if (getEffectiveCharacterCount(bio) > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // ✅ CRITICAL: Only database ID supported after migration 0010
    if (!/^\d+$/.test(username)) {
      return NextResponse.json(
        {
          error: 'Invalid profile identifier. Only database IDs are supported.'
        },
        { status: 400 }
      );
    }

    // Use privacy protection utility - this will also verify the profile exists
    const { response: privacyResponse, profile: targetProfile } =
      await withProfilePrivacy(username, false);

    if (privacyResponse) {
      // Privacy check failed, return the error response
      return new NextResponse(privacyResponse.body, {
        status: privacyResponse.status,
        headers: privacyResponse.headers
      });
    }

    // Simple and secure: only allow users to edit their own profile
    if (session.user.id !== targetProfile!.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only update your own profile.' },
        { status: 403 }
      );
    }

    // Call the secure server action with proper validation (using database ID)
    const result = await updateBioAction(bio, username);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update bio' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.profile,
      message: 'Bio updated successfully'
    });
  } catch (error) {
    console.error('Error updating user bio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to handlers
export const GET = withUniversalEnhancements(getHandler);
export const PATCH = withUniversalEnhancements(patchHandler);
