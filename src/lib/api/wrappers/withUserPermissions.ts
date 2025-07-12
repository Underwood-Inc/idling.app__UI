import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Wraps an API handler to always include the current user's permissions in the JSON response.
 * Usage: export default withUserPermissions(handler)
 */
export function withUserPermissions<T = any>(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse<T>>
): (req: NextRequest, ctx: any) => Promise<NextResponse<T & { userPermissions?: string[] }>> {
  return async (req, ctx) => {
    const session = await auth();
    let userPermissions: string[] | undefined = undefined;
    if (session?.user?.id) {
      try {
        userPermissions = (
          await PermissionsService.getUserPermissions(parseInt(session.user.id))
        )?.map((p) => p.name) || [];
      } catch (e) {
        // Fail gracefully, do not block response
      }
    }
    const response = await handler(req, ctx);
    // Try to augment JSON response
    try {
      const data = await response.json();
      return NextResponse.json(
        { ...data, userPermissions },
        { status: response.status }
      );
    } catch {
      // If not JSON, just return as is
      return response;
    }
  };
} 