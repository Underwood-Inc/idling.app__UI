/**
 * Admin Emoji Management API
 * Handles comprehensive emoji management including approval, rejection, deletion, and filtering
 */

import {
  approveCustomEmoji,
  deleteCustomEmoji,
  getPendingCustomEmojis,
  rejectCustomEmoji
} from '@lib/actions/emoji.actions';
import { checkUserPermission } from '@lib/actions/permissions.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { PERMISSIONS } from '@lib/permissions/permissions';
import {
  AdminEmojiActionSchema,
  AdminEmojiSearchParamsSchema
} from '@lib/schemas/admin-emojis.schema';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CustomEmoji {
  id: number;
  name: string;
  description: string;
  category: string;
  user_id: number;
  created_at: string;
  creator_email: string;
  image_data: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
}

// GET /api/admin/emojis - Get emojis for admin management
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to view emojis
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.EMOJI_APPROVE
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminEmojiSearchParamsSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search')
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: paramsResult.error.errors
        },
        { status: 400 }
      );
    }

    const { page, limit, status, search } = paramsResult.data;
    const offset = (page - 1) * limit;

    let emojis: CustomEmoji[] = [];
    let totalCount = 0;

    if (status === 'pending' || status === 'all') {
      // Get pending emojis using existing server action
      const pendingEmojis = await getPendingCustomEmojis(limit, offset);
      emojis = pendingEmojis.map((emoji) => ({
        ...emoji,
        approval_status: 'pending' as const
      }));
    }

    if (status === 'approved' || status === 'rejected' || status === 'all') {
      // Build where clause for approved/rejected emojis
      let whereClause = sql`WHERE ce.is_approved IS NOT NULL`;

      if (status === 'approved') {
        whereClause = sql`${whereClause} AND ce.is_approved = true`;
      } else if (status === 'rejected') {
        whereClause = sql`${whereClause} AND ce.is_approved = false`;
      }

      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        whereClause = sql`${whereClause} AND (
          LOWER(ce.name) LIKE ${searchTerm} OR 
          LOWER(ce.description) LIKE ${searchTerm} OR
          LOWER(u.email) LIKE ${searchTerm}
        )`;
      }

      // Get approved/rejected emojis
      const approvedRejectedEmojis = await sql<CustomEmoji[]>`
        SELECT 
          ce.id, ce.name, ce.description, ce.encrypted_image_data,
          ce.category_id::text as category, ce.user_id, ce.created_at,
          u.email as creator_email,
          CASE 
            WHEN ce.is_approved = true THEN 'approved'
            WHEN ce.is_approved = false THEN 'rejected'
            ELSE 'pending'
          END as approval_status,
          ce.approved_by as reviewed_by,
          ce.approved_at as reviewed_at
        FROM custom_emojis ce
        JOIN users u ON ce.user_id = u.id
        ${whereClause}
        ORDER BY ce.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      if (status === 'all') {
        emojis = [...emojis, ...approvedRejectedEmojis];
      } else {
        emojis = approvedRejectedEmojis;
      }
    }

    // Apply search filter to pending emojis if needed
    if (search && (status === 'pending' || status === 'all')) {
      emojis = emojis.filter(
        (emoji) =>
          emoji.name.toLowerCase().includes(search.toLowerCase()) ||
          emoji.description?.toLowerCase().includes(search.toLowerCase()) ||
          emoji.creator_email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count for pagination
    if (status === 'all') {
      const countResult = await sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM custom_emojis
      `;
      totalCount = countResult[0]?.count || 0;
    } else if (status === 'pending') {
      const countResult = await sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM custom_emojis WHERE is_approved IS NULL
      `;
      totalCount = countResult[0]?.count || 0;
    } else {
      const countResult = await sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM custom_emojis 
        WHERE is_approved = ${status === 'approved'}
      `;
      totalCount = countResult[0]?.count || 0;
    }

    return NextResponse.json({
      emojis,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
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
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const bodyResult = AdminEmojiActionSchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: bodyResult.error.errors
        },
        { status: 400 }
      );
    }

    const { emojiId, action, reason } = bodyResult.data;

    if (action === 'approve') {
      await approveCustomEmoji(emojiId, reason);
      return NextResponse.json({
        success: true,
        message: 'Emoji approved successfully'
      });
    } else {
      await rejectCustomEmoji(emojiId, reason!); // reason is validated by schema
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
async function deleteHandler(request: NextRequest) {
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

// Apply rate limiting to handlers
export const GET = withUniversalEnhancements(getHandler);
export const POST = withUniversalEnhancements(postHandler);
export const DELETE = withUniversalEnhancements(deleteHandler);
