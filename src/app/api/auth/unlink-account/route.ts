/**
 * @swagger
 * /api/auth/unlink-account:
 *   delete:
 *     summary: Unlink an authentication provider account
 *     description: |
 *       Removes a linked authentication provider account from the user's profile.
 *       Users must have at least one authentication method remaining.
 *     tags:
 *       - Authentication
 *     security:
 *       - NextAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the provider account to unlink
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account unlinked successfully"
 *                 provider:
 *                   type: string
 *                   example: "google"
 *                   description: The provider that was unlinked
 *       400:
 *         description: Invalid request or cannot unlink the only authentication method
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cannot unlink the only authentication method"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Account not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function deleteHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Check if user has multiple accounts
    const userAccounts = await sql<{ id: number; provider: string }[]>`
      SELECT id, provider
      FROM accounts
      WHERE "userId" = ${userId}
    `;

    if (userAccounts.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot unlink the only authentication method' },
        { status: 400 }
      );
    }

    // Find the specific account to unlink
    const accountToUnlink = userAccounts.find(
      (account) => account.id === parseInt(providerId)
    );

    if (!accountToUnlink) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Delete the account
    const deletedAccounts = await sql<{ id: number }[]>`
      DELETE FROM accounts
      WHERE id = ${parseInt(providerId)} AND "userId" = ${userId}
      RETURNING id
    `;

    if (deletedAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to unlink account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account unlinked successfully',
      provider: accountToUnlink.provider
    });
  } catch (error) {
    console.error('Unlink account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const DELETE = withUniversalEnhancements(deleteHandler);
