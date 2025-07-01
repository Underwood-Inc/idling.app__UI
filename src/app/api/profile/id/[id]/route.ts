import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { withProfilePrivacy } from '../../../../../lib/utils/privacy';

async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // ✅ CRITICAL: Only database ID supported after migration 0010
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        {
          error: 'Invalid profile identifier. Only database IDs are supported.'
        },
        { status: 400 }
      );
    }

    // Use privacy protection utility
    const { response, profile } = await withProfilePrivacy(id, false);

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

// Apply rate limiting to handler
export const GET = withRateLimit(getHandler);
