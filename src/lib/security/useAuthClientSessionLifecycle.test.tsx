/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { useAuthClientSessionLifecycle } from './useAuthClientSessionLifecycle';

const purgeMock = vi.fn().mockResolvedValue(undefined);

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('./purgeUserScopedClientStorage', () => ({
  purgeUserScopedClientStorage: (reason: string) => purgeMock(reason),
}));

import { useSession } from 'next-auth/react';

describe('useAuthClientSessionLifecycle', () => {
  beforeEach(() => {
    purgeMock.mockClear();
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
  });

  test('on first resolve with no session, purges unauthenticated caches', () => {
    renderHook(() => useAuthClientSessionLifecycle());
    expect(purgeMock).toHaveBeenCalledWith('unauthenticated');
  });

  test('when session resolves signed in then signs out, purges on sign-out', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '7' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });

    const { rerender } = renderHook(() => useAuthClientSessionLifecycle());
    purgeMock.mockClear();

    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
    rerender();

    expect(purgeMock).toHaveBeenCalledWith('sign-out');
  });

  test('when account id changes, purges account-switch caches', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });

    const { rerender } = renderHook(() => useAuthClientSessionLifecycle());
    purgeMock.mockClear();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '2' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
    rerender();

    expect(purgeMock).toHaveBeenCalledWith('account-switch');
  });
});