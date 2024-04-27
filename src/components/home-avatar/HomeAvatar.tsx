import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import React from "react";
import { NavLink } from "react-router-dom";

const HomeAvatar = (): React.JSX.Element => {
  return (
    <NavLink to="/">
      <img
        src={createAvatar(adventurer, {
          seed: new Date().getTime().toString(),
        }).toDataUriSync()}
        className="Home-logo"
        alt="logo"
      />
    </NavLink>
  );
};

export default HomeAvatar;
