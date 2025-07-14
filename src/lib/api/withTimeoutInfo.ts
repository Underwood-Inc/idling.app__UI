import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export interface TimeoutInfo {
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
}

type ApiHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Universal wrapper that adds user timeout information to every API response
 * Replaces the need for repeated /api/user/timeout requests
 */
export function withTimeoutInfo(handler: ApiHandler) {
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

      let timeoutInfo: TimeoutInfo = {
        is_timed_out: false,
        lastValidated: null,
        reason: null,
        userInfo: null,
        userValidated: false
      };

      if (session?.user?.id) {
        const userId = parseInt(session.user.id);

        // Get user info and timeout status
        const userResult = await sql<
          {
            id: number;
            username: string;
            email: string;
            is_active: boolean;
            timeout_until: string | null;
            timeout_reason: string | null;
            last_validated: string | null;
          }[]
        >`
          SELECT 
            id, username, email, is_active,
            timeout_until, timeout_reason, last_validated
          FROM users 
          WHERE id = ${userId}
        `;

        if (userResult.length > 0) {
          const user = userResult[0];
          const now = new Date();
          const timeoutUntil = user.timeout_until
            ? new Date(user.timeout_until)
            : null;

          timeoutInfo = {
            is_timed_out: timeoutUntil ? timeoutUntil > now : false,
            lastValidated: user.last_validated,
            reason: user.timeout_reason,
            userInfo: {
              id: user.id,
              username: user.username,
              email: user.email,
              is_active: user.is_active
            },
            userValidated:
              user.is_active && (!timeoutUntil || timeoutUntil <= now)
          };
        }
      } else {
        // Guest user
        timeoutInfo = {
          is_timed_out: false,
          lastValidated: new Date().toISOString(),
          reason: null,
          userInfo: null,
          userValidated: true
        };
      }

      // Parse existing response body
      const responseBody = await response.json();

      // Add timeout info to response
      const enhancedResponse = {
        ...responseBody,
        timeoutInfo
      };

      // Return new response with timeout data
      return NextResponse.json(enhancedResponse, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      // If timeout info fetch fails, return original response
      console.error('Error adding timeout info to response:', error);
      return response;
    }
  };
}
