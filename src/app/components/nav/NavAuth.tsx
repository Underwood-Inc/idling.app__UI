/* eslint-disable custom-rules/enforce-link-target-blank */
import { redirect } from 'next/navigation';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import { SignOut } from '../auth-buttons/AuthButtons';
import { FontPicker } from '../font-picker/FontPicker';
import { InstantLink } from '../ui/InstantLink';

interface NavAuthProps {
  hasAdminAccess: boolean;
}

async function redirectToSignIn() {
  'use server';
  redirect(NAV_PATHS.SIGNIN);
}

export async function NavAuth({ hasAdminAccess }: NavAuthProps) {
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

  return (
    <div className="nav__auth">
      <div className="nav__auth-links">
        <InstantLink
          href={`/profile/${session.user?.name || 'unknown'}`}
          data-testid={NAV_SELECTORS.PROFILE_LINK}
        >
          <div className="nav__user-profile">
            <h3 className="header__user-name">{session.user?.name}</h3>
          </div>
        </InstantLink>
      </div>
      {hasAdminAccess && (
        <div className="nav__auth-links">
          <InstantLink
            href={NAV_PATHS.ADMIN}
            data-testid={NAV_SELECTORS.ADMIN_LINK}
          >
            <span className="nav__admin-text">ADMIN</span>
          </InstantLink>
        </div>
      )}
      <div className="nav__font-picker">
        <FontPicker />
      </div>
      <SignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
    </div>
  );
}
