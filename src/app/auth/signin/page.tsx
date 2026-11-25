import { auth } from '@lib/auth';
import { NAV_PATHS } from '@lib/routes';
import { redirect } from 'next/navigation';
import { PageContainer } from 'src/app/components/page-container/PageContainer';
import { SignInProviders } from '../../components/auth-buttons/types';
import { OAuthAccountConflictHandler } from './OAuthAccountConflictHandler';
import { SignInPageClient } from './SignInPageClient';
import './page.css';

interface SignInSearchParams {
  redirect?: string;
  error?: string;
  provider?: string;
  reason?: string;
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SignInSearchParams>;
}) {
  const params = await searchParams;
  const session = await auth();
  let providers: SignInProviders[] = ['twitch', 'google'];
  const redirectTo = params.redirect || NAV_PATHS.ROOT;
  const error = params.error;
  const provider = params.provider;

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

  if (session && params.redirect) {
    redirect(params.redirect);
  } else if (session && !params.redirect) {
    redirect(NAV_PATHS.ROOT);
  }

  return (
    <PageContainer>
      <SignInPageClient providers={providers} redirectTo={redirectTo} />
    </PageContainer>
  );
}
