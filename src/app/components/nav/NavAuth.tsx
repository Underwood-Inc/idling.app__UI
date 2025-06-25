/* eslint-disable custom-rules/enforce-link-target-blank */
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import { SignOut } from '../auth-buttons/AuthButtons';
import { InstantLink } from '../ui/InstantLink';
import { NavUserProfile } from './NavUserProfile';

export async function NavAuth() {
  const session = await auth();

  if (!session) {
    return (
      <div className="nav__auth-links">
        <InstantLink
          href={NAV_PATHS.SIGNIN}
          data-testid={NAV_SELECTORS.SIGN_IN_LINK}
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
        <InstantLink href={profileUrl} data-testid={NAV_SELECTORS.PROFILE_LINK}>
          <div className="nav__user-profile">
            <NavUserProfile />
          </div>
        </InstantLink>
      </div>

      <SignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
    </div>
  );
}
