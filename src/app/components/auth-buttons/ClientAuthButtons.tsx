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
    await signOut({
      callbackUrl: NAV_PATHS.ROOT,
      redirect: true
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      data-testid={dataTestId || AUTH_BUTTON_SELECTORS.SIGN_OUT}
    >
      Sign Out
    </button>
  );
}
