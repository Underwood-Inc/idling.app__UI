/**
 * Emoji Usage API Routes
 * Handles tracking emoji usage statistics
 */

import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { trackEmojiUsage } from '../../../../lib/actions/emoji.actions';

/**
 * POST /api/emojis/usage
 * Track emoji usage statistics
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { emoji_id, emoji_type } = body;

    // Validate required fields
    if (!emoji_id || !emoji_type) {
      return NextResponse.json(
        { error: 'Missing required fields: emoji_id and emoji_type' },
        { status: 400 }
      );
    }

    // Validate emoji_type
    if (!['windows', 'mac', 'custom'].includes(emoji_type)) {
      return NextResponse.json(
        { error: 'Invalid emoji_type. Must be one of: windows, mac, custom' },
        { status: 400 }
      );
    }

    // Track the emoji usage using server action
    await trackEmojiUsage(emoji_type, emoji_id);

    return NextResponse.json(
      { success: true, message: 'Emoji usage tracked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking emoji usage:', error);
    return NextResponse.json(
      { error: 'Failed to track emoji usage' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postHandler);
