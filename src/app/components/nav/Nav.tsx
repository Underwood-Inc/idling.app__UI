import Link from 'next/link';
import { auth } from '../../../lib/auth';
import { SignIn, SignOut } from '../auth-buttons/AuthButtons';
import { Navbar } from '../navbar/Navbar';
import './Nav.css';
import { NavPaths } from './NavPaths';

export default async function Nav() {
  const session = await auth();

  return (
    <Navbar>
      <Navbar.Brand />

      <Link href="/">
        <h3>Idling.app</h3>
      </Link>

      <div className="nav__content">
        <Navbar.Content justify="center" className="nav__links">
          <NavPaths />
        </Navbar.Content>

        <Navbar.Content justify="end">
          <Navbar.Item className="nav__auth">
            {session && session.user && (
              <p className="header__user-name"> {session.user.name}</p>
            )}

            {session ? <SignOut /> : <SignIn />}
          </Navbar.Item>
        </Navbar.Content>
      </div>
    </Navbar>
  );
}
