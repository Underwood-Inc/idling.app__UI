import { auth } from '@lib/auth';
import { NAV_PATHS } from '@lib/routes';
import { redirect } from 'next/navigation';
import { PageContainer } from 'src/app/components/page-container/PageContainer';
import { ClientSignIn } from '../../components/auth-buttons/ClientAuthButtons';
import { SignInProviders } from '../../components/auth-buttons/types';
import { OAuthAccountConflictHandler } from './OAuthAccountConflictHandler';
import './page.css';

export default async function Page({
  searchParams
}: {
  searchParams: Record<string, string>;
}) {
  const session = await auth();
  let providers: SignInProviders[] = ['twitch', 'google'];
  const redirectTo = searchParams.redirect || NAV_PATHS.ROOT;
  const error = searchParams.error;
  const provider = searchParams.provider;

  // Handle OAuth account linking conflicts
  if (error === 'OAuthAccountNotLinked') {
    return (
      <PageContainer>
        <div className="signin__container">
          <OAuthAccountConflictHandler provider={provider} />
        </div>
      </PageContainer>
    );
  }

  if (session && searchParams.redirect) {
    redirect(searchParams.redirect);
  } else if (session && !searchParams.redirect) {
    redirect(NAV_PATHS.ROOT);
  }

  return (
    <PageContainer>
      <article className="signin__container">
        <div className="signin__header">
          <h1 className="signin__title">Welcome to Idling App</h1>
          <p className="signin__subtitle">
            Choose your preferred sign-in method to continue
          </p>
        </div>
        <div className="signin__providers">
          {providers.map((provider) => (
            <ClientSignIn
              key={provider}
              provider={provider}
              redirectTo={redirectTo}
            />
          ))}
        </div>
      </article>
    </PageContainer>
  );
}
