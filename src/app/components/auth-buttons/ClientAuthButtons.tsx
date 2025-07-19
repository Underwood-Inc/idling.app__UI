'use client';

import { NAV_PATHS } from '@lib/routes';
import { useSecureLogout } from '@lib/security/useSecureLogout';
import { AUTH_BUTTON_SELECTORS } from '@lib/test-selectors/components/auth-buttons.selectors';
import { signIn, signOut } from 'next-auth/react';
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
  const { secureLogout } = useSecureLogout();

  const handleSignOut = async () => {
    // SECURITY CRITICAL: Use secure logout to clear ALL cache and storage
    // This prevents cache-based permission leakage to subsequent users
    try {
      // eslint-disable-next-line no-console -- Security audit logging
      console.log(
        '🔒 SECURITY: Performing secure logout with comprehensive cache clearing...'
      );

      // Clear route-scoped filters first
      try {
        const { clearAllRouteFilters } = await import('src/lib/state/atoms');
        clearAllRouteFilters();
      } catch (error) {
        console.warn('Failed to clear route filters on signout:', error);
      }

      // Perform secure logout with comprehensive cache clearing
      await secureLogout({
        level: 'comprehensive' // Clear all caches and storage
      });

      // eslint-disable-next-line no-console -- Security audit logging
      console.log('✅ SECURITY: Secure logout completed successfully');
    } catch (error) {
      console.error(
        '❌ SECURITY: Secure logout failed, falling back to basic logout:',
        error
      );

      // Fallback to basic NextAuth logout if secure logout fails
      await signOut({
        callbackUrl: NAV_PATHS.ROOT,
        redirect: true
      });
    }
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
