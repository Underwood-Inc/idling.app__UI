import { auth } from "../../../../auth";
import { SignIn, SignOut } from "../auth-buttons/AuthButtons";
import NavHomeAvatar from "../nav-home-avatar/NavHomeAvatar";
import "./Header.css";

async function Header() {
  const session = await auth();

  return (
    <div className="header">
      <NavHomeAvatar />

      <div className="header__auth">
        {session && session.user && <p> {session.user.name}</p>}

        {session ? <SignOut /> : <SignIn />}
      </div>
    </div>
  );
}

export default Header;
