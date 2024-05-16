import React from "react";
import { GitLabLink } from "../gitlab-link/GitLabLink";
import "./Nav.css";

const Nav = (): React.JSX.Element => {
  return (
    <div className="container">
      <ul className="nav">
        <li>
          <GitLabLink />
        </li>
      </ul>
    </div>
  );
};

export default Nav;
