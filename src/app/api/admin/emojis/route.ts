/**
 * Admin Emoji Management API
 * Handles emoji approval, rejection, and management using server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  approveCustomEmoji,
  deleteCustomEmoji,
  getPendingCustomEmojis,
  rejectCustomEmoji
} from '../../../../lib/actions/emoji.actions';

interface CustomEmoji {
  id: number;
  name: string;
  display_name: string;
  category: string;
  created_by: number;
  created_at: string;
  creator_email: string;
  image_data: string | null;
}

// GET /api/admin/emojis - Get emojis for admin review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get pending emojis using server action
    const emojis = await getPendingCustomEmojis(limit, offset);

    return NextResponse.json({
      emojis,
      pagination: {
        page,
        limit,
        total: emojis.length,
        totalPages: Math.ceil(emojis.length / limit),
        hasNext: emojis.length === limit,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin emojis:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch emojis'
      },
      {
        status:
          error instanceof Error && error.message.includes('permissions')
            ? 403
            : 500
      }
    );
  }
}

// POST /api/admin/emojis - Approve or reject emoji
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emojiId, action, reason } = body;

    if (!emojiId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'approve') {
      await approveCustomEmoji(emojiId, reason);
      return NextResponse.json({
        success: true,
        message: 'Emoji approved successfully'
      });
    } else {
      if (!reason) {
        return NextResponse.json(
          { error: 'Reason is required for rejection' },
          { status: 400 }
        );
      }
      await rejectCustomEmoji(emojiId, reason);
      return NextResponse.json({
        success: true,
        message: 'Emoji rejected successfully'
      });
    }
  } catch (error) {
    console.error('Error processing emoji:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process emoji'
      },
      {
        status:
          error instanceof Error && error.message.includes('permissions')
            ? 403
            : 500
      }
    );
  }
}

// DELETE /api/admin/emojis - Delete emoji
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emojiId = parseInt(searchParams.get('id') || '0');
    const reason = searchParams.get('reason') || 'Deleted by admin';

    if (!emojiId) {
      return NextResponse.json(
        { error: 'Emoji ID is required' },
        { status: 400 }
      );
    }

    await deleteCustomEmoji(emojiId, reason);

    return NextResponse.json({
      success: true,
      message: 'Emoji deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emoji:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete emoji'
      },
      {
        status:
          error instanceof Error && error.message.includes('permissions')
            ? 403
            : 500
      }
    );
  }
}
