/* eslint-disable custom-rules/enforce-link-target-blank */
import Link from 'next/link';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import { SignOut } from '../auth-buttons/AuthButtons';
import { Navbar } from '../navbar/Navbar';
import './Nav.css';
import { NavPaths } from './NavPaths';

export default async function Nav() {
  const session = await auth();

  return (
    <Navbar>
      <Navbar.Body className="nav__content">
        <Navbar.Content
          justify="center"
          className="nav__links nav__links--as-flex-end"
        >
          <NavPaths />
        </Navbar.Content>

        <Navbar.Content justify="center" className="nav__brand">
          <Navbar.Brand />

          <Link href={NAV_PATHS.ROOT} data-testid={NAV_SELECTORS.HOME_LINK}>
            <h1 className="nav__header">Idling.app</h1>
          </Link>
        </Navbar.Content>

        <Navbar.Content justify="end" className="nav--as-flex-end">
          <Navbar.Item className="nav__auth">
            {session?.user && (
              <Link
                href={`/profile/${encodeURIComponent(session.user.name || session.user.email || '')}`}
                className="nav__profile-link"
              >
                <p
                  className="header__user-name"
                  data-testid={NAV_SELECTORS.USER_NAME}
                >
                  {session.user.name}
                </p>
              </Link>
            )}

            {session ? (
              <SignOut data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON} />
            ) : (
              <Link
                href={NAV_PATHS.SIGNIN}
                data-testid={NAV_SELECTORS.SIGN_IN_LINK}
              >
                <button type="button">Sign In</button>
              </Link>
            )}
          </Navbar.Item>
        </Navbar.Content>
      </Navbar.Body>
    </Navbar>
  );
}
