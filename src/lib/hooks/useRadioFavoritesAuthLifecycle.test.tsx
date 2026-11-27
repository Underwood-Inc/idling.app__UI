import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useRadioFavoritesAuthLifecycle } from './useRadioFavoritesAuthLifecycle';

const clearMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@widgets/radio-player/radioFavoritesLogoutCleanup', () => ({
  clearRadioAccountFavoritesOnLogout: () => clearMock(),
}));

describe('useRadioFavoritesAuthLifecycle', () => {
  test('when user id drops after sign-in, clears favorites and runs callback', () => {
    const onSignedOut = vi.fn();
    clearMock.mockClear();

    const { rerender } = renderHook(
      ({ userId }: { userId: string | null }) =>
        useRadioFavoritesAuthLifecycle(userId, onSignedOut),
      { initialProps: { userId: 'user-1' as string | null } }
    );

    rerender({ userId: null });

    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  test('when visitor was never signed in, does not clear on null user id', () => {
    clearMock.mockClear();
    const onSignedOut = vi.fn();

    renderHook(() => useRadioFavoritesAuthLifecycle(null, onSignedOut));

    expect(onSignedOut).not.toHaveBeenCalled();
    expect(clearMock).not.toHaveBeenCalled();
  });
});