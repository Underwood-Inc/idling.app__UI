'use client';

import { signIn, signOut } from 'next-auth/react';
import { NAV_PATHS } from 'src/lib/routes';
import { AUTH_BUTTON_SELECTORS } from 'src/lib/test-selectors/components/auth-buttons.selectors';
import './AuthButtons.css';
import { SignInProviders } from './types';

export function ClientSignIn({
  provider,
  redirectTo
}: Readonly<{
  provider: SignInProviders;
  redirectTo?: string;
}>) {
  const handleSignIn = async () => {
    await signIn(provider, {
      callbackUrl: redirectTo || NAV_PATHS.ROOT,
      redirect: true
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="auth-button"
      data-testid={AUTH_BUTTON_SELECTORS.SIGN_IN}
    >
      Login with <span className="capitalize">{provider}</span>
    </button>
  );
}

export function ClientSignOut({
  'data-testid': dataTestId
}: {
  'data-testid'?: string;
}) {
  const handleSignOut = async () => {
    // Clear route-scoped filters before signing out
    try {
      const { clearAllRouteFilters } = await import('src/lib/state/atoms');
      clearAllRouteFilters();
    } catch (error) {
      console.warn('Failed to clear route filters on signout:', error);
    }

    await signOut({
      callbackUrl: NAV_PATHS.ROOT,
      redirect: true
    });
  };

  return (
    <button
      style={{
        fontSize: 'var(--font-size-lg)',
        top: '0.25rem',
        position: 'relative'
      }}
      type="button"
      onClick={handleSignOut}
      data-testid={dataTestId || AUTH_BUTTON_SELECTORS.SIGN_OUT}
    >
      Sign Out
    </button>
  );
}
