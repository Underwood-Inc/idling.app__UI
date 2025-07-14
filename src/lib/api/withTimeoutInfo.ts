import { auth } from '@lib/auth';
import sql from '@lib/db';
import {
  PermissionsService,
  TIMEOUT_TYPES
} from '@lib/permissions/permissions';
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
  expires_at?: Date;
}

type ApiHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Universal wrapper that adds user timeout information to every API response
 * Uses the existing PermissionsService and timeout system
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
        lastValidated: new Date().toISOString(),
        reason: null,
        userInfo: null,
        userValidated: false
      };

      if (session?.user?.id) {
        const userId = parseInt(session.user.id);

        // Get user info from the database
        const userResult = await sql<
          {
            id: number;
            name: string;
            email: string;
            is_active: boolean;
          }[]
        >`
          SELECT id, name, email, 
                 COALESCE(is_active, true) as is_active
          FROM users 
          WHERE id = ${userId}
        `;

        if (userResult.length > 0) {
          const user = userResult[0];

          // Check timeout status using the existing PermissionsService
          const timeoutStatus = await PermissionsService.checkUserTimeout(
            userId,
            TIMEOUT_TYPES.POST_CREATION
          );

          timeoutInfo = {
            is_timed_out: timeoutStatus.is_timed_out,
            lastValidated: new Date().toISOString(),
            reason: timeoutStatus.reason || null,
            expires_at: timeoutStatus.expires_at,
            userInfo: {
              id: user.id,
              username: user.name || '',
              email: user.email || '',
              is_active: user.is_active
            },
            userValidated: user.is_active && !timeoutStatus.is_timed_out
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
      // If timeout info fetch fails, return original response with default info
      console.error('Error adding timeout info to response:', error);

      try {
        const responseBody = await response.json();
        const enhancedResponse = {
          ...responseBody,
          timeoutInfo: {
            is_timed_out: false,
            lastValidated: new Date().toISOString(),
            reason: null,
            userInfo: null,
            userValidated: false
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
