import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';
import { withUserRoles } from './withUserRoles';

vi.mock('@lib/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@lib/permissions/permissions', () => ({
  PermissionsService: {
    getUserRoles: vi.fn()
  }
}));

describe('withUserRoles', () => {
  const mockHandler = vi.fn();
  const req = {} as NextRequest;
  const ctx = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('when a signed-in user has roles, the JSON response includes userRoles', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserRoles).mockResolvedValue([
      { name: 'admin' },
      { name: 'wizard' }
    ]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual(['admin', 'wizard']);
    expect(data.foo).toBe('bar');
  });

  test('when a signed-in user has no roles, userRoles is an empty list', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserRoles).mockResolvedValue([]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual([]);
  });

  test('when the caller is unauthenticated, userRoles is omitted', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toBeUndefined();
  });

  test('when the handler returns a non-JSON response, it is returned unchanged', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserRoles).mockResolvedValue([{ name: 'admin' }]);
    const nonJson = new NextResponse('not json', { status: 200 });
    mockHandler.mockResolvedValue(nonJson);

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    expect(res).toBe(nonJson);
  });

  test('when role lookup fails, the handler still returns without throwing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserRoles).mockRejectedValue(new Error('fail'));
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual(undefined);
  });

  test('when composed with another wrapper, both enhancements appear in the response', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserRoles).mockResolvedValue([{ name: 'admin' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const withExtra = (h: typeof mockHandler) => async (request: NextRequest, context: unknown) => {
      const res = await h(request, context);
      const data = await res.json();
      return NextResponse.json({ ...data, extra: 1 }, { status: res.status });
    };

    const wrapped = withUserRoles(withExtra(mockHandler));
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual(['admin']);
    expect(data.extra).toBe(1);
  });
});
