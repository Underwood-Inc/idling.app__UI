/* eslint-disable custom-rules/enforce-link-target-blank */
import { auth } from '@lib/auth';
import type { Session } from 'next-auth';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { AuthAvatarServer } from '../auth-avatar/AuthAvatarServer';
import { SignOut } from '../auth-buttons/AuthButtons';
import { NavSignInLink } from './NavSignInLink';
import { InstantLink } from '../ui/InstantLink';
import { NavUserProfile } from './NavUserProfile';

interface NavAuthProps {
  /** Passed from {@link Nav} to avoid duplicate `auth()` during SSR. */
  session?: Session | null;
}

export async function NavAuth({ session: sessionFromNav }: NavAuthProps = {}) {
  const session = sessionFromNav ?? (await auth());

  if (!session) {
    return (
      <div className="nav__auth-links">
        <NavSignInLink />
      </div>
    );
  }

  const profileUrl = session.user?.id
    ? `/profile/${session.user.id}`
    : '/profile/unknown';

  return (
    <div className="nav__auth">
      <div className="nav__auth-links">
        <InstantLink href={profileUrl} data-testid={NAV_SELECTORS.PROFILE_LINK}>
          <div className="nav__user-profile">
            <NavUserProfile initialSession={session} />
            <AuthAvatarServer session={session} size="sm" className="nav__user-avatar" />
          </div>
        </InstantLink>
      </div>

      <SignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
    </div>
  );
}
