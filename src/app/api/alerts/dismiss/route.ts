/**
 * @swagger
 * /api/alerts/dismiss:
 *   post:
 *     summary: Dismiss an alert for the current user
 *     description: Dismisses a custom alert for the authenticated user and updates analytics
 *     tags:
 *       - Alerts
 *     security:
 *       - NextAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alertId:
 *                 type: number
 *                 description: ID of the alert to dismiss
 *                 example: 123
 *               userId:
 *                 type: number
 *                 description: ID of the user dismissing the alert (must match authenticated user)
 *                 example: 456
 *             required:
 *               - alertId
 *               - userId
 *     responses:
 *       200:
 *         description: Alert dismissed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request data"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Validation error details
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Unauthorized (user can only dismiss their own alerts)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Alert not found or not dismissible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to dismiss alert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
async function postHandler(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

export const POST = withUniversalEnhancements(postHandler);
