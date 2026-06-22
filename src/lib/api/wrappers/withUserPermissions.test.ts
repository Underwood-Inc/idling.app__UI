import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';
import { withUserPermissions } from './withUserPermissions';

vi.mock('@lib/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@lib/permissions/permissions', () => ({
  PermissionsService: {
    getUserPermissions: vi.fn()
  }
}));

describe('withUserPermissions', () => {
  const mockHandler = vi.fn();
  const req = {} as NextRequest;
  const ctx = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('when a signed-in user has permissions, the JSON response includes userPermissions', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserPermissions).mockResolvedValue([
      { name: 'read' },
      { name: 'write' }
    ]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual(['read', 'write']);
    expect(data.foo).toBe('bar');
  });

  test('when a signed-in user has no permissions, userPermissions is an empty list', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserPermissions).mockResolvedValue([]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual([]);
  });

  test('when the caller is unauthenticated, userPermissions is omitted', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toBeUndefined();
  });

  test('when the handler returns a non-JSON response, it is returned unchanged', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserPermissions).mockResolvedValue([{ name: 'read' }]);
    const nonJson = new NextResponse('not json', { status: 200 });
    mockHandler.mockResolvedValue(nonJson);

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    expect(res).toBe(nonJson);
  });

  test('when permission lookup fails, the handler still returns without throwing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserPermissions).mockRejectedValue(new Error('fail'));
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual(undefined);
  });

  test('when composed with another wrapper, both enhancements appear in the response', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(PermissionsService.getUserPermissions).mockResolvedValue([{ name: 'read' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const withExtra = (h: typeof mockHandler) => async (request: NextRequest, context: unknown) => {
      const res = await h(request, context);
      const data = await res.json();
      return NextResponse.json({ ...data, extra: 1 }, { status: res.status });
    };

    const wrapped = withUserPermissions(withExtra(mockHandler));
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual(['read']);
    expect(data.extra).toBe(1);
  });
});
