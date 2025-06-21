/* eslint-disable custom-rules/enforce-link-target-blank */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import { ClientSignOut } from '../auth-buttons/ClientAuthButtons';

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
      <form action={redirectToSignIn}>
        <button
          type="submit"
          className="auth-button"
          data-testid={NAV_SELECTORS.SIGN_IN_LINK}
        >
          Sign In
        </button>
      </form>
    );
  }

  return (
    <div className="nav__auth">
      <Link
        href={`/profile/${session.user?.name || 'unknown'}`}
        className="nav__profile-link"
        data-testid={NAV_SELECTORS.PROFILE_LINK}
      >
        <div className="nav__user-profile">
          <h3 className="header__user-name">{session.user?.name}</h3>
        </div>
      </Link>
      {hasAdminAccess && (
        <Link
          href={NAV_PATHS.ADMIN}
          className="nav__admin-link"
          data-testid={NAV_SELECTORS.ADMIN_LINK}
        >
          <span className="nav__admin-text">ADMIN</span>
        </Link>
      )}
      <ClientSignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
    </div>
  );
}
