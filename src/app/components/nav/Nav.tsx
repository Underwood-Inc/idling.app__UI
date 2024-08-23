import Link from 'next/link';
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

          <Link href={NAV_PATHS.ROOT}>
            <h1>Idling.app</h1>
          </Link>
        </Navbar.Content>

        <Navbar.Content justify="end" className="nav--as-flex-end">
          <Navbar.Item className="nav__auth">
            {session?.user && (
              <p className="header__user-name"> {session.user.name}</p>
            )}

            {session ? (
              <SignOut />
            ) : (
              <Link href={NAV_PATHS.SIGNIN}>
                <button type="button">Sign In</button>
              </Link>
            )}
          </Navbar.Item>
        </Navbar.Content>
      </Navbar.Body>
    </Navbar>
  );
}
