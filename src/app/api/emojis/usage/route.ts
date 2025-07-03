/**
 * @swagger
 * /api/emojis/usage:
 *   post:
 *     summary: Track emoji usage statistics
 *     description: Records usage statistics for emojis to track popularity and usage patterns
 *     tags:
 *       - Emojis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emoji_id:
 *                 type: string
 *                 description: ID of the emoji being used
 *                 example: "1f600"
 *               emoji_type:
 *                 type: string
 *                 enum: [windows, mac, custom]
 *                 description: Type of emoji being tracked
 *                 example: "windows"
 *             required:
 *               - emoji_id
 *               - emoji_type
 *     responses:
 *       200:
 *         description: Usage tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Emoji usage tracked successfully"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields: emoji_id and emoji_type"
 *       500:
 *         description: Failed to track usage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
