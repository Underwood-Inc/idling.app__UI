'use client';

import { NAV_PATHS } from '@lib/routes';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { performSecureLogout } from 'src/lib/security/secure-logout';
import { InstantLink } from '../../components/ui/InstantLink';
import './UnlinkAccountForm.css';

interface UnlinkAccountFormProps {
  provider: string;
  redirectTo: string;
  currentUserEmail: string | null;
}

export function UnlinkAccountForm({
  provider,
  redirectTo,
  currentUserEmail
}: UnlinkAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'unlinked' | 'instructions'>(
    'initial'
  );
  const router = useRouter();

  const getProviderRevocationInstructions = () => {
    switch (provider.toLowerCase()) {
      case 'google':
        return {
          title: 'Revoke Google Access',
          steps: [
            'Go to your Google Account settings',
            'Visit: https://myaccount.google.com/permissions',
            'Find "Idling App" in the list of connected apps',
            'Click on it and select "Remove Access"',
            'Confirm the removal'
          ],
          link: 'https://myaccount.google.com/permissions'
        };
      case 'twitch':
        return {
          title: 'Revoke Twitch Access',
          steps: [
            'Go to your Twitch Account settings',
            'Visit: https://www.twitch.tv/settings/connections',
            'Find "Idling App" in the list of connected apps',
            'Click "Disconnect" next to it',
            'Confirm the disconnection'
          ],
          link: 'https://www.twitch.tv/settings/connections'
        };
      default:
        return {
          title: 'Revoke OAuth Access',
          steps: [
            'Go to your account settings for this provider',
            'Find the list of connected applications',
            'Look for "Idling App" or similar',
            'Remove or revoke access for this app',
            'Confirm the removal'
          ],
          link: null
        };
    }
  };

  const handleUnlinkAccount = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the API to unlink the account
      const response = await fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          currentUserEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlink account');
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(
          `Account unlinked from our database successfully! The ${provider} account has been removed from the other user.`
        );
        setStep('unlinked');
      } else {
        throw new Error(result.error || 'Failed to unlink account');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowInstructions = () => {
    setStep('instructions');
  };

  const handleSignInWithProvider = async () => {
    setIsLoading(true);
    try {
      // Clear caches/storage first, then sign out without redirect
      await performSecureLogout({ level: 'comprehensive' });
      await signOut({ redirect: false });

      // Then sign in with the specific provider
      await signIn(provider, {
        callbackUrl: redirectTo,
        redirect: true
      });
    } catch (err) {
      setError('Failed to redirect to sign in');
      setIsLoading(false);
    }
  };

  const instructions = getProviderRevocationInstructions();

  if (step === 'instructions') {
    return (
      <div className="unlink-account-form">
        <div className="unlink-account-form__section">
          <h3>{instructions.title}</h3>
          <p>
            To completely resolve this issue, you need to revoke access on&nbsp;
            {provider}&apos;s side as well. Follow these steps:
          </p>

          <div className="unlink-account-form__instructions">
            <ol>
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {instructions.link && (
            <div className="unlink-account-form__provider-link">
              <a
                href={instructions.link}
                target="_blank"
                rel="noopener noreferrer"
                className="unlink-account-form__button unlink-account-form__button--primary"
              >
                Open {provider} Settings
              </a>
            </div>
          )}
        </div>

        <div className="unlink-account-form__actions">
          <button
            onClick={() => setStep('unlinked')}
            className="unlink-account-form__button unlink-account-form__button--secondary"
          >
            Back to Previous Step
          </button>
          <button
            onClick={handleSignInWithProvider}
            className="unlink-account-form__button unlink-account-form__button--primary"
            disabled={isLoading}
          >
            {isLoading
              ? 'Signing out...'
              : `Sign out & sign in with ${provider}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="unlink-account-form">
      <div className="unlink-account-form__section">
        <h3>Current Situation</h3>
        <p>
          You&apos;re currently signed in as:{' '}
          <strong>{currentUserEmail}</strong>
        </p>
        <p>
          The {provider} account you want to link is currently connected to a
          different user account.
        </p>
      </div>

      {error && (
        <div className="unlink-account-form__error">
          <p>❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="unlink-account-form__success">
          <p>✅ {success}</p>
          <div className="unlink-account-form__success-actions">
            <button
              onClick={handleShowInstructions}
              className="unlink-account-form__button unlink-account-form__button--primary"
            >
              Next: Revoke Provider Access
            </button>
            <InstantLink
              href={NAV_PATHS.ROOT}
              className="unlink-account-form__button unlink-account-form__button--secondary"
            >
              Go Home
            </InstantLink>
          </div>
        </div>
      )}

      {step === 'initial' && (
        <div className="unlink-account-form__actions">
          <div className="unlink-account-form__action-group">
            <h4>Step 1: Unlink from our database</h4>
            <p>
              This will remove the {provider} account from the other user in our
              database, making it available for linking to your account.
            </p>
            <button
              onClick={handleUnlinkAccount}
              className="unlink-account-form__button unlink-account-form__button--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Unlinking...' : `Unlink ${provider} account`}
            </button>
          </div>

          <div className="unlink-account-form__action-group">
            <h4>Step 2: Revoke access on {provider}&apos;s side</h4>
            <p>
              You&apos;ll also need to revoke access on {provider}&apos;s side
              to completely resolve the conflict.
            </p>
            <button
              onClick={handleShowInstructions}
              className="unlink-account-form__button unlink-account-form__button--secondary"
              disabled={isLoading}
            >
              Show {provider} Instructions
            </button>
          </div>
        </div>
      )}

      <div className="unlink-account-form__help">
        <h4>Need help?</h4>
        <p>
          If you don&apos;t have access to the other account or need assistance,
          please contact our support team.
        </p>
        <InstantLink
          href="/support"
          className="unlink-account-form__button unlink-account-form__button--tertiary"
        >
          Contact Support
        </InstantLink>
      </div>
    </div>
  );
}
