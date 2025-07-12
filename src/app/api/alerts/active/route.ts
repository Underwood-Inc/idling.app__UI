/**
 * @swagger
 * /api/alerts/active:
 *   get:
 *     summary: Get active alerts for current user
 *     description: Fetches active custom alerts for the current user based on targeting rules and user permissions
 *     tags:
 *       - Alerts
 *     security:
 *       - NextAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved active alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomAlert'
 *       500:
 *         description: Failed to fetch alerts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface CustomAlert {
  id: number;
  title: string;
  message?: string;
  details?: string;
  alert_type: string;
  priority: number;
  icon?: string;
  dismissible: boolean;
  persistent: boolean;
  expires_at?: string;
  actions?: any;
  metadata?: any;
}

/**
 * GET /api/alerts/active
 * 
 * Fetches active custom alerts for the current user based on targeting rules.
 * Includes proper authentication and user targeting logic.
 */
export async function GET() {
  try {
    // Prevent database calls during build time
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json([]);
    }

    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    // Get active alerts for the user (or anonymous if not logged in)
    // Cast null to INTEGER to match function signature
    const alerts = await sql<CustomAlert[]>`
      SELECT * FROM get_active_alerts_for_user(${userId}::INTEGER)
    `;

    // Update analytics for views (only in runtime, not during build)
    if (alerts.length > 0 && process.env.NODE_ENV !== 'test') {
      const alertIds = alerts.map((alert: CustomAlert) => alert.id);
      await Promise.all(
        alertIds.map((alertId: number) =>
          sql`SELECT update_alert_analytics(${alertId}, 'view')`
        )
      );
    }

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
} 