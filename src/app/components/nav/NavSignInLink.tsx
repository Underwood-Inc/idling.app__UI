'use client';

import { NAV_PATHS } from '@lib/routes';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { InstantLink } from '../ui/InstantLink';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';

export interface NavSignInLinkProps {
  onClick?: () => void;
}

export function NavSignInLink({ onClick }: NavSignInLinkProps) {
  const { ll } = useIdlingLocale();

  return (
    <InstantLink
      href={NAV_PATHS.SIGNIN}
      data-testid={NAV_SELECTORS.SIGN_IN_LINK}
      onClick={onClick}
    >
      {ll.auth.signInNav()}
    </InstantLink>
  );
}