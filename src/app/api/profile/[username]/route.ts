import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  updateBioAction
} from '../../../../lib/actions/profile.actions';

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

    const result = await updateBioAction(bio, username);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update bio' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.profile
    });
  } catch (error) {
    console.error('Error updating user bio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
