import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export interface ActiveAlert {
  id: number;
  title: string;
  message?: string;
  details?: string;
  alert_type: string; // 'info', 'warning', 'error', 'success', 'maintenance', 'custom'
  priority: number;
  icon?: string;
  dismissible: boolean;
  persistent: boolean;
  expires_at?: string;
  actions?: any;
  metadata?: any;
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
 * Uses the existing custom_alerts system and get_active_alerts_for_user() function
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
      const userId = session?.user?.id ? parseInt(session.user.id) : null;

      let activeAlertsInfo: ActiveAlertsInfo = {
        alerts: [],
        total_count: 0,
        unread_count: 0,
        high_priority_count: 0,
        has_urgent: false
      };

      // Use the existing get_active_alerts_for_user function from the migration
      const alerts = await sql<ActiveAlert[]>`
        SELECT * FROM get_active_alerts_for_user(${userId}::INTEGER)
      `;

      const totalCount = alerts.length;
      const unreadCount = alerts.length; // All active alerts are considered "unread"
      const highPriorityCount = alerts.filter(
        (alert) => alert.priority > 0
      ).length;
      const hasUrgent = alerts.some((alert) => alert.priority >= 50); // Consider priority 50+ as urgent

      activeAlertsInfo = {
        alerts,
        total_count: totalCount,
        unread_count: unreadCount,
        high_priority_count: highPriorityCount,
        has_urgent: hasUrgent
      };

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
      // If alerts fetch fails, return original response with empty alerts
      console.error('Error adding active alerts to response:', error);

      try {
        const responseBody = await response.json();
        const enhancedResponse = {
          ...responseBody,
          activeAlertsInfo: {
            alerts: [],
            total_count: 0,
            unread_count: 0,
            high_priority_count: 0,
            has_urgent: false
          }
        };

        return NextResponse.json(enhancedResponse, {
          status: response.status,
          headers: response.headers
        });
      } catch {
        // If we can't parse the response, return original
        return response;
      }
    }
  };
}
