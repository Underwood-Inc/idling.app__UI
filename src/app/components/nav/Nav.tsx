import React from "react";
import { GitHubLink } from "../github-link/GitHubLink";
import "./Nav.css";

const Nav = (): React.JSX.Element => {
  return (
    <div className="container">
      <ul className="nav">
        <li>
          <GitHubLink />
        </li>
      </ul>
    </div>
  );
};

export default Nav;
