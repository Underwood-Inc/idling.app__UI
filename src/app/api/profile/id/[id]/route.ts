import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileById } from '../../../../../lib/actions/profile.actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert to string if it's a number
    const userId = id.toString();

    const userProfile = await getUserProfileById(userId);

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public profile data
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
