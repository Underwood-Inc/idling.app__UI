import React from "react";
import NavHomeAvatar from "../nav-home-avatar/NavHomeAvatar";
import "./Header.css";

const Header = (): React.JSX.Element => {
  return (
    <div className="header">
      <NavHomeAvatar />
    </div>
  );
};

export default Header;
