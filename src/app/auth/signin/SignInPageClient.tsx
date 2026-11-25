'use client';

import { AUTH_EN } from '$i18n-source/auth.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useMemo } from 'react';
import { useIdlingLocale } from '../../components/locale/IdlingLocaleProvider';
import { ClientSignIn } from '../../components/auth-buttons/ClientAuthButtons';
import type { SignInProviders } from '../../components/auth-buttons/types';

export interface SignInPageClientProps {
  providers: SignInProviders[];
  redirectTo: string;
}

export function SignInPageClient({ providers, redirectTo }: SignInPageClientProps) {
  const { ll } = useIdlingLocale();
  const auth = useMemo(
    () => resolveCatalogFromLl(AUTH_EN, ll.auth as Record<string, unknown>),
    [ll]
  );

  return (
    <article className="signin__container">
      <div className="signin__header">
        <h1 className="signin__title">{auth.signInPage.headline}</h1>
        <p className="signin__subtitle">{auth.signInPage.subtitle}</p>
      </div>
      <div className="signin__providers">
        {providers.map((provider) => (
          <ClientSignIn key={provider} provider={provider} redirectTo={redirectTo} />
        ))}
      </div>
    </article>
  );
}