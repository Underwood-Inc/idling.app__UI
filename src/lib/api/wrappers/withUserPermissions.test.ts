/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserPermissions } from './withUserPermissions';

// Mock the auth module using the correct alias
jest.mock('@lib/auth', () => ({
  auth: jest.fn()
}));

// Mock the permissions module using the correct alias
jest.mock('@lib/permissions/permissions', () => ({
  PermissionsService: {
    getUserPermissions: jest.fn()
  }
}));

// Import the mocked modules using the correct aliases
import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';

describe('withUserPermissions', () => {
  const mockHandler = jest.fn();
  const req = {} as NextRequest;
  const ctx = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds userPermissions to JSON response for authenticated user with permissions', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserPermissions as jest.Mock).mockResolvedValue([{ name: 'read' }, { name: 'write' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual(['read', 'write']);
    expect(data.foo).toBe('bar');
  });

  it('adds empty userPermissions if user has no permissions', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserPermissions as jest.Mock).mockResolvedValue([]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual([]);
  });

  it('does not add userPermissions if unauthenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toBeUndefined();
  });

  it('returns non-JSON response as is', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserPermissions as jest.Mock).mockResolvedValue([{ name: 'read' }]);
    const nonJson = new NextResponse('not json', { status: 200 });
    mockHandler.mockResolvedValue(nonJson);

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    expect(res).toBe(nonJson);
  });

  it('does not throw if PermissionsService fails', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserPermissions as jest.Mock).mockRejectedValue(new Error('fail'));
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserPermissions(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userPermissions).toEqual(undefined);
  });

  it('is composable with another wrapper', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserPermissions as jest.Mock).mockResolvedValue([{ name: 'read' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    // Dummy wrapper that adds a property
    const withExtra = (h: any) => async (req: any, ctx: any) => {
      const res = await h(req, ctx);
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