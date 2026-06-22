import { auth } from '@lib/auth';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { NextResponse } from 'next/server';
import {
  createValidationFailureResponse,
  validateUserPermission
} from './validation';

export interface AdminApiAccessGranted {
  granted: true;
  userId: number;
}

export interface AdminApiAccessDenied {
  granted: false;
  response: NextResponse;
}

export type AdminApiAccessResult = AdminApiAccessGranted | AdminApiAccessDenied;

export async function requireAdminApiAccess(
  permission: string = PERMISSIONS.ADMIN.ACCESS
): Promise<AdminApiAccessResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      granted: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  const userId = parseInt(session.user.id, 10);

  if (Number.isNaN(userId)) {
    return {
      granted: false,
      response: NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    };
  }

  const permissionResult = await validateUserPermission(userId, permission);

  if (!permissionResult.hasPermission) {
    return {
      granted: false,
      response: createValidationFailureResponse(permissionResult, true)
    };
  }

  return { granted: true, userId };
}
