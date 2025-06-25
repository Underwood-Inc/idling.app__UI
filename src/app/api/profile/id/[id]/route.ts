import { NextRequest, NextResponse } from 'next/server';
import { withProfilePrivacy } from '../../../../../lib/utils/privacy';

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

    // Use privacy protection utility
    const { response, profile } = await withProfilePrivacy(userId, true);

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
    console.error('Error fetching user profile by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
