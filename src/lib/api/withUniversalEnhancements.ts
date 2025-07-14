import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { withActiveAlerts } from './withActiveAlerts';
import { withPermissions } from './withPermissions';
import { withTimeoutInfo } from './withTimeoutInfo';

export interface UniversalApiResponse<T = any> {
  // Original response data
  data?: T;

  // Enhanced data from wrappers
  userPermissions: Record<string, string[]>;
  userRoles: string[];
  timeoutInfo: {
    is_timed_out: boolean;
    lastValidated: string | null;
    reason: string | null;
    userInfo: {
      id: number;
      username: string;
      email: string;
      is_active: boolean;
    } | null;
    userValidated: boolean;
  };
  activeAlertsInfo: {
    alerts: Array<{
      id: number;
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      is_dismissible: boolean;
      is_global: boolean;
      created_at: string;
      expires_at: string | null;
    }>;
    total_count: number;
    unread_count: number;
    high_priority_count: number;
    has_urgent: boolean;
  };
}

type ApiHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Universal API wrapper that applies all essential enhancements:
 * - Rate limiting
 * - User permissions (grouped by role)
 * - User timeout information
 * - Active alerts
 *
 * This single wrapper replaces the need for manual application of multiple wrappers
 * and ensures consistent data is available on every API response.
 */
export function withUniversalEnhancements(handler: ApiHandler) {
  // Apply all wrappers in the correct order:
  // 1. Rate limiting (first to prevent abuse)
  // 2. Permissions (core auth data)
  // 3. Timeout info (user status)
  // 4. Active alerts (user notifications)
  return withActiveAlerts(
    withTimeoutInfo(withPermissions(withRateLimit(handler)))
  );
}

/**
 * Convenience wrapper for handlers that don't need rate limiting
 * (e.g., internal endpoints or high-frequency endpoints)
 */
export function withUniversalEnhancementsNoRateLimit(handler: ApiHandler) {
  return withActiveAlerts(withTimeoutInfo(withPermissions(handler)));
}

/**
 * Minimal wrapper with just permissions and timeout info
 * (for endpoints that don't need alerts)
 */
export function withEssentialEnhancements(handler: ApiHandler) {
  return withTimeoutInfo(withPermissions(withRateLimit(handler)));
}
