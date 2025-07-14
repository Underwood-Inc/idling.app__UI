import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export interface ActiveAlert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_dismissible: boolean;
  is_global: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface ActiveAlertsInfo {
  alerts: ActiveAlert[];
  total_count: number;
  unread_count: number;
  high_priority_count: number;
  has_urgent: boolean;
}

type ApiHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Universal wrapper that adds active alerts information to every API response
 * Replaces the need for repeated /api/alerts/active requests
 */
export function withActiveAlerts(handler: ApiHandler) {
  return async (req: NextRequest, ctx?: any) => {
    // Execute the original handler
    const response = await handler(req, ctx);

    // Only modify JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return response;
    }

    try {
      const session = await auth();

      let activeAlertsInfo: ActiveAlertsInfo = {
        alerts: [],
        total_count: 0,
        unread_count: 0,
        high_priority_count: 0,
        has_urgent: false
      };

      if (session?.user?.id) {
        const userId = parseInt(session.user.id);

        // Get active alerts for the user
        const alertsResult = await sql<
          {
            id: number;
            title: string;
            message: string;
            type: 'info' | 'warning' | 'error' | 'success';
            priority: 'low' | 'medium' | 'high' | 'urgent';
            is_dismissible: boolean;
            is_global: boolean;
            created_at: string;
            expires_at: string | null;
            is_dismissed: boolean;
          }[]
        >`
          SELECT DISTINCT
            a.id, a.title, a.message, a.type, a.priority,
            a.is_dismissible, a.is_global, a.created_at, a.expires_at,
            CASE 
              WHEN ad.id IS NOT NULL THEN true 
              ELSE false 
            END as is_dismissed
          FROM alerts a
          LEFT JOIN alert_dismissals ad ON a.id = ad.alert_id AND ad.user_id = ${userId}
          WHERE a.is_active = true
          AND a.published_at IS NOT NULL
          AND a.published_at <= CURRENT_TIMESTAMP
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
          AND (
            a.is_global = true 
            OR EXISTS (
              SELECT 1 FROM alert_targets at
              WHERE at.alert_id = a.id
              AND (
                (at.target_type = 'user' AND at.target_id = ${userId})
                OR (at.target_type = 'role' AND at.target_id IN (
                  SELECT role_id FROM user_role_assignments 
                  WHERE user_id = ${userId} AND is_active = true
                ))
              )
            )
          )
          AND (NOT a.is_dismissible OR ad.id IS NULL)
          ORDER BY 
            CASE a.priority 
              WHEN 'urgent' THEN 1 
              WHEN 'high' THEN 2 
              WHEN 'medium' THEN 3 
              WHEN 'low' THEN 4 
            END,
            a.created_at DESC
          LIMIT 50
        `;

        const alerts = alertsResult.filter((alert) => !alert.is_dismissed);
        const totalCount = alerts.length;
        const unreadCount = alerts.filter(
          (alert) => !alert.is_dismissed
        ).length;
        const highPriorityCount = alerts.filter(
          (alert) => alert.priority === 'high' || alert.priority === 'urgent'
        ).length;
        const hasUrgent = alerts.some((alert) => alert.priority === 'urgent');

        activeAlertsInfo = {
          alerts: alerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            message: alert.message,
            type: alert.type,
            priority: alert.priority,
            is_dismissible: alert.is_dismissible,
            is_global: alert.is_global,
            created_at: alert.created_at,
            expires_at: alert.expires_at
          })),
          total_count: totalCount,
          unread_count: unreadCount,
          high_priority_count: highPriorityCount,
          has_urgent: hasUrgent
        };
      } else {
        // Guest user - get global public alerts only
        const guestAlertsResult = await sql<
          {
            id: number;
            title: string;
            message: string;
            type: 'info' | 'warning' | 'error' | 'success';
            priority: 'low' | 'medium' | 'high' | 'urgent';
            is_dismissible: boolean;
            is_global: boolean;
            created_at: string;
            expires_at: string | null;
          }[]
        >`
          SELECT 
            id, title, message, type, priority,
            is_dismissible, is_global, created_at, expires_at
          FROM alerts
          WHERE is_active = true
          AND is_global = true
          AND published_at IS NOT NULL
          AND published_at <= CURRENT_TIMESTAMP
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
          ORDER BY 
            CASE priority 
              WHEN 'urgent' THEN 1 
              WHEN 'high' THEN 2 
              WHEN 'medium' THEN 3 
              WHEN 'low' THEN 4 
            END,
            created_at DESC
          LIMIT 20
        `;

        const alerts = guestAlertsResult;
        const totalCount = alerts.length;
        const highPriorityCount = alerts.filter(
          (alert) => alert.priority === 'high' || alert.priority === 'urgent'
        ).length;
        const hasUrgent = alerts.some((alert) => alert.priority === 'urgent');

        activeAlertsInfo = {
          alerts,
          total_count: totalCount,
          unread_count: totalCount, // All alerts are "unread" for guests
          high_priority_count: highPriorityCount,
          has_urgent: hasUrgent
        };
      }

      // Parse existing response body
      const responseBody = await response.json();

      // Add active alerts info to response
      const enhancedResponse = {
        ...responseBody,
        activeAlertsInfo
      };

      // Return new response with alerts data
      return NextResponse.json(enhancedResponse, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      // If alerts fetch fails, return original response
      console.error('Error adding active alerts to response:', error);
      return response;
    }
  };
}
