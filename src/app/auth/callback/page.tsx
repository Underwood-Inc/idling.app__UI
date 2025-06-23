import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
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

function CallbackContent({
  searchParams
}: {
  searchParams: CallbackSearchParams;
}) {
  const { redirect: redirectTo, error, provider } = searchParams;

  if (error) {
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
          {error === 'OAuthAccountNotLinked' &&
            'This account is already linked to another user.'}
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
