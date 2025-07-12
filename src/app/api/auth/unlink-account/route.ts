import { auth } from '@lib/auth';
import sql from '@lib/db';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
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

export const DELETE = withRateLimit(deleteHandler); 