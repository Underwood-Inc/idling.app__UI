'use client';

import { NAV_PATHS } from '@lib/routes';
import { useSession } from 'next-auth/react';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { ClientSignOut } from '../auth-buttons/ClientAuthButtons';
import { InstantLink } from '../ui/InstantLink';
import { NavUserProfile } from './NavUserProfile';

interface MobileNavAuthProps {
  onClose?: () => void;
}

export function MobileNavAuth({ onClose }: MobileNavAuthProps) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="nav__auth-links">
        <InstantLink
          href={NAV_PATHS.SIGNIN}
          data-testid={NAV_SELECTORS.SIGN_IN_LINK}
          onClick={onClose}
        >
          Sign In
        </InstantLink>
      </div>
    );
  }

  const profileUrl = session.user?.id
    ? `/profile/${session.user.id}`
    : '/profile/unknown';

  return (
    <div className="nav__auth">
      <div className="nav__auth-links">
        <InstantLink
          href={profileUrl}
          data-testid={NAV_SELECTORS.PROFILE_LINK}
          onClick={onClose}
        >
          <div className="nav__user-profile">
            <NavUserProfile initialSession={session} />
          </div>
        </InstantLink>
      </div>

      <ClientSignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
    </div>
  );
}
