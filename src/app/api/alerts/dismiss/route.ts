import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const dismissAlertSchema = z.object({
  alertId: z.number(),
  userId: z.number()
});

/**
 * POST /api/alerts/dismiss
 * 
 * Dismisses a custom alert for a specific user.
 * Updates both the dismissal tracking and analytics.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { alertId, userId } = dismissAlertSchema.parse(body);

    // Verify the user can only dismiss their own alerts
    if (parseInt(session.user.id) !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Dismiss the alert
    const result = await sql<[{ dismiss_alert_for_user: boolean }]>`
      SELECT dismiss_alert_for_user(${alertId}, ${userId}) as dismiss_alert_for_user
    `;

    const success = result[0]?.dismiss_alert_for_user;

    if (!success) {
      return NextResponse.json(
        { error: 'Alert not found or not dismissible' },
        { status: 404 }
      );
    }

    // Update analytics
    await sql`SELECT update_alert_analytics(${alertId}, 'dismiss')`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
} 