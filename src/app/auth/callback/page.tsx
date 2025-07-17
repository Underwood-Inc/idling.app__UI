import { auth } from '@lib/auth';
import { NAV_PATHS } from '@lib/routes';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loader from '../../components/loader/Loader';
import { PageContainer } from '../../components/page-container/PageContainer';
import { InstantLink } from '../../components/ui/InstantLink';
import { AutoRedirect } from './AutoRedirect';
import './callback.css';

interface CallbackSearchParams {
  redirect?: string;
  error?: string;
  provider?: string;
  state?: string;
}

// Component for handling OAuth account linking conflicts
function OAuthAccountConflictHandler({ provider }: { provider?: string }) {
  const providerName = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : 'OAuth';

  return (
    <div className="callback__error callback__error--account-conflict">
      <div className="callback__icon callback__icon--error">🔗</div>
      <h2 className="callback__title">Account Already Linked</h2>
      <div className="callback__message">
        <p>
          The {providerName} account you&apos;re trying to sign in with is
          already linked to another user account.
        </p>
        <p>
          This usually happens when you&apos;ve previously signed in with a
          different email address or account.
        </p>
      </div>

      <div className="callback__solutions">
        <h3>What would you like to do?</h3>

        <div className="callback__solution-options">
          <div className="callback__solution-option">
            <h4>Option 1: Sign in with your existing account</h4>
            <p>
              If you remember your other account, sign in with that instead.
            </p>
            <InstantLink
              href={NAV_PATHS.SIGNIN}
              className="callback__button callback__button--primary"
            >
              Sign in with different account
            </InstantLink>
          </div>

          <div className="callback__solution-option">
            <h4>Option 2: Unlink and relink this account</h4>
            <p>
              We can help you unlink this {providerName} account from the other
              user and link it to your current account.
            </p>
            <InstantLink
              href={`/auth/unlink-account?provider=${provider || 'oauth'}`}
              className="callback__button callback__button--secondary"
            >
              Unlink and relink account
            </InstantLink>
          </div>

          <div className="callback__solution-option">
            <h4>Option 3: Contact support</h4>
            <p>
              If you need help resolving this issue, our support team can assist
              you.
            </p>
            <InstantLink
              href="/support"
              className="callback__button callback__button--tertiary"
            >
              Contact Support
            </InstantLink>
          </div>
        </div>
      </div>

      <div className="callback__actions">
        <InstantLink
          href={NAV_PATHS.ROOT}
          className="callback__button callback__button--secondary"
        >
          Go Home
        </InstantLink>
      </div>
    </div>
  );
}

function CallbackContent({
  searchParams
}: {
  searchParams: CallbackSearchParams;
}) {
  const { redirect: redirectTo, error, provider } = searchParams;

  if (error) {
    // Special handling for OAuth account linking conflicts
    if (error === 'OAuthAccountNotLinked') {
      return <OAuthAccountConflictHandler provider={provider} />;
    }

    return (
      <div className="callback__error">
        <div className="callback__icon callback__icon--error">⚠️</div>
        <h2 className="callback__title">Authentication Error</h2>
        <p className="callback__message">
          {error === 'OAuthSignin' &&
            'There was an error with the OAuth sign-in process.'}
          {error === 'OAuthCallback' &&
            'There was an error during the OAuth callback.'}
          {error === 'OAuthCreateAccount' && 'Could not create OAuth account.'}
          {error === 'EmailCreateAccount' && 'Could not create email account.'}
          {error === 'Callback' &&
            'There was an error in the callback handler.'}
          {error === 'EmailSignin' && 'Check your email for the sign-in link.'}
          {error === 'CredentialsSignin' && 'Invalid credentials provided.'}
          {error === 'SessionRequired' && 'Please sign in to access this page.'}
          {![
            'OAuthSignin',
            'OAuthCallback',
            'OAuthCreateAccount',
            'EmailCreateAccount',
            'Callback',
            'OAuthAccountNotLinked',
            'EmailSignin',
            'CredentialsSignin',
            'SessionRequired'
          ].includes(error) && 'An unexpected authentication error occurred.'}
        </p>
        <div className="callback__actions">
          <InstantLink
            href={NAV_PATHS.SIGNIN}
            className="callback__button callback__button--primary"
          >
            Try Again
          </InstantLink>
          <InstantLink
            href={NAV_PATHS.ROOT}
            className="callback__button callback__button--secondary"
          >
            Go Home
          </InstantLink>
        </div>
      </div>
    );
  }

  return (
    <>
      <AutoRedirect redirectTo={redirectTo || NAV_PATHS.ROOT} />
      <div className="callback__success">
        <div className="callback__icon callback__icon--success">
          <div className="callback__spinner"></div>
        </div>
        <h2 className="callback__title">
          {provider
            ? `Signing in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`
            : 'Completing sign-in...'}
        </h2>
        <p className="callback__message">
          Please wait while we finish setting up your account.
        </p>
        <div className="callback__progress">
          <div className="callback__progress-bar">
            <div className="callback__progress-fill"></div>
          </div>
          <span className="callback__progress-text">
            Redirecting you shortly...
          </span>
        </div>
      </div>
    </>
  );
}

export default async function CallbackPage({
  searchParams
}: {
  searchParams: CallbackSearchParams;
}) {
  const session = await auth();

  // If user is already authenticated, redirect them immediately
  if (session) {
    const redirectTo = searchParams.redirect || NAV_PATHS.ROOT;
    redirect(redirectTo);
  }

  return (
    <PageContainer>
      <div className="callback__container">
        <Suspense fallback={<Loader />}>
          <CallbackContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
