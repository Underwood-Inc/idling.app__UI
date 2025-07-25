/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserRoles } from './withUserRoles';

// Mock the auth module using the correct alias
jest.mock('@lib/auth', () => ({
  auth: jest.fn()
}));

// Mock the permissions module using the correct alias
jest.mock('@lib/permissions/permissions', () => ({
  PermissionsService: {
    getUserRoles: jest.fn()
  }
}));

// Import the mocked modules using the correct aliases
import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';

describe('withUserRoles', () => {
  const mockHandler = jest.fn();
  const req = {} as NextRequest;
  const ctx = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds userRoles to JSON response for authenticated user with roles', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserRoles as jest.Mock).mockResolvedValue([{ name: 'admin' }, { name: 'wizard' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual(['admin', 'wizard']);
    expect(data.foo).toBe('bar');
  });

  it('adds empty userRoles if user has no roles', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserRoles as jest.Mock).mockResolvedValue([]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual([]);
  });

  it('does not add userRoles if unauthenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toBeUndefined();
  });

  it('returns non-JSON response as is', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserRoles as jest.Mock).mockResolvedValue([{ name: 'admin' }]);
    const nonJson = new NextResponse('not json', { status: 200 });
    mockHandler.mockResolvedValue(nonJson);

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    expect(res).toBe(nonJson);
  });

  it('does not throw if PermissionsService fails', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserRoles as jest.Mock).mockRejectedValue(new Error('fail'));
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    const wrapped = withUserRoles(mockHandler);
    const res = await wrapped(req, ctx);
    const data = await res.json();
    expect(data.userRoles).toEqual(undefined);
  });

  it('is composable with another wrapper', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '42' } });
    (PermissionsService.getUserRoles as jest.Mock).mockResolvedValue([{ name: 'admin' }]);
    mockHandler.mockResolvedValue(NextResponse.json({ foo: 'bar' }));

    // Dummy wrapper that adds a property
    const withExtra = (h: any) => async (req: any, ctx: any) => {
      const res = await h(req, ctx);
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