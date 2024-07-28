import { auth } from '../../../lib/auth';
import { SignIn, SignOut } from '../auth-buttons/AuthButtons';
import NavHomeAvatar from '../nav-home-avatar/NavHomeAvatar';
import './Header.css';

export default async function Header() {
  const session = await auth();

  return (
    <header className="header">
      <NavHomeAvatar />

      <div className="header__auth">
        {session && session.user && (
          <p className="header__user-name"> {session.user.name}</p>
        )}

        {session ? <SignOut /> : <SignIn />}
      </div>
    </header>
  );
}
