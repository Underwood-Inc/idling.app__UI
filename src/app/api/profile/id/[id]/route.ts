/**
 * @swagger
 * /api/profile/id/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Retrieve a user's public profile information by their database ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]+$'
 *         description: Database ID of the user
 *         example: "123"
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: User database ID
 *                 username:
 *                   type: string
 *                   description: Username
 *                 display_name:
 *                   type: string
 *                   description: Display name
 *                 avatar_url:
 *                   type: string
 *                   description: Avatar image URL
 *                 bio:
 *                   type: string
 *                   description: User bio
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Account creation date
 *                 profile_visibility:
 *                   type: string
 *                   enum: [public, private, friends]
 *                   description: Profile visibility setting
 *       400:
 *         description: Invalid ID format or missing ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid profile identifier. Only database IDs are supported."
 *       404:
 *         description: User not found or profile is private
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { withProfilePrivacy } from '@lib/utils/privacy';
import { NextRequest, NextResponse } from 'next/server';

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
export const GET = withUniversalEnhancements(getHandler);
