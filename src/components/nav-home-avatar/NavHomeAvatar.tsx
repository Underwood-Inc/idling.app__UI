import React from "react";
import { Link } from "react-router-dom";
import ClientComponent from "../client-component/ClientComponent";
import HomeAvatar from "../home-avatar/HomeAvatar";

const NavHomeAvatar = (): React.JSX.Element => {
  // const HomeAvatar = React.lazy(() => import("../home-avatar/HomeAvatar"));

  return (
    <div>
      <ClientComponent>
        <HomeAvatar />
      </ClientComponent>
      <Link to="/">
        <h2>Idling.app</h2>
      </Link>
    </div>
  );
};

export default NavHomeAvatar;
