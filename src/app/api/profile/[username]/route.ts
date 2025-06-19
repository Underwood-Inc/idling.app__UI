import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  updateBioAction
} from '../../../../lib/actions/profile.actions';
import { auth } from '../../../../lib/auth';

export async function GET(
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

    const userProfile = await getUserProfile(username);

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public profile data
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Get the target user profile to verify ownership
    const targetProfile = await getUserProfile(username);

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Simple and secure: only allow users to edit their own profile
    if (session.user.id !== targetProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only update your own profile.' },
        { status: 403 }
      );
    }

    // Call the secure server action with proper validation
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
