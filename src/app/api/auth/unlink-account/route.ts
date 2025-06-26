import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { provider, currentUserEmail } = await request.json();

    // Validate required fields
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Find the account that has this OAuth provider linked
    const existingAccount = await sql`
      SELECT 
        a."userId",
        a."providerAccountId",
        u.email as user_email,
        u.name as user_name
      FROM accounts a
      JOIN users u ON a."userId" = u.id
      WHERE a.provider = ${provider}
      ORDER BY a."userId" DESC
      LIMIT 1
    `;

    if (existingAccount.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this OAuth provider' },
        { status: 404 }
      );
    }

    const accountToUnlink = existingAccount.rows[0];

    // Check if the account belongs to the current user
    if (accountToUnlink.userId === session.user.id) {
      return NextResponse.json(
        { error: 'This OAuth account is already linked to your current account' },
        { status: 400 }
      );
    }

    // Check if the current user is trying to unlink their own account
    if (accountToUnlink.user_email === currentUserEmail) {
      return NextResponse.json(
        { error: 'You cannot unlink your own account. Please contact support if you need assistance.' },
        { status: 400 }
      );
    }

    // Unlink the account from the other user
    await sql`
      DELETE FROM accounts 
      WHERE "userId" = ${accountToUnlink.userId} 
      AND provider = ${provider}
    `;

    return NextResponse.json({
      success: true,
      message: `Successfully unlinked ${provider} account from user ${accountToUnlink.user_email}`,
      unlinkedFrom: {
        userId: accountToUnlink.userId,
        email: accountToUnlink.user_email,
        name: accountToUnlink.user_name
      }
    });

  } catch (error) {
    console.error('Error unlinking OAuth account:', error);
    
    return NextResponse.json(
      { error: 'Failed to unlink account. Please try again or contact support.' },
      { status: 500 }
    );
  }
} 