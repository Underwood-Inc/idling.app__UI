import { auth } from '@/lib/auth';
import { PermissionsService } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
/**
 * Wraps an API handler to always include the current user's roles in the JSON response.
 * Usage: export default withUserRoles(handler)
 */
export function withUserRoles<T = any>(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse<T>>
): (req: NextRequest, ctx: any) => Promise<NextResponse<T & { userRoles?: string[] }>> {
  return async (req, ctx) => {
    const session = await auth();
    let userRoles: string[] | undefined = undefined;
    if (session?.user?.id) {
      try {
        userRoles = (
          await PermissionsService.getUserRoles(parseInt(session.user.id))
        )?.map((r) => r.name) || [];
      } catch (e) {
        // Fail gracefully, do not block response
      }
    }
    const response = await handler(req, ctx);
    // Try to augment JSON response
    try {
      const data = await response.json();
      return NextResponse.json(
        { ...data, userRoles },
        { status: response.status }
      );
    } catch {
      // If not JSON, just return as is
      return response;
    }
  };
} 