import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';

export interface UserPermissionsResponse {
  userPermissions: Record<string, string[]>;
  userRoles: string[];
}

type ApiHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Universal wrapper that adds user permissions to every API response
 * Uses the existing robust permissions system
 */
export function withPermissions(handler: ApiHandler) {
  return async (req: NextRequest, ctx?: any) => {
    // Execute the original handler
    const response = await handler(req, ctx);

    // Only modify JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return response;
    }

    try {
      // Get user session
      const session = await auth();

      // Get user permissions grouped by role
      let userPermissions: Record<string, string[]> = {};
      let userRoles: string[] = [];

      if (session?.user?.id) {
        // Authenticated user - get their permissions grouped by role
        const userId = parseInt(session.user.id);

        // Get permissions with their associated roles
        const permissionsWithRoles = await sql<
          {
            permission_name: string;
            role_name: string | null;
          }[]
        >`
          SELECT DISTINCT p.name as permission_name, r.name as role_name
          FROM permissions p
          LEFT JOIN role_permissions rp ON p.id = rp.permission_id
          LEFT JOIN user_roles r ON rp.role_id = r.id
          LEFT JOIN user_role_assignments ura ON r.id = ura.role_id
          WHERE ura.user_id = ${userId}
          AND ura.is_active = true
          AND p.is_active = true
          AND (r.is_active = true OR r.is_active IS NULL)
          ORDER BY r.name, p.name
        `;

        // Group permissions by role
        const roleGroups: Record<string, string[]> = {};
        const roles = new Set<string>();

        permissionsWithRoles.forEach(({ permission_name, role_name }) => {
          if (role_name) {
            roles.add(role_name);
            if (!roleGroups[role_name]) {
              roleGroups[role_name] = [];
            }
            roleGroups[role_name].push(permission_name);
          }
        });

        // Also get any direct permissions (not from roles)
        const directPermissions = await sql<{ name: string }[]>`
          SELECT DISTINCT p.name
          FROM permissions p
          JOIN user_permissions up ON p.id = up.permission_id
          WHERE up.user_id = ${userId}
          AND up.is_active = true
          AND p.is_active = true
        `;

        if (directPermissions.length > 0) {
          roleGroups['direct'] = directPermissions.map((p) => p.name);
        }

        userPermissions = roleGroups;
        userRoles = Array.from(roles);
      } else {
        // Guest user - get guest permissions from existing role system
        try {
          const guestRoleResult = await sql<{ name: string }[]>`
             SELECT p.name
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id  
             JOIN user_roles ur ON rp.role_id = ur.id
             WHERE ur.name = 'guest'
             AND ur.is_active = true
             AND p.is_system = true
           `;

          if (guestRoleResult.length > 0) {
            userPermissions = {
              guest: guestRoleResult.map((p) => p.name)
            };
            userRoles = ['guest'];
          } else {
            // Fallback if no guest role exists
            userPermissions = { guest: [] };
            userRoles = ['guest'];
          }
        } catch (error) {
          console.error('Error fetching guest permissions:', error);
          userPermissions = { guest: [] };
          userRoles = ['guest'];
        }
      }

      // Parse existing response body
      const responseBody = await response.json();

      // Add permissions data to response
      const enhancedResponse = {
        ...responseBody,
        userPermissions,
        userRoles
      };

      // Return new response with permissions data
      return NextResponse.json(enhancedResponse, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      // If permissions fetch fails, return original response
      console.error('Error adding permissions to response:', error);
      return response;
    }
  };
}
