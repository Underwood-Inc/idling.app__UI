import { PERMISSIONS } from '@lib/permissions/permissions';
import { auth } from '@lib/auth';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateUserPermission } from './validation';
import { requireAdminApiAccess } from './requireAdminApiAccess';

vi.mock('@lib/auth', () => ({
  auth: vi.fn()
}));

vi.mock('./validation', async () => {
  const actual = await vi.importActual<typeof import('./validation')>('./validation');
  return {
    ...actual,
    validateUserPermission: vi.fn()
  };
});

const mockedAuth = vi.mocked(auth);
const mockedValidateUserPermission = vi.mocked(validateUserPermission);

describe('requireAdminApiAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('when a visitor has no session, admin routes respond unauthorized', async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);

    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  test('when a signed-in member lacks admin.access, admin routes respond forbidden', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    mockedValidateUserPermission.mockResolvedValue({
      hasPermission: false,
      error: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS'
    });

    const result = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);

    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
    }
    expect(mockedValidateUserPermission).toHaveBeenCalledWith(42, PERMISSIONS.ADMIN.ACCESS);
  });

  test('when an admin with roles.manage permission opens a role assignment route, access is granted', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '7' } } as Awaited<ReturnType<typeof auth>>);
    mockedValidateUserPermission.mockResolvedValue({ hasPermission: true });

    const result = await requireAdminApiAccess(PERMISSIONS.ADMIN.ROLES_MANAGE);

    expect(result).toEqual({ granted: true, userId: 7 });
  });

  test('when a session carries a non-numeric user id, admin routes respond unauthorized', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'not-a-number' } } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);

    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.response.status).toBe(401);
    }
    expect(mockedValidateUserPermission).not.toHaveBeenCalled();
  });
});
