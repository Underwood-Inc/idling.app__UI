import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import { PageContainer } from '../../components/page-container/PageContainer';
import { InstantLink } from '../../components/ui/InstantLink';
import { UnauthenticatedUnlinkForm } from './UnauthenticatedUnlinkForm';
import { UnlinkAccountForm } from './UnlinkAccountForm';
import './page.css';

interface UnlinkAccountSearchParams {
  provider?: string;
  redirect?: string;
}

export default async function UnlinkAccountPage({
  searchParams
}: {
  searchParams: UnlinkAccountSearchParams;
}) {
  const session = await auth();
  const { provider, redirect: redirectTo } = searchParams;

  // If no provider specified, redirect to callback with error
  if (!provider) {
    redirect(`${NAV_PATHS.CALLBACK}?error=OAuthAccountNotLinked`);
  }

  // If user is not authenticated, show unauthenticated unlink form
  if (!session) {
    return (
      <PageContainer>
        <div className="unlink-account__container">
          <div className="unlink-account__header">
            <div className="unlink-account__icon">🔗</div>
            <h1 className="unlink-account__title">Unlink OAuth Account</h1>
            <p className="unlink-account__subtitle">
              Resolve account linking conflicts
            </p>
          </div>

          <div className="unlink-account__content">
            <div className="unlink-account__info">
              <h2>About Account Linking Conflicts</h2>
              <p>
                When you try to sign in with an OAuth provider (like Google or
                Twitch) that&apos;s already linked to another account, we need
                to resolve this conflict.
              </p>

              <div className="unlink-account__steps">
                <h3>How this works:</h3>
                <ol>
                  <li>
                    We&apos;ll find the account that currently has this{' '}
                    {provider} account linked
                  </li>
                  <li>We&apos;ll unlink it from that account</li>
                  <li>You can then link it to your current account</li>
                  <li>This process is safe and won&apos;t delete any data</li>
                </ol>
              </div>

              <div className="unlink-account__warning">
                <h3>⚠️ Important Notes:</h3>
                <ul>
                  <li>
                    This will only unlink the OAuth provider, not delete any
                    user accounts
                  </li>
                  <li>All user data and submissions will be preserved</li>
                  <li>
                    You&apos;ll need to sign in with the other account to
                    complete the process
                  </li>
                  <li>
                    If you don&apos;t have access to the other account, contact
                    support
                  </li>
                </ul>
              </div>
            </div>

            <UnauthenticatedUnlinkForm
              provider={provider}
              redirectTo={redirectTo || NAV_PATHS.ROOT}
            />
          </div>

          <div className="unlink-account__actions">
            <InstantLink
              href={NAV_PATHS.ROOT}
              className="unlink-account__button unlink-account__button--secondary"
            >
              Cancel
            </InstantLink>
            <InstantLink
              href="/support"
              className="unlink-account__button unlink-account__button--tertiary"
            >
              Need Help?
            </InstantLink>
          </div>
        </div>
      </PageContainer>
    );
  }

  // If user is authenticated, show authenticated unlink form
  return (
    <PageContainer>
      <div className="unlink-account__container">
        <div className="unlink-account__header">
          <div className="unlink-account__icon">🔗</div>
          <h1 className="unlink-account__title">Unlink OAuth Account</h1>
          <p className="unlink-account__subtitle">
            Resolve account linking conflicts
          </p>
        </div>

        <div className="unlink-account__content">
          <div className="unlink-account__info">
            <h2>About Account Linking Conflicts</h2>
            <p>
              When you try to sign in with an OAuth provider (like Google or
              Twitch) that&apos;s already linked to another account, we need to
              resolve this conflict.
            </p>

            <div className="unlink-account__steps">
              <h3>How this works:</h3>
              <ol>
                <li>
                  We&apos;ll find the account that currently has this {provider}{' '}
                  account linked
                </li>
                <li>We&apos;ll unlink it from that account</li>
                <li>You can then link it to your current account</li>
                <li>This process is safe and won&apos;t delete any data</li>
              </ol>
            </div>

            <div className="unlink-account__warning">
              <h3>⚠️ Important Notes:</h3>
              <ul>
                <li>
                  This will only unlink the OAuth provider, not delete any user
                  accounts
                </li>
                <li>All user data and submissions will be preserved</li>
                <li>
                  You&apos;ll need to sign in with the other account to complete
                  the process
                </li>
                <li>
                  If you don&apos;t have access to the other account, contact
                  support
                </li>
              </ul>
            </div>
          </div>

          <UnlinkAccountForm
            provider={provider}
            redirectTo={redirectTo || NAV_PATHS.ROOT}
            currentUserEmail={session.user.email}
          />
        </div>

        <div className="unlink-account__actions">
          <InstantLink
            href={NAV_PATHS.ROOT}
            className="unlink-account__button unlink-account__button--secondary"
          >
            Cancel
          </InstantLink>
          <InstantLink
            href="/support"
            className="unlink-account__button unlink-account__button--tertiary"
          >
            Need Help?
          </InstantLink>
        </div>
      </div>
    </PageContainer>
  );
}
