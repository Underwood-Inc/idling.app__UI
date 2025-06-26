'use client';

import { signOut } from 'next-auth/react';
import { NAV_PATHS } from '../../../lib/routes';
import { InstantLink } from '../../components/ui/InstantLink';

interface OAuthAccountConflictHandlerProps {
  provider?: string;
}

export function OAuthAccountConflictHandler({
  provider
}: OAuthAccountConflictHandlerProps) {
  const providerName = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : 'OAuth';

  const handleSignOutAndSignIn = async () => {
    try {
      // Sign out current user and redirect to sign in
      await signOut({
        callbackUrl: NAV_PATHS.SIGNIN,
        redirect: true
      });
    } catch (error) {
      // Fallback to regular link if signOut fails
      window.location.href = NAV_PATHS.SIGNIN;
    }
  };

  return (
    <div className="signin__error signin__error--account-conflict">
      <div className="signin__error-icon">🔗</div>
      <h1 className="signin__error-title">Account Already Linked</h1>
      <div className="signin__error-message">
        <p>
          The {providerName} account you&apos;re trying to sign in with is
          already linked to another user account.
        </p>
        <p>
          This usually happens when you&apos;ve previously signed in with a
          different email address or account.
        </p>
      </div>

      <div className="signin__error-solutions">
        <h2>What would you like to do?</h2>

        <div className="signin__error-solution-options">
          <div className="signin__error-solution-option">
            <h3>Option 1: Sign in with a different account</h3>
            <p>
              Sign out and sign in with a different account that doesn&apos;t
              have this {providerName} account linked.
            </p>
            <button
              onClick={handleSignOutAndSignIn}
              className="signin__error-button signin__error-button--primary"
            >
              Sign out & sign in with different account
            </button>
          </div>

          <div className="signin__error-solution-option">
            <h3>Option 2: Unlink and relink this account</h3>
            <p>
              We can help you unlink this {providerName} account from the other
              user and link it to your current account.
            </p>
            <InstantLink
              href={`/auth/unlink-account?provider=${provider || 'oauth'}`}
              className="signin__error-button signin__error-button--secondary"
            >
              Unlink and relink account
            </InstantLink>
          </div>

          <div className="signin__error-solution-option">
            <h3>Option 3: Contact support</h3>
            <p>
              If you need help resolving this issue, our support team can assist
              you.
            </p>
            <InstantLink
              href="/support"
              className="signin__error-button signin__error-button--tertiary"
            >
              Contact Support
            </InstantLink>
          </div>
        </div>
      </div>

      <div className="signin__error-actions">
        <InstantLink
          href={NAV_PATHS.ROOT}
          className="signin__error-button signin__error-button--secondary"
        >
          Go Home
        </InstantLink>
      </div>
    </div>
  );
}
