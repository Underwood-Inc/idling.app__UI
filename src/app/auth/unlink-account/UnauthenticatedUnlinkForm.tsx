'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { InstantLink } from '../../components/ui/InstantLink';
import './UnlinkAccountForm.css';

interface UnauthenticatedUnlinkFormProps {
  provider: string;
  redirectTo: string;
}

export function UnauthenticatedUnlinkForm({
  provider,
  redirectTo
}: UnauthenticatedUnlinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'instructions'>('initial');

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

  const handleShowInstructions = () => {
    setStep('instructions');
  };

  const handleSignInWithProvider = async () => {
    setIsLoading(true);
    try {
      // Sign in with the specific provider
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
            To resolve this OAuth account conflict, you need to revoke access on{' '}
            {provider}&apos;s side. Follow these steps:
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
            onClick={() => setStep('initial')}
            className="unlink-account-form__button unlink-account-form__button--secondary"
          >
            Back to Previous Step
          </button>
          <button
            onClick={handleSignInWithProvider}
            className="unlink-account-form__button unlink-account-form__button--primary"
            disabled={isLoading}
          >
            {isLoading ? 'Redirecting...' : `Sign in with ${provider}`}
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
          You&apos;re trying to sign in with {provider}, but that account is
          already linked to another user.
        </p>
        <p>
          To resolve this, you need to revoke access on {provider}&apos;s side
          first.
        </p>
      </div>

      {error && (
        <div className="unlink-account-form__error">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="unlink-account-form__actions">
        <div className="unlink-account-form__action-group">
          <h4>Step 1: Revoke access on {provider}&apos;s side</h4>
          <p>
            You need to revoke access for &quot;Idling App&quot; in your{' '}
            {provider} account settings. This will allow you to sign in with
            this {provider} account.
          </p>
          <button
            onClick={handleShowInstructions}
            className="unlink-account-form__button unlink-account-form__button--primary"
            disabled={isLoading}
          >
            Show {provider} Instructions
          </button>
        </div>

        <div className="unlink-account-form__action-group">
          <h4>Step 2: Sign in with {provider}</h4>
          <p>
            After revoking access on {provider}&apos;s side, you can sign in
            with {provider} again.
          </p>
          <button
            onClick={handleSignInWithProvider}
            className="unlink-account-form__button unlink-account-form__button--secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Redirecting...' : `Sign in with ${provider}`}
          </button>
        </div>
      </div>

      <div className="unlink-account-form__help">
        <h4>Need help?</h4>
        <p>
          If you don&apos;t have access to the {provider} account or need
          assistance, please contact our support team.
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
