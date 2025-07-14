import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/[id]/dismiss
 *
 * Records that a user has dismissed a specific alert.
 * This prevents the alert from appearing again for that user.
 */
async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Check if alert exists and is active
    const [alert] = await sql`
      SELECT id, dismissible FROM custom_alerts 
      WHERE id = ${alertId} AND is_active = true AND is_published = true
    `;

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found or not active' },
        { status: 404 }
      );
    }

    if (!alert.dismissible) {
      return NextResponse.json(
        { error: 'Alert cannot be dismissed' },
        { status: 400 }
      );
    }

    // Record the dismissal (insert or update)
    await sql`
      INSERT INTO alert_dismissals (alert_id, user_id, dismissed_at)
      VALUES (${alertId}, ${userId}, NOW())
      ON CONFLICT (alert_id, user_id) 
      DO UPDATE SET dismissed_at = NOW()
    `;

    // Update analytics
    await sql`
      SELECT update_alert_analytics(${alertId}, 'dismiss')
    `;

    return NextResponse.json({
      message: 'Alert dismissed successfully',
      alertId,
      userId
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}

export const POST = withUniversalEnhancements(postHandler);
